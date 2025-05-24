"use server";

import { db } from "@/db";
import { arts } from "@/db/schema/ART";
import { organizations } from "@/db/schema/organization";
import { employees, employeeArt } from "@/db/schema/employee";
import { and, eq, asc, sql, inArray } from "drizzle-orm";
//import { createInsertSchema } from "drizzle-zod";
//import { z } from "zod";
import { alias } from "drizzle-orm/pg-core";
import { getActorIdFromToken } from "@/lib/okta";
import {
  CreateARTInputSchema,
  UpdateARTInputSchema,
  DeleteARTInputSchema,
  ARTOutput,
  // Assuming these types are defined in the new schema file
  CreateARTInput as CreateARTInputType,
  UpdateARTInput as UpdateARTInputType,
  DeleteARTInput as DeleteARTInputType,
} from "@/lib/schemas/art";
import { setArtOwner } from "./employee"; // Import setArtOwner
import { SetArtOwnersInput } from "@/lib/schemas/employee"; // Import SetArtOwnersInput


/**
 * Creates a new ART.
 * Uses CreateARTInputSchema for validation internally but takes CreateARTInputType.
 * @param data - The data for the new ART, conforming to CreateARTInputType.
 * @returns An object with success status, message, and data (the created ART) or error.
 */
export async function createART(data: CreateARTInputType) {
  const validatedData = CreateARTInputSchema.safeParse(data);
  if (!validatedData.success) {
    return {
      success: false,
      message: "Invalid input: " + validatedData.error.flatten().fieldErrors,
    };
  }

  const { accessToken, artName, organizationKey, ownerEmployeeKeys } = validatedData.data; // Destructure ownerEmployeeKeys
  const actorEmployeeKey = await getActorIdFromToken(accessToken);
  if (!actorEmployeeKey) {
    return { success: false, message: "Invalid access token or actor not found." };
  }

  try {
    const existingART = await db
      .select({ artKey: arts.artKey })
      .from(arts)
      .where(
        and(
          eq(arts.artName, artName),
          eq(arts.organizationKey, organizationKey)
        )
      )
      .limit(1);

    if (existingART.length > 0) {
      return {
        success: false,
        message: "An ART with this name already exists for the given organization.",
      };
    }

    const newART = await db
      .insert(arts)
      .values({
        artName,
        organizationKey,
        createdById: actorEmployeeKey,
        updatedById: actorEmployeeKey, // Set updatedById on creation
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    if (newART.length > 0) {
      const createdArtData = newART[0];
      // After successfully creating the ART, set its owners if provided
      if (ownerEmployeeKeys && ownerEmployeeKeys.length > 0) {
        const artOwnerData: SetArtOwnersInput = {
          artKey: createdArtData.artKey,
          ownerEmployeeKeys: ownerEmployeeKeys,
          accessToken: accessToken, 
        };
        const ownerResult = await setArtOwner(artOwnerData);
        if (!ownerResult.success) {
          // ART created, but owners failed.
          return {
            success: true, 
            message: `ART created successfully, but failed to set owners: ${ownerResult.message}`,
            data: createdArtData as ARTOutput,
          };
        }
      }
      return {
        success: true,
        message: "ART and owners created successfully.",
        data: createdArtData as ARTOutput,
      };
    } else {
      return { success: false, message: "Failed to create ART." };
    }
  } catch (error) {
    console.error("Error creating ART:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    if (errorMessage.toLowerCase().includes("unique constraint") && errorMessage.toLowerCase().includes("art_name_organization_id_unique")) {
        return { success: false, message: "An ART with this name already exists for the given organization."};
    }
    return {
      success: false,
      message: `Database operation failed: ${errorMessage}`,
    };
  }
}

/**
 * Updates an existing ART.
 * @param artKey - The key of the ART to update.
 * @param data - The data to update, conforming to UpdateARTInputType.
 * @returns An object with success status, message, and data (the updated ART) or error.
 */
export async function updateART(artKey: number, data: UpdateARTInputType) {
  const validatedData = UpdateARTInputSchema.safeParse(data);
  if (!validatedData.success) {
    return {
      success: false,
      message: "Invalid input: " + validatedData.error.flatten().fieldErrors,
    };
  }

  // Note: validatedData.data now includes organizationKey due to schema update
  const { accessToken, ownerEmployeeKeys, organizationKey: inputOrganizationKey, ...updatePayloadDataWithoutOwners } = validatedData.data;

  const hasDetailsToUpdate = Object.keys(updatePayloadDataWithoutOwners).length > 0;

  if (!hasDetailsToUpdate && ownerEmployeeKeys === undefined) {
    return { success: false, message: "No fields provided for update and no owner changes specified." };
  }

  const actorEmployeeKey = await getActorIdFromToken(accessToken);
  if (!actorEmployeeKey) {
    return { success: false, message: "Invalid access token or actor not found." };
  }

  try {
    const result = await db.transaction(async (tx) => {
      let updatedArtDataFromDb: ARTOutput | null = null;

      // First, verify the ART exists and belongs to the inputOrganizationKey
      const artToUpdate = await tx
        .select({ currentOrgKey: arts.organizationKey, artName: arts.artName })
        .from(arts)
        .where(eq(arts.artKey, artKey))
        .limit(1);

      if (artToUpdate.length === 0) {
        throw new Error("ART not found.");
      }
      if (artToUpdate[0].currentOrgKey !== inputOrganizationKey) {
        throw new Error("ART does not belong to the specified organization. Update denied.");
      }

      if (hasDetailsToUpdate) {
        const nameToCheck = updatePayloadDataWithoutOwners.artName ?? artToUpdate[0].artName;
        // ART's organizationKey cannot be changed via this update, so orgKeyToCheck is always inputOrganizationKey
        const orgKeyToCheck = inputOrganizationKey; 

        if (updatePayloadDataWithoutOwners.artName !== undefined) { // Only check if name is actually changing
            const potentialConflict = await tx
            .select({ artKey: arts.artKey })
            .from(arts)
            .where(
                and(
                eq(arts.artName, nameToCheck),
                eq(arts.organizationKey, orgKeyToCheck) //Scoped to the same organization
                )
            )
            .limit(1);
            if (potentialConflict.length > 0 && potentialConflict[0].artKey !== artKey) {
            throw new Error("An ART with this name already exists for the given organization.");
            }
        }
        
        const updatePayload: Partial<typeof arts.$inferInsert> = {
          ...updatePayloadDataWithoutOwners, // Contains only fields like artName
          updatedById: actorEmployeeKey,
          updatedAt: new Date(),
        };
        // Explicitly do not allow changing organizationKey via this path
        delete (updatePayload as Partial<typeof arts.$inferInsert> ).organizationKey;


        const updatedARTResult = await tx
          .update(arts)
          .set(updatePayload)
          .where(and(eq(arts.artKey, artKey), eq(arts.organizationKey, inputOrganizationKey))) // Ensure update is scoped
          .returning();

        if (updatedARTResult.length === 0) {
          // This should ideally not be reached if the initial check passed and artKey/orgKey are correct
          throw new Error("Failed to update ART details. ART may not exist or not belong to the organization.");
        }
        updatedArtDataFromDb = updatedARTResult[0] as ARTOutput;
      }

      if (ownerEmployeeKeys !== undefined) {
        const artOwnerData: SetArtOwnersInput = {
          artKey: artKey,
          ownerEmployeeKeys: ownerEmployeeKeys, // Can be empty array
          accessToken: accessToken,
        };
        // Assuming setArtOwner handles its own transaction or is safe to call sequentially.
        // For true atomicity of ART details + owner updates, setArtOwner would need to accept 'tx'.
        const ownerResult = await setArtOwner(artOwnerData);
        if (!ownerResult.success) {
          throw new Error(`Failed to update ART owners: ${ownerResult.message}`);
        }
      }
      
      // If only owners were updated, or if no details were updated but we need to return the ART data
      if (!updatedArtDataFromDb) {
        const currentArtForReturn = await tx.select().from(arts).where(eq(arts.artKey, artKey)).limit(1);
        if(currentArtForReturn.length === 0) {
            // This case should be rare if initial check passed, but good for robustness
            throw new Error("ART not found after owner update attempt.");
        }
        updatedArtDataFromDb = currentArtForReturn[0] as ARTOutput;
      }
      return updatedArtDataFromDb; // Return the ART data
    });

    return {
      success: true,
      message: "ART updated successfully.",
      data: result, // result is updatedArtDataFromDb from the transaction
    };

  } catch (error) {
    console.error("Error updating ART:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
     if (errorMessage.toLowerCase().includes("unique constraint") && errorMessage.toLowerCase().includes("art_name_organization_id_unique")) {
        return { success: false, message: "An ART with this name already exists for the given organization."};
    }
    if (errorMessage.startsWith("Failed to update ART owners:")) {
        return { success: false, message: errorMessage };
    }
    return {
      success: false,
      message: `Database operation failed: ${errorMessage}`,
    };
  }
}

/**
 * Deletes an ART.
 * @param data - Data containing artKey, organizationKey, and accessToken, conforming to DeleteARTInputType.
 * @returns An object with success status and message or error.
 */
export async function deleteART(data: DeleteARTInputType) {
  const validatedData = DeleteARTInputSchema.safeParse(data);
  if (!validatedData.success) {
    return {
      success: false,
      message: "Invalid input: " + validatedData.error.flatten().fieldErrors,
    };
  }
  const { artKey, organizationKey, accessToken } = validatedData.data; // Destructure organizationKey
  const actorEmployeeKey = await getActorIdFromToken(accessToken);
  if (!actorEmployeeKey) {
    return { success: false, message: "Invalid access token or actor not found." };
  }

  try {
    // Verify the ART exists and belongs to the specified organization before deleting
    const existingART = await db
      .select({ artKey: arts.artKey })
      .from(arts)
      .where(and(eq(arts.artKey, artKey), eq(arts.organizationKey, organizationKey)))
      .limit(1);

    if (existingART.length === 0) {
      return { success: false, message: "ART not found in the specified organization or does not exist." };
    }

    await db.transaction(async (tx) => {
        await tx.delete(employeeArt).where(eq(employeeArt.artKey, artKey));
        
        const deletedARTResult = await tx
            .delete(arts)
            .where(and(eq(arts.artKey, artKey), eq(arts.organizationKey, organizationKey))) // Scope delete
            .returning({ deletedKey: arts.artKey });

        if (deletedARTResult.length === 0) {
            // This should not happen if existingART check passed
            throw new Error("Failed to delete ART after clearing dependencies.");
        }
    });

    return { success: true, message: "ART and associated links deleted successfully." };

  } catch (error) {
    console.error("Error deleting ART:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    return {
      success: false,
      message: `Database operation failed: ${errorMessage}`,
    };
  }
}

/**
 * Retrieves all ARTs for a given organization, ordered by ART name.
 * Includes details like organization name, creator/updater names, and owners.
 * @param organizationKey - The key of the organization whose ARTs are to be fetched.
 * @returns An object with success status, message, and data (list of ARTs) or error.
 */
export async function getARTsByOrganization(organizationKey: number) {
  if (organizationKey === undefined || organizationKey === null) {
    return { success: false, message: "Organization key is required." };
  }
  try {
    const creator = alias(employees, "creator");
    const updater = alias(employees, "updater");
    const owner = alias(employees, "owner");

    // Step 1: Fetch ARTs with their organization, creator, and updater details
    const artsData = await db
      .select({
        artKey: arts.artKey,
        artName: arts.artName,
        organizationKey: arts.organizationKey,
        organizationName: organizations.organizationName, // Joined field
        createdAt: arts.createdAt,
        updatedAt: arts.updatedAt,
        createdById: arts.createdById,
        updatedById: arts.updatedById,
        createdByName: sql<string>`${creator.firstName} || ' ' || ${creator.lastName}`,
        createdByEmail: creator.email, // Optional: if needed
        updatedByName: sql<string>`${updater.firstName} || ' ' || ${updater.lastName}`,
        updatedByEmail: updater.email, // Optional: if needed
      })
      .from(arts)
      .innerJoin(organizations, eq(arts.organizationKey, organizations.organizationKey))
      .leftJoin(creator, eq(arts.createdById, creator.employeeKey))
      .leftJoin(updater, eq(arts.updatedById, updater.employeeKey))
      .where(eq(arts.organizationKey, organizationKey))
      .orderBy(asc(arts.artName));

    if (artsData.length === 0) {
      return {
        success: true,
        message: "No ARTs found for this organization.",
        data: [],
      };
    }

    // Step 2: Fetch all owners for these ARTs
    const artKeys = artsData.map(art => art.artKey);
    const ownersData = await db
      .select({
        artKey: employeeArt.artKey,
        ownerEmployeeKey: employeeArt.employeeKey,
        ownerName: sql<string>`${owner.firstName} || ' ' || ${owner.lastName}`,
        ownerEmail: owner.email,
        ownerAvatar: owner.profilePhoto,
      })
      .from(employeeArt)
      .innerJoin(owner, eq(employeeArt.employeeKey, owner.employeeKey))
      .where(and(
        eq(employeeArt.artOwner, true),
        inArray(employeeArt.artKey, artKeys)
      ));

    // Step 3: Map owners to their respective ARTs
    const artsWithDetails = artsData.map(art => {
      const artOwners = ownersData
        .filter(own => own.artKey === art.artKey)
        .map(own => ({
          ownerEmployeeKey: own.ownerEmployeeKey,
          ownerName: own.ownerName,
          ownerEmail: own.ownerEmail,
          ownerAvatar: own.ownerAvatar,
        }));
      return {
        ...art,
        owners: artOwners,
      };
    });

    return {
      success: true,
      message: "ARTs retrieved successfully.",
      data: artsWithDetails as ARTOutput[],
    };
  } catch (error) {
    console.error("Error retrieving ARTs by organization:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    return {
      success: false,
      message: `Database operation failed: ${errorMessage}`,
    };
  }
}

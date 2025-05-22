"use server";

import { db } from "@/db";
import { arts } from "@/db/schema/ART";
import { organizations } from "@/db/schema/organization";
import { employees, employeeArt } from "@/db/schema/employee";
import { and, eq, asc, sql, inArray } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { alias } from "drizzle-orm/pg-core";
import { getActorIdFromToken } from "@/lib/okta";
import {
  CreateARTInputSchema,
  UpdateARTInputSchema,
  DeleteARTInputSchema,
  ARTOutput,
  // Assuming these types are defined in the new schema file
  CreateARTInput as CreateARTInputType, // Renaming to avoid conflict if needed
  UpdateARTInput as UpdateARTInputType,
  DeleteARTInput as DeleteARTInputType,
} from "@/lib/schemas/art";


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

  const { accessToken, artName, organizationKey } = validatedData.data;
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
      return {
        success: true,
        message: "ART created successfully.",
        data: newART[0] as ARTOutput, // Cast to ARTOutput
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
  
  const { accessToken, ...updatePayloadData } = validatedData.data;

  if (Object.keys(updatePayloadData).length === 0) {
    return { success: false, message: "No fields provided for update." };
  }

  const actorEmployeeKey = await getActorIdFromToken(accessToken);
  if (!actorEmployeeKey) {
    return { success: false, message: "Invalid access token or actor not found." };
  }

  try {
    const currentART = await db
      .select({ artName: arts.artName, organizationKey: arts.organizationKey})
      .from(arts)
      .where(eq(arts.artKey, artKey))
      .limit(1);

    if (currentART.length === 0) {
      return { success: false, message: "ART not found." };
    }

    const nameToCheck = updatePayloadData.artName ?? currentART[0].artName;
    const orgKeyToCheck = updatePayloadData.organizationKey ?? currentART[0].organizationKey;

    if (updatePayloadData.artName !== undefined || updatePayloadData.organizationKey !== undefined) {
        const conflictingART = await db
            .select({ artKey: arts.artKey })
            .from(arts)
            .where(
            and(
                eq(arts.artName, nameToCheck),
                eq(arts.organizationKey, orgKeyToCheck),
                eq(arts.artKey, artKey) // This should be ne(arts.artKey, artKey)
            )
            )
            .limit(1);
        // Corrected check for conflict:
         const potentialConflict = await db
          .select({ artKey: arts.artKey })
          .from(arts)
          .where(
            and(
              eq(arts.artName, nameToCheck),
              eq(arts.organizationKey, orgKeyToCheck)
            )
          )
          .limit(1);
        if (potentialConflict.length > 0 && potentialConflict[0].artKey !== artKey) {
            return { success: false, message: "An ART with this name already exists for the given organization."};
        }
    }
    
    const updatePayload: Partial<typeof arts.$inferInsert> = {
      ...updatePayloadData,
      updatedById: actorEmployeeKey,
      updatedAt: new Date(),
    };

    const updatedART = await db
      .update(arts)
      .set(updatePayload)
      .where(eq(arts.artKey, artKey))
      .returning();

    if (updatedART.length > 0) {
      return {
        success: true,
        message: "ART updated successfully.",
        data: updatedART[0] as ARTOutput, // Cast to ARTOutput
      };
    } else {
      return { success: false, message: "Failed to update ART or ART not found." };
    }
  } catch (error) {
    console.error("Error updating ART:", error);
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
 * Deletes an ART.
 * @param data - Data containing artKey and accessToken, conforming to DeleteARTInputType.
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
  const { artKey, accessToken } = validatedData.data;
  const actorEmployeeKey = await getActorIdFromToken(accessToken); // Validate actor
  if (!actorEmployeeKey) {
    return { success: false, message: "Invalid access token or actor not found." };
  }

  try {
    const existingART = await db
      .select({ artKey: arts.artKey })
      .from(arts)
      .where(eq(arts.artKey, artKey))
      .limit(1);

    if (existingART.length === 0) {
      return { success: false, message: "ART not found." };
    }

    // Add transaction if there are related entities to delete from employeeArt first
    await db.transaction(async (tx) => {
        // Delete links from employeeArt first if necessary (cascade might handle this)
        await tx.delete(employeeArt).where(eq(employeeArt.artKey, artKey));
        
        const deletedARTResult = await tx
            .delete(arts)
            .where(eq(arts.artKey, artKey))
            .returning({ deletedKey: arts.artKey });

        if (deletedARTResult.length === 0) {
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

"use server";

import { db } from "@/db";
import { organizations } from "@/db/schema/organization";
import { employees, employeeOrg } from "@/db/schema/employee"; // Import employee schemas
import { eq, asc, and, sql, inArray } from "drizzle-orm"; // Added inArray
import { alias } from "drizzle-orm/pg-core";
import { getActorIdFromToken } from "@/lib/okta";
import {
  CreateOrganizationInput,
  UpdateOrganizationInput,
  DeleteOrganizationInput,
  OrganizationOutput,
} from "@/lib/schemas/organization"; // Import schemas and types

/**
 * Creates a new organization.
 * @param data - The data for the new organization, including organizationName and accessToken.
 * @returns An object with success status, message, and data (the created organization) or error.
 */
export async function createOrganization(data: CreateOrganizationInput) {
  const actorEmployeeKey = await getActorIdFromToken(data.accessToken);
  if (!actorEmployeeKey) {
    return { success: false, message: "Invalid access token or actor not found." };
  }

  try {
    const existingOrg = await db
      .select({ organizationKey: organizations.organizationKey })
      .from(organizations)
      .where(eq(organizations.organizationName, data.organizationName))
      .limit(1);

    if (existingOrg.length > 0) {
      return {
        success: false,
        message: "An organization with this name already exists.",
      };
    }

    const newOrg = await db
      .insert(organizations)
      .values({
        organizationName: data.organizationName,
        createdById: actorEmployeeKey,
        updatedById: actorEmployeeKey,
        createdAt: new Date(), 
        updatedAt: new Date(),
      })
      .returning();

    if (newOrg.length > 0) {
      return {
        success: true,
        message: "Organization created successfully.",
        data: newOrg[0] as OrganizationOutput, // Updated return type
      };
    } else {
      return { success: false, message: "Failed to create organization." };
    }
  } catch (error) {
    console.error("Error creating organization:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred.";
    // Check for unique constraint violation for organizationName
    if (
      errorMessage.toLowerCase().includes("unique constraint") &&
      errorMessage.toLowerCase().includes("organization_name")
    ) {
      return {
        success: false,
        message: "An organization with this name already exists.",
      };
    }
    return {
      success: false,
      message: `Database operation failed: ${errorMessage}`,
    };
  }
}

/**
 * Updates an existing organization.
 * @param organizationKey - The key of the organization to update.
 * @param data - The data to update, including accessToken and optional organizationName.
 * @returns An object with success status, message, and data (the updated organization) or error.
 */
export async function updateOrganization(
  organizationKey: number,
  data: UpdateOrganizationInput
) {
  const { accessToken, ...updatePayloadData } = data;

  if (Object.keys(updatePayloadData).length === 0) {
    return { success: false, message: "No fields provided for update." };
  }

  const actorEmployeeKey = await getActorIdFromToken(accessToken);
  if (!actorEmployeeKey) {
    return { success: false, message: "Invalid access token or actor not found." };
  }

  try {
    const existingOrg = await db
      .select({
        organizationKey: organizations.organizationKey,
        currentName: organizations.organizationName,
      })
      .from(organizations)
      .where(eq(organizations.organizationKey, organizationKey))
      .limit(1);

    if (existingOrg.length === 0) {
      return { success: false, message: "Organization not found." };
    }

    if (
      data.organizationName &&
      existingOrg[0].currentName !== undefined &&
      data.organizationName !== existingOrg[0].currentName
    ) {
      const conflictingOrg = await db
        .select({ organizationKey: organizations.organizationKey })
        .from(organizations)
        .where(eq(organizations.organizationName, data.organizationName))
        .limit(1);
      if (
        conflictingOrg.length > 0 &&
        conflictingOrg[0].organizationKey !== organizationKey
      ) {
        return {
          success: false,
          message: "An organization with this name already exists.",
        };
      }
    }

    const updatePayload: Partial<typeof organizations.$inferInsert> = {
      ...updatePayloadData,
      updatedById: actorEmployeeKey,
      updatedAt: new Date(),
    };

    const updatedOrg = await db
      .update(organizations)
      .set(updatePayload)
      .where(eq(organizations.organizationKey, organizationKey))
      .returning();

    if (updatedOrg.length > 0) {
      return {
        success: true,
        message: "Organization updated successfully.",
        data: updatedOrg[0] as OrganizationOutput, // Updated return type
      };
    } else {
      return {
        success: false,
        message: "Failed to update organization or organization not found.",
      };
    }
  } catch (error) {
    console.error("Error updating organization:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred.";
    if (
      errorMessage.toLowerCase().includes("unique constraint") &&
      errorMessage.toLowerCase().includes("organization_name")
    ) {
      return {
        success: false,
        message: "An organization with this name already exists.",
      };
    }
    return {
      success: false,
      message: `Database operation failed: ${errorMessage}`,
    };
  }
}

/**
 * Deletes an organization.
 * @param organizationKey - The key of the organization to delete.
 * @param accessToken - The access token of the user performing the action.
 * @returns An object with success status and message or error.
 */

// DeleteOrganizationInput type is imported from schemas

export async function deleteOrganization(data: DeleteOrganizationInput) {
  const { organizationKey, accessToken } = data;
  const actorEmployeeKey = await getActorIdFromToken(accessToken);

  if (!actorEmployeeKey) {
    // Potentially log: console.warn(`Unauthorized delete attempt for org ${organizationKey} by unverified user.`);
    return { success: false, message: "Invalid access token or actor not found." };
  }
  // Log actor performing delete for audit purposes if needed:
  // console.log(`Organization ${organizationKey} deletion initiated by actor ID: ${actorEmployeeKey}`);

  try {
    // Check if organization exists
    const existingOrg = await db
      .select({ organizationKey: organizations.organizationKey })
      .from(organizations)
      .where(eq(organizations.organizationKey, organizationKey))
      .limit(1);

    if (existingOrg.length === 0) {
      return { success: false, message: "Organization not found." };
    }

    // Begin a transaction to ensure atomicity
    await db.transaction(async (tx) => {
      // Step 1: Delete associated records from employee_org
      await tx
        .delete(employeeOrg)
        .where(eq(employeeOrg.organizationKey, organizationKey));

      // Step 2: Delete associated records from other tables if necessary (e.g., arts if they have an org link with "no action")
      // For now, only employee_org is mentioned in the error.

      // Step 3: Delete the organization itself
      const deletedOrgResult = await tx
        .delete(organizations)
        .where(eq(organizations.organizationKey, organizationKey))
        .returning({ deletedKey: organizations.organizationKey });
      
      if (deletedOrgResult.length === 0) {
        // This should not happen if existingOrg check passed, but as a safeguard
        throw new Error("Failed to delete organization after clearing dependencies.");
      }
    });

    return { success: true, message: "Organization and associated links deleted successfully." };

  } catch (error) {
    console.error("Error deleting organization:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred.";
    return {
      success: false,
      message: `Database operation failed: ${errorMessage}`,
    };
  }
}

/**
 * Retrieves an organization by its key.
 * @param organizationKey - The key of the organization to retrieve.
 * @returns An object with success status, message, and data (the organization) or error.
 */
export async function getOrganizationByKey(organizationKey: number) {
  try {
    const organization = await db
      .select()
      .from(organizations)
      .where(eq(organizations.organizationKey, organizationKey))
      .limit(1);

    if (organization.length > 0) {
      return {
        success: true,
        message: "Organization retrieved successfully.",
        data: organization[0] as OrganizationOutput,
      };
    } else {
      return { success: false, message: "Organization not found." };
    }
  } catch (error) {
    console.error("Error retrieving organization by key:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred.";
    return {
      success: false,
      message: `Database operation failed: ${errorMessage}`,
    };
  }
}

/**
 * Retrieves all organizations, ordered by name.
 * @returns An object with success status, message, and data (list of organizations) or error.
 */
export async function getOrganizations() {
  try {
    const creator = alias(employees, "creator");
    const updater = alias(employees, "updater");
    const owner = alias(employees, "owner"); // Alias for employee table to represent owners

    // Step 1: Fetch organizations with their creator and updater
    const orgsData = await db
      .select({
        organizationKey: organizations.organizationKey,
        organizationName: organizations.organizationName,
        createdAt: organizations.createdAt,
        updatedAt: organizations.updatedAt,
        createdById: organizations.createdById,
        updatedById: organizations.updatedById,
        createdByName: sql<string>`${creator.firstName} || ' ' || ${creator.lastName}`,
        createdByEmail: creator.email,
        updatedByName: sql<string>`${updater.firstName} || ' ' || ${updater.lastName}`,
        updatedByEmail: updater.email,
      })
      .from(organizations)
      .leftJoin(creator, eq(organizations.createdById, creator.employeeKey))
      .leftJoin(updater, eq(organizations.updatedById, updater.employeeKey))
      .orderBy(asc(organizations.organizationName));

    if (orgsData.length === 0) {
      return {
        success: true,
        message: "No organizations found.",
        data: [],
      };
    }

    // Step 2: Fetch all owners for these organizations
    const organizationKeys = orgsData.map(org => org.organizationKey);
    const ownersData = await db
      .select({
        organizationKey: employeeOrg.organizationKey,
        ownerName: sql<string>`${owner.firstName} || ' ' || ${owner.lastName}`,
        ownerEmail: owner.email,
        ownerAvatar: owner.profilePhoto,
        ownerEmployeeKey: owner.employeeKey,
      })
      .from(employeeOrg)
      .innerJoin(owner, eq(employeeOrg.employeeKey, owner.employeeKey))
      .where(and(
        eq(employeeOrg.orgOwner, true),
        inArray(employeeOrg.organizationKey, organizationKeys) // Use inArray for correct SQL list
      ));

    // Step 3: Map owners to their respective organizations
    const organizationsWithOwners = orgsData.map(org => {
      const orgOwners = ownersData
        .filter(own => own.organizationKey === org.organizationKey)
        .map(own => ({
          ownerName: own.ownerName,
          ownerEmail: own.ownerEmail,
          ownerAvatar: own.ownerAvatar,
          ownerEmployeeKey: own.ownerEmployeeKey,
        }));
      return {
        ...org,
        owners: orgOwners,
      };
    });

    return {
      success: true,
      message: "Organizations retrieved successfully.",
      data: organizationsWithOwners as OrganizationOutput[],
    };
  } catch (error) {
    console.error("Error retrieving organizations:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred.";
    return {
      success: false,
      message: `Database operation failed: ${errorMessage}`,
    };
  }
}

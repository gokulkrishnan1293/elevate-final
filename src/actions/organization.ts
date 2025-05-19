"use server";

import { db } from "@/db";
import { organizations } from "@/db/schema/organization";
import { eq, asc } from "drizzle-orm"; // Added asc for ordering
import { createInsertSchema, createSelectSchema } from "drizzle-zod"; // Added createSelectSchema
import { z } from "zod";

// Schema for inserting a new organization
const insertOrganizationSchema = createInsertSchema(organizations, {
  organizationKey: (fieldSchema) => fieldSchema.optional(),
  createdAt: (fieldSchema) => fieldSchema.optional(),
  updatedAt: (fieldSchema) => fieldSchema.optional(),
});
export type CreateOrganizationInput = z.infer<typeof insertOrganizationSchema>;

// Schema for selecting an Organization (can be used for return types)
const selectOrganizationSchema = createSelectSchema(organizations);
export type OrganizationOutput = z.infer<typeof selectOrganizationSchema>;

// Schema for updating an existing organization (all fields optional)
const updateOrganizationSchema = insertOrganizationSchema.partial();
export type UpdateOrganizationInput = z.infer<typeof updateOrganizationSchema>;

/**
 * Creates a new organization.
 * @param data - The data for the new organization.
 *               Requires 'organizationName'. 'createdById' is optional.
 * @returns An object with success status, message, and data (the created organization) or error.
 */
export async function createOrganization(data: CreateOrganizationInput) {
  if (!data.organizationName) {
    return { success: false, message: "Organization name is required." };
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
        createdById: data.createdById,
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
 * @param data - The data to update. Can include 'organizationName' and/or 'updatedById'.
 * @returns An object with success status, message, and data (the updated organization) or error.
 */
export async function updateOrganization(
  organizationKey: number,
  data: UpdateOrganizationInput
) {
  if (Object.keys(data).length === 0) {
    return { success: false, message: "No data provided for update." };
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
      ...data,
    };
    updatePayload.updatedAt = new Date();

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
 * @returns An object with success status and message or error.
 */
export async function deleteOrganization(organizationKey: number) {
  try {
    const existingOrg = await db
      .select({ organizationKey: organizations.organizationKey })
      .from(organizations)
      .where(eq(organizations.organizationKey, organizationKey))
      .limit(1);

    if (existingOrg.length === 0) {
      return { success: false, message: "Organization not found." };
    }

    const deletedOrg = await db
      .delete(organizations)
      .where(eq(organizations.organizationKey, organizationKey))
      .returning({ deletedKey: organizations.organizationKey });

    if (deletedOrg.length > 0 && deletedOrg[0].deletedKey === organizationKey) {
      return { success: true, message: "Organization deleted successfully." };
    } else {
      return {
        success: false,
        message: "Failed to delete organization or organization not found.",
      };
    }
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
    const result = await db
      .select()
      .from(organizations)
      .orderBy(asc(organizations.organizationName));

    return {
      success: true,
      message: "Organizations retrieved successfully.",
      data: result as OrganizationOutput[],
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

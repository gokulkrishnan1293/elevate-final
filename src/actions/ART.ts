"use server";

import { db } from "@/db";
import { arts } from "@/db/schema/ART"; // Adjusted import
import { and, eq } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Schema for inserting a new ART
const insertARTSchema = createInsertSchema(arts, {
  artKey: (fieldSchema) => fieldSchema.optional(),
  createdAt: (fieldSchema) => fieldSchema.optional(),
  updatedAt: (fieldSchema) => fieldSchema.optional(),
  // artName and organizationKey are required by DB schema (notNull)
});
export type CreateARTInput = z.infer<typeof insertARTSchema>;

// Schema for updating an existing ART (all fields optional for partial update)
const updateARTSchema = insertARTSchema.partial();
export type UpdateARTInput = z.infer<typeof updateARTSchema>;

/**
 * Creates a new ART.
 * @param data - The data for the new ART.
 *               Requires 'artName' and 'organizationKey'. 'createdById' is optional.
 * @returns An object with success status, message, and data (the created ART) or error.
 */
export async function createART(data: CreateARTInput) {
  if (!data.artName) {
    return { success: false, message: "ART name is required." };
  }
  if (data.organizationKey === undefined || data.organizationKey === null) {
    // organizationKey is number, check for undefined/null
    return { success: false, message: "Organization key is required." };
  }

  try {
    // Ensure artName + organizationKey combination is unique
    const existingART = await db
      .select({ artKey: arts.artKey })
      .from(arts)
      .where(
        and(
          eq(arts.artName, data.artName),
          eq(arts.organizationKey, data.organizationKey)
        )
      )
      .limit(1);

    if (existingART.length > 0) {
      return {
        success: false,
        message:
          "An ART with this name already exists for the given organization.",
      };
    }

    const newART = await db
      .insert(arts)
      .values({
        artName: data.artName,
        organizationKey: data.organizationKey,
        createdById: data.createdById,
      })
      .returning();

    if (newART.length > 0) {
      return {
        success: true,
        message: "ART created successfully.",
        data: newART[0],
      };
    } else {
      return { success: false, message: "Failed to create ART." };
    }
  } catch (error) {
    console.error("Error creating ART:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred.";
    return {
      success: false,
      message: `Database operation failed: ${errorMessage}`,
    };
  }
}

/**
 * Updates an existing ART.
 * @param artKey - The key of the ART to update.
 * @param data - The data to update. Can include 'artName', 'organizationKey', 'updatedById'.
 * @returns An object with success status, message, and data (the updated ART) or error.
 */
export async function updateART(artKey: number, data: UpdateARTInput) {
  if (Object.keys(data).length === 0) {
    return { success: false, message: "No data provided for update." };
  }

  try {
    const currentART = await db
      .select()
      .from(arts)
      .where(eq(arts.artKey, artKey))
      .limit(1);

    if (currentART.length === 0) {
      return { success: false, message: "ART not found." };
    }

    // Determine the name and organizationKey to check for uniqueness
    const nameToCheck = data.artName ?? currentART[0].artName;
    const orgKeyToCheck = data.organizationKey ?? currentART[0].organizationKey;

    // If artName or organizationKey is being changed, or if they are present in data (even if same),
    // check for uniqueness of the combination.
    if (data.artName !== undefined || data.organizationKey !== undefined) {
      if (
        nameToCheck &&
        orgKeyToCheck !== null &&
        orgKeyToCheck !== undefined
      ) {
        // Ensure values are valid for query
        const conflictingART = await db
          .select({ artKey: arts.artKey })
          .from(arts)
          .where(
            and(
              eq(arts.artName, nameToCheck),
              eq(arts.organizationKey, orgKeyToCheck),
              eq(arts.artKey, arts.artKey) // This is a placeholder, should be ne(arts.artKey, artKey)
            )
          )
          .limit(1);

        // The above query is not quite right for "not self". Drizzle's `ne` is needed.
        // Let's re-fetch potential conflict and check its key.
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

        if (
          potentialConflict.length > 0 &&
          potentialConflict[0].artKey !== artKey
        ) {
          return {
            success: false,
            message:
              "An ART with this name already exists for the given organization.",
          };
        }
      }
    }

    const updatePayload: Partial<typeof arts.$inferInsert> = { ...data };
    updatePayload.updatedAt = new Date(); // Explicitly set updatedAt

    const updatedART = await db
      .update(arts)
      .set(updatePayload)
      .where(eq(arts.artKey, artKey))
      .returning();

    if (updatedART.length > 0) {
      return {
        success: true,
        message: "ART updated successfully.",
        data: updatedART[0],
      };
    } else {
      return {
        success: false,
        message: "Failed to update ART or ART not found.",
      };
    }
  } catch (error) {
    console.error("Error updating ART:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred.";

    return {
      success: false,
      message: `Database operation failed: ${errorMessage}`,
    };
  }
}

/**
 * Deletes an ART.
 * @param artKey - The key of the ART to delete.
 * @returns An object with success status and message or error.
 */
export async function deleteART(artKey: number) {
  try {
    const existingART = await db
      .select({ artKey: arts.artKey })
      .from(arts)
      .where(eq(arts.artKey, artKey))
      .limit(1);

    if (existingART.length === 0) {
      return { success: false, message: "ART not found." };
    }

    const deletedART = await db
      .delete(arts)
      .where(eq(arts.artKey, artKey))
      .returning({ deletedKey: arts.artKey });

    if (deletedART.length > 0 && deletedART[0].deletedKey === artKey) {
      return { success: true, message: "ART deleted successfully." };
    } else {
      return {
        success: false,
        message: "Failed to delete ART or ART not found.",
      };
    }
  } catch (error) {
    console.error("Error deleting ART:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred.";
    return {
      success: false,
      message: `Database operation failed: ${errorMessage}`,
    };
  }
}

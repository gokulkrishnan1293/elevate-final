"use server";

import { db } from "@/db";
import { teams } from "@/db/schema/team";
import { and, eq, type SQL } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// Schema for inserting a new Team
const insertTeamSchema = createInsertSchema(teams, {
  teamKey: (fieldSchema) => fieldSchema.optional(),
  createdAt: (fieldSchema) => fieldSchema.optional(),
  updatedAt: (fieldSchema) => fieldSchema.optional(),
  // teamName, artKey, organizationKey are required by DB schema (notNull)
});
export type CreateTeamInput = z.infer<typeof insertTeamSchema>;

// Schema for selecting a Team (can be used for return types)
const selectTeamSchema = createSelectSchema(teams);
export type TeamOutput = z.infer<typeof selectTeamSchema>;

// Schema for updating an existing Team (all fields optional for partial update)
const updateTeamSchema = insertTeamSchema.partial();
export type UpdateTeamInput = z.infer<typeof updateTeamSchema>;

/**
 * Creates a new Team.
 * @param data - The data for the new Team.
 *               Requires 'teamName', 'artKey', and 'organizationKey'. 'createdById' is optional.
 * @returns An object with success status, message, and data (the created Team) or error.
 */
export async function createTeam(data: CreateTeamInput) {
  if (!data.teamName) {
    return { success: false, message: "Team name is required." };
  }
  if (data.artKey === undefined || data.artKey === null) {
    return { success: false, message: "ART key is required." };
  }
  if (data.organizationKey === undefined || data.organizationKey === null) {
    return { success: false, message: "Organization key is required." };
  }

  try {
    // Ensure teamName + artKey combination is unique (as per DB constraint)
    const existingTeam = await db
      .select({ teamKey: teams.teamKey })
      .from(teams)
      .where(
        and(
          eq(teams.teamName, data.teamName),
          eq(teams.artKey, data.artKey)
          // Note: organizationKey is not part of this specific unique constraint in the schema
        )
      )
      .limit(1);

    if (existingTeam.length > 0) {
      return {
        success: false,
        message: "A Team with this name already exists for the given ART.",
      };
    }

    const newTeam = await db
      .insert(teams)
      .values({
        teamName: data.teamName,
        artKey: data.artKey,
        organizationKey: data.organizationKey, // Added organizationKey
        createdById: data.createdById,
      })
      .returning();

    if (newTeam.length > 0) {
      return {
        success: true,
        message: "Team created successfully.",
        data: newTeam[0] as TeamOutput,
      };
    } else {
      return { success: false, message: "Failed to create Team." };
    }
  } catch (error) {
    console.error("Error creating Team:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred.";
    if (errorMessage.includes("team_name_art_id_unique")) {
      return {
        success: false,
        message: "A Team with this name already exists for the given ART.",
      };
    }
    // Consider checking for foreign key constraint violations if an invalid artKey or organizationKey is provided
    return {
      success: false,
      message: `Database operation failed: ${errorMessage}`,
    };
  }
}

/**
 * Updates an existing Team.
 * @param teamKey - The key of the Team to update.
 * @param data - The data to update. Can include 'teamName', 'artKey', 'organizationKey', 'updatedById'.
 * @returns An object with success status, message, and data (the updated Team) or error.
 */
export async function updateTeam(teamKey: number, data: UpdateTeamInput) {
  if (Object.keys(data).length === 0) {
    return { success: false, message: "No data provided for update." };
  }

  try {
    const currentTeam = await db
      .select()
      .from(teams)
      .where(eq(teams.teamKey, teamKey))
      .limit(1);

    if (currentTeam.length === 0) {
      return { success: false, message: "Team not found." };
    }

    // Check for uniqueness if teamName or artKey are being changed
    const nameToCheck = data.teamName ?? currentTeam[0].teamName;
    // artKey from DB is number, data.artKey from input could be number | undefined
    const artKeyToCheck = data.artKey ?? currentTeam[0].artKey;

    if (data.teamName !== undefined || data.artKey !== undefined) {
      // Ensure artKeyToCheck is not null/undefined before using in eq
      if (
        nameToCheck &&
        artKeyToCheck !== null &&
        artKeyToCheck !== undefined
      ) {
        const potentialConflict = await db
          .select({ teamKey: teams.teamKey })
          .from(teams)
          .where(
            and(
              eq(teams.teamName, nameToCheck),
              eq(teams.artKey, artKeyToCheck)
              // organizationKey is not part of this unique constraint
            )
          )
          .limit(1);

        if (
          potentialConflict.length > 0 &&
          potentialConflict[0].teamKey !== teamKey
        ) {
          return {
            success: false,
            message: "A Team with this name already exists for the given ART.",
          };
        }
      }
    }

    const updatePayload: Partial<typeof teams.$inferInsert> = { ...data };
    // organizationKey can be updated if present in data
    if (data.organizationKey !== undefined) {
      updatePayload.organizationKey = data.organizationKey;
    }
    updatePayload.updatedAt = new Date();

    const updatedTeam = await db
      .update(teams)
      .set(updatePayload)
      .where(eq(teams.teamKey, teamKey))
      .returning();

    if (updatedTeam.length > 0) {
      return {
        success: true,
        message: "Team updated successfully.",
        data: updatedTeam[0] as TeamOutput,
      };
    } else {
      return {
        success: false,
        message: "Failed to update Team or Team not found.",
      };
    }
  } catch (error) {
    console.error("Error updating Team:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred.";
    if (errorMessage.includes("team_name_art_id_unique")) {
      return {
        success: false,
        message: "A Team with this name already exists for the given ART.",
      };
    }
    return {
      success: false,
      message: `Database operation failed: ${errorMessage}`,
    };
  }
}

/**
 * Deletes a Team.
 * @param teamKey - The key of the Team to delete.
 * @returns An object with success status and message or error.
 */
export async function deleteTeam(teamKey: number) {
  try {
    const existingTeam = await db
      .select({ teamKey: teams.teamKey })
      .from(teams)
      .where(eq(teams.teamKey, teamKey))
      .limit(1);

    if (existingTeam.length === 0) {
      return { success: false, message: "Team not found." };
    }

    const deletedTeam = await db
      .delete(teams)
      .where(eq(teams.teamKey, teamKey))
      .returning({ deletedKey: teams.teamKey });

    if (deletedTeam.length > 0 && deletedTeam[0].deletedKey === teamKey) {
      return { success: true, message: "Team deleted successfully." };
    } else {
      return {
        success: false,
        message: "Failed to delete Team or Team not found.",
      };
    }
  } catch (error) {
    console.error("Error deleting Team:", error);
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
 * @param teamKey - The key of the organization to retrieve.
 * @returns An object with success status, message, and data (the organization) or error.
 */
export async function getTeamByKey(teamKey: number) {
  try {
    const team = await db
      .select()
      .from(teams)
      .where(eq(teams.teamKey, teamKey))
      .limit(1);

    if (team.length > 0) {
      return {
        success: true,
        message: "Organization retrieved successfully.",
        data: team[0] as TeamOutput,
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
 * Retrieves teams based on optional filters.
 * @param filters - Optional filters for organizationKey and/or artKey.
 * @returns An object with success status, message, and data (list of teams) or error.
 */
export async function getTeams(filters: {
  organizationKey?: number;
  artKey?: number;
}) {
  try {
    const conditions: SQL[] = [];
    if (filters.organizationKey !== undefined) {
      conditions.push(eq(teams.organizationKey, filters.organizationKey));
    }
    if (filters.artKey !== undefined) {
      conditions.push(eq(teams.artKey, filters.artKey));
    }

    const result = await db
      .select()
      .from(teams)
      .where(and(...conditions)) // Use spread operator for conditions array
      .orderBy(teams.teamName); // Optional: order by name

    return {
      success: true,
      message: "Teams retrieved successfully.",
      data: result as TeamOutput[],
    };
  } catch (error) {
    console.error("Error retrieving teams:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred.";
    return {
      success: false,
      message: `Database operation failed: ${errorMessage}`,
    };
  }
}

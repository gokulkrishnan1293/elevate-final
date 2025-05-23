"use server";

import { db } from "@/db";
import { teams } from "@/db/schema/team";
import { and, eq, type SQL } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

import { getActorIdFromToken } from "@/lib/okta"; // Import for actor tracking

// Schema for inserting a new Team
export const CreateTeamInputSchema = createInsertSchema(teams, {
  teamKey: (fieldSchema) => fieldSchema.optional(),
  createdAt: (fieldSchema) => fieldSchema.optional(),
  updatedAt: (fieldSchema) => fieldSchema.optional(),
  createdById: (fieldSchema) => fieldSchema.optional(), // Will be set by actor
  updatedById: (fieldSchema) => fieldSchema.optional(), // Will be set by actor
  // teamName, artKey, organizationKey are required
}).omit({
  createdById: true, // To be set from accessToken
  updatedById: true, // To be set from accessToken
}).extend({
  accessToken: z.string(),
});
export type CreateTeamInput = z.infer<typeof CreateTeamInputSchema>;

// Schema for selecting a Team (can be used for return types)
const selectTeamSchema = createSelectSchema(teams);
export type TeamOutput = z.infer<typeof selectTeamSchema>; // Potentially extend this with joined data like ART name, Org name

// Schema for updating an existing Team
export const UpdateTeamInputSchema = createInsertSchema(teams, {
  // All fields that can be updated are optional by default with .partial()
  // but we define them here if we want specific Zod refinements not covered by Drizzle schema
}).partial().omit({ // Omit fields that shouldn't be directly updatable or are auto-managed
  teamKey: true,
  createdAt: true,
  createdById: true,
  // organizationKey might be updatable if a team can move orgs, but typically not.
  // For now, assume organizationKey is fixed once created or handled very carefully.
  // If it's fixed, it should be omitted here. If updatable, ensure logic handles it.
}).extend({
  accessToken: z.string(),
});
export type UpdateTeamInput = z.infer<typeof UpdateTeamInputSchema>;

// Schema for deleting a Team
export const DeleteTeamInputSchema = z.object({
  teamKey: z.number(),
  organizationKey: z.number(), // To ensure deletion is scoped to the correct organization
  accessToken: z.string(),
});
export type DeleteTeamInput = z.infer<typeof DeleteTeamInputSchema>;


/**
 * Creates a new Team.
 * @param data - The data for the new Team, including accessToken.
 * @returns An object with success status, message, and data (the created Team) or error.
 */
export async function createTeam(data: CreateTeamInput) {
  const validatedData = CreateTeamInputSchema.safeParse(data);
  if (!validatedData.success) {
    return { success: false, message: "Invalid input: " + validatedData.error.flatten().fieldErrors };
  }

  const { accessToken, teamName, artKey, organizationKey } = validatedData.data;
  const actorEmployeeKey = await getActorIdFromToken(accessToken);
  if (!actorEmployeeKey) {
    return { success: false, message: "Invalid access token or actor not found." };
  }
  
  // Basic validation already handled by Zod, but explicit checks can remain if preferred
  // if (!teamName) return { success: false, message: "Team name is required." };
  // if (artKey === undefined || artKey === null) return { success: false, message: "ART key is required." };
  // if (organizationKey === undefined || organizationKey === null) return { success: false, message: "Organization key is required." };


  try {
    // Ensure teamName + artKey combination is unique (as per DB constraint)
    // This check should also implicitly be within the organization via artKey's organization
    const existingTeam = await db
      .select({ teamKey: teams.teamKey })
      .from(teams)
      .where(
        and(
          eq(teams.teamName, teamName),
          eq(teams.artKey, artKey),
          eq(teams.organizationKey, organizationKey) // Ensure uniqueness within the organization
        )
      )
      .limit(1);

    if (existingTeam.length > 0) {
      return {
        success: false,
        message: "A Team with this name already exists for the given ART within this Organization.",
      };
    }

    const newTeam = await db
      .insert(teams)
      .values({
        teamName,
        artKey,
        organizationKey,
        createdById: actorEmployeeKey,
        updatedById: actorEmployeeKey,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    if (newTeam.length > 0) {
      return {
        success: true,
        message: "Team created successfully.",
        data: newTeam[0] as TeamOutput, // Consider enhancing TeamOutput with joined names
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
  const validatedData = UpdateTeamInputSchema.safeParse(data);
  if (!validatedData.success) {
    return { success: false, message: "Invalid input: " + validatedData.error.flatten().fieldErrors };
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
    // Fetch the current team to get its organizationKey for scoping and uniqueness checks
    const currentTeamArray = await db
      .select({ 
        teamName: teams.teamName, 
        artKey: teams.artKey,
        organizationKey: teams.organizationKey 
      })
      .from(teams)
      .where(eq(teams.teamKey, teamKey))
      .limit(1);

    if (currentTeamArray.length === 0) {
      return { success: false, message: "Team not found." };
    }
    const currentTeam = currentTeamArray[0];
    const currentOrganizationKey = currentTeam.organizationKey; // This is the tenant scope

    // Check for uniqueness if teamName or artKey are being changed
    const nameToCheck = updatePayloadData.teamName ?? currentTeam.teamName;
    const artKeyToCheck = updatePayloadData.artKey ?? currentTeam.artKey;

    // If organizationKey is part of updatePayloadData, it means an attempt to change the team's organization.
    // This is a complex operation and typically disallowed or handled with extreme care in multi-tenant systems.
    // For now, we will prevent changing the organizationKey of a team.
    if (updatePayloadData.organizationKey !== undefined && updatePayloadData.organizationKey !== currentOrganizationKey) {
        return { success: false, message: "Changing the organization of a team is not allowed." };
    }

    if (updatePayloadData.teamName !== undefined || updatePayloadData.artKey !== undefined) {
      if (nameToCheck && artKeyToCheck !== null && artKeyToCheck !== undefined) {
        const potentialConflict = await db
          .select({ teamKey: teams.teamKey })
          .from(teams)
          .where(
            and(
              eq(teams.teamName, nameToCheck),
              eq(teams.artKey, artKeyToCheck),
              eq(teams.organizationKey, currentOrganizationKey), // Check uniqueness within the same organization
              eq(teams.teamKey, teamKey) // Exclude the current team itself from conflict check by ensuring teamKey is different
            )
          )
          .limit(1);
        
        // Corrected conflict check:
        const conflictCheck = await db.select({teamKey: teams.teamKey}).from(teams)
        .where(and(
            eq(teams.teamName, nameToCheck),
            eq(teams.artKey, artKeyToCheck),
            eq(teams.organizationKey, currentOrganizationKey)
        )).limit(1);

        if (conflictCheck.length > 0 && conflictCheck[0].teamKey !== teamKey) {
          return {
            success: false,
            message: "A Team with this name already exists for the given ART within this Organization.",
          };
        }
      }
    }

    const updatePayload: Partial<typeof teams.$inferInsert> = { 
        ...updatePayloadData,
        updatedById: actorEmployeeKey, // Set updatedById
        updatedAt: new Date(),
    };
    // Ensure organizationKey is not accidentally changed if not explicitly allowed
    delete updatePayload.organizationKey;


    const updatedTeam = await db
      .update(teams)
      .set(updatePayload)
      .where(and(eq(teams.teamKey, teamKey), eq(teams.organizationKey, currentOrganizationKey))) // Scope update to tenant
      .returning();

    if (updatedTeam.length > 0) {
      return {
        success: true,
        message: "Team updated successfully.",
        data: updatedTeam[0] as TeamOutput,
      };
    } else {
      // This could happen if the teamKey is correct but organizationKey doesn't match (attempt to update cross-tenant)
      return {
        success: false,
        message: "Failed to update Team. Ensure it belongs to the correct organization or it was not found.",
      };
    }
  } catch (error) {
    console.error("Error updating Team:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
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
 * @param data - Input data including teamKey, organizationKey, and accessToken.
 * @returns An object with success status and message or error.
 */
export async function deleteTeam(data: DeleteTeamInput) {
  const validatedData = DeleteTeamInputSchema.safeParse(data);
  if (!validatedData.success) {
    return { success: false, message: "Invalid input: " + validatedData.error.flatten().fieldErrors };
  }
  const { teamKey, organizationKey, accessToken } = validatedData.data;

  const actorEmployeeKey = await getActorIdFromToken(accessToken);
  if (!actorEmployeeKey) {
    return { success: false, message: "Invalid access token or actor not found." };
  }

  try {
    // Ensure the team exists and belongs to the specified organization before deleting
    const existingTeam = await db
      .select({ teamKey: teams.teamKey })
      .from(teams)
      .where(and(eq(teams.teamKey, teamKey), eq(teams.organizationKey, organizationKey)))
      .limit(1);

    if (existingTeam.length === 0) {
      return { success: false, message: "Team not found in the specified organization or does not exist." };
    }

    // TODO: Consider deleting related employeeTeam links if not handled by cascade or if specific logic is needed.
    // For now, assuming cascade delete on employeeTeam or manual cleanup elsewhere.

    const deletedTeam = await db
      .delete(teams)
      .where(and(eq(teams.teamKey, teamKey), eq(teams.organizationKey, organizationKey))) // Scope delete to tenant
      .returning({ deletedKey: teams.teamKey });

    if (deletedTeam.length > 0 && deletedTeam[0].deletedKey === teamKey) {
      return { success: true, message: "Team deleted successfully." };
    } else {
      return {
        success: false,
        message: "Failed to delete Team.", // Should not be reached if existingTeam check passes
      };
    }
  } catch (error) {
    console.error("Error deleting Team:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    return {
      success: false,
      message: `Database operation failed: ${errorMessage}`,
    };
  }
}

/**
 * Retrieves a team by its key, scoped to an organization.
 * @param teamKey - The key of the team to retrieve.
 * @param organizationKey - The key of the organization this team must belong to.
 * @returns An object with success status, message, and data (the team) or error.
 */
export async function getTeamByKey(teamKey: number, organizationKey: number) {
  try {
    const team = await db
      .select()
      .from(teams)
      .where(and(eq(teams.teamKey, teamKey), eq(teams.organizationKey, organizationKey))) // Scoped to organization
      .limit(1);

    if (team.length > 0) {
      return {
        success: true,
        message: "Team retrieved successfully.", // Corrected message
        data: team[0] as TeamOutput,
      };
    } else {
      return { success: false, message: "Team not found in the specified organization." }; // Corrected message
    }
  } catch (error) {
    console.error("Error retrieving team by key:", error); // Corrected log message
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

"use server";

import { db } from "@/db";
import { employees, employeeOrg, employeeArt, employeeTeam } from "@/db/schema/employee";
import { organizations } from "@/db/schema/organization";
import { arts } from "@/db/schema/ART";
import { teams } from "@/db/schema/team";
import { eq, asc, and, desc, ne, sql, inArray } from "drizzle-orm"; // Added sql and inArray
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { alias } from "drizzle-orm/pg-core";
import { getActorIdFromToken } from "@/lib/okta"; // Use the centralized helper

// Schema for selecting an Employee (can be used for return types)
const selectEmployeeSchema = createSelectSchema(employees);
export type EmployeeOutput = z.infer<typeof selectEmployeeSchema>;

// Schema for inserting a new employee
const insertEmployeeSchema = createInsertSchema(employees, {
  employeeKey: (schema) => schema.optional(),
  createdAt: (schema) => schema.optional(),
  updatedAt: (schema) => schema.optional(),
  // Add other fields that might be optional or have defaults during creation
  isContractor: (schema) => schema.optional(),
  isUserActive: (schema) => schema.optional(),
  profilePhoto: (schema) => schema.nullable().optional(),
  cignaManagerId: (schema) => schema.nullable().optional(),
});
export type CreateEmployeeInput = z.infer<typeof insertEmployeeSchema>;

// Schema for updating an existing employee's core details
const updateEmployeeCoreSchema = insertEmployeeSchema.partial().extend({
  employeeKey: z.number(), // employeeKey is required for updates
  // Specific fields allowed for update via this action
  cignaManagerId: z.string().nullable().optional(),
  isContractor: z.boolean().optional(),
  profilePhoto: z.string().nullable().optional(),
  isUserActive: z.boolean().optional(), // Added for completeness
  firstName: z.string().optional(), // Allow name updates
  lastName: z.string().optional(), // Allow name updates
  email: z.string().email().optional(), // Allow email updates, ensure uniqueness handled
  lanId: z.string().optional(), // Allow lanId updates, ensure uniqueness handled
});
export type UpdateEmployeeCoreInput = z.infer<typeof updateEmployeeCoreSchema>;


/**
 * Retrieves all employees, ordered by last name, then first name.
 * @returns An object with success status, message, and data (list of employees) or error.
 */
export async function getEmployees() {
  try {
    const result = await db
      .select()
      .from(employees)
      .orderBy(asc(employees.lastName), asc(employees.firstName));

    return {
      success: true,
      message: "Employees retrieved successfully.",
      data: result as EmployeeOutput[],
    };
  } catch (error) {
    console.error("Error retrieving employees:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred.";
    return {
      success: false,
      message: `Database operation failed: ${errorMessage}`,
    };
  }
}

/**
 * Updates core information for an existing employee.
 * @param data - The data to update, including employeeKey.
 * @returns An object with success status, message, and data (the updated employee) or error.
 */
export async function updateEmployeeDetails(data: UpdateEmployeeCoreInput) {
  const { employeeKey, ...updateData } = data;

  if (Object.keys(updateData).length === 0) {
    return { success: false, message: "No data provided for update." };
  }

  try {
    // Check if employee exists
    const existingEmployee = await db
      .select({ employeeKey: employees.employeeKey })
      .from(employees)
      .where(eq(employees.employeeKey, employeeKey))
      .limit(1);

    if (existingEmployee.length === 0) {
      return { success: false, message: "Employee not found." };
    }

    // TODO: Add pre-update checks for uniqueness if email or lanId are being changed.
    // For example, if updateData.email is provided and different from current email:
    // const conflictingEmployeeByEmail = await db.select().from(employees)
    //   .where(and(eq(employees.email, updateData.email), ne(employees.employeeKey, employeeKey)));
    // if (conflictingEmployeeByEmail.length > 0) return { success: false, message: "Email already in use." };

    const payload: Partial<typeof employees.$inferInsert> = { ...updateData };
    payload.updatedAt = new Date(); // Ensure updatedAt is set

    const updatedEmployee = await db
      .update(employees)
      .set(payload)
      .where(eq(employees.employeeKey, employeeKey))
      .returning();

    if (updatedEmployee.length > 0) {
      return {
        success: true,
        message: "Employee details updated successfully.",
        data: updatedEmployee[0] as EmployeeOutput,
      };
    } else {
      // This case should ideally not be reached if existingEmployee check passed
      return { success: false, message: "Failed to update employee details." };
    }
  } catch (error) {
    console.error("Error updating employee details:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred.";
    // Handle potential unique constraint violations from the DB level
    if (errorMessage.toLowerCase().includes("unique constraint")) {
        if (errorMessage.toLowerCase().includes("email")) {
            return { success: false, message: "An employee with this email already exists." };
        }
        if (errorMessage.toLowerCase().includes("lan_id")) {
            return { success: false, message: "An employee with this LAN ID already exists." };
        }
    }
    return {
      success: false,
      message: `Database operation failed: ${errorMessage}`,
    };
  }
}

// --- Ownership Association Schemas and Actions ---

// Schema for setting/updating organization owners (supports multiple owners)
const setOrganizationOwnersSchema = z.object({
  organizationKey: z.number(),
  ownerEmployeeKeys: z.array(z.number()), // Array of employeeKeys for the new set of owners
  accessToken: z.string(),
});
export type SetOrganizationOwnersInput = z.infer<typeof setOrganizationOwnersSchema>;

/**
 * Sets or updates the owners for an organization.
 * This will replace the current set of owners with the provided list.
 * @param data - Input data including organizationKey, an array of ownerEmployeeKeys, and accessToken.
 * @returns An object with success status and message.
 */
export async function setOrganizationOwner(data: SetOrganizationOwnersInput) { // Renamed for clarity if needed, but keeping for now
  const { organizationKey, ownerEmployeeKeys, accessToken } = data;

  const actorEmployeeKey = await getActorIdFromToken(accessToken);

  if (!actorEmployeeKey) {
    return { success: false, message: "Invalid access token or actor not found." };
  }

  try {
    await db.transaction(async (tx) => {
      // 1. Get current owners for the organization
      const currentOwnerLinks = await tx
        .select({ employeeKey: employeeOrg.employeeKey })
        .from(employeeOrg)
        .where(and(eq(employeeOrg.organizationKey, organizationKey), eq(employeeOrg.orgOwner, true)));
      
      const currentOwnerIds = currentOwnerLinks.map(link => link.employeeKey);

      // 2. Determine owners to remove
      // Owners who are in currentOwnerIds but not in new ownerEmployeeKeys
      const ownersToRemove = currentOwnerIds.filter(id => !ownerEmployeeKeys.includes(id));
      if (ownersToRemove.length > 0) {
        await tx
          .update(employeeOrg)
          .set({
            orgOwner: false,
            updatedById: actorEmployeeKey,
            updatedAt: new Date(),
          })
          .where(and(
            eq(employeeOrg.organizationKey, organizationKey),
            inArray(employeeOrg.employeeKey, ownersToRemove) // Use inArray
          ));
      }

      // 3. Determine owners to add or update to orgOwner = true
      for (const ownerKey of ownerEmployeeKeys) {
        const existingLink = await tx
          .select()
          .from(employeeOrg)
          .where(and(eq(employeeOrg.employeeKey, ownerKey), eq(employeeOrg.organizationKey, organizationKey)))
          .limit(1);

        if (existingLink.length > 0) {
          // If link exists, update it to be an owner if it's not already
          if (!existingLink[0].orgOwner) {
            await tx
              .update(employeeOrg)
              .set({
                orgOwner: true,
                updatedById: actorEmployeeKey,
                updatedAt: new Date(),
              })
              .where(and( // Use composite PK for update
                eq(employeeOrg.employeeKey, ownerKey),
                eq(employeeOrg.organizationKey, organizationKey)
              ));
          }
        } else {
          // If link doesn't exist, create it
          await tx.insert(employeeOrg).values({
            employeeKey: ownerKey,
            organizationKey,
            orgOwner: true,
            createdById: actorEmployeeKey,
            updatedById: actorEmployeeKey,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }
      }
    });

    return { success: true, message: "Organization owners updated successfully." };
  } catch (error) {
    console.error("Error setting organization owner:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred.";
    return {
      success: false,
      message: `Database operation failed: ${errorMessage}`,
    };
  }
}


// Schema for setting/updating ART owners (supports multiple owners)
const setArtOwnersSchema = z.object({
  artKey: z.number(),
  ownerEmployeeKeys: z.array(z.number()), // Array of employeeKeys for the new set of owners
  accessToken: z.string(),
});
export type SetArtOwnersInput = z.infer<typeof setArtOwnersSchema>; // Renamed type

/**
 * Sets or updates the owners for an ART.
 * This will replace the current set of owners with the provided list.
 * @param data - Input data including artKey, an array of ownerEmployeeKeys, and accessToken.
 * @returns An object with success status and message.
 */
export async function setArtOwner(data: SetArtOwnersInput) { // Function name kept as setArtOwner for consistency if preferred, or could be setArtOwners
  const { artKey, ownerEmployeeKeys, accessToken } = data;

  const actorEmployeeKey = await getActorIdFromToken(accessToken);

  if (!actorEmployeeKey) {
    return { success: false, message: "Invalid access token or actor not found." };
  }

  try {
    await db.transaction(async (tx) => {
      // 1. Get current owners for the ART
      const currentOwnerLinks = await tx
        .select({ employeeKey: employeeArt.employeeKey })
        .from(employeeArt)
        .where(and(eq(employeeArt.artKey, artKey), eq(employeeArt.artOwner, true)));
      
      const currentOwnerIds = currentOwnerLinks.map(link => link.employeeKey);

      // 2. Determine owners to remove
      const ownersToRemove = currentOwnerIds.filter(id => !ownerEmployeeKeys.includes(id));
      if (ownersToRemove.length > 0) {
        await tx
          .update(employeeArt)
          .set({
            artOwner: false,
            updatedById: actorEmployeeKey,
            updatedAt: new Date(),
          })
          .where(and(
            eq(employeeArt.artKey, artKey),
            inArray(employeeArt.employeeKey, ownersToRemove)
          ));
      }

      // 3. Determine owners to add or update to artOwner = true
      for (const ownerKey of ownerEmployeeKeys) {
        const existingLink = await tx
          .select()
          .from(employeeArt)
          .where(and(eq(employeeArt.employeeKey, ownerKey), eq(employeeArt.artKey, artKey)))
          .limit(1);

        if (existingLink.length > 0) {
          if (!existingLink[0].artOwner) {
            await tx
              .update(employeeArt)
              .set({
                artOwner: true,
                updatedById: actorEmployeeKey,
                updatedAt: new Date(),
              })
              .where(and(
                eq(employeeArt.employeeKey, ownerKey),
                eq(employeeArt.artKey, artKey)
              ));
          }
        } else {
          await tx.insert(employeeArt).values({
            employeeKey: ownerKey,
            artKey,
            artOwner: true,
            createdById: actorEmployeeKey,
            updatedById: actorEmployeeKey,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }
      }
    });

    return { success: true, message: "ART owners updated successfully." };
  } catch (error) {
    console.error("Error setting ART owners:", error); // Updated log message
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred.";
    return {
      success: false,
      message: `Database operation failed: ${errorMessage}`,
    };
  }
}

// Schema for setting/updating team owners (supports multiple owners)
const setTeamOwnersSchema = z.object({
  teamKey: z.number(),
  ownerEmployeeKeys: z.array(z.number()), // Array of employeeKeys for the new set of owners
  accessToken: z.string(),
});
export type SetTeamOwnersInput = z.infer<typeof setTeamOwnersSchema>; // Renamed type

/**
 * Sets or updates the owners for a team.
 * This will replace the current set of owners with the provided list.
 * An employee must already be part of the team (i.e., have a role) to be made an owner.
 * @param data - Input data including teamKey, an array of ownerEmployeeKeys, and accessToken.
 * @returns An object with success status and message.
 */
export async function setTeamOwner(data: SetTeamOwnersInput) { // Function name kept as setTeamOwner
  const { teamKey, ownerEmployeeKeys, accessToken } = data;
  const actorEmployeeKey = await getActorIdFromToken(accessToken);

  if (!actorEmployeeKey) {
    return { success: false, message: "Invalid access token or actor not found." };
  }

  let nonMemberOwnerKeys: number[] = [];

  try {
    await db.transaction(async (tx) => {
      // 1. Get current distinct employee keys who are owners of the team
      const currentOwnerLinks = await tx
        .selectDistinct({ employeeKey: employeeTeam.employeeKey })
        .from(employeeTeam)
        .where(and(eq(employeeTeam.teamKey, teamKey), eq(employeeTeam.teamOwner, true)));
      
      const currentOwnerIds = currentOwnerLinks.map(link => link.employeeKey);

      // 2. Determine owners to remove (demote)
      // These are employees currently marked as owners but not in the new ownerEmployeeKeys list.
      // For these employees, set teamOwner = false for all their roles in this team.
      const ownersToDemote = currentOwnerIds.filter(id => !ownerEmployeeKeys.includes(id));
      if (ownersToDemote.length > 0) {
        await tx
          .update(employeeTeam)
          .set({
            teamOwner: false,
            updatedById: actorEmployeeKey,
            updatedAt: new Date(),
          })
          .where(and(
            eq(employeeTeam.teamKey, teamKey),
            inArray(employeeTeam.employeeKey, ownersToDemote)
          ));
      }

      // 3. Determine owners to add or update to teamOwner = true
      // These are employees in the ownerEmployeeKeys list.
      // For each, set teamOwner = true for all their existing roles in this team.
      // If an employee in ownerEmployeeKeys is not part of the team, they cannot be made an owner.
      for (const ownerKey of ownerEmployeeKeys) {
        // Check if the employee is part of the team (has any role)
        const existingRoles = await tx
          .select({ employeeKey: employeeTeam.employeeKey })
          .from(employeeTeam)
          .where(and(eq(employeeTeam.employeeKey, ownerKey), eq(employeeTeam.teamKey, teamKey)))
          .limit(1); // Just need to know if they exist in the team

        if (existingRoles.length > 0) {
          // Employee is in the team, ensure all their roles in this team are marked as owner
          await tx
            .update(employeeTeam)
            .set({
              teamOwner: true,
              updatedById: actorEmployeeKey,
              updatedAt: new Date(),
            })
            .where(and(
              eq(employeeTeam.employeeKey, ownerKey),
              eq(employeeTeam.teamKey, teamKey)
            ));
        } else {
          // Employee is not in the team, cannot make them an owner.
          nonMemberOwnerKeys.push(ownerKey);
        }
      }
    });

    let message = "Team owners updated successfully.";
    if (nonMemberOwnerKeys.length > 0) {
      message += ` The following employees could not be set as owners because they are not members of the team: ${nonMemberOwnerKeys.join(', ')}.`;
    }
    return { success: true, message };

  } catch (error) {
    console.error("Error setting team owners:", error); // Updated log message
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred.";
    return {
      success: false,
      message: `Database operation failed: ${errorMessage}`,
    };
  }
}

// --- Employee Team Assignment Schemas and Actions ---

const assignEmployeeToTeamSchema = z.object({
  employeeKey: z.number(),
  teamKey: z.number(),
  jobTitle: z.string().min(1, "Job title is required."),
  isTeamOwner: z.boolean().optional().default(false),
  accessToken: z.string(), // Changed from actorEmployeeKey
});
export type AssignEmployeeToTeamInput = z.infer<typeof assignEmployeeToTeamSchema>;

/**
 * Assigns an employee to a team with a specific job title.
 * If the employee is already in the team with that job title, it can update the teamOwner status.
 */
export async function assignEmployeeToTeam(data: AssignEmployeeToTeamInput) {
  const { employeeKey, teamKey, jobTitle, isTeamOwner, accessToken } = data;
  const actorEmployeeKey = await getActorIdFromToken(accessToken);

  if (!actorEmployeeKey) {
    return { success: false, message: "Invalid access token or actor not found." };
  }

  try {
    // if (!employeeExists.length) return { success: false, message: "Employee not found." };
    // const teamExists = await db.select().from(teams).where(eq(teams.teamKey, teamKey)).limit(1);
    // if (!teamExists.length) return { success: false, message: "Team not found." };
    
    await db
      .insert(employeeTeam)
      .values({
        employeeKey,
        teamKey,
        jobTitle,
        teamOwner: isTeamOwner,
        createdById: actorEmployeeKey,
        updatedById: actorEmployeeKey,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [employeeTeam.employeeKey, employeeTeam.teamKey, employeeTeam.jobTitle],
        set: {
          teamOwner: isTeamOwner,
          updatedById: actorEmployeeKey,
          updatedAt: new Date(),
        },
      });

    return { success: true, message: "Employee successfully assigned to team." };
  } catch (error) {
    console.error("Error assigning employee to team:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred.";
    // Check for foreign key violations specifically if not checking existence beforehand
    if (errorMessage.toLowerCase().includes("foreign key constraint")) {
        if (errorMessage.toLowerCase().includes("employee_team_employee_key_fkey")) {
             return { success: false, message: "Failed to assign: Employee not found." };
        }
        if (errorMessage.toLowerCase().includes("employee_team_team_key_fkey")) {
             return { success: false, message: "Failed to assign: Team not found." };
        }
    }
    return {
      success: false,
      message: `Database operation failed: ${errorMessage}`,
    };
  }
}

const removeEmployeeFromTeamSchema = z.object({
  employeeKey: z.number(),
  teamKey: z.number(),
  jobTitle: z.string().min(1, "Job title is required to identify the specific role."),
  // actorEmployeeKey: z.number(), // Not strictly needed for a delete, but could be logged
});
export type RemoveEmployeeFromTeamInput = z.infer<typeof removeEmployeeFromTeamSchema>;

/**
 * Removes an employee's specific role (job title) from a team.
 */
export async function removeEmployeeFromTeam(data: RemoveEmployeeFromTeamInput) {
  const { employeeKey, teamKey, jobTitle } = data;

  try {
    const result = await db
      .delete(employeeTeam)
      .where(
        and(
          eq(employeeTeam.employeeKey, employeeKey),
          eq(employeeTeam.teamKey, teamKey),
          eq(employeeTeam.jobTitle, jobTitle)
        )
      )
      .returning(); // To check if any row was actually deleted

    if (result.length === 0) {
      return { success: false, message: "Employee not found in team with that job title, or already removed." };
    }

    return { success: true, message: "Employee successfully removed from team role." };
  } catch (error) {
    console.error("Error removing employee from team:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred.";
    return {
      success: false,
      message: `Database operation failed: ${errorMessage}`,
    };
  }
}
// End of file

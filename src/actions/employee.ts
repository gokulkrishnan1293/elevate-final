"use server";

import { db } from "@/db";
import { employees, employeeOrg, employeeArt, employeeTeam } from "@/db/schema/employee";
import { organizations } from "@/db/schema/organization";
import { arts } from "@/db/schema/ART";
import { teams } from "@/db/schema/team";
import { eq, asc, and, desc, ne, sql, inArray } from "drizzle-orm"; // Added sql and inArray
// import { createInsertSchema, createSelectSchema } from "drizzle-zod"; // No longer needed here
// import { z } from "zod"; // No longer needed here for top-level exports
import { alias } from "drizzle-orm/pg-core";
import { getActorIdFromToken } from "@/lib/okta"; // Use the centralized helper
import {
  EmployeeOutput,
  CreateEmployeeInput,
  UpdateEmployeeCoreInputSchema,
  UpdateEmployeeCoreInput,
  SetOrganizationOwnersInput,
  SetArtOwnersInput,
  SetTeamOwnersInput,
  AssignEmployeeToTeamInput,
  RemoveEmployeeFromTeamInput,
  // Schemas themselves are used internally for validation, so import them too
  setOrganizationOwnersSchema,
  setArtOwnersSchema,
  setTeamOwnersSchema,
  assignEmployeeToTeamSchema,
  removeEmployeeFromTeamSchema
} from "@/lib/schemas/employee";


/**
 * Retrieves employees, optionally filtered by organization.
 * If organizationKey is provided, it fetches employees for that specific organization.
 * Otherwise, it fetches all employees.
 * Ordered by last name, then first name.
 * @param organizationKey - Optional key of the organization to fetch employees for.
 * @returns An object with success status, message, and data (list of employees) or error.
 */
export async function getEmployees(organizationKey?: number) { // organizationKey is now optional

  try {
    let query = db
      .select({
        employeeKey: employees.employeeKey,
        firstName: employees.firstName,
        lastName: employees.lastName,
        email: employees.email,
        lanId: employees.lanId,
        cignaManagerId: employees.cignaManagerId,
        isContractor: employees.isContractor,
        isUserActive: employees.isUserActive,
        profilePhoto: employees.profilePhoto,
        createdAt: employees.createdAt,
        updatedAt: employees.updatedAt,
      })
      .from(employees)
      .$dynamic(); // Prepare for dynamic conditions

    if (organizationKey !== undefined && organizationKey !== null) {
      query = query
        .innerJoin(employeeOrg, eq(employees.employeeKey, employeeOrg.employeeKey))
        .where(eq(employeeOrg.organizationKey, organizationKey))
        .orderBy(asc(employees.lastName), asc(employees.firstName));
    } else {
      // No organizationKey provided, fetch all employees
      query = query.orderBy(asc(employees.lastName), asc(employees.firstName));
    }
    
    const result = await query;

    return {
      success: true,
      message: organizationKey ? "Employees for the organization retrieved successfully." : "All employees retrieved successfully.",
      data: result as EmployeeOutput[],
    };
  } catch (error) {
    console.error(`Error retrieving employees${organizationKey ? ' for organization ' + organizationKey : ''}:`, error);
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
  const validatedData = UpdateEmployeeCoreInputSchema.safeParse(data);
  if (!validatedData.success) {
    return { success: false, message: "Invalid input: " + validatedData.error.flatten().fieldErrors };
  }

  const { employeeKey, accessToken, organizationKey, ...updatePayloadData } = validatedData.data;
  
  if (Object.keys(updatePayloadData).length === 0) {
    return { success: false, message: "No fields provided for update." };
  }

  const actorEmployeeKey = await getActorIdFromToken(accessToken);
  if (!actorEmployeeKey) {
    return { success: false, message: "Invalid access token or actor not found." };
  }

  try {
    // Check if employee exists and is part of the specified organization
    const employeeInOrg = await db
      .select({ eKey: employees.employeeKey })
      .from(employees)
      .innerJoin(employeeOrg, eq(employees.employeeKey, employeeOrg.employeeKey))
      .where(and(
        eq(employees.employeeKey, employeeKey),
        eq(employeeOrg.organizationKey, organizationKey)
      ))
      .limit(1);

    if (employeeInOrg.length === 0) {
      return { success: false, message: "Employee not found in the specified organization or does not exist." };
    }

    // TODO: Add pre-update checks for uniqueness if email or lanId are being changed.
    // This check should be global if email/lanId must be globally unique.
    // Example:
    if (updatePayloadData.email) {
      const conflictingEmployeeByEmail = await db.select({key: employees.employeeKey}).from(employees)
        .where(and(eq(employees.email, updatePayloadData.email), ne(employees.employeeKey, employeeKey)));
      if (conflictingEmployeeByEmail.length > 0) return { success: false, message: "This email address is already in use by another employee." };
    }
    if (updatePayloadData.lanId) {
      const conflictingEmployeeByLanId = await db.select({key: employees.employeeKey}).from(employees)
        .where(and(eq(employees.lanId, updatePayloadData.lanId), ne(employees.employeeKey, employeeKey)));
      if (conflictingEmployeeByLanId.length > 0) return { success: false, message: "This LAN ID is already in use by another employee." };
    }
    
    // Note: createdById is not set on employee table, but on linkage tables.
    // updatedById on the employee table itself could represent the last global updater.
    // For now, we are not setting updatedById on the employees table via this action.
    const payload: Partial<typeof employees.$inferInsert> = { ...updatePayloadData };
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

/**
 * Assigns an employee to a team with a specific job title within a given organization.
 * If the employee is already in the team with that job title, it can update the teamOwner status.
 */
export async function assignEmployeeToTeam(data: AssignEmployeeToTeamInput) {
  // Validate input data using the imported schema
  const validatedData = assignEmployeeToTeamSchema.safeParse(data);
  if (!validatedData.success) {
    return { success: false, message: "Invalid input: " + validatedData.error.flatten().fieldErrors };
  }
  const { employeeKey, teamKey, organizationKey, jobTitle, isTeamOwner, accessToken } = validatedData.data;
  const actorEmployeeKey = await getActorIdFromToken(accessToken);

  if (!actorEmployeeKey) {
    return { success: false, message: "Invalid access token or actor not found." };
  }

  try {
    // Verify the team belongs to the specified organization
    const teamOrgCheck = await db.select({ key: teams.teamKey })
      .from(teams)
      .where(and(eq(teams.teamKey, teamKey), eq(teams.organizationKey, organizationKey)))
      .limit(1);

    if (teamOrgCheck.length === 0) {
      return { success: false, message: "Team not found in the specified organization." };
    }
    // TODO: Optionally verify employee exists, though FK constraint will catch it.
    
    await db
      .insert(employeeTeam)
      .values({
        employeeKey,
        teamKey, // This teamKey has been validated to be in the organizationKey
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
          teamOwner: isTeamOwner, // Update teamOwner status
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
        // No need to check for team_key_fkey if we've already validated the team exists in the org.
    }
    return {
      success: false,
      message: `Database operation failed: ${errorMessage}`,
    };
  }
}

/**
 * Removes an employee's specific role (job title) from a team within a given organization.
 */
export async function removeEmployeeFromTeam(data: RemoveEmployeeFromTeamInput) {
  // Validate input data using the imported schema
  const validatedData = removeEmployeeFromTeamSchema.safeParse(data);
  if (!validatedData.success) {
    return { success: false, message: "Invalid input: " + validatedData.error.flatten().fieldErrors };
  }
  const { employeeKey, teamKey, organizationKey, jobTitle, accessToken } = validatedData.data;
  
  const actorEmployeeKey = await getActorIdFromToken(accessToken); // Validate actor
  if (!actorEmployeeKey) {
    return { success: false, message: "Invalid access token or actor not found." };
  }

  try {
     // Verify the team belongs to the specified organization
    const teamOrgCheck = await db.select({ key: teams.teamKey })
      .from(teams)
      .where(and(eq(teams.teamKey, teamKey), eq(teams.organizationKey, organizationKey)))
      .limit(1);

    if (teamOrgCheck.length === 0) {
      return { success: false, message: "Team not found in the specified organization." };
    }

    const result = await db
      .delete(employeeTeam)
      .where(
        and(
          eq(employeeTeam.employeeKey, employeeKey),
          eq(employeeTeam.teamKey, teamKey), // teamKey is validated to be in organizationKey
          eq(employeeTeam.jobTitle, jobTitle)
        )
      )
      .returning();

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

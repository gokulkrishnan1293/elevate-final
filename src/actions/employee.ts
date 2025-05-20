"use server";

import { db } from "@/db";
import { employees, employeeOrg, employeeArt, employeeTeam } from "@/db/schema/employee";
import { organizations } from "@/db/schema/organization";
import { arts } from "@/db/schema/ART";
import { teams } from "@/db/schema/team";
import { eq, asc, and, desc, ne } from "drizzle-orm";
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

// Schema for setting/unsetting organization owner
const setOrgOwnerSchema = z.object({
  employeeKey: z.number(), // The employee whose ownership is being changed
  organizationKey: z.number(),
  isOwner: z.boolean(),
  accessToken: z.string(), // Okta access token of the user performing the action
});
export type SetOrgOwnerInput = z.infer<typeof setOrgOwnerSchema>;

/**
 * Associates or disassociates an employee as an organization owner.
 * @param data - Input data including employeeKey, organizationKey, isOwner flag, and actorEmployeeKey.
 * @returns An object with success status and message.
 */
export async function setOrganizationOwner(data: SetOrgOwnerInput) {
  const { employeeKey, organizationKey, isOwner, accessToken } = data;

  const actorEmployeeKey = await getActorIdFromToken(accessToken);

  if (!actorEmployeeKey) {
    // getActorIdFromToken will log specific errors, return a generic one here or based on needs
    return { success: false, message: "Invalid access token or actor not found." };
  }

  try {
    const existingLink = await db
      .select()
      .from(employeeOrg)
      .where(
        and(
          eq(employeeOrg.employeeKey, employeeKey),
          eq(employeeOrg.organizationKey, organizationKey)
        )
      )
      .limit(1);

    if (existingLink.length > 0) {
      // Update existing link
      if (existingLink[0].orgOwner === isOwner) {
        return { success: true, message: `Employee is already ${isOwner ? 'an owner' : 'not an owner'} of this organization.` };
      }
      await db
        .update(employeeOrg)
        .set({
          orgOwner: isOwner,
          updatedById: actorEmployeeKey, // Use actorEmployeeKey
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(employeeOrg.employeeKey, employeeKey),
            eq(employeeOrg.organizationKey, organizationKey)
          )
        );
    } else {
      // Insert new link only if trying to set as owner
      if (isOwner) {
        await db.insert(employeeOrg).values({
          employeeKey,
          organizationKey,
          orgOwner: true,
          createdById: actorEmployeeKey, // Use actorEmployeeKey
          updatedById: actorEmployeeKey, // Use actorEmployeeKey
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      } else {
        // Trying to set isOwner=false for a non-existing link, which is a no-op.
        return { success: true, message: "Employee was not an owner of this organization, no change made." };
      }
    }
    return { success: true, message: `Organization ownership ${isOwner ? 'assigned' : 'updated'} successfully.` };
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


// Schema for setting/unsetting ART owner
const setArtOwnerSchema = z.object({
  employeeKey: z.number(),
  artKey: z.number(),
  isOwner: z.boolean(),
  accessToken: z.string(), // Changed from actorEmployeeKey
});
export type SetArtOwnerInput = z.infer<typeof setArtOwnerSchema>;

/**
 * Associates or disassociates an employee as an ART owner.
 */
export async function setArtOwner(data: SetArtOwnerInput) {
  const { employeeKey, artKey, isOwner, accessToken } = data;
  const actorEmployeeKey = await getActorIdFromToken(accessToken);

  if (!actorEmployeeKey) {
    return { success: false, message: "Invalid access token or actor not found." };
  }

  try {
    const existingLink = await db
      .select()
      .from(employeeArt)
      .where(
        and(eq(employeeArt.employeeKey, employeeKey), eq(employeeArt.artKey, artKey))
      )
      .limit(1);

    if (existingLink.length > 0) {
      if (existingLink[0].artOwner === isOwner) {
        return { success: true, message: `Employee is already ${isOwner ? 'an owner' : 'not an owner'} of this ART.` };
      }
      await db
        .update(employeeArt)
        .set({
          artOwner: isOwner,
          updatedById: actorEmployeeKey,
          updatedAt: new Date(),
        })
        .where(
          and(eq(employeeArt.employeeKey, employeeKey), eq(employeeArt.artKey, artKey))
        );
    } else {
      if (isOwner) {
        await db.insert(employeeArt).values({
          employeeKey,
          artKey,
          artOwner: true,
          createdById: actorEmployeeKey,
          updatedById: actorEmployeeKey,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      } else {
        return { success: true, message: "Employee was not an owner of this ART, no change made." };
      }
    }
    return { success: true, message: `ART ownership ${isOwner ? 'assigned' : 'updated'} successfully.` };
  } catch (error) {
    console.error("Error setting ART owner:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    return { success: false, message: `Database operation failed: ${errorMessage}` };
  }
}

// Schema for setting/unsetting team owner
const setTeamOwnerSchema = z.object({
  employeeKey: z.number(),
  teamKey: z.number(),
  isOwner: z.boolean(),
  accessToken: z.string(), // Changed from actorEmployeeKey
});
export type SetTeamOwnerInput = z.infer<typeof setTeamOwnerSchema>;

/**
 * Associates or disassociates an employee as a team owner for all their roles in that team.
 */
export async function setTeamOwner(data: SetTeamOwnerInput) {
  const { employeeKey, teamKey, isOwner, accessToken } = data;
  const actorEmployeeKey = await getActorIdFromToken(accessToken);

  if (!actorEmployeeKey) {
    return { success: false, message: "Invalid access token or actor not found." };
  }

  try {
    // A more granular approach would require specifying the jobTitle.
    const existingLinks = await db
      .select()
      .from(employeeTeam)
      .where(
        and(eq(employeeTeam.employeeKey, employeeKey), eq(employeeTeam.teamKey, teamKey))
      );

    if (existingLinks.length === 0 && isOwner) {
      // Cannot make someone an owner of a team they are not part of.
      // They first need a role (jobTitle) in that team.
      // This action could be extended to also add them to the team with a default job title if isOwner is true.
      return { success: false, message: "Employee is not part of this team. Add them to the team first with a job title." };
    }
    
    if (existingLinks.length === 0 && !isOwner) {
         return { success: true, message: "Employee was not part of this team, no change made." };
    }

    // Update all existing links for this employee in this team
    await db
      .update(employeeTeam)
      .set({
        teamOwner: isOwner,
        updatedById: actorEmployeeKey,
        updatedAt: new Date(),
      })
      .where(
        and(eq(employeeTeam.employeeKey, employeeKey), eq(employeeTeam.teamKey, teamKey))
      );
    
    return { success: true, message: `Team ownership for employee in team ${isOwner ? 'assigned' : 'updated'} successfully for all roles.` };
  } catch (error) {
    console.error("Error setting team owner:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    return { success: false, message: `Database operation failed: ${errorMessage}` };
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

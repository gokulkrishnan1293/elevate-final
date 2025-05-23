import { z } from "zod";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { employees } from "@/db/schema/employee"; // Assuming this path is correct for db schema

// Schema for selecting an Employee (can be used for return types)
export const selectEmployeeSchema = createSelectSchema(employees);
export type EmployeeOutput = z.infer<typeof selectEmployeeSchema>;

// Schema for inserting a new employee
export const insertEmployeeSchema = createInsertSchema(employees, {
  employeeKey: (schema) => schema.optional(), // Assuming employeeKey is auto-generated or optional on insert
  createdAt: (schema) => schema.optional(),
  updatedAt: (schema) => schema.optional(),
  isContractor: (schema) => schema.optional(),
  isUserActive: (schema) => schema.optional(),
  profilePhoto: (schema) => schema.nullable().optional(),
  cignaManagerId: (schema) => schema.nullable().optional(),
});
export type CreateEmployeeInput = z.infer<typeof insertEmployeeSchema>;

// Schema for updating an existing employee's core details
export const UpdateEmployeeCoreInputSchema = insertEmployeeSchema.partial().extend({
  employeeKey: z.number(), // employeeKey is required for updates
  accessToken: z.string(), // To validate the actor
  organizationKey: z.number(), // To scope the update to an organization
  // Specific fields allowed for update
  cignaManagerId: z.string().nullable().optional(),
  isContractor: z.boolean().optional(),
  profilePhoto: z.string().nullable().optional(),
  isUserActive: z.boolean().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  email: z.string().email().optional(),
  lanId: z.string().optional(),
});
export type UpdateEmployeeCoreInput = z.infer<typeof UpdateEmployeeCoreInputSchema>;

// Schema for setting/updating organization owners (supports multiple owners)
export const setOrganizationOwnersSchema = z.object({
  organizationKey: z.number(),
  ownerEmployeeKeys: z.array(z.number()), // Array of employeeKeys for the new set of owners
  accessToken: z.string(),
});
export type SetOrganizationOwnersInput = z.infer<typeof setOrganizationOwnersSchema>;

// Schema for setting/updating ART owners (supports multiple owners)
export const setArtOwnersSchema = z.object({
  artKey: z.number(),
  ownerEmployeeKeys: z.array(z.number()), // Array of employeeKeys for the new set of owners
  accessToken: z.string(),
});
export type SetArtOwnersInput = z.infer<typeof setArtOwnersSchema>;

// Schema for setting/updating team owners (supports multiple owners)
export const setTeamOwnersSchema = z.object({
  teamKey: z.number(),
  ownerEmployeeKeys: z.array(z.number()), // Array of employeeKeys for the new set of owners
  accessToken: z.string(),
});
export type SetTeamOwnersInput = z.infer<typeof setTeamOwnersSchema>;

// Schema for assigning an employee to a team
export const assignEmployeeToTeamSchema = z.object({
  employeeKey: z.number(),
  teamKey: z.number(),
  organizationKey: z.number(),
  jobTitle: z.string().min(1, "Job title is required."),
  isTeamOwner: z.boolean().optional().default(false),
  accessToken: z.string(),
});
export type AssignEmployeeToTeamInput = z.infer<typeof assignEmployeeToTeamSchema>;

// Schema for removing an employee from a team
export const removeEmployeeFromTeamSchema = z.object({
  employeeKey: z.number(),
  teamKey: z.number(),
  organizationKey: z.number(),
  jobTitle: z.string().min(1, "Job title is required to identify the specific role."),
  accessToken: z.string(),
});
export type RemoveEmployeeFromTeamInput = z.infer<typeof removeEmployeeFromTeamSchema>;

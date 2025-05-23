import { z } from "zod";
import { arts } from "@/db/schema/ART"; // Assuming this is the Drizzle schema
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

// Base schema from Drizzle for selecting an ART
const selectARTSchema = createSelectSchema(arts);

// Schema for creating an ART - used in forms and actions
export const CreateARTInputSchema = createInsertSchema(arts, {
  artName: z.string().min(1, "ART name is required."),
  organizationKey: z.number({ required_error: "Organization is required." }),
  // createdById will be set by the backend using accessToken
  // artKey, createdAt, updatedAt are auto-generated or set by backend
  // ownerEmployeeKeys will be added in .extend()
}).omit({
  artKey: true,
  createdAt: true,
  updatedAt: true,
  createdById: true, // Will be derived from accessToken
  updatedById: true, // Will be derived from accessToken
})
.extend({
    accessToken: z.string(), // For identifying the actor
    ownerEmployeeKeys: z.array(z.number()).optional(), // For assigning owners
});
export type CreateARTInput = z.infer<typeof CreateARTInputSchema>;


// Schema for updating an ART - used in forms and actions
export const UpdateARTInputSchema = createInsertSchema(arts, {
    artName: z.string().min(1, "ART name cannot be empty.").optional(),
    organizationKey: z.number().optional(),
    // ownerEmployeeKeys will be added in .extend()
})
.partial() // Makes all fields optional initially
.omit({ // Omit fields that shouldn't be directly updatable or are auto-managed
    artKey: true, // artKey is used to identify the record, not update
    createdAt: true,
    createdById: true,
    // updatedAt and updatedById are handled by the backend
})
.extend({
    accessToken: z.string(), // For identifying the actor
    organizationKey: z.number(), // For scoping the update
    ownerEmployeeKeys: z.array(z.number()).optional(), // For updating owners
});
export type UpdateARTInput = z.infer<typeof UpdateARTInputSchema>;


// Schema for deleting an ART
export const DeleteARTInputSchema = z.object({
  artKey: z.number(),
  organizationKey: z.number(), // For scoping the delete
  accessToken: z.string(),
});
export type DeleteARTInput = z.infer<typeof DeleteARTInputSchema>;


// Output schema for ART data, including related entities like owners
// This is what the DataTable will consume
export const ARTOutputSchema = selectARTSchema.extend({
  organizationName: z.string().nullable().optional(), // From joined organization table
  createdByName: z.string().nullable().optional(),    // From joined employees table (creator)
  updatedByName: z.string().nullable().optional(),    // From joined employees table (updater)
  owners: z.array(z.object({                         // From joined employeeArt and employees
    ownerEmployeeKey: z.number(),
    ownerName: z.string().nullable().optional(),
    ownerEmail: z.string().email().nullable().optional(),
    ownerAvatar: z.string().nullable().optional(),
  })).optional(),
});
export type ARTOutput = z.infer<typeof ARTOutputSchema>;

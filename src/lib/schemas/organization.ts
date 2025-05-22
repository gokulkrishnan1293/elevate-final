import { z } from "zod";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { organizations } from "@/db/schema/organization"; // Adjust path if necessary

// Base schema for organization, making IDs optional for derivation
export const insertOrganizationSchemaBase = createInsertSchema(organizations, {
  organizationKey: (fieldSchema) => fieldSchema.optional(),
  createdAt: (fieldSchema) => fieldSchema.optional(),
  updatedAt: (fieldSchema) => fieldSchema.optional(),
  createdById: (fieldSchema) => fieldSchema.optional(),
  updatedById: (fieldSchema) => fieldSchema.optional(),
});

// Input schema for createOrganization action
export const CreateOrganizationInputSchema = insertOrganizationSchemaBase.extend({
  organizationName: z.string().min(1, "Organization name is required."),
  accessToken: z.string(),
}).pick({ organizationName: true, accessToken: true });
export type CreateOrganizationInput = z.infer<typeof CreateOrganizationInputSchema>;

// Define a more detailed schema for Organization output including related data
export const organizationOutputSchema = createSelectSchema(organizations).extend({
  createdByName: z.string().nullable().optional(),
  createdByEmail: z.string().email().nullable().optional(),
  updatedByName: z.string().nullable().optional(),
  updatedByEmail: z.string().email().nullable().optional(),
  owners: z.array(z.object({
    ownerName: z.string().nullable().optional(),
    ownerEmail: z.string().email().nullable().optional(),
    ownerAvatar: z.string().nullable().optional(),
    ownerEmployeeKey: z.number().nullable().optional(),
  })).optional(),
});
export type OrganizationOutput = z.infer<typeof organizationOutputSchema>;

// Schema for updating an existing organization
const updateOrganizationBaseSchema = z.object({
  organizationName: z.string().min(1, "Organization name cannot be empty.").optional(),
  // Add other updatable fields from 'organizations' table here if needed
});

export const UpdateOrganizationInputSchema = updateOrganizationBaseSchema.extend({
  accessToken: z.string(),
});
export type UpdateOrganizationInput = z.infer<typeof UpdateOrganizationInputSchema>;

// Schema for deleting an organization
export const DeleteOrganizationInputSchema = z.object({
  organizationKey: z.number(),
  accessToken: z.string(),
});
export type DeleteOrganizationInput = z.infer<typeof DeleteOrganizationInputSchema>;

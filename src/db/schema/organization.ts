import { relations } from "drizzle-orm";
import { elevateSchema } from "..";
import {
  pgTable,
  serial,
  text,
  boolean,
  timestamp,
  varchar,
  index,
  integer,
} from "drizzle-orm/pg-core";
import { employeeOrg, employees } from "./employee";
import { arts } from "./ART";

export const organizations = elevateSchema.table("organization", {
  organizationKey: serial("organization_key").primaryKey(),
  organizationName: varchar("organization_name", { length: 255 })
    .notNull()
    .unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .$onUpdate(() => new Date()),
  createdById: integer("created_by_id"),
  updatedById: integer("updated_by_id"),
});

export const organizationsRelations = relations(
  organizations,
  ({ one, many }) => ({
    createdBy: one(employees, {
      fields: [organizations.createdById],
      references: [employees.employeeKey],
      relationName: "Organization_createdByIdToEmployee",
    }),
    updatedBy: one(employees, {
      fields: [organizations.updatedById],
      references: [employees.employeeKey],
      relationName: "Organization_updatedByIdToEmployee",
    }),
    arts: many(arts),
    employeeOrgLinks: many(employeeOrg),
  })
);

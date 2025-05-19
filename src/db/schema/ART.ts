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
  unique,
} from "drizzle-orm/pg-core";
import { organizations } from "./organization";
import { relations } from "drizzle-orm";
import { employeeArt, employees } from "./employee";
import { teams } from "./team";

export const arts = elevateSchema.table(
  "art",
  {
    artKey: serial("art_key").primaryKey(),
    artName: varchar("art_name", { length: 255 }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .$onUpdate(() => new Date()),
    organizationKey: integer("organization_key")
      .notNull()
      .references(() => organizations.organizationKey, { onDelete: "cascade" }),
    createdById: integer("created_by_id"), // FK to Employee
    updatedById: integer("updated_by_id"), // FK to Employee
  },
  (table) => {
    return {
      nameOrgUnique: unique("art_name_organization_id_unique").on(
        table.artName,
        table.organizationKey
      ),
      organizationIdIdx: index("art_organization_id_idx").on(
        table.organizationKey
      ),
      createdByIdIdx: index("art_created_by_id_idx").on(table.createdById),
      updatedByIdIdx: index("art_updated_by_id_idx").on(table.updatedById),
    };
  }
);

export const artsRelations = relations(arts, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [arts.organizationKey],
    references: [organizations.organizationKey],
  }),
  createdBy: one(employees, {
    fields: [arts.createdById],
    references: [employees.employeeKey],
    relationName: "ART_createdByIdToEmployee",
  }),
  updatedBy: one(employees, {
    fields: [arts.updatedById],
    references: [employees.employeeKey],
    relationName: "ART_updatedByIdToEmployee",
  }),
  employeeArtLinks: many(employeeArt),
  teams: many(teams),
}));

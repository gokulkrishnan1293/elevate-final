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
import { arts } from "./ART";
import { relations } from "drizzle-orm";
import { employees, employeeTeam } from "./employee";
import { organizations } from "./organization";

export const teams = elevateSchema.table(
  "team",
  {
    teamKey: serial("team_key").primaryKey(),
    teamName: varchar("team_name", { length: 255 }).notNull(),
    artKey: integer("art_key")
      .notNull()
      .references(() => arts.artKey, { onDelete: "cascade" }),
    organizationKey: integer("organization_key")
      .notNull()
      .references(() => organizations.organizationKey, { onDelete: "cascade" }), // Corrected reference
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .$onUpdate(() => new Date()),
    createdById: integer("created_by_id"),
    updatedById: integer("updated_by_id"),
  },
  (table) => {
    return {
      nameArtIdUnique: unique("team_name_art_id_unique").on(
        table.teamName,
        table.artKey
      ),
      artIdIdx: index("team_art_id_idx").on(table.artKey),
      organizationIdIdx: index("team_organization_id_idx").on(
        table.organizationKey
      ),
      createdByIdIdx: index("team_created_by_id_idx").on(table.createdById),
      updatedByIdIdx: index("team_updated_by_id_idx").on(table.updatedById),
    };
  }
);

export const teamsRelations = relations(teams, ({ one, many }) => ({
  art: one(arts, {
    fields: [teams.artKey],
    references: [arts.artKey],
  }),
  organization: one(organizations, {
    fields: [teams.organizationKey],
    references: [organizations.organizationKey],
  }),
  createdBy: one(employees, {
    fields: [teams.createdById],
    references: [employees.employeeKey],
    relationName: "Team_createdByIdToEmployee",
  }),
  updatedBy: one(employees, {
    fields: [teams.updatedById],
    references: [employees.employeeKey],
    relationName: "Team_updatedByIdToEmployee",
  }),
  employeeTeamLinks: many(employeeTeam),
}));

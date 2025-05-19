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
  primaryKey,
} from "drizzle-orm/pg-core";
import { organizations } from "./organization";
import { arts } from "./ART";
import { teams } from "./team";

export const employees = elevateSchema.table(
  "employee",
  {
    employeeKey: serial("employee_key").primaryKey(),
    firstName: varchar("first_name", { length: 255 }).notNull(),
    lastName: varchar("last_name", { length: 255 }).notNull(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    lanId: varchar("lan_id", { length: 255 }).notNull().unique(),
    cignaManagerId: varchar("cigna_manager_lan_id", { length: 255 }),
    isContractor: boolean("is_contractor").default(true).notNull(),
    isUserActive: boolean("is_user_active").default(true).notNull(),
    profilePhoto: text("profile_photo"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => {
    return {
      cignaManagerIdIdx: index("employee_cigna_manager_id_idx").on(
        table.cignaManagerId
      ),
      emailIdx: index("employee_email_idx").on(table.email),
      lanIdIdx: index("employee_lan_id_idx").on(table.lanId),
    };
  }
);

export const employeeOrg = elevateSchema.table(
  "employee_org",
  {
    employeeKey: integer("employee_key")
      .notNull()
      .references(() => employees.employeeKey, { onDelete: "cascade" }),
    organizationKey: integer("organization_key")
      .notNull()
      .references(() => organizations.organizationKey, {
        onDelete: "no action",
        onUpdate: "no action",
      }),
    orgOwner: boolean("org_owner").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .$onUpdate(() => new Date()),
    createdById: integer("created_by_id"),
    updatedById: integer("updated_by_id"),
  },
  (table) => {
    return {
      pk: primaryKey({
        columns: [table.employeeKey, table.organizationKey],
        name: "employee_org_link_pkey",
      }),
      employeeIdIdx: index("employee_org_link_employee_id_idx").on(
        table.employeeKey
      ),
      organizationIdIdx: index("employee_org_link_organization_id_idx").on(
        table.organizationKey
      ),
    };
  }
);

export const employeeArt = elevateSchema.table(
  "employee_art",
  {
    employeeKey: integer("employee_key")
      .notNull()
      .references(() => employees.employeeKey, { onDelete: "cascade" }),
    artKey: integer("art_key")
      .notNull()
      .references(() => arts.artKey, { onDelete: "cascade" }),
    artOwner: boolean("art_owner").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .$onUpdate(() => new Date()),
    createdById: integer("created_by_id"),
    updatedById: integer("updated_by_id"),
  },
  (table) => {
    return {
      pk: primaryKey({
        columns: [table.employeeKey, table.artKey],
        name: "employee_art_link_pkey",
      }),
      artIdIdx: index("employee_art_link_art_id_idx").on(table.artKey),
      employeeIdIdx: index("employee_art_link_employee_id_idx").on(
        table.employeeKey
      ),
    };
  }
);

export const employeeTeam = elevateSchema.table(
  "employee_team",
  {
    employeeKey: integer("employee_key")
      .notNull()
      .references(() => employees.employeeKey, { onDelete: "cascade" }),
    teamKey: integer("team_key")
      .notNull()
      .references(() => teams.teamKey, { onDelete: "cascade" }),
    jobTitle: varchar("job_title", { length: 255 }).notNull(),
    teamOwner: boolean("team_owner").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .$onUpdate(() => new Date()),
    createdById: integer("created_by_id"),
    updatedById: integer("updated_by_id"),
  },
  (table) => {
    return {
      pk: primaryKey({
        columns: [table.employeeKey, table.teamKey, table.jobTitle],
        name: "employee_team_link_pkey",
      }),
      employeeIdIdx: index("employee_team_link_employee_id_idx").on(
        table.employeeKey
      ),
      teamIdIdx: index("employee_team_link_team_id_idx").on(table.teamKey),
    };
  }
);

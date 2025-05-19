import { elevateSchema } from "..";
import {
  pgTable,
  serial,
  text,
  boolean,
  timestamp,
  varchar,
  index,
} from "drizzle-orm/pg-core";

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

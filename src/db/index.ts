import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { pgSchema } from "drizzle-orm/pg-core";

export const db = drizzle(process.env.DATABASE_URL!);

export const elevateSchema = pgSchema("elevate");

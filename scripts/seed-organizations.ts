import { db } from "../src/db"; // Adjust path as necessary
import { organizations } from "../src/db/schema/organization"; // Adjust path as necessary
import { sql } from "drizzle-orm";

const NUM_ORGANIZATIONS_TO_SEED = 100;
const ORG_NAME_PREFIX = "Seeded Org ";

async function seedOrganizations() {
  console.log("Starting to seed organizations...");

  const organizationsToInsert: (typeof organizations.$inferInsert)[] = [];

  for (let i = 1; i <= NUM_ORGANIZATIONS_TO_SEED; i++) {
    organizationsToInsert.push({
      organizationName: `${ORG_NAME_PREFIX}${i}`,
      // createdById and updatedById will be null by default
      // createdAt and updatedAt will be handled by the database/Drizzle
    });
  }

  try {
    // Drizzle doesn't have a simple batch insert that returns all inserted rows by default with all drivers
    // We'll insert them one by one or use a batch if available and simple
    // For this example, let's insert them in chunks or one by one to show progress and handle potential issues.
    // However, a single insertMany is more efficient if the DB driver supports it well.

    console.log(`Preparing to insert ${organizationsToInsert.length} organizations...`);
    
    // Using db.insert for batch insertion
    const result = await db.insert(organizations).values(organizationsToInsert).returning({
        insertedId: organizations.organizationKey,
        name: organizations.organizationName
    });

    console.log(`Successfully seeded ${result.length} organizations.`);
    if (result.length !== NUM_ORGANIZATIONS_TO_SEED) {
        console.warn(`Expected to seed ${NUM_ORGANIZATIONS_TO_SEED} but only ${result.length} were reported as inserted.`);
    }

  } catch (error) {
    console.error("Error seeding organizations:", error);
    // Check if it's a unique constraint violation
    if (error instanceof Error && error.message.includes("duplicate key value violates unique constraint")) {
        console.error("It seems some organizations with these names already exist. Consider running the cleanup script first.");
    }
    process.exit(1); // Exit with error
  }

  console.log("Organization seeding finished.");
  process.exit(0); // Exit successfully
}

seedOrganizations();

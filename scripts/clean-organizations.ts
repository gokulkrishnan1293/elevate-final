import { db } from "../src/db"; // Adjust path as necessary
import { organizations } from "../src/db/schema/organization"; // Adjust path as necessary
import { like, sql } from "drizzle-orm";

const ORG_NAME_PREFIX_FOR_CLEANUP = "Seeded Org ";

async function cleanOrganizations() {
  console.log(`Starting to clean up organizations with prefix: "${ORG_NAME_PREFIX_FOR_CLEANUP}"...`);

  try {
    const result = await db
      .delete(organizations)
      .where(like(organizations.organizationName, `${ORG_NAME_PREFIX_FOR_CLEANUP}%`))
      .returning({
        deletedId: organizations.organizationKey,
        deletedName: organizations.organizationName,
      });

    if (result.length > 0) {
      console.log(`Successfully deleted ${result.length} organizations:`);
      result.forEach(org => console.log(`  - ID: ${org.deletedId}, Name: ${org.deletedName}`));
    } else {
      console.log("No organizations found matching the prefix to delete.");
    }

  } catch (error) {
    console.error("Error cleaning organizations:", error);
    process.exit(1); // Exit with error
  }

  console.log("Organization cleanup finished.");
  process.exit(0); // Exit successfully
}

cleanOrganizations();

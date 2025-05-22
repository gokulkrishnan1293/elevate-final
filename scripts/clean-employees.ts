import { db } from "../src/db"; // Adjust path as necessary
import { employees } from "../src/db/schema/employee"; // Adjust path as necessary
import { like } from "drizzle-orm";

const EMPLOYEE_LANID_PREFIX_FOR_CLEANUP = "seededlan";

async function cleanEmployees() {
  console.log(`Starting to clean up employees with LAN ID prefix: "${EMPLOYEE_LANID_PREFIX_FOR_CLEANUP}"...`);

  try {
    const result = await db
      .delete(employees)
      .where(like(employees.lanId, `${EMPLOYEE_LANID_PREFIX_FOR_CLEANUP}%`))
      .returning({
        deletedId: employees.employeeKey,
        deletedLanId: employees.lanId,
      });

    if (result.length > 0) {
      console.log(`Successfully deleted ${result.length} employees:`);
      result.forEach(emp => console.log(`  - ID: ${emp.deletedId}, LAN ID: ${emp.deletedLanId}`));
    } else {
      console.log("No employees found matching the LAN ID prefix to delete.");
    }

  } catch (error) {
    console.error("Error cleaning employees:", error);
    process.exit(1); // Exit with error
  }

  console.log("Employee cleanup finished.");
  process.exit(0); // Exit successfully
}

cleanEmployees();

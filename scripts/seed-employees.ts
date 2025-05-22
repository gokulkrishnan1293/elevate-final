import { db } from "../src/db"; // Adjust path as necessary
import { employees } from "../src/db/schema/employee"; // Adjust path as necessary

const NUM_EMPLOYEES_TO_SEED = 100;
const EMPLOYEE_FN_PREFIX = "SeededFn";
const EMPLOYEE_LN_PREFIX = "SeededLn";
const EMPLOYEE_EMAIL_DOMAIN = "example.com";
const EMPLOYEE_LANID_PREFIX = "seededlan";

async function seedEmployees() {
  console.log("Starting to seed employees...");

  const employeesToInsert: (typeof employees.$inferInsert)[] = [];

  for (let i = 1; i <= NUM_EMPLOYEES_TO_SEED; i++) {
    employeesToInsert.push({
      firstName: `${EMPLOYEE_FN_PREFIX}${i}`,
      lastName: `${EMPLOYEE_LN_PREFIX}${i}`,
      email: `${EMPLOYEE_LANID_PREFIX}${i}@${EMPLOYEE_EMAIL_DOMAIN}`, // Using LAN ID prefix for email too for uniqueness
      lanId: `${EMPLOYEE_LANID_PREFIX}${i}`,
      // isContractor and isUserActive will use default values from the schema
      // cignaManagerId and profilePhoto will be null
      // createdAt and updatedAt will be handled by the database/Drizzle
    });
  }

  try {
    console.log(`Preparing to insert ${employeesToInsert.length} employees...`);
    
    const result = await db.insert(employees).values(employeesToInsert).returning({
        insertedId: employees.employeeKey,
        lanId: employees.lanId
    });

    console.log(`Successfully seeded ${result.length} employees.`);
    if (result.length !== NUM_EMPLOYEES_TO_SEED) {
        console.warn(`Expected to seed ${NUM_EMPLOYEES_TO_SEED} but only ${result.length} were reported as inserted.`);
    }

  } catch (error) {
    console.error("Error seeding employees:", error);
    if (error instanceof Error && error.message.includes("duplicate key value violates unique constraint")) {
        console.error("It seems some employees with these emails or LAN IDs already exist. Consider running the cleanup script first.");
    }
    process.exit(1); // Exit with error
  }

  console.log("Employee seeding finished.");
  process.exit(0); // Exit successfully
}

seedEmployees();

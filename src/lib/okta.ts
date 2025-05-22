import OktaJwtVerifier from "@okta/jwt-verifier";
import { db } from "@/db";
import { employees } from "@/db/schema/employee";
import { eq } from "drizzle-orm";

export const oktaJwtVerifier = new OktaJwtVerifier({
  issuer: process.env.OKTA_ISSUER || '', // Ensure these are set in your .env
  clientId: process.env.OKTA_CLIENT_ID || '', // Ensure these are set in your .env
});

/**
 * Verifies an Okta access token, extracts the user's email from the 'sub' claim,
 * and retrieves the corresponding employeeKey (actor ID) from the database.
 *
 * @param accessToken The Okta access token string.
 * @returns The employeeKey if successful, or null if verification fails,
 *          email is not found in token, or employee is not found in DB.
 */
export async function getActorIdFromToken(accessToken: string): Promise<number | null> {
  if (!accessToken) {
    console.error("Access token not provided to getActorIdFromToken.");
    return null;
  }

  try {
    // The audience parameter is typically the same as your clientId for the default authorization server,
    // or your custom authorization server identifier (e.g., 'api://default').
    // Ensure this matches your Okta application setup.
    // Using OKTA_CLIENT_ID as a placeholder for audience, adjust if your setup differs.
    const audience = 'api://default';
    const jwt = await oktaJwtVerifier.verifyAccessToken(accessToken, audience); 
    
    const userEmail = jwt.claims?.email || jwt.claims.sub; // Assuming 'sub' claim contains the email. Verify this for your Okta setup.
    
    if (typeof userEmail !== 'string' || !userEmail) {
      console.error("Email (sub claim) not found or invalid in token.");
      return null;
    }

    // Fetch employeeKey from database using the email
    const result = await db
      .select({ employeeKey: employees.employeeKey })
      .from(employees)
      .where(eq(employees.email, userEmail))
      .limit(1);

    if (result.length > 0) {
      return result[0].employeeKey;
    } else {
      console.warn(`No employee found with email: ${userEmail} from token.`);
      return null;
    }
  } catch (error) {
    console.error("Error verifying access token or fetching employee by email:", error);
    return null;
  }
}

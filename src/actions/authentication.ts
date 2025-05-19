"use server";

import { db } from "@/db";
import { employees } from "@/db/schema/employee";
import { eq } from "drizzle-orm";
import { type z } from "zod";
import { createInsertSchema } from "drizzle-zod";

const employeeSchema = createInsertSchema(employees, {
  createdAt: (fieldSchema) => fieldSchema.optional(),
  updatedAt: (fieldSchema) => fieldSchema.optional(),
});
export type EmployeeInput = z.infer<typeof employeeSchema>;

export async function upsertEmployee(employeeData: EmployeeInput) {
  if (!employeeData.lanId) {
    return { success: false, message: "LAN ID is required." };
  }

  try {
    const existingEmployee = await db
      .select()
      .from(employees)
      .where(eq(employees.lanId, employeeData.lanId))
      .limit(1);

    if (existingEmployee.length > 0 && existingEmployee[0].employeeKey) {
      const updateData: Partial<typeof employees.$inferInsert> = {};
      for (const key in employeeData) {
        if (employeeData[key as keyof EmployeeInput] !== undefined) {
          (updateData as any)[key] = employeeData[key as keyof EmployeeInput];
        }
      }

      delete updateData.employeeKey;

      if (Object.keys(updateData).length === 0) {
        return {
          success: true,
          message: "No fields to update.",
          data: existingEmployee[0],
        };
      }

      const updatedResult = await db
        .update(employees)
        .set({
          ...updateData,
          updatedAt: new Date(),
        })
        .where(eq(employees.lanId, employeeData.lanId))
        .returning();

      if (updatedResult.length > 0) {
        return {
          success: true,
          message: "Employee updated successfully.",
          data: updatedResult[0],
        };
      } else {
        return {
          success: false,
          message:
            "Failed to update employee: Employee not found after initial check.",
        };
      }
    } else {
      const insertData: typeof employees.$inferInsert = {
        firstName: employeeData.firstName ?? "", // Provide default or handle validation
        lastName: employeeData.lastName ?? "", // Provide default or handle validation
        email: employeeData.email ?? "", // Provide default or handle validation
        lanId: employeeData.lanId,
        cignaManagerId: employeeData.cignaManagerId,
        isContractor:
          employeeData.isContractor === undefined
            ? true
            : employeeData.isContractor,
        isUserActive:
          employeeData.isUserActive === undefined
            ? true
            : employeeData.isUserActive,
        profilePhoto: employeeData.profilePhoto,

        updatedAt: new Date(),
      };

      if (
        !insertData.firstName ||
        !insertData.lastName ||
        !insertData.email ||
        !insertData.lanId
      ) {
        return {
          success: false,
          message:
            "Missing required fields for new employee (firstName, lastName, email, lanId).",
        };
      }

      const newEmployee = await db
        .insert(employees)
        .values(insertData)
        .returning();

      if (newEmployee.length > 0) {
        return {
          success: true,
          message: "Employee inserted successfully.",
          data: newEmployee[0],
        };
      } else {
        return { success: false, message: "Failed to insert new employee." };
      }
    }
  } catch (error) {
    console.error("Error in upsertEmployee:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred.";
    return {
      success: false,
      message: `Database operation failed: ${errorMessage}`,
    };
  }
}

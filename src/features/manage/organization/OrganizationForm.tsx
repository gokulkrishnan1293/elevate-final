"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { getEmployees, EmployeeOutput } from "@/actions/employee";
import { OrganizationOutput } from "@/lib/schemas/organization"; // Updated import path
import { FormFieldInput } from "@/components/form/FormFieldInput";
import { FormFieldSelect } from "@/components/form/FormFieldSelect";

// Zod Schema for form validation
const organizationFormSchema = z.object({
  organizationName: z.string().min(1, "Organization name is required."),
  ownerEmployeeKey: z.string().min(1, "Organization owner is required."), // Store as string due to Select component value
});

export type OrganizationFormData = z.infer<typeof organizationFormSchema>;

interface OrganizationFormProps {
  onSubmit: (data: OrganizationFormData) => Promise<void>;
  defaultValues?: Partial<OrganizationOutput>; // For pre-populating the form in edit mode
  isLoading?: boolean;
}

export function OrganizationForm({
  onSubmit,
  defaultValues,
  isLoading,
}: OrganizationFormProps) {
  const [employees, setEmployees] = useState<EmployeeOutput[]>([]);
  const [employeesLoading, setEmployeesLoading] = useState(true);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<OrganizationFormData>({
    resolver: zodResolver(organizationFormSchema),
    defaultValues: {
      organizationName: defaultValues?.organizationName || "",
      ownerEmployeeKey: defaultValues?.ownerEmployeeKey?.toString() || "",
    },
  });

  useEffect(() => {
    async function fetchEmployeesData() {
      setEmployeesLoading(true);
      try {
        const result = await getEmployees();
        if (result.success && result.data) {
          setEmployees(result.data);
        } else {
          console.error("Failed to fetch employees:", result.message);
          // Handle error (e.g., show a toast)
        }
      } catch (error) {
        console.error("Error fetching employees:", error);
      } finally {
        setEmployeesLoading(false);
      }
    }
    fetchEmployeesData();
  }, []);

  useEffect(() => {
    // Reset form when defaultValues change (e.g., when switching to edit mode)
    if (defaultValues) {
      reset({
        organizationName: defaultValues.organizationName || "",
        ownerEmployeeKey: defaultValues.ownerEmployeeKey?.toString() || "",
      });
    } else {
      reset({
        organizationName: "",
        ownerEmployeeKey: "",
      });
    }
  }, [defaultValues, reset]);

  const handleFormSubmit = async (data: OrganizationFormData) => {
    await onSubmit(data);
  };

  const employeeOptions = employees.map((employee) => ({
    value: employee.employeeKey.toString(),
    label: `${employee.firstName} ${employee.lastName} (${employee.email})`,
  }));

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 overflow-hidden w-full"> {/* Added w-full */}
      <FormFieldInput<OrganizationFormData>
        control={control}
        name="organizationName"
        label="Organization Name"
        errors={errors}
        disabled={isLoading}
        containerClassName="space-y-1"
      />

      <FormFieldSelect<OrganizationFormData>
        control={control}
        name="ownerEmployeeKey"
        label="Organization Owner"
        placeholder="Select an owner"
        options={employeeOptions}
        errors={errors}
        isLoading={employeesLoading}
        disabled={isLoading}
        loadingMessage="Loading employees..."
        noOptionsMessage="No employees found"
        containerClassName="space-y-1 w-full overflow-hidden text-ellipsis whitespace-nowrap" // Added overflow handling
      />

      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? "Saving..." : "Save Organization"}
      </Button>
    </form>
  );
}

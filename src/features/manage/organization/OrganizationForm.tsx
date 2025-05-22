"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { getEmployees, EmployeeOutput } from "@/actions/employee";
import { OrganizationOutput } from "@/lib/schemas/organization";
import { FormFieldInput } from "@/components/form/FormFieldInput";
// import { FormFieldSelect } from "@/components/form/FormFieldSelect"; // No longer used
import { MultiSelectFormField } from "@/components/form/MultiSelectFormField"; // Import MultiSelect

// Zod Schema for form validation
const organizationFormSchema = z.object({
  organizationName: z.string().min(1, "Organization name is required."),
  ownerEmployeeKeys: z.array(z.string()).min(1, "At least one organization owner is required."), // Changed to array
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
      ownerEmployeeKeys: defaultValues?.owners?.map(owner => owner.ownerEmployeeKey!.toString()) || [],
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
        ownerEmployeeKeys: defaultValues.owners?.map(owner => owner.ownerEmployeeKey!.toString()) || [],
      });
    } else {
      reset({
        organizationName: "",
        ownerEmployeeKeys: [],
      });
    }
  }, [defaultValues, reset]);

  const handleFormSubmit = async (data: OrganizationFormData) => {
    await onSubmit(data);
  };

  const employeeOptions = employees.map((employee) => ({
    value: employee.employeeKey.toString(), // Ensure value is string
    label: `${employee.firstName} ${employee.lastName}`,
  }));

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 w-full">
      <FormFieldInput<OrganizationFormData>
        control={control}
        name="organizationName"
        label="Organization Name"
        errors={errors}
        disabled={isLoading}
        containerClassName="space-y-1"
      />

      <MultiSelectFormField<OrganizationFormData>
        control={control}
        name="ownerEmployeeKeys"
        label="Organization Owners"
        placeholder="Select owners..."
        options={employeeOptions}
        disabled={isLoading || employeesLoading} // Combine loading states for disabled prop
        modalPopover={true}
      />

      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? "Saving..." : "Save Organization"}
      </Button>
    </form>
  );
}

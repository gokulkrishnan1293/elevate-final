"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form"; // Import the Form component
import { getEmployees } from "@/actions/employee";
import { EmployeeOutput } from "@/lib/schemas/employee";
import { ARTOutput } from "@/lib/schemas/art"; // Using the ARTOutput for defaultValues
import { FormFieldInput } from "@/components/form/FormFieldInput";
import { MultiSelectFormField } from "@/components/form/MultiSelectFormField";
import { toast } from "sonner";

// Zod Schema for ART form validation
const artFormSchema = z.object({
  artName: z.string().min(1, "ART name is required."),
  // organizationKey is not directly in the form, but passed to onSubmit handler from modal
  ownerEmployeeKeys: z.array(z.string()).min(1, "At least one ART owner is required."),
});

export type ARTFormData = z.infer<typeof artFormSchema>;

interface ARTFormProps {
  onSubmit: (data: ARTFormData & { organizationKey: number; accessToken?: string }) => Promise<void>;
  defaultValues?: Partial<ARTOutput>; // For pre-populating the form in edit mode
  isLoading?: boolean;
  organizationKey: number; // Passed from the modal, used in onSubmit
  accessToken?: string; // Passed from the modal
  onCancel: () => void; // Added for cancel functionality
  mode: "create" | "edit"; // To adjust button text
}

export function ARTForm({
  onSubmit,
  defaultValues,
  isLoading,
  organizationKey,
  accessToken,
  onCancel,
  mode,
}: ARTFormProps) {
  const [employees, setEmployees] = useState<EmployeeOutput[]>([]);
  const [employeesLoading, setEmployeesLoading] = useState(true);

  const form = useForm<ARTFormData>({
    resolver: zodResolver(artFormSchema),
    defaultValues: {
      artName: defaultValues?.artName || "",
      ownerEmployeeKeys: defaultValues?.owners?.map(owner => owner.ownerEmployeeKey.toString()) || [],
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
          toast.error("Failed to load employee list for owners.");
        }
      } catch (error) {
        console.error("Error fetching employees:", error);
        toast.error("An error occurred while fetching employees.");
      } finally {
        setEmployeesLoading(false);
      }
    }
    fetchEmployeesData();
  }, []);

  useEffect(() => {
    if (defaultValues) {
      form.reset({
        artName: defaultValues.artName || "",
        ownerEmployeeKeys: defaultValues.owners?.map(owner => owner.ownerEmployeeKey.toString()) || [],
      });
    } else {
      form.reset({
        artName: "",
        ownerEmployeeKeys: [],
      });
    }
  }, [defaultValues, form.reset]);

  const handleFormSubmit = async (data: ARTFormData) => {
    // Add organizationKey and accessToken before submitting
    await onSubmit({ 
        ...data, 
        organizationKey: organizationKey,
        accessToken: accessToken 
    });
  };

  const employeeOptions = employees.map((employee) => ({
    value: employee.employeeKey.toString(),
    label: `${employee.firstName} ${employee.lastName} (${employee.email})`,
  }));

  return (
    <Form {...form}> {/* Wrap with Form provider */}
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6 w-full">
        <FormFieldInput<ARTFormData>
          control={form.control}
          name="artName"
          label="ART Name"
          errors={form.formState.errors}
          disabled={isLoading}
          containerClassName="space-y-1"
        />

        <MultiSelectFormField<ARTFormData>
          control={form.control}
          name="ownerEmployeeKeys"
          label="ART Owners"
          placeholder="Select owners..."
           errors={form.formState.errors}
          options={employeeOptions}
          disabled={isLoading || employeesLoading}
          //modalPopover={true} // Assuming this prop is used as in OrganizationForm
        />
        
        <div className="flex justify-end space-x-4 pt-4">
            <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
                Cancel
            </Button>
            <Button type="submit" disabled={isLoading || employeesLoading}>
                {isLoading ? (mode === "create" ? "Creating..." : "Updating...") : (mode === "create" ? "Create ART" : "Update ART")}
            </Button>
        </div>
      </form>
    </Form>
  );
}

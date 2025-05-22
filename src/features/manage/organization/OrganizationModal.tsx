"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter, // If needed for explicit footer buttons outside the form
} from "@/components/ui/dialog";
import { OrganizationForm, OrganizationFormData } from "./OrganizationForm";
import {
  createOrganization,
  updateOrganization,
} from "@/actions/organization";
import { OrganizationOutput } from "@/lib/schemas/organization"; // Updated import path
import { setOrganizationOwner } from "@/actions/employee";
import { toast } from "sonner";
import { useOktaAuth } from "@okta/okta-react"; // Import useOktaAuth

interface OrganizationModalProps {
  isOpen: boolean;
  mode: "create" | "edit";
  organizationData?: OrganizationOutput | null; // For pre-filling in edit mode
  onClose: () => void;
  onSuccess: () => void; // To refresh data in the parent table
}

export function OrganizationModal({
  isOpen,
  mode,
  organizationData,
  onClose,
  onSuccess,
}: OrganizationModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { authState } = useOktaAuth(); // Get authState

  const handleSubmit = async (formData: OrganizationFormData) => {
    setIsLoading(true);
    const accessToken = authState?.accessToken?.accessToken;

    if (!accessToken) {
      toast.error("Authentication token not found. Please log in again.");
      setIsLoading(false);
      return;
    }

    try {
      // Convert ownerEmployeeKeys from string array to number array
      const ownerKeysAsNumbers = formData.ownerEmployeeKeys.map(key => parseInt(key, 10)).filter(key => !isNaN(key));
      
      if (ownerKeysAsNumbers.length !== formData.ownerEmployeeKeys.length) {
        toast.error("Some selected owner IDs are invalid.");
        setIsLoading(false);
        return;
      }
      if (ownerKeysAsNumbers.length === 0 && mode === "create") { // For create, at least one owner is expected by form schema
        toast.error("At least one organization owner must be selected.");
        setIsLoading(false);
        return;
      }


      if (mode === "create") {
        const createResult = await createOrganization({
          organizationName: formData.organizationName,
          accessToken: accessToken, // Add accessToken
        });

        

        if (createResult.success && createResult.data) {
          // Now set the owners using employeeOrg link
          const setOwnerResult = await setOrganizationOwner({
            organizationKey: createResult.data.organizationKey,
            ownerEmployeeKeys: ownerKeysAsNumbers,
            accessToken: accessToken,
          });
          if (setOwnerResult.success) {
            toast.success("Organization created and owners assigned successfully!");
            onSuccess();
          } else {
            // Org created, but owner setting failed. This is a partial success/failure state.
            // Might need a way to communicate this. For now, log and show error.
            console.error("Org created, but failed to set owner:", setOwnerResult.message);
            // setError(`Organization created, but failed to set owner: ${setOwnerResult.message}`); // Replaced by toast
            toast.error(`Organization created, but failed to set owner: ${setOwnerResult.message}`);
          }
        } else {
          // setError(createResult.message || "Failed to create organization."); // Replaced by toast
          toast.error(createResult.message || "Failed to create organization.");
        }
      } else if (mode === "edit" && organizationData) {
        const updateResult = await updateOrganization(
          organizationData.organizationKey,
          {
            organizationName: formData.organizationName,
            accessToken: accessToken, // Add accessToken
          }
        );

        if (updateResult.success && updateResult.data) {
          // For edit mode, we always call setOrganizationOwner with the new list of owners.
          // The server action `setOrganizationOwner` is responsible for figuring out diffs (add/remove).
          const setOwnerResult = await setOrganizationOwner({
            organizationKey: organizationData.organizationKey,
            ownerEmployeeKeys: ownerKeysAsNumbers, // Pass the full new list
            accessToken: accessToken,
          });

          if (setOwnerResult.success) {
            toast.success("Organization and owners updated successfully!");
            onSuccess();
          } else {
            console.error("Org updated, but failed to update owner(s):", setOwnerResult.message);
            toast.error(`Organization updated, but failed to update owner(s): ${setOwnerResult.message}`);
          }
        } else {
          toast.error(updateResult.message || "Failed to update organization.");
        }
      }
    } catch (err) {
      console.error("Error submitting organization form:", err);
      // setError(err instanceof Error ? err.message : "An unexpected error occurred."); // Replaced by toast
      toast.error(err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  // Close dialog if isOpen becomes false (controlled externally)
  if (!isOpen) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Create Organization" : "Edit Organization"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Fill in the details to create a new organization."
              : "Update the details of the organization."}
          </DialogDescription>
        </DialogHeader>
        
        <OrganizationForm
          onSubmit={handleSubmit}
          defaultValues={mode === "edit" && organizationData ? organizationData : undefined}
          isLoading={isLoading}
        />

        {/* {error && <p className="text-sm text-red-500 mt-2">{error}</p>} Replaced by toast */}
        
      </DialogContent>
    </Dialog>
  );
}

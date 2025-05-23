"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter, // If needed for custom footers, though form has its own
} from "@/components/ui/dialog";
import { ARTForm, ARTFormData } from "./ARTForm";
import { ARTOutput, CreateARTInput, UpdateARTInput } from "@/lib/schemas/art";
import { createART, updateART } from "@/actions/ART";
import { toast } from "sonner";
import { useOktaAuth } from "@okta/okta-react";

interface ARTModalProps {
  isOpen: boolean;
  mode: "create" | "edit";
  artData?: ARTOutput | null;
  organizationKey: number; // Crucial for creating/associating ART
  onClose: () => void;
  onSuccess: () => void; // Callback after successful operation
}

export function ARTModal({
  isOpen,
  mode,
  artData,
  organizationKey,
  onClose,
  onSuccess,
}: ARTModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { authState } = useOktaAuth();
  const accessToken = authState?.accessToken?.accessToken;

  const handleSubmit = async (formData: ARTFormData & { organizationKey: number; accessToken?: string }) => {
    setIsLoading(true);
    
    if (!accessToken) {
        toast.error("Authentication token not found. Please log in again.");
        setIsLoading(false);
        return;
    }

    // Ensure ownerEmployeeKeys is an array of numbers
    const ownerKeysAsNumbers = formData.ownerEmployeeKeys.map(key => parseInt(key, 10)).filter(key => !isNaN(key));

    try {
      let result;
      if (mode === "create") {
        const createData: CreateARTInput = {
          artName: formData.artName,
          organizationKey: organizationKey, // Use the orgKey from props
          ownerEmployeeKeys: ownerKeysAsNumbers,
          accessToken: accessToken,
        };
        result = await createART(createData);
      } else if (artData?.artKey) {
        const updateData: UpdateARTInput = {
          artName: formData.artName,
          organizationKey: organizationKey, // Pass the current organizationKey for scoping
          ownerEmployeeKeys: ownerKeysAsNumbers,
          accessToken: accessToken,
        };
        result = await updateART(artData.artKey, updateData);
      } else {
        throw new Error("Invalid mode or missing ART data for edit.");
      }

      if (result.success) {
        toast.success(`ART ${mode === "create" ? "created" : "updated"} successfully!`);
        onSuccess();
      } else {
        toast.error(`Failed to ${mode} ART: ${result.message || "Unknown error"}`);
      }
    } catch (error) {
      console.error(`Error ${mode} ART:`, error);
      toast.error(`An unexpected error occurred while ${mode === "create" ? "creating" : "updating"} the ART.`);
    } finally {
      setIsLoading(false);
    }
  };

  // Reset form state or isLoading when modal is closed or mode changes
  useEffect(() => {
    if (!isOpen) {
      setIsLoading(false);
    }
  }, [isOpen]);

  const dialogTitle = mode === "create" ? "Create New ART" : `Edit ART: ${artData?.artName || ""}`;
  const dialogDescription =
    mode === "create"
      ? "Fill in the details below to create a new Agile Release Train."
      : `Update the details of the Agile Release Train.`;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[525px]"
      onEscapeKeyDown={(e) => e.preventDefault()}
      onInteractOutside={(e) => {
          e.preventDefault();
        }}>
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
          <DialogDescription>{dialogDescription}</DialogDescription>
        </DialogHeader>
        <ARTForm
          mode={mode}
          defaultValues={artData || undefined} // Ensure undefined if artData is null
          organizationKey={organizationKey} // Pass this down
          onSubmit={handleSubmit}
          onCancel={onClose}
          isLoading={isLoading}
          accessToken={accessToken}
        />
      </DialogContent>
    </Dialog>
  );
}

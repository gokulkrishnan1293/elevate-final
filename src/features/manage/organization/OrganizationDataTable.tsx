"use client";

import React, { useEffect, useState } from "react";
import { DataTable } from "@/components/data-table/DataTable";
import { getOrganizations, deleteOrganization } from "@/actions/organization";
import { OrganizationOutput } from "@/lib/schemas/organization"; // Updated import path
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import {Button as MovingButton} from "@/components/ui/moving-border";
import { ArrowUpDown, FilePenLine, Trash2, PlusCircle, PlusIcon, PlusCircleIcon } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { OrganizationModal } from "./OrganizationModal";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { toast } from "sonner";
import { useCallback, useMemo } from "react";
import { useOktaAuth } from "@okta/okta-react"; // Import useOktaAuth
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { AnimatedTooltip } from "@/components/ui/animated-tooltip";
import { GlowingEffect } from "@/components/ui/glowing-effect";
import { TypewriterEffectSmooth } from "@/components/ui/typewriter-effect";

// Define a function that returns column definitions
// Adjusted handleDeleteOrganizationConfirm to accept OrganizationOutput
const getOrganizationTableColumns = (
  handleEditOrganization: (organization: OrganizationOutput) => void,
  handleDeleteOrganizationConfirm: (organization: OrganizationOutput) => void // Changed parameter type
): ColumnDef<OrganizationOutput>[] => [
  {
    accessorKey: "organizationName",
    meta: { headerTitle: "Organization Name" }, // Moved headerTitle to meta
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Organization Name" />
    ),
  },
  {
    accessorKey: "owners",
    meta: { headerTitle: "Organization Owners" }, // Added headerTitle to meta
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Organization Owners" />
    ),
    cell: ({ row }) => {
      const owners = row.original.owners;

      if (!owners || owners.length === 0) {
        return <div>N/A</div>;
      }

      // Displaying multiple avatars could be complex here.
      // For now, let's list names and show avatars in a tooltip or a more detailed view if needed.
      // This example will show the first owner's avatar and a count for others.
      // A more robust UI might involve a popover or a dedicated component for multiple users.
      return (
        <div className="flex flex-row  w-full">
          <AnimatedTooltip owners={owners} />
        </div>
      );
    },
  },
  {
    accessorKey: "updatedByName",
    meta: { headerTitle: "Updated By" }, // Added headerTitle to meta
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Updated By" />
    ),
    cell: ({ row }) => {
      const updatedByName = row.original.updatedByName;
      return <div>{updatedByName || "N/A"}</div>;
    },
  },
  {
    accessorKey: "updatedAt",
    meta: { headerTitle: "Updated On" }, // Added headerTitle to meta
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Updated On" />
    ),
    cell: ({ row }) => {
      const date = new Date(row.getValue("updatedAt"));
      return <div>{date.toLocaleDateString()}</div>;
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const organization = row.original;
      return (
        <div className="flex space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEditOrganization(organization)}
          >
            <FilePenLine className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-red-500 hover:text-red-700"
            onClick={() => handleDeleteOrganizationConfirm(organization)} // Pass the whole organization object
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      );
    },
  },
];

export function OrganizationDataTable() {
  const [data, setData] = useState<OrganizationOutput[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [currentOrganization, setCurrentOrganization] =
    useState<OrganizationOutput | null>(null);
  const [organizationToDelete, setOrganizationToDelete] =
    useState<OrganizationOutput | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { authState } = useOktaAuth(); // Get authState

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const result = await getOrganizations();
      if (result.success && result.data) {
        setData(result.data);
        setError(null);
      } else {
        setError(result.message || "Failed to fetch organizations");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleOpenCreateModal = useCallback(() => {
    setModalMode("create");
    setCurrentOrganization(null);
    setIsModalOpen(true);
  }, []);

  const handleOpenEditModal = useCallback(
    (organization: OrganizationOutput) => {
      setModalMode("edit");
      setCurrentOrganization(organization);
      setIsModalOpen(true);
    },
    []
  );

  const handleOpenDeleteConfirm = useCallback(
    (organization: OrganizationOutput) => {
      setOrganizationToDelete(organization);
    },
    []
  );

  const performDeleteOrganization = useCallback(async () => {
    if (!organizationToDelete) return;

    const accessToken = authState?.accessToken?.accessToken;
    if (!accessToken) {
      toast.error("Authentication token not found. Please log in again.");
      setIsDeleting(false); // Ensure loading state is reset
      setOrganizationToDelete(null); // Close dialog
      return;
    }

    setIsDeleting(true);
    try {
      const result = await deleteOrganization({
        organizationKey: organizationToDelete.organizationKey,
        accessToken: accessToken,
      });
      if (result.success) {
        // For now, let's try a generic toast if .warning isn't standard
        toast.warning(
          `Organization "${organizationToDelete.organizationName}" deleted successfully.`
        ); // Using success as warn might not be standard
        fetchData();
      } else {
        toast.error(`Failed to delete organization: ${result.message}`);
      }
    } catch (e) {
      toast.error("An unexpected error occurred during deletion.");
    } finally {
      setOrganizationToDelete(null);
      setIsDeleting(false);
    }
  }, [organizationToDelete, fetchData]);

  const columns = useMemo(
    () =>
      getOrganizationTableColumns(handleOpenEditModal, handleOpenDeleteConfirm),
    [handleOpenEditModal, handleOpenDeleteConfirm]
  );

  if (loading && data.length === 0) {
    return <div role="status">
    <svg aria-hidden="true" className="inline w-8 h-8 text-gray-200 animate-spin dark:text-gray-600 fill-blue-600" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor"/>
        <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill"/>
    </svg>
    <span className="sr-only">Loading...</span>
</div>;
  }

  if (error) {
    return <div className="text-red-500">Error: {error}</div>;
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-4">
        <TypewriterEffectSmooth
          words={[
            {
              text: "Organizations",
            },
          ]}
        />
         <Button
        className="border border-black 
        bg-white text-black text-sm hover:shadow-[4px_4px_0px_0px_rgba(0,0,0)] hover:bg-white 
        cursor-pointer 
        transition duration-200"
        onClick={handleOpenCreateModal}
        //containerClassName="w-50 "
        //borderClassName="w-2 h-2"
        //borderRadius="16px"
      >
        <PlusCircleIcon/> {" "}
        <span className="animated-gradient-text">Create Organization</span>
      </Button>
      </div>
     
      <DataTable columns={columns} data={data} />
      {isModalOpen && (
        <OrganizationModal
          isOpen={isModalOpen}
          mode={modalMode}
          organizationData={currentOrganization}
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => {
            setIsModalOpen(false);
            fetchData();
          }}
        />
      )}

      {organizationToDelete && (
        <ConfirmDialog
          isOpen={!!organizationToDelete}
          onOpenChange={(isOpen) => {
            if (!isOpen) {
              setOrganizationToDelete(null);
            }
          }}
          title={`Delete Organization: ${organizationToDelete.organizationName}?`}
          description="Are you sure you want to delete this organization? This action cannot be undone."
          onConfirm={performDeleteOrganization}
          confirmText="Delete"
          confirmButtonVariant="destructive"
          isLoading={isDeleting}
        />
      )}
    </div>
  );
}

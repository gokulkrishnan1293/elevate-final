"use client";

import React, { useEffect, useState } from "react";
import { DataTable } from "@/components/data-table/DataTable";
import { getOrganizations, deleteOrganization } from "@/actions/organization";
import { OrganizationOutput } from "@/lib/schemas/organization"; // Updated import path
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, FilePenLine, Trash2, PlusCircle } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { OrganizationModal } from "./OrganizationModal";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { toast } from "sonner";
import { useCallback, useMemo } from "react";
import { useOktaAuth } from "@okta/okta-react"; // Import useOktaAuth

// Define a function that returns column definitions
// Adjusted handleDeleteOrganizationConfirm to accept OrganizationOutput
const getOrganizationTableColumns = (
  handleEditOrganization: (organization: OrganizationOutput) => void,
  handleDeleteOrganizationConfirm: (organization: OrganizationOutput) => void // Changed parameter type
): ColumnDef<OrganizationOutput>[] => [
  {
    accessorKey: "organizationName",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Organization Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
  },
  {
    accessorKey: "ownerName",
    header: "Organization Owner",
    cell: ({ row }) => {
      const ownerName = row.original.ownerName;
      const ownerAvatar = row.original.ownerAvatar;
      const initials = ownerName
        ?.split(" ")
        .map((n: string) => n[0]) // Added type for n
        .slice(0, 2)
        .join("")
        .toUpperCase() || "O";

      return (
        <div className="flex items-center">
          <Avatar className="h-9 w-9">
            <AvatarImage src={ownerAvatar || undefined} alt={ownerName || "Owner"} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </div>
      );
    },
  },
  {
    accessorKey: "updatedByName",
    header: "Updated By",
    cell: ({ row }) => {
      const updatedByName = row.original.updatedByName;
      return <div>{updatedByName || "N/A"}</div>;
    },
  },
  {
    accessorKey: "updatedAt",
    header: "Updated On",
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
  const [currentOrganization, setCurrentOrganization] = useState<OrganizationOutput | null>(null);
  const [organizationToDelete, setOrganizationToDelete] = useState<OrganizationOutput | null>(null);
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
      setError(err instanceof Error ? err.message : "An unknown error occurred.");
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

  const handleOpenEditModal = useCallback((organization: OrganizationOutput) => {
    setModalMode("edit");
    setCurrentOrganization(organization);
    setIsModalOpen(true);
  }, []);

  const handleOpenDeleteConfirm = useCallback((organization: OrganizationOutput) => {
    setOrganizationToDelete(organization);
  }, []);

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
        toast.warning(`Organization "${organizationToDelete.organizationName}" deleted successfully.`); // Using success as warn might not be standard
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
    () => getOrganizationTableColumns(handleOpenEditModal, handleOpenDeleteConfirm),
    [handleOpenEditModal, handleOpenDeleteConfirm]
  );

  if (loading && data.length === 0) {
    return <div>Loading organizations...</div>;
  }

  if (error) {
    return <div className="text-red-500">Error: {error}</div>;
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Organizations</h1>
        <Button onClick={handleOpenCreateModal}>
          <PlusCircle className="mr-2 h-4 w-4" /> Create Organization
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
          }}        />
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

"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { DataTable } from "@/components/data-table/DataTable";
import { getOrganizations } from "@/actions/organization"; // To fetch organizations for dropdown
import { getARTsByOrganization, deleteART } from "@/actions/ART";
import { OrganizationOutput } from "@/lib/schemas/organization";
import { ARTOutput, DeleteARTInput } from "@/lib/schemas/art";
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FilePenLine, Trash2, PlusCircleIcon } from "lucide-react";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { toast } from "sonner";
import { useOktaAuth } from "@okta/okta-react";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { TypewriterEffectSmooth } from "@/components/ui/typewriter-effect";
import { AnimatedTooltip } from "@/components/ui/animated-tooltip"; // For displaying owners

import { ARTModal } from "./ARTModal"; 
import { useAppContext } from "@/context/AppContext";

const getARTTableColumns = (
  handleEditART: (art: ARTOutput) => void,
  handleDeleteARTConfirm: (art: ARTOutput) => void
): ColumnDef<ARTOutput>[] => [
  {
    accessorKey: "artName",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="ART Name" />
    ),
  },
  {
    accessorKey: "owners",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="ART Owners" />
    ),
    cell: ({ row }) => {
      const owners = row.original.owners;
      if (!owners || owners.length === 0) {
        return <div>N/A</div>;
      }
      return (
        <div className="flex flex-row w-full">
          <AnimatedTooltip owners={owners.map(o => ({ // Adapt owner structure if needed
            ownerName: o.ownerName, 
            ownerEmail: o.ownerEmail, 
            ownerAvatar: o.ownerAvatar,
            ownerEmployeeKey: o.ownerEmployeeKey
            }))} 
          />
        </div>
      );
    },
  },
  {
    accessorKey: "updatedByName",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Updated By" />
    ),
    cell: ({ row }) => row.original.updatedByName || "N/A",
  },
  {
    accessorKey: "updatedAt",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Updated On" />
    ),
    cell: ({ row }) => new Date(row.getValue("updatedAt")).toLocaleDateString(),
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const art = row.original;
      return (
        <div className="flex space-x-2">
          <Button variant="ghost" size="sm" onClick={() => handleEditART(art)}>
            <FilePenLine className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-red-500 hover:text-red-700"
            onClick={() => handleDeleteARTConfirm(art)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      );
    },
  },
];

export function ARTDataTable() {
  //const [organizations, setOrganizations] = useState<OrganizationOutput[]>([]);
  //const [selectedOrgKey, setSelectedOrgKey] = useState<string | undefined>(undefined);
  const {selectedOrganization}  = useAppContext()
  const [artsData, setArtsData] = useState<ARTOutput[]>([]);
  const [loadingOrgs, setLoadingOrgs] = useState(true);
  const [loadingArts, setLoadingArts] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [currentART, setCurrentART] = useState<ARTOutput | null>(null);
  const [artToDelete, setArtToDelete] = useState<ARTOutput | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { authState } = useOktaAuth();

  /*const fetchOrganizationsList = useCallback(async () => {
    setLoadingOrgs(true);
    try {
      const result = await getOrganizations();
      if (result.success && result.data) {
        setOrganizations(result.data);
        if (result.data.length > 0 && !selectedOrgKey) {
          setSelectedOrgKey(result.data[0].organizationKey.toString()); // Default to first org
        }
        setError(null);
      } else {
        setError(result.message || "Failed to fetch organizations");
        setOrganizations([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred.");
      setOrganizations([]);
    } finally {
      setLoadingOrgs(false);
    }
  }, [selectedOrgKey]);*/

  const fetchARTsForOrganization = useCallback(async (orgKey: number) => {
    setLoadingArts(true);
    setArtsData([]); // Clear previous ARTs
    try {
      const result = await getARTsByOrganization(orgKey);
      if (result.success && result.data) {
        setArtsData(result.data);
        setError(null);
      } else {
        setError(result.message || `Failed to fetch ARTs for organization ${orgKey}`);
        setArtsData([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred.");
      setArtsData([]);
    } finally {
      setLoadingArts(false);
    }
  }, []);

  /*useEffect(() => {
    fetchOrganizationsList();
  }, [fetchOrganizationsList]);*/

  useEffect(() => {
    if (selectedOrganization?.organizationKey) {
      fetchARTsForOrganization(selectedOrganization.organizationKey);
    } else {
      setArtsData([]); // Clear ARTs if no org is selected
    }
  }, [selectedOrganization, fetchARTsForOrganization]);

  const handleOpenCreateModal = useCallback(() => {
    if (!selectedOrganization?.organizationKey) {
        toast.error("Please select an organization first to create an ART.");
        return;
    }
    setModalMode("create");
    setCurrentART(null);
    setIsModalOpen(true);
  }, [selectedOrganization]);

  const handleOpenEditModal = useCallback((art: ARTOutput) => {
    setModalMode("edit");
    setCurrentART(art);
    setIsModalOpen(true);
  }, []);

  const handleOpenDeleteConfirm = useCallback((art: ARTOutput) => {
    setArtToDelete(art);
  }, []);

  const performDeleteART = useCallback(async () => {
    if (!artToDelete) return;
    const accessToken = authState?.accessToken?.accessToken;
    if (!accessToken) {
      toast.error("Authentication token not found.");
      setIsDeleting(false);
      setArtToDelete(null);
      return;
    }

    setIsDeleting(true);
    try {
      if (!selectedOrganization?.organizationKey) {
        toast.error("Organization context is missing. Cannot delete ART.");
        setIsDeleting(false);
        setArtToDelete(null);
        return;
      }
      const deleteInput: DeleteARTInput = { 
        artKey: artToDelete.artKey, 
        organizationKey: selectedOrganization.organizationKey, // Add organizationKey
        accessToken 
      };
      const result = await deleteART(deleteInput);
      if (result.success) {
        toast.warning(`ART "${artToDelete.artName}" deleted successfully.`);
        if (selectedOrganization?.organizationKey) {
            fetchARTsForOrganization(selectedOrganization?.organizationKey);
        }
      } else {
        toast.error(`Failed to delete ART: ${result.message}`);
      }
    } catch (e) {
      toast.error("An unexpected error occurred during deletion.");
    } finally {
      setArtToDelete(null);
      setIsDeleting(false);
    }
  }, [artToDelete, authState, selectedOrganization, fetchARTsForOrganization]);

  const columns = useMemo(
    () => getARTTableColumns(handleOpenEditModal, handleOpenDeleteConfirm),
    [handleOpenEditModal, handleOpenDeleteConfirm]
  );

  const pageTitleWords = [{ text: "Agile" }, { text: "Release" }, { text: "Trains" }];
  
  if (loadingOrgs && selectedOrganization?.organizationName.length === 0) {
    return <div role="status" className="flex justify-center items-center h-screen">
        <svg aria-hidden="true" className="inline w-10 h-10 text-gray-200 animate-spin dark:text-gray-600 fill-blue-600" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor"/>
            <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill"/>
        </svg>
        <span className="sr-only">Loading arts...</span>
    </div>;
  }
  


  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-4">
            <TypewriterEffectSmooth words={pageTitleWords} />
        </div>
        <div className="flex items-center space-x-4">
        

        <Button
          className="border border-black bg-white text-black text-sm hover:shadow-[4px_4px_0px_0px_rgba(0,0,0)] hover:bg-white cursor-pointer transition duration-200"
          onClick={handleOpenCreateModal}
          disabled={!selectedOrganization?.organizationKey || loadingArts}
        >
          <PlusCircleIcon className="mr-2 h-4 w-4" />
          <span className="animated-gradient-text">Create ART</span>
        </Button>
        </div>
      </div>

      
      {!loadingArts && error && <div className="text-red-500 p-4">Error fetching ARTs: {error}</div>}
      {!loadingArts && !error && selectedOrganization?.organizationKey && (
        <DataTable columns={columns} data={artsData} />
      )}
      {!selectedOrganization?.organizationKey && !loadingOrgs && <div className="text-center py-4">Please select an organization to view ARTs.</div>}

      {isModalOpen && selectedOrganization?.organizationKey && (
        <ARTModal
          isOpen={isModalOpen}
          mode={modalMode}
          artData={currentART}
          organizationKey={selectedOrganization?.organizationKey} // Pass selected org key
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => {
            setIsModalOpen(false);
            if (selectedOrganization?.organizationKey) fetchARTsForOrganization(selectedOrganization?.organizationKey);
          }}
        />
      )}

      {artToDelete && (
        <ConfirmDialog
          isOpen={!!artToDelete}
          onOpenChange={(isOpen) => !isOpen && setArtToDelete(null)}
          title={`Delete ART: ${artToDelete.artName}?`}
          description="Are you sure you want to delete this ART? This action cannot be undone."
          onConfirm={performDeleteART}
          confirmText="Delete"
          confirmButtonVariant="destructive"
          isLoading={isDeleting}
        />
      )}
    </div>
  );
}

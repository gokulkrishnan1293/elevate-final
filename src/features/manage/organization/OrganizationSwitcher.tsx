"use client"

import React,{useCallback, useState} from "react"
import { ChevronsUpDown, FilePenLine, Icon, KeyIcon, Notebook, OrigamiIcon, Plus, Trash2, University } from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { useAppContext } from "@/context/AppContext"
import { useOktaAuth } from "@okta/okta-react"
import { Button } from "@/components/ui/button"
import { deleteOrganization } from "@/actions/organization"
import { OrganizationOutput } from "@/lib/schemas/organization"
import { OrganizationModal } from "./OrganizationModal"
import Link from "next/link"
import Image from "next/image"


export function OrganizationSwitcher() {
  const { isMobile } = useSidebar()
  //const [activeOrg, setActiveOrg] = React.useState()

  const {setSelectedOrganization,selectedOrganization,availableOrganizations,refreshAppContext} = useAppContext()

   const [loading, setLoading] = React.useState(true);
   const [error, setError] = useState<string | null>(null);
   const [isModalOpen, setIsModalOpen] = useState(false);
   const [modalMode, setModalMode] = useState<"create" | "edit">("create");
   const [isDeleting, setIsDeleting] = useState(false);
   const { authState } = useOktaAuth(); // Get authState

   const handleOpenCreateModal = useCallback(() => {
    setModalMode("create");
    //setCurrentOrganization(null);
    setIsModalOpen(true);
  }, []);

  const handleOpenEditModal = useCallback(
    (organization: OrganizationOutput) => {
      setModalMode("edit");
      //setCurrentOrganization(organization);
      setIsModalOpen(true);
    },
    []
  );


  

  return (
    <SidebarMenu >
      <SidebarMenuItem>
        <DropdownMenu modal={false} >
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg">
                 <Image
                  src="/Staff.svg"
                  alt="OrgIcon"
                  width={32}
                  height={32}
                />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">
                  {selectedOrganization?.organizationName}
                </span>
              </div>
              <ChevronsUpDown className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Organizations
            </DropdownMenuLabel>
            {availableOrganizations.map((org, index) => (
              <DropdownMenuItem
                key={org.organizationName}
                onClick={() => setSelectedOrganization(org)}
                className="gap-2 p-2"
              >
              <div className="flex flex-row w-full items-center justify-between">
                <div className="flex">
                <div className="flex aspect-square size-8 items-center justify-center  rounded-lg  text-sidebar-primary-foreground">
                  <Image
                  src="/Staff.svg"
                  alt="OrgIcon"
                  width={30}
                  height={30}
                />
                </div>
                <span className="flex items-center pl-2">
                {org.organizationName}
                </span>
               </div>
               <div className="flex space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleOpenEditModal(org)}
          >
            <FilePenLine className="h-4 w-4" />
          </Button></div>
         
        </div>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="gap-2 p-2">
              <div className="flex size-6 items-center justify-center rounded-md border bg-background">
                <KeyIcon className="size-4" />
              </div>
              <div className="font-medium text-muted-foreground"
              ><Link href={"/settings/organization"}>Manage Organization</Link></div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
      {isModalOpen && (
              <OrganizationModal
                isOpen={isModalOpen}
                mode={modalMode}
                organizationData={selectedOrganization}
                onClose={() => setIsModalOpen(false)}
                onSuccess={() => {
                  setIsModalOpen(false);
                  refreshAppContext();
                }}
              />
            )}
    </SidebarMenu>
  )
}

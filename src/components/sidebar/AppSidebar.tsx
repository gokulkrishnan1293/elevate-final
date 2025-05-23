"use client";

import * as React from "react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import HeaderLogo from "./HeaderLogo";
import AppSideBarContent from "./AppSideBarContent";
import { sidebarLinks } from "../../constants/sidebar";
import { OrganizationSwitcher } from "../../features/manage/organization/OrganizationSwitcher";

export default function AppSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <HeaderLogo />
        <OrganizationSwitcher />
      </SidebarHeader>

      <SidebarContent>
        <AppSideBarContent items={sidebarLinks} />
      </SidebarContent>

      <SidebarFooter>{/*Create Later*/}</SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

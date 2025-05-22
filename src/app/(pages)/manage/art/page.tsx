"use client"; // ARTDataTable likely uses client-side hooks

import React from "react";
import { ARTDataTable } from "@/features/manage/art/ARTDataTable";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import Link from "next/link";

export default function ManageARTPage() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
                  <BreadcrumbPage>Manage</BreadcrumbPage>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Agile Release Trains</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className="flex-1 rounded-lg  p-0 md:p-0">
        {/* The ARTDataTable itself has container mx-auto py-10, so no extra padding needed here unless desired */}
        <ARTDataTable />
      </div>
    </div>
  );
}

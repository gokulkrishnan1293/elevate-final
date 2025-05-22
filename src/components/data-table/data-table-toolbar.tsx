// components/data-table/data-table-toolbar.tsx
"use client";
import { Table, Column, RowData } from "@tanstack/react-table"; // Added Column, RowData
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Settings2, Search, X, Download } from "lucide-react"; // Added Download icon
import * as XLSX from 'xlsx'; // Import xlsx

// Module augmentation for TanStack Table ColumnMeta
// This allows us to add custom properties to column.columnDef.meta
// Ideally, this should be in a global .d.ts file (e.g., tanstack-table.d.ts)
declare module '@tanstack/table-core' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData extends RowData, TValue> {
    headerTitle?: string; // Custom property for explicit header title in UI elements
  }
}

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
  globalFilter: string;
  columns: any; // This prop exists in the current file, keeping it for now though not actively used in the updated logic for column names
  setGlobalFilter: (filter: string) => void;
}

// Helper function to format column IDs (e.g., camelCase or snake_case) into a readable title
function formatHeaderId(id: string): string {
  if (!id) return "";
  // Replace underscores/hyphens with spaces
  let result = id.replace(/[_-]/g, ' ');
  // Add space before capital letters in camelCase/PascalCase, e.g., "organizationName" -> "organization Name"
  result = result.replace(/([a-z])([A-Z])/g, '$1 $2');
  // Capitalize the first letter of each word
  return result
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function DataTableToolbar<TData>({
  table,
  globalFilter,
  setGlobalFilter,
}: DataTableToolbarProps<TData>) {
  //const isFiltered = table.getState().columnFilters.length > 0 || globalFilter.length > 0;

  const handleExcelDownload = () => {
    // Get visible columns, excluding 'actions' column, and ensuring they have an accessor or ID
    const visibleColumns = table.getAllColumns().filter(
      column => column.getIsVisible() && 
                column.id !== 'actions' && 
                (column.accessorFn || column.id)
    );
    
    // Prepare header row using meta.headerTitle, string header, or formatted ID
    const headers = visibleColumns.map(column => {
      const metaHeaderTitle = column.columnDef.meta?.headerTitle;
      const headerDef = column.columnDef.header;
      if (typeof metaHeaderTitle === 'string') return metaHeaderTitle;
      if (typeof headerDef === 'string') return headerDef;
      return formatHeaderId(column.id);
    });

    // Get current (filtered and sorted) data from the table
    const dataToExport = table.getFilteredRowModel().rows.map(row => {
      const originalRow = row.original as Record<string, any>;
      const rowData: Record<string, any> = {};
      visibleColumns.forEach(column => {
        // Correctly access accessorKey or fall back to id
        const accessor = (column.columnDef as any).accessorKey?.toString() || column.id;
        const header = typeof column.columnDef.meta?.headerTitle === 'string' 
                       ? column.columnDef.meta.headerTitle 
                       : (typeof column.columnDef.header === 'string' ? column.columnDef.header : formatHeaderId(column.id));
        
        // Special handling for 'owners' array to make it readable in Excel
        if (accessor === 'owners' && Array.isArray(originalRow[accessor])) {
          rowData[header] = originalRow[accessor].map((owner: { ownerName?: string | null }) => owner.ownerName || 'N/A').join(', ');
        } else if (originalRow[accessor] !== undefined && originalRow[accessor] !== null) {
          rowData[header] = originalRow[accessor];
        } else {
          rowData[header] = ""; // Use empty string for undefined/null simple values
        }
      });
      return rowData;
    });

    // Create worksheet, ensuring headers are used if dataToExport is empty
    const worksheet = XLSX.utils.json_to_sheet(dataToExport.length > 0 ? dataToExport : [{}], { header: headers });
    // If dataToExport was empty, json_to_sheet with just [{}] and headers will create a sheet with only headers.
    // If dataToExport was truly empty and we didn't pass [{}], it might create an empty sheet without headers.
    // This ensures headers are always present.
    if (dataToExport.length === 0) {
        // If there was no data, clear the dummy row that might have been created by json_to_sheet
        // This step might be library-version dependent or might not be needed if json_to_sheet handles empty array + headers correctly.
        // For robust header-only export:
        const emptyDataWithHeaders = headers.reduce((obj, header) => { obj[header] = ""; return obj; }, {} as Record<string, string>);
        const ws = XLSX.utils.json_to_sheet([emptyDataWithHeaders], { header: headers, skipHeader: false });
        // Remove the dummy data row, keeping only headers
        XLSX.utils.sheet_add_aoa(ws, [[]], {origin: "A2"}); // Clears from A2 downwards
        // Re-assign worksheet if this method is preferred for header-only
        // For simplicity, the above `json_to_sheet(dataToExport.length > 0 ? dataToExport : [{}], { header: headers });`
        // should generally work well enough, creating a header row and one empty data row if data is empty.
    }
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
    XLSX.writeFile(workbook, "table_data.xlsx");
  };

  return (
    <div className="flex items-center justify-between p-4 bg-card">
      <div className="flex flex-1 items-center space-x-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search data table..."
            value={globalFilter ?? ""}
            onChange={(event) => setGlobalFilter(event.target.value)}
            className="h-9 pl-8 lg:w-[250px]"
          />
          {globalFilter && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 px-2"
              onClick={() => setGlobalFilter("")}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <div className="flex items-center space-x-2"> {/* Wrapper for buttons */}
           <Button
                  className="px-4 py-2 rounded-md border border-black 
                  bg-white text-black text-sm hover:shadow-[4px_4px_0px_0px_rgba(0,0,0)] hover:bg-white 
                  cursor-pointer 
                  transition duration-200"
                  onClick={handleExcelDownload}
                >
          <Download className="mr-2 h-4 w-4" />
          Download
          </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-9 lg:flex">
              <Settings2 className="mr-2 h-4 w-4" />
              View
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[150px]">
            <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {table
              .getAllColumns()
              .filter(
                (column: Column<TData, unknown>) =>
                  typeof column.accessorFn !== "undefined" && column.getCanHide()
              )
              .map((column: Column<TData, unknown>) => {
                const metaHeaderTitle = column.columnDef.meta?.headerTitle;
                const headerDef = column.columnDef.header;
                
                let displayName: string;
                if (typeof metaHeaderTitle === 'string') {
                  displayName = metaHeaderTitle;
                } else if (typeof headerDef === 'string') {
                  displayName = headerDef;
                } else {
                  displayName = formatHeaderId(column.id);
                }
                
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) => column.toggleVisibility(!!value)}
                  >
                    {displayName}
                  </DropdownMenuCheckboxItem>
                );
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div> {/* Closing the wrapper div */}
    </div>
  );
}

import React, { useState } from 'react';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
  SortingState,
  getSortedRowModel,
  ColumnFiltersState,
} from '@tanstack/react-table';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
}

export function DataTable<TData, TValue>({
  columns,
  data,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState('');

  const table = useReactTable({
    data,
    columns,
    initialState: {
      pagination: {
        pageSize: 5,
      },
    },
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
    onGlobalFilterChange: setGlobalFilter,
  });

  return (
    <div>
      <div className="flex items-center py-4">
        <Input
          placeholder="Filter all columns..."
          value={globalFilter ?? ''}
          onChange={(event) => setGlobalFilter(event.target.value)}
          className="max-w-sm"
        />
      </div>
      <div className=""> {/* Removed rounded-md border */}
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between py-4 mt-4 text-sm">
        <div className="text-muted-foreground">
          Total Items: {table.getRowCount()}
        </div>
        <div className="flex items-center space-x-1">
          {table.getPageCount() > 0 && <Button
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <span className="sr-only">Go to previous page</span>
            {'<'}
          </Button>}
          {/* Generate page numbers */}
          {(() => {
            const currentPage = table.getState().pagination.pageIndex;
            const pageCount = table.getPageCount();
            const pageNumbers = [];
            const maxPagesToShow = 5; // Show 5 page numbers as in the image

            if (pageCount === 0) return null; // No pages to show

            let startPage = Math.max(0, currentPage - Math.floor(maxPagesToShow / 2));
            let endPage = Math.min(pageCount - 1, startPage + maxPagesToShow - 1);

            // Adjust startPage if endPage is at the limit and we can show more pages towards the beginning
            if (pageCount >= maxPagesToShow && endPage - startPage + 1 < maxPagesToShow) {
                startPage = Math.max(0, endPage - maxPagesToShow + 1);
            }
            // Adjust endPage if startPage is at the limit and we can show more pages towards the end
            if (pageCount >= maxPagesToShow && endPage - startPage + 1 < maxPagesToShow) {
                 endPage = Math.min(pageCount - 1, startPage + maxPagesToShow - 1);
            }


            for (let i = startPage; i <= endPage; i++) {
              pageNumbers.push(
                <Button
                  key={i}
                  variant={currentPage === i ? 'default' : 'outline'}
                  className="h-8 w-8 p-0"
                  onClick={() => table.setPageIndex(i)}
                >
                  {i + 1}
                </Button>
              );
            }
            return pageNumbers;
          })()}
          {table.getPageCount() > 0 && <Button
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <span className="sr-only">Go to next page</span>
            {'>'}
          </Button>}
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-muted-foreground">Show per Page:</span>
          <select
            value={table.getState().pagination.pageSize}
            onChange={(e) => {
              table.setPageSize(Number(e.target.value));
            }}
            className="p-1.5 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring text-sm"
          >
            {[5, 10, 15, 20].map((pageSizeOption) => (
              <option key={pageSizeOption} value={pageSizeOption}>
                {pageSizeOption}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}

export default DataTable;

/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { DataTablePagination } from "@/components/ui/data-table-pagination";

export type Column<T> = {
  key: keyof T | string;
  label: React.ReactNode;
  render?: (row: T) => React.ReactNode;
};

type PaginationInfo = {
  currentPage: number;
  totalPages: number;
  rowsPerPage: number;
  totalItems: number;
};

type Props<T> = {
  data: T[];
  columns: Column<T>[];

  // Pagination từ server
  pagination: PaginationInfo;

  // React Query triggers
  onPageChange: (page: number) => void;
  onRowsPerPageChange: (size: number) => void;

  // Loading từ React Query
  loading?: boolean;
  onRowClick?: (row: T) => void;
};

// Skeleton row component
const TableRowSkeleton = ({ columnsLength }: { columnsLength: number }) => (
  <TableRow>
    {Array.from({ length: columnsLength }).map((_, i) => (
      <TableCell key={i}>
        <Skeleton className="h-6 w-full" />
      </TableCell>
    ))}
  </TableRow>
);

export function ReusableTable<T>({
  data,
  columns,
  pagination,
  onPageChange,
  onRowsPerPageChange,
  loading = false,
  onRowClick,
}: Props<T>) {
  const { currentPage, totalPages, rowsPerPage } = pagination;

  return (
    <div className="flex flex-col justify-between min-h-[500px] gap-5">
      <div className="border-app-azure-100 rounded-[10px] border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((col, idx) => (
                <TableHead key={idx}>{col.label}</TableHead>
              ))}
            </TableRow>
          </TableHeader>

          <TableBody>
            {/* Loading skeleton */}
            {loading ? (
              Array.from({ length: rowsPerPage }).map((_, i) => (
                <TableRowSkeleton key={i} columnsLength={columns.length} />
              ))
            ) : data.length === 0 ? (
              // Empty state
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="text-center py-6"
                >
                  No data available
                </TableCell>
              </TableRow>
            ) : (
              // Data rows
              data.map((row, i) => (
                <TableRow
                  key={i}
                  className={
                    onRowClick ? "cursor-pointer hover:bg-muted/60" : ""
                  }
                  onClick={() => onRowClick?.(row)}
                >
                  {columns.map((col, idx) => (
                    <TableCell key={idx}>
                      {col.render ? col.render(row) : (row as any)[col.key]}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <DataTablePagination
        currentPage={currentPage - 1} // Convert from 1-indexed to 0-indexed
        totalPages={totalPages}
        totalElements={totalItems}
        pageSize={rowsPerPage}
        onPageChange={(page) => onPageChange(page + 1)} // Convert back to 1-indexed
        showRowsPerPage={true}
        rowsPerPageOptions={[10, 20, 50]}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={onRowsPerPageChange}
      />
    </div>
  );
}

export default ReusableTable;

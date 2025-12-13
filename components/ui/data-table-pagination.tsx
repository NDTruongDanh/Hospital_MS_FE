"use client";

import * as React from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  MoreHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface DataTablePaginationProps {
  /** Current page (0-indexed) */
  currentPage: number;
  /** Total number of pages */
  totalPages: number;
  /** Total number of items */
  totalElements?: number;
  /** Page size */
  pageSize?: number;
  /** Callback when page changes */
  onPageChange: (page: number) => void;
  /** Optional: Show rows per page selector */
  showRowsPerPage?: boolean;
  /** Optional: Rows per page options */
  rowsPerPageOptions?: number[];
  /** Optional: Current rows per page */
  rowsPerPage?: number;
  /** Optional: Callback when rows per page changes */
  onRowsPerPageChange?: (rows: number) => void;
  /** Optional: Custom className */
  className?: string;
  /** Optional: Show info text */
  showInfo?: boolean;
  /** Optional: Custom info text format */
  infoText?: string;
}

export function DataTablePagination({
  currentPage,
  totalPages,
  totalElements,
  pageSize,
  onPageChange,
  showRowsPerPage = true,
  rowsPerPageOptions = [10, 20, 50, 100],
  rowsPerPage,
  onRowsPerPageChange,
  className,
  showInfo = true,
  infoText,
}: DataTablePaginationProps) {
  const getPageNumbers = () => {
    if (totalPages <= 1) return [];

    const pages: (number | "ellipsis")[] = [];
    const showEllipsis = totalPages > 7;

    if (!showEllipsis) {
      // Show all pages if 7 or fewer
      for (let i = 0; i < totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(0);

      if (currentPage <= 2) {
        // Near start: 0 1 2 3 ... last
        pages.push(1, 2, 3, "ellipsis", totalPages - 1);
      } else if (currentPage >= totalPages - 3) {
        // Near end: 0 ... n-4 n-3 n-2 n-1
        pages.push(
          "ellipsis",
          totalPages - 4,
          totalPages - 3,
          totalPages - 2,
          totalPages - 1
        );
      } else {
        // Middle: 0 ... current-1 current current+1 ... last
        pages.push(
          "ellipsis",
          currentPage - 1,
          currentPage,
          currentPage + 1,
          "ellipsis",
          totalPages - 1
        );
      }
    }

    return pages;
  };

  const pages = getPageNumbers();
  const startItem =
    totalElements && pageSize ? currentPage * pageSize + 1 : undefined;
  const endItem =
    totalElements && pageSize
      ? Math.min((currentPage + 1) * pageSize, totalElements)
      : undefined;

  const defaultInfoText =
    startItem && endItem && totalElements
      ? `Showing ${startItem}-${endItem} of ${totalElements}`
      : `Page ${currentPage + 1} of ${totalPages}`;

  return (
    <div className={cn("flex items-center justify-between", className)}>
      {/* Left: Info & Rows per page */}
      <div className="flex items-center gap-4">
        {showInfo && (
          <span className="text-sm text-muted-foreground">
            {infoText || defaultInfoText}
          </span>
        )}

        {showRowsPerPage && rowsPerPage && onRowsPerPageChange && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              Rows per page:
            </span>
            <Select
              value={String(rowsPerPage)}
              onValueChange={(value) => onRowsPerPageChange(Number(value))}
            >
              <SelectTrigger className="h-9 w-[70px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {rowsPerPageOptions.map((option) => (
                  <SelectItem key={option} value={String(option)}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Right: Pagination Controls */}
      <div className="flex items-center gap-2">
        {/* First Page */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(0)}
          disabled={currentPage === 0}
          className="h-9 w-9 p-0"
        >
          <ChevronsLeft className="h-4 w-4" />
          <span className="sr-only">First page</span>
        </Button>

        {/* Previous Page */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(Math.max(0, currentPage - 1))}
          disabled={currentPage === 0}
          className="h-9"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Previous
        </Button>

        {/* Page Numbers */}
        {pages.length > 0 && (
          <div className="flex items-center gap-1">
            {pages.map((page, index) => {
              if (page === "ellipsis") {
                return (
                  <span
                    key={`ellipsis-${index}`}
                    className="flex h-9 w-9 items-center justify-center text-muted-foreground"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </span>
                );
              }

              const pageNum = page as number;
              const isActive = pageNum === currentPage;

              return (
                <Button
                  key={pageNum}
                  variant={isActive ? "default" : "outline"}
                  size="sm"
                  onClick={() => onPageChange(pageNum)}
                  className={cn(
                    "h-9 w-9 p-0",
                    isActive && "bg-primary text-primary-foreground"
                  )}
                >
                  {pageNum + 1}
                </Button>
              );
            })}
          </div>
        )}

        {/* Next Page */}
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            onPageChange(Math.min(totalPages - 1, currentPage + 1))
          }
          disabled={currentPage >= totalPages - 1}
          className="h-9"
        >
          Next
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>

        {/* Last Page */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(totalPages - 1)}
          disabled={currentPage >= totalPages - 1}
          className="h-9 w-9 p-0"
        >
          <ChevronsRight className="h-4 w-4" />
          <span className="sr-only">Last page</span>
        </Button>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Search, Loader2 } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { useDepartments, useDeleteDepartment } from "@/hooks/queries/useHr";
import { useDebounce } from "@/hooks/useDebounce";
import { DepartmentStatusBadge } from "../_components/department-status-badge";
import { Department, DepartmentStatus } from "@/interfaces/hr";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { DataTablePagination } from "@/components/ui/data-table-pagination";
import { DataTableRowActions } from "@/components/ui/data-table-row-actions";

export default function DepartmentsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(10);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<DepartmentStatus | "ALL">("ALL");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [departmentToDelete, setDepartmentToDelete] =
    useState<Department | null>(null);
  const [sort, setSort] = useState("name,asc");

  const debouncedSearch = useDebounce(search, 300);

  const { data, isLoading } = useDepartments({
    page: page - 1,
    size,
    search: debouncedSearch || undefined,
    status: status === "ALL" ? undefined : status,
    sort: sort,
  });

  const deleteMutation = useDeleteDepartment();

  const departments = data?.content ?? [];
  const totalItems = data?.totalElements ?? 0;
  const totalPages = data?.totalPages ?? 1;

  const handleDeleteClick = (dept: Department) => {
    setDepartmentToDelete(dept);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!departmentToDelete) return;
    try {
      await deleteMutation.mutateAsync(departmentToDelete.id);
      toast.success(
        `Department "${departmentToDelete.name}" deleted successfully`
      );
      setDeleteDialogOpen(false);
      setDepartmentToDelete(null);
    } catch (error) {
      toast.error("Cannot delete department with assigned employees");
    }
  };

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Departments</h1>
          <p className="text-muted-foreground">
            Manage hospital departments and their heads.
          </p>
        </div>
        {isAdmin && (
          <Button
            onClick={() => router.push("/admin/hr/departments/new")}
            size="lg"
            className="rounded-lg"
          >
            <Plus className="mr-2 h-4 w-4" /> Add Department
          </Button>
        )}
      </div>

      <Card className="w-full shadow-sm">
        <CardHeader className="gap-3 sm:flex sm:items-end sm:justify-between">
          <div className="relative w-full sm:max-w-xl">
            <Search className="text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
            <Input
              placeholder="Search by name..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="h-10 rounded-lg pl-9"
            />
          </div>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
            <Select
              value={status}
              onValueChange={(v: DepartmentStatus | "ALL") => {
                setStatus(v);
                setPage(1);
              }}
            >
              <SelectTrigger className="h-10 w-full rounded-lg sm:w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="INACTIVE">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger className="h-10 w-full rounded-lg sm:w-40">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name,asc">Name (A-Z)</SelectItem>
                <SelectItem value="name,desc">Name (Z-A)</SelectItem>
                <SelectItem value="status,asc">Status (A-Z)</SelectItem>
                <SelectItem value="status,desc">Status (Z-A)</SelectItem>
                <SelectItem value="createdAt,desc">Created (newest)</SelectItem>
                <SelectItem value="createdAt,asc">Created (oldest)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-hidden rounded-b-xl border-t">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Head Doctor</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-10 text-center">
                      <Spinner className="mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : departments.length ? (
                  departments.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="font-medium">{row.name}</TableCell>
                      <TableCell className="text-muted-foreground max-w-xs truncate">
                        {row.description || "N/A"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {row.location || "N/A"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {row.phoneExtension || "N/A"}
                      </TableCell>
                      <TableCell>
                        <DepartmentStatusBadge status={row.status} />
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {row.headDoctorName || "N/A"}
                      </TableCell>
                      <TableCell className="text-right">
                        <DataTableRowActions
                          rowId={row.id}
                          actions={[
                            {
                              label: "View details",
                              href: `/admin/hr/departments/${row.id}`,
                            },
                            ...(isAdmin
                              ? [
                                  {
                                    label: "Edit",
                                    href: `/admin/hr/departments/${row.id}/edit`,
                                  },
                                  {
                                    label: "Delete",
                                    onClick: () => handleDeleteClick(row),
                                    destructive: true,
                                    separator: true,
                                  },
                                ]
                              : []),
                          ]}
                        />
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="py-10 text-center text-muted-foreground"
                    >
                      No departments found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm w-full">
        <CardContent className="py-4">
          <DataTablePagination
            currentPage={page - 1} // Convert from 1-indexed to 0-indexed
            totalPages={totalPages}
            totalElements={totalItems}
            pageSize={size}
            onPageChange={(newPage) => setPage(newPage + 1)} // Convert back to 1-indexed
            showRowsPerPage={true}
            rowsPerPageOptions={[10, 20, 50]}
            rowsPerPage={size}
            onRowsPerPageChange={(newSize) => {
              setSize(newSize);
              setPage(1);
            }}
          />
        </CardContent>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Department</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{departmentToDelete?.name}
              &quot;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? (
                <Spinner size="sm" className="mr-2" />
              ) : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

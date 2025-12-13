"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { useDebounce } from "@/hooks/useDebounce";
import {
  useEmployees,
  useDeleteEmployee,
  useDepartments,
} from "@/hooks/queries/useHr";
import { RoleBadge } from "../_components/role-badge";
import { EmployeeStatusBadge } from "../_components/employee-status-badge";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";
import { DataTableRowActions } from "@/components/ui/data-table-row-actions";

export default function EmployeesPage() {
  const router = useRouter();
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(10);
  const [search, setSearch] = useState("");
  const [departmentId, setDepartmentId] = useState<string>("ALL");
  const [role, setRole] = useState<string>("ALL");
  const [status, setStatus] = useState<string>("ALL");
  const [sort, setSort] = useState("fullName,asc");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState<{
    id: string;
    fullName: string;
  } | null>(null);

  const debouncedSearch = useDebounce(search, 300);

  const { data: departmentsData } = useDepartments({ size: 100 });

  const { data, isLoading, error } = useEmployees({
    page,
    size,
    search: debouncedSearch || undefined,
    departmentId: departmentId !== "ALL" ? departmentId : undefined,
    role: role !== "ALL" ? role : undefined,
    status: status !== "ALL" ? status : undefined,
    sort,
  });

  const deleteEmployee = useDeleteEmployee();

  const employees = data?.content ?? [];
  const departments = departmentsData?.content ?? [];

  const handleDelete = (id: string, fullName: string) => {
    deleteEmployee.mutate(id, {
      onSuccess: () => {
        toast.success(`Employee "${fullName}" has been deleted.`);
      },
      onError: (error: any) => {
        const message =
          error.response?.data?.error?.code === "HAS_FUTURE_APPOINTMENTS"
            ? "Cannot delete: Employee has scheduled future appointments."
            : "Failed to delete employee.";
        toast.error(message);
      },
    });
  };

  if (error) {
    return (
      <div className="w-full space-y-6">
        <div className="flex items-center justify-center py-10">
          <p className="text-destructive">
            Error loading employees. Please try again.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Employees</h1>
          <p className="text-muted-foreground">
            Manage staff profiles, roles, and status.
          </p>
        </div>
        {isAdmin && (
          <Button
            onClick={() => router.push("/admin/hr/employees/new")}
            size="lg"
            className="rounded-lg"
          >
            <Plus className="mr-2 h-4 w-4" /> Add Employee
          </Button>
        )}
      </div>

      <Card className="w-full shadow-sm">
        <CardHeader className="gap-3 sm:flex sm:items-end sm:justify-between">
          <div className="relative w-full sm:max-w-xl">
            <Search className="text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
            <Input
              placeholder="Search by name, email, or license..."
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
              value={departmentId}
              onValueChange={(v) => {
                setDepartmentId(v);
                setPage(1);
              }}
            >
              <SelectTrigger className="h-10 w-full rounded-lg sm:w-44">
                <SelectValue placeholder="Department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Departments</SelectItem>
                {departments.map((dept) => (
                  <SelectItem key={dept.id} value={dept.id}>
                    {dept.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={role}
              onValueChange={(v) => {
                setRole(v);
                setPage(1);
              }}
            >
              <SelectTrigger className="h-10 w-full rounded-lg sm:w-36">
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Roles</SelectItem>
                <SelectItem value="DOCTOR">Doctor</SelectItem>
                <SelectItem value="NURSE">Nurse</SelectItem>
                <SelectItem value="RECEPTIONIST">Receptionist</SelectItem>
                <SelectItem value="ADMIN">Admin</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={status}
              onValueChange={(v) => {
                setStatus(v);
                setPage(1);
              }}
            >
              <SelectTrigger className="h-10 w-full rounded-lg sm:w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="ON_LEAVE">On Leave</SelectItem>
                <SelectItem value="RESIGNED">Resigned</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={sort}
              onValueChange={(v) => {
                setSort(v);
                setPage(1);
              }}
            >
              <SelectTrigger className="h-10 w-full rounded-lg sm:w-36">
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fullName,asc">Name (A-Z)</SelectItem>
                <SelectItem value="fullName,desc">Name (Z-A)</SelectItem>
                <SelectItem value="role,asc">Role (A-Z)</SelectItem>
                <SelectItem value="role,desc">Role (Z-A)</SelectItem>
                <SelectItem value="departmentName,asc">
                  Department (A-Z)
                </SelectItem>
                <SelectItem value="departmentName,desc">
                  Department (Z-A)
                </SelectItem>
                <SelectItem value="hiredAt,desc">Hire Date (newest)</SelectItem>
                <SelectItem value="hiredAt,asc">Hire Date (oldest)</SelectItem>
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
                  <TableHead>Role</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Specialization</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="py-10 text-center">
                      <Spinner className="mx-auto text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                ) : employees.length ? (
                  employees.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="font-medium">
                        {row.fullName}
                      </TableCell>
                      <TableCell>
                        <RoleBadge role={row.role} />
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {row.departmentName || "N/A"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {row.specialization || "N/A"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {row.email}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {row.phoneNumber || "N/A"}
                      </TableCell>
                      <TableCell>
                        <EmployeeStatusBadge status={row.status} />
                      </TableCell>
                      <TableCell className="text-right">
                        <DataTableRowActions
                          rowId={row.id}
                          actions={[
                            {
                              label: "View details",
                              href: `/admin/hr/employees/${row.id}`,
                            },
                            ...(isAdmin
                              ? [
                                  {
                                    label: "Edit",
                                    href: `/admin/hr/employees/${row.id}/edit`,
                                  },
                                  {
                                    label: "Delete",
                                    onClick: () => {
                                      setEmployeeToDelete({
                                        id: row.id,
                                        fullName: row.fullName,
                                      });
                                      setDeleteDialogOpen(true);
                                    },
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
                      colSpan={8}
                      className="py-10 text-center text-muted-foreground"
                    >
                      No employees found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Employee</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <strong>{employeeToDelete?.fullName}</strong>? This action cannot
              be undone. If the employee has upcoming appointments, you will
              need to cancel them first.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (employeeToDelete) {
                  handleDelete(employeeToDelete.id, employeeToDelete.fullName);
                  setDeleteDialogOpen(false);
                  setEmployeeToDelete(null);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteEmployee.isPending}
            >
              {deleteEmployee.isPending ? (
                <>
                  <Spinner size="sm" className="mr-2" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

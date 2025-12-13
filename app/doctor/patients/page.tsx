"use client";

import { useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePatients, useDeletePatient } from "@/hooks/queries/usePatient";
import {
  PatientFiltersBar,
  PatientFilters,
} from "../../admin/patients/_components";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import {
  Plus,
  Loader2,
  LayoutGrid,
  List,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Users,
  ArrowUpDown,
} from "lucide-react";
import { DataTablePagination } from "@/components/ui/data-table-pagination";
import { format } from "date-fns";
import { Patient, PatientListParams } from "@/interfaces/patient";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { appointmentService } from "@/services/appointment.service";

type ViewMode = "table" | "grid";

export default function DoctorPatientsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [sort, setSort] = useState<{
    field: string;
    direction: "asc" | "desc";
  }>({
    field: "fullName",
    direction: "asc",
  });
  const [filters, setFilters] = useState<PatientFilters>({
    search: "",
    gender: undefined,
    bloodType: undefined,
  });

  // DOCTOR FILTER: Add doctorId to params to filter only their patients
  const params: PatientListParams = {
    page,
    size: pageSize,
    search: filters.search || undefined,
    gender: filters.gender,
    bloodType: filters.bloodType,
    sort: `${sort.field},${sort.direction}`,
    // TODO: Backend needs to support doctorId filter
    // doctorId: user?.employeeId, // Filter by current doctor
  } as any;

  const { data, isLoading } = usePatients(params);

  const patients = data?.content || [];
  const totalPages = data?.totalPages || 0;
  const totalElements = data?.totalElements || 0;

  const handleFilterChange = useCallback((newFilters: PatientFilters) => {
    setFilters(newFilters);
    setPage(0);
  }, []);

  const handleSort = useCallback((field: string) => {
    setSort((prev) => ({
      field,
      direction:
        prev.field === field && prev.direction === "asc" ? "desc" : "asc",
    }));
    setPage(0);
  }, []);

  const handleViewPatient = useCallback(
    (id: string) => {
      router.push(`/doctor/patients/${id}`);
    },
    [router]
  );

  const handleEditPatient = useCallback(
    (id: string) => {
      router.push(`/doctor/patients/${id}/edit`);
    },
    [router]
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Patients</h1>
          <p className="text-muted-foreground mt-1">
            Patients you have appointments with
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === "table" ? "secondary" : "ghost"}
            size="icon"
            onClick={() => setViewMode("table")}
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "grid" ? "secondary" : "ghost"}
            size="icon"
            onClick={() => setViewMode("grid")}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Filters */}
      <PatientFiltersBar
        filters={filters}
        onFiltersChange={handleFilterChange}
      />

      {/* Results Count */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4" />
          <span className="text-sm font-medium leading-none">
            Showing {patients.length} of {totalElements} patient
            {totalElements !== 1 ? "s" : ""}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium leading-none">
            Rows per page:
          </span>
          <Select
            value={String(pageSize)}
            onValueChange={(val) => {
              setPageSize(Number(val));
              setPage(0);
            }}
          >
            <SelectTrigger className="w-20 h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5</SelectItem>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Content */}
      {viewMode === "table" ? (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort("fullName")}
                      className="gap-2"
                    >
                      Patient
                      <ArrowUpDown className="h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort("gender")}
                      className="gap-2"
                    >
                      Gender
                      <ArrowUpDown className="h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>Blood Type</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort("createdAt")}
                      className="gap-2"
                    >
                      Registered
                      <ArrowUpDown className="h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {patients.map((patient) => (
                  <TableRow key={patient.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback>
                            {patient.fullName.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{patient.fullName}</div>
                          {patient.email && (
                            <div className="text-sm text-muted-foreground">
                              {patient.email}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {patient.gender ? (
                        <Badge
                          variant="outline"
                          className="text-xs font-medium"
                        >
                          {patient.gender}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {patient.bloodType ? (
                        <Badge
                          variant="destructive"
                          className="text-xs font-medium bg-red-100 text-red-800 hover:bg-red-200"
                        >
                          {patient.bloodType}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>{patient.phoneNumber || "-"}</TableCell>
                    <TableCell>
                      {patient.createdAt
                        ? format(new Date(patient.createdAt), "MMM d, yyyy")
                        : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => handleViewPatient(patient.id)}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleEditPatient(patient.id)}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
                {patients.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12">
                      <div className="flex flex-col items-center gap-2">
                        <Users className="h-12 w-12 text-muted-foreground" />
                        <p className="text-lg font-medium">No patients found</p>
                        <p className="text-sm text-muted-foreground">
                          No patients match your filters
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {patients.map((patient) => (
            <Link
              key={patient.id}
              href={`/doctor/patients/${patient.id}`}
              className="block"
            >
              <Card className="hover:shadow-md transition-shadow h-full">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <Avatar className="h-12 w-12 flex-shrink-0">
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {patient.fullName
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()
                            .slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate">
                          {patient.fullName}
                        </p>
                        <p className="text-sm text-muted-foreground truncate">
                          {patient.phoneNumber}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {patient.gender && (
                      <Badge variant="secondary" className="text-xs">
                        {patient.gender.charAt(0) +
                          patient.gender.slice(1).toLowerCase()}
                      </Badge>
                    )}
                    {patient.dateOfBirth && (
                      <Badge variant="outline" className="text-xs">
                        {(() => {
                          const today = new Date();
                          const birth = new Date(patient.dateOfBirth);
                          let age = today.getFullYear() - birth.getFullYear();
                          const m = today.getMonth() - birth.getMonth();
                          if (
                            m < 0 ||
                            (m === 0 && today.getDate() < birth.getDate())
                          ) {
                            age--;
                          }
                          return `${age} yrs`;
                        })()}
                      </Badge>
                    )}
                    {patient.bloodType && (
                      <Badge
                        variant="destructive"
                        className="text-xs font-medium bg-red-100 text-red-800 hover:bg-red-200"
                      >
                        {patient.bloodType}
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
          {patients.length === 0 && (
            <div className="col-span-full">
              <Card>
                <CardContent className="flex flex-col items-center gap-2 py-12">
                  <Users className="h-12 w-12 text-muted-foreground" />
                  <p className="text-lg font-medium">No patients found</p>
                  <p className="text-sm text-muted-foreground">
                    No patients match your filters
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <DataTablePagination
          currentPage={page}
          totalPages={totalPages}
          totalElements={totalElements}
          pageSize={pageSize}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}

"use client";

import { useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CalendarDays, Plus, Search } from "lucide-react";
import { format } from "date-fns";
import { SortingState } from "@tanstack/react-table";
import Link from "next/link";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { DataTable } from "@/components/ui/data-table";
import { DataTablePagination } from "@/components/ui/data-table-pagination";

import { AppointmentStatus, Appointment } from "@/interfaces/appointment";
import {
  useAppointmentList,
  useCancelAppointment,
  useCompleteAppointment,
} from "@/hooks/queries/useAppointment";
import { useDebounce } from "@/hooks/useDebounce";
import { useEmployees } from "@/hooks/queries/useHr";
import { useAuth } from "@/contexts/AuthContext";
import { CancelAppointmentDialog } from "@/app/admin/appointments/_components/cancel-appointment-dialog";
import { getAppointmentColumnsByRole } from "@/components/appointment/AppointmentColumnsShared";

const PAGE_SIZE_OPTIONS = [10, 20, 50];

type UserRole = "ADMIN" | "DOCTOR" | "NURSE" | "PATIENT";

interface AppointmentListSharedProps {
  role: UserRole;
}

export function AppointmentListShared({ role }: AppointmentListSharedProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const paramDate = searchParams.get("date");
  const paramDoctorId = searchParams.get("doctorId");

  // State
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<AppointmentStatus | "ALL">("ALL");
  const [doctorId, setDoctorId] = useState<string>(paramDoctorId || "ALL");
  const [startDate, setStartDate] = useState<Date | undefined>(
    paramDate ? new Date(paramDate) : undefined
  );
  const [endDate, setEndDate] = useState<Date | undefined>(
    paramDate ? new Date(paramDate) : undefined
  );
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [sorting, setSorting] = useState<SortingState>([
    { id: "appointmentTime", desc: true },
  ]);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] =
    useState<Appointment | null>(null);

  const debouncedSearch = useDebounce(search, 300);

  const sortParams = useMemo(() => {
    if (sorting.length === 0) return "appointmentTime,desc";
    const { id, desc } = sorting[0];
    return `${id},${desc ? "desc" : "asc"}`;
  }, [sorting]);

  // Auto-filter for DOCTOR and PATIENT roles
  const effectiveDoctorId = useMemo(() => {
    if (role === "DOCTOR") return user?.employeeId || "";
    if (doctorId === "ALL") return undefined;
    return doctorId;
  }, [role, doctorId, user?.employeeId]);

  const effectivePatientId = useMemo(() => {
    if (role === "PATIENT") {
      return user?.patientId || "";
    }
    return undefined;
  }, [role, user?.patientId]);

  // Build query params
  const queryParams = useMemo(
    () => ({
      page,
      size: pageSize,
      search: debouncedSearch || undefined,
      status: status === "ALL" ? undefined : status,
      doctorId: effectiveDoctorId,
      patientId: effectivePatientId,
      startDate: startDate ? format(startDate, "yyyy-MM-dd") : undefined,
      endDate: endDate ? format(endDate, "yyyy-MM-dd") : undefined,
      sort: sortParams,
    }),
    [
      page,
      pageSize,
      debouncedSearch,
      status,
      effectiveDoctorId,
      effectivePatientId,
      startDate,
      endDate,
      sortParams,
    ]
  );

  const { data, isLoading, isFetching } = useAppointmentList(queryParams);
  const { data: doctorsData } = useEmployees({ role: "DOCTOR", size: 999 });
  const cancelMutation = useCancelAppointment();
  const completeMutation = useCompleteAppointment();

  const doctors = useMemo(() => doctorsData?.content ?? [], [doctorsData]);

  const handleCancelClick = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setCancelDialogOpen(true);
  };

  const handleCompleteClick = (appointment: Appointment) => {
    if (confirm("Mark this appointment as completed?")) {
      completeMutation.mutate(appointment.id);
    }
  };

  const handleEditClick = (appointment: Appointment) => {
    const basePath = role === "ADMIN" ? "/admin" : `/${role.toLowerCase()}`;
    router.push(`${basePath}/appointments/${appointment.id}/edit`);
  };

  const columns = useMemo(
    () =>
      getAppointmentColumnsByRole(
        role,
        handleCancelClick,
        handleCompleteClick,
        handleEditClick
      ),
    [role]
  );

  // Permission checks
  const canCreate = role === "ADMIN" || role === "NURSE" || role === "DOCTOR";
  const canFilterByDoctor = role === "ADMIN" || role === "NURSE";
  const canFilterByStatus = true; // All roles can filter by status

  const appointments = data?.content || [];
  const totalPages = data?.totalPages || 0;
  const totalElements = data?.totalElements || 0;

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {role === "PATIENT" ? "My Appointments" : "Appointments"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {role === "DOCTOR"
              ? "Manage your scheduled appointments"
              : role === "PATIENT"
                ? "View and manage your appointments"
                : "Manage all patient appointments"}
          </p>
        </div>
        {canCreate && (
          <Button asChild>
            <Link
              href={
                role === "DOCTOR"
                  ? "/admin/appointments/new"
                  : `/${role.toLowerCase()}/appointments/new`
              }
            >
              <Plus className="mr-2 h-4 w-4" />
              Book Appointment
            </Link>
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            {/* Search */}
            <div className="relative flex-1 sm:max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={
                  role === "PATIENT"
                    ? "Search by doctor name..."
                    : "Search by patient name..."
                }
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(0);
                }}
                className="pl-9"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Status Filter */}
              {canFilterByStatus && (
                <Select
                  value={status}
                  onValueChange={(value) => {
                    setStatus(value as AppointmentStatus | "ALL");
                    setPage(0);
                  }}
                >
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Status</SelectItem>
                    <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                    <SelectItem value="CANCELLED">Cancelled</SelectItem>
                    <SelectItem value="NO_SHOW">No Show</SelectItem>
                  </SelectContent>
                </Select>
              )}

              {/* Doctor Filter - Only for ADMIN/NURSE */}
              {canFilterByDoctor && (
                <Select
                  value={doctorId}
                  onValueChange={(value) => {
                    setDoctorId(value);
                    setPage(0);
                  }}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Doctor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Doctors</SelectItem>
                    {doctors.map((doctor) => (
                      <SelectItem key={doctor.id} value={doctor.id}>
                        {doctor.fullName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {/* Date Range */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-[140px] justify-start">
                    <CalendarDays className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "MMM dd") : "Start date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={(date) => {
                      setStartDate(date);
                      setPage(0);
                    }}
                  />
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-[140px] justify-start">
                    <CalendarDays className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "MMM dd") : "End date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={(date) => {
                      setEndDate(date);
                      setPage(0);
                    }}
                  />
                </PopoverContent>
              </Popover>

              {(startDate || endDate) && (
                <Button
                  variant="ghost"
                  onClick={() => {
                    setStartDate(undefined);
                    setEndDate(undefined);
                    setPage(0);
                  }}
                  className="h-8 px-2 lg:px-3"
                >
                  Clear
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={appointments}
            sorting={sorting}
            onSortingChange={setSorting}
          />
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalElements > 0 && (
        <div className="border-t px-4 py-3">
          <DataTablePagination
            currentPage={page}
            totalPages={totalPages}
            totalElements={totalElements}
            pageSize={pageSize}
            onPageChange={setPage}
            showRowsPerPage={true}
            rowsPerPageOptions={PAGE_SIZE_OPTIONS}
            rowsPerPage={pageSize}
            onRowsPerPageChange={(newSize) => {
              setPageSize(newSize);
              setPage(0);
            }}
          />
        </div>
      )}

      {/* Cancel Dialog */}
      <CancelAppointmentDialog
        open={cancelDialogOpen}
        onOpenChange={setCancelDialogOpen}
        onConfirm={(reason: string) => {
          if (selectedAppointment) {
            cancelMutation.mutate(
              {
                id: selectedAppointment.id,
                data: {
                  cancelReason: reason,
                },
              },
              {
                onSuccess: () => {
                  setCancelDialogOpen(false);
                  setSelectedAppointment(null);
                },
              }
            );
          }
        }}
        isLoading={cancelMutation.isPending}
      />
    </div>
  );
}

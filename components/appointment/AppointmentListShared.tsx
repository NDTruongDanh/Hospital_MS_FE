"use client";

import { useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CalendarDays, Plus, Search, Calendar, List, LayoutGrid } from "lucide-react";
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
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { DataTable } from "@/components/ui/data-table";
import { DataTablePagination } from "@/components/ui/data-table-pagination";
import { ListPageHeader } from "@/components/ui/list-page-header";
import { FilterPills } from "@/components/ui/filter-pills";
import { ListEmptyState } from "@/components/ui/list-empty-state";
import { DateRangeFilter, DateRange } from "@/components/ui/date-range-filter";

import { AppointmentStatus, Appointment } from "@/interfaces/appointment";
import {
  useAppointmentList,
  useCancelAppointment,
  useCompleteAppointment,
} from "@/hooks/queries/useAppointment";
import { useDebounce } from "@/hooks/useDebounce";
import { useEmployees, useMyEmployeeProfile } from "@/hooks/queries/useHr";
import { useMyProfile } from "@/hooks/queries/usePatient";
import { Employee } from "@/interfaces/hr";
import { useAuth } from "@/contexts/AuthContext";
import { CancelAppointmentDialog } from "@/app/admin/appointments/_components/cancel-appointment-dialog";
import { getAppointmentColumnsByRole } from "@/components/appointment/AppointmentColumnsShared";
import { AppointmentScheduleView } from "@/components/appointment/AppointmentScheduleView";
import { VitalSignsDialog } from "@/components/nurse/VitalSignsDialog";

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
  const [dateRange, setDateRange] = useState<DateRange | undefined>(
    paramDate ? { from: new Date(paramDate), to: new Date(paramDate) } : undefined
  );
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [sorting, setSorting] = useState<SortingState>([
    { id: "appointmentTime", desc: true },
  ]);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] =
    useState<Appointment | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "schedule">("list");
  
  // Vital Signs Dialog state - lifted up to prevent re-render issues
  const [vitalDialogOpen, setVitalDialogOpen] = useState(false);
  const [vitalAppointment, setVitalAppointment] = useState<Appointment | null>(null);

  const debouncedSearch = useDebounce(search, 300);

  const sortParams = useMemo(() => {
    if (sorting.length === 0) return "appointmentTime,desc";
    const { id, desc } = sorting[0];
    return `${id},${desc ? "desc" : "asc"}`;
  }, [sorting]);

  // Fetch current user's employee profile for doctor filtering
  const { data: myEmployeeProfile } = useMyEmployeeProfile();

  // Fetch current user's patient profile for patient filtering
  const { data: myPatientProfile } = useMyProfile();

  // Auto-filter for DOCTOR and PATIENT roles
  const effectiveDoctorId = useMemo(() => {
    if (role === "DOCTOR") {
      // Use fetched employeeId from profile if available
      return myEmployeeProfile?.id || user?.employeeId || "";
    }
    if (doctorId === "ALL") return undefined;
    return doctorId;
  }, [role, doctorId, user?.employeeId, myEmployeeProfile?.id]);

  const effectivePatientId = useMemo(() => {
    // For PATIENT role: use patientId from patient profile to filter appointments
    if (role === "PATIENT") {
      return myPatientProfile?.id || undefined;
    }
    return undefined;
  }, [role, myPatientProfile?.id]);

  // Build query params
  const queryParams = useMemo(
    () => ({
      page,
      size: pageSize,
      search: debouncedSearch || undefined,
      status: status === "ALL" ? undefined : status,
      doctorId: effectiveDoctorId,
      patientId: effectivePatientId,
      startDate: dateRange?.from ? format(dateRange.from, "yyyy-MM-dd") : undefined,
      endDate: dateRange?.to ? format(dateRange.to, "yyyy-MM-dd") : undefined,
      sort: sortParams,
    }),
    [
      page,
      pageSize,
      debouncedSearch,
      status,
      effectiveDoctorId,
      effectivePatientId,
      dateRange,
      sortParams,
    ]
  );

  const { data, isLoading, isFetching } = useAppointmentList(queryParams);
  
  // Separate query for global stats (ignores status filter)
  const statsQueryParams = useMemo(
    () => ({
      page: 0,
      size: 200, // Fetch enough for accurate stats
      doctorId: effectiveDoctorId,
      patientId: effectivePatientId,
      // No status filter - get all statuses for accurate counts
    }),
    [effectiveDoctorId, effectivePatientId]
  );
  const { data: statsData } = useAppointmentList(statsQueryParams);
  
  // Only fetch doctors for admin/nurse - patients don't have access to HR API
  const canFilterByDoctor = role === "ADMIN" || role === "NURSE";
  const { data: doctorsData } = useEmployees({ role: "DOCTOR", size: 999, enabled: canFilterByDoctor });
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

  const handleVitalSignsClick = (appointment: Appointment) => {
    setVitalAppointment(appointment);
    setVitalDialogOpen(true);
  };

  const columns = useMemo(
    () =>
      getAppointmentColumnsByRole(
        role,
        handleCancelClick,
        handleCompleteClick,
        handleEditClick,
        user?.role, // Pass actual user role for nurse vital signs check
        handleVitalSignsClick // Vital signs callback
      ),
    [role, user?.role]
  );

  // Permission checks - PATIENT can create appointments after verification
  // NOTE: DOCTOR removed - doctors typically don't book appointments (receptionist/admin do)
  const canCreate = role === "ADMIN" || role === "NURSE" || role === "PATIENT";
  const canFilterByStatus = true; // All roles can filter by status

  const appointments = data?.content || [];
  const totalPages = data?.totalPages || 0;
  const totalElements = data?.totalElements || 0;

  // Calculate stats from global data (not filtered by status)
  const allAppointments = statsData?.content || [];
  const globalTotalElements = statsData?.totalElements || totalElements;
  const scheduledCount = useMemo(() => allAppointments.filter((a: Appointment) => a.status === "SCHEDULED").length, [allAppointments]);
  const completedCount = useMemo(() => allAppointments.filter((a: Appointment) => a.status === "COMPLETED").length, [allAppointments]);
  const cancelledCount = useMemo(() => allAppointments.filter((a: Appointment) => a.status === "CANCELLED").length, [allAppointments]);

  return (
    <div className="w-full space-y-6">
      {/* Enhanced Header */}
      <ListPageHeader
        title={role === "PATIENT" ? "Lịch hẹn của tôi" : "Appointments"}
        description={
          role === "DOCTOR"
            ? "Manage your scheduled appointments"
            : role === "PATIENT"
            ? "Xem và quản lý các lịch hẹn khám bệnh"
            : "Manage all patient appointments"
        }
        theme="violet"
        icon={<Calendar className="h-6 w-6 text-white" />}
        stats={[
          { label: role === "PATIENT" ? "Tổng" : "Total", value: globalTotalElements },
          { label: role === "PATIENT" ? "Đã lên lịch" : "Scheduled", value: scheduledCount },
          { label: role === "PATIENT" ? "Hoàn thành" : "Completed", value: completedCount },
        ]}
        primaryAction={
          canCreate
            ? {
                label: role === "PATIENT" ? "Đặt lịch hẹn" : "Book Appointment",
                href: `/${role.toLowerCase()}/appointments/new`,
              }
            : undefined
        }
      />

      {/* Quick Filter Pills */}
      <FilterPills
        filters={[
          { id: "ALL", label: role === "PATIENT" ? "Tất cả" : "All", count: totalElements },
          { id: "SCHEDULED", label: role === "PATIENT" ? "Đã lên lịch" : "Scheduled", count: scheduledCount, countColor: "success" },
          { id: "COMPLETED", label: role === "PATIENT" ? "Hoàn thành" : "Completed", count: completedCount },
          { id: "CANCELLED", label: role === "PATIENT" ? "Đã hủy" : "Cancelled", count: cancelledCount, countColor: cancelledCount > 0 ? "danger" : "default" },
          { id: "NO_SHOW", label: role === "PATIENT" ? "Vắng mặt" : "No Show" },
        ]}
        activeFilter={status}
        onFilterChange={(id) => {
          setStatus(id as AppointmentStatus | "ALL");
          setPage(0);
        }}
      />

      {/* View Toggle & Filters Row */}
      <div className="flex flex-wrap items-center gap-4">
        {/* View Toggle */}
        <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
          <Button
            variant={viewMode === "list" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("list")}
            className="h-8 px-3"
          >
            <List className="h-4 w-4 mr-1" />
            {role === "PATIENT" ? "Danh sách" : "List"}
          </Button>
          <Button
            variant={viewMode === "schedule" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("schedule")}
            className="h-8 px-3"
          >
            <LayoutGrid className="h-4 w-4 mr-1" />
            {role === "PATIENT" ? "Lịch" : "Schedule"}
          </Button>
        </div>

        <div className="h-6 w-px bg-slate-200" />

        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={
              role === "PATIENT"
                ? "Tìm theo tên bác sĩ..."
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
              {doctors.map((doctor: Employee) => (
                <SelectItem key={doctor.id} value={doctor.id}>
                  {doctor.fullName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Date Range Filter */}
        <DateRangeFilter
          value={dateRange}
          onChange={(range) => {
            setDateRange(range);
            setPage(0);
          }}
          theme="purple"
          presetKeys={["all", "today", "7days", "30days", "thisMonth"]}
        />
      </div>

      {/* Content based on view mode */}
      {viewMode === "schedule" ? (
        <AppointmentScheduleView
          appointments={appointments}
          onAppointmentClick={(apt) => {
            const basePath =
              role === "DOCTOR"
                ? "/doctor/appointments"
                : role === "PATIENT"
                ? "/patient/appointments"
                : "/admin/appointments";
            router.push(`${basePath}/${apt.id}`);
          }}
          onEmptySlotClick={
            canCreate
              ? (date) => {
                  const basePath = `/${role.toLowerCase()}/appointments/new`;
                  router.push(`${basePath}?date=${format(date, "yyyy-MM-dd")}&time=${format(date, "HH:mm")}`);
                }
              : undefined
          }
          isLoading={isLoading}
        />
      ) : (
        <>
          {/* Table Card */}
          <Card className="border-2 border-slate-200 shadow-md rounded-xl">
            <CardContent className="p-0">
              <DataTable
                columns={columns}
                data={appointments}
                sorting={sorting}
                onSortingChange={setSorting}
                onRowClick={(apt) => {
                  const basePath =
                    role === "DOCTOR"
                      ? "/doctor/appointments"
                      : role === "PATIENT"
                      ? "/patient/appointments"
                      : "/admin/appointments";
                  router.push(`${basePath}/${apt.id}`);
                }}
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
        </>
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

      {/* Vital Signs Dialog - lifted state to prevent re-render issues */}
      {vitalAppointment && (
        <VitalSignsDialog
          appointmentId={vitalAppointment.id}
          patientName={vitalAppointment.patient?.fullName || "Bệnh nhân"}
          open={vitalDialogOpen}
          onOpenChange={(open) => {
            setVitalDialogOpen(open);
            if (!open) {
              setVitalAppointment(null);
            }
          }}
        />
      )}
    </div>
  );
}

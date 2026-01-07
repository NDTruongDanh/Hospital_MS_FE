"use client";

import { useEffect, useMemo, useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import { addDays, format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
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
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDoctorSchedules, useMyEmployeeProfile } from "@/hooks/queries/useHr";
import { useAppointmentList } from "@/hooks/queries/useAppointment";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, CalendarDays, ClipboardList, CalendarCheck, Clock, Users, CheckCircle2 } from "lucide-react";
import { AppointmentScheduleView } from "@/components/appointment/AppointmentScheduleView";
import { isToday, isThisWeek, startOfWeek } from "date-fns";

type ScheduleStatus = "AVAILABLE" | "BOOKED" | "CANCELLED";

const statusTone: Record<ScheduleStatus, string> = {
  AVAILABLE: "bg-emerald-100 text-emerald-700",
  BOOKED: "bg-blue-100 text-blue-700",
  CANCELLED: "bg-red-100 text-red-700",
};

const SchedulePageSkeleton = () => (
  <div className="container mx-auto py-6 space-y-6">
    <div>
      <Skeleton className="h-9 w-48" />
      <Skeleton className="h-5 w-64 mt-1" />
    </div>
    <Skeleton className="h-12 w-80" />
    <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
      <Card className="shadow-sm">
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48 mt-1" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-40 w-full" />
        </CardContent>
      </Card>
      <Card className="shadow-sm w-full">
        <CardHeader>
          <Skeleton className="h-6 w-24" />
        </CardHeader>
        <CardContent className="p-0">
          <div className="p-4 border-t">
            <Skeleton className="h-10 w-full mb-2" />
            <Skeleton className="h-10 w-full mb-2" />
            <Skeleton className="h-10 w-full" />
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
);

// Work Schedules Tab Content
function WorkSchedulesTab({ 
  doctorId,
  dateRange,
  setDateRange,
  appointmentCountsByDate,
}: {
  doctorId: string;
  dateRange: { from: Date; to: Date };
  setDateRange: (range: { from: Date; to: Date }) => void;
  appointmentCountsByDate: Record<string, number>;
}) {
  const router = useRouter();
  const { data, isLoading } = useDoctorSchedules({
    startDate: format(dateRange.from, "yyyy-MM-dd"),
    endDate: format(dateRange.to, "yyyy-MM-dd"),
    doctorId,
    enabled: !!doctorId,
  });

  return (
    <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
      {/* Date Range Picker - Full width on mobile */}
      <Card className="shadow-sm order-2 lg:order-1">
        <CardHeader>
          <CardTitle>Khoảng thời gian</CardTitle>
          <CardDescription>Chọn ngày bắt đầu và kết thúc</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start-date" className="text-sm font-medium leading-none">
                Start
              </Label>
              <Input
                id="start-date"
                type="date"
                value={format(dateRange.from, "yyyy-MM-dd")}
                onChange={(e) =>
                  setDateRange({
                    ...dateRange,
                    from: e.target.value ? new Date(e.target.value) : dateRange.from,
                  })
                }
                className="h-10"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end-date" className="text-sm font-medium leading-none">
                End
              </Label>
              <Input
                id="end-date"
                type="date"
                value={format(dateRange.to, "yyyy-MM-dd")}
                onChange={(e) =>
                  setDateRange({
                    ...dateRange,
                    to: e.target.value ? new Date(e.target.value) : dateRange.to,
                  })
                }
                className="h-10"
              />
            </div>
          </div>
          <Calendar
            mode="range"
            selected={{ from: dateRange.from, to: dateRange.to }}
            onSelect={(range) => {
              if (range?.from && range?.to)
                setDateRange({ from: range.from, to: range.to });
            }}
            defaultMonth={dateRange.from}
            numberOfMonths={1}
          />
        </CardContent>
      </Card>

      {/* Schedule Table - shows first on mobile */}
      <Card className="shadow-sm w-full order-1 lg:order-2">
        <CardHeader className="flex-row items-center justify-between gap-3">
          <div>
            <CardTitle className="text-lg">Lịch của tôi</CardTitle>
            <CardDescription>
              {format(dateRange.from, "dd/MM/yyyy")} - {format(dateRange.to, "dd/MM/yyyy")}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-hidden rounded-b-xl border-t">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ngày</TableHead>
                  <TableHead>Giờ</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Ghi chú</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                      Đang tải...
                    </TableCell>
                  </TableRow>
                ) : data?.content && data.content.length > 0 ? (
                  data.content.map((schedule: any) => {
                    const dateKey = schedule.workDate;
                    const appointmentCount = appointmentCountsByDate[dateKey] || 0;
                    const isBooked = schedule.status === "BOOKED" || appointmentCount > 0;
                    const displayStatus = appointmentCount > 0 ? "BOOKED" : schedule.status;

                    return (
                      <TableRow
                        key={schedule.id}
                        className={isBooked ? "cursor-pointer hover:bg-blue-50" : ""}
                        onClick={() => {
                          if (isBooked) {
                            router.push(`/doctor/appointments?date=${dateKey}`);
                          }
                        }}
                      >
                        <TableCell className="text-muted-foreground">
                          {format(new Date(schedule.workDate), "dd/MM/yyyy")}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {schedule.startTime} - {schedule.endTime}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className={`px-3 py-1 text-xs font-medium ${
                              statusTone[displayStatus as ScheduleStatus] || ""
                            }`}
                          >
                            {displayStatus}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {isBooked ? (
                            <span className="inline-flex items-center gap-1 text-blue-600 font-medium">
                              <CalendarDays className="h-4 w-4" />
                              {appointmentCount} cuộc hẹn
                            </span>
                          ) : (
                            <span className="text-muted-foreground">
                              {schedule.notes || "Trống"}
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="py-10 text-center text-muted-foreground">
                      Không có lịch
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function MySchedulesPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("schedules");
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date } | undefined>(undefined);

  // Get current doctor's employee profile
  const { data: myProfile, isLoading: isLoadingProfile } = useMyEmployeeProfile();
  const doctorId = myProfile?.id;

  useEffect(() => {
    setDateRange({
      from: new Date(),
      to: addDays(new Date(), 7),
    });
  }, []);

  // Fetch appointments for the doctor to count per day and for schedule view
  const { data: appointmentsData, isLoading: isLoadingAppointments } = useAppointmentList({
    doctorId,
    size: 100, // Fetch all to show in calendar
  });

  // Create stats for header and cards
  const appointmentStats = useMemo(() => {
    const appointments = appointmentsData?.content || [];
    
    const today = appointments.filter((apt: { appointmentTime: string }) => 
      isToday(new Date(apt.appointmentTime))
    ).length;
    const thisWeek = appointments.filter((apt: { appointmentTime: string }) => 
      isThisWeek(new Date(apt.appointmentTime), { weekStartsOn: 1 })
    ).length;
    const pending = appointments.filter((apt: { status: string }) => 
      apt.status === "SCHEDULED"
    ).length;
    const completed = appointments.filter((apt: { status: string }) => 
      apt.status === "COMPLETED"
    ).length;
    const total = appointments.length;
    return { today, thisWeek, pending, completed, total };
  }, [appointmentsData]);

  // Create a map of appointment counts per date
  const appointmentCountsByDate = useMemo(() => {
    const counts: Record<string, number> = {};
    if (appointmentsData?.content) {
      appointmentsData.content.forEach((apt: { appointmentTime: string }) => {
        const dateKey = apt.appointmentTime.split("T")[0];
        counts[dateKey] = (counts[dateKey] || 0) + 1;
      });
    }
    return counts;
  }, [appointmentsData]);

  if (!dateRange || isLoadingProfile) {
    return <SchedulePageSkeleton />;
  }

  // Show message if employee profile not found
  if (!doctorId && !isLoadingProfile) {
    return (
      <div className="container mx-auto py-6">
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="flex items-center gap-3 pt-6">
            <AlertCircle className="h-5 w-5 text-amber-600" />
            <div>
              <p className="font-medium text-amber-800">Employee Profile Not Found</p>
              <p className="text-sm text-amber-700">
                Your account is not linked to an employee record. Please contact an administrator.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Enhanced Gradient Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-sky-600 via-sky-500 to-cyan-500 p-6 text-white shadow-lg">
        {/* Background decoration */}
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
        <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-white/5" />
        
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          {/* Left: Title and description */}
          <div className="flex items-center gap-4">
            <div className="rounded-xl bg-white/20 p-3 backdrop-blur-sm">
              <CalendarDays className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">My Schedules</h1>
              <p className="mt-1 text-sky-100">
                Quản lý lịch trực và lịch hẹn khám của bạn
              </p>
            </div>
          </div>
          
          {/* Right: Stats - hidden on mobile, shown as cards instead */}
          <div className="hidden md:flex gap-6">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-sky-100 text-sm">
                <Clock className="h-4 w-4" />
                Today
              </div>
              <div className="text-2xl font-bold">{appointmentStats.today}</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-sky-100 text-sm">
                <CalendarCheck className="h-4 w-4" />
                This Week
              </div>
              <div className="text-2xl font-bold">{appointmentStats.thisWeek}</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-sky-100 text-sm">
                <Users className="h-4 w-4" />
                Total
              </div>
              <div className="text-2xl font-bold">{appointmentStats.total}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <Card className="border-0 shadow-md overflow-hidden relative">
          <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-sky-400/10 to-transparent rounded-bl-full" />
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Today</p>
                <p className="text-2xl font-bold text-slate-900">{appointmentStats.today}</p>
              </div>
              <div className="p-2.5 bg-sky-50 rounded-lg">
                <Clock className="h-5 w-5 text-sky-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md overflow-hidden relative">
          <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-violet-400/10 to-transparent rounded-bl-full" />
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">This Week</p>
                <p className="text-2xl font-bold text-slate-900">{appointmentStats.thisWeek}</p>
              </div>
              <div className="p-2.5 bg-violet-50 rounded-lg">
                <CalendarCheck className="h-5 w-5 text-violet-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md overflow-hidden relative">
          <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-amber-400/10 to-transparent rounded-bl-full" />
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Pending</p>
                <p className="text-2xl font-bold text-amber-600">{appointmentStats.pending}</p>
              </div>
              <div className="p-2.5 bg-amber-50 rounded-lg">
                <Users className="h-5 w-5 text-amber-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md overflow-hidden relative">
          <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-emerald-400/10 to-transparent rounded-bl-full" />
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Completed</p>
                <p className="text-2xl font-bold text-emerald-600">{appointmentStats.completed}</p>
              </div>
              <div className="p-2.5 bg-emerald-50 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="inline-flex h-12 items-center justify-center rounded-xl bg-slate-100 p-1.5 shadow-sm border border-slate-200 max-w-md">
          <TabsTrigger 
            value="schedules" 
            className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-sky-600 data-[state=inactive]:text-slate-600 data-[state=inactive]:hover:text-slate-900"
          >
            <ClipboardList className="h-4 w-4" />
            Work Schedules
          </TabsTrigger>
          <TabsTrigger 
            value="appointments" 
            className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-emerald-600 data-[state=inactive]:text-slate-600 data-[state=inactive]:hover:text-slate-900"
          >
            <CalendarCheck className="h-4 w-4" />
            Appointments
          </TabsTrigger>
        </TabsList>

        <TabsContent value="schedules" className="mt-6">
          <WorkSchedulesTab
            doctorId={doctorId!}
            dateRange={dateRange}
            setDateRange={setDateRange}
            appointmentCountsByDate={appointmentCountsByDate}
          />
        </TabsContent>

        <TabsContent value="appointments" className="mt-6">
          <AppointmentScheduleView
            appointments={appointmentsData?.content || []}
            isLoading={isLoadingAppointments}
            onAppointmentClick={(apt) => router.push(`/doctor/appointments/${apt.id}`)}
            showQuickActions={true}
            onMarkComplete={(apt) => router.push(`/doctor/appointments/${apt.id}/exam`)}
            onViewPatient={(patientId) => router.push(`/doctor/patients/${patientId}`)}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}


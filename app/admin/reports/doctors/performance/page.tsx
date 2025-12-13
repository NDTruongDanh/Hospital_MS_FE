"use client";

import { useState, useMemo, useEffect } from "react";
import { format, startOfMonth } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import {
  Download,
  Loader2,
  Users,
  Percent,
  DollarSign,
  FileText,
  Eye,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { ReportPageHeader } from "../../_components/report-page-header";
import {
  DateRangePicker,
  useDateRangePresets,
} from "../../_components/date-range-picker";
import { MetricCard } from "../../_components/metric-card";
import { useDoctorPerformance } from "@/hooks/queries/useReports";
import { useDepartments } from "@/hooks/queries/useHr";
import type { DoctorPerformanceItem } from "@/interfaces/reports";
import { cn } from "@/lib/utils";
import { exportToCSV } from "@/lib/utils/export";
import { useRouter } from "next/navigation";
import { EmptyReportState } from "@/components/reports/EmptyReportState";
import { CacheInfoBanner } from "@/components/reports/CacheInfoBanner";
import { RetryButton } from "@/components/reports/RetryButton";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";

// Completion Rate Badge
function CompletionRateBadge({ rate }: { rate: number }) {
  const getColor = () => {
    if (rate >= 90) return "bg-emerald-100 text-emerald-700";
    if (rate >= 80) return "bg-amber-100 text-amber-700";
    return "bg-red-100 text-red-700";
  };

  return (
    <Badge
      variant="secondary"
      className={cn("rounded-full px-3 py-1", getColor())}
    >
      {rate.toFixed(1)}%
    </Badge>
  );
}

// Doctor Detail Modal
function DoctorDetailModal({
  doctor,
  open,
  onClose,
}: {
  doctor: DoctorPerformanceItem | null;
  open: boolean;
  onClose: () => void;
}) {
  if (!doctor) return null;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{doctor.doctorName}</DialogTitle>
          <DialogDescription>
            {doctor.specialization} • {doctor.departmentName}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg border p-4 text-center">
              <p className="text-2xl font-bold">
                {doctor.statistics.patientsSeen}
              </p>
              <p className="text-sm text-muted-foreground">Patients Seen</p>
            </div>
            <div className="rounded-lg border p-4 text-center">
              <p className="text-2xl font-bold">
                <CompletionRateBadge rate={doctor.statistics.completionRate} />
              </p>
              <p className="text-sm text-muted-foreground">Completion Rate</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg border p-4 text-center">
              <p className="text-2xl font-bold">
                {formatCurrency(doctor.statistics.totalRevenue)}
              </p>
              <p className="text-sm text-muted-foreground">Total Revenue</p>
            </div>
            <div className="rounded-lg border p-4 text-center">
              <p className="text-2xl font-bold">
                {doctor.statistics.prescriptionsWritten}
              </p>
              <p className="text-sm text-muted-foreground">Prescriptions</p>
            </div>
          </div>
          <div className="rounded-lg border p-4">
            <h4 className="mb-2 font-medium">Appointment Summary</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <p className="text-muted-foreground">Total Appointments:</p>
              <p className="font-medium">
                {doctor.statistics.appointmentsTotal}
              </p>
              <p className="text-muted-foreground">Completed:</p>
              <p className="font-medium">
                {doctor.statistics.appointmentsCompleted}
              </p>
              <p className="text-muted-foreground">Avg. Consultation Time:</p>
              <p className="font-medium">
                {doctor.statistics.avgConsultationTime} min
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function DoctorPerformancePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [role, setRole] = useState<string>(user?.role || "ADMIN");
  const presets = useDateRangePresets();
  const [startDate, setStartDate] = useState<Date | undefined>(
    presets.thisMonth.startDate
  );
  const [endDate, setEndDate] = useState<Date | undefined>(
    presets.thisMonth.endDate
  );
  const [departmentId, setDepartmentId] = useState<string>("ALL");

  useEffect(() => {
    if (role && role !== "ADMIN") {
      router.replace("/doctor/reports/appointments");
    }
  }, [role, router]);
  const [sortBy, setSortBy] = useState<
    "completionRate" | "patientsSeen" | "totalRevenue"
  >("completionRate");
  const [selectedDoctor, setSelectedDoctor] =
    useState<DoctorPerformanceItem | null>(null);

  // Fetch departments for filter
  const { data: departmentsData } = useDepartments({ size: 100 });
  const departments = departmentsData?.content ?? [];

  // Fetch doctor performance
  const { data, isLoading, refetch } = useDoctorPerformance({
    startDate: startDate ? format(startDate, "yyyy-MM-dd") : "",
    endDate: endDate ? format(endDate, "yyyy-MM-dd") : "",
    departmentId: departmentId !== "ALL" ? departmentId : undefined,
    sortBy,
  });

  const doctors = data?.doctors ?? [];
  const summary = data?.summary;

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(value);
  };

  const handleExport = () => {
    const rows = doctors.map((doc) => ({
      doctorName: doc.doctorName,
      department: doc.departmentName,
      specialization: doc.specialization,
      completionRate: doc.statistics.completionRate,
      patientsSeen: doc.statistics.patientsSeen,
      totalRevenue: doc.statistics.totalRevenue,
      averageTicket:
        doc.statistics.patientsSeen > 0
          ? doc.statistics.totalRevenue / doc.statistics.patientsSeen
          : 0,
      // satisfaction: doc.statistics.satisfactionScore,
    }));
    exportToCSV(rows, "doctor-performance.csv");
  };

  const validateRange = () => {
    if (!startDate || !endDate) return true;
    const diff = endDate.getTime() - startDate.getTime();
    const max = 365 * 24 * 60 * 60 * 1000;
    if (diff > max) {
      toast.error("Khoảng ngày tối đa 1 năm");
      return false;
    }
    return true;
  };

  return (
    <div className="w-full space-y-6">
      <ReportPageHeader
        title="Doctor Performance"
        description="Analyze doctor performance metrics including completion rates and revenue"
        actions={
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        }
      />

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filter Options</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Date Range</label>
              <DateRangePicker
                startDate={startDate}
                endDate={endDate}
                onStartDateChange={setStartDate}
                onEndDateChange={setEndDate}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Department</label>
              <Select value={departmentId} onValueChange={setDepartmentId}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="All Departments" />
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
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Sort By</label>
              <Select
                value={sortBy}
                onValueChange={(v) =>
                  setSortBy(
                    v as "completionRate" | "patientsSeen" | "totalRevenue"
                  )
                }
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Sort By" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="completionRate">
                    Completion Rate
                  </SelectItem>
                  <SelectItem value="patientsSeen">Patients Seen</SelectItem>
                  <SelectItem value="totalRevenue">Total Revenue</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={() => {
                if (!validateRange()) return;
                refetch();
              }}
              disabled={isLoading}
            >
              {isLoading && <Spinner size="sm" className="mr-2" />}
              Generate Report
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Doctors"
          value={summary?.totalDoctors?.toString() ?? "---"}
          icon={Users}
          loading={isLoading}
        />
        <MetricCard
          title="Avg Completion Rate"
          value={`${summary?.avgCompletionRate?.toFixed(1) ?? "--"}%`}
          icon={Percent}
          loading={isLoading}
        />
        <MetricCard
          title="Total Patients Seen"
          value={summary?.totalPatientsSeen?.toLocaleString() ?? "---"}
          icon={Users}
          loading={isLoading}
        />
        <MetricCard
          title="Total Revenue"
          value={summary ? formatCurrency(summary.totalRevenue) : "---"}
          icon={DollarSign}
          loading={isLoading}
        />
      </div>

      {/* Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Table</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Doctor</TableHead>
                <TableHead>Department</TableHead>
                <TableHead className="text-right">Patients</TableHead>
                <TableHead className="text-center">Completion Rate</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
                <TableHead className="text-right">Prescriptions</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-10 text-center">
                    <Spinner className="mx-auto text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : doctors.length > 0 ? (
                doctors.map((doctor) => (
                  <TableRow key={doctor.doctorId}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{doctor.doctorName}</p>
                        <p className="text-xs text-muted-foreground">
                          {doctor.specialization}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {doctor.departmentName}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {doctor.statistics.patientsSeen}
                    </TableCell>
                    <TableCell className="text-center">
                      <CompletionRateBadge
                        rate={doctor.statistics.completionRate}
                      />
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(doctor.statistics.totalRevenue)}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {doctor.statistics.prescriptionsWritten}
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedDoctor(doctor)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7}>
                    <EmptyReportState description="No data available" />
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Doctor Detail Modal */}
      <DoctorDetailModal
        doctor={selectedDoctor}
        open={!!selectedDoctor}
        onClose={() => setSelectedDoctor(null)}
      />

      {/* Cache Info */}
      {data?.cached && <CacheInfoBanner generatedAt={data.generatedAt} />}
    </div>
  );
}

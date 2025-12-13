"use client";

import { useState, useMemo, useEffect } from "react";
import { format, startOfMonth } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import {
  Download,
  Loader2,
  Users,
  UserPlus,
  Activity,
  RotateCcw,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { ReportPageHeader } from "../../_components/report-page-header";
import {
  DateRangePicker,
  useDateRangePresets,
} from "../../_components/date-range-picker";
import { MetricCard } from "../../_components/metric-card";
import { ChartCard } from "../../_components/chart-card";
import { usePatientActivity } from "@/hooks/queries/useReports";
import { exportToCSV } from "@/lib/utils/export";
import { useRouter } from "next/navigation";
import { EmptyReportState } from "@/components/reports/EmptyReportState";
import { CacheInfoBanner } from "@/components/reports/CacheInfoBanner";
import { RetryButton } from "@/components/reports/RetryButton";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";

// Pie Chart Component
function PieChart({
  data,
  size = "md",
}: {
  data: { name: string; value: number; color: string }[];
  size?: "sm" | "md";
}) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const chartSize = size === "sm" ? "h-32 w-32" : "h-44 w-44";

  // Pre-calculate segments to avoid direct reassignment in render
  const segments = useMemo(() => {
    let cumulativePercent = 0;
    return data.map((item) => {
      const percent = (item.value / total) * 100;
      const dashArray = `${percent} ${100 - percent}`;
      const dashOffset = -cumulativePercent;
      cumulativePercent += percent;
      return { ...item, dashArray, dashOffset };
    });
  }, [data, total]);

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:gap-6">
      <div className="flex justify-center">
        <div className={`relative ${chartSize}`}>
          <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
            {segments.map((segment, i) => (
              <circle
                key={i}
                cx="50"
                cy="50"
                r="40"
                fill="transparent"
                stroke={segment.color}
                strokeWidth="20"
                strokeDasharray={segment.dashArray}
                strokeDashoffset={segment.dashOffset}
                className="transition-all duration-500"
              />
            ))}
          </svg>
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        {data.map((item, i) => (
          <div key={i} className="flex items-center gap-2 text-sm">
            <div
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            <span className="flex-1 text-muted-foreground">{item.name}</span>
            <span className="font-medium">{item.value}</span>
            <span className="w-10 text-right text-xs text-muted-foreground">
              {((item.value / total) * 100).toFixed(0)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Horizontal Bar Chart
function HorizontalBarChart({
  data,
  showPercentage = true,
}: {
  data: { name: string; value: number; subLabel?: string }[];
  showPercentage?: boolean;
}) {
  const maxValue = Math.max(...data.map((d) => d.value));
  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="space-y-2">
      {data.slice(0, 10).map((item, i) => (
        <div key={i} className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <div>
              <span className="font-medium">{item.name}</span>
              {item.subLabel && (
                <span className="ml-2 text-xs text-muted-foreground">
                  ({item.subLabel})
                </span>
              )}
            </div>
            <span className="text-muted-foreground">
              {item.value}
              {showPercentage &&
                ` (${((item.value / total) * 100).toFixed(1)}%)`}
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: `${(item.value / maxValue) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// Line Chart
function LineChart({
  data,
}: {
  data: { label: string; value: number; secondary?: number }[];
}) {
  const values = data.map((d) => d.value);
  const secondaryValues = data.map((d) => d.secondary ?? 0);
  const maxValue = Math.max(...values, ...secondaryValues);
  const minValue = Math.min(...values.filter((v) => v > 0));
  const range = maxValue - minValue || 1;

  return (
    <div className="space-y-2">
      <div className="flex h-[180px] items-end gap-1">
        {data.map((item, i) => {
          const height = ((item.value - minValue) / range) * 100 + 10;
          const secondaryHeight = item.secondary
            ? ((item.secondary - minValue) / range) * 100 + 10
            : 0;
          return (
            <div key={i} className="flex flex-1 flex-col items-center gap-1">
              <div
                className="flex w-full items-end justify-center gap-0.5"
                style={{ height: "160px" }}
              >
                <div
                  className="w-2 rounded-t bg-primary/80 transition-all duration-300"
                  style={{ height: `${height}%` }}
                  title={`New: ${item.value}`}
                />
                {item.secondary !== undefined && (
                  <div
                    className="w-2 rounded-t bg-blue-400/80 transition-all duration-300"
                    style={{ height: `${secondaryHeight}%` }}
                    title={`Visits: ${item.secondary}`}
                  />
                )}
              </div>
              <span className="text-[10px] text-muted-foreground">
                {item.label}
              </span>
            </div>
          );
        })}
      </div>
      <div className="flex justify-center gap-4 text-xs">
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 rounded bg-primary/80" />
          <span className="text-muted-foreground">New Patients</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 rounded bg-blue-400/80" />
          <span className="text-muted-foreground">Visits</span>
        </div>
      </div>
    </div>
  );
}

const genderColors: Record<string, string> = {
  MALE: "#3b82f6",
  FEMALE: "#ec4899",
  OTHER: "#8b5cf6",
};

const bloodTypeColors: Record<string, string> = {
  "O+": "#ef4444",
  "A+": "#f59e0b",
  "B+": "#22c55e",
  "AB+": "#8b5cf6",
  "O-": "#f87171",
  "A-": "#fbbf24",
  "B-": "#4ade80",
  "AB-": "#a78bfa",
};

export default function PatientActivityPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [role, setRole] = useState<string>("ADMIN");
  const presets = useDateRangePresets();
  const [startDate, setStartDate] = useState<Date | undefined>(
    presets.thisMonth.startDate
  );
  const [endDate, setEndDate] = useState<Date | undefined>(
    presets.thisMonth.endDate
  );
  const [status, setStatus] = useState<string>("ALL");

  useEffect(() => {
    const r = user?.role || null;
    setRole(r || "ADMIN");
  }, [user]);

  useEffect(() => {
    if (role && role !== "ADMIN") {
      router.replace("/doctor/reports/appointments");
    }
  }, [role, router]);

  // Fetch patient activity
  const { data, isLoading, refetch } = usePatientActivity({
    startDate: startDate ? format(startDate, "yyyy-MM-dd") : "",
    endDate: endDate ? format(endDate, "yyyy-MM-dd") : "",
    status: status !== "ALL" ? status : undefined,
  });

  // Chart data
  const genderPieData = useMemo(() => {
    if (!data?.patientsByGender) return [];
    return data.patientsByGender.map((item) => ({
      name: item.gender,
      value: item.count,
      color: genderColors[item.gender] || "#94a3b8",
    }));
  }, [data]);

  const bloodTypePieData = useMemo(() => {
    if (!data?.patientsByBloodType) return [];
    return data.patientsByBloodType.map((item) => ({
      name: item.bloodType,
      value: item.count,
      color: bloodTypeColors[item.bloodType] || "#94a3b8",
    }));
  }, [data]);

  const diagnosesData = useMemo(() => {
    if (!data?.topDiagnoses) return [];
    return data.topDiagnoses.map((item) => ({
      name: item.diagnosis,
      value: item.count,
      subLabel: item.icdCode,
    }));
  }, [data]);

  const trendData = useMemo(() => {
    if (!data?.registrationTrend) return [];
    return data.registrationTrend.map((item) => ({
      label: format(new Date(item.date), "dd/MM"),
      value: item.newPatients,
      secondary: item.visits,
    }));
  }, [data]);

  const handleExport = () => {
    const rows: any[] = [];
    data?.patientsByGender?.forEach((g) =>
      rows.push({ section: "gender", label: g.gender, value: g.count })
    );
    // data?.demographics?.ageGroups?.forEach((a) =>
    //   rows.push({ section: "age", label: a.range, value: a.count })
    // );
    data?.topDiagnoses?.forEach((d) =>
      rows.push({ section: "diagnosis", label: d.diagnosis, value: d.count })
    );
    data?.registrationTrend?.forEach((t) =>
      rows.push({ section: "trend", date: t.date, value: t.newPatients })
    );
    exportToCSV(rows, "patient-activity.csv");
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
        title="Patient Activity"
        description="Analyze patient demographics, registrations, and medical activity"
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
              <label className="text-sm font-medium">Patient Status</label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All</SelectItem>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="INACTIVE">Inactive</SelectItem>
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
          title="Total Patients"
          value={data?.totalPatients?.toLocaleString() ?? "---"}
          icon={Users}
          loading={isLoading}
        />
        <MetricCard
          title="New Patients"
          value={data?.newPatients?.toLocaleString() ?? "---"}
          icon={UserPlus}
          subLabel="Registered in period"
          loading={isLoading}
        />
        <MetricCard
          title="Active Patients"
          value={data?.activePatients?.toLocaleString() ?? "---"}
          icon={Activity}
          subLabel="With recent visits"
          loading={isLoading}
        />
        <MetricCard
          title="Returning Patients"
          value={data?.returningPatients?.toLocaleString() ?? "---"}
          icon={RotateCcw}
          subLabel="Multiple visits"
          loading={isLoading}
        />
      </div>

      {/* Demographics Row */}
      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard
          title="Patients by Gender"
          description="Gender distribution"
          loading={isLoading}
        >
          {genderPieData.length > 0 ? (
            <PieChart data={genderPieData} />
          ) : (
            <EmptyReportState description="No data available" />
          )}
        </ChartCard>

        <ChartCard
          title="Patients by Blood Type"
          description="Blood type distribution"
          loading={isLoading}
        >
          {bloodTypePieData.length > 0 ? (
            <PieChart data={bloodTypePieData} size="sm" />
          ) : (
            <EmptyReportState description="No data available" />
          )}
        </ChartCard>
      </div>

      {/* Diagnoses & Trend */}
      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard
          title="Top 10 Diagnoses"
          description="Most common diagnoses"
          loading={isLoading}
        >
          {diagnosesData.length > 0 ? (
            <HorizontalBarChart data={diagnosesData} />
          ) : (
            <EmptyReportState description="No data available" />
          )}
        </ChartCard>

        <ChartCard
          title="Registration Trend"
          description="New patients and visits over time"
          loading={isLoading}
        >
          {trendData.length > 0 ? (
            <LineChart data={trendData} />
          ) : (
            <EmptyReportState description="No data available" />
          )}
        </ChartCard>
      </div>

      {/* Cache Info */}
      {data?.cached && <CacheInfoBanner generatedAt={data.generatedAt} />}
    </div>
  );
}

"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { format, startOfMonth, subDays } from "date-fns";
import {
  DollarSign,
  Calendar,
  UserCheck,
  Users,
  RefreshCw,
  ArrowRight,
  Loader2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import { MetricCard } from "./_components/metric-card";
import { ChartCard } from "./_components/chart-card";
import {
  useDashboardReports,
  useClearReportCache,
} from "@/hooks/queries/useReports";
import { Spinner } from "@/components/ui/spinner";

// Simple chart components (can be replaced with a proper charting library)
function SimplePieChart({
  data,
}: {
  data: { name: string; value: number; color: string }[];
}) {
  const total = data.reduce((sum, item) => sum + item.value, 0);

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
    <div className="flex flex-col gap-4">
      <div className="flex h-[180px] items-center justify-center">
        <div className="relative h-40 w-40">
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
      <div className="flex flex-wrap justify-center gap-3">
        {data.map((item, i) => (
          <div key={i} className="flex items-center gap-2 text-sm">
            <div
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-muted-foreground">{item.name}</span>
            <span className="font-medium">
              {((item.value / total) * 100).toFixed(0)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SimpleLineChart({
  data,
}: {
  data: { label: string; value: number }[];
}) {
  const maxValue = Math.max(...data.map((d) => d.value));
  const minValue = Math.min(...data.map((d) => d.value));
  const range = maxValue - minValue || 1;

  return (
    <div className="flex h-[180px] items-end gap-1">
      {data.map((item, i) => {
        const height = ((item.value - minValue) / range) * 100 + 20;
        return (
          <div key={i} className="flex flex-1 flex-col items-center gap-1">
            <div
              className="w-full rounded-t bg-primary/80 transition-all duration-300 hover:bg-primary"
              style={{ height: `${height}%` }}
              title={`${item.label}: ${item.value}`}
            />
            <span className="text-[10px] text-muted-foreground">
              {item.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default function ReportsDashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [role, setRole] = useState<string>(user?.role || "ADMIN");
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (role && role !== "ADMIN") {
      router.replace("/doctor/reports/appointments");
    }
  }, [role, router]);

  // Default date range: current month
  const today = new Date();
  const startDate = format(startOfMonth(today), "yyyy-MM-dd");
  const endDate = format(today, "yyyy-MM-dd");

  const { revenue, appointments, doctors, patients, isLoading } =
    useDashboardReports(startDate, endDate);
  const clearCache = useClearReportCache();

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Pie chart data for appointments by status
  const appointmentsPieData = useMemo(() => {
    if (!appointments.data?.appointmentsByStatus) return [];
    const colors: Record<string, string> = {
      COMPLETED: "#22c55e",
      SCHEDULED: "#3b82f6",
      CONFIRMED: "#8b5cf6",
      CANCELLED: "#ef4444",
      NO_SHOW: "#f59e0b",
    };
    return appointments.data.appointmentsByStatus.map((item) => ({
      name: item.status.replace("_", " "),
      value: item.count,
      color: colors[item.status] || "#94a3b8",
    }));
  }, [appointments.data]);

  // Line chart data for revenue trend (last 7 days)
  const revenueTrendData = useMemo(() => {
    if (!appointments.data?.dailyTrend) return [];
    return appointments.data.dailyTrend.map((item) => ({
      label: format(new Date(item.date), "dd/MM"),
      value: item.count,
    }));
  }, [appointments.data]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await clearCache.mutateAsync();
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Reports & Analytics
          </h1>
          <p className="text-muted-foreground">
            Data as of: {format(today, "dd/MM/yyyy HH:mm")}
          </p>
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" disabled={isRefreshing}>
              {isRefreshing ? (
                <Spinner size="sm" className="mr-2" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Refresh Data
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Clear Report Cache?</AlertDialogTitle>
              <AlertDialogDescription>
                Clear all cached report data? Reports will be regenerated from
                source data on next request. This may take a few seconds.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleRefresh}>
                Clear & Refresh
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {role === "ADMIN" && (
          <MetricCard
            title="Total Revenue"
            value={
              revenue.data ? formatCurrency(revenue.data.totalRevenue) : "---"
            }
            icon={DollarSign}
            trend={{ value: 12, label: "vs last month" }}
            onClick={() => router.push("/admin/reports/revenue")}
            loading={revenue.isLoading}
          />
        )}
        <MetricCard
          title="Total Appointments"
          value={appointments.data?.totalAppointments.toLocaleString() ?? "---"}
          icon={Calendar}
          trend={{ value: 5, label: "vs last month" }}
          onClick={() => router.push("/admin/reports/appointments")}
          loading={appointments.isLoading}
        />
        {role === "ADMIN" && (
          <MetricCard
            title="Active Doctors"
            value={doctors.data?.summary?.totalDoctors.toString() ?? "---"}
            icon={UserCheck}
            subLabel={`Avg ${
              doctors.data?.summary?.avgCompletionRate.toFixed(0) ?? "--"
            }% completion`}
            onClick={() => router.push("/admin/reports/doctors/performance")}
            loading={doctors.isLoading}
          />
        )}
        {role === "ADMIN" && (
          <MetricCard
            title="Total Patients"
            value={patients.data?.totalPatients.toLocaleString() ?? "---"}
            icon={Users}
            trend={{ value: 8, label: "new this month" }}
            onClick={() => router.push("/admin/reports/patients/activity")}
            loading={patients.isLoading}
          />
        )}
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 md:grid-cols-2">
        <ChartCard
          title="Appointments Trend"
          description="Last 7 days"
          loading={appointments.isLoading}
        >
          {revenueTrendData.length > 0 ? (
            <SimpleLineChart data={revenueTrendData} />
          ) : (
            <div className="flex h-[200px] items-center justify-center text-muted-foreground">
              No data available
            </div>
          )}
        </ChartCard>

        <ChartCard
          title="Appointments by Status"
          description="Current period"
          loading={appointments.isLoading}
        >
          {appointmentsPieData.length > 0 ? (
            <SimplePieChart data={appointmentsPieData} />
          ) : (
            <div className="flex h-[200px] items-center justify-center text-muted-foreground">
              No data available
            </div>
          )}
        </ChartCard>
      </div>

      {/* Quick Links */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card
          className="cursor-pointer transition-all hover:shadow-md hover:border-primary/50"
          onClick={() => router.push("/admin/reports/revenue")}
        >
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-emerald-100 p-2">
                <DollarSign className="h-5 w-5 text-emerald-600" />
              </div>
              <span className="font-medium">View Full Revenue Report</span>
            </div>
            <ArrowRight className="h-5 w-5 text-muted-foreground" />
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer transition-all hover:shadow-md hover:border-primary/50"
          onClick={() => router.push("/admin/reports/appointments")}
        >
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-blue-100 p-2">
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
              <span className="font-medium">View Appointment Statistics</span>
            </div>
            <ArrowRight className="h-5 w-5 text-muted-foreground" />
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer transition-all hover:shadow-md hover:border-primary/50"
          onClick={() => router.push("/admin/reports/doctors/performance")}
        >
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-purple-100 p-2">
                <UserCheck className="h-5 w-5 text-purple-600" />
              </div>
              <span className="font-medium">View Doctor Performance</span>
            </div>
            <ArrowRight className="h-5 w-5 text-muted-foreground" />
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer transition-all hover:shadow-md hover:border-primary/50"
          onClick={() => router.push("/admin/reports/patients/activity")}
        >
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-amber-100 p-2">
                <Users className="h-5 w-5 text-amber-600" />
              </div>
              <span className="font-medium">View Patient Activity</span>
            </div>
            <ArrowRight className="h-5 w-5 text-muted-foreground" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

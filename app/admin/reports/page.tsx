"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { format, startOfMonth, subDays, subMonths } from "date-fns";
import { vi } from "date-fns/locale";
import {
  DollarSign,
  Calendar,
  UserCheck,
  Users,
  RefreshCw,
  ArrowRight,
  Loader2,
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  FileDown,
  Sparkles,
  Construction,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { MetricCard } from "./_components/metric-card";
import { ChartCard } from "./_components/chart-card";
import {
  useDashboardReports,
  useClearReportCache,
} from "@/hooks/queries/useReports";
import { Spinner } from "@/components/ui/spinner";
import { DateRangeFilter, DateRange } from "@/components/ui/date-range-filter";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// Enhanced Status Chart with horizontal bars (clearer display)
function EnhancedStatusChart({
  data,
}: {
  data: { name: string; value: number; color: string }[];
}) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const maxValue = Math.max(...data.map((d) => d.value), 1);

  if (total === 0) {
    return (
      <div className="flex h-[200px] items-center justify-center text-muted-foreground">
        Chưa có dữ liệu
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Total summary */}
      <div className="flex items-center justify-center gap-3 py-3 bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl">
        <span className="text-4xl font-bold text-slate-800">{total}</span>
        <span className="text-sm text-muted-foreground">lịch hẹn</span>
      </div>

      {/* Status bars */}
      <div className="space-y-2">
        {data.map((item, i) => {
          const percentage = total > 0 ? (item.value / total) * 100 : 0;
          const barWidth = (item.value / maxValue) * 100;
          return (
            <div key={i} className="flex items-center gap-3">
              {/* Status label */}
              <div className="w-24 flex items-center gap-2">
                <div
                  className="h-3 w-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-xs text-slate-600 truncate">{item.name}</span>
              </div>
              {/* Bar */}
              <div className="flex-1 h-7 bg-slate-100 rounded-lg overflow-hidden relative">
                <div
                  className="h-full rounded-lg transition-all duration-500"
                  style={{ 
                    width: `${barWidth}%`,
                    backgroundColor: item.color,
                    minWidth: item.value > 0 ? '20px' : '0'
                  }}
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-700">
                  {item.value} ({percentage.toFixed(0)}%)
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Enhanced Bar Chart - Height based on max 10 appointments
function EnhancedBarChart({
  data,
  maxScale = 10, // Maximum scale value (100% height = 10 appointments)
}: {
  data: { label: string; value: number }[];
  maxScale?: number;
}) {
  if (data.length === 0) {
    return (
      <div className="flex h-[200px] items-center justify-center text-muted-foreground">
        Chưa có dữ liệu
      </div>
    );
  }

  // Calculate the effective max: use maxScale as 100%, values above will overflow
  const effectiveMax = maxScale;
  const chartHeight = 160; // Fixed height in pixels

  return (
    <div className="space-y-2">
      {/* Scale indicator */}
      <div className="flex justify-between text-xs text-muted-foreground px-1">
        <span>0</span>
        <span>{maxScale / 2}</span>
        <span>{maxScale}+</span>
      </div>
      
      {/* Chart container */}
      <div className="relative" style={{ height: `${chartHeight}px` }}>
        {/* Grid lines */}
        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
          <div className="border-b border-dashed border-slate-200" />
          <div className="border-b border-dashed border-slate-200" />
          <div className="border-b border-dashed border-slate-200" />
          <div className="border-b border-dashed border-slate-200" />
        </div>
        
        {/* Bars container */}
        <div className="absolute inset-0 flex items-end gap-3 px-2">
          {data.map((item, i) => {
            // Calculate height: 10 = 100%, values above 10 will be capped at 100%
            const heightPercent = Math.min((item.value / effectiveMax) * 100, 100);
            const barHeight = Math.max((heightPercent / 100) * chartHeight, 8);
            const isOverflow = item.value > effectiveMax;
            
            return (
              <div key={i} className="flex-1 flex flex-col items-center">
                {/* Value label */}
                <span className={cn(
                  "text-xs font-bold mb-1",
                  isOverflow ? "text-rose-600" : "text-indigo-600"
                )}>
                  {item.value}
                </span>
                {/* Bar wrapper - this has the actual height */}
                <div 
                  className={cn(
                    "w-full rounded-t-lg transition-all duration-300",
                    isOverflow 
                      ? "bg-gradient-to-t from-rose-500 to-orange-400" 
                      : "bg-gradient-to-t from-indigo-600 to-violet-500 hover:from-indigo-500 hover:to-violet-400"
                  )}
                  style={{ height: `${barHeight}px` }}
                  title={`${item.label}: ${item.value} lịch hẹn`}
                />
              </div>
            );
          })}
        </div>
      </div>
      
      {/* X-axis labels */}
      <div className="flex gap-3 px-2">
        {data.map((item, i) => (
          <div key={i} className="flex-1 text-center">
            <span className="text-[10px] text-muted-foreground font-medium">
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Status color mapping (Vietnamese)
const statusLabels: Record<string, string> = {
  COMPLETED: "Hoàn thành",
  SCHEDULED: "Đã đặt",
  CONFIRMED: "Xác nhận",
  CANCELLED: "Đã hủy",
  NO_SHOW: "Vắng mặt",
  IN_PROGRESS: "Đang khám",
};

const statusColors: Record<string, string> = {
  COMPLETED: "#22c55e",
  SCHEDULED: "#3b82f6",
  CONFIRMED: "#8b5cf6",
  CANCELLED: "#ef4444",
  NO_SHOW: "#f59e0b",
  IN_PROGRESS: "#06b6d4",
};

export default function ReportsDashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const role = user?.role || "ADMIN";
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
    const today = new Date();
    return {
      from: startOfMonth(today),
      to: today,
    };
  });

  useEffect(() => {
    if (role && role !== "ADMIN") {
      router.replace("/doctor/reports/appointments");
    }
  }, [role, router]);

  // Calculate date strings
  const startDate = dateRange?.from ? format(dateRange.from, "yyyy-MM-dd") : format(startOfMonth(new Date()), "yyyy-MM-dd");
  const endDate = dateRange?.to ? format(dateRange.to, "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd");

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
    return appointments.data.appointmentsByStatus.map((item) => ({
      name: statusLabels[item.status] || item.status.replace("_", " "),
      value: item.count,
      color: statusColors[item.status] || "#94a3b8",
    }));
  }, [appointments.data]);

  // Line chart data for appointments trend
  const appointmentsTrendData = useMemo(() => {
    if (!appointments.data?.dailyTrend) return [];
    return appointments.data.dailyTrend.map((item) => ({
      label: format(new Date(item.date), "dd/MM"),
      value: item.count,
    }));
  }, [appointments.data]);

  // Note: revenueByDepartment removed - backend doesn't support it

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await clearCache.mutateAsync();
      toast.success("Đã xóa bộ nhớ đệm báo cáo thành công!");
    } catch {
      toast.error("Không thể xóa bộ nhớ đệm.");
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Gradient Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 via-violet-500 to-purple-500 p-6 text-white shadow-xl">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
        <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-white/5" />
        <div className="absolute right-20 top-10 h-20 w-20 rounded-full bg-white/5" />

        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="rounded-xl bg-white/20 p-3 backdrop-blur-sm">
              <BarChart3 className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                Báo cáo & Phân tích
                <Badge className="bg-white/20 text-white border-0 text-xs">
                  <Sparkles className="h-3 w-3 mr-1" />
                  Dashboard
                </Badge>
              </h1>
              <p className="mt-1 text-indigo-200">
                Cập nhật: {format(new Date(), "HH:mm dd/MM/yyyy", { locale: vi })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <DateRangeFilter
              value={dateRange}
              onChange={setDateRange}
              theme="purple"
              presetKeys={["thisMonth", "thisWeek", "7days", "30days"]}
              showQuickPresets={false}
            />

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                  disabled={isRefreshing}
                >
                  {isRefreshing ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="mr-2 h-4 w-4" />
                  )}
                  Làm mới
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Xóa bộ nhớ đệm báo cáo?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Xóa tất cả dữ liệu báo cáo đã được lưu trong bộ nhớ đệm? 
                    Báo cáo sẽ được tạo lại từ dữ liệu nguồn trong lần yêu cầu tiếp theo.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Hủy</AlertDialogCancel>
                  <AlertDialogAction onClick={handleRefresh}>
                    Xóa & Làm mới
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {role === "ADMIN" && (
          <Card
            className="border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-white cursor-pointer hover:shadow-md transition-all"
            onClick={() => router.push("/admin/reports/revenue")}
          >
            <CardContent className="pt-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-100">
                    <DollarSign className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Tổng doanh thu</p>
                    {revenue.isLoading ? (
                      <Spinner size="sm" className="mt-1" />
                    ) : (
                      <p className="text-xl font-bold text-emerald-700">
                        {formatCurrency(revenue.data?.totalRevenue || 0)}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs text-emerald-600 bg-emerald-100 px-2 py-1 rounded-full">
                  <TrendingUp className="h-3 w-3" />
                  {revenue.data?.collectionRate || 0}%
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card
          className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white cursor-pointer hover:shadow-md transition-all"
          onClick={() => router.push("/admin/reports/appointments")}
        >
          <CardContent className="pt-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100">
                  <Calendar className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Tổng lịch hẹn</p>
                  {appointments.isLoading ? (
                    <Spinner size="sm" className="mt-1" />
                  ) : (
                    <p className="text-xl font-bold text-blue-700">
                      {(appointments.data?.totalAppointments || 0).toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                <Activity className="h-3 w-3" />
                {appointments.data?.completionRate?.toFixed(0) || 0}%
              </div>
            </div>
          </CardContent>
        </Card>

        {role === "ADMIN" && (
          <Card className="border-2 border-violet-200 bg-gradient-to-br from-violet-50 to-white opacity-75">
            <CardContent className="pt-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-violet-100">
                    <UserCheck className="h-5 w-5 text-violet-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Hiệu suất bác sĩ</p>
                    <p className="text-sm font-medium text-violet-700">Coming Soon</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs text-amber-600 bg-amber-100 px-2 py-1 rounded-full">
                  <Construction className="h-3 w-3" />
                  Đang phát triển
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {role === "ADMIN" && (
          <Card
            className="border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-white cursor-pointer hover:shadow-md transition-all"
            onClick={() => router.push("/admin/reports/patients/activity")}
          >
            <CardContent className="pt-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-100">
                    <Users className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Tổng bệnh nhân</p>
                    {patients.isLoading ? (
                      <Spinner size="sm" className="mt-1" />
                    ) : (
                      <p className="text-xl font-bold text-amber-700">
                        {(patients.data?.totalPatients || 0).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs text-amber-600 bg-amber-100 px-2 py-1 rounded-full">
                  <Users className="h-3 w-3" />
                  +{patients.data?.newPatients || 0}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-2 border-slate-200 shadow-sm overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-indigo-500 to-violet-500" />
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Activity className="h-5 w-5 text-indigo-600" />
                  Xu hướng lịch hẹn
                </CardTitle>
                <CardDescription>7 ngày gần nhất</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {appointments.isLoading ? (
              <div className="flex h-[200px] items-center justify-center">
                <Spinner />
              </div>
            ) : (
              <EnhancedBarChart data={appointmentsTrendData} />
            )}
          </CardContent>
        </Card>

        <Card className="border-2 border-slate-200 shadow-sm overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-emerald-500 to-teal-500" />
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <PieChartIcon className="h-5 w-5 text-emerald-600" />
                  Lịch hẹn theo trạng thái
                </CardTitle>
                <CardDescription>Phân bố hiện tại</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {appointments.isLoading ? (
              <div className="flex h-[200px] items-center justify-center">
                <Spinner />
              </div>
            ) : (
              <EnhancedStatusChart data={appointmentsPieData} />
            )}
          </CardContent>
        </Card>
      </div>



      {/* Quick Links */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card
          className="cursor-pointer transition-all hover:shadow-md hover:border-emerald-300 border-2"
          onClick={() => router.push("/admin/reports/revenue")}
        >
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-gradient-to-br from-emerald-100 to-emerald-50 p-2">
                <DollarSign className="h-5 w-5 text-emerald-600" />
              </div>
              <span className="font-medium">Báo cáo doanh thu</span>
            </div>
            <ArrowRight className="h-5 w-5 text-muted-foreground" />
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer transition-all hover:shadow-md hover:border-blue-300 border-2"
          onClick={() => router.push("/admin/reports/appointments")}
        >
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-gradient-to-br from-blue-100 to-blue-50 p-2">
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
              <span className="font-medium">Thống kê lịch hẹn</span>
            </div>
            <ArrowRight className="h-5 w-5 text-muted-foreground" />
          </CardContent>
        </Card>

        <Card className="border-2 border-dashed border-violet-200 opacity-70">
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-gradient-to-br from-violet-100 to-violet-50 p-2">
                <UserCheck className="h-5 w-5 text-violet-600" />
              </div>
              <span className="font-medium text-muted-foreground">Hiệu suất bác sĩ</span>
            </div>
            <Badge variant="outline" className="text-amber-600 border-amber-300">
              <Construction className="h-3 w-3 mr-1" />
              Coming Soon
            </Badge>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer transition-all hover:shadow-md hover:border-amber-300 border-2"
          onClick={() => router.push("/admin/reports/patients/activity")}
        >
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-gradient-to-br from-amber-100 to-amber-50 p-2">
                <Users className="h-5 w-5 text-amber-600" />
              </div>
              <span className="font-medium">Hoạt động bệnh nhân</span>
            </div>
            <ArrowRight className="h-5 w-5 text-muted-foreground" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

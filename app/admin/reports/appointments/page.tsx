"use client";

import { useState, useMemo, useEffect } from "react";
import { format, startOfMonth } from "date-fns";
import { vi } from "date-fns/locale";
import { useAuth } from "@/contexts/AuthContext";
import {
  Download,
  Calendar,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ArrowLeft,
  Activity,
  Sparkles,
  Clock,
  UserX,
  TrendingUp,
  PieChart as PieChartIcon,
  BarChart3,
  Building2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { useAppointmentStats } from "@/hooks/queries/useReports";
import { exportToCSV } from "@/lib/utils/export";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";
import { DateRangeFilter, DateRange } from "@/components/ui/date-range-filter";
import { cn } from "@/lib/utils";

// Status labels (Vietnamese)
const statusLabels: Record<string, string> = {
  COMPLETED: "Hoàn thành",
  SCHEDULED: "Đã đặt",
  CONFIRMED: "Xác nhận",
  CANCELLED: "Đã hủy",
  NO_SHOW: "Vắng mặt",
  IN_PROGRESS: "Đang khám",
  CHECKED_IN: "Đã checkin",
};

const statusColors: Record<string, string> = {
  COMPLETED: "#22c55e",
  SCHEDULED: "#3b82f6",
  CONFIRMED: "#8b5cf6",
  CANCELLED: "#ef4444",
  NO_SHOW: "#f59e0b",
  IN_PROGRESS: "#06b6d4",
  CHECKED_IN: "#10b981",
};

// Type labels (Vietnamese)
const typeLabels: Record<string, string> = {
  CONSULTATION: "Tư vấn",
  FOLLOW_UP: "Tái khám",
  CHECK_UP: "Khám tổng quát",
  EMERGENCY: "Cấp cứu",
  ROUTINE: "Định kỳ",
};

// Gradient Area Chart for daily trend
function GradientAreaChart({
  data,
}: {
  data: { label: string; value: number }[];
}) {
  if (data.length === 0) {
    return (
      <div className="flex h-[200px] items-center justify-center text-muted-foreground">
        Chưa có dữ liệu
      </div>
    );
  }

  const maxValue = Math.max(...data.map((d) => d.value), 1);
  const chartWidth = 500;
  const chartHeight = 160;
  const padding = { top: 20, right: 10, bottom: 30, left: 40 };
  const innerWidth = chartWidth - padding.left - padding.right;
  const innerHeight = chartHeight - padding.top - padding.bottom;

  // Generate path points
  const points = data.map((d, i) => ({
    x: padding.left + (i / (data.length - 1 || 1)) * innerWidth,
    y: padding.top + innerHeight - (d.value / maxValue) * innerHeight,
    value: d.value,
    label: d.label,
  }));

  // Create smooth curve path
  const linePath = points
    .map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`))
    .join(" ");

  // Create area path (closed)
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${chartHeight - padding.bottom} L ${padding.left} ${chartHeight - padding.bottom} Z`;

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-[200px]">
        <defs>
          {/* Gradient for area fill */}
          <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.4" />
            <stop offset="50%" stopColor="#8b5cf6" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#a78bfa" stopOpacity="0.05" />
          </linearGradient>
          {/* Gradient for line */}
          <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="50%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#a78bfa" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => (
          <line
            key={i}
            x1={padding.left}
            x2={chartWidth - padding.right}
            y1={padding.top + innerHeight * (1 - ratio)}
            y2={padding.top + innerHeight * (1 - ratio)}
            stroke="#e2e8f0"
            strokeDasharray="4"
          />
        ))}

        {/* Y-axis labels */}
        {[0, 0.5, 1].map((ratio, i) => (
          <text
            key={i}
            x={padding.left - 8}
            y={padding.top + innerHeight * (1 - ratio) + 4}
            textAnchor="end"
            className="text-[10px] fill-slate-400"
          >
            {Math.round(maxValue * ratio)}
          </text>
        ))}

        {/* Area */}
        <path d={areaPath} fill="url(#areaGradient)" />

        {/* Line */}
        <path
          d={linePath}
          fill="none"
          stroke="url(#lineGradient)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Data points */}
        {points.map((point, i) => (
          <g key={i}>
            <circle
              cx={point.x}
              cy={point.y}
              r="5"
              fill="white"
              stroke="#8b5cf6"
              strokeWidth="2"
              className="transition-all duration-200 hover:r-7"
            />
            {/* Value on hover */}
            <text
              x={point.x}
              y={point.y - 12}
              textAnchor="middle"
              className="text-[10px] fill-slate-600 font-medium"
            >
              {point.value}
            </text>
          </g>
        ))}

        {/* X-axis labels */}
        {points.map((point, i) => (
          <text
            key={i}
            x={point.x}
            y={chartHeight - 8}
            textAnchor="middle"
            className="text-[9px] fill-slate-500"
          >
            {point.label}
          </text>
        ))}
      </svg>
    </div>
  );
}

export default function AppointmentStatsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const role = user?.role || "ADMIN";

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
  const startDate = dateRange?.from ? format(dateRange.from, "yyyy-MM-dd") : "";
  const endDate = dateRange?.to ? format(dateRange.to, "yyyy-MM-dd") : "";

  // Fetch appointment stats
  const { data, isLoading, error } = useAppointmentStats({
    startDate,
    endDate,
  });

  // Process chart data
  const statusChartData = useMemo(() => {
    if (!data?.appointmentsByStatus) return [];
    return data.appointmentsByStatus
      .filter(item => item.count > 0)
      .sort((a, b) => b.count - a.count);
  }, [data]);

  const typeChartData = useMemo(() => {
    if (!data?.appointmentsByType) return [];
    return data.appointmentsByType
      .filter(item => item.count > 0)
      .sort((a, b) => b.count - a.count);
  }, [data]);

  const dailyTrendData = useMemo(() => {
    if (!data?.dailyTrend) return [];
    return data.dailyTrend.map((item) => ({
      label: format(new Date(item.date), "dd/MM"),
      value: item.count,
    }));
  }, [data]);

  const departmentChartData = useMemo(() => {
    if (!data?.appointmentsByDepartment) return [];
    return data.appointmentsByDepartment
      .filter(item => item.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [data]);

  const totalStatus = statusChartData.reduce((sum, s) => sum + s.count, 0);
  const maxDeptCount = Math.max(...departmentChartData.map(d => d.count), 1);
  const maxTypeCount = Math.max(...typeChartData.map(t => t.count), 1);

  const handleExport = () => {
    const rows: any[] = [];
    data?.appointmentsByStatus?.forEach((s) =>
      rows.push({ section: "status", status: s.status, count: s.count })
    );
    data?.appointmentsByType?.forEach((t) =>
      rows.push({ section: "type", type: t.type, count: t.count })
    );
    data?.appointmentsByDepartment?.forEach((d) =>
      rows.push({ section: "department", department: d.departmentName, count: d.count })
    );
    data?.dailyTrend?.forEach((d) =>
      rows.push({ section: "daily", date: d.date, count: d.count })
    );
    exportToCSV(rows, `appointments-report-${startDate}-${endDate}.csv`);
    toast.success("Đã xuất báo cáo CSV!");
  };

  return (
    <div className="space-y-6">
      {/* Gradient Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-500 to-violet-500 p-6 text-white shadow-xl">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
        <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-white/5" />
        <div className="absolute right-20 top-10 h-20 w-20 rounded-full bg-white/5" />

        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              onClick={() => router.back()}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="rounded-xl bg-white/20 p-3 backdrop-blur-sm">
              <Calendar className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                Thống kê lịch hẹn
                <Badge className="bg-white/20 text-white border-0 text-xs">
                  <Sparkles className="h-3 w-3 mr-1" />
                  Chi tiết
                </Badge>
              </h1>
              <p className="mt-1 text-blue-100">
                Phân tích toàn diện lịch hẹn theo trạng thái và xu hướng
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <DateRangeFilter
              value={dateRange}
              onChange={setDateRange}
              theme="indigo"
              presetKeys={["thisMonth", "thisWeek", "7days", "30days"]}
              showQuickPresets={false}
            />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="bg-white text-blue-700 hover:bg-white/90">
                  <Download className="mr-2 h-4 w-4" />
                  Xuất báo cáo
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleExport}>
                  Xuất CSV
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100">
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Tổng lịch hẹn</p>
                {isLoading ? (
                  <Spinner size="sm" className="mt-1" />
                ) : (
                  <p className="text-xl font-bold text-blue-700">
                    {(data?.totalAppointments || 0).toLocaleString()}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-white">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-100">
                  <CheckCircle className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Hoàn thành</p>
                  {isLoading ? (
                    <Spinner size="sm" className="mt-1" />
                  ) : (
                    <p className="text-xl font-bold text-emerald-700">
                      {(data?.completedCount || 0).toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
              <Badge className="bg-emerald-100 text-emerald-700 text-xs">
                {data?.completionRate?.toFixed(0) || 0}%
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-red-200 bg-gradient-to-br from-red-50 to-white">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-100">
                <XCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Đã hủy</p>
                {isLoading ? (
                  <Spinner size="sm" className="mt-1" />
                ) : (
                  <p className="text-xl font-bold text-red-700">
                    {(data?.cancelledCount || 0).toLocaleString()}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-white">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-100">
                  <UserX className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Vắng mặt</p>
                  {isLoading ? (
                    <Spinner size="sm" className="mt-1" />
                  ) : (
                    <p className="text-xl font-bold text-amber-700">
                      {(data?.noShowCount || 0).toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
              <Badge className="bg-amber-100 text-amber-700 text-xs">
                {data?.noShowRate?.toFixed(1) || 0}%
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Daily Trend with Gradient Area Chart */}
      <Card className="border-2 border-slate-200 shadow-sm overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500" />
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingUp className="h-5 w-5 text-indigo-600" />
            Xu hướng hàng ngày
          </CardTitle>
          <CardDescription>Biểu đồ lịch hẹn theo thời gian</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex h-[200px] items-center justify-center">
              <Spinner />
            </div>
          ) : (
            <GradientAreaChart data={dailyTrendData} />
          )}
        </CardContent>
      </Card>

      {/* Status and Type Charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Status Donut + Legend */}
        <Card className="border-2 border-slate-200 shadow-sm overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-emerald-500 to-teal-500" />
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <PieChartIcon className="h-5 w-5 text-emerald-600" />
              Lịch hẹn theo trạng thái
            </CardTitle>
            <CardDescription>Phân bố theo trạng thái</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex h-[250px] items-center justify-center">
                <Spinner />
              </div>
            ) : statusChartData.length > 0 ? (
              <div className="flex flex-col lg:flex-row items-center gap-6">
                {/* Donut */}
                <div className="relative">
                  <svg viewBox="0 0 120 120" className="h-44 w-44">
                    <circle cx="60" cy="60" r="45" fill="transparent" stroke="#f1f5f9" strokeWidth="18" />
                    {(() => {
                      let cumulativePercent = 0;
                      return statusChartData.map((item, i) => {
                        const percentage = totalStatus > 0 ? (item.count / totalStatus) * 100 : 0;
                        const circumference = 2 * Math.PI * 45;
                        const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`;
                        const strokeDashoffset = -(cumulativePercent / 100) * circumference;
                        cumulativePercent += percentage;
                        const color = statusColors[item.status] || "#94a3b8";
                        
                        return (
                          <circle
                            key={i}
                            cx="60"
                            cy="60"
                            r="45"
                            fill="transparent"
                            stroke={color}
                            strokeWidth="18"
                            strokeDasharray={strokeDasharray}
                            strokeDashoffset={strokeDashoffset}
                            style={{ transform: 'rotate(-90deg)', transformOrigin: '60px 60px' }}
                          />
                        );
                      });
                    })()}
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold text-slate-800">{totalStatus}</span>
                    <span className="text-xs text-muted-foreground">Tổng</span>
                  </div>
                </div>

                {/* Legend */}
                <div className="flex-1 space-y-2">
                  {statusChartData.map((item, i) => {
                    const percentage = totalStatus > 0 ? (item.count / totalStatus) * 100 : 0;
                    const color = statusColors[item.status] || "#94a3b8";
                    return (
                      <div 
                        key={i}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors"
                        style={{ borderLeft: `3px solid ${color}` }}
                      >
                        <div className="flex-1">
                          <span className="text-sm font-medium">
                            {statusLabels[item.status] || item.status}
                          </span>
                        </div>
                        <span className="text-sm font-bold">{item.count}</span>
                        <Badge style={{ backgroundColor: color + "20", color }}>
                          {percentage.toFixed(0)}%
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="flex h-[200px] items-center justify-center text-muted-foreground">
                Chưa có dữ liệu trạng thái
              </div>
            )}
          </CardContent>
        </Card>

        {/* Type Horizontal Bars */}
        <Card className="border-2 border-slate-200 shadow-sm overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-sky-500 to-blue-500" />
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <BarChart3 className="h-5 w-5 text-sky-600" />
              Lịch hẹn theo loại
            </CardTitle>
            <CardDescription>Phân loại theo hình thức khám</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex h-[250px] items-center justify-center">
                <Spinner />
              </div>
            ) : typeChartData.length > 0 ? (
              <div className="space-y-3">
                {typeChartData.map((item, i) => {
                  const barWidth = (item.count / maxTypeCount) * 100;
                  const colors = ["#0ea5e9", "#06b6d4", "#14b8a6", "#10b981", "#22c55e"];
                  const color = colors[i % colors.length];
                  return (
                    <div key={i} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{typeLabels[item.type] || item.type}</span>
                        <span className="text-muted-foreground">{item.count}</span>
                      </div>
                      <div className="h-6 w-full overflow-hidden rounded-lg bg-slate-100 relative">
                        <div
                          className="h-full rounded-lg transition-all duration-500"
                          style={{ width: `${barWidth}%`, backgroundColor: color }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex h-[200px] items-center justify-center text-muted-foreground">
                Chưa có dữ liệu loại lịch hẹn
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Department Chart */}
      {departmentChartData.length > 0 && (
        <Card className="border-2 border-slate-200 shadow-sm overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-amber-500 to-orange-500" />
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Building2 className="h-5 w-5 text-amber-600" />
              Lịch hẹn theo khoa
            </CardTitle>
            <CardDescription>Top 8 khoa có nhiều lịch hẹn nhất</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex h-[200px] items-center justify-center">
                <Spinner />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {departmentChartData.map((dept, i) => {
                  const colors = ["#f59e0b", "#eab308", "#84cc16", "#22c55e", "#14b8a6", "#06b6d4", "#0ea5e9", "#6366f1"];
                  const color = colors[i % colors.length];
                  return (
                    <div
                      key={i}
                      className="p-4 rounded-xl border-2 transition-all hover:shadow-md"
                      style={{ borderColor: color + "40", backgroundColor: color + "08" }}
                    >
                      <p className="text-xs text-muted-foreground truncate">{dept.departmentName}</p>
                      <p className="text-2xl font-bold mt-1" style={{ color }}>{dept.count}</p>
                      <div className="h-1.5 w-full bg-slate-200 rounded-full mt-2 overflow-hidden">
                        <div 
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${(dept.count / maxDeptCount) * 100}%`, backgroundColor: color }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Cache Info */}
      {data?.cached && (
        <Card className="border border-slate-200 bg-slate-50">
          <CardContent className="py-3">
            <p className="text-sm text-muted-foreground text-center">
              📊 Dữ liệu được tạo vào: {format(new Date(data.generatedAt), "HH:mm dd/MM/yyyy", { locale: vi })}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

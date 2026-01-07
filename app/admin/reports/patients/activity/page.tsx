"use client";

import { useState, useMemo, useEffect } from "react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { useAuth } from "@/contexts/AuthContext";
import {
  Download,
  Users,
  UserPlus,
  Activity,
  RotateCcw,
  ArrowLeft,
  Sparkles,
  Heart,
  Droplets,
  Stethoscope,
  TrendingUp,
  PieChart as PieChartIcon,
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

import { usePatientActivity } from "@/hooks/queries/useReports";
import { exportToCSV } from "@/lib/utils/export";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

// Gender labels (Vietnamese)
const genderLabels: Record<string, string> = {
  MALE: "Nam",
  FEMALE: "Nữ",
  OTHER: "Khác",
};

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

// Gradient Area Chart for registration trend
function GradientAreaChart({
  data,
}: {
  data: { label: string; newPatients: number; visits: number }[];
}) {
  if (data.length === 0) {
    return (
      <div className="flex h-[200px] items-center justify-center text-muted-foreground">
        Chưa có dữ liệu
      </div>
    );
  }

  const allValues = [...data.map(d => d.newPatients), ...data.map(d => d.visits)];
  const maxValue = Math.max(...allValues, 1);
  const chartWidth = 500;
  const chartHeight = 180;
  const padding = { top: 20, right: 10, bottom: 35, left: 40 };
  const innerWidth = chartWidth - padding.left - padding.right;
  const innerHeight = chartHeight - padding.top - padding.bottom;

  // Generate points for both lines
  const newPatientsPoints = data.map((d, i) => ({
    x: padding.left + (i / (data.length - 1 || 1)) * innerWidth,
    y: padding.top + innerHeight - (d.newPatients / maxValue) * innerHeight,
    value: d.newPatients,
    label: d.label,
  }));

  const visitsPoints = data.map((d, i) => ({
    x: padding.left + (i / (data.length - 1 || 1)) * innerWidth,
    y: padding.top + innerHeight - (d.visits / maxValue) * innerHeight,
    value: d.visits,
    label: d.label,
  }));

  // Create paths
  const createLinePath = (points: typeof newPatientsPoints) =>
    points.map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`)).join(" ");

  const createAreaPath = (points: typeof newPatientsPoints) =>
    `${createLinePath(points)} L ${points[points.length - 1].x} ${chartHeight - padding.bottom} L ${padding.left} ${chartHeight - padding.bottom} Z`;

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-[220px]">
        <defs>
          {/* Gradient for new patients area */}
          <linearGradient id="newPatientsGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#22c55e" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#22c55e" stopOpacity="0.05" />
          </linearGradient>
          {/* Gradient for visits area */}
          <linearGradient id="visitsGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.05" />
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

        {/* Visits area (background) */}
        <path d={createAreaPath(visitsPoints)} fill="url(#visitsGradient)" />
        <path
          d={createLinePath(visitsPoints)}
          fill="none"
          stroke="#3b82f6"
          strokeWidth="2"
          strokeLinecap="round"
        />

        {/* New patients area (foreground) */}
        <path d={createAreaPath(newPatientsPoints)} fill="url(#newPatientsGradient)" />
        <path
          d={createLinePath(newPatientsPoints)}
          fill="none"
          stroke="#22c55e"
          strokeWidth="3"
          strokeLinecap="round"
        />

        {/* Data points - new patients */}
        {newPatientsPoints.map((point, i) => (
          <g key={`new-${i}`}>
            <circle
              cx={point.x}
              cy={point.y}
              r="4"
              fill="white"
              stroke="#22c55e"
              strokeWidth="2"
            />
          </g>
        ))}

        {/* X-axis labels */}
        {newPatientsPoints.map((point, i) => (
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

      {/* Legend */}
      <div className="flex justify-center gap-6 mt-2">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded bg-emerald-500" />
          <span className="text-xs text-muted-foreground">Bệnh nhân mới</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded bg-blue-500" />
          <span className="text-xs text-muted-foreground">Lượt khám</span>
        </div>
      </div>
    </div>
  );
}

export default function PatientActivityPage() {
  const router = useRouter();
  const { user } = useAuth();
  const role = user?.role || "ADMIN";

  useEffect(() => {
    if (role && role !== "ADMIN") {
      router.replace("/doctor/reports/appointments");
    }
  }, [role, router]);

  // Fetch patient activity (backend ignores date filters)
  const { data, isLoading, error } = usePatientActivity({
    startDate: "",
    endDate: "",
  });

  // Chart data
  const genderChartData = useMemo(() => {
    if (!data?.patientsByGender) return [];
    return data.patientsByGender.filter(item => item.count > 0);
  }, [data]);

  const bloodTypeChartData = useMemo(() => {
    if (!data?.patientsByBloodType) return [];
    return data.patientsByBloodType.filter(item => item.count > 0);
  }, [data]);

  const diagnosesData = useMemo(() => {
    if (!data?.topDiagnoses) return [];
    return data.topDiagnoses.slice(0, 10);
  }, [data]);

  const trendData = useMemo(() => {
    if (!data?.registrationTrend) return [];
    return data.registrationTrend.map((item) => ({
      label: format(new Date(item.date), "dd/MM"),
      newPatients: item.newPatients,
      visits: item.visits || 0,
    }));
  }, [data]);

  const totalGender = genderChartData.reduce((sum, g) => sum + g.count, 0);
  const totalBloodType = bloodTypeChartData.reduce((sum, b) => sum + b.count, 0);
  const maxDiagnosis = Math.max(...diagnosesData.map(d => d.count), 1);

  const handleExport = () => {
    const rows: any[] = [];
    data?.patientsByGender?.forEach((g) =>
      rows.push({ section: "gender", label: g.gender, value: g.count })
    );
    data?.patientsByBloodType?.forEach((b) =>
      rows.push({ section: "bloodType", label: b.bloodType, value: b.count })
    );
    data?.topDiagnoses?.forEach((d) =>
      rows.push({ section: "diagnosis", label: d.diagnosis, icdCode: d.icdCode, value: d.count })
    );
    data?.registrationTrend?.forEach((t) =>
      rows.push({ section: "trend", date: t.date, newPatients: t.newPatients, visits: t.visits })
    );
    exportToCSV(rows, `patient-activity-${format(new Date(), 'yyyy-MM-dd')}.csv`);
    toast.success("Đã xuất báo cáo CSV!");
  };

  return (
    <div className="space-y-6">
      {/* Gradient Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-rose-600 via-pink-500 to-fuchsia-500 p-6 text-white shadow-xl">
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
              <Users className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                Hoạt động bệnh nhân
                <Badge className="bg-white/20 text-white border-0 text-xs">
                  <Sparkles className="h-3 w-3 mr-1" />
                  Phân tích
                </Badge>
              </h1>
              <p className="mt-1 text-rose-100">
                Thống kê nhân khẩu học và xu hướng đăng ký bệnh nhân
              </p>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="bg-white text-rose-700 hover:bg-white/90">
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

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-2 border-rose-200 bg-gradient-to-br from-rose-50 to-white">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-rose-100">
                <Users className="h-5 w-5 text-rose-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Tổng bệnh nhân</p>
                {isLoading ? (
                  <Spinner size="sm" className="mt-1" />
                ) : (
                  <p className="text-xl font-bold text-rose-700">
                    {(data?.totalPatients || 0).toLocaleString()}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-white">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-100">
                <UserPlus className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Bệnh nhân mới</p>
                {isLoading ? (
                  <Spinner size="sm" className="mt-1" />
                ) : (
                  <p className="text-xl font-bold text-emerald-700">
                    {(data?.newPatients || 0).toLocaleString()}
                  </p>
                )}
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Trong tháng này</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100">
                <Activity className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Đang hoạt động</p>
                {isLoading ? (
                  <Spinner size="sm" className="mt-1" />
                ) : (
                  <p className="text-xl font-bold text-blue-700">
                    {(data?.activePatients || 0).toLocaleString()}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-white">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-100">
                <RotateCcw className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Tái khám</p>
                {isLoading ? (
                  <Spinner size="sm" className="mt-1" />
                ) : (
                  <p className="text-xl font-bold text-amber-700">
                    {(data?.returningPatients || 0).toLocaleString()}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Registration Trend with Gradient Area Chart */}
      {trendData.length > 0 && (
        <Card className="border-2 border-slate-200 shadow-sm overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="h-5 w-5 text-emerald-600" />
              Xu hướng đăng ký
            </CardTitle>
            <CardDescription>Bệnh nhân mới và lượt khám theo thời gian</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex h-[200px] items-center justify-center">
                <Spinner />
              </div>
            ) : (
              <GradientAreaChart data={trendData} />
            )}
          </CardContent>
        </Card>
      )}

      {/* Demographics Row */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Gender Distribution Donut */}
        <Card className="border-2 border-slate-200 shadow-sm overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-pink-500 to-rose-500" />
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Heart className="h-5 w-5 text-pink-600" />
              Phân bố giới tính
            </CardTitle>
            <CardDescription>Theo giới tính bệnh nhân</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex h-[200px] items-center justify-center">
                <Spinner />
              </div>
            ) : genderChartData.length > 0 ? (
              <div className="flex flex-col lg:flex-row items-center gap-6">
                {/* Donut */}
                <div className="relative">
                  <svg viewBox="0 0 120 120" className="h-40 w-40">
                    <circle cx="60" cy="60" r="45" fill="transparent" stroke="#f1f5f9" strokeWidth="18" />
                    {(() => {
                      let cumulativePercent = 0;
                      return genderChartData.map((item, i) => {
                        const percentage = totalGender > 0 ? (item.count / totalGender) * 100 : 0;
                        const circumference = 2 * Math.PI * 45;
                        const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`;
                        const strokeDashoffset = -(cumulativePercent / 100) * circumference;
                        cumulativePercent += percentage;
                        const color = genderColors[item.gender] || "#94a3b8";
                        
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
                    <span className="text-2xl font-bold text-slate-800">{totalGender}</span>
                    <span className="text-xs text-muted-foreground">Tổng</span>
                  </div>
                </div>

                {/* Legend */}
                <div className="flex-1 space-y-2">
                  {genderChartData.map((item, i) => {
                    const percentage = totalGender > 0 ? (item.count / totalGender) * 100 : 0;
                    const color = genderColors[item.gender] || "#94a3b8";
                    return (
                      <div 
                        key={i}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50"
                        style={{ borderLeft: `3px solid ${color}` }}
                      >
                        <div className="flex-1">
                          <span className="text-sm font-medium">
                            {genderLabels[item.gender] || item.gender}
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
              <div className="flex h-[150px] items-center justify-center text-muted-foreground">
                Chưa có dữ liệu giới tính
              </div>
            )}
          </CardContent>
        </Card>

        {/* Blood Type Distribution */}
        <Card className="border-2 border-slate-200 shadow-sm overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-red-500 to-orange-500" />
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Droplets className="h-5 w-5 text-red-600" />
              Nhóm máu
            </CardTitle>
            <CardDescription>Phân bố theo nhóm máu</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex h-[200px] items-center justify-center">
                <Spinner />
              </div>
            ) : bloodTypeChartData.length > 0 ? (
              <div className="grid grid-cols-4 gap-2">
                {bloodTypeChartData.map((item, i) => {
                  const percentage = totalBloodType > 0 ? (item.count / totalBloodType) * 100 : 0;
                  const color = bloodTypeColors[item.bloodType] || "#94a3b8";
                  return (
                    <div
                      key={i}
                      className="p-3 rounded-xl text-center border-2 transition-all hover:shadow-md"
                      style={{ borderColor: color + "40", backgroundColor: color + "08" }}
                    >
                      <p className="text-lg font-bold" style={{ color }}>{item.bloodType}</p>
                      <p className="text-xl font-bold text-slate-800">{item.count}</p>
                      <p className="text-xs text-muted-foreground">{percentage.toFixed(0)}%</p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex h-[150px] items-center justify-center text-muted-foreground">
                Chưa có dữ liệu nhóm máu
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Diagnoses */}
      {diagnosesData.length > 0 && (
        <Card className="border-2 border-slate-200 shadow-sm overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-violet-500 to-purple-500" />
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Stethoscope className="h-5 w-5 text-violet-600" />
              Top 10 chẩn đoán
            </CardTitle>
            <CardDescription>Các chẩn đoán phổ biến nhất</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex h-[200px] items-center justify-center">
                <Spinner />
              </div>
            ) : (
              <div className="space-y-3">
                {diagnosesData.map((item, i) => {
                  const barWidth = (item.count / maxDiagnosis) * 100;
                  const colors = ["#8b5cf6", "#7c3aed", "#6d28d9", "#5b21b6", "#4c1d95"];
                  const color = colors[i % colors.length];
                  return (
                    <div key={i} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{item.diagnosis}</span>
                          {item.icdCode && (
                            <Badge variant="outline" className="text-xs">
                              {item.icdCode}
                            </Badge>
                          )}
                        </div>
                        <span className="text-muted-foreground">
                          {item.count} ({item.percentage?.toFixed(1) || 0}%)
                        </span>
                      </div>
                      <div className="h-4 w-full overflow-hidden rounded-lg bg-slate-100 relative">
                        <div
                          className="h-full rounded-lg transition-all duration-500"
                          style={{ width: `${barWidth}%`, backgroundColor: color }}
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

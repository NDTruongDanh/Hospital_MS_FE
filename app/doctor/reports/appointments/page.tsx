"use client";

import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import {
  Download,
  Loader2,
  Calendar,
  CheckCircle,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ReportPageHeader } from "@/app/admin/reports/_components/report-page-header";
import {
  DateRangePicker,
  useDateRangePresets,
} from "@/app/admin/reports/_components/date-range-picker";
import { MetricCard } from "@/app/admin/reports/_components/metric-card";
import { ChartCard } from "@/app/admin/reports/_components/chart-card";
import { useAppointmentStats } from "@/hooks/queries/useReports";
import { exportToCSV } from "@/lib/utils/export";
import { EmptyReportState } from "@/components/reports/EmptyReportState";
import { CacheInfoBanner } from "@/components/reports/CacheInfoBanner";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";

const statusColors: Record<string, string> = {
  COMPLETED: "#22c55e",
  SCHEDULED: "#3b82f6",
  CONFIRMED: "#8b5cf6",
  CANCELLED: "#ef4444",
  NO_SHOW: "#f59e0b",
};

function PieChart({
  data,
}: {
  data: { name: string; value: number; color: string }[];
}) {
  const total = data.reduce((sum, item) => sum + item.value, 0) || 1;
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:gap-8">
      <div className="flex justify-center">
        <div className="relative h-40 w-40">
          <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
            {(() => {
              let cumulativePercent = 0;
              return data.map((item, i) => {
                const percent = (item.value / total) * 100;
                const dashArray = `${percent} ${100 - percent}`;
                const dashOffset = -cumulativePercent;
                cumulativePercent += percent;
                return (
                  <circle
                    key={i}
                    cx="50"
                    cy="50"
                    r="40"
                    fill="transparent"
                    stroke={item.color}
                    strokeWidth="20"
                    strokeDasharray={dashArray}
                    strokeDashoffset={dashOffset}
                  />
                );
              });
            })()}
          </svg>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        {data.map((item, i) => (
          <div key={i} className="flex items-center gap-3 text-sm">
            <div
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            <span className="flex-1">{item.name}</span>
            <span className="font-medium">{item.value}</span>
            <span className="w-12 text-right text-muted-foreground">
              {((item.value / total) * 100).toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function LineChart({ data }: { data: { label: string; value: number }[] }) {
  const maxValue = Math.max(...data.map((d) => d.value), 1);
  const minValue = Math.min(...data.map((d) => d.value), 0);
  const range = maxValue - minValue || 1;
  return (
    <div className="flex h-[200px] items-end gap-1">
      {data.map((item, i) => {
        const height = ((item.value - minValue) / range) * 100 + 10;
        return (
          <div key={i} className="flex flex-1 flex-col items-center gap-1">
            <span className="text-xs text-muted-foreground">{item.value}</span>
            <div
              className="w-full rounded-t bg-primary/80"
              style={{ height: `${height}%` }}
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

export default function DoctorAppointmentReportsPage() {
  const presets = useDateRangePresets();
  const [startDate, setStartDate] = useState<Date | undefined>(
    presets.last30Days.startDate
  );
  const [endDate, setEndDate] = useState<Date | undefined>(
    presets.last30Days.endDate
  );
  const [doctorId, setDoctorId] = useState<string | undefined>(() => {
    const stored =
      typeof window !== "undefined" ? localStorage.getItem("doctorId") : null;
    return stored || "emp-101";
  });

  const { data, isLoading, refetch } = useAppointmentStats({
    startDate: startDate ? format(startDate, "yyyy-MM-dd") : "",
    endDate: endDate ? format(endDate, "yyyy-MM-dd") : "",
    doctorId,
  });

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

  const statusPieData = useMemo(() => {
    if (!data?.appointmentsByStatus) return [];
    return data.appointmentsByStatus.map((item) => ({
      name: item.status.replace("_", " "),
      value: item.count,
      color: statusColors[item.status] || "#94a3b8",
    }));
  }, [data]);

  const dailyTrendData = useMemo(() => {
    if (!data?.dailyTrend) return [];
    return data.dailyTrend.map((item) => ({
      label: format(new Date(item.date), "dd/MM"),
      value: item.count,
    }));
  }, [data]);

  const handleExport = () => {
    const rows: any[] = [];
    data?.appointmentsByStatus?.forEach((s) =>
      rows.push({ section: "status", status: s.status, count: s.count })
    );
    data?.dailyTrend?.forEach((d) =>
      rows.push({ section: "daily", date: d.date, count: d.count })
    );
    exportToCSV(rows, "doctor-appointments-report.csv");
  };

  return (
    <div className="page-shell space-y-6">
      <ReportPageHeader
        title="Báo cáo lịch hẹn của tôi"
        description="Thống kê lịch hẹn theo trạng thái và xu hướng"
        actions={
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Bộ lọc</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-end gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Khoảng ngày</label>
            <DateRangePicker
              startDate={startDate}
              endDate={endDate}
              onStartDateChange={setStartDate}
              onEndDateChange={setEndDate}
            />
          </div>
          <Button
            onClick={() => {
              if (!validateRange()) return;
              refetch();
            }}
            disabled={isLoading}
          >
            {isLoading && <Spinner size="sm" className="mr-2" />}
            Xem báo cáo
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Tổng lịch hẹn"
          value={data?.totalAppointments?.toLocaleString() ?? "---"}
          icon={Calendar}
          loading={isLoading}
        />
        <MetricCard
          title="Hoàn thành"
          value={data?.completedCount?.toLocaleString() ?? "---"}
          subLabel={`${data?.completionRate?.toFixed(1) ?? "--"}% completion`}
          icon={CheckCircle}
          loading={isLoading}
        />
        <MetricCard
          title="Hủy"
          value={data?.cancelledCount?.toLocaleString() ?? "---"}
          icon={XCircle}
          loading={isLoading}
        />
        <MetricCard
          title="No-show rate"
          value={`${data?.noShowRate?.toFixed(1) ?? "--"}%`}
          subLabel={`${data?.noShowCount ?? 0} lượt`}
          icon={AlertTriangle}
          loading={isLoading}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard
          title="Theo trạng thái"
          description="Phân bổ các trạng thái lịch hẹn"
          loading={isLoading}
        >
          {statusPieData.length ? (
            <PieChart data={statusPieData} />
          ) : (
            <EmptyReportState description="No data" />
          )}
        </ChartCard>
        <ChartCard
          title="Xu hướng theo ngày"
          description="Số lượt đặt theo thời gian"
          loading={isLoading}
        >
          {dailyTrendData.length ? (
            <LineChart data={dailyTrendData} />
          ) : (
            <EmptyReportState description="No data" />
          )}
        </ChartCard>
      </div>

      {data?.cached && (
        <CacheInfoBanner generatedAt={(data as any).generatedAt} />
      )}
    </div>
  );
}

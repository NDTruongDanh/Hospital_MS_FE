"use client";

import { useState, useMemo, useEffect } from "react";
import { format, startOfMonth } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import {
  Download,
  Loader2,
  DollarSign,
  FileText,
  CreditCard,
  Percent,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { ReportPageHeader } from "../_components/report-page-header";
import {
  DateRangePicker,
  useDateRangePresets,
} from "../_components/date-range-picker";
import { MetricCard } from "../_components/metric-card";
import { ChartCard } from "../_components/chart-card";
import { useRevenueReport } from "@/hooks/queries/useReports";
import { useDepartments } from "@/hooks/queries/useHr";
import { exportToCSV } from "@/lib/utils/export";
import { useRouter } from "next/navigation";
import { EmptyReportState } from "@/components/reports/EmptyReportState";
import { CacheInfoBanner } from "@/components/reports/CacheInfoBanner";
import { RetryButton } from "@/components/reports/RetryButton";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";

// Simple Bar Chart
function SimpleBarChart({
  data,
}: {
  data: { name: string; value: number; percentage?: number }[];
}) {
  const maxValue = Math.max(...data.map((d) => d.value));

  return (
    <div className="space-y-3">
      {data.map((item, i) => (
        <div key={i} className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">{item.name}</span>
            <span className="text-muted-foreground">
              {new Intl.NumberFormat("vi-VN", {
                style: "currency",
                currency: "VND",
                maximumFractionDigits: 0,
              }).format(item.value)}
              {item.percentage && ` (${item.percentage.toFixed(1)}%)`}
            </span>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
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

// Simple Pie Chart with Legend
function SimplePieChart({
  data,
}: {
  data: { name: string; value: number; color: string; percentage?: number }[];
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
    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:gap-8">
      <div className="flex justify-center">
        <div className="relative h-48 w-48">
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
      <div className="flex flex-col gap-2">
        {data.map((item, i) => (
          <div key={i} className="flex items-center gap-3">
            <div
              className="h-4 w-4 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            <span className="flex-1 font-medium">{item.name}</span>
            <span className="text-muted-foreground">
              {new Intl.NumberFormat("vi-VN", {
                style: "currency",
                currency: "VND",
                maximumFractionDigits: 0,
              }).format(item.value)}
            </span>
            <span className="w-12 text-right text-sm text-muted-foreground">
              {((item.value / total) * 100).toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

const paymentMethodColors: Record<string, string> = {
  CASH: "#22c55e",
  CARD: "#3b82f6",
  INSURANCE: "#8b5cf6",
  BANK_TRANSFER: "#f59e0b",
};

export default function RevenueReportPage() {
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
  const [departmentId, setDepartmentId] = useState<string>("ALL");
  const [paymentMethod, setPaymentMethod] = useState<string>("ALL");

  useEffect(() => {
    const r = user?.role || null;
    setRole(r || "ADMIN");
  }, [user]);

  useEffect(() => {
    if (role && role !== "ADMIN") {
      router.replace("/doctor/reports/appointments");
    }
  }, [role, router]);

  // Fetch departments for filter
  const { data: departmentsData } = useDepartments({ size: 100 });
  const departments = departmentsData?.content ?? [];

  // Fetch revenue report
  const { data, isLoading, error, refetch } = useRevenueReport({
    startDate: startDate ? format(startDate, "yyyy-MM-dd") : "",
    endDate: endDate ? format(endDate, "yyyy-MM-dd") : "",
    departmentId: departmentId !== "ALL" ? departmentId : undefined,
    paymentMethod: paymentMethod !== "ALL" ? paymentMethod : undefined,
  });

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Chart data
  const departmentChartData = useMemo(() => {
    if (!data?.revenueByDepartment) return [];
    return data.revenueByDepartment.map((item) => ({
      name: item.departmentName,
      value: item.revenue,
      percentage: item.percentage,
    }));
  }, [data]);

  const paymentMethodChartData = useMemo(() => {
    if (!data?.revenueByPaymentMethod) return [];
    return data.revenueByPaymentMethod.map((item) => ({
      name: item.method.replace("_", " "),
      value: item.amount,
      color: paymentMethodColors[item.method] || "#94a3b8",
      percentage: item.percentage,
    }));
  }, [data]);

  const handleExportCSV = () => {
    const rows = [
      ...(data?.revenueByDepartment?.map((d) => ({
        type: "DEPARTMENT",
        name: d.departmentName,
        revenue: d.revenue,
        percentage: d.percentage,
      })) || []),
      ...(data?.revenueByPaymentMethod?.map((d) => ({
        type: "PAYMENT_METHOD",
        name: d.method,
        amount: d.amount,
        percentage: d.percentage,
      })) || []),
    ];
    exportToCSV(rows, "revenue-report.csv");
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
        title="Revenue Report"
        description="Detailed revenue analysis by department and payment method"
        actions={
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleExportCSV}>
                Export CSV
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
              <label className="text-sm font-medium">Payment Method</label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Methods" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Methods</SelectItem>
                  <SelectItem value="CASH">Cash</SelectItem>
                  <SelectItem value="CARD">Card</SelectItem>
                  <SelectItem value="INSURANCE">Insurance</SelectItem>
                  <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
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
          title="Total Revenue"
          value={data ? formatCurrency(data.totalRevenue) : "---"}
          icon={DollarSign}
          loading={isLoading}
        />
        <MetricCard
          title="Paid Revenue"
          value={data ? formatCurrency(data.paidRevenue) : "---"}
          icon={CreditCard}
          loading={isLoading}
        />
        <MetricCard
          title="Unpaid Revenue"
          value={data ? formatCurrency(data.unpaidRevenue) : "---"}
          icon={FileText}
          loading={isLoading}
        />
        <MetricCard
          title="Collection Rate"
          value={data ? `${data.collectionRate?.toFixed(1) ?? "--"}%` : "---"}
          icon={Percent}
          loading={isLoading}
        />
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard
          title="Revenue by Department"
          description="Breakdown of revenue across departments"
          loading={isLoading}
        >
          {departmentChartData.length > 0 ? (
            <SimpleBarChart data={departmentChartData} />
          ) : (
            <EmptyReportState description="No data available" />
          )}
        </ChartCard>

        <ChartCard
          title="Revenue by Payment Method"
          description="Distribution across payment methods"
          loading={isLoading}
        >
          {paymentMethodChartData.length > 0 ? (
            <SimplePieChart data={paymentMethodChartData} />
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

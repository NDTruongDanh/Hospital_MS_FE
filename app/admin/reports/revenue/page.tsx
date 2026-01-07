"use client";

import { useState, useMemo, useEffect } from "react";
import { format, startOfMonth } from "date-fns";
import { vi } from "date-fns/locale";
import { useAuth } from "@/contexts/AuthContext";
import {
  Download,
  DollarSign,
  FileText,
  CreditCard,
  Percent,
  ArrowLeft,
  Building2,
  Wallet,
  Receipt,
  TrendingUp,
  Sparkles,
  Loader2,
  Banknote,
  ShieldCheck,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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

import { useRevenueReport } from "@/hooks/queries/useReports";
import { useDepartments } from "@/hooks/queries/useHr";
import { Department } from "@/interfaces/hr";
import { exportToCSV } from "@/lib/utils/export";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";
import { DateRangeFilter, DateRange } from "@/components/ui/date-range-filter";
import { cn } from "@/lib/utils";

// Payment method labels (Vietnamese)
const paymentMethodLabels: Record<string, string> = {
  CASH: "Tiền mặt",
  CARD: "Thẻ",
  INSURANCE: "Bảo hiểm",
  BANK_TRANSFER: "Chuyển khoản",
};

const paymentMethodColors: Record<string, string> = {
  CASH: "#22c55e",
  CARD: "#3b82f6",
  INSURANCE: "#8b5cf6",
  BANK_TRANSFER: "#f59e0b",
};

const paymentMethodIcons: Record<string, React.ReactNode> = {
  CASH: <Banknote className="h-4 w-4" />,
  CARD: <CreditCard className="h-4 w-4" />,
  INSURANCE: <ShieldCheck className="h-4 w-4" />,
  BANK_TRANSFER: <Wallet className="h-4 w-4" />,
};

export default function RevenueReportPage() {
  const router = useRouter();
  const { user } = useAuth();
  const role = user?.role || "ADMIN";

  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
    const today = new Date();
    return {
      from: startOfMonth(today),
      to: today,
    };
  });
  const [departmentId, setDepartmentId] = useState<string>("ALL");
  const [paymentMethod, setPaymentMethod] = useState<string>("ALL");

  useEffect(() => {
    if (role && role !== "ADMIN") {
      router.replace("/doctor/reports/appointments");
    }
  }, [role, router]);

  // Fetch departments for filter
  const { data: departmentsData } = useDepartments({ size: 100 });
  const departments = departmentsData?.content ?? [];

  // Calculate date strings
  const startDate = dateRange?.from ? format(dateRange.from, "yyyy-MM-dd") : "";
  const endDate = dateRange?.to ? format(dateRange.to, "yyyy-MM-dd") : "";

  // Fetch revenue report
  const { data, isLoading, error, refetch } = useRevenueReport({
    startDate,
    endDate,
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

  const formatCompact = (value: number) => {
    return new Intl.NumberFormat("vi-VN", {
      notation: "compact",
      compactDisplay: "short",
    }).format(value);
  };

  // Chart data
  const paymentMethodChartData = useMemo(() => {
    if (!data?.revenueByPaymentMethod) return [];
    return data.revenueByPaymentMethod;
  }, [data]);

  const totalPaymentAmount = paymentMethodChartData.reduce((sum, p) => sum + p.amount, 0);

  const handleExportCSV = () => {
    const rows = [
      ...(data?.revenueByPaymentMethod?.map((d) => ({
        type: "PAYMENT_METHOD",
        name: d.method,
        amount: d.amount,
        percentage: d.percentage,
      })) || []),
    ];
    exportToCSV(rows, `revenue-report-${startDate}-${endDate}.csv`);
    toast.success("Đã xuất báo cáo CSV!");
  };

  return (
    <div className="space-y-6">
      {/* Gradient Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-500 p-6 text-white shadow-xl">
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
              <DollarSign className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                Báo cáo doanh thu
                <Badge className="bg-white/20 text-white border-0 text-xs">
                  <Sparkles className="h-3 w-3 mr-1" />
                  Chi tiết
                </Badge>
              </h1>
              <p className="mt-1 text-emerald-100">
                Phân tích doanh thu theo khoa và phương thức thanh toán
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <DateRangeFilter
              value={dateRange}
              onChange={setDateRange}
              theme="teal"
              presetKeys={["thisMonth", "thisWeek", "7days", "30days"]}
              showQuickPresets={false}
            />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="bg-white text-emerald-700 hover:bg-white/90">
                  <Download className="mr-2 h-4 w-4" />
                  Xuất báo cáo
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleExportCSV}>
                  Xuất CSV
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Note: Department and payment method filters removed - backend doesn't support filtering by these */}

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card className="border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-white">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-100">
                <DollarSign className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Tổng doanh thu</p>
                {isLoading ? (
                  <Spinner size="sm" className="mt-1" />
                ) : (
                  <p className="text-xl font-bold text-emerald-700">
                    {formatCurrency(data?.totalRevenue || 0)}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-teal-200 bg-gradient-to-br from-teal-50 to-white">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-teal-100">
                <CreditCard className="h-5 w-5 text-teal-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Đã thu</p>
                {isLoading ? (
                  <Spinner size="sm" className="mt-1" />
                ) : (
                  <p className="text-xl font-bold text-teal-700">
                    {formatCurrency(data?.paidRevenue || 0)}
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
                <FileText className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Chưa thu</p>
                {isLoading ? (
                  <Spinner size="sm" className="mt-1" />
                ) : (
                  <p className="text-xl font-bold text-amber-700">
                    {formatCurrency(data?.unpaidRevenue || 0)}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100">
                <Receipt className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Số hóa đơn</p>
                {isLoading ? (
                  <Spinner size="sm" className="mt-1" />
                ) : (
                  <p className="text-xl font-bold text-blue-700">
                    {(data?.invoiceCount?.total || 0).toLocaleString()}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-violet-200 bg-gradient-to-br from-violet-50 to-white">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-violet-100">
                <TrendingUp className="h-5 w-5 text-violet-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Tỷ lệ thu</p>
                {isLoading ? (
                  <Spinner size="sm" className="mt-1" />
                ) : (
                  <p className="text-xl font-bold text-violet-700">
                    {data?.collectionRate?.toFixed(1) ?? "0"}%
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4">

        {/* Revenue by Payment Method - Donut Chart */}
        <Card className="border-2 border-slate-200 shadow-sm overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-violet-500 to-purple-500" />
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Wallet className="h-5 w-5 text-violet-600" />
              Phương thức thanh toán
            </CardTitle>
            <CardDescription>Phân bố doanh thu theo hình thức</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex h-[300px] items-center justify-center">
                <Spinner />
              </div>
            ) : paymentMethodChartData.length > 0 ? (
              <div className="flex flex-col lg:flex-row items-center gap-6">
                {/* Donut Chart */}
                <div className="relative">
                  <svg viewBox="0 0 120 120" className="h-52 w-52">
                    {/* Background circle */}
                    <circle
                      cx="60"
                      cy="60"
                      r="45"
                      fill="transparent"
                      stroke="#f1f5f9"
                      strokeWidth="20"
                    />
                    {/* Segments */}
                    {(() => {
                      let cumulativePercent = 0;
                      return paymentMethodChartData.map((payment, i) => {
                        const percentage = totalPaymentAmount > 0 
                          ? (payment.amount / totalPaymentAmount) * 100 
                          : 0;
                        const circumference = 2 * Math.PI * 45;
                        const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`;
                        const strokeDashoffset = -(cumulativePercent / 100) * circumference;
                        cumulativePercent += percentage;
                        const color = paymentMethodColors[payment.method] || "#94a3b8";
                        
                        return (
                          <circle
                            key={i}
                            cx="60"
                            cy="60"
                            r="45"
                            fill="transparent"
                            stroke={color}
                            strokeWidth="20"
                            strokeDasharray={strokeDasharray}
                            strokeDashoffset={strokeDashoffset}
                            strokeLinecap="round"
                            className="transition-all duration-700 -rotate-90 origin-center"
                            style={{ transform: 'rotate(-90deg)', transformOrigin: '60px 60px' }}
                          />
                        );
                      });
                    })()}
                  </svg>
                  {/* Center text */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold text-slate-800">
                      {formatCompact(totalPaymentAmount)}
                    </span>
                    <span className="text-xs text-muted-foreground">Tổng cộng</span>
                  </div>
                </div>

                {/* Legend */}
                <div className="flex-1 space-y-3">
                  {paymentMethodChartData.map((payment, i) => {
                    const percentage = totalPaymentAmount > 0 
                      ? (payment.amount / totalPaymentAmount) * 100 
                      : 0;
                    const color = paymentMethodColors[payment.method] || "#94a3b8";
                    return (
                      <div 
                        key={i} 
                        className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors"
                        style={{ borderLeft: `4px solid ${color}` }}
                      >
                        <div 
                          className="p-2 rounded-lg"
                          style={{ backgroundColor: color + "15" }}
                        >
                          {paymentMethodIcons[payment.method] || <Wallet className="h-4 w-4" />}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-sm">
                              {paymentMethodLabels[payment.method] || payment.method}
                            </span>
                            <Badge 
                              className="font-bold text-xs"
                              style={{ backgroundColor: color + "20", color: color }}
                            >
                              {percentage.toFixed(1)}%
                            </Badge>
                          </div>
                          <p className="text-lg font-bold text-slate-800">
                            {formatCurrency(payment.amount)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="flex h-[200px] items-center justify-center text-muted-foreground">
                Chưa có dữ liệu phương thức thanh toán
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Cache Info */}
      {data?.cached && (
        <Card className="border border-slate-200 bg-slate-50">
          <CardContent className="py-3">
            <p className="text-sm text-muted-foreground text-center">
              📊 Dữ liệu được tạo vào: {format(new Date(data.generatedAt), "HH:mm dd/MM/yyyy", { locale: vi })}
              {data.cacheExpiresAt && ` • Hết hạn: ${format(new Date(data.cacheExpiresAt), "HH:mm dd/MM/yyyy", { locale: vi })}`}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

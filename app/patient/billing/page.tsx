"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useMyInvoices } from "@/hooks/queries/useBilling";
import { InvoiceStatusBadge } from "@/app/admin/billing/_components/invoice-status-badge";
import { Invoice } from "@/interfaces/billing";
import { Spinner } from "@/components/ui/spinner";
import { DateRangeFilter, DateRange } from "@/components/ui/date-range-filter";
import {
  Receipt,
  CreditCard,
  Clock,
  CheckCircle,
  AlertTriangle,
  ChevronRight,
  RefreshCw,
  Sparkles,
  Info,
  Wallet,
  TrendingUp,
  Calendar,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Status filter pills
const statusFilters = [
  { value: "ALL", label: "Tất cả", icon: Receipt, color: "bg-slate-600" },
  { value: "UNPAID", label: "Chưa thanh toán", icon: Clock, color: "bg-amber-500" },
  { value: "PARTIALLY_PAID", label: "Thanh toán một phần", icon: TrendingUp, color: "bg-blue-500" },
  { value: "PAID", label: "Đã thanh toán", icon: CheckCircle, color: "bg-emerald-500" },
  { value: "OVERDUE", label: "Quá hạn", icon: AlertTriangle, color: "bg-red-500" },
];

// Format currency
function formatCurrency(amount: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
}

// Invoice Card Component
function InvoiceCard({ invoice }: { invoice: Invoice }) {
  const isOverdue = invoice.status === "OVERDUE";
  const isPayable =
    invoice.status === "UNPAID" ||
    invoice.status === "PARTIALLY_PAID" ||
    invoice.status === "OVERDUE";
  
  const paidAmount = invoice.paidAmount || 0;
  const remainingAmount = invoice.totalAmount - paidAmount;
  const paidPercentage = invoice.totalAmount > 0 ? (paidAmount / invoice.totalAmount) * 100 : 0;

  return (
    <Card className={cn(
      "border-2 hover:shadow-lg transition-all overflow-hidden group",
      isOverdue ? "border-red-300 bg-red-50/30" : "border-slate-200 hover:border-emerald-300"
    )}>
      {/* Top gradient bar */}
      <div className={cn(
        "h-1",
        isOverdue 
          ? "bg-gradient-to-r from-red-500 to-orange-500" 
          : invoice.status === "PAID" 
            ? "bg-gradient-to-r from-emerald-500 to-teal-500"
            : "bg-gradient-to-r from-amber-500 to-orange-500"
      )} />
      
      <CardContent className="py-5">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-start gap-3">
            <div className={cn(
              "p-2.5 rounded-xl",
              isOverdue ? "bg-red-100" : invoice.status === "PAID" ? "bg-emerald-100" : "bg-amber-100"
            )}>
              <Receipt className={cn(
                "h-5 w-5",
                isOverdue ? "text-red-600" : invoice.status === "PAID" ? "text-emerald-600" : "text-amber-600"
              )} />
            </div>
            <div>
              <h3 className="font-bold text-slate-800">
                Hóa đơn #{invoice.invoiceNumber}
              </h3>
              <div className="flex items-center gap-2 text-sm text-slate-500 mt-1">
                <Calendar className="h-3.5 w-3.5" />
                {format(new Date(invoice.invoiceDate), "dd/MM/yyyy")}
                {invoice.dueDate && (
                  <span className={cn(
                    "ml-2",
                    isOverdue ? "text-red-500 font-medium" : ""
                  )}>
                    • Hạn: {format(new Date(invoice.dueDate), "dd/MM/yyyy")}
                  </span>
                )}
              </div>
            </div>
          </div>
          <InvoiceStatusBadge status={invoice.status} />
        </div>

        {/* Amount Info */}
        <div className="space-y-3 mb-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-600">Tổng tiền</span>
            <span className="font-bold text-lg text-slate-800">{formatCurrency(invoice.totalAmount)}</span>
          </div>
          
          {invoice.status !== "PAID" && paidAmount > 0 && (
            <>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">Đã thanh toán</span>
                <span className="font-medium text-emerald-600">{formatCurrency(paidAmount)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">Còn lại</span>
                <span className="font-semibold text-amber-600">{formatCurrency(remainingAmount)}</span>
              </div>
              {/* Progress bar */}
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all"
                  style={{ width: `${paidPercentage}%` }}
                />
              </div>
            </>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 flex-wrap pt-3 border-t border-slate-100">
          {isPayable && (
            <Button 
              size="sm" 
              asChild
              className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
            >
              <Link href={`/patient/billing/${invoice.id}/pay`}>
                <CreditCard className="h-4 w-4 mr-1" />
                Thanh toán
              </Link>
            </Button>
          )}
          <Button size="sm" variant="outline" asChild className="group-hover:border-slate-300">
            <Link href={`/patient/billing/${invoice.id}`}>
              Chi tiết
              <ChevronRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function PatientInvoiceListPage() {
  const [status, setStatus] = useState<string>("ALL");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  
  const { data: invoices = [], isLoading, isError, error, refetch, isFetching } = useMyInvoices(
    { status: status === "ALL" ? undefined : status },
  );

  // Filter by date range (client-side since API might not support it)
  const filteredInvoices = useMemo(() => {
    if (!dateRange?.from) return invoices;
    
    return invoices.filter((invoice: Invoice) => {
      const invoiceDate = new Date(invoice.invoiceDate);
      const from = dateRange.from!;
      const to = dateRange.to || dateRange.from!;
      return invoiceDate >= from && invoiceDate <= to;
    });
  }, [invoices, dateRange]);

  // Stats
  const totalAmount = filteredInvoices.reduce((sum: number, inv: Invoice) => sum + inv.totalAmount, 0);
  const unpaidAmount = filteredInvoices
    .filter((inv: Invoice) => inv.status !== "PAID")
    .reduce((sum: number, inv: Invoice) => sum + (inv.totalAmount - (inv.paidAmount || 0)), 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (isError) {
    const errorMessage = (error as any)?.response?.data?.message || "Không thể tải hóa đơn. Vui lòng thử lại.";
    return (
      <div className="space-y-6">
        <Card className="border-2 border-red-200">
          <CardContent className="py-10 text-center text-red-600">
            {errorMessage}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Enhanced Gradient Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-500 p-6 text-white shadow-xl">
        {/* Background decorations */}
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
        <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-white/5" />
        <div className="absolute top-1/2 right-1/4 h-20 w-20 rounded-full bg-white/5" />

        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="rounded-xl bg-white/20 p-3 backdrop-blur-sm">
              <Wallet className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                Hóa đơn của tôi
                {isFetching && <RefreshCw className="h-4 w-4 animate-spin" />}
              </h1>
              <p className="mt-1 text-teal-100">
                Xem và thanh toán các hóa đơn của bạn
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="flex gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold">{filteredInvoices.length}</div>
              <div className="text-sm text-teal-200">Hóa đơn</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{formatCurrency(unpaidAmount)}</div>
              <div className="text-sm text-teal-200">Còn nợ</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-3 space-y-4">
          {/* Filter Bar */}
          <Card className="border-2 border-slate-200 shadow-sm">
            <CardContent className="py-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                {/* Status Pills */}
                <div className="flex gap-2 flex-wrap">
                  {statusFilters.map((filter) => {
                    const Icon = filter.icon;
                    const isActive = status === filter.value;
                    const count = filter.value === "ALL" 
                      ? invoices.length 
                      : invoices.filter((inv: Invoice) => inv.status === filter.value).length;
                    
                    return (
                      <button
                        key={filter.value}
                        onClick={() => setStatus(filter.value)}
                        className={cn(
                          "flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium transition-all",
                          isActive
                            ? `${filter.color} text-white shadow-md scale-[1.02]`
                            : "bg-white text-slate-600 border border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                        )}
                      >
                        <Icon className="h-4 w-4" />
                        {filter.label}
                        <Badge 
                          variant="secondary" 
                          className={cn(
                            "text-xs",
                            isActive ? "bg-white/20 text-white" : "bg-slate-100"
                          )}
                        >
                          {count}
                        </Badge>
                      </button>
                    );
                  })}
                </div>

                {/* Date Filter + Refresh */}
                <div className="flex items-center gap-3">
                  <DateRangeFilter
                    value={dateRange}
                    onChange={setDateRange}
                    theme="teal"
                    presetKeys={["all", "today", "7days", "30days", "thisMonth"]}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => refetch()}
                    disabled={isFetching}
                    className="gap-2"
                  >
                    <RefreshCw className={cn("h-4 w-4", isFetching && "animate-spin")} />
                    Làm mới
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Invoice List */}
          {filteredInvoices.length === 0 ? (
            <Card className="border-2 border-dashed border-slate-200">
              <CardContent className="py-16 text-center">
                <div className="rounded-full bg-slate-100 p-4 w-fit mx-auto mb-4">
                  <Receipt className="h-12 w-12 text-slate-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-700">Chưa có hóa đơn</h3>
                <p className="text-slate-500 mt-1">
                  {status !== "ALL" ? "Không có hóa đơn nào với trạng thái này" : "Bạn chưa có hóa đơn nào"}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {filteredInvoices.map((invoice: Invoice) => (
                <InvoiceCard key={invoice.id} invoice={invoice} />
              ))}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Summary Card */}
          <Card className="border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-white shadow-sm">
            <CardContent className="pt-5">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-emerald-100">
                  <Wallet className="h-4 w-4 text-emerald-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-800 mb-3">Tổng quan</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">Tổng hóa đơn</span>
                      <Badge className="bg-emerald-100 text-emerald-700">{filteredInvoices.length}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">Tổng tiền</span>
                      <span className="font-semibold text-slate-800">{formatCurrency(totalAmount)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">Còn nợ</span>
                      <span className="font-semibold text-amber-600">{formatCurrency(unpaidAmount)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Info Card */}
          <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white shadow-sm">
            <CardContent className="pt-5">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-blue-100">
                  <Info className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800 mb-2">Hướng dẫn</h3>
                  <ul className="space-y-2 text-sm text-slate-600">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                      Click "Thanh toán" để thanh toán
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                      Xem chi tiết để biết thêm thông tin
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                      Lọc theo trạng thái hoặc ngày
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Methods Card */}
          <Card className="border-2 border-violet-200 bg-gradient-to-br from-violet-50 to-white shadow-sm">
            <CardContent className="pt-5">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-violet-100">
                  <CreditCard className="h-4 w-4 text-violet-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800 mb-2">Thanh toán</h3>
                  <p className="text-sm text-slate-600">
                    Hỗ trợ thanh toán qua chuyển khoản, thẻ tín dụng và tiền mặt tại quầy.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

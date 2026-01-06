"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InvoiceStatusBadge } from "@/app/admin/billing/_components/invoice-status-badge";
import { ItemTypeBadge } from "@/app/admin/billing/_components/item-type-badge";
import { useInvoice } from "@/hooks/queries/useBilling";
import { CurrencyDisplay } from "@/components/billing/CurrencyDisplay";
import { PaymentHistoryTable } from "@/components/billing/PaymentHistoryTable";
import { Spinner } from "@/components/ui/spinner";
import { StatsSummaryBar } from "@/components/ui/stats-summary-bar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  ArrowLeft,
  CreditCard,
  Printer,
  AlertTriangle,
  Receipt,
  Calendar,
  DollarSign,
  Clock,
} from "lucide-react";

export default function PatientInvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { data: invoice, isLoading, isError, error } = useInvoice(id);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const handlePrint = () => {
    window.print();
  };

  // Calculate days overdue
  const getDaysOverdue = () => {
    if (invoice?.status !== "OVERDUE" || !invoice?.dueDate) return 0;
    const now = new Date();
    const due = new Date(invoice.dueDate);
    return Math.floor((now.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
  };

  if (isLoading) {
    return (
      <div className="page-shell flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  // Show error from API (including 403 Forbidden from backend)
  if (isError) {
    const errorMessage = (error as any)?.response?.data?.message || "Không thể tải hóa đơn. Vui lòng thử lại.";
    const statusCode = (error as any)?.response?.status;
    return (
      <div className="page-shell py-10 text-center space-y-2">
        <p className="text-lg font-semibold text-destructive">
          {statusCode === 403 
            ? "Bạn không có quyền xem hóa đơn này" 
            : statusCode === 404 
            ? "Không tìm thấy hóa đơn" 
            : errorMessage}
        </p>
        <Button variant="link" onClick={() => router.push("/patient/billing")}>
          Về danh sách hóa đơn
        </Button>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="page-shell py-10 text-center">
        <p className="text-lg font-medium">Không tìm thấy hóa đơn</p>
        <Button variant="link" onClick={() => router.back()}>
          Quay lại
        </Button>
      </div>
    );
  }

  const daysOverdue = getDaysOverdue();
  const isPayable =
    invoice.status === "UNPAID" ||
    invoice.status === "PARTIALLY_PAID" ||
    invoice.status === "OVERDUE";

  return (
    <div className="page-shell space-y-6">
      {/* Emerald Gradient Header */}
      <div className="relative rounded-xl bg-gradient-to-r from-emerald-500 to-green-500 p-6 text-white overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-white" />
          <div className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full bg-white" />
        </div>

        <div className="relative flex items-start justify-between gap-6">
          <div className="flex items-center gap-5">
            {/* Back button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
              className="text-white/90 hover:text-white hover:bg-white/20 shrink-0"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>

            {/* Icon */}
            <div className="h-16 w-16 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <Receipt className="h-8 w-8 text-white" />
            </div>

            {/* Title & Meta */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight">
                  Hóa đơn #{invoice.invoiceNumber}
                </h1>
                <InvoiceStatusBadge status={invoice.status} />
              </div>
              <p className="text-white/80 text-sm font-medium">
                Ngày: {new Date(invoice.invoiceDate).toLocaleDateString("vi-VN")}
                {invoice.dueDate &&
                  ` • Hạn: ${new Date(invoice.dueDate).toLocaleDateString("vi-VN")}`}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="bg-white/10 border-white/30 text-white hover:bg-white/20"
            >
              <Printer className="mr-2 h-4 w-4" />
              In hóa đơn
            </Button>
            {isPayable && (
              <Button
                size="sm"
                asChild
                className="bg-white text-emerald-600 hover:bg-white/90"
              >
                <Link href={`/patient/billing/${invoice.id}/pay`}>
                  <CreditCard className="mr-2 h-4 w-4" />
                  Thanh toán
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Stats Summary */}
      <StatsSummaryBar
        stats={[
          {
            label: "Tổng tiền",
            value: formatCurrency(invoice.totalAmount),
            icon: <DollarSign className="h-5 w-5" />,
            color: "slate",
          },
          {
            label: "Đã thanh toán",
            value: formatCurrency(invoice.paidAmount || 0),
            icon: <CreditCard className="h-5 w-5" />,
            color: "emerald",
          },
          {
            label: "Còn nợ",
            value: formatCurrency(invoice.balance ?? invoice.balanceDue ?? 0),
            icon: <Receipt className="h-5 w-5" />,
            color:
              (invoice.balance ?? invoice.balanceDue ?? 0) > 0
                ? "rose"
                : "emerald",
          },
          {
            label: "Hạn thanh toán",
            value: invoice.dueDate
              ? new Date(invoice.dueDate).toLocaleDateString("vi-VN")
              : "N/A",
            icon: <Calendar className="h-5 w-5" />,
            color: invoice.status === "OVERDUE" ? "rose" : "sky",
          },
        ]}
      />

      {/* Overdue Warning */}
      {invoice.status === "OVERDUE" && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Hóa đơn đã quá hạn <strong>{daysOverdue} ngày</strong>. Vui lòng thanh toán sớm.
          </AlertDescription>
        </Alert>
      )}

      {/* Cancelled Notice */}
      {invoice.status === "CANCELLED" && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Hóa đơn này đã bị hủy.
            {invoice.notes && (
              <span className="block mt-1">Lý do: {invoice.notes}</span>
            )}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          {/* Invoice Line Items */}
          <Card>
            <CardHeader>
              <CardTitle>Chi tiết khoản phí</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <div className="grid grid-cols-12 gap-4 border-b bg-muted p-3 font-medium text-sm">
                  <div className="col-span-2">Loại</div>
                  <div className="col-span-5">Mô tả</div>
                  <div className="col-span-1 text-right">SL</div>
                  <div className="col-span-2 text-right">Đơn giá</div>
                  <div className="col-span-2 text-right">Thành tiền</div>
                </div>
                {invoice.items?.map(
                  (item: {
                    id: string;
                    type: string;
                    description: string;
                    quantity: number;
                    unitPrice: number;
                    amount: number;
                  }) => (
                    <div
                      key={item.id}
                      className="grid grid-cols-12 gap-4 p-3 border-b last:border-0 items-center text-sm"
                    >
                      <div className="col-span-2">
                        <ItemTypeBadge
                          type={
                            item.type as
                              | "CONSULTATION"
                              | "MEDICINE"
                              | "TEST"
                              | "PROCEDURE"
                              | "OTHER"
                          }
                          showIcon={false}
                        />
                      </div>
                      <div className="col-span-5">
                        <p className="font-medium">{item.description}</p>
                      </div>
                      <div className="col-span-1 text-right">
                        {item.quantity}
                      </div>
                      <div className="col-span-2 text-right text-muted-foreground">
                        {formatCurrency(item.unitPrice)}
                      </div>
                      <div className="col-span-2 text-right font-medium">
                        {formatCurrency(item.amount)}
                      </div>
                    </div>
                  )
                )}

                {/* Totals */}
                <div className="p-4 bg-muted/50">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-muted-foreground">Tạm tính</span>
                    <span>{formatCurrency(invoice.subtotal || 0)}</span>
                  </div>
                  {(invoice.discount || 0) > 0 && (
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-muted-foreground">Giảm giá</span>
                      <span className="text-green-600">
                        - {formatCurrency(invoice.discount)}
                      </span>
                    </div>
                  )}
                  {(invoice.tax || 0) > 0 && (
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-muted-foreground">Thuế (10%)</span>
                      <span>{formatCurrency(invoice.tax)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center pt-2 border-t font-bold text-lg">
                    <span>Tổng cộng</span>
                    <span>{formatCurrency(invoice.totalAmount)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment History */}
          <Card>
            <CardHeader>
              <CardTitle>Lịch sử thanh toán</CardTitle>
            </CardHeader>
            <CardContent>
              <PaymentHistoryTable
                payments={invoice.payments ?? []}
                totalPaid={invoice.paidAmount || 0}
                remainingBalance={invoice.balance ?? invoice.balanceDue ?? 0}
              />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Payment Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Tổng kết thanh toán</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tổng tiền</span>
                <span className="font-medium">
                  {formatCurrency(invoice.totalAmount)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Đã thanh toán</span>
                <span className="font-medium text-green-600">
                  {formatCurrency(invoice.paidAmount || 0)}
                </span>
              </div>
              <div className="flex justify-between pt-3 border-t">
                <span className="font-bold text-lg">Còn nợ</span>
                <span
                  className={`font-bold text-lg ${
                    (invoice.balance ?? invoice.balanceDue ?? 0) > 0
                      ? "text-red-600"
                      : "text-green-600"
                  }`}
                >
                  {formatCurrency(invoice.balance ?? invoice.balanceDue ?? 0)}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Status Info */}
          <Card>
            <CardHeader>
              <CardTitle>Thông tin hóa đơn</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Trạng thái</span>
                <InvoiceStatusBadge status={invoice.status} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Ngày lập</span>
                <span className="font-medium">
                  {new Date(invoice.invoiceDate).toLocaleDateString("vi-VN")}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Hạn thanh toán</span>
                <span
                  className={`font-medium ${
                    invoice.status === "OVERDUE" ? "text-red-600" : ""
                  }`}
                >
                  {invoice.dueDate
                    ? new Date(invoice.dueDate).toLocaleDateString("vi-VN")
                    : "N/A"}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Pay Button */}
          {isPayable && (
            <Button asChild className="w-full" size="lg">
              <Link href={`/patient/billing/${invoice.id}/pay`}>
                <CreditCard className="mr-2 h-5 w-5" />
                Thanh toán ngay
              </Link>
            </Button>
          )}

          {invoice.status === "PAID" && (
            <Button variant="outline" className="w-full" onClick={handlePrint}>
              <Printer className="mr-2 h-4 w-4" />
              Tải biên lai
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

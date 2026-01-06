"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  useInvoice,
  useCancelInvoice,
  usePaymentsByInvoice,
} from "@/hooks/queries/useBilling";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatsSummaryBar } from "@/components/ui/stats-summary-bar";
import { InfoItem, InfoGrid } from "@/components/ui/info-item";
import {
  ArrowLeft,
  CreditCard,
  Printer,
  XCircle,
  AlertTriangle,
  ExternalLink,
  FileSearch,
  Receipt,
  User,
  Calendar,
  DollarSign,
  Clock,
} from "lucide-react";
import Link from "next/link";
import { InvoiceStatusBadge } from "../_components/invoice-status-badge";
import { ItemTypeBadge } from "../_components/item-type-badge";
import { CancelInvoiceDialog } from "../_components/cancel-invoice-dialog";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loading } from "@/components/ui/loading";
import { useAuth } from "@/contexts/AuthContext";
import { PaymentHistoryTable } from "@/components/billing/PaymentHistoryTable";

export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { user } = useAuth();
  const { data: invoice, isLoading } = useInvoice(id);
  const { mutateAsync: cancelInvoice, isPending: isCancelling } =
    useCancelInvoice();
  const { data: paymentsData } = usePaymentsByInvoice(id);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);

  if (isLoading) {
    return <Loading />;
  }

  if (!invoice) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <h2 className="text-xl font-semibold">Invoice not found</h2>
        <Button variant="link" onClick={() => router.back()}>
          Go back
        </Button>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const handleCancelInvoice = async (reason: string) => {
    try {
      await cancelInvoice({ id: invoice.id, reason });
      toast.success("Invoice cancelled successfully");
      setCancelDialogOpen(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to cancel invoice"
      );
    }
  };

  // Calculate days overdue
  const getDaysOverdue = () => {
    if (invoice.status !== "OVERDUE" || !invoice.dueDate) return 0;
    const now = new Date();
    const due = new Date(invoice.dueDate);
    return Math.floor((now.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
  };

  const daysOverdue = getDaysOverdue();

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
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
                  Invoice #{invoice.invoiceNumber}
                </h1>
                <InvoiceStatusBadge status={invoice.status} />
              </div>
              <p className="text-white/80 text-sm font-medium">
                {new Date(invoice.invoiceDate).toLocaleDateString()} •{" "}
                {invoice.patientName}
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
              Print
            </Button>
            {invoice?.medicalExamId && user?.role !== "RECEPTIONIST" && (
              <Button
                variant="outline"
                size="sm"
                asChild
                className="bg-white/10 border-white/30 text-white hover:bg-white/20"
              >
                <Link href={`/admin/exams/${invoice.medicalExamId}`}>
                  <FileSearch className="h-4 w-4 mr-2" />
                  View Exam
                </Link>
              </Button>
            )}
            {user?.role === "ADMIN" &&
              invoice.status === "UNPAID" &&
              (invoice.payments?.length ?? 0) === 0 && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setCancelDialogOpen(true)}
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
              )}
            {invoice.status !== "PAID" && invoice.status !== "CANCELLED" && (
              <Button
                size="sm"
                asChild
                className="bg-white text-emerald-600 hover:bg-white/90"
              >
                <Link href={`/admin/billing/${invoice.id}/payment`}>
                  <CreditCard className="mr-2 h-4 w-4" />
                  Record Payment
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
            label: "Total Amount",
            value: formatCurrency(invoice.totalAmount),
            icon: <DollarSign className="h-5 w-5" />,
            color: "slate",
          },
          {
            label: "Amount Paid",
            value: formatCurrency(invoice.paidAmount),
            icon: <CreditCard className="h-5 w-5" />,
            color: "emerald",
          },
          {
            label: "Balance Due",
            value: formatCurrency(invoice.balance ?? invoice.balanceDue ?? 0),
            icon: <Receipt className="h-5 w-5" />,
            color:
              (invoice.balance ?? invoice.balanceDue ?? 0) > 0
                ? "rose"
                : "emerald",
          },
          {
            label: "Due Date",
            value: invoice.dueDate
              ? new Date(invoice.dueDate).toLocaleDateString()
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
            This invoice is <strong>{daysOverdue} days overdue</strong>. Please
            follow up with the patient for payment.
          </AlertDescription>
        </Alert>
      )}

      {/* Cancelled Notice */}
      {invoice.status === "CANCELLED" && (
        <Alert>
          <XCircle className="h-4 w-4" />
          <AlertDescription>
            This invoice has been cancelled.
            {invoice.notes && (
              <span className="block mt-1">Reason: {invoice.notes}</span>
            )}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          {/* Invoice Items */}
          <Card>
            <CardHeader>
              <CardTitle>Line Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <div className="grid grid-cols-12 gap-4 border-b bg-muted p-3 font-medium">
                  <div className="col-span-2">Type</div>
                  <div className="col-span-5">Description</div>
                  <div className="col-span-1 text-right">Qty</div>
                  <div className="col-span-2 text-right">Unit Price</div>
                  <div className="col-span-2 text-right">Amount</div>
                </div>
                {invoice.items.map(
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
                      className="grid grid-cols-12 gap-4 p-3 border-b last:border-0 items-center"
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
                <div className="p-4 bg-muted/50">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{formatCurrency(invoice.subtotal)}</span>
                  </div>
                  {invoice.discount > 0 && (
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-muted-foreground">Discount</span>
                      <span className="text-green-600">
                        - {formatCurrency(invoice.discount)}
                      </span>
                    </div>
                  )}
                  {invoice.tax > 0 && (
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-muted-foreground">Tax (10%)</span>
                      <span>{formatCurrency(invoice.tax)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center pt-2 border-t font-bold text-lg">
                    <span>Total</span>
                    <span>{formatCurrency(invoice.totalAmount)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Amount</span>
                  <span className="font-medium">
                    {formatCurrency(invoice.totalAmount)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount Paid</span>
                  <span className="font-medium text-green-600">
                    {formatCurrency(invoice.paidAmount)}
                  </span>
                </div>
                <div className="flex justify-between pt-3 border-t">
                  <span className="font-bold text-lg">Balance Due</span>
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
              </div>
            </CardContent>
          </Card>

          {/* Payment History */}
          <Card>
            <CardHeader>
              <CardTitle>
                Payment History ({paymentsData?.payments?.length ?? 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <PaymentHistoryTable
                payments={paymentsData?.payments ?? []}
                totalPaid={paymentsData?.totalPaid ?? invoice.paidAmount ?? 0}
                remainingBalance={
                  paymentsData?.remainingBalance ?? invoice.balanceDue ?? 0
                }
              />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {/* Patient Info */}
          <div className="detail-section-card">
            <div className="detail-section-card-header">
              <User className="h-4 w-4" />
              <h3>Patient Information</h3>
            </div>
            <div className="detail-section-card-content">
              <InfoGrid columns={1}>
                <InfoItem
                  icon={<User className="h-4 w-4" />}
                  label="Patient"
                  value={
                    invoice.patient?.id ? (
                      <Link
                        href={`/admin/patients/${invoice.patient.id}`}
                        className="text-primary hover:underline flex items-center gap-1"
                      >
                        {invoice.patient.fullName || "View Patient"}
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                    ) : (
                      invoice.patient?.fullName || "Not available"
                    )
                  }
                  color="emerald"
                />
              </InfoGrid>
            </div>
          </div>

          {/* Invoice Status */}
          <div className="detail-section-card">
            <div className="detail-section-card-header">
              <Receipt className="h-4 w-4" />
              <h3>Status</h3>
            </div>
            <div className="detail-section-card-content">
              <InfoGrid columns={1}>
                <div className="flex items-center gap-3">
                  <div className="info-pair">
                    <span className="info-pair-label">Current Status</span>
                    <InvoiceStatusBadge status={invoice.status} />
                  </div>
                </div>
                <InfoItem
                  icon={<Calendar className="h-4 w-4" />}
                  label="Invoice Date"
                  value={new Date(invoice.invoiceDate).toLocaleDateString()}
                  color="slate"
                />
                <InfoItem
                  icon={<Clock className="h-4 w-4" />}
                  label="Due Date"
                  value={
                    <span
                      className={
                        invoice.status === "OVERDUE"
                          ? "text-red-600 font-medium"
                          : ""
                      }
                    >
                      {invoice.dueDate
                        ? new Date(invoice.dueDate).toLocaleDateString()
                        : "N/A"}
                    </span>
                  }
                  color={invoice.status === "OVERDUE" ? "rose" : "sky"}
                />
              </InfoGrid>
            </div>
          </div>

          {/* Audit Info */}
          <Card>
            <CardHeader>
              <CardTitle>Audit Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Created
                </p>
                <p className="text-sm">
                  {invoice.createdAt
                    ? new Date(invoice.createdAt).toLocaleString()
                    : "N/A"}
                </p>
              </div>
              {invoice.updatedAt && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Last Updated
                  </p>
                  <p className="text-sm">
                    {new Date(invoice.updatedAt).toLocaleString()}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Cancel Invoice Dialog */}
      <CancelInvoiceDialog
        open={cancelDialogOpen}
        onOpenChange={setCancelDialogOpen}
        invoiceNumber={invoice.invoiceNumber}
        onConfirm={handleCancelInvoice}
        isLoading={isCancelling}
      />
    </div>
  );
}

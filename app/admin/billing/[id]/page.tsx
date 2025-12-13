"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useInvoice, useCancelInvoice } from "@/hooks/queries/useBilling";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  CreditCard,
  Printer,
  XCircle,
  AlertTriangle,
  ExternalLink,
  FileSearch,
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Invoice Details
            </h1>
            <p className="text-muted-foreground">
              Invoice #{invoice.invoiceNumber} •{" "}
              {new Date(invoice.invoiceDate).toLocaleDateString()}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline">
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
          {invoice?.appointmentId && (
            <Button variant="outline" asChild>
              <Link
                href={`/admin/exams/${invoice.appointmentId}`}
                className="flex items-center gap-2"
              >
                <FileSearch className="h-4 w-4" />
                View Medical Exam
              </Link>
            </Button>
          )}
          {user?.role === "ADMIN" &&
            invoice.status === "UNPAID" &&
            (invoice.payments?.length ?? 0) === 0 && (
              <Button
                variant="outline"
                className="text-destructive hover:text-destructive"
                onClick={() => setCancelDialogOpen(true)}
              >
                <XCircle className="mr-2 h-4 w-4" />
                Cancel Invoice
              </Button>
            )}
          {invoice.status !== "PAID" && invoice.status !== "CANCELLED" && (
            <Button asChild>
              <Link href={`/admin/billing/${invoice.id}/payment`}>
                <CreditCard className="mr-2 h-4 w-4" />
                Record Payment
              </Link>
            </Button>
          )}
        </div>
      </div>

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
                {invoice.items.map((item) => (
                  <div
                    key={item.id}
                    className="grid grid-cols-12 gap-4 p-3 border-b last:border-0 items-center"
                  >
                    <div className="col-span-2">
                      <ItemTypeBadge type={item.type} showIcon={false} />
                    </div>
                    <div className="col-span-5">
                      <p className="font-medium">{item.description}</p>
                    </div>
                    <div className="col-span-1 text-right">{item.quantity}</div>
                    <div className="col-span-2 text-right text-muted-foreground">
                      {formatCurrency(item.unitPrice)}
                    </div>
                    <div className="col-span-2 text-right font-medium">
                      {formatCurrency(item.amount)}
                    </div>
                  </div>
                ))}
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
                      invoice.balance > 0 ? "text-red-600" : "text-green-600"
                    }`}
                  >
                    {formatCurrency(invoice.balance)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment History */}
          <Card>
            <CardHeader>
              <CardTitle>Payment History ({invoice.payments.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <PaymentHistoryTable
                payments={invoice.payments}
                totalPaid={invoice.paidAmount}
                remainingBalance={invoice.balance}
              />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {/* Patient Info */}
          <Card>
            <CardHeader>
              <CardTitle>Patient Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Name
                </p>
                <p className="font-semibold">{invoice.patientName}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Patient ID
                </p>
                <p>{invoice.patientId}</p>
              </div>
              {invoice.appointmentId && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Appointment
                  </p>
                  <Link
                    href={`/admin/appointments/${invoice.appointmentId}`}
                    className="text-primary hover:underline flex items-center gap-1"
                  >
                    {invoice.appointmentId}
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Invoice Status */}
          <Card>
            <CardHeader>
              <CardTitle>Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">
                  Current Status
                </p>
                <InvoiceStatusBadge status={invoice.status} size="lg" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Invoice Date
                </p>
                <p>{new Date(invoice.invoiceDate).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Due Date
                </p>
                <p
                  className={
                    invoice.status === "OVERDUE"
                      ? "text-red-600 font-medium"
                      : ""
                  }
                >
                  {invoice.dueDate
                    ? new Date(invoice.dueDate).toLocaleDateString()
                    : "N/A"}
                </p>
              </div>
            </CardContent>
          </Card>

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

"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  User,
  Phone,
  FileText,
  DollarSign,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Printer,
  CreditCard,
  Loader2,
  ExternalLink,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface InvoiceItem {
  id: string;
  type: "CONSULTATION" | "MEDICINE" | "TEST" | "OTHER";
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

interface Payment {
  id: string;
  amount: number;
  method: "CASH" | "CREDIT_CARD" | "BANK_TRANSFER" | "INSURANCE";
  paymentDate: string;
  notes?: string;
  status: string;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  status: "UNPAID" | "PARTIALLY_PAID" | "PAID" | "OVERDUE" | "CANCELLED";
  patient: {
    id: string;
    fullName: string;
    phoneNumber?: string;
  };
  appointmentId?: string;
  examId?: string;
  items: InvoiceItem[];
  subtotal: number;
  discount: number;
  tax: number;
  totalAmount: number;
  paidAmount: number;
  payments: Payment[];
  createdAt: string;
  updatedAt: string;
}

const STATUS_CONFIG = {
  UNPAID: { label: "Chưa thanh toán", class: "badge-danger", icon: XCircle, gradient: "from-red-400 to-rose-500" },
  PARTIALLY_PAID: { label: "Thanh toán 1 phần", class: "badge-warning", icon: AlertTriangle, gradient: "from-yellow-400 to-amber-500" },
  PAID: { label: "Đã thanh toán", class: "badge-success", icon: CheckCircle, gradient: "from-green-400 to-emerald-500" },
  OVERDUE: { label: "Quá hạn", class: "badge-danger", icon: AlertTriangle, gradient: "from-orange-400 to-red-500" },
  CANCELLED: { label: "Đã hủy", class: "badge-secondary", icon: XCircle, gradient: "from-gray-400 to-slate-500" },
};

const ITEM_TYPE_CONFIG = {
  CONSULTATION: { label: "Khám bệnh", class: "bg-purple-100 text-purple-800", emoji: "🩺" },
  MEDICINE: { label: "Thuốc", class: "bg-blue-100 text-blue-800", emoji: "💊" },
  TEST: { label: "Xét nghiệm", class: "bg-cyan-100 text-cyan-800", emoji: "🧪" },
  OTHER: { label: "Khác", class: "bg-gray-100 text-gray-800", emoji: "📋" },
};

const PAYMENT_METHOD_CONFIG = {
  CASH: { label: "Tiền mặt", emoji: "💵" },
  CREDIT_CARD: { label: "Thẻ tín dụng", emoji: "💳" },
  BANK_TRANSFER: { label: "Chuyển khoản", emoji: "🏦" },
  INSURANCE: { label: "Bảo hiểm", emoji: "🏥" },
};

export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const invoiceId = params.id as string;

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (invoiceId) {
      fetchInvoice();
    }
  }, [invoiceId]);

  const fetchInvoice = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/billing/invoices/${invoiceId}`);
      const data = await response.json();
      setInvoice(data.data);
    } catch (error) {
      console.error("Failed to fetch invoice:", error);
      toast.error("Không thể tải thông tin hóa đơn");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelInvoice = async () => {
    if (!cancelReason.trim()) {
      toast.error("Vui lòng nhập lý do hủy");
      return;
    }
    try {
      setActionLoading(true);
      await fetch(`/api/billing/invoices/${invoiceId}/cancel`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: cancelReason }),
      });
      toast.success("Đã hủy hóa đơn");
      setShowCancelDialog(false);
      fetchInvoice();
    } catch (error) {
      toast.error("Không thể hủy hóa đơn");
    } finally {
      setActionLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-[hsl(var(--primary))]" />
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="text-center py-12">
        <FileText className="w-16 h-16 mx-auto text-gray-300 mb-4" />
        <p className="text-gray-500">Không tìm thấy hóa đơn</p>
        <Link href="/admin/billing" className="btn-primary mt-4 inline-flex">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Quay lại
        </Link>
      </div>
    );
  }

  const status = STATUS_CONFIG[invoice.status];
  const StatusIcon = status.icon;
  const balanceDue = invoice.totalAmount - invoice.paidAmount;
  const canRecordPayment = invoice.status === "UNPAID" || invoice.status === "PARTIALLY_PAID" || invoice.status === "OVERDUE";
  const canCancel = invoice.status === "UNPAID" && invoice.payments.length === 0;

  // Check if overdue
  const isOverdue = new Date(invoice.dueDate) < new Date() && invoice.status !== "PAID";
  const daysOverdue = isOverdue ? Math.floor((new Date().getTime() - new Date(invoice.dueDate).getTime()) / (1000 * 60 * 60 * 24)) : 0;

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-8">
      {/* Background */}
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-blue-50 via-purple-50/30 to-pink-50/40" />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/billing" className="btn-icon">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-display flex items-center gap-3">
              <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg">
                <FileText className="w-6 h-6 text-white" />
              </div>
              Hóa đơn #{invoice.invoiceNumber}
            </h1>
            <p className="text-gray-600 mt-1">
              Ngày tạo: {new Date(invoice.invoiceDate).toLocaleDateString("vi-VN")}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={handlePrint} className="btn-secondary">
            <Printer className="w-4 h-4" />
            In hóa đơn
          </button>
          {canRecordPayment && (
            <Link
              href={`/admin/billing/${invoiceId}/payment`}
              className="btn-primary"
            >
              <CreditCard className="w-4 h-4" />
              Ghi nhận thanh toán
            </Link>
          )}
        </div>
      </div>

      {/* Overdue Warning */}
      {isOverdue && (
        <div className="backdrop-blur-lg bg-gradient-to-r from-orange-100 to-red-100 border-2 border-orange-300 rounded-2xl p-4 shadow-xl">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-orange-600" />
            <div>
              <p className="font-semibold text-orange-800">⚠️ Hóa đơn quá hạn {daysOverdue} ngày</p>
              <p className="text-sm text-orange-700">Hạn thanh toán: {new Date(invoice.dueDate).toLocaleDateString("vi-VN")}</p>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Header */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="backdrop-blur-lg bg-white/70 border border-white/50 rounded-2xl p-6 shadow-xl">
          <h3 className="text-section mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            Thông tin hóa đơn
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Số hóa đơn:</span>
              <span className="font-semibold">#{invoice.invoiceNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Ngày tạo:</span>
              <span className="font-semibold">{new Date(invoice.invoiceDate).toLocaleDateString("vi-VN")}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Hạn thanh toán:</span>
              <span className="font-semibold">{new Date(invoice.dueDate).toLocaleDateString("vi-VN")}</span>
            </div>
            {invoice.appointmentId && (
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Lịch hẹn:</span>
                <Link
                  href={`/admin/appointments/${invoice.appointmentId}`}
                  className="text-blue-600 hover:underline flex items-center gap-1"
                >
                  Xem chi tiết
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            )}
          </div>
        </div>

        <div className="backdrop-blur-lg bg-white/70 border border-white/50 rounded-2xl p-6 shadow-xl">
          <h3 className="text-section mb-4 flex items-center gap-2">
            <span className={`badge ${status.class} text-sm px-4 py-2`}>
              <StatusIcon className="w-4 h-4" />
              {status.label}
            </span>
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between text-lg">
              <span className="text-gray-600">Tổng tiền:</span>
              <span className="font-bold text-gray-800">{invoice.totalAmount.toLocaleString("vi-VN")} ₫</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Đã thanh toán:</span>
              <span className="font-semibold text-green-600">{invoice.paidAmount.toLocaleString("vi-VN")} ₫</span>
            </div>
            <div className="h-px bg-gray-300" />
            <div className="flex justify-between text-xl">
              <span className="font-semibold text-gray-800">Còn lại:</span>
              <span className={`font-bold ${balanceDue > 0 ? "text-red-600" : "text-green-600"}`}>
                {balanceDue.toLocaleString("vi-VN")} ₫
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Patient Info */}
      <div className="backdrop-blur-lg bg-white/70 border border-white/50 rounded-2xl p-6 shadow-xl">
        <h3 className="text-section mb-4 flex items-center gap-2">
          <User className="w-5 h-5 text-blue-600" />
          Thông tin bệnh nhân
        </h3>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center text-2xl font-semibold text-blue-600">
            {invoice.patient.fullName.charAt(0)}
          </div>
          <div className="flex-1">
            <p className="font-semibold text-lg">{invoice.patient.fullName}</p>
            {invoice.patient.phoneNumber && (
              <p className="text-sm text-gray-600 flex items-center gap-1">
                <Phone className="w-3 h-3" />
                {invoice.patient.phoneNumber}
              </p>
            )}
          </div>
          <Link
            href={`/admin/patients/${invoice.patient.id}`}
            className="text-blue-600 hover:underline flex items-center gap-1"
          >
            Xem hồ sơ
            <ExternalLink className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Invoice Items */}
      <div className="backdrop-blur-lg bg-white/70 border border-white/50 rounded-2xl p-6 shadow-xl">
        <h3 className="text-section mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-600" />
          Chi tiết hóa đơn
        </h3>
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Loại</th>
                <th>Mô tả</th>
                <th className="text-center">Số lượng</th>
                <th className="text-right">Đơn giá</th>
                <th className="text-right">Thành tiền</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item) => {
                const itemType = ITEM_TYPE_CONFIG[item.type];
                return (
                  <tr key={item.id}>
                    <td>
                      <span className={`text-xs px-2 py-1 rounded-full ${itemType.class}`}>
                        {itemType.emoji} {itemType.label}
                      </span>
                    </td>
                    <td>{item.description}</td>
                    <td className="text-center">{item.quantity}</td>
                    <td className="text-right">{item.unitPrice.toLocaleString("vi-VN")} ₫</td>
                    <td className="text-right font-semibold">{item.amount.toLocaleString("vi-VN")} ₫</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="mt-6 space-y-2 max-w-md ml-auto">
          <div className="flex justify-between">
            <span className="text-gray-600">Tạm tính:</span>
            <span className="font-semibold">{invoice.subtotal.toLocaleString("vi-VN")} ₫</span>
          </div>
          {invoice.discount > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Giảm giá:</span>
              <span className="font-semibold">-{invoice.discount.toLocaleString("vi-VN")} ₫</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-gray-600">Thuế (10%):</span>
            <span className="font-semibold">{invoice.tax.toLocaleString("vi-VN")} ₫</span>
          </div>
          <div className="h-px bg-gray-300" />
          <div className="flex justify-between text-lg">
            <span className="font-bold text-gray-800">TỔNG CỘNG:</span>
            <span className="font-bold text-blue-600">{invoice.totalAmount.toLocaleString("vi-VN")} ₫</span>
          </div>
        </div>
      </div>

      {/* Payment History */}
      <div className="backdrop-blur-lg bg-white/70 border border-white/50 rounded-2xl p-6 shadow-xl">
        <h3 className="text-section mb-4 flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-green-600" />
          Lịch sử thanh toán ({invoice.payments.length})
        </h3>
        {invoice.payments.length === 0 ? (
          <div className="text-center py-8">
            <CreditCard className="w-12 h-12 mx-auto text-gray-300 mb-2" />
            <p className="text-gray-500">Chưa có thanh toán nào</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Ngày</th>
                  <th>Số tiền</th>
                  <th>Phương thức</th>
                  <th>Ghi chú</th>
                </tr>
              </thead>
              <tbody>
                {invoice.payments.map((payment) => {
                  const method = PAYMENT_METHOD_CONFIG[payment.method];
                  return (
                    <tr key={payment.id}>
                      <td>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-gray-400" />
                          {new Date(payment.paymentDate).toLocaleString("vi-VN")}
                        </div>
                      </td>
                      <td className="font-semibold text-green-600">
                        {payment.amount.toLocaleString("vi-VN")} ₫
                      </td>
                      <td>
                        <span className="text-sm">
                          {method.emoji} {method.label}
                        </span>
                      </td>
                      <td className="text-sm text-gray-600">{payment.notes || "-"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Link href="/admin/billing" className="btn-secondary">
          <ArrowLeft className="w-4 h-4" />
          Quay lại
        </Link>
        {canCancel && (
          <button
            onClick={() => setShowCancelDialog(true)}
            className="btn-danger"
          >
            <XCircle className="w-4 h-4" />
            Hủy hóa đơn
          </button>
        )}
      </div>

      {/* Cancel Dialog */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hủy hóa đơn</AlertDialogTitle>
            <AlertDialogDescription>
              Vui lòng nhập lý do hủy hóa đơn. Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="my-4">
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Nhập lý do hủy..."
              className="w-full p-3 border rounded-lg resize-none"
              rows={3}
              maxLength={500}
            />
            <p className="text-xs text-gray-500 mt-1">{cancelReason.length}/500</p>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Đóng</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancelInvoice} disabled={actionLoading}>
              {actionLoading ? "Đang xử lý..." : "Xác nhận hủy"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

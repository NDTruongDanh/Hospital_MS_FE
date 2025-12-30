"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  FileText,
  DollarSign,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
  Download,
  CreditCard,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

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
  };
  items: InvoiceItem[];
  subtotal: number;
  discount: number;
  tax: number;
  totalAmount: number;
  paidAmount: number;
  payments: Payment[];
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

export default function PatientInvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const invoiceId = params.id as string;

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (invoiceId && user?.accountId) {
      fetchInvoice();
    }
  }, [invoiceId, user]);

  const fetchInvoice = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/billing/invoices/${invoiceId}`);
      const data = await response.json();
      
      // Check if patient owns this invoice
      if (data.data.patient.id !== user?.accountId) {
        toast.error("Bạn không có quyền xem hóa đơn này");
        router.push("/patient/billing");
        return;
      }
      
      setInvoice(data.data);
    } catch (error) {
      console.error("Failed to fetch invoice:", error);
      toast.error("Không thể tải thông tin hóa đơn");
    } finally {
      setLoading(false);
    }
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
        <Link href="/patient/billing" className="btn-primary mt-4 inline-flex">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Quay lại
        </Link>
      </div>
    );
  }

  const status = STATUS_CONFIG[invoice.status];
  const StatusIcon = status.icon;
  const balanceDue = invoice.totalAmount - invoice.paidAmount;
  const canPay = invoice.status === "UNPAID" || invoice.status === "PARTIALLY_PAID" || invoice.status === "OVERDUE";
  const isPaid = invoice.status === "PAID";
  const isOverdue = new Date(invoice.dueDate) < new Date() && invoice.status !== "PAID";

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-8">
      {/* Background */}
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-purple-50 via-pink-50/30 to-blue-50/40" />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/patient/billing" className="btn-icon">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-display flex items-center gap-3">
              <div className={`p-3 rounded-xl bg-gradient-to-br ${status.gradient} shadow-lg`}>
                <FileText className="w-6 h-6 text-white" />
              </div>
              Hóa đơn #{invoice.invoiceNumber}
            </h1>
            <p className="text-gray-600 mt-1">
              {new Date(invoice.invoiceDate).toLocaleDateString("vi-VN")}
            </p>
          </div>
        </div>
        <span className={`badge ${status.class} text-lg px-4 py-2`}>
          <StatusIcon className="w-5 h-5" />
          {status.label}
        </span>
      </div>

      {/* Overdue Warning */}
      {isOverdue && (
        <div className="backdrop-blur-lg bg-gradient-to-r from-orange-100 to-red-100 border-2 border-orange-300 rounded-2xl p-4 shadow-xl">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-orange-600" />
            <div>
              <p className="font-semibold text-orange-800">⚠️ Hóa đơn đã quá hạn thanh toán</p>
              <p className="text-sm text-orange-700">Hạn: {new Date(invoice.dueDate).toLocaleDateString("vi-VN")}</p>
            </div>
          </div>
        </div>
      )}

      {/* Payment Summary */}
      <div className="backdrop-blur-lg bg-white/70 border border-white/50 rounded-2xl p-6 shadow-xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50">
            <p className="text-sm text-gray-600 mb-1">Tổng tiền</p>
            <p className="text-2xl font-bold text-blue-600">{invoice.totalAmount.toLocaleString("vi-VN")} ₫</p>
          </div>
          <div className="p-4 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50">
            <p className="text-sm text-gray-600 mb-1">Đã thanh toán</p>
            <p className="text-2xl font-bold text-green-600">{invoice.paidAmount.toLocaleString("vi-VN")} ₫</p>
          </div>
          <div className={`p-4 rounded-xl bg-gradient-to-br ${balanceDue > 0 ? "from-red-50 to-rose-50" : "from-green-50 to-emerald-50"}`}>
            <p className="text-sm text-gray-600 mb-1">Còn lại</p>
            <p className={`text-2xl font-bold ${balanceDue > 0 ? "text-red-600" : "text-green-600"}`}>
              {balanceDue.toLocaleString("vi-VN")} ₫
            </p>
          </div>
        </div>
      </div>

      {/* Invoice Items */}
      <div className="backdrop-blur-lg bg-white/70 border border-white/50 rounded-2xl p-6 shadow-xl">
        <h3 className="text-section mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-600" />
          Chi tiết hóa đơn
        </h3>
        <div className="space-y-3">
          {invoice.items.map((item) => {
            const itemType = ITEM_TYPE_CONFIG[item.type];
            return (
              <div key={item.id} className="p-4 rounded-xl bg-gradient-to-r from-white/80 to-white/60 border border-white/50">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${itemType.class}`}>
                      {itemType.emoji} {itemType.label}
                    </span>
                    <span className="font-medium">{item.description}</span>
                  </div>
                  <span className="font-bold text-blue-600">{item.amount.toLocaleString("vi-VN")} ₫</span>
                </div>
                <div className="text-sm text-gray-600">
                  {item.quantity} × {item.unitPrice.toLocaleString("vi-VN")} ₫
                </div>
              </div>
            );
          })}
        </div>

        {/* Totals */}
        <div className="mt-6 pt-6 border-t border-gray-200 space-y-2">
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
          <div className="flex justify-between text-xl">
            <span className="font-bold text-gray-800">TỔNG CỘNG:</span>
            <span className="font-bold text-blue-600">{invoice.totalAmount.toLocaleString("vi-VN")} ₫</span>
          </div>
        </div>
      </div>

      {/* Payment History */}
      {invoice.payments.length > 0 && (
        <div className="backdrop-blur-lg bg-white/70 border border-white/50 rounded-2xl p-6 shadow-xl">
          <h3 className="text-section mb-4 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-green-600" />
            Lịch sử thanh toán
          </h3>
          <div className="space-y-3">
            {invoice.payments.map((payment) => {
              const method = PAYMENT_METHOD_CONFIG[payment.method];
              return (
                <div key={payment.id} className="p-4 rounded-xl bg-gradient-to-r from-green-50/80 to-emerald-50/80 border border-green-200">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-600">
                        {new Date(payment.paymentDate).toLocaleString("vi-VN")}
                      </span>
                    </div>
                    <span className="font-bold text-green-600">{payment.amount.toLocaleString("vi-VN")} ₫</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{method.emoji} {method.label}</span>
                    {payment.notes && (
                      <span className="text-xs text-gray-500">• {payment.notes}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <Link href="/patient/billing" className="btn-secondary">
          <ArrowLeft className="w-4 h-4" />
          Quay lại
        </Link>
        {canPay && (
          <button
            onClick={() => toast.info("Tính năng thanh toán online đang được phát triển")}
            className="btn-primary flex-1 bg-gradient-to-r from-green-500 to-emerald-600"
          >
            <CreditCard className="w-4 h-4" />
            Thanh toán ngay
          </button>
        )}
        {isPaid && (
          <button
            onClick={() => toast.info("Tính năng tải biên lai đang được phát triển")}
            className="btn-primary flex-1"
          >
            <Download className="w-4 h-4" />
            Tải biên lai
          </button>
        )}
      </div>
    </div>
  );
}

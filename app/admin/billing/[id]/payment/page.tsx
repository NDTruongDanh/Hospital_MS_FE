"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  DollarSign,
  CreditCard,
  Loader2,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";

interface Invoice {
  id: string;
  invoiceNumber: string;
  patient: {
    fullName: string;
  };
  totalAmount: number;
  paidAmount: number;
}

type PaymentMethod = "CASH" | "CREDIT_CARD" | "BANK_TRANSFER" | "INSURANCE";

const PAYMENT_METHODS: { value: PaymentMethod; label: string; emoji: string; gradient: string }[] = [
  { value: "CASH", label: "Tiền mặt", emoji: "💵", gradient: "from-green-400 to-emerald-500" },
  { value: "CREDIT_CARD", label: "Thẻ tín dụng", emoji: "💳", gradient: "from-blue-400 to-indigo-500" },
  { value: "BANK_TRANSFER", label: "Chuyển khoản", emoji: "🏦", gradient: "from-purple-400 to-pink-500" },
  { value: "INSURANCE", label: "Bảo hiểm", emoji: "🏥", gradient: "from-cyan-400 to-teal-500" },
];

export default function PaymentFormPage() {
  const params = useParams();
  const router = useRouter();
  const invoiceId = params.id as string;

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("CASH");
  const [notes, setNotes] = useState("");
  const [idempotencyKey] = useState(uuidv4());

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
      // Pre-fill with balance due
      const balance = data.data.totalAmount - data.data.paidAmount;
      setAmount(balance.toString());
    } catch (error) {
      console.error("Failed to fetch invoice:", error);
      toast.error("Không thể tải thông tin hóa đơn");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!invoice) return;

    const paymentAmount = parseFloat(amount);
    const balanceDue = invoice.totalAmount - invoice.paidAmount;

    // Validation
    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      toast.error("Số tiền phải lớn hơn 0");
      return;
    }

    if (paymentAmount > balanceDue) {
      toast.error(`Số tiền không được vượt quá số dư (${balanceDue.toLocaleString("vi-VN")} ₫)`);
      return;
    }

    try {
      setSubmitting(true);
      const response = await fetch("/api/billing/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoiceId,
          amount: paymentAmount,
          method,
          notes: notes.trim() || undefined,
          idempotencyKey,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to record payment");
      }

      toast.success("✅ Ghi nhận thanh toán thành công!");
      router.push(`/admin/billing/${invoiceId}`);
    } catch (error: any) {
      console.error("Payment error:", error);
      if (error.message.includes("DUPLICATE_PAYMENT")) {
        toast.error("Thanh toán đã được xử lý trước đó");
      } else if (error.message.includes("INVOICE_ALREADY_PAID")) {
        toast.error("Hóa đơn đã được thanh toán đầy đủ");
      } else if (error.message.includes("INVOICE_CANCELLED")) {
        toast.error("Không thể thanh toán hóa đơn đã hủy");
      } else {
        toast.error("Không thể ghi nhận thanh toán. Vui lòng thử lại.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const setFullPayment = () => {
    if (invoice) {
      const balance = invoice.totalAmount - invoice.paidAmount;
      setAmount(balance.toString());
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
        <AlertCircle className="w-16 h-16 mx-auto text-gray-300 mb-4" />
        <p className="text-gray-500">Không tìm thấy hóa đơn</p>
        <Link href="/admin/billing" className="btn-primary mt-4 inline-flex">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Quay lại
        </Link>
      </div>
    );
  }

  const balanceDue = invoice.totalAmount - invoice.paidAmount;

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-8">
      {/* Background */}
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-green-50 via-emerald-50/30 to-teal-50/40" />

      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/admin/billing/${invoiceId}`} className="btn-icon">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-display flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
            Ghi nhận thanh toán
          </h1>
          <p className="text-gray-600 mt-1">Hóa đơn #{invoice.invoiceNumber}</p>
        </div>
      </div>

      {/* Invoice Summary */}
      <div className="backdrop-blur-lg bg-white/70 border border-white/50 rounded-2xl p-6 shadow-xl">
        <h3 className="text-section mb-4 flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-blue-600" />
          Thông tin hóa đơn
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Số hóa đơn</p>
            <p className="font-semibold text-lg">#{invoice.invoiceNumber}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Bệnh nhân</p>
            <p className="font-semibold text-lg">{invoice.patient.fullName}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Tổng tiền</p>
            <p className="font-semibold text-lg">{invoice.totalAmount.toLocaleString("vi-VN")} ₫</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Đã thanh toán</p>
            <p className="font-semibold text-lg text-green-600">{invoice.paidAmount.toLocaleString("vi-VN")} ₫</p>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex justify-between items-center">
            <p className="text-lg font-semibold text-gray-800">Số dư cần thanh toán:</p>
            <p className="text-2xl font-bold text-red-600">{balanceDue.toLocaleString("vi-VN")} ₫</p>
          </div>
        </div>
      </div>

      {/* Payment Form */}
      <form onSubmit={handleSubmit} className="backdrop-blur-lg bg-white/70 border border-white/50 rounded-2xl p-6 shadow-xl space-y-6">
        <h3 className="text-section flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-green-600" />
          Chi tiết thanh toán
        </h3>

        {/* Amount */}
        <div className="space-y-2">
          <label className="text-label flex items-center justify-between">
            <span>Số tiền thanh toán *</span>
            <button
              type="button"
              onClick={setFullPayment}
              className="text-sm text-blue-600 hover:underline"
            >
              Thanh toán toàn bộ
            </button>
          </label>
          <div className="relative">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="input-base pr-12"
              placeholder="0"
              required
              min="1"
              max={balanceDue}
              step="1000"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">₫</span>
          </div>
          <p className="text-xs text-gray-500">Tối đa: {balanceDue.toLocaleString("vi-VN")} ₫</p>
        </div>

        {/* Payment Method */}
        <div className="space-y-3">
          <label className="text-label">Phương thức thanh toán *</label>
          <div className="grid grid-cols-2 gap-3">
            {PAYMENT_METHODS.map((pm) => (
              <button
                key={pm.value}
                type="button"
                onClick={() => setMethod(pm.value)}
                className={`p-4 rounded-xl border-2 transition-all ${
                  method === pm.value
                    ? `border-green-400 bg-gradient-to-br ${pm.gradient} text-white shadow-lg scale-105`
                    : "border-gray-200 bg-white/60 hover:bg-white/80"
                }`}
              >
                <div className="text-center">
                  <div className="text-3xl mb-2">{pm.emoji}</div>
                  <p className={`font-medium ${method === pm.value ? "text-white" : "text-gray-800"}`}>
                    {pm.label}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <label className="text-label">Ghi chú</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="input-base resize-none"
            rows={3}
            placeholder="Ghi chú về thanh toán (tùy chọn)..."
            maxLength={1000}
          />
          <p className="text-xs text-gray-500 text-right">{notes.length}/1000</p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t border-gray-200">
          <Link href={`/admin/billing/${invoiceId}`} className="btn-secondary flex-1">
            Hủy
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="btn-primary flex-1"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Đang xử lý...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                Ghi nhận thanh toán
              </>
            )}
          </button>
        </div>
      </form>

      {/* Info Box */}
      <div className="backdrop-blur-lg bg-blue-50/70 border border-blue-200 rounded-2xl p-4 shadow-lg">
        <div className="flex gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-semibold mb-1">Lưu ý:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Thanh toán sẽ được ghi nhận ngay lập tức</li>
              <li>Bạn có thể thanh toán một phần hoặc toàn bộ số dư</li>
              <li>Hóa đơn sẽ tự động cập nhật trạng thái sau khi thanh toán</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

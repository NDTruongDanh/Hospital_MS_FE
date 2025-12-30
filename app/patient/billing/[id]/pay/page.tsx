"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  ChevronLeft,
  CreditCard,
  Loader2,
  CheckCircle,
  FileText,
  DollarSign,
  Building2,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { v4 as uuidv4 } from "uuid";

interface InvoiceItem {
  type: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  patient: {
    id: string;
  };
  items: InvoiceItem[];
  subtotal: number;
  discount: number;
  tax: number;
  totalAmount: number;
  paidAmount: number;
}

type PaymentMethod = "CREDIT_CARD" | "BANK_TRANSFER" | "AT_COUNTER";

const PAYMENT_METHODS: { value: PaymentMethod; label: string; emoji: string; gradient: string; description: string }[] = [
  { 
    value: "CREDIT_CARD", 
    label: "Thẻ tín dụng", 
    emoji: "💳", 
    gradient: "from-blue-500 to-indigo-600",
    description: "Thanh toán trực tuyến ngay"
  },
  { 
    value: "BANK_TRANSFER", 
    label: "Chuyển khoản", 
    emoji: "🏦", 
    gradient: "from-purple-500 to-pink-600",
    description: "Chuyển khoản ngân hàng"
  },
  { 
    value: "AT_COUNTER", 
    label: "Tại quầy", 
    emoji: "🏥", 
    gradient: "from-cyan-500 to-teal-600",
    description: "Thanh toán tại bệnh viện"
  },
];

export default function PatientPaymentWizardPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const invoiceId = params.id as string;

  const [currentStep, setCurrentStep] = useState(1);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Payment data
  const [paymentType, setPaymentType] = useState<"full" | "partial">("full");
  const [partialAmount, setPartialAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CREDIT_CARD");
  const [idempotencyKey] = useState(uuidv4());

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
      
      // Check authorization
      if (data.data.patient.id !== user?.accountId) {
        toast.error("Bạn không có quyền thanh toán hóa đơn này");
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

  const handleSubmit = async () => {
    if (!invoice) return;

    const balanceDue = invoice.totalAmount - invoice.paidAmount;
    const amount = paymentType === "full" ? balanceDue : parseFloat(partialAmount);

    if (paymentType === "partial" && (isNaN(amount) || amount <= 0 || amount > balanceDue)) {
      toast.error("Số tiền không hợp lệ");
      return;
    }

    if (paymentMethod === "AT_COUNTER") {
      toast.info("Vui lòng đến quầy thu ngân để thanh toán");
      router.push(`/patient/billing/${invoiceId}`);
      return;
    }

    try {
      setSubmitting(true);
      // TODO: Integrate with payment gateway
      toast.info("Tính năng thanh toán online đang được phát triển");
      router.push(`/patient/billing/${invoiceId}`);
    } catch (error) {
      toast.error("Không thể xử lý thanh toán");
    } finally {
      setSubmitting(false);
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

  const balanceDue = invoice.totalAmount - invoice.paidAmount;
  const paymentAmount = paymentType === "full" ? balanceDue : parseFloat(partialAmount) || 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-8">
      {/* Background */}
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-purple-50 via-pink-50/30 to-blue-50/40" />

      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/patient/billing/${invoiceId}`} className="btn-icon">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-display flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 shadow-lg">
              <CreditCard className="w-6 h-6 text-white" />
            </div>
            Thanh toán hóa đơn
          </h1>
          <p className="text-gray-600 mt-1">Hóa đơn #{invoice.invoiceNumber}</p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="backdrop-blur-lg bg-white/70 border border-white/50 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center justify-between">
          {[
            { num: 1, label: "Xem lại hóa đơn", icon: FileText },
            { num: 2, label: "Chọn phương thức", icon: CreditCard },
          ].map((step, idx) => {
            const StepIcon = step.icon;
            const isActive = currentStep === step.num;
            const isCompleted = currentStep > step.num;
            
            return (
              <div key={step.num} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-lg ${
                    isCompleted 
                      ? "bg-gradient-to-br from-green-500 to-emerald-600 text-white" 
                      : isActive
                      ? "bg-gradient-to-br from-purple-500 to-pink-600 text-white scale-110"
                      : "bg-white/60 text-gray-400"
                  }`}>
                    {isCompleted ? <CheckCircle className="w-6 h-6" /> : <StepIcon className="w-6 h-6" />}
                  </div>
                  <p className={`text-sm font-medium mt-2 ${isActive ? "text-purple-600" : "text-gray-600"}`}>
                    {step.label}
                  </p>
                </div>
                {idx < 1 && (
                  <div className={`h-1 flex-1 mx-2 rounded-full transition-all ${
                    currentStep > step.num ? "bg-gradient-to-r from-green-500 to-emerald-600" : "bg-gray-200"
                  }`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Step Content */}
      <div className="backdrop-blur-lg bg-white/70 border border-white/50 rounded-2xl p-8 shadow-xl min-h-[400px]">
        {/* Step 1: Review Invoice */}
        {currentStep === 1 && (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">📋 Xem lại hóa đơn</h2>
              <p className="text-gray-600">Kiểm tra thông tin trước khi thanh toán</p>
            </div>

            {/* Invoice Items */}
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-800 mb-3">Chi tiết hóa đơn:</h3>
              {invoice.items.map((item, idx) => (
                <div key={idx} className="flex justify-between p-3 rounded-xl bg-gradient-to-r from-white/80 to-white/60">
                  <div>
                    <p className="font-medium">{item.description}</p>
                    <p className="text-sm text-gray-600">{item.quantity} × {item.unitPrice.toLocaleString("vi-VN")} ₫</p>
                  </div>
                  <p className="font-semibold text-blue-600">{item.amount.toLocaleString("vi-VN")} ₫</p>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="space-y-2 pt-4 border-t border-gray-200">
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
              {invoice.paidAmount > 0 && (
                <>
                  <div className="flex justify-between text-green-600">
                    <span>Đã thanh toán:</span>
                    <span className="font-semibold">{invoice.paidAmount.toLocaleString("vi-VN")} ₫</span>
                  </div>
                  <div className="h-px bg-gray-300" />
                </>
              )}
              <div className="flex justify-between text-2xl">
                <span className="font-bold text-gray-800">Số tiền cần thanh toán:</span>
                <span className="font-bold text-red-600">{balanceDue.toLocaleString("vi-VN")} ₫</span>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Payment Method */}
        {currentStep === 2 && (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">💳 Chọn phương thức thanh toán</h2>
              <p className="text-gray-600">Số tiền cần thanh toán: <span className="font-bold text-red-600">{balanceDue.toLocaleString("vi-VN")} ₫</span></p>
            </div>

            {/* Payment Amount */}
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-800">Số tiền thanh toán:</h3>
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setPaymentType("full")}
                  className={`w-full p-4 rounded-xl border-2 transition-all ${
                    paymentType === "full"
                      ? "border-purple-400 bg-gradient-to-r from-purple-100 to-pink-100"
                      : "border-gray-200 bg-white/60 hover:bg-white/80"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Thanh toán toàn bộ</span>
                    <span className="font-bold text-purple-600">{balanceDue.toLocaleString("vi-VN")} ₫</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentType("partial")}
                  className={`w-full p-4 rounded-xl border-2 transition-all ${
                    paymentType === "partial"
                      ? "border-purple-400 bg-gradient-to-r from-purple-100 to-pink-100"
                      : "border-gray-200 bg-white/60 hover:bg-white/80"
                  }`}
                >
                  <div className="space-y-2">
                    <span className="font-medium">Thanh toán một phần</span>
                    {paymentType === "partial" && (
                      <input
                        type="number"
                        value={partialAmount}
                        onChange={(e) => setPartialAmount(e.target.value)}
                        className="input-base w-full"
                        placeholder="Nhập số tiền"
                        min="1"
                        max={balanceDue}
                        onClick={(e) => e.stopPropagation()}
                      />
                    )}
                  </div>
                </button>
              </div>
            </div>

            {/* Payment Methods */}
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-800">Phương thức thanh toán:</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {PAYMENT_METHODS.map((method) => (
                  <button
                    key={method.value}
                    type="button"
                    onClick={() => setPaymentMethod(method.value)}
                    className={`p-6 rounded-xl border-2 transition-all ${
                      paymentMethod === method.value
                        ? `border-purple-400 bg-gradient-to-br ${method.gradient} text-white shadow-lg scale-105`
                        : "border-gray-200 bg-white/60 hover:bg-white/80"
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-4xl mb-3">{method.emoji}</div>
                      <p className={`font-semibold mb-1 ${paymentMethod === method.value ? "text-white" : "text-gray-800"}`}>
                        {method.label}
                      </p>
                      <p className={`text-xs ${paymentMethod === method.value ? "text-white/80" : "text-gray-500"}`}>
                        {method.description}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Counter Instructions */}
            {paymentMethod === "AT_COUNTER" && (
              <div className="backdrop-blur-lg bg-blue-50/70 border border-blue-200 rounded-2xl p-6 shadow-lg">
                <div className="flex gap-3">
                  <Building2 className="w-6 h-6 text-blue-600 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-blue-900 mb-2">Hướng dẫn thanh toán tại quầy:</p>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• Đến quầy thu ngân tại bệnh viện</li>
                      <li>• Cung cấp mã hóa đơn: <span className="font-mono font-bold">#{invoice.invoiceNumber}</span></li>
                      <li>• Giờ làm việc: 7:00 - 17:00 (Thứ 2 - Thứ 7)</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex gap-3">
        {currentStep > 1 && (
          <button
            onClick={() => setCurrentStep(currentStep - 1)}
            className="btn-secondary"
          >
            <ChevronLeft className="w-4 h-4" />
            Quay lại
          </button>
        )}
        
        <div className="flex-1" />
        
        <Link href={`/patient/billing/${invoiceId}`} className="btn-secondary">
          Hủy
        </Link>

        {currentStep < 2 ? (
          <button
            onClick={() => setCurrentStep(2)}
            className="btn-primary bg-gradient-to-r from-purple-500 to-pink-600"
          >
            Tiếp theo
            <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={submitting || (paymentType === "partial" && !partialAmount)}
            className="btn-primary bg-gradient-to-r from-green-500 to-emerald-600"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Đang xử lý...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                Thanh toán ngay
              </>
            )}
          </button>
        )}
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}

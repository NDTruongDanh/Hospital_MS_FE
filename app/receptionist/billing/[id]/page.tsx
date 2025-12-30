"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Receipt,
  User,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  CreditCard,
  Loader2,
  History,
  FileText,
  Banknote,
  Building2,
  Stethoscope,
  Pill,
  TestTube,
  AlertCircle,
  DollarSign,
  Globe,
  Phone,
  Mail,
} from "lucide-react";
import { toast } from "sonner";
import {
  getInvoiceById,
  getPaymentsByInvoice,
  createCashPayment,
  initPayment,
  cancelInvoice,
} from "@/services/billing.service";
import { authService } from "@/services/auth.service";
import {
  Invoice,
  InvoiceItem,
  Payment,
  PaymentsByInvoiceResponse,
  PatientInfo,
  AppointmentInfo,
  MedicalExamInfo,
  CancellationInfo,
  InvoiceStatus,
  PaymentStatus,
  PaymentGateway,
} from "@/interfaces/billing";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Status configs
const INVOICE_STATUS_CONFIG: Record<InvoiceStatus, { label: string; class: string; icon: typeof Clock }> = {
  UNPAID: { label: "Chờ thanh toán", class: "badge-warning", icon: Clock },
  PAID: { label: "Đã thanh toán", class: "badge-success", icon: CheckCircle },
  PARTIALLY_PAID: { label: "Thanh toán một phần", class: "badge-info", icon: Clock },
  OVERDUE: { label: "Quá hạn", class: "badge-danger", icon: AlertCircle },
  CANCELLED: { label: "Đã hủy", class: "badge-danger", icon: XCircle },
};

const PAYMENT_STATUS_CONFIG: Record<PaymentStatus, { label: string; class: string }> = {
  PENDING: { label: "Đang chờ", class: "text-amber-600" },
  PROCESSING: { label: "Đang xử lý", class: "text-blue-600" },
  COMPLETED: { label: "Hoàn thành", class: "text-green-600" },
  FAILED: { label: "Thất bại", class: "text-red-600" },
  CANCELLED: { label: "Đã hủy", class: "text-gray-500" },
  EXPIRED: { label: "Hết hạn", class: "text-gray-500" },
  REFUNDED: { label: "Hoàn tiền", class: "text-purple-600" },
};

const GATEWAY_CONFIG: Record<PaymentGateway, { label: string; icon: typeof Banknote }> = {
  CASH: { label: "Tiền mặt", icon: Banknote },
  VNPAY: { label: "VNPay", icon: CreditCard },
  MOMO: { label: "MoMo", icon: Phone },
  BANK_TRANSFER: { label: "Chuyển khoản", icon: Building2 },
};

const ITEM_TYPE_CONFIG: Record<string, { label: string; icon: typeof Stethoscope; color: string }> = {
  CONSULTATION: { label: "Khám bệnh", icon: Stethoscope, color: "text-blue-600 bg-blue-50" },
  MEDICINE: { label: "Thuốc", icon: Pill, color: "text-green-600 bg-green-50" },
  TEST: { label: "Xét nghiệm", icon: TestTube, color: "text-purple-600 bg-purple-50" },
  PROCEDURE: { label: "Thủ thuật", icon: Stethoscope, color: "text-orange-600 bg-orange-50" },
  OTHER: { label: "Khác", icon: FileText, color: "text-gray-600 bg-gray-50" },
};

export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const invoiceId = params.id as string;

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [paymentData, setPaymentData] = useState<PaymentsByInvoiceResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  // Payment form states
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentNotes, setPaymentNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "VNPAY">("CASH");

  // Cancel modal
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  
  // Canceller info
  const [cancellerEmail, setCancellerEmail] = useState<string | null>(null);

  useEffect(() => {
    if (invoiceId) {
      fetchInvoiceDetails();
    }
  }, [invoiceId]);

  const fetchInvoiceDetails = async () => {
    try {
      setLoading(true);
      const [invoiceRes, paymentsRes] = await Promise.all([
        getInvoiceById(invoiceId),
        getPaymentsByInvoice(invoiceId).catch(() => null),
      ]);
      const invoiceData = invoiceRes.data.data;
      setInvoice(invoiceData);
      if (paymentsRes) {
        setPaymentData(paymentsRes.data.data);
      }
      
      // Fetch canceller email if cancelled
      if (invoiceData.cancellation?.cancelledBy) {
        try {
          const canceller = await authService.getAccount(invoiceData.cancellation.cancelledBy);
          setCancellerEmail(canceller.email);
        } catch {
          setCancellerEmail(null);
        }
      }
    } catch (error) {
      console.error("Failed to fetch invoice:", error);
      toast.error("Không thể tải thông tin hóa đơn");
    } finally {
      setLoading(false);
    }
  };

  const handleCashPayment = async () => {
    if (!invoice) return;
    const amount = paymentAmount ? parseFloat(paymentAmount) : undefined;
    
    if (amount && amount <= 0) {
      toast.error("Số tiền không hợp lệ");
      return;
    }

    const balance = invoice.balanceDue || (invoice.totalAmount - (invoice.paidAmount || 0));
    if (amount && amount > balance) {
      toast.error(`Số tiền không được vượt quá ${formatCurrency(balance)}`);
      return;
    }

    try {
      setProcessing(true);
      await createCashPayment(invoice.id, amount, paymentNotes || undefined);
      toast.success("Thanh toán thành công!");
      setShowPaymentModal(false);
      setPaymentAmount("");
      setPaymentNotes("");
      fetchInvoiceDetails();
    } catch (error) {
      toast.error("Không thể xử lý thanh toán");
    } finally {
      setProcessing(false);
    }
  };

  const handleVNPayPayment = async () => {
    if (!invoice) return;
    const amount = paymentAmount ? parseFloat(paymentAmount) : undefined;

    try {
      setProcessing(true);
      const response = await initPayment({
        invoiceId: invoice.id,
        amount: amount,
        orderInfo: paymentNotes || `Thanh toan hoa don ${invoice.invoiceNumber}`,
        language: "vn",
      });
      
      // Redirect to VNPay
      const paymentUrl = response.data.data.paymentUrl;
      window.open(paymentUrl, "_blank");
      toast.success("Đã mở trang thanh toán VNPay");
      setShowPaymentModal(false);
    } catch (error) {
      toast.error("Không thể khởi tạo thanh toán VNPay");
    } finally {
      setProcessing(false);
    }
  };

  const handleCancelInvoice = async () => {
    if (!invoice || !cancelReason.trim()) {
      toast.error("Vui lòng nhập lý do hủy");
      return;
    }

    try {
      setProcessing(true);
      await cancelInvoice(invoice.id, { cancelReason });
      toast.success("Đã hủy hóa đơn");
      setShowCancelModal(false);
      fetchInvoiceDetails();
    } catch (error) {
      toast.error("Không thể hủy hóa đơn");
    } finally {
      setProcessing(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(value);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
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
        <Receipt className="w-16 h-16 mx-auto text-gray-300 mb-4" />
        <p className="text-gray-500">Không tìm thấy hóa đơn</p>
        <Link href="/receptionist/billing" className="btn-primary mt-4 inline-flex">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Quay lại
        </Link>
      </div>
    );
  }

  const statusConfig = INVOICE_STATUS_CONFIG[invoice.status] || INVOICE_STATUS_CONFIG.UNPAID;
  const StatusIcon = statusConfig.icon;
  const balance = invoice.balanceDue || (invoice.totalAmount - (invoice.paidAmount || 0));
  const canPay = invoice.status === "UNPAID" || invoice.status === "PARTIALLY_PAID";
  const canCancel = invoice.status === "UNPAID";

  return (
    <div className="space-y-6 pb-8">
      {/* Background gradient */}
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-blue-50 via-indigo-50/30 to-purple-50/40" />
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/receptionist/billing" className="btn-icon">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-page flex items-center gap-2">
              <Receipt className="w-6 h-6" />
              {invoice.invoiceNumber || `Hóa đơn #${invoice.id.slice(0, 8)}`}
            </h1>
            <p className="text-sm text-gray-500">
              Tạo lúc: {formatDate(invoice.createdAt || invoice.invoiceDate)}
              {invoice.updatedAt && invoice.updatedAt !== invoice.createdAt && (
                <> • Cập nhật: {formatDate(invoice.updatedAt)}</>
              )}
            </p>
          </div>
        </div>
        <span className={`badge ${statusConfig.class} text-lg px-4 py-2`}>
          <StatusIcon className="w-4 h-4 mr-1" />
          {statusConfig.label}
        </span>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Invoice Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Patient & Appointment Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Patient Info */}
            <Link 
              href={invoice.patient?.id ? `/receptionist/patients/${invoice.patient.id}` : "#"}
              className="backdrop-blur-sm bg-white/60 border border-blue-200/50 rounded-2xl p-5 shadow-lg shadow-blue-100/50 hover:shadow-xl hover:shadow-blue-100/60 hover:border-blue-300 transition-all duration-300 block group"
            >
              <div className="flex items-center justify-between text-blue-600 mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                    <User className="w-4 h-4" />
                  </div>
                  <span className="font-semibold">Thông tin bệnh nhân</span>
                </div>
                {invoice.patient?.id && (
                  <span className="text-xs text-blue-500 group-hover:underline">Xem chi tiết →</span>
                )}
              </div>
              <div className="space-y-2 text-sm">
                <p className="font-bold text-lg text-gray-900">
                  {invoice.patient?.fullName || invoice.patientName || "N/A"}
                </p>
              </div>
            </Link>

            {/* Appointment Info */}
            <Link 
              href={invoice.appointment?.id ? `/receptionist/appointments/${invoice.appointment.id}` : (invoice.appointmentId ? `/receptionist/appointments/${invoice.appointmentId}` : "#")}
              className="backdrop-blur-sm bg-white/60 border border-green-200/50 rounded-2xl p-5 shadow-lg shadow-green-100/50 hover:shadow-xl hover:shadow-green-100/60 hover:border-green-300 transition-all duration-300 block group"
            >
              <div className="flex items-center justify-between text-green-600 mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 text-white">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <span className="font-semibold">Thông tin lịch hẹn</span>
                </div>
                {(invoice.appointment?.id || invoice.appointmentId) && (
                  <span className="text-xs text-green-500 group-hover:underline">Xem chi tiết →</span>
                )}
              </div>
              <div className="space-y-2 text-sm">
                {invoice.appointment ? (
                  <>
                    {invoice.appointment.appointmentTime && (
                      <p className="text-gray-700 flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-green-500" />
                        <span className="font-medium">{formatDate(invoice.appointment.appointmentTime)}</span>
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-gray-500">
                    {invoice.appointmentId ? "Có liên kết lịch hẹn" : "Không có thông tin"}
                  </p>
                )}
              </div>
            </Link>
          </div>

          {/* Invoice Items */}
          <div className="backdrop-blur-sm bg-white/70 border border-gray-200/50 rounded-2xl p-5 shadow-lg">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 rounded-xl bg-gradient-to-br from-gray-600 to-gray-700 text-white">
                <FileText className="w-4 h-4" />
              </div>
              <h2 className="font-semibold text-lg">Chi tiết dịch vụ ({invoice.items?.length || 0})</h2>
            </div>
            
            {invoice.items && invoice.items.length > 0 ? (
              <div className="divide-y border rounded-xl overflow-hidden">
                {invoice.items.map((item, i) => {
                  const typeConfig = ITEM_TYPE_CONFIG[item.type] || ITEM_TYPE_CONFIG.OTHER;
                  const TypeIcon = typeConfig.icon;
                  return (
                    <div key={item.id || i} className="flex items-center justify-between p-4 hover:bg-gray-50">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${typeConfig.color}`}>
                          <TypeIcon className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-medium">{item.description}</p>
                          <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                            <span className="badge badge-ghost text-xs">{typeConfig.label}</span>
                            <span>{item.quantity} x {formatCurrency(item.unitPrice)}</span>
                            {item.referenceId && (
                              <span className="text-xs">Ref: {item.referenceId.slice(0, 8)}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <span className="font-semibold text-lg">
                        {formatCurrency(item.amount || item.quantity * item.unitPrice)}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-center py-8 text-gray-500">Chưa có dịch vụ nào</p>
            )}
          </div>

          {/* Payment History */}
          <div className="backdrop-blur-sm bg-white/70 border border-gray-200/50 rounded-2xl p-5 shadow-lg">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 text-white">
                <History className="w-4 h-4" />
              </div>
              <h2 className="font-semibold text-lg">Lịch sử thanh toán</h2>
            </div>

            {paymentData && paymentData.payments.length > 0 ? (
              <div className="divide-y border rounded-xl overflow-hidden">
                {paymentData.payments.map((payment) => {
                  const gatewayConfig = GATEWAY_CONFIG[payment.gateway] || GATEWAY_CONFIG.CASH;
                  const GatewayIcon = gatewayConfig.icon;
                  const statusClass = PAYMENT_STATUS_CONFIG[payment.status]?.class || "text-gray-600";
                  const statusLabel = PAYMENT_STATUS_CONFIG[payment.status]?.label || payment.status;

                  return (
                    <div key={payment.id} className="p-4 hover:bg-gray-50">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-lg bg-gray-100">
                            <GatewayIcon className="w-4 h-4 text-gray-600" />
                          </div>
                          <div>
                            <p className="font-medium flex items-center gap-2">
                              {gatewayConfig.label}
                              <span className={`text-sm ${statusClass}`}>• {statusLabel}</span>
                            </p>
                            <p className="text-sm text-gray-500 mt-1">
                              {payment.createdAt ? formatDate(payment.createdAt) : "N/A"}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              TXN: {payment.txnRef}
                            </p>
                            {payment.notes && (
                              <p className="text-sm text-gray-600 mt-1 italic">"{payment.notes}"</p>
                            )}
                            {/* VNPay details */}
                            {payment.gateway === "VNPAY" && (
                              <div className="mt-2 text-xs text-gray-500 space-y-1">
                                {payment.vnpBankCode && <p>Ngân hàng: {payment.vnpBankCode}</p>}
                                {payment.vnpCardType && <p>Loại thẻ: {payment.vnpCardType}</p>}
                                {payment.vnpTransactionNo && <p>Mã GD VNPay: {payment.vnpTransactionNo}</p>}
                                {payment.vnpResponseCode && <p>Response: {payment.vnpResponseCode}</p>}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg text-green-600">
                            {formatCurrency(payment.amount)}
                          </p>
                          {payment.expireAt && payment.status === "PENDING" && (
                            <p className="text-xs text-amber-600 mt-1">
                              Hết hạn: {formatDate(payment.expireAt)}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-center py-8 text-gray-500">Chưa có giao dịch thanh toán</p>
            )}

            {/* Payment Summary from API */}
            {paymentData && (
              <div className="mt-4 bg-gray-50 rounded-xl p-4 grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-sm text-gray-500">Tổng hóa đơn</p>
                  <p className="font-bold text-lg">{formatCurrency(paymentData.invoiceTotal)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Đã thanh toán</p>
                  <p className="font-bold text-lg text-green-600">{formatCurrency(paymentData.totalPaid)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Còn lại</p>
                  <p className="font-bold text-lg text-amber-600">{formatCurrency(paymentData.remainingBalance)}</p>
                </div>
              </div>
            )}
          </div>

          {/* Cancellation Info */}
          {invoice.cancellation && (
            <div className="backdrop-blur-sm bg-red-50/80 border border-red-200/60 rounded-2xl p-5 shadow-lg">
              <div className="flex items-center gap-2 text-red-600 mb-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 text-white">
                  <XCircle className="w-4 h-4" />
                </div>
                <span className="font-semibold">Thông tin hủy</span>
              </div>
              <div className="space-y-2 text-sm">
                <p><span className="font-medium">Lý do:</span> {invoice.cancellation.reason}</p>
                <p><span className="font-medium">Thời gian:</span> {formatDate(invoice.cancellation.cancelledAt)}</p>
                <p><span className="font-medium">Người hủy:</span> {cancellerEmail || invoice.cancellation.cancelledBy}</p>
              </div>
            </div>
          )}

          {/* Notes */}
          {invoice.notes && (
            <div className="backdrop-blur-sm bg-white/70 border border-gray-200/50 rounded-2xl p-5 shadow-lg">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 rounded-xl bg-gradient-to-br from-gray-500 to-gray-600 text-white">
                  <FileText className="w-4 h-4" />
                </div>
                <span className="font-semibold">Ghi chú</span>
              </div>
              <p className="text-gray-700 italic">{invoice.notes}</p>
            </div>
          )}
        </div>

        {/* Right Column - Summary & Actions */}
        <div className="space-y-6">
          {/* Amount Summary */}
          <div className="backdrop-blur-sm bg-gradient-to-br from-indigo-50/80 via-white/90 to-purple-50/60 border border-indigo-200/50 rounded-2xl p-5 shadow-xl shadow-indigo-100/50">
            <div className="flex items-center gap-2 text-indigo-600 mb-4">
              <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
                <DollarSign className="w-4 h-4" />
              </div>
              <span className="font-semibold">Tổng kết</span>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Tạm tính</span>
                <span>{formatCurrency(invoice.subtotal || invoice.totalAmount)}</span>
              </div>
              {invoice.discount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Giảm giá</span>
                  <span>-{formatCurrency(invoice.discount)}</span>
                </div>
              )}
              {invoice.tax > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Thuế</span>
                  <span>{formatCurrency(invoice.tax)}</span>
                </div>
              )}
              <div className="flex justify-between pt-3 border-t font-bold text-xl">
                <span>Tổng cộng</span>
                <span className="text-[hsl(var(--primary))]">{formatCurrency(invoice.totalAmount)}</span>
              </div>
              <div className="flex justify-between text-sm text-blue-600">
                <span>Đã thanh toán</span>
                <span>{formatCurrency(invoice.paidAmount || 0)}</span>
              </div>
              {balance > 0 && (
                <div className="flex justify-between text-sm font-bold text-amber-600">
                  <span>Còn nợ</span>
                  <span>{formatCurrency(balance)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Due Date */}
          {invoice.dueDate && (
            <div className="backdrop-blur-sm bg-white/70 border border-amber-200/50 rounded-2xl p-5 shadow-lg">
              <div className="flex items-center gap-2 text-amber-600 mb-2">
                <div className="p-2 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white">
                  <Clock className="w-4 h-4" />
                </div>
                <span className="font-semibold">Hạn thanh toán</span>
              </div>
              <p className="text-lg font-medium">{formatDate(invoice.dueDate)}</p>
            </div>
          )}

          {/* Actions */}
          <div className="backdrop-blur-sm bg-white/80 border border-gray-200/50 rounded-2xl p-5 shadow-lg space-y-3">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <div className="w-1.5 h-5 rounded-full bg-gradient-to-b from-blue-500 to-indigo-600" />
              Thao tác
            </h3>
            
            {canPay && (
              <button
                onClick={() => setShowPaymentModal(true)}
                className="btn-primary w-full"
              >
                <CreditCard className="w-4 h-4 mr-2" />
                Thanh toán
              </button>
            )}

            {canCancel && (
              <button
                onClick={() => setShowCancelModal(true)}
                className="btn-secondary w-full text-red-600 border-red-300 hover:bg-red-50"
              >
                <XCircle className="w-4 h-4 mr-2" />
                Hủy hóa đơn
              </button>
            )}

            <Link href="/receptionist/billing" className="btn-secondary w-full flex justify-center">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Quay lại danh sách
            </Link>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Thanh toán hóa đơn
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <p className="text-sm text-gray-600">Số tiền cần thanh toán</p>
              <p className="text-2xl font-bold text-[hsl(var(--primary))]">{formatCurrency(balance)}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Phương thức</label>
              <select
                className="dropdown w-full mt-1"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as "CASH" | "VNPAY")}
              >
                <option value="CASH">💵 Tiền mặt</option>
                <option value="VNPAY">💳 VNPay (Online)</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">
                Số tiền thanh toán (để trống = toàn bộ)
              </label>
              <input
                type="number"
                className="input-base mt-1"
                placeholder={`Tối đa ${formatCurrency(balance)}`}
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                max={balance}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Ghi chú</label>
              <input
                type="text"
                className="input-base mt-1"
                placeholder="VD: Đợt 1, Thanh toán đầu..."
                value={paymentNotes}
                onChange={(e) => setPaymentNotes(e.target.value)}
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={paymentMethod === "CASH" ? handleCashPayment : handleVNPayPayment}
                disabled={processing}
                className="btn-primary flex-1"
              >
                {processing && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                {paymentMethod === "CASH" ? "Xác nhận thu tiền" : "Thanh toán VNPay"}
              </button>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="btn-secondary"
              >
                Hủy
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Cancel Modal */}
      <Dialog open={showCancelModal} onOpenChange={setShowCancelModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <XCircle className="w-5 h-5" />
              Hủy hóa đơn
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-gray-600">
              Bạn có chắc muốn hủy hóa đơn <strong>{invoice.invoiceNumber}</strong>?
            </p>

            <div>
              <label className="text-sm font-medium text-gray-700">Lý do hủy *</label>
              <textarea
                className="input-base mt-1 min-h-[100px]"
                placeholder="Nhập lý do hủy hóa đơn..."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleCancelInvoice}
                disabled={processing || !cancelReason.trim()}
                className="btn-primary bg-red-600 hover:bg-red-700 flex-1"
              >
                {processing && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                Xác nhận hủy
              </button>
              <button
                onClick={() => setShowCancelModal(false)}
                className="btn-secondary"
              >
                Quay lại
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { 
  Search,
  Receipt,
  Clock,
  CheckCircle,
  CreditCard,
  Eye,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { getMyInvoices, initPayment } from "@/services/billing.service";
import { Invoice } from "@/interfaces/billing";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const STATUS_CONFIG = {
  UNPAID: { label: "Chờ thanh toán", class: "badge-warning", icon: Clock },
  PAID: { label: "Đã thanh toán", class: "badge-success", icon: CheckCircle },
  PARTIALLY_PAID: { label: "Thanh toán một phần", class: "badge-info", icon: Clock },
  OVERDUE: { label: "Quá hạn", class: "badge-danger", icon: Clock },
  CANCELLED: { label: "Đã hủy", class: "badge-danger", icon: Clock },
};

export default function PatientInvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    fetchInvoices();
  }, [statusFilter]);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const response = await getMyInvoices(statusFilter || undefined);
      setInvoices(response.data.data || []);
    } catch (error) {
      console.error("Failed to fetch invoices:", error);
      toast.error("Không thể tải danh sách hóa đơn");
    } finally {
      setLoading(false);
    }
  };

  const handleOnlinePayment = async (invoice: Invoice) => {
    try {
      setPaying(true);
      const response = await initPayment({
        invoiceId: invoice.id,
        amount: invoice.totalAmount,
        returnUrl: window.location.origin + "/patient/invoices/callback",
      });
      
      // Redirect to payment gateway
      if (response.data?.data?.paymentUrl) {
        window.location.href = response.data.data.paymentUrl;
      } else {
        toast.error("Không thể khởi tạo thanh toán");
      }
    } catch (error) {
      toast.error("Không thể thanh toán online");
    } finally {
      setPaying(false);
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
    });
  };

  const pendingInvoices = invoices.filter(i => i.status === "UNPAID" || i.status === "OVERDUE");
  const totalPending = pendingInvoices.reduce((sum, i) => sum + i.balanceDue, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-display">Hóa đơn của tôi</h1>
        <p className="text-[hsl(var(--muted-foreground))] mt-1">
          Quản lý và thanh toán hóa đơn
        </p>
      </div>

      {/* Summary */}
      {pendingInvoices.length > 0 && (
        <div className="card-base bg-gradient-to-r from-[hsl(var(--warning))]/10 to-[hsl(var(--background))] border-l-4 border-l-[hsl(var(--warning))]">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <p className="text-label">Hóa đơn chờ thanh toán</p>
              <p className="text-2xl font-bold mt-1">{formatCurrency(totalPending)}</p>
              <p className="text-small mt-1">{pendingInvoices.length} hóa đơn</p>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="card-base">
        <div className="flex gap-2">
          {[
            { value: "", label: "Tất cả" },
            { value: "UNPAID", label: "Chờ thanh toán" },
            { value: "PAID", label: "Đã thanh toán" },
          ].map((f) => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === f.value
                  ? "bg-[hsl(var(--primary))] text-white"
                  : "bg-[hsl(var(--secondary))] hover:bg-[hsl(var(--secondary))]/80"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Invoices List */}
      <div className="space-y-4">
        {loading ? (
          <div className="card-base text-center py-12">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-[hsl(var(--primary))]" />
            <p className="text-small mt-2">Đang tải...</p>
          </div>
        ) : invoices.length === 0 ? (
          <div className="card-base text-center py-12">
            <Receipt className="w-12 h-12 mx-auto text-[hsl(var(--muted-foreground))] opacity-50" />
            <p className="text-[hsl(var(--muted-foreground))] mt-2">
              Không có hóa đơn nào
            </p>
          </div>
        ) : (
          invoices.map((invoice) => {
            const status = STATUS_CONFIG[invoice.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.UNPAID;
            const StatusIcon = status.icon;
            
            return (
              <div key={invoice.id} className="card-base">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      invoice.status === "UNPAID" || invoice.status === "OVERDUE" 
                        ? "bg-[hsl(var(--warning))]/10 text-[hsl(var(--warning))]" 
                        : "bg-green-100 text-green-600"
                    }`}>
                      <Receipt className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="font-semibold">Hóa đơn #{invoice.id.slice(0, 8)}</p>
                      <p className="text-small mt-1">{formatDate(invoice.createdAt || invoice.invoiceDate)}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className={`badge ${status.class}`}>
                      <StatusIcon className="w-3 h-3" />
                      {status.label}
                    </span>
                    <p className="text-xl font-bold text-[hsl(var(--primary))]">
                      {formatCurrency(invoice.totalAmount)}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setSelectedInvoice(invoice)}
                      className="btn-secondary text-sm py-2"
                    >
                      <Eye className="w-4 h-4" />
                      Chi tiết
                    </button>
                    {(invoice.status === "UNPAID" || invoice.status === "OVERDUE") && (
                      <button
                        onClick={() => handleOnlinePayment(invoice)}
                        disabled={paying}
                        className="btn-primary text-sm py-2"
                      >
                        {paying && <Loader2 className="w-4 h-4 animate-spin" />}
                        <CreditCard className="w-4 h-4" />
                        Thanh toán
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Invoice Detail Modal */}
      <Dialog open={!!selectedInvoice} onOpenChange={() => setSelectedInvoice(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Chi tiết hóa đơn</DialogTitle>
          </DialogHeader>
          {selectedInvoice && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-[hsl(var(--secondary))]">
                <p className="font-semibold text-lg">#{selectedInvoice.id.slice(0, 8)}</p>
                <p className="text-small">{formatDate(selectedInvoice.createdAt || selectedInvoice.invoiceDate || new Date().toISOString())}</p>
              </div>

              {selectedInvoice.items && selectedInvoice.items.length > 0 && (
                <div className="space-y-2">
                  <p className="text-label">Chi tiết dịch vụ</p>
                  {selectedInvoice.items.map((item, i) => (
                    <div key={i} className="flex justify-between text-sm p-3 bg-white border-2 border-gray-200 rounded-xl shadow-sm">
                      <span>{item.description} x{item.quantity}</span>
                      <span className="font-medium">{formatCurrency(item.amount || (item.unitPrice * item.quantity))}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-between items-center pt-4 border-t border-[hsl(var(--border))]">
                <span className="font-semibold">Tổng cộng</span>
                <span className="text-2xl font-bold text-[hsl(var(--primary))]">
                  {formatCurrency(selectedInvoice.totalAmount)}
                </span>
              </div>

              {(selectedInvoice.status === "UNPAID" || selectedInvoice.status === "OVERDUE") && (
                <button
                  onClick={() => {
                    handleOnlinePayment(selectedInvoice);
                    setSelectedInvoice(null);
                  }}
                  disabled={paying}
                  className="btn-primary w-full"
                >
                  <CreditCard className="w-4 h-4" />
                  Thanh toán online
                </button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

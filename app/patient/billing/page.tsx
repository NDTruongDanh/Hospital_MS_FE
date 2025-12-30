"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  FileText,
  Calendar,
  DollarSign,
  CheckCircle,
  XCircle,
  AlertTriangle,
  CreditCard,
  Loader2,
  Filter,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

interface Invoice {
  id: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  status: "UNPAID" | "PARTIALLY_PAID" | "PAID" | "OVERDUE" | "CANCELLED";
  totalAmount: number;
  paidAmount: number;
  items: Array<{ description: string }>;
}

const STATUS_CONFIG = {
  UNPAID: { label: "Chưa thanh toán", class: "badge-danger", icon: XCircle, gradient: "from-red-400 to-rose-500" },
  PARTIALLY_PAID: { label: "Thanh toán 1 phần", class: "badge-warning", icon: AlertTriangle, gradient: "from-yellow-400 to-amber-500" },
  PAID: { label: "Đã thanh toán", class: "badge-success", icon: CheckCircle, gradient: "from-green-400 to-emerald-500" },
  OVERDUE: { label: "Quá hạn", class: "badge-danger", icon: AlertTriangle, gradient: "from-orange-400 to-red-500" },
  CANCELLED: { label: "Đã hủy", class: "badge-secondary", icon: XCircle, gradient: "from-gray-400 to-slate-500" },
};

export default function PatientInvoiceListPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<"all" | "unpaid" | "paid">("all");

  useEffect(() => {
    if (user?.accountId) {
      fetchInvoices();
    }
  }, [user]);

  useEffect(() => {
    applyFilter();
  }, [invoices, statusFilter]);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/billing/invoices/by-patient/${user?.accountId}`);
      const data = await response.json();
      // Sort: unpaid first, then by date desc
      const sorted = (data.data || []).sort((a: Invoice, b: Invoice) => {
        if (a.status === "UNPAID" && b.status !== "UNPAID") return -1;
        if (a.status !== "UNPAID" && b.status === "UNPAID") return 1;
        if (a.status === "PARTIALLY_PAID" && b.status !== "PARTIALLY_PAID" && b.status !== "UNPAID") return -1;
        if (a.status !== "PARTIALLY_PAID" && b.status === "PARTIALLY_PAID") return 1;
        return new Date(b.invoiceDate).getTime() - new Date(a.invoiceDate).getTime();
      });
      setInvoices(sorted);
    } catch (error) {
      console.error("Failed to fetch invoices:", error);
      toast.error("Không thể tải danh sách hóa đơn");
    } finally {
      setLoading(false);
    }
  };

  const applyFilter = () => {
    let filtered = [...invoices];
    if (statusFilter === "unpaid") {
      filtered = filtered.filter(inv => inv.status === "UNPAID" || inv.status === "PARTIALLY_PAID" || inv.status === "OVERDUE");
    } else if (statusFilter === "paid") {
      filtered = filtered.filter(inv => inv.status === "PAID");
    }
    setFilteredInvoices(filtered);
  };

  const unpaidInvoices = invoices.filter(inv => 
    inv.status === "UNPAID" || inv.status === "PARTIALLY_PAID" || inv.status === "OVERDUE"
  );
  const totalUnpaid = unpaidInvoices.reduce((sum, inv) => sum + (inv.totalAmount - inv.paidAmount), 0);

  return (
    <div className="space-y-6 pb-8">
      {/* Background */}
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-purple-50 via-pink-50/30 to-blue-50/40" />

      {/* Header */}
      <div>
        <h1 className="text-display flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 shadow-lg">
            <FileText className="w-6 h-6 text-white" />
          </div>
          Hóa đơn của tôi
        </h1>
        <p className="text-gray-600 mt-2">Quản lý và thanh toán hóa đơn khám bệnh</p>
      </div>

      {/* Outstanding Balance Banner */}
      {unpaidInvoices.length > 0 && (
        <div className="backdrop-blur-lg bg-gradient-to-r from-orange-100 to-red-100 border-2 border-orange-300 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 shadow-lg">
                <AlertTriangle className="w-8 h-8 text-white" />
              </div>
              <div>
                <p className="text-lg font-semibold text-orange-900">
                  Bạn có {unpaidInvoices.length} hóa đơn chưa thanh toán
                </p>
                <p className="text-2xl font-bold text-red-600 mt-1">
                  Tổng: {totalUnpaid.toLocaleString("vi-VN")} ₫
                </p>
              </div>
            </div>
            <button
              onClick={() => setStatusFilter("unpaid")}
              className="btn-primary bg-gradient-to-r from-orange-500 to-red-600 hover:shadow-lg"
            >
              <CreditCard className="w-4 h-4" />
              Xem chi tiết
            </button>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="backdrop-blur-lg bg-white/70 border border-white/50 rounded-2xl p-2 shadow-xl">
        <div className="flex gap-2">
          {[
            { value: "all", label: "Tất cả", emoji: "📋", gradient: "from-purple-500 to-pink-600" },
            { value: "unpaid", label: "Chưa thanh toán", emoji: "⚠️", gradient: "from-orange-500 to-red-600" },
            { value: "paid", label: "Đã thanh toán", emoji: "✅", gradient: "from-green-500 to-emerald-600" },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(tab.value as any)}
              className={`flex-1 px-4 py-3 rounded-xl font-medium transition-all ${
                statusFilter === tab.value
                  ? `bg-gradient-to-r ${tab.gradient} text-white shadow-lg`
                  : "bg-white/60 text-gray-700 hover:bg-white/80"
              }`}
            >
              {tab.emoji} {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Invoice Cards */}
      {loading ? (
        <div className="text-center py-12">
          <Loader2 className="w-12 h-12 animate-spin mx-auto text-purple-600" />
          <p className="text-gray-500 mt-4">Đang tải...</p>
        </div>
      ) : filteredInvoices.length === 0 ? (
        <div className="backdrop-blur-lg bg-white/70 border border-white/50 rounded-2xl p-12 shadow-xl text-center">
          <FileText className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">Không có hóa đơn nào</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredInvoices.map((invoice) => {
            const status = STATUS_CONFIG[invoice.status];
            const StatusIcon = status.icon;
            const balanceDue = invoice.totalAmount - invoice.paidAmount;
            const isUnpaid = invoice.status === "UNPAID" || invoice.status === "PARTIALLY_PAID" || invoice.status === "OVERDUE";
            const isOverdue = invoice.status === "OVERDUE" || (new Date(invoice.dueDate) < new Date() && invoice.status !== "PAID");

            return (
              <div
                key={invoice.id}
                className={`backdrop-blur-lg border-2 rounded-2xl p-6 shadow-xl transition-all hover:shadow-2xl ${
                  isUnpaid
                    ? "bg-gradient-to-r from-orange-50/80 to-red-50/80 border-orange-200"
                    : "bg-white/70 border-white/50"
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-xl bg-gradient-to-br ${status.gradient} shadow-lg`}>
                      <FileText className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">Hóa đơn #{invoice.invoiceNumber}</h3>
                      <p className="text-sm text-gray-600 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(invoice.invoiceDate).toLocaleDateString("vi-VN")}
                        {isOverdue && (
                          <span className="text-red-600 font-medium ml-2">
                            • Hạn: {new Date(invoice.dueDate).toLocaleDateString("vi-VN")}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <span className={`badge ${status.class}`}>
                    <StatusIcon className="w-4 h-4" />
                    {status.label}
                  </span>
                </div>

                {/* Items Summary */}
                <div className="mb-4 p-3 rounded-xl bg-white/60">
                  <p className="text-sm text-gray-700">
                    {invoice.items.slice(0, 2).map(item => item.description).join(", ")}
                    {invoice.items.length > 2 && ` và ${invoice.items.length - 2} mục khác`}
                  </p>
                </div>

                {/* Amount Info */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50">
                    <p className="text-xs text-gray-600 mb-1">Tổng tiền</p>
                    <p className="text-lg font-bold text-blue-600">{invoice.totalAmount.toLocaleString("vi-VN")} ₫</p>
                  </div>
                  {isUnpaid ? (
                    <div className="p-3 rounded-xl bg-gradient-to-br from-red-50 to-rose-50">
                      <p className="text-xs text-gray-600 mb-1">Còn lại</p>
                      <p className="text-lg font-bold text-red-600">{balanceDue.toLocaleString("vi-VN")} ₫</p>
                    </div>
                  ) : (
                    <div className="p-3 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50">
                      <p className="text-xs text-gray-600 mb-1">Đã thanh toán</p>
                      <p className="text-lg font-bold text-green-600">{invoice.paidAmount.toLocaleString("vi-VN")} ₫</p>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Link
                    href={`/patient/billing/${invoice.id}`}
                    className="btn-secondary flex-1"
                  >
                    Xem chi tiết
                  </Link>
                  {isUnpaid && (
                    <Link
                      href={`/patient/billing/${invoice.id}`}
                      className="btn-primary flex-1 bg-gradient-to-r from-green-500 to-emerald-600"
                    >
                      <CreditCard className="w-4 h-4" />
                      Thanh toán ngay
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

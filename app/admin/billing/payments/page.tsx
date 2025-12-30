"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  DollarSign,
  Calendar,
  Filter,
  TrendingUp,
  CreditCard,
  Loader2,
  Search,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";

interface Payment {
  id: string;
  invoiceId: string;
  invoiceNumber: string;
  patient: {
    fullName: string;
  };
  amount: number;
  method: "CASH" | "CREDIT_CARD" | "BANK_TRANSFER" | "INSURANCE";
  paymentDate: string;
  notes?: string;
}

const PAYMENT_METHOD_CONFIG = {
  CASH: { label: "Tiền mặt", emoji: "💵", gradient: "from-green-400 to-emerald-500" },
  CREDIT_CARD: { label: "Thẻ tín dụng", emoji: "💳", gradient: "from-blue-400 to-indigo-500" },
  BANK_TRANSFER: { label: "Chuyển khoản", emoji: "🏦", gradient: "from-purple-400 to-pink-500" },
  INSURANCE: { label: "Bảo hiểm", emoji: "🏥", gradient: "from-cyan-400 to-teal-500" },
};

export default function PaymentHistoryPage() {
  const router = useRouter();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [filteredPayments, setFilteredPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [methodFilter, setMethodFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  useEffect(() => {
    fetchPayments();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [payments, searchQuery, methodFilter, dateFrom, dateTo, currentPage, itemsPerPage]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/billing/payments");
      const data = await response.json();
      // Sort by date desc
      const sorted = (data.data || []).sort((a: Payment, b: Payment) => 
        new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime()
      );
      setPayments(sorted);
    } catch (error) {
      console.error("Failed to fetch payments:", error);
      toast.error("Không thể tải lịch sử thanh toán");
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...payments];

    // Search by invoice number
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p => p.invoiceNumber.toLowerCase().includes(query));
    }

    // Method filter
    if (methodFilter) {
      filtered = filtered.filter(p => p.method === methodFilter);
    }

    // Date range
    if (dateFrom) {
      filtered = filtered.filter(p => p.paymentDate >= dateFrom);
    }
    if (dateTo) {
      filtered = filtered.filter(p => p.paymentDate <= dateTo + "T23:59:59");
    }

    // Pagination
    const startIndex = (currentPage - 1) * itemsPerPage;
    setFilteredPayments(filtered.slice(startIndex, startIndex + itemsPerPage));
  };

  // Calculate stats
  const today = new Date().toISOString().split("T")[0];
  const thisWeekStart = new Date();
  thisWeekStart.setDate(thisWeekStart.getDate() - thisWeekStart.getDay() + 1);
  const thisWeekStartStr = thisWeekStart.toISOString().split("T")[0];

  const todayPayments = payments.filter(p => p.paymentDate.startsWith(today));
  const weekPayments = payments.filter(p => p.paymentDate >= thisWeekStartStr);
  const cashPayments = payments.filter(p => p.method === "CASH");
  const cardPayments = payments.filter(p => p.method === "CREDIT_CARD");

  const todayTotal = todayPayments.reduce((sum, p) => sum + p.amount, 0);
  const weekTotal = weekPayments.reduce((sum, p) => sum + p.amount, 0);
  const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0);
  const cashPercentage = totalAmount > 0 ? (cashPayments.reduce((sum, p) => sum + p.amount, 0) / totalAmount * 100) : 0;
  const cardPercentage = totalAmount > 0 ? (cardPayments.reduce((sum, p) => sum + p.amount, 0) / totalAmount * 100) : 0;

  const totalPages = Math.ceil((payments.length || 1) / itemsPerPage);

  return (
    <div className="space-y-6 pb-8">
      {/* Background */}
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-green-50 via-emerald-50/30 to-teal-50/40" />

      {/* Header */}
      <div>
        <h1 className="text-display flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg">
            <DollarSign className="w-6 h-6 text-white" />
          </div>
          Lịch sử thanh toán
        </h1>
        <p className="text-gray-600 mt-2">Quản lý và theo dõi các khoản thanh toán</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="backdrop-blur-lg bg-white/70 border border-white/50 rounded-2xl p-5 shadow-xl hover:shadow-2xl transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Hôm nay</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{todayTotal.toLocaleString("vi-VN")} ₫</p>
              <p className="text-xs text-gray-500 mt-1">{todayPayments.length} thanh toán</p>
            </div>
            <div className="p-3 rounded-xl bg-gradient-to-br from-green-400 to-emerald-500 shadow-lg">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="backdrop-blur-lg bg-white/70 border border-white/50 rounded-2xl p-5 shadow-xl hover:shadow-2xl transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Tuần này</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">{weekTotal.toLocaleString("vi-VN")} ₫</p>
              <p className="text-xs text-gray-500 mt-1">{weekPayments.length} thanh toán</p>
            </div>
            <div className="p-3 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-500 shadow-lg">
              <Calendar className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="backdrop-blur-lg bg-white/70 border border-white/50 rounded-2xl p-5 shadow-xl hover:shadow-2xl transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Tiền mặt</p>
              <p className="text-2xl font-bold text-purple-600 mt-1">{cashPercentage.toFixed(0)}%</p>
              <p className="text-xs text-gray-500 mt-1">{cashPayments.length} giao dịch</p>
            </div>
            <div className="p-3 rounded-xl bg-gradient-to-br from-purple-400 to-pink-500 shadow-lg">
              <span className="text-2xl">💵</span>
            </div>
          </div>
        </div>

        <div className="backdrop-blur-lg bg-white/70 border border-white/50 rounded-2xl p-5 shadow-xl hover:shadow-2xl transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Thẻ</p>
              <p className="text-2xl font-bold text-cyan-600 mt-1">{cardPercentage.toFixed(0)}%</p>
              <p className="text-xs text-gray-500 mt-1">{cardPayments.length} giao dịch</p>
            </div>
            <div className="p-3 rounded-xl bg-gradient-to-br from-cyan-400 to-teal-500 shadow-lg">
              <CreditCard className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="backdrop-blur-lg bg-white/70 border border-white/50 rounded-2xl p-5 shadow-xl">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-blue-600" />
          <h3 className="text-section">Bộ lọc</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm số hóa đơn..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="input-base pl-10"
            />
          </div>

          {/* Method Filter */}
          <select
            className="dropdown"
            value={methodFilter}
            onChange={(e) => {
              setMethodFilter(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="">Tất cả phương thức</option>
            {Object.entries(PAYMENT_METHOD_CONFIG).map(([key, config]) => (
              <option key={key} value={key}>
                {config.emoji} {config.label}
              </option>
            ))}
          </select>

          {/* Date From */}
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => {
              setDateFrom(e.target.value);
              setCurrentPage(1);
            }}
            className="input-base"
            placeholder="Từ ngày"
          />

          {/* Date To */}
          <input
            type="date"
            value={dateTo}
            onChange={(e) => {
              setDateTo(e.target.value);
              setCurrentPage(1);
            }}
            className="input-base"
            placeholder="Đến ngày"
          />
        </div>
      </div>

      {/* Payments Table */}
      <div className="backdrop-blur-lg bg-white/70 border border-white/50 rounded-2xl p-6 shadow-xl">
        <h3 className="text-section mb-4 flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-green-600" />
          Danh sách thanh toán
        </h3>

        {loading ? (
          <div className="text-center py-12">
            <Loader2 className="w-12 h-12 animate-spin mx-auto text-green-600" />
            <p className="text-gray-500 mt-4">Đang tải...</p>
          </div>
        ) : filteredPayments.length === 0 ? (
          <div className="text-center py-12">
            <DollarSign className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">Không có thanh toán nào</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Mã thanh toán</th>
                    <th>Hóa đơn</th>
                    <th>Bệnh nhân</th>
                    <th className="text-right">Số tiền</th>
                    <th>Phương thức</th>
                    <th>Ngày thanh toán</th>
                    <th>Ghi chú</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPayments.map((payment) => {
                    const method = PAYMENT_METHOD_CONFIG[payment.method];
                    return (
                      <tr key={payment.id} className="hover:bg-white/60 transition-colors">
                        <td className="font-mono text-sm">{payment.id.slice(0, 8)}</td>
                        <td>
                          <Link
                            href={`/admin/billing/${payment.invoiceId}`}
                            className="text-blue-600 hover:underline font-medium"
                          >
                            #{payment.invoiceNumber}
                          </Link>
                        </td>
                        <td>{payment.patient.fullName}</td>
                        <td className="text-right font-semibold text-green-600">
                          {payment.amount.toLocaleString("vi-VN")} ₫
                        </td>
                        <td>
                          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-gradient-to-r ${method.gradient} text-white`}>
                            {method.emoji} {method.label}
                          </span>
                        </td>
                        <td className="text-sm">
                          {new Date(payment.paymentDate).toLocaleString("vi-VN")}
                        </td>
                        <td className="text-sm text-gray-600 max-w-xs truncate">
                          {payment.notes || "-"}
                        </td>
                        <td>
                          <Link
                            href={`/admin/billing/${payment.invoiceId}`}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">
                  Hiển thị {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, payments.length)} / {payments.length}
                </span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="input-base py-1 text-sm"
                >
                  <option value={10}>10 / trang</option>
                  <option value={20}>20 / trang</option>
                  <option value={50}>50 / trang</option>
                </select>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="btn-icon disabled:opacity-50"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-4 py-2 text-sm font-medium">
                  Trang {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages}
                  className="btn-icon disabled:opacity-50"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

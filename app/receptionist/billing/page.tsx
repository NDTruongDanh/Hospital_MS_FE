"use client";

import { useState, useEffect } from "react";
import { 
  Search, 
  CreditCard,
  Clock,
  CheckCircle,
  XCircle,
  MoreHorizontal,
  Eye,
  Receipt,
  Loader2,
  DollarSign,
  History,
  User,
  Calendar,
  FileText,
  Banknote,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { toast } from "sonner";
import { getInvoiceList, createCashPayment, getPaymentsByInvoice, InvoiceListParams, PageResponse } from "@/services/billing.service";
import { Invoice, Payment, PaymentsByInvoiceResponse } from "@/interfaces/billing";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  CANCELLED: { label: "Đã hủy", class: "badge-danger", icon: XCircle },
};

export default function ReceptionistBillingPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [processing, setProcessing] = useState(false);
  
  // Payment history & partial payment states
  const [paymentHistory, setPaymentHistory] = useState<Payment[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [partialAmount, setPartialAmount] = useState<string>("");
  const [paymentNotes, setPaymentNotes] = useState<string>("");
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // Sort
  type SortField = "invoiceNumber" | "invoiceDate" | "totalAmount" | "status";
  const [sortField, setSortField] = useState<SortField>("invoiceDate");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  useEffect(() => {
    fetchInvoices();
  }, [searchQuery, statusFilter, startDate, endDate]);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      
      // Fetch all invoices from API (backend RSQL filters not working reliably)
      const response = await getInvoiceList({});
      let data = response.data.data.content || [];
      
      // ===== CLIENT-SIDE FILTERS =====
      
      // 1. Filter by patient name or invoice number (search)
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        data = data.filter(inv => 
          (inv.patient?.fullName || inv.patientName || '').toLowerCase().includes(query) ||
          (inv.invoiceNumber || '').toLowerCase().includes(query)
        );
      }
      
      // 2. Filter by status
      if (statusFilter) {
        data = data.filter(inv => inv.status === statusFilter);
      }
      
      // 3. Filter by date range
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        data = data.filter(inv => {
          const invDate = new Date(inv.createdAt || inv.invoiceDate);
          return invDate >= start;
        });
      }
      
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        data = data.filter(inv => {
          const invDate = new Date(inv.createdAt || inv.invoiceDate);
          return invDate <= end;
        });
      }
      
      // 4. Sort
      data.sort((a, b) => {
        let aVal: any, bVal: any;
        
        switch (sortField) {
          case "invoiceNumber":
            aVal = a.invoiceNumber || "";
            bVal = b.invoiceNumber || "";
            break;
          case "invoiceDate":
            aVal = new Date(a.createdAt || a.invoiceDate).getTime();
            bVal = new Date(b.createdAt || b.invoiceDate).getTime();
            break;
          case "totalAmount":
            aVal = a.totalAmount;
            bVal = b.totalAmount;
            break;
          case "status":
            aVal = a.status;
            bVal = b.status;
            break;
          default:
            return 0;
        }
        
        if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
        if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
        return 0;
      });
      
      setInvoices(data);
    } catch (error) {
      console.error("Failed to fetch invoices:", error);
      toast.error("Không thể tải danh sách hóa đơn");
    } finally {
      setLoading(false);
    }
  };

  // Open invoice detail and fetch payment history
  const openInvoiceDetail = async (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setPartialAmount("");
    setPaymentNotes("");
    setPaymentHistory([]);
    
    try {
      setLoadingPayments(true);
      const response = await getPaymentsByInvoice(invoice.id);
      setPaymentHistory(response.data.data.payments || []);
    } catch (error) {
      console.error("Failed to fetch payment history:", error);
      // Don't show error toast, just show empty history
    } finally {
      setLoadingPayments(false);
    }
  };

  // Handle full payment
  const handlePayment = async (invoice: Invoice) => {
    try {
      setProcessing(true);
      await createCashPayment(invoice.id);
      toast.success("Đã xác nhận thanh toán thành công!");
      setSelectedInvoice(null);
      fetchInvoices();
    } catch (error) {
      toast.error("Không thể xử lý thanh toán");
    } finally {
      setProcessing(false);
    }
  };

  // Handle partial payment
  const handlePartialPayment = async () => {
    if (!selectedInvoice) return;
    
    const amount = parseFloat(partialAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Vui lòng nhập số tiền hợp lệ");
      return;
    }
    
    const balance = selectedInvoice.balanceDue || (selectedInvoice.totalAmount - (selectedInvoice.paidAmount || 0));
    if (amount > balance) {
      toast.error(`Số tiền không được vượt quá ${formatCurrency(balance)}`);
      return;
    }
    
    try {
      setProcessing(true);
      await createCashPayment(selectedInvoice.id, amount, paymentNotes || undefined);
      toast.success(`Đã thanh toán ${formatCurrency(amount)} thành công!`);
      
      // Refresh data
      fetchInvoices();
      openInvoiceDetail({ ...selectedInvoice }); // Refresh payment history
      setPartialAmount("");
      setPaymentNotes("");
    } catch (error) {
      toast.error("Không thể xử lý thanh toán");
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

  // Pagination
  const totalPages = Math.ceil(invoices.length / itemsPerPage);
  const paginatedInvoices = invoices.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Sort handler
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="w-3 h-3 opacity-30" />;
    return sortDirection === "asc" ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />;
  };

  const pendingCount = invoices.filter(i => i.status === "UNPAID" || i.status === "OVERDUE").length;
  const totalPending = invoices
    .filter(i => i.status === "UNPAID" || i.status === "OVERDUE")
    .reduce((sum, i) => sum + i.balanceDue, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-display">Quản lý thanh toán</h1>
          <p className="text-[hsl(var(--muted-foreground))] mt-1">
            {invoices.length} hóa đơn
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="stat-card">
          <div className="stat-card-header">
            <p className="text-card-title">Chờ thanh toán</p>
            <div className="stat-arrow-icon bg-[hsl(var(--warning))]">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <p className="stat-number">{pendingCount}</p>
          <p className="text-small">hóa đơn</p>
        </div>
        <div className="stat-card">
          <div className="stat-card-header">
            <p className="text-card-title">Tổng tiền chờ thu</p>
            <div className="stat-arrow-icon">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <p className="stat-number text-lg">{formatCurrency(totalPending)}</p>
        </div>
        <div className="stat-card">
          <div className="stat-card-header">
            <p className="text-card-title">Đã thu hôm nay</p>
            <div className="stat-arrow-icon bg-green-500">
              <CheckCircle className="w-5 h-5" />
            </div>
          </div>
          <p className="stat-number text-lg">
            {formatCurrency(
              invoices
                .filter(i => i.status === "PAID")
                .reduce((sum, i) => sum + i.totalAmount, 0)
            )}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="card-base">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Search - takes more space */}
          <div className="md:col-span-5">
            <div className="search-input w-full max-w-none">
              <Search className="w-4 h-4 text-[hsl(var(--muted-foreground))]" />
              <input
                type="text"
                placeholder="Tìm theo tên bệnh nhân hoặc mã hóa đơn..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="md:col-span-3">
            <select
              className="dropdown w-full"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">Tất cả trạng thái</option>
              <option value="UNPAID">Chờ thanh toán</option>
              <option value="PAID">Đã thanh toán</option>
              <option value="CANCELLED">Đã hủy</option>
            </select>
          </div>
          
          {/* Date Range - compact */}
          <div className="md:col-span-2">
            <input
              type="date"
              className="input-base text-sm w-full"
              title="Từ ngày"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="md:col-span-2">
            <input
              type="date"
              className="input-base text-sm w-full"
              title="Đến ngày"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="table-container">
        <table className="table-base">
          <thead>
            <tr>
              <th onClick={() => handleSort("invoiceNumber")} className="cursor-pointer hover:bg-gray-50 w-[180px]">
                <div className="flex items-center gap-1">
                  Mã hóa đơn
                  <SortIcon field="invoiceNumber" />
                </div>
              </th>
              <th onClick={() => handleSort("invoiceDate")} className="cursor-pointer hover:bg-gray-50 w-[140px]">
                <div className="flex items-center gap-1">
                  Ngày tạo
                  <SortIcon field="invoiceDate" />
                </div>
              </th>
              <th onClick={() => handleSort("totalAmount")} className="text-right cursor-pointer hover:bg-gray-50 w-[120px]">
                <div className="flex items-center justify-end gap-1">
                  Tổng tiền
                  <SortIcon field="totalAmount" />
                </div>
              </th>
              <th className="text-right w-[100px]">Giảm giá</th>
              <th className="text-right w-[120px]">Đã thanh toán</th>
              <th className="text-right w-[110px]">Còn nợ</th>
              <th onClick={() => handleSort("status")} className="cursor-pointer hover:bg-gray-50 w-[140px]">
                <div className="flex items-center gap-1">
                  Trạng thái
                  <SortIcon field="status" />
                </div>
              </th>
              <th className="w-12"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="text-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto text-[hsl(var(--primary))]" />
                  <p className="text-small mt-2">Đang tải...</p>
                </td>
              </tr>
            ) : paginatedInvoices.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-12">
                  <Receipt className="w-12 h-12 mx-auto text-[hsl(var(--muted-foreground))] opacity-50" />
                  <p className="text-[hsl(var(--muted-foreground))] mt-2">
                    Không có hóa đơn nào
                  </p>
                </td>
              </tr>
            ) : (
              paginatedInvoices.map((invoice) => {
                const status = STATUS_CONFIG[invoice.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.UNPAID;
                const StatusIcon = status.icon;
                return (
                  <tr 
                    key={invoice.id} 
                    className="cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => window.location.href = `/receptionist/billing/${invoice.id}`}
                  >
                    {/* ID */}
                    <td>
                      <p className="font-medium text-[hsl(var(--primary))] hover:underline">
                        #{invoice.invoiceNumber || invoice.id.slice(0, 8)}
                      </p>
                      <p className="text-small text-gray-500">
                        {invoice.patient?.fullName || invoice.patientName || "Bệnh nhân"}
                      </p>
                    </td>

                    {/* Date */}
                    <td className="text-sm">{formatDate(invoice.createdAt || invoice.invoiceDate)}</td>

                    {/* Total Amount */}
                    <td className="text-right font-semibold text-gray-900">
                      {formatCurrency(invoice.totalAmount)}
                    </td>

                    {/* Discount */}
                    <td className="text-right text-green-600">
                      {invoice.discount > 0 ? `-${formatCurrency(invoice.discount)}` : "-"}
                    </td>

                    {/* Paid Amount */}
                    <td className="text-right font-medium text-blue-600">
                      {formatCurrency(invoice.paidAmount || 0)}
                    </td>

                    {/* Balance Due */}
                    <td className="text-right font-medium text-amber-600">
                      {(invoice.balanceDue || 0) > 0 ? formatCurrency(invoice.balanceDue) : "-"}
                    </td>

                    {/* Status */}
                    <td>
                      <span className={`badge ${status.class}`}>
                        <StatusIcon className="w-3 h-3" />
                        {status.label}
                      </span>
                    </td>

                    {/* Actions */}
                    <td>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="btn-icon w-8 h-8">
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openInvoiceDetail(invoice)}>
                            <Eye className="w-4 h-4 mr-2" />
                            Xem chi tiết
                          </DropdownMenuItem>
                          {invoice.status === "UNPAID" && (
                            <DropdownMenuItem 
                              className="text-green-600"
                              onClick={() => handlePayment(invoice)}
                            >
                              <CreditCard className="w-4 h-4 mr-2" />
                              Thu tiền
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        
        {/* Pagination */}
        {!loading && paginatedInvoices.length > 0 && (
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">
                Hiển thị {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, invoices.length)} / {invoices.length}
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
        )}
      </div>

      {/* Invoice Detail Modal - Enhanced */}
      <Dialog open={!!selectedInvoice} onOpenChange={() => setSelectedInvoice(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="w-5 h-5" />
              Chi tiết hóa đơn
            </DialogTitle>
          </DialogHeader>
          {selectedInvoice && (
            <div className="space-y-5">
              {/* Header Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-white border border-blue-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-blue-600 mb-2">
                    <FileText className="w-4 h-4" />
                    <span className="text-sm font-medium">Thông tin hóa đơn</span>
                  </div>
                  <p className="font-bold text-lg">{selectedInvoice.invoiceNumber || `#${selectedInvoice.id.slice(0, 8)}`}</p>
                  <p className="text-sm text-gray-500 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {formatDate(selectedInvoice.createdAt || selectedInvoice.invoiceDate)}
                  </p>
                  {(() => {
                    const status = STATUS_CONFIG[selectedInvoice.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.UNPAID;
                    return (
                      <span className={`badge ${status.class} mt-2`}>
                        {status.label}
                      </span>
                    );
                  })()}
                </div>
                <div className="bg-gradient-to-br from-green-50 to-white border border-green-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-green-600 mb-2">
                    <User className="w-4 h-4" />
                    <span className="text-sm font-medium">Bệnh nhân</span>
                  </div>
                  <p className="font-bold text-lg">{selectedInvoice.patient?.fullName || selectedInvoice.patientName || "N/A"}</p>
                  <p className="text-sm text-gray-500">ID: {selectedInvoice.patient?.id?.slice(0, 8) || "N/A"}</p>
                </div>
              </div>

              {/* Items */}
              {selectedInvoice.items && selectedInvoice.items.length > 0 && (
                <div className="border rounded-xl overflow-hidden">
                  <div className="bg-gray-50 px-4 py-2 font-semibold text-sm flex items-center gap-2">
                    <Receipt className="w-4 h-4" />
                    Chi tiết dịch vụ ({selectedInvoice.items.length})
                  </div>
                  <div className="divide-y">
                    {selectedInvoice.items.map((item, i) => (
                      <div key={i} className="flex justify-between items-center px-4 py-3 text-sm">
                        <div>
                          <p className="font-medium">{item.description}</p>
                          <p className="text-gray-500 text-xs">
                            {item.quantity} x {formatCurrency(item.unitPrice)}
                          </p>
                        </div>
                        <span className="font-semibold">{formatCurrency(item.amount || (item.unitPrice * item.quantity))}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Amounts Summary */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tạm tính</span>
                  <span>{formatCurrency(selectedInvoice.subtotal || selectedInvoice.totalAmount)}</span>
                </div>
                {selectedInvoice.discount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Giảm giá</span>
                    <span>-{formatCurrency(selectedInvoice.discount)}</span>
                  </div>
                )}
                {selectedInvoice.tax > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Thuế</span>
                    <span>{formatCurrency(selectedInvoice.tax)}</span>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t font-bold text-lg">
                  <span>Tổng cộng</span>
                  <span className="text-[hsl(var(--primary))]">{formatCurrency(selectedInvoice.totalAmount)}</span>
                </div>
                <div className="flex justify-between text-sm text-blue-600">
                  <span>Đã thanh toán</span>
                  <span>{formatCurrency(selectedInvoice.paidAmount || 0)}</span>
                </div>
                {(selectedInvoice.balanceDue || 0) > 0 && (
                  <div className="flex justify-between text-sm font-semibold text-amber-600">
                    <span>Còn nợ</span>
                    <span>{formatCurrency(selectedInvoice.balanceDue)}</span>
                  </div>
                )}
              </div>

              {/* Payment History */}
              <div className="border rounded-xl overflow-hidden">
                <div className="bg-gray-50 px-4 py-2 font-semibold text-sm flex items-center gap-2">
                  <History className="w-4 h-4" />
                  Lịch sử thanh toán
                </div>
                {loadingPayments ? (
                  <div className="p-4 text-center">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                  </div>
                ) : paymentHistory.length === 0 ? (
                  <div className="p-4 text-center text-gray-500 text-sm">
                    Chưa có giao dịch thanh toán
                  </div>
                ) : (
                  <div className="divide-y max-h-40 overflow-y-auto">
                    {paymentHistory.map((payment) => (
                      <div key={payment.id} className="flex justify-between items-center px-4 py-3 text-sm">
                        <div>
                          <p className="font-medium flex items-center gap-1">
                            <Banknote className="w-3 h-3" />
                            {payment.gateway === "CASH" ? "Tiền mặt" : payment.gateway}
                          </p>
                          <p className="text-gray-500 text-xs">
                            {payment.createdAt ? formatDate(payment.createdAt) : "N/A"}
                            {payment.notes && ` - ${payment.notes}`}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-green-600">{formatCurrency(payment.amount)}</p>
                          <span className={`text-xs ${payment.status === "COMPLETED" ? "text-green-500" : "text-amber-500"}`}>
                            {payment.status === "COMPLETED" ? "Hoàn thành" : payment.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Partial Payment Form */}
              {(selectedInvoice.status === "UNPAID" || selectedInvoice.status === "PARTIALLY_PAID") && (
                <div className="bg-gradient-to-br from-amber-50 to-white border-2 border-amber-200 rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-2 text-amber-700 font-semibold">
                    <CreditCard className="w-5 h-5" />
                    Thanh toán
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Số tiền thanh toán</label>
                      <input
                        type="number"
                        className="input-base mt-1"
                        placeholder={`Tối đa ${formatCurrency(selectedInvoice.balanceDue || selectedInvoice.totalAmount)}`}
                        value={partialAmount}
                        onChange={(e) => setPartialAmount(e.target.value)}
                        max={selectedInvoice.balanceDue || selectedInvoice.totalAmount}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Ghi chú</label>
                      <input
                        type="text"
                        className="input-base mt-1"
                        placeholder="VD: Đợt 1, Tiền mặt..."
                        value={paymentNotes}
                        onChange={(e) => setPaymentNotes(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handlePartialPayment}
                      disabled={processing || !partialAmount}
                      className="btn-primary flex-1"
                    >
                      {processing && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                      Thanh toán một phần
                    </button>
                    <button
                      onClick={() => handlePayment(selectedInvoice)}
                      disabled={processing}
                      className="btn-secondary flex-1"
                    >
                      {processing && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                      Thanh toán toàn bộ
                    </button>
                  </div>
                </div>
              )}

              {/* Notes */}
              {selectedInvoice.notes && (
                <div className="text-sm text-gray-500 italic border-t pt-3">
                  <strong>Ghi chú:</strong> {selectedInvoice.notes}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

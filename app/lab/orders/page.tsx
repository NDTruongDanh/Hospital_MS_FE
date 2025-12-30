"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  TestTube,
  Search,
  Filter,
  Clock,
  AlertCircle,
  CheckCircle,
  Loader2,
  Eye,
} from "lucide-react";
import { toast } from "sonner";
import { labOrderService } from "@/services/lab.service";
import type { LabOrder, LabOrderStatus, OrderPriority } from "@/interfaces/lab";

const STATUS_CONFIG: Record<LabOrderStatus, { label: string; color: string; icon: any }> = {
  ORDERED: { label: "Đã chỉ định", color: "bg-blue-100 text-blue-700 border-blue-200", icon: Clock },
  IN_PROGRESS: { label: "Đang thực hiện", color: "bg-amber-100 text-amber-700 border-amber-200", icon: AlertCircle },
  COMPLETED: { label: "Hoàn thành", color: "bg-green-100 text-green-700 border-green-200", icon: CheckCircle },
  CANCELLED: { label: "Đã hủy", color: "bg-gray-100 text-gray-600 border-gray-200", icon: AlertCircle },
};

const PRIORITY_CONFIG: Record<OrderPriority, { label: string; color: string }> = {
  NORMAL: { label: "Bình thường", color: "text-gray-600" },
  URGENT: { label: "Khẩn cấp", color: "text-red-600 font-semibold" },
};

export default function LabOrdersPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<LabOrder[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<LabOrder[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<LabOrderStatus | "">("");
  const [priorityFilter, setPriorityFilter] = useState<OrderPriority | "">("");

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    // Client-side filtering
    let filtered = orders;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (order) =>
          order.orderNumber.toLowerCase().includes(query) ||
          order.patientName.toLowerCase().includes(query) ||
          order.patientId.toLowerCase().includes(query)
      );
    }

    if (statusFilter) {
      filtered = filtered.filter((order) => order.status === statusFilter);
    }

    if (priorityFilter) {
      filtered = filtered.filter((order) => order.priority === priorityFilter);
    }

    setFilteredOrders(filtered);
  }, [searchQuery, statusFilter, priorityFilter, orders]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await labOrderService.getAll();
      // Sort by priority (URGENT first) then by date (newest first)
      const sorted = (response.content || []).sort((a, b) => {
        if (a.priority === "URGENT" && b.priority !== "URGENT") return -1;
        if (a.priority !== "URGENT" && b.priority === "URGENT") return 1;
        return new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime();
      });
      setOrders(sorted);
    } catch (error) {
      console.error("Failed to fetch lab orders:", error);
      toast.error("Không thể tải danh sách đơn xét nghiệm");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("vi-VN", {
      dateStyle: "short",
      timeStyle: "short",
    });
  };

  const getProgressPercentage = (order: LabOrder) => {
    if (order.totalTests === 0) return  0;
    return Math.round((order.completedTests / order.totalTests) * 100);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-page flex items-center gap-2">
            <TestTube className="w-6 h-6" />
            Hàng đợi xét nghiệm
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {filteredOrders.length} đơn
            {(searchQuery || statusFilter || priorityFilter) && " (đã lọc)"}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="card-base p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="md:col-span-2">
            <div className="search-input">
              <Search className="w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm theo số đơn, tên BN, ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <select
              className="dropdown w-full"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as LabOrderStatus | "")}
            >
              <option value="">Tất cả trạng thái</option>
              {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                <option key={key} value={key}>
                  {config.label}
                </option>
              ))}
            </select>
          </div>

          {/* Priority Filter */}
          <div>
            <select
              className="dropdown w-full"
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value as OrderPriority | "")}
            >
              <option value="">Tất cả mức độ</option>
              {Object.entries(PRIORITY_CONFIG).map(([key, config]) => (
                <option key={key} value={key}>
                  {config.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Orders List */}
      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          <div className="card-base p-12 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-[hsl(var(--primary))]" />
            <p className="text-small mt-2">Đang tải...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="card-base p-12 text-center">
            <TestTube className="w-12 h-12 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">
              {searchQuery || statusFilter || priorityFilter
                ? "Không tìm thấy đơn xét nghiệm phù hợp"
                : "Chưa có đơn xét nghiệm nào"}
            </p>
          </div>
        ) : (
          filteredOrders.map((order) => {
            const statusConfig = STATUS_CONFIG[order.status];
            const priorityConfig = PRIORITY_CONFIG[order.priority];
            const StatusIcon = statusConfig.icon;
            const progress = getProgressPercentage(order);

            return (
              <div
                key={order.id}
                className="card-base p-5 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => router.push(`/lab/orders/${order.id}`)}
              >
                <div className="flex items-start justify-between gap-4">
                  {/* Left: Order Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-lg font-semibold">#{order.orderNumber}</h3>
                      <span className={`badge ${statusConfig.color} border`}>
                        <StatusIcon className="w-3 h-3" />
                        {statusConfig.label}
                      </span>
                      {order.priority === "URGENT" && (
                        <span className="badge bg-red-100 text-red-700 border-red-200">
                          🚨 {priorityConfig.label}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Bệnh nhân</p>
                        <p className="font-medium">{order.patientName}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Bác sĩ chỉ định</p>
                        <p className="font-medium">{order.orderingDoctorName || "—"}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Ngày chỉ định</p>
                        <p className="font-medium">{formatDate(order.orderDate)}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Số XN</p>
                        <p className="font-medium">
                          {order.completedTests}/{order.totalTests} hoàn thành
                        </p>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    {order.status !== "CANCELLED" && (
                      <div className="mt-4">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-gray-500">Tiến độ</span>
                          <span className="font-medium">{progress}%</span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all ${
                              progress === 100
                                ? "bg-green-500"
                                : order.priority === "URGENT"
                                ? "bg-red-500"
                                : "bg-blue-500"
                            }`}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right: Action Button */}
                  <button
                    className="btn-primary flex items-center gap-2 shrink-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/lab/orders/${order.id}`);
                    }}
                  >
                    <Eye className="w-4 h-4" />
                    Xem chi tiết
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

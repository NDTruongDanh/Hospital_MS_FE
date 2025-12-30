"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  TestTube,
  Search,
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock,
  Eye,
  Loader2,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import { labOrderService } from "@/services/lab.service";
import type { LabOrder, LabOrderStatus } from "@/interfaces/lab";

const STATUS_CONFIG: Record<LabOrderStatus, { label: string; color: string; icon: any }> = {
  ORDERED: { label: "Đã chỉ định", color: "bg-blue-100 text-blue-700", icon: Clock },
  IN_PROGRESS: { label: "Đang xử lý", color: "bg-amber-100 text-amber-700", icon: AlertCircle },
  COMPLETED: { label: "Hoàn thành", color: "bg-green-100 text-green-700", icon: CheckCircle },
  CANCELLED: { label: "Đã hủy", color: "bg-gray-100 text-gray-600", icon: AlertCircle },
};

export default function PatientLabResultsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<LabOrder[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<LabOrder[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<LabOrderStatus | "">("");

  useEffect(() => {
    fetchMyResults();
  }, []);

  useEffect(() => {
    let filtered = orders;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (order) =>
          order.orderNumber.toLowerCase().includes(query) ||
          order.orderingDoctorName?.toLowerCase().includes(query)
      );
    }

    if (statusFilter) {
      filtered = filtered.filter((order) => order.status === statusFilter);
    }

    // Sort by date (newest first)
    filtered.sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime());

    setFilteredOrders(filtered);
  }, [searchQuery, statusFilter, orders]);

  const fetchMyResults = async () => {
    try {
      setLoading(true);
      const userData = localStorage.getItem("user");
      if (!userData) {
        router.push("/login");
        return;
      }

      const user = JSON.parse(userData);
      const response = await labOrderService.getByPatient(user.id);
      setOrders(response || []);
    } catch (error) {
      console.error("Failed to fetch lab results:", error);
      toast.error("Không thể tải kết quả xét nghiệm");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const getProgressPercentage = (order: LabOrder) => {
    if (order.totalTests === 0) return 0;
    return Math.round((order.completedTests / order.totalTests) * 100);
  };

  const hasAbnormalResults = (order: LabOrder) => {
    return order.results.some((r) => r.isAbnormal && r.status === "COMPLETED");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-page flex items-center gap-2">
          <TestTube className="w-6 h-6" />
          Kết quả xét nghiệm của tôi
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Xem lại kết quả các xét nghiệm đã thực hiện
        </p>
      </div>

      {/* Filters */}
      <div className="card-base p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Search */}
          <div className="search-input">
            <Search className="w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm theo số đơn, bác sĩ..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Status Filter */}
          <select
            className="dropdown"
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
      </div>

      {/* Results List */}
      {loading ? (
        <div className="card-base p-12 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-[hsl(var(--primary))]" />
          <p className="text-small mt-2">Đang tải...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="card-base p-12 text-center">
          <FileText className="w-12 h-12 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">
            {searchQuery || statusFilter
              ? "Không tìm thấy kết quả phù hợp"
              : "Bạn chưa có kết quả xét nghiệm nào"}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const statusConfig = STATUS_CONFIG[order.status];
            const StatusIcon = statusConfig.icon;
            const progress = getProgressPercentage(order);
            const hasAbnormal = hasAbnormalResults(order);

            return (
              <div
                key={order.id}
                className={`card-base p-5 hover:shadow-lg transition-all cursor-pointer ${
                  hasAbnormal ? "border-l-4 border-l-red-500" : ""
                }`}
                onClick={() => router.push(`/patient/lab-results/${order.id}`)}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">#{order.orderNumber}</h3>
                      <span className={`badge ${statusConfig.color}`}>
                        <StatusIcon className="w-3 h-3" />
                        {statusConfig.label}
                      </span>
                      {hasAbnormal && (
                        <span className="badge bg-red-100 text-red-700">
                          ⚠️ Có bất thường
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Ngày chỉ định</p>
                        <p className="font-medium flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {formatDate(order.orderDate)}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Bác sĩ</p>
                        <p className="font-medium">{order.orderingDoctorName || "—"}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Số xét nghiệm</p>
                        <p className="font-medium">
                          {order.completedTests}/{order.totalTests}
                        </p>
                      </div>
                    </div>

                    {/* Progress */}
                    {order.status !== "CANCELLED" && (
                      <div className="mt-3">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-gray-500">Tiến độ</span>
                          <span className="font-medium">{progress}%</span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all ${
                              progress === 100 ? "bg-green-500" : "bg-blue-500"
                            }`}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action */}
                  <button
                    className="btn-primary shrink-0 ml-4"
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/patient/lab-results/${order.id}`);
                    }}
                  >
                    <Eye className="w-4 h-4" />
                    Xem chi tiết
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

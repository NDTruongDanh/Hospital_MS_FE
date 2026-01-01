"use client";

import { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import {
  FlaskConical,
  Search,
  Eye,
  Clock,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Filter,
  Beaker,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useLabOrders } from "@/hooks/queries/useLabOrder";
import {
  getOrderStatusLabel,
  getOrderStatusColor,
  getPriorityLabel,
  getPriorityColorOrder,
  LabOrderStatus,
} from "@/services/lab-order.service";

export default function NurseLabOrdersPage() {
  const [page, setPage] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string>("IN_PROGRESS");
  const [search, setSearch] = useState("");

  const { data, isLoading, refetch, isFetching } = useLabOrders({
    page,
    size: 20,
  });

  const labOrders = data?.content || [];
  const totalPages = data?.totalPages || 0;

  // Filter - show pending/in-progress orders for nurses to work on
  const filteredOrders = labOrders.filter((order) => {
    const matchesStatus =
      statusFilter === "ALL" || order.status === statusFilter;
    const matchesSearch =
      search === "" ||
      order.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
      order.patientName.toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd/MM HH:mm", { locale: vi });
  };

  const getProgressPercent = (completed: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((completed / total) * 100);
  };

  // Count pending work
  const pendingCount = labOrders.filter(
    (o) => o.status === "ORDERED" || o.status === "IN_PROGRESS"
  ).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="page-header">
          <h1>
            <Beaker className="h-6 w-6 text-teal-500" />
            Công việc Xét nghiệm
          </h1>
          <p>Thực hiện và cập nhật kết quả xét nghiệm</p>
        </div>

        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="text-base px-3 py-1">
            {pendingCount} phiếu cần xử lý
          </Badge>
          <Button
            variant="outline"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${isFetching ? "animate-spin" : ""}`}
            />
            Làm mới
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm theo mã phiếu, tên bệnh nhân..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tất cả</SelectItem>
                <SelectItem value="ORDERED">Mới yêu cầu</SelectItem>
                <SelectItem value="IN_PROGRESS">Đang thực hiện</SelectItem>
                <SelectItem value="COMPLETED">Hoàn thành</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Work Queue */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FlaskConical className="h-5 w-5 text-teal-500" />
            Danh sách phiếu xét nghiệm
          </CardTitle>
          <CardDescription>
            Ưu tiên xử lý theo mức độ khẩn cấp
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <CheckCircle className="h-12 w-12 mx-auto mb-3 opacity-50 text-green-500" />
              <p className="font-medium">Không có phiếu nào cần xử lý</p>
              <p className="text-sm">Tất cả đã hoàn thành!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredOrders.map((order) => (
                <div
                  key={order.id}
                  className={`flex items-center justify-between p-4 rounded-lg border transition-colors hover:bg-muted/50 ${
                    order.priority === "STAT"
                      ? "border-red-300 bg-red-50"
                      : order.priority === "URGENT"
                      ? "border-orange-300 bg-orange-50"
                      : ""
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-mono font-medium text-lg">
                        {order.orderNumber}
                      </span>
                      <Badge className={getOrderStatusColor(order.status)}>
                        {order.status === "COMPLETED" && (
                          <CheckCircle className="h-3 w-3 mr-1" />
                        )}
                        {order.status === "IN_PROGRESS" && (
                          <Clock className="h-3 w-3 mr-1" />
                        )}
                        {getOrderStatusLabel(order.status)}
                      </Badge>
                      <Badge className={getPriorityColorOrder(order.priority)}>
                        {getPriorityLabel(order.priority)}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>
                        <strong>Bệnh nhân:</strong> {order.patientName}
                      </span>
                      <span>•</span>
                      <span>
                        <strong>BS:</strong> {order.orderingDoctorName}
                      </span>
                      <span>•</span>
                      <span>{formatDate(order.orderDate)}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-2">
                      <Progress
                        value={getProgressPercent(
                          order.completedTests,
                          order.totalTests
                        )}
                        className="h-2 flex-1 max-w-[200px]"
                      />
                      <span className="text-sm font-medium">
                        {order.completedTests}/{order.totalTests} hoàn thành
                      </span>
                    </div>
                  </div>
                  <Link href={`/admin/lab-orders/${order.id}`}>
                    <Button>
                      <Eye className="h-4 w-4 mr-2" />
                      Thực hiện
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
              >
                Trước
              </Button>
              <span className="flex items-center px-4 text-sm">
                Trang {page + 1} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
              >
                Sau
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

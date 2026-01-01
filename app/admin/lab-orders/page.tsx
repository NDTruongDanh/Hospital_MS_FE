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
  ChevronRight,
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
  OrderPriority,
} from "@/services/lab-order.service";

export default function LabOrdersPage() {
  const [page, setPage] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [search, setSearch] = useState("");

  const { data, isLoading, refetch, isFetching } = useLabOrders({
    page,
    size: 20,
  });

  const labOrders = data?.content || [];
  const totalPages = data?.totalPages || 0;

  // Filter locally (could be moved to API for better performance)
  const filteredOrders = labOrders.filter((order) => {
    const matchesStatus = statusFilter === "ALL" || order.status === statusFilter;
    const matchesSearch =
      search === "" ||
      order.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
      order.patientName.toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd/MM/yyyy HH:mm", { locale: vi });
  };

  const getProgressPercent = (completed: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((completed / total) * 100);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="page-header">
          <h1>
            <FlaskConical className="h-6 w-6 text-teal-500" />
            Phiếu Xét nghiệm
          </h1>
          <p>Quản lý các phiếu yêu cầu xét nghiệm</p>
        </div>

        <Button
          variant="outline"
          onClick={() => refetch()}
          disabled={isFetching}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? "animate-spin" : ""}`} />
          Làm mới
        </Button>
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
                <SelectItem value="ORDERED">Đã yêu cầu</SelectItem>
                <SelectItem value="IN_PROGRESS">Đang thực hiện</SelectItem>
                <SelectItem value="COMPLETED">Hoàn thành</SelectItem>
                <SelectItem value="CANCELLED">Đã hủy</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách phiếu xét nghiệm</CardTitle>
          <CardDescription>
            {data?.totalElements || 0} phiếu
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FlaskConical className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Không có phiếu xét nghiệm nào</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mã phiếu</TableHead>
                  <TableHead>Bệnh nhân</TableHead>
                  <TableHead>Bác sĩ chỉ định</TableHead>
                  <TableHead>Ngày tạo</TableHead>
                  <TableHead>Tiến độ</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Ưu tiên</TableHead>
                  <TableHead className="w-[100px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-mono font-medium">
                      {order.orderNumber}
                    </TableCell>
                    <TableCell>{order.patientName}</TableCell>
                    <TableCell>{order.orderingDoctorName}</TableCell>
                    <TableCell>{formatDate(order.orderDate)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 min-w-[120px]">
                        <Progress
                          value={getProgressPercent(order.completedTests, order.totalTests)}
                          className="h-2 flex-1"
                        />
                        <span className="text-sm text-muted-foreground whitespace-nowrap">
                          {order.completedTests}/{order.totalTests}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getOrderStatusColor(order.status)}>
                        {order.status === "COMPLETED" && <CheckCircle className="h-3 w-3 mr-1" />}
                        {order.status === "IN_PROGRESS" && <Clock className="h-3 w-3 mr-1" />}
                        {order.status === "CANCELLED" && <AlertTriangle className="h-3 w-3 mr-1" />}
                        {getOrderStatusLabel(order.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getPriorityColorOrder(order.priority)}>
                        {getPriorityLabel(order.priority)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Link href={`/admin/lab-orders/${order.id}`}>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          Xem
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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

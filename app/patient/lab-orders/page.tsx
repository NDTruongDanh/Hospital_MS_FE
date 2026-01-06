"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { format, isWithinInterval, startOfDay, endOfDay, parseISO } from "date-fns";
import { vi } from "date-fns/locale";
import {
  ClipboardList,
  FlaskConical,
  Clock,
  CheckCircle,
  AlertTriangle,
  ChevronRight,
  Search,
  Calendar,
  RefreshCw,
  X,
  List,
  GitBranch,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { ListPageHeader } from "@/components/ui/list-page-header";
import { FilterPills } from "@/components/ui/filter-pills";
import { useQuery } from "@tanstack/react-query";
import { useMyProfile } from "@/hooks/queries/usePatient";
import {
  getLabOrdersByPatient,
  LabOrderResponse,
  LabOrderStatus,
  getOrderStatusLabel,
  getOrderStatusColor,
  getPriorityLabel,
  getPriorityColorOrder,
} from "@/services/lab-order.service";
import { cn } from "@/lib/utils";

type ViewMode = "list" | "timeline";

const statusConfig: Record<LabOrderStatus, { icon: React.ElementType; color: string }> = {
  ORDERED: { icon: Clock, color: "bg-blue-500" },
  IN_PROGRESS: { icon: Clock, color: "bg-yellow-500" },
  COMPLETED: { icon: CheckCircle, color: "bg-green-500" },
  CANCELLED: { icon: AlertTriangle, color: "bg-red-500" },
};

// Group orders by month for timeline view
function groupOrdersByMonth(orders: LabOrderResponse[]) {
  const groups: Record<string, { month: string; orders: LabOrderResponse[] }> = {};
  
  orders.forEach((order) => {
    const date = new Date(order.orderDate);
    const monthKey = format(date, "yyyy-MM");
    const monthLabel = format(date, "MMMM yyyy", { locale: vi });
    
    if (!groups[monthKey]) {
      groups[monthKey] = { month: monthLabel, orders: [] };
    }
    groups[monthKey].orders.push(order);
  });

  // Sort by month descending
  return Object.entries(groups)
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([, v]) => v);
}

// Timeline Item Component
function TimelineItem({ order, isLast }: { order: LabOrderResponse; isLast: boolean }) {
  const StatusIcon = statusConfig[order.status]?.icon || Clock;
  const statusColor = statusConfig[order.status]?.color || "bg-gray-500";
  
  const formatDateDisplay = (dateString: string) => {
    return format(new Date(dateString), "dd/MM HH:mm", { locale: vi });
  };

  return (
    <div className="relative flex gap-4 pb-6">
      {/* Timeline line */}
      {!isLast && (
        <div className="absolute left-[11px] top-8 bottom-0 w-0.5 bg-border" />
      )}
      
      {/* Timeline dot */}
      <div className={cn(
        "relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full",
        statusColor
      )}>
        <StatusIcon className="h-3 w-3 text-white" />
      </div>
      
      {/* Content */}
      <Link href={`/patient/lab-orders/${order.id}`} className="flex-1 min-w-0">
        <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
          <CardContent className="py-3 px-4">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold">#{order.orderNumber}</span>
                  <Badge className={getOrderStatusColor(order.status)} variant="secondary">
                    {getOrderStatusLabel(order.status)}
                  </Badge>
                  {order.priority === "URGENT" && (
                    <Badge className={getPriorityColorOrder(order.priority)} variant="secondary">
                      {getPriorityLabel(order.priority)}
                    </Badge>
                  )}
                </div>
                
                <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                  <span>{formatDateDisplay(order.orderDate)}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <FlaskConical className="h-3 w-3" />
                    {order.completedTests}/{order.totalTests}
                  </span>
                </div>
                
                {/* Test names preview */}
                <div className="mt-2 flex flex-wrap gap-1">
                  {order.results.slice(0, 2).map((result) => (
                    <Badge key={result.id} variant="outline" className="text-xs">
                      {result.labTestName}
                    </Badge>
                  ))}
                  {order.results.length > 2 && (
                    <Badge variant="outline" className="text-xs">
                      +{order.results.length - 2}
                    </Badge>
                  )}
                </div>
              </div>
              
              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
            </div>
          </CardContent>
        </Card>
      </Link>
    </div>
  );
}

// Timeline View Component
function TimelineView({ orders }: { orders: LabOrderResponse[] }) {
  const groupedOrders = useMemo(() => groupOrdersByMonth(orders), [orders]);

  if (orders.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <ClipboardList className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground">Không có phiếu xét nghiệm nào</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {groupedOrders.map((group) => (
        <div key={group.month}>
          {/* Month header */}
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="h-4 w-4 text-teal-600" />
            <h3 className="font-semibold text-teal-700 capitalize">{group.month}</h3>
            <Badge variant="secondary" className="ml-2">{group.orders.length}</Badge>
          </div>
          
          {/* Timeline items */}
          <div className="ml-2">
            {group.orders.map((order, index) => (
              <TimelineItem 
                key={order.id} 
                order={order} 
                isLast={index === group.orders.length - 1}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// List View Component (extracted for cleanliness)
function ListView({ orders, formatDateDisplay }: { 
  orders: LabOrderResponse[]; 
  formatDateDisplay: (date: string) => string;
}) {
  if (orders.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <ClipboardList className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground">Không có phiếu xét nghiệm nào</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {orders.map((order) => {
        const StatusIcon = statusConfig[order.status]?.icon || Clock;

        return (
          <Link
            key={order.id}
            href={`/patient/lab-orders/${order.id}`}
            className="block"
          >
            <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-semibold text-lg">
                        #{order.orderNumber}
                      </span>
                      <Badge className={getOrderStatusColor(order.status)} variant="secondary">
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {getOrderStatusLabel(order.status)}
                      </Badge>
                      {order.priority === "URGENT" && (
                        <Badge className={getPriorityColorOrder(order.priority)} variant="secondary">
                          {getPriorityLabel(order.priority)}
                        </Badge>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {formatDateDisplay(order.orderDate)}
                      </span>
                      {order.orderingDoctorName && (
                        <>
                          <span>•</span>
                          <span>BS: {order.orderingDoctorName}</span>
                        </>
                      )}
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <FlaskConical className="h-3.5 w-3.5" />
                        {order.completedTests}/{order.totalTests} xét nghiệm
                      </span>
                    </div>

                    {/* Test names preview */}
                    <div className="mt-2 flex flex-wrap gap-1">
                      {order.results.slice(0, 3).map((result) => (
                        <Badge key={result.id} variant="outline" className="text-xs">
                          {result.labTestName}
                        </Badge>
                      ))}
                      {order.results.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{order.results.length - 3} khác
                        </Badge>
                      )}
                    </div>
                  </div>

                  <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0 ml-4" />
                </div>
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}

export default function PatientLabOrdersPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<LabOrderStatus | "ALL">("ALL");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [viewMode, setViewMode] = useState<ViewMode>("list");

  // Get patient ID from profile
  const { data: myProfile, isLoading: isLoadingProfile } = useMyProfile();
  const patientId = myProfile?.id || "";

  // Fetch lab orders for current patient
  const {
    data: labOrders,
    isLoading,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["labOrders", "patient", patientId],
    queryFn: () => getLabOrdersByPatient(patientId),
    enabled: !!patientId,
  });

  // Filter orders
  const filteredOrders = useMemo(() => {
    let orders = labOrders || [];

    // Filter by status
    if (statusFilter !== "ALL") {
      orders = orders.filter((o) => o.status === statusFilter);
    }

    // Filter by date range
    if (startDate) {
      const start = startOfDay(parseISO(startDate));
      const end = endDate ? endOfDay(parseISO(endDate)) : endOfDay(parseISO(startDate));
      orders = orders.filter((o) => {
        const orderDate = new Date(o.orderDate);
        return isWithinInterval(orderDate, { start, end });
      });
    }

    // Filter by search
    if (search) {
      const searchLower = search.toLowerCase();
      orders = orders.filter(
        (o) =>
          o.orderNumber.toLowerCase().includes(searchLower) ||
          o.results.some((r) => r.labTestName.toLowerCase().includes(searchLower))
      );
    }

    return orders;
  }, [labOrders, statusFilter, search, startDate, endDate]);

  // Stats
  const totalCount = labOrders?.length || 0;
  const pendingCount = labOrders?.filter((o) => o.status === "ORDERED" || o.status === "IN_PROGRESS").length || 0;
  const completedCount = labOrders?.filter((o) => o.status === "COMPLETED").length || 0;
  const cancelledCount = labOrders?.filter((o) => o.status === "CANCELLED").length || 0;

  const formatDateDisplay = (dateString: string) => {
    return format(new Date(dateString), "dd/MM/yyyy HH:mm", { locale: vi });
  };

  const clearDateFilter = () => {
    setStartDate("");
    setEndDate("");
  };

  if (isLoadingProfile || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" variant="muted" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <ListPageHeader
        title="Phiếu Xét nghiệm"
        description="Xem và theo dõi các phiếu xét nghiệm của bạn"
        theme="teal"
        icon={<ClipboardList className="h-6 w-6 text-white" />}
        stats={[
          { label: "Tổng", value: totalCount },
          { label: "Đang chờ", value: pendingCount },
          { label: "Hoàn thành", value: completedCount },
        ]}
      />

      {/* View Toggle + Filter Pills */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <FilterPills
          filters={[
            { id: "ALL", label: "Tất cả", count: totalCount },
            { id: "ORDERED", label: "Đã yêu cầu" },
            { id: "IN_PROGRESS", label: "Đang thực hiện", count: pendingCount, countColor: "warning" },
            { id: "COMPLETED", label: "Hoàn thành", count: completedCount, countColor: "success" },
            { id: "CANCELLED", label: "Đã hủy", count: cancelledCount, countColor: cancelledCount > 0 ? "danger" : "default" },
          ]}
          activeFilter={statusFilter}
          onFilterChange={(id) => {
            setStatusFilter(id as LabOrderStatus | "ALL");
          }}
        />
        
        {/* View Mode Toggle */}
        <div className="flex items-center bg-muted rounded-lg p-1">
          <Button
            variant={viewMode === "list" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("list")}
            className="gap-1.5"
          >
            <List className="h-4 w-4" />
            List
          </Button>
          <Button
            variant={viewMode === "timeline" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("timeline")}
            className="gap-1.5"
          >
            <GitBranch className="h-4 w-4" />
            Timeline
          </Button>
        </div>
      </div>

      {/* Search & Date Filter Row */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Tìm theo mã phiếu, tên xét nghiệm..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        
        {/* Date Range Filter */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-36"
              placeholder="Từ ngày"
            />
          </div>
          <span className="text-muted-foreground">-</span>
          <Input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-36"
            placeholder="Đến ngày"
            min={startDate}
          />
          {(startDate || endDate) && (
            <Button variant="ghost" size="icon" onClick={clearDateFilter}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? "animate-spin" : ""}`} />
          Làm mới
        </Button>
      </div>

      {/* Content based on view mode */}
      {viewMode === "list" ? (
        <ListView orders={filteredOrders} formatDateDisplay={formatDateDisplay} />
      ) : (
        <TimelineView orders={filteredOrders} />
      )}
    </div>
  );
}

"use client";

import { useState, useMemo } from "react";
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
  List,
  GitBranch,
  Sparkles,
  Info,
  Activity,
  Beaker,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { DateRangeFilter, DateRange } from "@/components/ui/date-range-filter";
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

const statusConfig: Record<LabOrderStatus, { icon: React.ElementType; color: string; bgColor: string }> = {
  ORDERED: { icon: Clock, color: "text-blue-600", bgColor: "bg-blue-100" },
  IN_PROGRESS: { icon: Clock, color: "text-amber-600", bgColor: "bg-amber-100" },
  COMPLETED: { icon: CheckCircle, color: "text-emerald-600", bgColor: "bg-emerald-100" },
  CANCELLED: { icon: AlertTriangle, color: "text-red-600", bgColor: "bg-red-100" },
};

// Status filter pills config
const statusFilters = [
  { value: "ALL", label: "Tất cả", icon: ClipboardList, color: "bg-slate-600" },
  { value: "ORDERED", label: "Đã yêu cầu", icon: Clock, color: "bg-blue-500" },
  { value: "IN_PROGRESS", label: "Đang thực hiện", icon: Activity, color: "bg-amber-500" },
  { value: "COMPLETED", label: "Hoàn thành", icon: CheckCircle, color: "bg-emerald-500" },
  { value: "CANCELLED", label: "Đã hủy", icon: AlertTriangle, color: "bg-red-500" },
];

// View toggle component
function ViewToggle({ view, onChange }: { view: ViewMode; onChange: (v: ViewMode) => void }) {
  return (
    <div className="flex bg-slate-100 rounded-lg p-1">
      <button
        onClick={() => onChange("list")}
        className={cn(
          "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all",
          view === "list"
            ? "bg-white text-slate-900 shadow-sm"
            : "text-slate-600 hover:text-slate-900"
        )}
      >
        <List className="h-4 w-4" />
        Danh sách
      </button>
      <button
        onClick={() => onChange("timeline")}
        className={cn(
          "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all",
          view === "timeline"
            ? "bg-white text-slate-900 shadow-sm"
            : "text-slate-600 hover:text-slate-900"
        )}
      >
        <GitBranch className="h-4 w-4" />
        Timeline
      </button>
    </div>
  );
}

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

  return Object.entries(groups)
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([, v]) => v);
}

// Timeline Item Component
function TimelineItem({ order, isLast }: { order: LabOrderResponse; isLast: boolean }) {
  const config = statusConfig[order.status] || statusConfig.ORDERED;
  const StatusIcon = config.icon;
  
  return (
    <div className="relative flex gap-4 pb-6">
      {!isLast && (
        <div className="absolute left-[13px] top-10 bottom-0 w-0.5 bg-gradient-to-b from-teal-300 to-slate-200" />
      )}
      
      <div className={cn(
        "relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full shadow-md",
        config.bgColor
      )}>
        <StatusIcon className={cn("h-3.5 w-3.5", config.color)} />
      </div>
      
      <Link href={`/patient/lab-orders/${order.id}`} className="flex-1 min-w-0">
        <Card className="border-2 border-slate-200 hover:border-teal-300 hover:shadow-md transition-all cursor-pointer group">
          <CardContent className="py-4 px-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-slate-800">#{order.orderNumber}</span>
                  <Badge className={getOrderStatusColor(order.status)} variant="secondary">
                    {getOrderStatusLabel(order.status)}
                  </Badge>
                  {order.priority === "URGENT" && (
                    <Badge className={getPriorityColorOrder(order.priority)} variant="secondary">
                      {getPriorityLabel(order.priority)}
                    </Badge>
                  )}
                </div>
                
                <div className="flex items-center gap-3 text-sm text-slate-500 mt-2">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    {format(new Date(order.orderDate), "dd/MM HH:mm", { locale: vi })}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1.5">
                    <FlaskConical className="h-3.5 w-3.5" />
                    {order.completedTests}/{order.totalTests} xét nghiệm
                  </span>
                </div>
                
                {/* Test names preview */}
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {order.results.slice(0, 2).map((result) => (
                    <Badge key={result.id} variant="outline" className="text-xs bg-white">
                      {result.labTestName}
                    </Badge>
                  ))}
                  {order.results.length > 2 && (
                    <Badge variant="outline" className="text-xs bg-white">
                      +{order.results.length - 2}
                    </Badge>
                  )}
                </div>
              </div>
              
              <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-teal-500 shrink-0 mt-1 transition-colors" />
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
      <Card className="border-2 border-dashed border-slate-200">
        <CardContent className="py-16 text-center">
          <div className="rounded-full bg-slate-100 p-4 w-fit mx-auto mb-4">
            <ClipboardList className="h-12 w-12 text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-700">Chưa có phiếu xét nghiệm</h3>
          <p className="text-slate-500 mt-1">Danh sách xét nghiệm sẽ hiển thị ở đây</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      {groupedOrders.map((group) => (
        <div key={group.month}>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-teal-100">
              <Calendar className="h-4 w-4 text-teal-600" />
            </div>
            <h3 className="font-semibold text-slate-800 capitalize">{group.month}</h3>
            <Badge className="bg-teal-100 text-teal-700">{group.orders.length} phiếu</Badge>
          </div>
          
          <div className="ml-3">
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

// List View Component
function ListView({ orders }: { orders: LabOrderResponse[] }) {
  if (orders.length === 0) {
    return (
      <Card className="border-2 border-dashed border-slate-200">
        <CardContent className="py-16 text-center">
          <div className="rounded-full bg-slate-100 p-4 w-fit mx-auto mb-4">
            <ClipboardList className="h-12 w-12 text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-700">Chưa có phiếu xét nghiệm</h3>
          <p className="text-slate-500 mt-1">Danh sách xét nghiệm sẽ hiển thị ở đây</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {orders.map((order) => {
        const config = statusConfig[order.status] || statusConfig.ORDERED;
        const StatusIcon = config.icon;
        const progress = order.totalTests > 0 ? (order.completedTests / order.totalTests) * 100 : 0;

        return (
          <Link
            key={order.id}
            href={`/patient/lab-orders/${order.id}`}
            className="block"
          >
            <Card className="border-2 border-slate-200 hover:border-teal-300 hover:shadow-lg transition-all cursor-pointer group overflow-hidden">
              <div className="h-1 bg-gradient-to-r from-teal-500 via-cyan-500 to-emerald-500" />
              <CardContent className="py-5">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-3">
                      <div className={cn("p-2 rounded-lg", config.bgColor)}>
                        <FlaskConical className={cn("h-5 w-5", config.color)} />
                      </div>
                      <div>
                        <span className="font-bold text-lg text-slate-800">
                          #{order.orderNumber}
                        </span>
                        <div className="flex items-center gap-2 mt-0.5">
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
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600 ml-12">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="h-4 w-4 text-slate-400" />
                        {format(new Date(order.orderDate), "dd/MM/yyyy HH:mm", { locale: vi })}
                      </span>
                      {order.orderingDoctorName && (
                        <>
                          <span>•</span>
                          <span>BS: {order.orderingDoctorName}</span>
                        </>
                      )}
                    </div>

                    {/* Progress bar */}
                    <div className="mt-3 ml-12">
                      <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                        <span>{order.completedTests}/{order.totalTests} xét nghiệm hoàn thành</span>
                        <span>{Math.round(progress)}%</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full transition-all"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>

                    {/* Test names preview */}
                    <div className="mt-3 ml-12 flex flex-wrap gap-1.5">
                      {order.results.slice(0, 3).map((result) => (
                        <Badge key={result.id} variant="outline" className="text-xs bg-white">
                          {result.labTestName}
                        </Badge>
                      ))}
                      {order.results.length > 3 && (
                        <Badge variant="outline" className="text-xs bg-white">
                          +{order.results.length - 3} khác
                        </Badge>
                      )}
                    </div>
                  </div>

                  <ChevronRight className="h-6 w-6 text-slate-400 group-hover:text-teal-500 flex-shrink-0 ml-4 transition-colors" />
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
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<LabOrderStatus | "ALL">("ALL");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
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
    if (dateRange?.from) {
      const start = startOfDay(dateRange.from);
      const end = dateRange.to ? endOfDay(dateRange.to) : endOfDay(dateRange.from);
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
  }, [labOrders, statusFilter, search, dateRange]);

  // Stats
  const totalCount = labOrders?.length || 0;
  const pendingCount = labOrders?.filter((o) => o.status === "ORDERED" || o.status === "IN_PROGRESS").length || 0;
  const completedCount = labOrders?.filter((o) => o.status === "COMPLETED").length || 0;

  if (isLoadingProfile || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" variant="muted" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Enhanced Gradient Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-teal-600 via-cyan-500 to-emerald-500 p-6 text-white shadow-xl">
        {/* Background decorations */}
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
        <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-white/5" />
        <div className="absolute top-1/2 right-1/4 h-20 w-20 rounded-full bg-white/5" />

        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="rounded-xl bg-white/20 p-3 backdrop-blur-sm">
              <FlaskConical className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                Phiếu Xét nghiệm
                {isFetching && <RefreshCw className="h-4 w-4 animate-spin" />}
              </h1>
              <p className="mt-1 text-teal-100">
                Xem và theo dõi các kết quả xét nghiệm của bạn
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="flex gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold">{totalCount}</div>
              <div className="text-sm text-teal-200">Tổng</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">{pendingCount}</div>
              <div className="text-sm text-teal-200">Đang chờ</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">{completedCount}</div>
              <div className="text-sm text-teal-200">Hoàn thành</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-3 space-y-4">
          {/* Filter Bar */}
          <Card className="border-2 border-slate-200 shadow-sm">
            <CardContent className="py-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                {/* Status Pills */}
                <div className="flex gap-2 flex-wrap">
                  {statusFilters.map((filter) => {
                    const Icon = filter.icon;
                    const isActive = statusFilter === filter.value;
                    const count = filter.value === "ALL" 
                      ? totalCount 
                      : labOrders?.filter((o) => o.status === filter.value).length || 0;
                    
                    return (
                      <button
                        key={filter.value}
                        onClick={() => setStatusFilter(filter.value as LabOrderStatus | "ALL")}
                        className={cn(
                          "flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium transition-all",
                          isActive
                            ? `${filter.color} text-white shadow-md scale-[1.02]`
                            : "bg-white text-slate-600 border border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                        )}
                      >
                        <Icon className="h-4 w-4" />
                        {filter.label}
                        <Badge 
                          variant="secondary" 
                          className={cn(
                            "text-xs",
                            isActive ? "bg-white/20 text-white" : "bg-slate-100"
                          )}
                        >
                          {count}
                        </Badge>
                      </button>
                    );
                  })}
                </div>

                {/* View Toggle */}
                <ViewToggle view={viewMode} onChange={setViewMode} />
              </div>
            </CardContent>
          </Card>

          {/* Search & Date Filter */}
          <Card className="border-2 border-slate-200 shadow-sm">
            <CardContent className="py-4">
              <div className="flex flex-wrap items-center gap-4">
                {/* Search */}
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    placeholder="Tìm theo mã phiếu, tên xét nghiệm..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10 border-2"
                  />
                </div>
                
                {/* Date Range Filter */}
                <DateRangeFilter
                  value={dateRange}
                  onChange={setDateRange}
                  theme="teal"
                  presetKeys={["all", "today", "7days", "30days", "thisMonth"]}
                />

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => refetch()}
                  disabled={isFetching}
                  className="gap-2"
                >
                  <RefreshCw className={cn("h-4 w-4", isFetching && "animate-spin")} />
                  Làm mới
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Content based on view mode */}
          {viewMode === "list" ? (
            <ListView orders={filteredOrders} />
          ) : (
            <TimelineView orders={filteredOrders} />
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Info Card */}
          <Card className="border-2 border-teal-200 bg-gradient-to-br from-teal-50 to-white shadow-sm">
            <CardContent className="pt-5">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-teal-100">
                  <Info className="h-4 w-4 text-teal-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800 mb-2">Thông tin</h3>
                  <p className="text-sm text-slate-600">
                    Đây là danh sách các phiếu xét nghiệm của bạn. Click vào phiếu để xem chi tiết kết quả.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Features Card */}
          <Card className="border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-white shadow-sm">
            <CardContent className="pt-5">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-emerald-100">
                  <Beaker className="h-4 w-4 text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800 mb-2">Tính năng</h3>
                  <ul className="space-y-2 text-sm text-slate-600">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                      Xem chi tiết kết quả
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                      Theo dõi tiến độ
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                      Lọc theo trạng thái
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats Card */}
          <Card className="border-2 border-cyan-200 bg-gradient-to-br from-cyan-50 to-white shadow-sm">
            <CardContent className="pt-5">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-cyan-100">
                  <Activity className="h-4 w-4 text-cyan-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-800 mb-3">Thống kê nhanh</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">Tổng phiếu</span>
                      <Badge className="bg-teal-100 text-teal-700">{totalCount}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">Đang chờ</span>
                      <Badge className="bg-amber-100 text-amber-700">{pendingCount}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">Hoàn thành</span>
                      <Badge className="bg-emerald-100 text-emerald-700">{completedCount}</Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

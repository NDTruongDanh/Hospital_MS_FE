"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  FlaskConical,
  Search,
  Activity,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  FileText,
  Calendar,
  LayoutGrid,
  Users,
  UserCheck,
} from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { useLabOrders, useLabOrdersByDoctor } from "@/hooks/queries/useLabOrder";
import { useMyEmployeeProfile } from "@/hooks/queries/useHr";
import {
  LabOrderResponse,
  getOrderStatusColor,
  getOrderStatusLabel,
  getPriorityLabel,
} from "@/services/lab-order.service";
import { DataTablePagination } from "@/components/ui/data-table-pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { useDebounce } from "@/hooks/useDebounce";

const formatDateShort = (value: string) =>
  new Date(value).toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

const formatDateFull = (value: string) =>
  new Date(value).toLocaleString("vi-VN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

const formatTime = (value: string) =>
  new Date(value).toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });

// Status filter options
const STATUS_OPTIONS = [
  { value: "ALL", label: "Tất cả" },
  { value: "ORDERED", label: "Đã yêu cầu" },
  { value: "IN_PROGRESS", label: "Đang thực hiện" },
  { value: "COMPLETED", label: "Hoàn thành" },
];

// Scope filter types
type ScopeFilter = "my-orders" | "all-patients";

// Group orders by date
function groupOrdersByDate(orders: LabOrderResponse[]) {
  const groups: { [key: string]: LabOrderResponse[] } = {};
  orders.forEach((order) => {
    const date = new Date(order.orderDate).toDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(order);
  });
  return Object.entries(groups).sort(([a], [b]) =>
    new Date(b).getTime() - new Date(a).getTime()
  );
}

// View Toggle Button
function ViewToggle({
  view,
  onChange,
}: {
  view: "table" | "timeline";
  onChange: (v: "table" | "timeline") => void;
}) {
  return (
    <div className="flex bg-slate-100 rounded-lg p-1">
      <button
        onClick={() => onChange("table")}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
          view === "table"
            ? "bg-white text-slate-900 shadow-sm"
            : "text-slate-600 hover:text-slate-900"
        }`}
      >
        <LayoutGrid className="h-4 w-4" />
        Bảng
      </button>
      <button
        onClick={() => onChange("timeline")}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
          view === "timeline"
            ? "bg-white text-slate-900 shadow-sm"
            : "text-slate-600 hover:text-slate-900"
        }`}
      >
        <Calendar className="h-4 w-4" />
        Timeline
      </button>
    </div>
  );
}

// Scope Toggle - Beautiful UI
function ScopeToggle({
  scope,
  onChange,
  myOrdersCount,
  allPatientsCount,
}: {
  scope: ScopeFilter;
  onChange: (s: ScopeFilter) => void;
  myOrdersCount: number;
  allPatientsCount: number;
}) {
  return (
    <div className="relative flex rounded-xl p-1 bg-gradient-to-r from-indigo-100 via-purple-100 to-pink-100 shadow-inner">
      {/* Sliding background */}
      <div
        className={`absolute top-1 bottom-1 rounded-lg bg-white shadow-md transition-all duration-300 ease-out ${
          scope === "my-orders"
            ? "left-1 w-[calc(50%-4px)]"
            : "left-[calc(50%+2px)] w-[calc(50%-4px)]"
        }`}
      />
      
      <button
        onClick={() => onChange("my-orders")}
        className={`relative flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all z-10 ${
          scope === "my-orders"
            ? "text-indigo-700"
            : "text-slate-500 hover:text-slate-700"
        }`}
      >
        <div className={`p-1 rounded-md transition-all ${scope === "my-orders" ? "bg-indigo-100" : ""}`}>
          <UserCheck className="h-4 w-4" />
        </div>
        <span>Phiếu tôi chỉ định</span>
        <Badge 
          variant="secondary" 
          className={`ml-1 transition-all ${
            scope === "my-orders" 
              ? "bg-indigo-200 text-indigo-800" 
              : "bg-slate-200 text-slate-600"
          }`}
        >
          {myOrdersCount}
        </Badge>
      </button>
      
      <button
        onClick={() => onChange("all-patients")}
        className={`relative flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all z-10 ${
          scope === "all-patients"
            ? "text-purple-700"
            : "text-slate-500 hover:text-slate-700"
        }`}
      >
        <div className={`p-1 rounded-md transition-all ${scope === "all-patients" ? "bg-purple-100" : ""}`}>
          <Users className="h-4 w-4" />
        </div>
        <span>Tất cả BN của tôi</span>
        <Badge 
          variant="secondary" 
          className={`ml-1 transition-all ${
            scope === "all-patients" 
              ? "bg-purple-200 text-purple-800" 
              : "bg-slate-200 text-slate-600"
          }`}
        >
          {allPatientsCount}
        </Badge>
      </button>
    </div>
  );
}

// Timeline View Component
function TimelineView({
  orders,
  isLoading,
}: {
  orders: LabOrderResponse[];
  isLoading: boolean;
}) {
  const [collapsedDates, setCollapsedDates] = useState<Set<string>>(new Set());

  const toggleDate = (dateStr: string) => {
    setCollapsedDates((prev) => {
      const next = new Set(prev);
      if (next.has(dateStr)) {
        next.delete(dateStr);
      } else {
        next.add(dateStr);
      }
      return next;
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-4">
            <Skeleton className="h-4 w-4 rounded-full mt-1" />
            <div className="flex-1 space-y-3">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-32 w-full rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-slate-500">
        <FlaskConical className="h-12 w-12 text-slate-300 mb-4" />
        <p className="text-lg font-medium">Chưa có phiếu xét nghiệm</p>
        <p className="text-sm text-slate-400">
          Các phiếu xét nghiệm sẽ hiển thị theo timeline tại đây
        </p>
      </div>
    );
  }

  const groupedOrders = groupOrdersByDate(orders);

  return (
    <div className="relative p-6">
      {/* Vertical Timeline Line */}
      <div className="absolute left-[29px] top-6 bottom-6 w-0.5 bg-gradient-to-b from-indigo-400 via-purple-500 to-pink-400 rounded-full" />

      <div className="space-y-8">
        {groupedOrders.map(([dateStr, dayOrders]) => {
          const isCollapsed = collapsedDates.has(dateStr);
          return (
            <div key={dateStr} className="relative">
              {/* Date Header - Clickable */}
              <button
                onClick={() => toggleDate(dateStr)}
                className="flex items-center gap-4 mb-4 w-full text-left group"
              >
                <div className="relative z-10 h-4 w-4 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 shadow-lg shadow-indigo-500/30 ring-4 ring-white" />
                <div className="flex items-center gap-2 flex-1">
                  <span className="font-semibold text-slate-800 capitalize group-hover:text-indigo-600 transition-colors">
                    {formatDateFull(dayOrders[0].orderDate)}
                  </span>
                  <Badge
                    variant="secondary"
                    className="bg-indigo-100 text-indigo-700"
                  >
                    {dayOrders.length} phiếu
                  </Badge>
                </div>
                <ChevronDown
                  className={`h-5 w-5 text-slate-400 group-hover:text-indigo-500 transition-all duration-300 ${
                    isCollapsed ? "-rotate-90" : ""
                  }`}
                />
              </button>

              {/* Order Cards for this date - Collapsible */}
              <div
                className={`ml-8 space-y-4 transition-all duration-300 ease-in-out overflow-hidden ${
                  isCollapsed ? "max-h-0 opacity-0" : "max-h-[5000px] opacity-100"
                }`}
              >
                {dayOrders.map((order) => (
                  <div
                    key={order.id}
                    className="relative overflow-hidden rounded-xl border bg-white shadow-sm transition-all duration-300 hover:shadow-lg hover:border-indigo-300 hover:-translate-y-0.5"
                  >
                    {/* Decorative gradient bar */}
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-indigo-400 via-purple-500 to-pink-400 rounded-l-xl" />

                    <div className="p-4 pl-6">
                      {/* Header Row */}
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div className="flex items-center gap-3">
                          {/* Patient Avatar */}
                          <div className="h-11 w-11 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold text-base shadow-md shadow-indigo-500/20 flex-shrink-0">
                            {order.patientName?.charAt(0)?.toUpperCase() || "P"}
                          </div>
                          <div>
                            <h3 className="font-semibold text-slate-900">
                              {order.patientName}
                            </h3>
                            <p className="text-sm text-indigo-600 font-mono">
                              {order.orderNumber}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {order.priority === "URGENT" && (
                            <Badge className="bg-orange-100 text-orange-700 border-0">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              {getPriorityLabel(order.priority)}
                            </Badge>
                          )}
                          <Badge
                            className={`${getOrderStatusColor(order.status)} border-0`}
                          >
                            {getOrderStatusLabel(order.status)}
                          </Badge>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="mb-4">
                        <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                          <span>Tiến độ xét nghiệm</span>
                          <span className="font-medium">
                            {order.completedTests}/{order.totalTests} tests
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2.5">
                          <div
                            className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 h-2.5 rounded-full transition-all duration-500"
                            style={{
                              width: `${
                                order.totalTests > 0
                                  ? (order.completedTests / order.totalTests) * 100
                                  : 0
                              }%`,
                            }}
                          />
                        </div>
                      </div>

                      {/* Test Results Preview */}
                      {order.results && order.results.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                            Danh sách xét nghiệm
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {order.results.slice(0, 4).map((result) => (
                              <Link
                                key={result.id}
                                href={`/doctor/lab-results/${result.id}`}
                                className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-100 hover:bg-indigo-50 hover:border-indigo-200 transition-all group"
                              >
                                <div
                                  className={`h-2.5 w-2.5 rounded-full flex-shrink-0 ${
                                    result.status === "COMPLETED"
                                      ? "bg-green-500"
                                      : result.status === "PROCESSING"
                                      ? "bg-yellow-500 animate-pulse"
                                      : "bg-slate-300"
                                  }`}
                                />
                                <span className="text-sm font-medium text-slate-700 group-hover:text-indigo-700 truncate flex-1">
                                  {result.labTestName}
                                </span>
                                {result.isAbnormal && (
                                  <AlertTriangle className="h-3.5 w-3.5 text-red-500 flex-shrink-0" />
                                )}
                                <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-indigo-500 transition-colors flex-shrink-0" />
                              </Link>
                            ))}
                          </div>
                          {order.results.length > 4 && (
                            <p className="text-xs text-slate-500 text-center mt-2">
                              + {order.results.length - 4} xét nghiệm khác
                            </p>
                          )}
                        </div>
                      )}

                      {/* Notes */}
                      {order.notes && (
                        <div className="mt-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
                          <p className="text-sm text-amber-800">
                            <strong>Ghi chú:</strong> {order.notes}
                          </p>
                        </div>
                      )}

                      {/* Footer - Time */}
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatTime(order.orderDate)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Component for expandable lab order row (table view)
function LabOrderRow({
  order,
  isExpanded,
  onToggle,
}: {
  order: LabOrderResponse;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  return (
    <>
      <TableRow
        className="hover:bg-slate-50/50 transition-colors cursor-pointer"
        onClick={onToggle}
      >
        <TableCell className="w-12">
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        </TableCell>
        <TableCell className="font-mono font-medium text-indigo-600">
          {order.orderNumber}
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-semibold text-xs">
              {order.patientName?.charAt(0)?.toUpperCase() || "P"}
            </div>
            <span className="font-medium text-slate-900">
              {order.patientName}
            </span>
          </div>
        </TableCell>
        <TableCell className="text-slate-600">
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            {formatDateShort(order.orderDate)}
          </div>
        </TableCell>
        <TableCell>
          <Badge className={`${getOrderStatusColor(order.status)} border-0`}>
            {getOrderStatusLabel(order.status)}
          </Badge>
        </TableCell>
        <TableCell>
          {order.priority === "URGENT" && (
            <Badge className="bg-orange-100 text-orange-700 border-0">
              <AlertTriangle className="h-3 w-3 mr-1" />
              {getPriorityLabel(order.priority)}
            </Badge>
          )}
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-2">
            <div className="w-24 bg-slate-200 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full transition-all"
                style={{
                  width: `${
                    order.totalTests > 0
                      ? (order.completedTests / order.totalTests) * 100
                      : 0
                  }%`,
                }}
              />
            </div>
            <span className="text-sm text-slate-600 font-medium">
              {order.completedTests}/{order.totalTests}
            </span>
          </div>
        </TableCell>
      </TableRow>

      {isExpanded && (
        <TableRow className="bg-slate-50/80">
          <TableCell colSpan={7} className="p-0">
            <div className="p-4 border-l-4 border-indigo-400 ml-4">
              <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                <FlaskConical className="h-4 w-4 text-indigo-500" />
                Chi tiết xét nghiệm ({order.results?.length || 0} tests)
              </h4>
              {order.results && order.results.length > 0 ? (
                <div className="grid gap-2">
                  {order.results.map((result) => (
                    <Link
                      key={result.id}
                      href={`/doctor/lab-results/${result.id}`}
                      className="flex items-center justify-between bg-white rounded-lg px-4 py-2.5 border hover:border-indigo-300 hover:bg-indigo-50/50 transition-all group cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`h-2 w-2 rounded-full ${
                            result.status === "COMPLETED"
                              ? "bg-green-500"
                              : result.status === "PROCESSING"
                              ? "bg-yellow-500"
                              : "bg-slate-300"
                          }`}
                        />
                        <span className="font-medium text-slate-800 group-hover:text-indigo-700 transition-colors">
                          {result.labTestName}
                        </span>
                        <span className="text-xs text-slate-500">
                          ({result.labTestCode})
                        </span>
                      </div>
                      <div className="flex items-center gap-4">
                        {result.resultValue && (
                          <span
                            className={`font-mono text-sm ${
                              result.isAbnormal
                                ? "text-red-600 font-semibold"
                                : "text-slate-700"
                            }`}
                          >
                            {result.resultValue}
                            {result.isAbnormal && (
                              <AlertTriangle className="h-3 w-3 inline ml-1 text-red-500" />
                            )}
                          </span>
                        )}
                        <Badge
                          variant="outline"
                          className={`text-xs ${
                            result.status === "COMPLETED"
                              ? "border-green-300 text-green-700"
                              : result.status === "PROCESSING"
                              ? "border-yellow-300 text-yellow-700"
                              : "border-slate-300 text-slate-600"
                          }`}
                        >
                          {result.status === "COMPLETED"
                            ? "Hoàn thành"
                            : result.status === "PROCESSING"
                            ? "Đang xử lý"
                            : "Chờ xử lý"}
                        </Badge>
                        <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-indigo-500 transition-colors" />
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500 italic">
                  Chưa có kết quả xét nghiệm.
                </p>
              )}
              {order.notes && (
                <div className="mt-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
                  <p className="text-sm text-amber-800">
                    <strong>Ghi chú:</strong> {order.notes}
                  </p>
                </div>
              )}
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

export default function DoctorLabOrdersPage() {
  const { data: myProfile, isLoading: isLoadingProfile } =
    useMyEmployeeProfile();

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [size] = useState(20);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<"table" | "timeline">("table");
  const [scopeFilter, setScopeFilter] = useState<ScopeFilter>("my-orders");

  const debouncedSearch = useDebounce(search, 300);
  
  // Fetch all orders (for "all patients" view, currently no specific filter available)
  const { data: allData, isLoading: isLoadingAll } = useLabOrders({ page, size });
  
  // Fetch orders by this doctor
  const { data: myOrdersData, isLoading: isLoadingMyOrders } = useLabOrdersByDoctor(
    myProfile?.id || ""
  );

  // Choose data source based on scope
  const orders = scopeFilter === "my-orders" 
    ? (myOrdersData || [])
    : (allData?.content || []);
  
  const isLoading = scopeFilter === "my-orders" ? isLoadingMyOrders : isLoadingAll;
  const totalPages = scopeFilter === "my-orders" ? 1 : (allData?.totalPages || 1);
  const totalElements = scopeFilter === "my-orders" 
    ? (myOrdersData?.length || 0) 
    : (allData?.totalElements || 0);

  // Filter orders client-side
  const filteredOrders = useMemo(() => {
    let result = orders;
    if (statusFilter !== "ALL") {
      result = result.filter(
        (o: LabOrderResponse) => o.status === statusFilter
      );
    }
    if (debouncedSearch) {
      const searchLower = debouncedSearch.toLowerCase();
      result = result.filter(
        (o: LabOrderResponse) =>
          o.patientName?.toLowerCase().includes(searchLower) ||
          o.orderNumber?.toLowerCase().includes(searchLower)
      );
    }
    return result;
  }, [orders, statusFilter, debouncedSearch]);

  // Calculate stats
  const stats = useMemo(() => {
    const ordered = filteredOrders.filter(
      (o: LabOrderResponse) => o.status === "ORDERED"
    ).length;
    const inProgress = filteredOrders.filter(
      (o: LabOrderResponse) => o.status === "IN_PROGRESS"
    ).length;
    const completed = filteredOrders.filter(
      (o: LabOrderResponse) => o.status === "COMPLETED"
    ).length;
    return { total: filteredOrders.length, ordered, inProgress, completed };
  }, [filteredOrders]);

  const toggleRow = (id: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  if (isLoadingProfile) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Enhanced Gradient Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-500 to-pink-500 p-6 text-white shadow-lg">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
        <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-white/5" />

        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="rounded-xl bg-white/20 p-3 backdrop-blur-sm">
              <FlaskConical className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                Phiếu Xét Nghiệm
              </h1>
              <p className="mt-1 text-indigo-100">
                Quản lý các phiếu xét nghiệm đã chỉ định
              </p>
            </div>
          </div>

          <div className="hidden md:flex gap-6">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-indigo-100 text-sm">
                <Activity className="h-4 w-4" />
                Tổng số
              </div>
              <div className="text-2xl font-bold">{stats.total}</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-indigo-100 text-sm">
                <FileText className="h-4 w-4" />
                Đã yêu cầu
              </div>
              <div className="text-2xl font-bold">{stats.ordered}</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-indigo-100 text-sm">
                <Clock className="h-4 w-4" />
                Đang XL
              </div>
              <div className="text-2xl font-bold">{stats.inProgress}</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-indigo-100 text-sm">
                <CheckCircle2 className="h-4 w-4" />
                Hoàn thành
              </div>
              <div className="text-2xl font-bold">{stats.completed}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Scope Toggle - Beautiful Card */}
      <Card className="p-4 border-2 border-indigo-100 shadow-sm bg-gradient-to-r from-white to-indigo-50/30">
        <div className="flex items-center gap-4">
          <span className="font-semibold text-sm text-indigo-600">Phạm vi hiển thị:</span>
          <div className="flex-1">
            <ScopeToggle
              scope={scopeFilter}
              onChange={(s) => {
                setScopeFilter(s);
                setPage(0);
              }}
              myOrdersCount={myOrdersData?.length || 0}
              allPatientsCount={allData?.totalElements || 0}
            />
          </div>
        </div>
        <p className="text-xs text-slate-500 mt-2">
          {scopeFilter === "my-orders" 
            ? "Chỉ hiển thị các phiếu xét nghiệm bạn đã chỉ định"
            : "Hiển thị tất cả phiếu XN để xem lịch sử của bệnh nhân từ các bác sĩ khác"}
        </p>
      </Card>

      {/* Filter Toolbar with View Toggle */}
      <div className="flex flex-wrap items-center gap-3 rounded-lg bg-slate-50 p-3 border">
        {/* View Toggle */}
        <ViewToggle view={viewMode} onChange={setViewMode} />

        {/* Status Pills */}
        <div className="flex gap-2">
          {STATUS_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => {
                setStatusFilter(option.value);
                setPage(0);
              }}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                statusFilter === option.value
                  ? "bg-indigo-600 text-white shadow-md"
                  : "bg-white text-slate-600 hover:bg-slate-100 border"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative flex-1 min-w-[200px] ml-auto">
          <Search className="text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
          <Input
            placeholder="Tìm theo tên bệnh nhân hoặc mã phiếu..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            className="h-9 rounded-lg pl-9 bg-white"
          />
        </div>
      </div>

      {/* Content Card */}
      <Card className="shadow-sm overflow-hidden">
        <CardContent className="p-0">
          {viewMode === "table" ? (
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead className="w-12" />
                  <TableHead>Mã phiếu</TableHead>
                  <TableHead>Bệnh nhân</TableHead>
                  <TableHead>Ngày tạo</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Ưu tiên</TableHead>
                  <TableHead>Tiến độ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-12 text-center">
                      <span className="inline-flex items-center gap-2 text-muted-foreground">
                        <Spinner size="sm" /> Đang tải...
                      </span>
                    </TableCell>
                  </TableRow>
                ) : filteredOrders.length > 0 ? (
                  filteredOrders.map((order: LabOrderResponse) => (
                    <LabOrderRow
                      key={order.id}
                      order={order}
                      isExpanded={expandedRows.has(order.id)}
                      onToggle={() => toggleRow(order.id)}
                    />
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="py-12 text-center text-slate-500"
                    >
                      <div className="flex flex-col items-center gap-2">
                        <FlaskConical className="h-10 w-10 text-slate-300" />
                        <span>Không có phiếu xét nghiệm nào</span>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          ) : (
            <TimelineView orders={filteredOrders} isLoading={isLoading} />
          )}

          {!isLoading && totalElements > 0 && scopeFilter === "all-patients" && (
            <div className="px-6 py-4 border-t">
              <DataTablePagination
                currentPage={page}
                totalPages={totalPages}
                totalElements={totalElements}
                pageSize={size}
                onPageChange={setPage}
                infoText={`Hiển thị ${page * size + 1}-${Math.min(
                  (page + 1) * size,
                  totalElements
                )} / ${totalElements}`}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

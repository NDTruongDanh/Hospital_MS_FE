"use client";

import { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { enUS } from "date-fns/locale";
import {
  Search,
  Eye,
  Clock,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  ClipboardList,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ListPageHeader } from "@/components/ui/list-page-header";
import { FilterPills } from "@/components/ui/filter-pills";
import { useLabOrders } from "@/hooks/queries/useLabOrder";
import {
  getOrderStatusLabel,
  getOrderStatusColor,
  getPriorityLabel,
  getPriorityColorOrder,
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
  const totalElements = data?.totalElements || 0;

  const filteredOrders = labOrders.filter((order) => {
    const matchesStatus =
      statusFilter === "ALL" || order.status === statusFilter;
    const matchesSearch =
      search === "" ||
      order.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
      order.patientName.toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // Stats for FilterPills
  const orderedCount = labOrders.filter((o) => o.status === "ORDERED").length;
  const inProgressCount = labOrders.filter(
    (o) => o.status === "IN_PROGRESS"
  ).length;
  const completedCount = labOrders.filter(
    (o) => o.status === "COMPLETED"
  ).length;
  const cancelledCount = labOrders.filter(
    (o) => o.status === "CANCELLED"
  ).length;

  const formatDate = (dateString: string) =>
    format(new Date(dateString), "MM/dd/yyyy HH:mm", { locale: enUS });
  const getProgressPercent = (completed: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((completed / total) * 100);
  };

  return (
    <div className="space-y-6">
      {/* Enhanced Header */}
      <ListPageHeader
        title="Lab Orders"
        description="Manage lab test orders and track their progress"
        theme="teal"
        icon={<ClipboardList className="h-6 w-6 text-white" />}
        stats={[
          { label: "Total Orders", value: totalElements },
          { label: "In Progress", value: inProgressCount },
          { label: "Completed", value: completedCount },
        ]}
        secondaryActions={
          <Button
            variant="outline"
            onClick={() => refetch()}
            disabled={isFetching}
            className="bg-white/10 border-white/20 text-white hover:bg-white/20"
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${isFetching ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        }
      />

      {/* Quick Filter Pills */}
      <FilterPills
        filters={[
          { id: "ALL", label: "All", count: labOrders.length },
          {
            id: "ORDERED",
            label: "Ordered",
            count: orderedCount,
            countColor: "warning",
          },
          {
            id: "IN_PROGRESS",
            label: "In Progress",
            count: inProgressCount,
            countColor: "warning",
          },
          {
            id: "COMPLETED",
            label: "Completed",
            count: completedCount,
            countColor: "success",
          },
          {
            id: "CANCELLED",
            label: "Cancelled",
            count: cancelledCount,
            countColor: cancelledCount > 0 ? "danger" : "default",
          },
        ]}
        activeFilter={statusFilter}
        onFilterChange={(id) => {
          setStatusFilter(id);
          setPage(0);
        }}
      />

      {/* Filters Row */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by order number, patient name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Table Card */}
      <Card className="border-2 border-slate-200 shadow-md rounded-xl">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <ClipboardList className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No lab orders found</h3>
              <p className="text-muted-foreground">
                {search || statusFilter !== "ALL"
                  ? "Try adjusting your filters"
                  : "Lab orders will appear here when created"}
              </p>
            </div>
          ) : (
            <div className="border-t">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order No.</TableHead>
                    <TableHead>Patient</TableHead>
                    <TableHead>Ordering Doctor</TableHead>
                    <TableHead>Created Date</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Priority</TableHead>
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
                            value={getProgressPercent(
                              order.completedTests,
                              order.totalTests
                            )}
                            className="h-2 flex-1"
                          />
                          <span className="text-sm text-muted-foreground whitespace-nowrap">
                            {order.completedTests}/{order.totalTests}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getOrderStatusColor(order.status)}>
                          {order.status === "COMPLETED" && (
                            <CheckCircle className="h-3 w-3 mr-1" />
                          )}
                          {order.status === "IN_PROGRESS" && (
                            <Clock className="h-3 w-3 mr-1" />
                          )}
                          {order.status === "CANCELLED" && (
                            <AlertTriangle className="h-3 w-3 mr-1" />
                          )}
                          {getOrderStatusLabel(order.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={getPriorityColorOrder(order.priority)}
                        >
                          {getPriorityLabel(order.priority)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Link href={`/admin/lab-orders/${order.id}`}>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex justify-center gap-2 p-4 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
              >
                Previous
              </Button>
              <span className="flex items-center px-4 text-sm">
                Page {page + 1} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import {
  FlaskConical,
  Clock,
  CheckCircle,
  AlertTriangle,
  ChevronRight,
  ChevronDown,
  RefreshCw,
  FileText,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useLabOrdersByExam } from "@/hooks/queries/useLabOrder";
import {
  getOrderStatusLabel,
  getOrderStatusColor,
  getPriorityLabel,
  LabOrderResponse,
} from "@/services/lab-order.service";
import { ResultStatus } from "@/services/lab.service";

interface LabOrdersSectionProps {
  medicalExamId: string;
  basePath?: string; // Base path for lab order detail links (default: /admin/lab-orders)
}

const resultStatusConfig: Record<ResultStatus, { label: string; icon: React.ElementType; color: string }> = {
  PENDING: { label: "Chờ xử lý", icon: Clock, color: "bg-yellow-100 text-yellow-800" },
  PROCESSING: { label: "Đang thực hiện", icon: Clock, color: "bg-blue-100 text-blue-800" },
  COMPLETED: { label: "Hoàn thành", icon: CheckCircle, color: "bg-green-100 text-green-800" },
  CANCELLED: { label: "Đã hủy", icon: AlertTriangle, color: "bg-red-100 text-red-800" },
};

export function LabOrdersSection({ 
  medicalExamId, 
  basePath = "/admin/lab-orders" 
}: LabOrdersSectionProps) {
  const { data: labOrders, isLoading, refetch, isFetching } = useLabOrdersByExam(medicalExamId);
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());

  const toggleOrder = (orderId: string) => {
    setExpandedOrders(prev => {
      const next = new Set(prev);
      if (next.has(orderId)) {
        next.delete(orderId);
      } else {
        next.add(orderId);
      }
      return next;
    });
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "-";
    return format(new Date(dateString), "dd/MM/yyyy HH:mm", { locale: vi });
  };

  const getProgressPercent = (order: LabOrderResponse) => {
    if (order.totalTests === 0) return 0;
    return Math.round((order.completedTests / order.totalTests) * 100);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  const hasOrders = labOrders && labOrders.length > 0;
  const totalTests = labOrders?.reduce((sum, o) => sum + o.totalTests, 0) || 0;
  const completedTests = labOrders?.reduce((sum, o) => sum + o.completedTests, 0) || 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-teal-500" />
            Phiếu Xét nghiệm
          </CardTitle>
          <CardDescription>
            {hasOrders ? (
              <>
                {labOrders.length} phiếu • {completedTests}/{totalTests} xét nghiệm hoàn thành
              </>
            ) : (
              "Chưa có phiếu xét nghiệm nào"
            )}
          </CardDescription>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => refetch()}
          disabled={isFetching}
        >
          <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
        </Button>
      </CardHeader>
      <CardContent>
        {hasOrders ? (
          <div className="space-y-4">
            {labOrders.map((order) => {
              const isExpanded = expandedOrders.has(order.id);
              const progressPercent = getProgressPercent(order);

              return (
                <Collapsible
                  key={order.id}
                  open={isExpanded}
                  onOpenChange={() => toggleOrder(order.id)}
                >
                  <div className="border rounded-lg overflow-hidden">
                    {/* Order Header */}
                    <CollapsibleTrigger asChild>
                      <div className="flex items-center justify-between p-4 hover:bg-muted/50 cursor-pointer transition-colors">
                        <div className="flex items-center gap-4 flex-1">
                          <div className="flex items-center gap-2">
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            )}
                            <FlaskConical className="h-5 w-5 text-teal-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-mono font-medium text-sm">
                                {order.orderNumber}
                              </span>
                              <Badge className={getOrderStatusColor(order.status)}>
                                {getOrderStatusLabel(order.status)}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-3">
                              <Progress value={progressPercent} className="h-2 w-32" />
                              <span className="text-sm text-muted-foreground">
                                {order.completedTests}/{order.totalTests}
                              </span>
                            </div>
                          </div>
                        </div>
                        <Link 
                          href={`${basePath}/${order.id}`}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Button variant="outline" size="sm">
                            Chi tiết
                          </Button>
                        </Link>
                      </div>
                    </CollapsibleTrigger>

                    {/* Order Results (Expanded) */}
                    <CollapsibleContent>
                      <div className="border-t bg-muted/30 p-4">
                        <div className="space-y-2">
                          {order.results?.map((result) => {
                            const statusInfo = resultStatusConfig[result.status as ResultStatus];
                            const StatusIcon = statusInfo?.icon || Clock;

                            return (
                              <div
                                key={result.id}
                                className="flex items-center justify-between p-3 bg-white rounded-lg border"
                              >
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-sm">
                                      {result.labTestName}
                                    </span>
                                    <Badge 
                                      className={statusInfo?.color || ""} 
                                      variant="secondary"
                                    >
                                      <StatusIcon className="h-3 w-3 mr-1" />
                                      {statusInfo?.label || result.status}
                                    </Badge>
                                    {result.isAbnormal && (
                                      <Badge variant="destructive">Bất thường</Badge>
                                    )}
                                  </div>
                                  {result.resultValue && (
                                    <p className="text-sm text-muted-foreground mt-1">
                                      Kết quả: <span className="font-medium text-foreground">{result.resultValue}</span>
                                    </p>
                                  )}
                                </div>
                                <span className="text-xs text-muted-foreground">
                                  {result.labTestCode}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                        {order.notes && (
                          <div className="mt-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                            <p className="text-sm text-yellow-800">
                              <strong>Ghi chú:</strong> {order.notes}
                            </p>
                          </div>
                        )}
                      </div>
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <FlaskConical className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Chưa có phiếu xét nghiệm nào</p>
            <p className="text-sm">Sử dụng nút "Order Xét nghiệm" để tạo phiếu mới</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

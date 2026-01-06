"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import {
  ArrowLeft,
  ClipboardList,
  FlaskConical,
  Clock,
  CheckCircle,
  AlertTriangle,
  User,
  Stethoscope,
  Calendar,
  FileText,
  Image,
  ChevronRight,
  Printer,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { StatsSummaryBar } from "@/components/ui/stats-summary-bar";
import { InfoItem, InfoGrid } from "@/components/ui/info-item";
import { useQuery } from "@tanstack/react-query";
import {
  getLabOrder,
  LabOrderResponse,
  LabTestResultInOrder,
  getOrderStatusLabel,
  getOrderStatusColor,
  getPriorityLabel,
  getPriorityColorOrder,
} from "@/services/lab-order.service";

const resultStatusConfig: Record<
  string,
  { label: string; icon: React.ElementType; color: string }
> = {
  PENDING: { label: "Chờ xử lý", icon: Clock, color: "bg-yellow-100 text-yellow-800" },
  PROCESSING: { label: "Đang thực hiện", icon: Clock, color: "bg-blue-100 text-blue-800" },
  COMPLETED: { label: "Hoàn thành", icon: CheckCircle, color: "bg-green-100 text-green-800" },
  CANCELLED: { label: "Đã hủy", icon: AlertTriangle, color: "bg-red-100 text-red-800" },
};

export default function PatientLabOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const {
    data: order,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["labOrder", id],
    queryFn: () => getLabOrder(id),
    enabled: !!id,
  });

  const formatDate = (dateString?: string) => {
    if (!dateString) return "-";
    return format(new Date(dateString), "dd/MM/yyyy HH:mm", { locale: vi });
  };

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" variant="muted" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="container mx-auto py-6">
        <Card className="p-8 text-center">
          <ClipboardList className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-bold tracking-tight text-destructive">
            Không tìm thấy phiếu xét nghiệm
          </h2>
          <p className="text-muted-foreground mt-2">
            Phiếu bạn đang tìm không tồn tại hoặc bạn không có quyền xem.
          </p>
          <Button
            onClick={() => router.push("/patient/lab-orders")}
            className="mt-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Quay lại danh sách
          </Button>
        </Card>
      </div>
    );
  }

  const StatusIcon =
    order.status === "COMPLETED"
      ? CheckCircle
      : order.status === "CANCELLED"
      ? AlertTriangle
      : Clock;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 p-6 text-white overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-white" />
          <div className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full bg-white" />
        </div>

        <div className="relative flex items-start justify-between gap-6">
          <div className="flex items-center gap-5">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push("/patient/lab-orders")}
              className="text-white/90 hover:text-white hover:bg-white/20 shrink-0"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>

            <div className="h-16 w-16 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <ClipboardList className="h-8 w-8 text-white" />
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight">
                  Phiếu #{order.orderNumber}
                </h1>
                <Badge
                  className={`${getOrderStatusColor(order.status)} border-0`}
                  variant="secondary"
                >
                  <StatusIcon className="h-3 w-3 mr-1" />
                  {getOrderStatusLabel(order.status)}
                </Badge>
                {order.priority === "URGENT" && (
                  <Badge
                    className={`${getPriorityColorOrder(order.priority)} border-0`}
                    variant="secondary"
                  >
                    {getPriorityLabel(order.priority)}
                  </Badge>
                )}
              </div>
              <p className="text-white/80 text-sm font-medium">
                {formatDate(order.orderDate)} • {order.totalTests} xét nghiệm
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            className="bg-white/10 border-white/30 text-white hover:bg-white/20"
          >
            <Printer className="mr-2 h-4 w-4" />
            In phiếu
          </Button>
        </div>
      </div>

      {/* Stats */}
      <StatsSummaryBar
        stats={[
          {
            label: "Tổng xét nghiệm",
            value: order.totalTests.toString(),
            icon: <FlaskConical className="h-5 w-5" />,
            color: "teal",
          },
          {
            label: "Hoàn thành",
            value: order.completedTests.toString(),
            icon: <CheckCircle className="h-5 w-5" />,
            color: "emerald",
          },
          {
            label: "Đang chờ",
            value: order.pendingTests.toString(),
            icon: <Clock className="h-5 w-5" />,
            color: order.pendingTests > 0 ? "amber" : "slate",
          },
          ...(order.orderingDoctorName ? [{
            label: "Bác sĩ chỉ định",
            value: order.orderingDoctorName,
            icon: <Stethoscope className="h-5 w-5" />,
            color: "violet" as const,
          }] : []),
        ]}
      />

      <div className="grid gap-6 md:grid-cols-3">
        {/* Main Content - 2 columns */}
        <div className="md:col-span-2 space-y-6">
          {/* Lab Results */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FlaskConical className="h-5 w-5 text-teal-500" />
                Danh sách Xét nghiệm ({order.results.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {order.results.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FlaskConical className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Chưa có xét nghiệm nào trong phiếu này</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {order.results.map((result) => {
                    const statusInfo = resultStatusConfig[result.status];
                    const ResultStatusIcon = statusInfo?.icon || Clock;

                    return (
                      <Link
                        key={result.id}
                        href={`/patient/lab-results/${result.id}`}
                        className="block"
                      >
                        <div className="flex items-center justify-between p-4 rounded-lg border hover:bg-accent/50 transition-colors">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium truncate">
                                {result.labTestName}
                              </span>
                              <Badge
                                className={statusInfo?.color || ""}
                                variant="secondary"
                              >
                                <ResultStatusIcon className="h-3 w-3 mr-1" />
                                {statusInfo?.label || result.status}
                              </Badge>
                              {result.isAbnormal && (
                                <Badge variant="destructive">Bất thường</Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span>Mã: {result.labTestCode}</span>
                              {result.completedAt && (
                                <>
                                  <span>•</span>
                                  <span>{formatDate(result.completedAt)}</span>
                                </>
                              )}
                            </div>
                            {result.resultValue && (
                              <p className="text-sm mt-1 text-foreground">
                                Kết quả:{" "}
                                <span className="font-medium">
                                  {result.resultValue}
                                </span>
                              </p>
                            )}
                          </div>
                          <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notes */}
          {order.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-slate-500" />
                  Ghi chú
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground bg-muted p-4 rounded-lg">
                  {order.notes}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Order Info */}
          <div className="detail-section-card">
            <div className="detail-section-card-header">
              <ClipboardList className="h-4 w-4" />
              <h3>Thông tin phiếu</h3>
            </div>
            <div className="detail-section-card-content">
              <InfoGrid columns={1}>
                <InfoItem
                  icon={<Calendar className="h-4 w-4" />}
                  label="Ngày tạo"
                  value={formatDate(order.orderDate)}
                  color="teal"
                />
                {order.orderingDoctorName && (
                  <InfoItem
                    icon={<Stethoscope className="h-4 w-4" />}
                    label="Bác sĩ chỉ định"
                    value={order.orderingDoctorName}
                    color="violet"
                  />
                )}
                <InfoItem
                  icon={<User className="h-4 w-4" />}
                  label="Bệnh nhân"
                  value={order.patientName}
                  color="sky"
                />
              </InfoGrid>
            </div>
          </div>

          {/* Status Progress */}
          <Card>
            <CardHeader className="py-3 px-4 bg-slate-50 border-b">
              <CardTitle className="text-sm font-medium">
                Tiến trình xét nghiệm
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Hoàn thành</span>
                  <span className="font-medium">
                    {order.completedTests}/{order.totalTests}
                  </span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2.5">
                  <div
                    className="bg-teal-500 h-2.5 rounded-full transition-all"
                    style={{
                      width: `${
                        order.totalTests > 0
                          ? (order.completedTests / order.totalTests) * 100
                          : 0
                      }%`,
                    }}
                  />
                </div>
                {order.pendingTests > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Còn {order.pendingTests} xét nghiệm đang chờ kết quả
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Audit Info */}
          <Card>
            <CardHeader className="py-3 px-4 bg-slate-50 border-b">
              <CardTitle className="text-sm font-medium">
                Thông tin cập nhật
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  Tạo lúc
                </p>
                <p className="text-sm">{formatDate(order.createdAt)}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  Cập nhật lần cuối
                </p>
                <p className="text-sm">{formatDate(order.updatedAt)}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

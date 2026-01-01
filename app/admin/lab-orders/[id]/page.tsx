"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import {
  ArrowLeft,
  FlaskConical,
  User,
  Stethoscope,
  Clock,
  CheckCircle,
  AlertTriangle,
  Edit,
  Save,
  X,
  Upload,
  ImageIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useLabOrder, useUpdateLabOrder } from "@/hooks/queries/useLabOrder";
import { useUpdateLabResult } from "@/hooks/queries/useLab";
import {
  getOrderStatusLabel,
  getOrderStatusColor,
  getPriorityLabel,
  getPriorityColorOrder,
  LabTestResultInOrder,
} from "@/services/lab-order.service";
import { ResultStatus } from "@/services/lab.service";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

const statusConfig: Record<ResultStatus, { label: string; icon: React.ElementType; color: string }> = {
  PENDING: { label: "Chờ xử lý", icon: Clock, color: "bg-yellow-100 text-yellow-800" },
  PROCESSING: { label: "Đang thực hiện", icon: Clock, color: "bg-blue-100 text-blue-800" },
  COMPLETED: { label: "Hoàn thành", icon: CheckCircle, color: "bg-green-100 text-green-800" },
  CANCELLED: { label: "Đã hủy", icon: AlertTriangle, color: "bg-red-100 text-red-800" },
};

export default function LabOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { user } = useAuth();

  const { data: order, isLoading } = useLabOrder(id);
  const updateResultMutation = useUpdateLabResult();

  // Edit result dialog
  const [editingResult, setEditingResult] = useState<LabTestResultInOrder | null>(null);
  const [editForm, setEditForm] = useState({
    status: "PENDING" as ResultStatus,
    resultValue: "",
    isAbnormal: false,
    interpretation: "",
    notes: "",
  });

  const formatDate = (dateString?: string) => {
    if (!dateString) return "-";
    return format(new Date(dateString), "dd/MM/yyyy HH:mm", { locale: vi });
  };

  const handleOpenEdit = (result: LabTestResultInOrder) => {
    setEditingResult(result);
    setEditForm({
      status: result.status as ResultStatus,
      resultValue: result.resultValue || "",
      isAbnormal: result.isAbnormal,
      interpretation: result.interpretation || "",
      notes: result.notes || "",
    });
  };

  const handleSaveResult = async () => {
    if (!editingResult) return;
    try {
      await updateResultMutation.mutateAsync({
        id: editingResult.id,
        data: editForm,
      });
      toast.success("Đã cập nhật kết quả xét nghiệm");
      setEditingResult(null);
    } catch {
      toast.error("Không thể cập nhật kết quả");
    }
  };

  const getProgressPercent = () => {
    if (!order || order.totalTests === 0) return 0;
    return Math.round((order.completedTests / order.totalTests) * 100);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-12">
        <FlaskConical className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
        <h2 className="text-xl font-semibold mb-2">Không tìm thấy phiếu xét nghiệm</h2>
        <Link href="/admin/lab-orders">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Quay lại danh sách
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <Link href="/admin/lab-orders">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <FlaskConical className="h-6 w-6 text-teal-500" />
              Phiếu {order.orderNumber}
            </h1>
            <p className="text-muted-foreground">
              Tạo ngày {formatDate(order.orderDate)}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Badge className={getOrderStatusColor(order.status)}>
            {getOrderStatusLabel(order.status)}
          </Badge>
          <Badge className={getPriorityColorOrder(order.priority)}>
            {getPriorityLabel(order.priority)}
          </Badge>
        </div>
      </div>

      {/* Progress */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">Tiến độ hoàn thành</span>
                <span className="text-sm text-muted-foreground">
                  {order.completedTests}/{order.totalTests} xét nghiệm
                </span>
              </div>
              <Progress value={getProgressPercent()} className="h-3" />
            </div>
            <div className="text-3xl font-bold text-teal-600">
              {getProgressPercent()}%
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: Test Results */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Kết quả xét nghiệm</CardTitle>
              <CardDescription>
                {order.totalTests} xét nghiệm trong phiếu này
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {order.results?.map((result) => {
                  const statusInfo = statusConfig[result.status as ResultStatus];
                  const StatusIcon = statusInfo?.icon || Clock;

                  return (
                    <div
                      key={result.id}
                      className="border rounded-lg p-4 hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-medium">{result.labTestName}</span>
                            <Badge className={statusInfo?.color || ""}>
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {statusInfo?.label || result.status}
                            </Badge>
                            {result.isAbnormal && (
                              <Badge variant="destructive">Bất thường</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            Mã: {result.labTestCode}
                          </p>

                          {result.resultValue && (
                            <div className="bg-muted/50 p-3 rounded-lg mb-2">
                              <p className="text-sm text-muted-foreground">Kết quả:</p>
                              <p className="font-medium">{result.resultValue}</p>
                            </div>
                          )}

                          {result.interpretation && (
                            <div className="mb-2">
                              <p className="text-sm text-muted-foreground">Nhận định:</p>
                              <p className="text-sm">{result.interpretation}</p>
                            </div>
                          )}

                          <div className="text-xs text-muted-foreground">
                            {result.performedBy && <span>Thực hiện: {result.performedBy}</span>}
                            {result.completedAt && (
                              <span className="ml-4">
                                Hoàn thành: {formatDate(result.completedAt)}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        {(user?.role === "DOCTOR" || user?.role === "NURSE" || user?.role === "ADMIN") && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenEdit(result)}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Cập nhật
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Order Info */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Thông tin phiếu</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-muted-foreground">Bệnh nhân</Label>
                <div className="flex items-center gap-2 mt-1">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{order.patientName}</span>
                </div>
              </div>
              <Separator />
              <div>
                <Label className="text-muted-foreground">Bác sĩ chỉ định</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Stethoscope className="h-4 w-4 text-muted-foreground" />
                  <span>{order.orderingDoctorName}</span>
                </div>
              </div>
              <Separator />
              <div>
                <Label className="text-muted-foreground">Ngày tạo</Label>
                <p>{formatDate(order.createdAt)}</p>
              </div>
              {order.notes && (
                <>
                  <Separator />
                  <div>
                    <Label className="text-muted-foreground">Ghi chú</Label>
                    <p className="text-sm">{order.notes}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Link to Medical Exam */}
          <Card>
            <CardContent className="pt-6">
              <Link href={`/admin/exams/${order.medicalExamId}`}>
                <Button variant="outline" className="w-full">
                  Xem phiếu khám bệnh
                  <ArrowLeft className="h-4 w-4 ml-2 rotate-180" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Result Dialog */}
      <Dialog open={!!editingResult} onOpenChange={() => setEditingResult(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cập nhật kết quả xét nghiệm</DialogTitle>
            <DialogDescription>
              {editingResult?.labTestName} ({editingResult?.labTestCode})
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Trạng thái</Label>
              <Select
                value={editForm.status}
                onValueChange={(v) => setEditForm({ ...editForm, status: v as ResultStatus })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PENDING">Chờ xử lý</SelectItem>
                  <SelectItem value="PROCESSING">Đang thực hiện</SelectItem>
                  <SelectItem value="COMPLETED">Hoàn thành</SelectItem>
                  <SelectItem value="CANCELLED">Đã hủy</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Giá trị kết quả</Label>
              <Input
                value={editForm.resultValue}
                onChange={(e) => setEditForm({ ...editForm, resultValue: e.target.value })}
                placeholder="Nhập giá trị kết quả..."
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                checked={editForm.isAbnormal}
                onCheckedChange={(v) => setEditForm({ ...editForm, isAbnormal: v })}
              />
              <Label>Kết quả bất thường</Label>
            </div>

            <div className="space-y-2">
              <Label>Nhận định</Label>
              <Textarea
                value={editForm.interpretation}
                onChange={(e) => setEditForm({ ...editForm, interpretation: e.target.value })}
                placeholder="Nhận định của bác sĩ/kỹ thuật viên..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Ghi chú</Label>
              <Textarea
                value={editForm.notes}
                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                placeholder="Ghi chú thêm..."
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingResult(null)}>
              <X className="h-4 w-4 mr-2" />
              Hủy
            </Button>
            <Button onClick={handleSaveResult} disabled={updateResultMutation.isPending}>
              <Save className="h-4 w-4 mr-2" />
              Lưu
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

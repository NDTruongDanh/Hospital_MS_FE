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
  FileText,
  Calendar,
  ExternalLink,
  Printer,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
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
import { useLabOrder } from "@/hooks/queries/useLabOrder";
import { useUpdateLabResult } from "@/hooks/queries/useLab";
import {
  getOrderStatusLabel,
  getOrderStatusColor,
  getPriorityLabel,
  getPriorityColorOrder,
  LabTestResultInOrder,
} from "@/services/lab-order.service";
import { ResultStatus, DiagnosticImage } from "@/services/lab.service";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { ImageUploadDialog, ImageGallery } from "@/components/lab/ImageUploadDialog";

const statusConfig: Record<ResultStatus, { label: string; icon: React.ElementType; color: string; bgColor: string }> = {
  PENDING: { label: "Chờ xử lý", icon: Clock, color: "text-amber-700", bgColor: "bg-amber-50 border-amber-200" },
  PROCESSING: { label: "Đang thực hiện", icon: Clock, color: "text-blue-700", bgColor: "bg-blue-50 border-blue-200" },
  COMPLETED: { label: "Hoàn thành", icon: CheckCircle, color: "text-emerald-700", bgColor: "bg-emerald-50 border-emerald-200" },
  CANCELLED: { label: "Đã hủy", icon: AlertTriangle, color: "text-red-700", bgColor: "bg-red-50 border-red-200" },
};

// Avatar color generator
function getAvatarColor(name: string): string {
  const colors = [
    "from-cyan-400 to-teal-500",
    "from-blue-400 to-indigo-500",
    "from-purple-400 to-pink-500",
    "from-rose-400 to-red-500",
    "from-orange-400 to-amber-500",
    "from-emerald-400 to-green-500",
  ];
  const index = name.charCodeAt(0) % colors.length;
  return colors[index];
}

export default function AdminLabOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { user } = useAuth();

  const { data: order, isLoading, refetch } = useLabOrder(id);
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
        <Skeleton className="h-40 w-full rounded-2xl" />
        <Skeleton className="h-24 w-full rounded-xl" />
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Skeleton className="h-80 w-full rounded-xl" />
          </div>
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] py-12">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-rose-500 to-red-500 p-8 text-white text-center max-w-md">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute -top-16 -right-16 w-48 h-48 bg-white rounded-full" />
          </div>
          <div className="relative z-10">
            <div className="h-16 w-16 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-4">
              <FlaskConical className="h-8 w-8" />
            </div>
            <h2 className="text-xl font-bold mb-2">Không tìm thấy phiếu xét nghiệm</h2>
            <p className="text-white/80 mb-6">
              Phiếu xét nghiệm bạn tìm không tồn tại hoặc đã bị xóa.
            </p>
            <Button
              variant="outline"
              className="bg-white/10 border-white/30 text-white hover:bg-white/20"
              onClick={() => router.back()}
            >
              Quay lại
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const completedPercent = getProgressPercent();

  return (
    <div className="space-y-6">
      {/* Gradient Header */}
      <div className="relative rounded-2xl bg-gradient-to-r from-teal-600 via-cyan-500 to-blue-500 p-6 text-white overflow-hidden shadow-xl">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-white" />
          <div className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full bg-white" />
        </div>

        <div className="relative flex flex-col lg:flex-row lg:items-start justify-between gap-6">
          <div className="flex items-start gap-5">
            {/* Back button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
              className="text-white/90 hover:text-white hover:bg-white/20 shrink-0 mt-1"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>

            {/* Icon */}
            <div className="h-16 w-16 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <FlaskConical className="h-8 w-8 text-white" />
            </div>

            {/* Title & Meta */}
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight">
                  Phiếu Xét nghiệm #{order.orderNumber}
                </h1>
                <Badge className={`${getOrderStatusColor(order.status)} border font-medium`}>
                  {getOrderStatusLabel(order.status)}
                </Badge>
                <Badge className={`${getPriorityColorOrder(order.priority)} border font-medium`}>
                  {getPriorityLabel(order.priority)}
                </Badge>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-white/80 text-sm">
                <span className="flex items-center gap-1.5">
                  <User className="h-4 w-4" />
                  {order.patientName}
                </span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  {formatDate(order.orderDate)}
                </span>
                <span className="flex items-center gap-1.5">
                  <Stethoscope className="h-4 w-4" />
                  BS. {order.orderingDoctorName}
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-2 shrink-0 ml-auto lg:ml-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.print()}
              className="bg-white/10 border-2 border-white/40 text-white hover:bg-white/20 font-medium"
            >
              <Printer className="mr-2 h-4 w-4" />
              In phiếu
            </Button>
            <Button
              size="sm"
              asChild
              className="bg-white text-teal-600 hover:bg-white/90 font-medium border-2 border-white"
            >
              <Link href={`/admin/exams/${order.medicalExamId}`}>
                <FileText className="h-4 w-4 mr-2" />
                Xem phiếu khám
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Progress Card */}
      <Card className="overflow-hidden border-0 shadow-lg">
        <div className="h-1.5 bg-gradient-to-r from-teal-400 via-cyan-500 to-blue-500" />
        <CardContent className="p-6">
          <div className="flex items-center gap-6">
            <div className="flex-1">
              <div className="flex justify-between mb-3">
                <span className="text-sm font-medium text-slate-700">Tiến độ hoàn thành</span>
                <span className="text-sm text-slate-500">
                  {order.completedTests}/{order.totalTests} xét nghiệm
                </span>
              </div>
              <Progress value={completedPercent} className="h-3" />
            </div>
            <div className={`text-4xl font-bold ${completedPercent === 100 ? "text-emerald-600" : "text-teal-600"}`}>
              {completedPercent}%
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: Test Results */}
        <div className="lg:col-span-2">
          <Card className="overflow-hidden border-0 shadow-lg">
            <div className="bg-gradient-to-r from-teal-500 to-cyan-500 px-5 py-3">
              <CardTitle className="flex items-center gap-2 text-white font-semibold">
                <FlaskConical className="h-5 w-5" />
                Kết quả xét nghiệm ({order.totalTests})
              </CardTitle>
            </div>
            <CardContent className="p-5">
              <div className="space-y-4">
                {order.results?.map((result) => {
                  const statusInfo = statusConfig[result.status as ResultStatus];
                  const StatusIcon = statusInfo?.icon || Clock;

                  return (
                    <div
                      key={result.id}
                      className={`border-2 rounded-xl p-4 transition-all hover:shadow-md ${statusInfo?.bgColor || "bg-slate-50 border-slate-200"}`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-semibold text-slate-800">{result.labTestName}</span>
                            <Badge variant="outline" className={`${statusInfo?.color} border-current`}>
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {statusInfo?.label || result.status}
                            </Badge>
                            {result.isAbnormal && (
                              <Badge variant="destructive" className="font-medium">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                Bất thường
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-slate-500 mb-3">
                            Mã xét nghiệm: <span className="font-mono">{result.labTestCode}</span>
                          </p>

                          {result.resultValue && (
                            <div className="bg-white p-3 rounded-lg border mb-3 shadow-sm">
                              <p className="text-xs text-slate-500 uppercase font-medium mb-1">Kết quả:</p>
                              <p className="font-semibold text-lg text-slate-800">{result.resultValue}</p>
                            </div>
                          )}

                          {result.interpretation && (
                            <div className="mb-3">
                              <p className="text-xs text-slate-500 uppercase font-medium mb-1">Nhận định:</p>
                              <p className="text-sm text-slate-700">{result.interpretation}</p>
                            </div>
                          )}

                          <div className="text-xs text-slate-500 flex flex-wrap gap-4">
                            {result.performedBy && (
                              <span className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                Thực hiện: {result.performedBy}
                              </span>
                            )}
                            {result.completedAt && (
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                Hoàn thành: {formatDate(result.completedAt)}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Actions - Admin can edit */}
                        <div className="flex flex-col gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenEdit(result)}
                            className="border-2 border-teal-300 bg-teal-50 text-teal-700 hover:bg-teal-100 hover:border-teal-400 font-medium shadow-sm"
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Cập nhật
                          </Button>
                          <ImageUploadDialog
                            resultId={result.id}
                            testName={result.labTestName}
                            onSuccess={() => refetch()}
                          />
                        </div>
                      </div>

                      {/* Image Gallery */}
                      {result.images && result.images.length > 0 && (
                        <ImageGallery
                          images={result.images as DiagnosticImage[]}
                          canDelete={true}
                          onDelete={() => refetch()}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Order Info */}
        <div className="space-y-6">
          {/* Patient & Doctor Info */}
          <Card className="overflow-hidden border-0 shadow-lg">
            <div className="bg-gradient-to-r from-sky-500 to-cyan-500 px-4 py-3">
              <CardTitle className="flex items-center gap-2 text-white font-semibold text-sm">
                <User className="h-4 w-4" />
                Thông tin phiếu
              </CardTitle>
            </div>
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center gap-3">
                <div
                  className={`h-12 w-12 rounded-full bg-gradient-to-br ${getAvatarColor(
                    order.patientName
                  )} flex items-center justify-center text-white font-bold shadow-md`}
                >
                  {order.patientName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase">Bệnh nhân</p>
                  <p className="font-semibold text-slate-800">{order.patientName}</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-violet-100 flex items-center justify-center">
                    <Stethoscope className="h-5 w-5 text-violet-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase">Bác sĩ chỉ định</p>
                    <p className="font-medium text-slate-700">{order.orderingDoctorName}</p>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4 space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-slate-400" />
                  <span className="text-slate-600">Ngày tạo:</span>
                  <span className="font-medium">{formatDate(order.createdAt)}</span>
                </div>
              </div>

              {order.notes && (
                <div className="border-t pt-4">
                  <p className="text-xs text-slate-500 uppercase mb-2">Ghi chú</p>
                  <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-lg">{order.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Link to Medical Exam */}
          <Card className="overflow-hidden border-0 shadow-lg">
            <CardContent className="p-5">
              <Link href={`/admin/exams/${order.medicalExamId}`}>
                <Button 
                  variant="outline" 
                  className="w-full border-2 border-violet-300 bg-violet-50 text-violet-700 hover:bg-violet-100 hover:border-violet-400 font-medium"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Xem phiếu khám bệnh
                  <ExternalLink className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Result Dialog */}
      <Dialog open={!!editingResult} onOpenChange={() => setEditingResult(null)}>
        <DialogContent className="max-h-[90vh] flex flex-col sm:max-w-lg">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5 text-teal-500" />
              Cập nhật kết quả xét nghiệm
            </DialogTitle>
            <DialogDescription>
              {editingResult?.labTestName} ({editingResult?.labTestCode})
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto py-4 min-h-0">
            <div className="space-y-4">
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
          </div>

          <DialogFooter className="flex-shrink-0 border-t pt-4 gap-2">
            <Button 
              variant="outline" 
              onClick={() => setEditingResult(null)}
              className="border-2"
            >
              <X className="h-4 w-4 mr-2" />
              Hủy
            </Button>
            <Button 
              onClick={handleSaveResult} 
              disabled={updateResultMutation.isPending}
              className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white border-0"
            >
              <Save className="h-4 w-4 mr-2" />
              Lưu kết quả
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

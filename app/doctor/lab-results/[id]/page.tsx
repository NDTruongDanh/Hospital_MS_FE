"use client";

import { useState, useCallback, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import Link from "next/link";
import {
  ArrowLeft,
  FileText,
  Upload,
  Trash2,
  Download,
  ImageIcon,
  CheckCircle,
  Clock,
  AlertTriangle,
  Save,
  X,
  ZoomIn,
  User,
  Stethoscope,
  Calendar,
  ExternalLink,
  Printer,
  FlaskConical,
  Edit,
  Camera,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
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
import { Skeleton } from "@/components/ui/skeleton";
import {
  useLabResult,
  useUpdateLabResult,
  useUploadLabImages,
  useDeleteLabImage,
} from "@/hooks/queries/useLab";
import { ResultStatus, ImageType, DiagnosticImage, LabTestCategory } from "@/services/lab.service";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";

const statusConfig: Record<ResultStatus, { label: string; icon: React.ElementType; color: string; bgColor: string }> = {
  PENDING: { label: "Chờ xử lý", icon: Clock, color: "text-amber-700", bgColor: "bg-amber-50 border-amber-200" },
  PROCESSING: { label: "Đang thực hiện", icon: Clock, color: "text-blue-700", bgColor: "bg-blue-50 border-blue-200" },
  COMPLETED: { label: "Hoàn thành", icon: CheckCircle, color: "text-emerald-700", bgColor: "bg-emerald-50 border-emerald-200" },
  CANCELLED: { label: "Đã hủy", icon: AlertTriangle, color: "text-red-700", bgColor: "bg-red-50 border-red-200" },
};

const categoryLabels: Record<LabTestCategory, { label: string; color: string }> = {
  LAB: { label: "Xét nghiệm", color: "bg-blue-100 text-blue-700 border-blue-200" },
  IMAGING: { label: "Chẩn đoán hình ảnh", color: "bg-purple-100 text-purple-700 border-purple-200" },
  PATHOLOGY: { label: "Mô bệnh học", color: "bg-orange-100 text-orange-700 border-orange-200" },
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

interface LabResultDetailPageProps {
  backPath: string;
}

export default function DoctorLabResultDetailPage() {
  return <LabResultDetailPage backPath="/doctor/lab-results" />;
}

function LabResultDetailPage({ backPath }: LabResultDetailPageProps) {
  const params = useParams();
  const router = useRouter();
  const resultId = params.id as string;

  const { data: result, isLoading, refetch } = useLabResult(resultId);
  const updateMutation = useUpdateLabResult();
  const uploadMutation = useUploadLabImages();
  const deleteMutation = useDeleteLabImage();

  // Form state
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    resultValue: "",
    status: "PENDING" as ResultStatus,
    isAbnormal: false,
    interpretation: "",
    notes: "",
  });

  // Image upload state
  const [uploadOpen, setUploadOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [imageType, setImageType] = useState<ImageType>("XRAY");
  const [imageDescription, setImageDescription] = useState("");

  // Image viewer state
  const [viewingImage, setViewingImage] = useState<DiagnosticImage | null>(null);

  // Dropzone config
  const onDrop = useCallback((acceptedFiles: File[]) => {
    setSelectedFiles((prev) => [...prev, ...acceptedFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".gif", ".webp"],
      "application/pdf": [".pdf"],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  // Initialize form when result loads
  useEffect(() => {
    if (result) {
      setFormData({
        resultValue: result.resultValue || "",
        status: result.status,
        isAbnormal: result.isAbnormal,
        interpretation: result.interpretation || "",
        notes: result.notes || "",
      });
    }
  }, [result]);

  const handleStartEdit = () => {
    if (result) {
      setFormData({
        resultValue: result.resultValue || "",
        status: result.status,
        isAbnormal: result.isAbnormal,
        interpretation: result.interpretation || "",
        notes: result.notes || "",
      });
      setIsEditing(true);
    }
  };

  const handleSave = async () => {
    try {
      await updateMutation.mutateAsync({
        id: resultId,
        data: formData,
      });
      toast.success("Đã lưu kết quả xét nghiệm!");
      setIsEditing(false);
    } catch {
      toast.error("Không thể lưu kết quả");
    }
  };

  const handleUploadImages = async () => {
    if (selectedFiles.length === 0) return;
    try {
      await uploadMutation.mutateAsync({
        resultId,
        files: selectedFiles,
        imageType,
        description: imageDescription,
      });
      toast.success(`Đã tải lên ${selectedFiles.length} hình ảnh!`);
      setSelectedFiles([]);
      setImageDescription("");
      setUploadOpen(false);
      refetch();
    } catch {
      toast.error("Không thể tải lên hình ảnh");
    }
  };

  const handleDeleteImage = async (imageId: string) => {
    try {
      await deleteMutation.mutateAsync({ imageId, resultId });
      toast.success("Đã xóa hình ảnh");
      refetch();
    } catch {
      toast.error("Không thể xóa hình ảnh");
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "-";
    return format(new Date(dateString), "dd/MM/yyyy HH:mm", { locale: vi });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-40 w-full rounded-2xl" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-64 w-full rounded-xl" />
            <Skeleton className="h-48 w-full rounded-xl" />
          </div>
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (!result) {
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
            <h2 className="text-xl font-bold mb-2">Không tìm thấy kết quả xét nghiệm</h2>
            <p className="text-white/80 mb-6">
              Kết quả xét nghiệm bạn tìm không tồn tại hoặc đã bị xóa.
            </p>
            <Button
              variant="outline"
              className="bg-white/10 border-white/30 text-white hover:bg-white/20"
              onClick={() => router.push(backPath)}
            >
              Quay lại
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const statusInfo = statusConfig[result.status];
  const StatusIcon = statusInfo.icon;
  const categoryInfo = result.labTestCategory ? categoryLabels[result.labTestCategory] : null;

  return (
    <div className="space-y-6">
      {/* Gradient Header */}
      <div className="relative rounded-2xl bg-gradient-to-r from-cyan-600 via-teal-500 to-emerald-500 p-6 text-white overflow-hidden shadow-xl">
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
                  {result.labTestName}
                </h1>
                <Badge variant="outline" className={`${statusInfo.color} border-current bg-white/10`}>
                  <StatusIcon className="h-3 w-3 mr-1" />
                  {statusInfo.label}
                </Badge>
                {result.isAbnormal && (
                  <Badge variant="destructive" className="font-medium">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Bất thường
                  </Badge>
                )}
                {categoryInfo && (
                  <Badge variant="outline" className="bg-white/20 text-white border-white/30">
                    {categoryInfo.label}
                  </Badge>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-4 text-white/80 text-sm">
                <span className="flex items-center gap-1.5">
                  <User className="h-4 w-4" />
                  {result.patientName}
                </span>
                <span className="flex items-center gap-1.5 font-mono">
                  Mã: {result.labTestCode}
                </span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  {formatDate(result.createdAt)}
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
              In
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setUploadOpen(true)}
              className="bg-white/10 border-2 border-white/40 text-white hover:bg-white/20 font-medium"
            >
              <Camera className="mr-2 h-4 w-4" />
              Tải ảnh
            </Button>
            {!isEditing ? (
              <Button
                size="sm"
                onClick={handleStartEdit}
                className="bg-white text-teal-600 hover:bg-white/90 font-medium border-2 border-white"
              >
                <Edit className="h-4 w-4 mr-2" />
                Chỉnh sửa
              </Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(false)}
                  className="bg-white/10 border-2 border-white/40 text-white hover:bg-white/20"
                >
                  <X className="h-4 w-4 mr-2" />
                  Hủy
                </Button>
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={updateMutation.isPending}
                  className="bg-white text-teal-600 hover:bg-white/90 font-medium border-2 border-white"
                >
                  {updateMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Lưu
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Status & Result */}
          <Card className="overflow-hidden border-0 shadow-lg">
            <div className="bg-gradient-to-r from-teal-500 to-cyan-500 px-5 py-3">
              <CardTitle className="flex items-center gap-2 text-white font-semibold">
                <FileText className="h-5 w-5" />
                Kết quả Xét nghiệm
              </CardTitle>
            </div>
            <CardContent className="p-6 space-y-5">
              {/* Status & Abnormal badges */}
              <div className="flex flex-wrap items-center gap-6">
                <div>
                  <Label className="text-sm text-slate-500 uppercase font-medium">Trạng thái</Label>
                  {isEditing ? (
                    <Select
                      value={formData.status}
                      onValueChange={(v) => setFormData({ ...formData, status: v as ResultStatus })}
                    >
                      <SelectTrigger className="w-[180px] mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PENDING">Chờ xử lý</SelectItem>
                        <SelectItem value="PROCESSING">Đang thực hiện</SelectItem>
                        <SelectItem value="COMPLETED">Hoàn thành</SelectItem>
                        <SelectItem value="CANCELLED">Đã hủy</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="mt-1">
                      <Badge variant="outline" className={`${statusInfo.color} border-current`}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {statusInfo.label}
                      </Badge>
                    </div>
                  )}
                </div>
                <div>
                  <Label className="text-sm text-slate-500 uppercase font-medium">Kết quả</Label>
                  {isEditing ? (
                    <div className="flex items-center space-x-2 mt-1">
                      <Switch
                        checked={formData.isAbnormal}
                        onCheckedChange={(v) => setFormData({ ...formData, isAbnormal: v })}
                      />
                      <span className={formData.isAbnormal ? "text-red-600 font-medium" : ""}>
                        {formData.isAbnormal ? "Bất thường" : "Bình thường"}
                      </span>
                    </div>
                  ) : (
                    <div className="mt-1">
                      <Badge variant={result.isAbnormal ? "destructive" : "secondary"}>
                        {result.isAbnormal ? "Bất thường" : "Bình thường"}
                      </Badge>
                    </div>
                  )}
                </div>
              </div>

              {/* Result Value - Highlighted */}
              <div className={`p-4 rounded-xl ${isEditing ? "bg-slate-50 border" : result.isAbnormal ? "bg-red-50 border border-red-200" : "bg-emerald-50 border border-emerald-200"}`}>
                <Label className="text-sm text-slate-500 uppercase font-medium mb-2 block">
                  Giá trị kết quả
                </Label>
                {isEditing ? (
                  <Input
                    value={formData.resultValue}
                    onChange={(e) => setFormData({ ...formData, resultValue: e.target.value })}
                    placeholder="Nhập giá trị kết quả..."
                    className="text-lg font-medium"
                  />
                ) : (
                  <p className={`text-xl font-bold ${result.isAbnormal ? "text-red-700" : "text-emerald-700"}`}>
                    {result.resultValue || "Chưa có kết quả"}
                  </p>
                )}
              </div>

              {/* Interpretation */}
              <div className="space-y-2">
                <Label className="text-sm text-slate-500 uppercase font-medium">Nhận định của bác sĩ</Label>
                {isEditing ? (
                  <Textarea
                    value={formData.interpretation}
                    onChange={(e) => setFormData({ ...formData, interpretation: e.target.value })}
                    placeholder="Nhập nhận định..."
                    rows={4}
                  />
                ) : (
                  <p className={`text-sm p-3 rounded-lg ${result.interpretation ? "bg-violet-50 border border-violet-200 text-slate-700" : "text-slate-400 italic"}`}>
                    {result.interpretation || "Chưa có nhận định"}
                  </p>
                )}
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label className="text-sm text-slate-500 uppercase font-medium">Ghi chú</Label>
                {isEditing ? (
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Nhập ghi chú..."
                    rows={2}
                  />
                ) : (
                  <p className={`text-sm ${result.notes ? "text-slate-600" : "text-slate-400 italic"}`}>
                    {result.notes || "Không có ghi chú"}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Images */}
          <Card className="overflow-hidden border-0 shadow-lg">
            <div className="bg-gradient-to-r from-cyan-500 to-blue-500 px-5 py-3">
              <CardTitle className="flex items-center justify-between text-white font-semibold">
                <span className="flex items-center gap-2">
                  <ImageIcon className="h-5 w-5" />
                  Hình ảnh chẩn đoán ({result.images?.length || 0})
                </span>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setUploadOpen(true)}
                  className="bg-white/20 border-white/30 text-white hover:bg-white/30"
                >
                  <Upload className="h-4 w-4 mr-1" />
                  Thêm
                </Button>
              </CardTitle>
            </div>
            <CardContent className="p-5">
              {result.images?.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {result.images.map((image) => (
                    <div
                      key={image.id}
                      className="relative group aspect-square rounded-xl overflow-hidden border-2 bg-slate-100 shadow-sm hover:shadow-md transition-shadow"
                    >
                      {image.downloadUrl ? (
                        <img
                          src={image.downloadUrl}
                          alt={image.fileName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageIcon className="h-12 w-12 text-slate-400" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <Button
                          variant="secondary"
                          size="icon"
                          className="h-10 w-10"
                          onClick={() => setViewingImage(image)}
                        >
                          <ZoomIn className="h-5 w-5" />
                        </Button>
                        {image.downloadUrl && (
                          <a href={image.downloadUrl} download target="_blank" rel="noreferrer">
                            <Button variant="secondary" size="icon" className="h-10 w-10">
                              <Download className="h-5 w-5" />
                            </Button>
                          </a>
                        )}
                        <Button
                          variant="destructive"
                          size="icon"
                          className="h-10 w-10"
                          onClick={() => handleDeleteImage(image.id)}
                          disabled={deleteMutation.isPending}
                        >
                          {deleteMutation.isPending ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                          ) : (
                            <Trash2 className="h-5 w-5" />
                          )}
                        </Button>
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                        <p className="text-white text-xs truncate">{image.fileName}</p>
                        {image.imageType && (
                          <Badge variant="secondary" className="text-[10px] mt-1">
                            {image.imageType}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-slate-500">
                  <ImageIcon className="h-16 w-16 mx-auto mb-4 opacity-30" />
                  <p className="font-medium mb-2">Chưa có hình ảnh nào</p>
                  <p className="text-sm text-slate-400 mb-4">Tải lên hình ảnh X-Ray, CT, MRI...</p>
                  <Button
                    variant="outline"
                    onClick={() => setUploadOpen(true)}
                    className="border-2 border-cyan-300 bg-cyan-50 text-cyan-700 hover:bg-cyan-100 hover:border-cyan-400"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Tải ảnh lên
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Patient Info Card */}
          <Card className="overflow-hidden border-0 shadow-lg">
            <div className="bg-gradient-to-r from-sky-500 to-cyan-500 px-4 py-3">
              <CardTitle className="flex items-center gap-2 text-white font-semibold text-sm">
                <User className="h-4 w-4" />
                Thông tin Bệnh nhân
              </CardTitle>
            </div>
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-4">
                <div
                  className={`h-12 w-12 rounded-full bg-gradient-to-br ${getAvatarColor(
                    result.patientName
                  )} flex items-center justify-center text-white font-bold shadow-md`}
                >
                  {result.patientName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-slate-800">{result.patientName}</p>
                  <p className="text-xs text-slate-500">Bệnh nhân</p>
                </div>
              </div>
              {result.patientId && (
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="w-full border-2 border-sky-300 bg-sky-50 text-sky-700 hover:bg-sky-100 hover:border-sky-400"
                >
                  <Link href={`/doctor/patients/${result.patientId}`}>
                    Xem hồ sơ bệnh nhân
                    <ExternalLink className="h-3 w-3 ml-2" />
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Test Info Card */}
          <Card className="overflow-hidden border-0 shadow-lg">
            <div className="bg-gradient-to-r from-violet-500 to-purple-500 px-4 py-3">
              <CardTitle className="flex items-center gap-2 text-white font-semibold text-sm">
                <FlaskConical className="h-4 w-4" />
                Thông tin Xét nghiệm
              </CardTitle>
            </div>
            <CardContent className="p-4 space-y-3">
              <div>
                <Label className="text-xs text-slate-500 uppercase">Loại xét nghiệm</Label>
                <p className="font-medium">{result.labTestName}</p>
              </div>
              <div>
                <Label className="text-xs text-slate-500 uppercase">Mã xét nghiệm</Label>
                <p className="font-mono text-sm">{result.labTestCode}</p>
              </div>
              {categoryInfo && (
                <div>
                  <Label className="text-xs text-slate-500 uppercase">Danh mục</Label>
                  <div className="mt-1">
                    <Badge variant="outline" className={categoryInfo.color}>
                      {categoryInfo.label}
                    </Badge>
                  </div>
                </div>
              )}
              {result.medicalExamId && (
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="w-full mt-2 border-2 border-violet-300 bg-violet-50 text-violet-700 hover:bg-violet-100 hover:border-violet-400"
                >
                  <Link href={`/doctor/exams/${result.medicalExamId}`}>
                    Xem phiếu khám
                    <ExternalLink className="h-3 w-3 ml-2" />
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Audit Info */}
          <Card className="overflow-hidden border-0 shadow-lg">
            <div className="bg-gradient-to-r from-slate-500 to-slate-600 px-4 py-3">
              <CardTitle className="flex items-center gap-2 text-white font-semibold text-sm">
                <Clock className="h-4 w-4" />
                Lịch sử
              </CardTitle>
            </div>
            <CardContent className="p-4 space-y-3 text-sm">
              <div>
                <Label className="text-xs text-slate-500 uppercase">Ngày tạo</Label>
                <p>{formatDate(result.createdAt)}</p>
              </div>
              {result.performedBy && (
                <div>
                  <Label className="text-xs text-slate-500 uppercase">Thực hiện bởi</Label>
                  <p className="flex items-center gap-1">
                    <Stethoscope className="h-3 w-3 text-slate-400" />
                    {result.performedBy}
                  </p>
                </div>
              )}
              {result.performedAt && (
                <div>
                  <Label className="text-xs text-slate-500 uppercase">Thời gian thực hiện</Label>
                  <p>{formatDate(result.performedAt)}</p>
                </div>
              )}
              {result.interpretedBy && (
                <div>
                  <Label className="text-xs text-slate-500 uppercase">Nhận định bởi</Label>
                  <p className="flex items-center gap-1">
                    <Stethoscope className="h-3 w-3 text-slate-400" />
                    {result.interpretedBy}
                  </p>
                </div>
              )}
              {result.completedAt && (
                <div>
                  <Label className="text-xs text-slate-500 uppercase">Thời gian hoàn thành</Label>
                  <p className="text-emerald-600 font-medium">{formatDate(result.completedAt)}</p>
                </div>
              )}
              {result.updatedAt && (
                <div>
                  <Label className="text-xs text-slate-500 uppercase">Cập nhật lần cuối</Label>
                  <p className="text-slate-500">{formatDate(result.updatedAt)}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Upload Dialog */}
      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-cyan-500" />
              Tải ảnh lên
            </DialogTitle>
            <DialogDescription>
              Tải ảnh X-Ray, CT, MRI hoặc ảnh xét nghiệm khác
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-4 py-4">
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                isDragActive ? "border-cyan-500 bg-cyan-50" : "border-slate-300 hover:border-cyan-400 hover:bg-cyan-50/50"
              }`}
            >
              <input {...getInputProps()} />
              <Upload className="h-12 w-12 mx-auto mb-4 text-slate-400" />
              {isDragActive ? (
                <p className="font-medium text-cyan-600">Thả file vào đây...</p>
              ) : (
                <p className="font-medium">Kéo thả file hoặc nhấp để chọn</p>
              )}
              <p className="text-sm text-slate-500 mt-2">JPEG, PNG, PDF - Tối đa 10MB</p>
            </div>

            {selectedFiles.length > 0 && (
              <div className="space-y-2">
                <Label>File đã chọn ({selectedFiles.length})</Label>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {selectedFiles.map((file, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm bg-slate-50 p-2 rounded-lg border">
                      <span className="truncate flex-1 min-w-0" title={file.name}>
                        {file.name}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 flex-shrink-0"
                        onClick={() =>
                          setSelectedFiles((prev) => prev.filter((_, idx) => idx !== i))
                        }
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label>Loại ảnh</Label>
              <Select value={imageType} onValueChange={(v) => setImageType(v as ImageType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="XRAY">X-Ray</SelectItem>
                  <SelectItem value="CT_SCAN">CT Scan</SelectItem>
                  <SelectItem value="MRI">MRI</SelectItem>
                  <SelectItem value="ULTRASOUND">Siêu âm</SelectItem>
                  <SelectItem value="ENDOSCOPY">Nội soi</SelectItem>
                  <SelectItem value="PATHOLOGY_SLIDE">Mô bệnh học</SelectItem>
                  <SelectItem value="PHOTO">Ảnh khác</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Mô tả (tùy chọn)</Label>
              <Textarea
                value={imageDescription}
                onChange={(e) => setImageDescription(e.target.value)}
                placeholder="Mô tả về ảnh..."
                rows={2}
              />
            </div>
          </div>

          <DialogFooter className="flex-shrink-0 gap-2 border-t pt-4">
            <Button variant="outline" onClick={() => setUploadOpen(false)} className="border-2">
              Hủy
            </Button>
            <Button
              onClick={handleUploadImages}
              disabled={selectedFiles.length === 0 || uploadMutation.isPending}
              className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white border-0"
            >
              {uploadMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Đang tải...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Tải lên {selectedFiles.length > 0 && `(${selectedFiles.length})`}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image Viewer Dialog */}
      <Dialog open={!!viewingImage} onOpenChange={() => setViewingImage(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-cyan-500" />
              {viewingImage?.fileName}
            </DialogTitle>
            {viewingImage?.description && (
              <DialogDescription>{viewingImage.description}</DialogDescription>
            )}
          </DialogHeader>
          {viewingImage?.downloadUrl && (
            <div className="flex justify-center max-h-[60vh] overflow-hidden">
              <img
                src={viewingImage.downloadUrl}
                alt={viewingImage.fileName}
                className="max-w-full max-h-[60vh] object-contain rounded-lg"
              />
            </div>
          )}
          <DialogFooter>
            {viewingImage?.downloadUrl && (
              <Button asChild variant="outline" className="gap-2 border-2">
                <a href={viewingImage.downloadUrl} download={viewingImage.fileName} target="_blank">
                  <Download className="h-4 w-4" />
                  Tải xuống
                </a>
              </Button>
            )}
            <Button onClick={() => setViewingImage(null)}>Đóng</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

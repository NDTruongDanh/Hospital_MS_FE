"use client";

import { useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import {
  useLabResult,
  useUpdateLabResult,
  useUploadLabImages,
  useDeleteLabImage,
} from "@/hooks/queries/useLab";
import { ResultStatus, ImageType, DiagnosticImage } from "@/services/lab.service";
import { useDropzone } from "react-dropzone";

const statusConfig: Record<ResultStatus, { label: string; icon: React.ElementType; color: string }> = {
  PENDING: { label: "Chờ xử lý", icon: Clock, color: "bg-yellow-100 text-yellow-800" },
  PROCESSING: { label: "Đang thực hiện", icon: Clock, color: "bg-blue-100 text-blue-800" },
  COMPLETED: { label: "Hoàn thành", icon: CheckCircle, color: "bg-green-100 text-green-800" },
  CANCELLED: { label: "Đã hủy", icon: AlertTriangle, color: "bg-red-100 text-red-800" },
};

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

  const { data: result, isLoading } = useLabResult(resultId);
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
  const [imageType, setImageType] = useState<ImageType>("PHOTO");
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
  useState(() => {
    if (result) {
      setFormData({
        resultValue: result.resultValue || "",
        status: result.status,
        isAbnormal: result.isAbnormal,
        interpretation: result.interpretation || "",
        notes: result.notes || "",
      });
    }
  });

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
    await updateMutation.mutateAsync({
      id: resultId,
      data: formData,
    });
    setIsEditing(false);
  };

  const handleUploadImages = async () => {
    if (selectedFiles.length === 0) return;
    await uploadMutation.mutateAsync({
      resultId,
      files: selectedFiles,
      imageType,
      description: imageDescription,
    });
    setSelectedFiles([]);
    setImageDescription("");
    setUploadOpen(false);
  };

  const handleDeleteImage = async (imageId: string) => {
    await deleteMutation.mutateAsync({ imageId, resultId });
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "-";
    return format(new Date(dateString), "dd/MM/yyyy HH:mm", { locale: vi });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!result) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Không tìm thấy kết quả xét nghiệm</p>
        <Link href={backPath}>
          <Button variant="outline" className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Quay lại
          </Button>
        </Link>
      </div>
    );
  }

  const statusInfo = statusConfig[result.status];
  const StatusIcon = statusInfo.icon;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <FileText className="h-6 w-6 text-teal-500" />
              {result.labTestName}
            </h1>
            <p className="text-muted-foreground">
              {result.patientName} • Mã: {result.labTestCode}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setUploadOpen(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Tải ảnh lên
          </Button>
          {!isEditing ? (
            <Button onClick={handleStartEdit}>Chỉnh sửa</Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                <X className="h-4 w-4 mr-2" />
                Hủy
              </Button>
              <Button onClick={handleSave} disabled={updateMutation.isPending}>
                <Save className="h-4 w-4 mr-2" />
                Lưu
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Status & Result */}
          <Card>
            <CardHeader>
              <CardTitle>Kết quả Xét nghiệm</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div>
                  <Label className="text-sm text-muted-foreground">Trạng thái</Label>
                  {isEditing ? (
                    <Select
                      value={formData.status}
                      onValueChange={(v) => setFormData({ ...formData, status: v as ResultStatus })}
                    >
                      <SelectTrigger className="w-[180px]">
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
                    <Badge className={statusInfo.color}>
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {statusInfo.label}
                    </Badge>
                  )}
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Bất thường</Label>
                  {isEditing ? (
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={formData.isAbnormal}
                        onCheckedChange={(v) => setFormData({ ...formData, isAbnormal: v })}
                      />
                      <span>{formData.isAbnormal ? "Có" : "Không"}</span>
                    </div>
                  ) : (
                    <Badge variant={result.isAbnormal ? "destructive" : "secondary"}>
                      {result.isAbnormal ? "Bất thường" : "Bình thường"}
                    </Badge>
                  )}
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Giá trị kết quả</Label>
                {isEditing ? (
                  <Input
                    value={formData.resultValue}
                    onChange={(e) => setFormData({ ...formData, resultValue: e.target.value })}
                    placeholder="Nhập giá trị kết quả..."
                  />
                ) : (
                  <p className="text-lg font-medium">{result.resultValue || "Chưa có kết quả"}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Nhận định của bác sĩ</Label>
                {isEditing ? (
                  <Textarea
                    value={formData.interpretation}
                    onChange={(e) => setFormData({ ...formData, interpretation: e.target.value })}
                    placeholder="Nhập nhận định..."
                    rows={4}
                  />
                ) : (
                  <p className="text-sm">{result.interpretation || "Chưa có nhận định"}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Ghi chú</Label>
                {isEditing ? (
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Nhập ghi chú..."
                    rows={2}
                  />
                ) : (
                  <p className="text-sm text-muted-foreground">{result.notes || "Không có ghi chú"}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Images */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Hình ảnh chẩn đoán</CardTitle>
                <CardDescription>
                  {result.images?.length || 0} hình ảnh đã tải lên
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              {result.images?.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {result.images.map((image) => (
                    <div
                      key={image.id}
                      className="relative group aspect-square rounded-lg overflow-hidden border bg-muted"
                    >
                      {image.downloadUrl ? (
                        <img
                          src={image.downloadUrl}
                          alt={image.fileName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageIcon className="h-12 w-12 text-muted-foreground" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <Button
                          variant="secondary"
                          size="icon"
                          onClick={() => setViewingImage(image)}
                        >
                          <ZoomIn className="h-4 w-4" />
                        </Button>
                        {image.downloadUrl && (
                          <a href={image.downloadUrl} download target="_blank" rel="noreferrer">
                            <Button variant="secondary" size="icon">
                              <Download className="h-4 w-4" />
                            </Button>
                          </a>
                        )}
                        <Button
                          variant="destructive"
                          size="icon"
                          onClick={() => handleDeleteImage(image.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 bg-black/40 p-2">
                        <p className="text-white text-xs truncate">{image.fileName}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <ImageIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Chưa có hình ảnh nào</p>
                  <Button variant="outline" className="mt-4" onClick={() => setUploadOpen(true)}>
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
          <Card>
            <CardHeader>
              <CardTitle>Thông tin</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm text-muted-foreground">Bệnh nhân</Label>
                <p className="font-medium">{result.patientName}</p>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Loại xét nghiệm</Label>
                <p>{result.labTestName}</p>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Ngày tạo</Label>
                <p>{formatDate(result.createdAt)}</p>
              </div>
              {result.performedBy && (
                <div>
                  <Label className="text-sm text-muted-foreground">Thực hiện bởi</Label>
                  <p>{result.performedBy}</p>
                </div>
              )}
              {result.performedAt && (
                <div>
                  <Label className="text-sm text-muted-foreground">Thời gian thực hiện</Label>
                  <p>{formatDate(result.performedAt)}</p>
                </div>
              )}
              {result.completedAt && (
                <div>
                  <Label className="text-sm text-muted-foreground">Thời gian hoàn thành</Label>
                  <p>{formatDate(result.completedAt)}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Upload Dialog */}
      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Tải ảnh lên</DialogTitle>
            <DialogDescription>
              Tải ảnh X-Ray, CT, MRI hoặc ảnh xét nghiệm khác
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25"
              }`}
            >
              <input {...getInputProps()} />
              <Upload className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
              {isDragActive ? (
                <p>Thả file vào đây...</p>
              ) : (
                <p>Kéo thả file hoặc nhấp để chọn</p>
              )}
              <p className="text-sm text-muted-foreground mt-2">JPEG, PNG, PDF - Tối đa 10MB</p>
            </div>

            {selectedFiles.length > 0 && (
              <div className="space-y-2">
                <Label>File đã chọn ({selectedFiles.length})</Label>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {selectedFiles.map((file, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm bg-muted p-2 rounded">
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
              <Label>Mô tả</Label>
              <Textarea
                value={imageDescription}
                onChange={(e) => setImageDescription(e.target.value)}
                placeholder="Mô tả về ảnh..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setUploadOpen(false)}>
              Hủy
            </Button>
            <Button
              onClick={handleUploadImages}
              disabled={selectedFiles.length === 0 || uploadMutation.isPending}
            >
              Tải lên {selectedFiles.length > 0 && `(${selectedFiles.length})`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image Viewer Dialog */}
      <Dialog open={!!viewingImage} onOpenChange={() => setViewingImage(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{viewingImage?.fileName}</DialogTitle>
            <DialogDescription>{viewingImage?.description}</DialogDescription>
          </DialogHeader>
          {viewingImage?.downloadUrl && (
            <div className="flex justify-center">
              <img
                src={viewingImage.downloadUrl}
                alt={viewingImage.fileName}
                className="max-h-[70vh] object-contain"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

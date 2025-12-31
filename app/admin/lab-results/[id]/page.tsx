"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { 
  ArrowLeft, 
  TestTube,
  Save,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  Upload,
  Trash2,
  Download,
  ZoomIn,
  X,
  Image as ImageIcon,
  FileText,
  User,
  Stethoscope,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { labResultService, LabTestResult, ResultStatus, DiagnosticImage, ImageType } from "@/services/lab.service";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const STATUS_CONFIG: Record<ResultStatus, { label: string; class: string; icon: typeof Clock; bgClass: string }> = {
  PENDING: { label: "Chờ xử lý", class: "bg-yellow-100 text-yellow-700", icon: Clock, bgClass: "bg-yellow-500" },
  PROCESSING: { label: "Đang làm", class: "bg-blue-100 text-blue-700", icon: Loader2, bgClass: "bg-blue-500" },
  COMPLETED: { label: "Hoàn thành", class: "bg-green-100 text-green-700", icon: CheckCircle, bgClass: "bg-green-500" },
  CANCELLED: { label: "Đã hủy", class: "bg-red-100 text-red-700", icon: Clock, bgClass: "bg-red-500" },
};

const IMAGE_TYPES: { value: ImageType; label: string }[] = [
  { value: "PHOTO", label: "Ảnh chụp" },
  { value: "XRAY", label: "X-quang" },
  { value: "CT_SCAN", label: "CT Scan" },
  { value: "MRI", label: "MRI" },
  { value: "ULTRASOUND", label: "Siêu âm" },
  { value: "ENDOSCOPY", label: "Nội soi" },
  { value: "PATHOLOGY_SLIDE", label: "Mô bệnh học" },
];

export default function LabResultDetailPage() {
  const router = useRouter();
  const params = useParams();
  const resultId = params.id as string;
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [result, setResult] = useState<LabTestResult | null>(null);
  const [images, setImages] = useState<DiagnosticImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    resultValue: "",
    status: "PENDING" as ResultStatus,
    isAbnormal: false,
    interpretation: "",
    notes: "",
    performedBy: "",
  });
  
  // Image upload state
  const [uploadOpen, setUploadOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [imageType, setImageType] = useState<ImageType>("PHOTO");
  const [imageDescription, setImageDescription] = useState("");
  const [uploading, setUploading] = useState(false);
  
  // Image viewer
  const [viewingImage, setViewingImage] = useState<DiagnosticImage | null>(null);

  useEffect(() => {
    if (resultId) {
      fetchData();
    }
  }, [resultId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await labResultService.getById(resultId);
      setResult(data);
      setFormData({
        resultValue: data.resultValue || "",
        status: data.status,
        isAbnormal: data.isAbnormal || false,
        interpretation: data.interpretation || "",
        notes: data.notes || "",
        performedBy: data.performedBy || "",
      });
      
      // Fetch images
      try {
        const imgs = await labResultService.getImages(resultId);
        setImages(imgs || []);
      } catch {
        setImages([]);
      }
    } catch (error) {
      console.error("Failed to fetch result:", error);
      toast.error("Không thể tải chi tiết kết quả");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await labResultService.update(resultId, formData);
      toast.success("Đã lưu kết quả xét nghiệm");
      setIsEditing(false);
      fetchData();
    } catch (error) {
      console.error("Failed to save:", error);
      toast.error("Không thể lưu kết quả");
    } finally {
      setSaving(false);
    }
  };

  const handleUploadImages = async () => {
    if (selectedFiles.length === 0) return;
    
    setUploading(true);
    try {
      await labResultService.uploadImages(resultId, selectedFiles, imageType, imageDescription || undefined);
      toast.success("Đã tải lên hình ảnh");
      setUploadOpen(false);
      setSelectedFiles([]);
      setImageDescription("");
      fetchData();
    } catch (error) {
      console.error("Failed to upload:", error);
      toast.error("Không thể tải lên hình ảnh");
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteImage = async (imageId: string) => {
    if (!confirm("Bạn có chắc muốn xóa ảnh này?")) return;
    
    try {
      await labResultService.deleteImage(imageId);
      toast.success("Đã xóa ảnh");
      setImages(images.filter(img => img.id !== imageId));
    } catch (error) {
      console.error("Failed to delete:", error);
      toast.error("Không thể xóa ảnh");
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-[hsl(var(--primary))]" />
      </div>
    );
  }

  if (!result) {
    return (
      <div className="text-center py-12">
        <TestTube className="w-16 h-16 mx-auto mb-4 opacity-30" />
        <h2 className="text-xl font-semibold mb-2">Không tìm thấy kết quả</h2>
        <p className="text-[hsl(var(--muted-foreground))] mb-4">
          Kết quả xét nghiệm không tồn tại hoặc đã bị xóa
        </p>
        <Link href="/admin/lab-results" className="btn-primary">
          Quay lại danh sách
        </Link>
      </div>
    );
  }

  const StatusIcon = STATUS_CONFIG[result.status]?.icon || Clock;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="relative rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 p-6 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-white" />
          <div className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full bg-white" />
        </div>

        <div className="relative flex items-start justify-between gap-6 flex-wrap">
          <div className="flex items-center gap-5">
            <button
              onClick={() => router.back()}
              className="p-2 rounded-lg text-white/90 hover:text-white hover:bg-white/20 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>

            <div className="h-16 w-16 rounded-xl bg-white/20 flex items-center justify-center">
              <TestTube className="h-8 w-8 text-white" />
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold tracking-tight">
                  {result.labTestName}
                </h1>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${STATUS_CONFIG[result.status].class}`}>
                  <StatusIcon className={`h-3 w-3 mr-1 ${result.status === "PROCESSING" ? "animate-spin" : ""}`} />
                  {STATUS_CONFIG[result.status].label}
                </span>
              </div>
              <p className="text-white/80 text-sm font-medium">
                {result.labTestCode} • {result.labTestCategory}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {!isEditing ? (
              <button 
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center px-4 py-2 rounded-lg bg-white text-teal-600 hover:bg-white/90 transition-colors"
              >
                Chỉnh sửa
              </button>
            ) : (
              <>
                <button 
                  onClick={() => setIsEditing(false)}
                  className="inline-flex items-center px-4 py-2 rounded-lg bg-white/10 border border-white/30 text-white hover:bg-white/20 transition-colors"
                >
                  <X className="mr-2 h-4 w-4" />
                  Hủy
                </button>
                <button 
                  onClick={handleSave}
                  disabled={saving}
                  className="inline-flex items-center px-4 py-2 rounded-lg bg-white text-teal-600 hover:bg-white/90 transition-colors disabled:opacity-50"
                >
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Lưu
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Patient Info */}
        <div className="card-base">
          <div className="p-4 bg-gray-50 border-b flex items-center gap-2">
            <User className="h-5 w-5 text-sky-500" />
            <h3 className="font-semibold">Thông tin bệnh nhân</h3>
          </div>
          <div className="p-4 space-y-3">
            <div className="flex justify-between">
              <span className="text-[hsl(var(--muted-foreground))]">Họ tên:</span>
              <span className="font-medium">{result.patientName || "N/A"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[hsl(var(--muted-foreground))]">Mã phiếu khám:</span>
              <Link href={`/admin/exams/${result.medicalExamId}`} className="text-sky-600 hover:underline">
                {result.medicalExamId?.slice(0, 8)}...
              </Link>
            </div>
            <div className="flex justify-between">
              <span className="text-[hsl(var(--muted-foreground))]">Ngày yêu cầu:</span>
              <span>
                {result.createdAt ? format(new Date(result.createdAt), "dd/MM/yyyy HH:mm", { locale: vi }) : "N/A"}
              </span>
            </div>
            {result.performedAt && (
              <div className="flex justify-between">
                <span className="text-[hsl(var(--muted-foreground))]">Ngày thực hiện:</span>
                <span>{format(new Date(result.performedAt), "dd/MM/yyyy HH:mm", { locale: vi })}</span>
              </div>
            )}
          </div>
        </div>

        {/* Test Info */}
        <div className="card-base">
          <div className="p-4 bg-gray-50 border-b flex items-center gap-2">
            <Stethoscope className="h-5 w-5 text-violet-500" />
            <h3 className="font-semibold">Thông tin xét nghiệm</h3>
          </div>
          <div className="p-4 space-y-3">
            <div className="flex justify-between">
              <span className="text-[hsl(var(--muted-foreground))]">Tên xét nghiệm:</span>
              <span className="font-medium">{result.labTestName || "N/A"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[hsl(var(--muted-foreground))]">Mã xét nghiệm:</span>
              <span>{result.labTestCode || "N/A"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[hsl(var(--muted-foreground))]">Loại xét nghiệm:</span>
              <span>{result.labTestCategory || "N/A"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Result Section */}
      <div className="card-base">
        <div className="p-4 bg-gray-50 border-b flex items-center gap-2">
          <FileText className="h-5 w-5 text-emerald-500" />
          <h3 className="font-semibold">Kết quả xét nghiệm</h3>
        </div>
        <div className="p-6 space-y-4">
          {isEditing ? (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-label">Giá trị kết quả</label>
                  <input
                    type="text"
                    className="input-base"
                    value={formData.resultValue}
                    onChange={(e) => setFormData({ ...formData, resultValue: e.target.value })}
                    placeholder="Nhập giá trị kết quả"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-label">Trạng thái</label>
                  <select
                    className="input-base"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as ResultStatus })}
                  >
                    <option value="PENDING">Chờ xử lý</option>
                    <option value="PROCESSING">Đang thực hiện</option>
                    <option value="COMPLETED">Hoàn thành</option>
                    <option value="CANCELLED">Đã hủy</option>
                  </select>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isAbnormal"
                  checked={formData.isAbnormal}
                  onChange={(e) => setFormData({ ...formData, isAbnormal: e.target.checked })}
                  className="w-4 h-4"
                />
                <label htmlFor="isAbnormal" className="font-medium">Kết quả bất thường</label>
              </div>
              
              <div className="space-y-2">
                <label className="text-label">Diễn giải kết quả</label>
                <textarea
                  className="input-base min-h-[80px]"
                  value={formData.interpretation}
                  onChange={(e) => setFormData({ ...formData, interpretation: e.target.value })}
                  placeholder="Nhập diễn giải kết quả"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-label">Ghi chú</label>
                <textarea
                  className="input-base min-h-[60px]"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Ghi chú thêm"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-label">Người thực hiện</label>
                <input
                  type="text"
                  className="input-base max-w-xs"
                  value={formData.performedBy}
                  onChange={(e) => setFormData({ ...formData, performedBy: e.target.value })}
                  placeholder="Nhập tên người thực hiện"
                />
              </div>
            </>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <span className="text-[hsl(var(--muted-foreground))]">Giá trị kết quả:</span>
                  <p className={`font-medium text-lg ${result.isAbnormal ? "text-red-600" : ""}`}>
                    {result.resultValue || "Chưa có kết quả"}
                    {result.isAbnormal && (
                      <span className="ml-2 px-2 py-0.5 rounded-full text-xs bg-red-100 text-red-700">Bất thường</span>
                    )}
                  </p>
                </div>
                {result.performedBy && (
                  <div>
                    <span className="text-[hsl(var(--muted-foreground))]">Người thực hiện:</span>
                    <p className="font-medium">{result.performedBy}</p>
                  </div>
                )}
              </div>
              {result.interpretation && (
                <div>
                  <span className="text-[hsl(var(--muted-foreground))]">Diễn giải:</span>
                  <p className="mt-1">{result.interpretation}</p>
                </div>
              )}
              {result.notes && (
                <div>
                  <span className="text-[hsl(var(--muted-foreground))]">Ghi chú:</span>
                  <p className="mt-1">{result.notes}</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Images Section */}
      <div className="card-base">
        <div className="p-4 bg-gray-50 border-b flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5 text-amber-500" />
            <h3 className="font-semibold">Hình ảnh chẩn đoán</h3>
          </div>
          <button onClick={() => setUploadOpen(true)} className="btn-primary text-sm">
            <Upload className="w-4 h-4 mr-2" />
            Tải lên hình ảnh
          </button>
        </div>
        <div className="p-6">
          {images.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {images.map((image) => (
                <div key={image.id} className="relative group rounded-lg overflow-hidden border">
                  <img
                    src={image.downloadUrl || `/api/lab-results/images/${image.id}/download`}
                    alt={image.description || "Hình ảnh xét nghiệm"}
                    className="w-full h-32 object-cover"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      onClick={() => setViewingImage(image)}
                      className="p-2 rounded-full bg-white/20 text-white hover:bg-white/30"
                    >
                      <ZoomIn className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteImage(image.id)}
                      className="p-2 rounded-full bg-white/20 text-white hover:bg-white/30"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-2 bg-black/60 text-white text-xs">
                    {image.imageType || "PHOTO"}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-[hsl(var(--muted-foreground))]">
              <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Chưa có hình ảnh nào</p>
            </div>
          )}
        </div>
      </div>

      {/* Upload Dialog */}
      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Tải lên hình ảnh</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div 
              className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-[hsl(var(--primary))] transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={handleFileSelect}
              />
              <Upload className="w-8 h-8 mx-auto mb-2 text-[hsl(var(--muted-foreground))]" />
              <p>Click để chọn hoặc kéo thả file</p>
            </div>
            
            {selectedFiles.length > 0 && (
              <div className="space-y-2">
                <p className="text-label">Đã chọn ({selectedFiles.length} file)</p>
                <div className="flex flex-wrap gap-2">
                  {selectedFiles.map((file, index) => (
                    <span key={index} className="inline-flex items-center px-2 py-1 rounded bg-[hsl(var(--secondary))] text-sm">
                      {file.name}
                      <button
                        onClick={() => setSelectedFiles(selectedFiles.filter((_, i) => i !== index))}
                        className="ml-1 hover:text-red-500"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-label">Loại hình ảnh</label>
                <select 
                  className="input-base"
                  value={imageType}
                  onChange={(e) => setImageType(e.target.value as ImageType)}
                >
                  {IMAGE_TYPES.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-label">Mô tả</label>
                <input
                  type="text"
                  className="input-base"
                  value={imageDescription}
                  onChange={(e) => setImageDescription(e.target.value)}
                  placeholder="Mô tả hình ảnh"
                />
              </div>
            </div>
            
            <div className="flex gap-3 pt-4">
              <button onClick={() => setUploadOpen(false)} className="btn-secondary flex-1">
                Hủy
              </button>
              <button 
                onClick={handleUploadImages}
                disabled={selectedFiles.length === 0 || uploading}
                className="btn-primary flex-1"
              >
                {uploading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                Tải lên
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Image Viewer Dialog */}
      <Dialog open={!!viewingImage} onOpenChange={() => setViewingImage(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{viewingImage?.description || "Hình ảnh xét nghiệm"}</DialogTitle>
          </DialogHeader>
          {viewingImage && (
            <img
              src={viewingImage.downloadUrl || `/api/lab-results/images/${viewingImage.id}/download`}
              alt={viewingImage.description || "Hình ảnh"}
              className="w-full max-h-[70vh] object-contain"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Upload,
  X,
  Image as ImageIcon,
  Loader2,
  Trash2,
  Download,
  ZoomIn,
  Camera,
} from "lucide-react";
import { labResultService, ImageType, DiagnosticImage } from "@/services/lab.service";
import { toast } from "sonner";

interface ImageUploadDialogProps {
  resultId: string;
  testName: string;
  onSuccess?: () => void;
}

const imageTypeOptions: { value: ImageType; label: string }[] = [
  { value: "XRAY", label: "X-Ray" },
  { value: "CT_SCAN", label: "CT Scan" },
  { value: "MRI", label: "MRI" },
  { value: "ULTRASOUND", label: "Siêu âm" },
  { value: "ENDOSCOPY", label: "Nội soi" },
  { value: "PATHOLOGY_SLIDE", label: "Slide bệnh lý" },
  { value: "PHOTO", label: "Ảnh chụp khác" },
];

export function ImageUploadDialog({
  resultId,
  testName,
  onSuccess,
}: ImageUploadDialogProps) {
  const [open, setOpen] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [imageType, setImageType] = useState<ImageType>("XRAY");
  const [description, setDescription] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      toast.error("Vui lòng chọn ít nhất một hình ảnh");
      return;
    }

    setIsUploading(true);
    try {
      await labResultService.uploadImages(resultId, files, imageType, description || undefined);
      toast.success(`Đã tải lên ${files.length} hình ảnh!`);
      setOpen(false);
      setFiles([]);
      setDescription("");
      onSuccess?.();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Không thể tải lên hình ảnh");
    } finally {
      setIsUploading(false);
    }
  };

  const handleReset = () => {
    setFiles([]);
    setDescription("");
    setImageType("XRAY");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 border-2 border-cyan-300 bg-cyan-50 text-cyan-700 hover:bg-cyan-100 hover:border-cyan-400 font-medium shadow-sm"
        >
          <Camera className="h-4 w-4" />
          Tải ảnh
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-cyan-500" />
            Tải hình ảnh chẩn đoán
          </DialogTitle>
          <DialogDescription>
            Tải hình ảnh cho xét nghiệm: <strong>{testName}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-4 min-h-0 space-y-4">
          {/* Image Type */}
          <div className="space-y-2">
            <Label>Loại hình ảnh</Label>
            <Select value={imageType} onValueChange={(v) => setImageType(v as ImageType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {imageTypeOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* File Input */}
          <div className="space-y-2">
            <Label>Chọn hình ảnh</Label>
            <div
              className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:border-cyan-400 hover:bg-cyan-50/50 transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileChange}
                className="hidden"
              />
              <Upload className="h-10 w-10 mx-auto text-slate-400 mb-3" />
              <p className="text-sm text-slate-600 font-medium">
                Click để chọn hoặc kéo thả hình ảnh
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Hỗ trợ: JPG, PNG, DICOM (tối đa 10MB/ảnh)
              </p>
            </div>
          </div>

          {/* Selected Files Preview */}
          {files.length > 0 && (
            <div className="space-y-2">
              <Label>Hình ảnh đã chọn ({files.length})</Label>
              <div className="grid grid-cols-3 gap-2">
                {files.map((file, index) => (
                  <div
                    key={index}
                    className="relative group aspect-square rounded-lg overflow-hidden border bg-slate-100"
                  >
                    <img
                      src={URL.createObjectURL(file)}
                      alt={file.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFile(index);
                        }}
                        className="p-2 bg-red-500 rounded-full text-white hover:bg-red-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-1 truncate">
                      {file.name}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Mô tả (tùy chọn)</Label>
            <Textarea
              id="description"
              placeholder="Nhập mô tả cho hình ảnh..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>
        </div>

        <DialogFooter className="flex-shrink-0 gap-2 border-t pt-4">
          <Button variant="ghost" onClick={handleReset} disabled={files.length === 0}>
            Xóa tất cả
          </Button>
          <Button variant="outline" onClick={() => setOpen(false)} className="border-2">
            Hủy
          </Button>
          <Button
            onClick={handleUpload}
            disabled={files.length === 0 || isUploading}
            className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white border-0"
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Đang tải...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Tải lên ({files.length})
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Image Gallery Component to display uploaded images
interface ImageGalleryProps {
  images: DiagnosticImage[];
  onDelete?: (imageId: string) => void;
  canDelete?: boolean;
}

export function ImageGallery({ images, onDelete, canDelete = false }: ImageGalleryProps) {
  const [viewingImage, setViewingImage] = useState<DiagnosticImage | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const handleDelete = async (imageId: string) => {
    setIsDeleting(imageId);
    try {
      await labResultService.deleteImage(imageId);
      toast.success("Đã xóa hình ảnh");
      onDelete?.(imageId);
    } catch {
      toast.error("Không thể xóa hình ảnh");
    } finally {
      setIsDeleting(null);
    }
  };

  if (images.length === 0) return null;

  return (
    <>
      <div className="border-t pt-4 mt-4">
        <div className="flex items-center gap-2 mb-3">
          <ImageIcon className="h-4 w-4 text-cyan-600" />
          <span className="text-sm font-medium">Hình ảnh chẩn đoán ({images.length})</span>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {images.map((image) => (
            <div
              key={image.id}
              className="relative group aspect-square rounded-lg overflow-hidden border bg-slate-100 cursor-pointer"
              onClick={() => setViewingImage(image)}
            >
              <img
                src={image.thumbnailUrl || image.downloadUrl}
                alt={image.fileName}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <button
                  className="p-1.5 bg-white rounded-full text-slate-700 hover:bg-slate-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    setViewingImage(image);
                  }}
                >
                  <ZoomIn className="h-4 w-4" />
                </button>
                {canDelete && (
                  <button
                    className="p-1.5 bg-red-500 rounded-full text-white hover:bg-red-600"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(image.id);
                    }}
                    disabled={isDeleting === image.id}
                  >
                    {isDeleting === image.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </button>
                )}
              </div>
              {image.imageType && (
                <Badge
                  variant="secondary"
                  className="absolute top-1 left-1 text-[10px] px-1.5 py-0.5"
                >
                  {image.imageType}
                </Badge>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Full Image View Dialog */}
      <Dialog open={!!viewingImage} onOpenChange={() => setViewingImage(null)}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-cyan-500" />
              {viewingImage?.fileName}
            </DialogTitle>
            {viewingImage?.description && (
              <DialogDescription>{viewingImage.description}</DialogDescription>
            )}
          </DialogHeader>
          <div className="flex items-center justify-center max-h-[60vh] overflow-hidden">
            {viewingImage && (
              <img
                src={viewingImage.downloadUrl}
                alt={viewingImage.fileName}
                className="max-w-full max-h-[60vh] object-contain rounded-lg"
              />
            )}
          </div>
          <DialogFooter>
            {viewingImage?.downloadUrl && (
              <Button asChild variant="outline" className="gap-2">
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
    </>
  );
}

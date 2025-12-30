"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Image as ImageIcon,
  Upload,
  X,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Download,
  Search,
  Loader2,
  Eye,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { labResultService, labOrderService } from "@/services/lab.service";
import type { LabTestResult, DiagnosticImage, ImageType } from "@/interfaces/lab";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const IMAGE_TYPE_CONFIG: Record<ImageType, { label: string; icon: string; color: string }> = {
  XRAY: { label: "X-Quang", icon: "🩻", color: "bg-blue-100 text-blue-700" },
  CT_SCAN: { label: "CT Scan", icon: "🔬", color: "bg-purple-100 text-purple-700" },
  MRI: { label: "MRI", icon: "🧲", color: "bg-pink-100 text-pink-700" },
  ULTRASOUND: { label: "Siêu âm", icon: "📡", color: "bg-green-100 text-green-700" },
  ENDOSCOPY: { label: "Nội soi", icon: "🔍", color: "bg-amber-100 text-amber-700" },
  PATHOLOGY_SLIDE: { label: "Tiêu bản GPB", icon: "🔬", color: "bg-red-100 text-red-700" },
  PHOTO: { label: "Hình ảnh khác", icon: "📷", color: "bg-gray-100 text-gray-700" },
};

export default function ImagingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [imagingResults, setImagingResults] = useState<LabTestResult[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedResult, setSelectedResult] = useState<LabTestResult | null>(null);
  const [viewerImage, setViewerImage] = useState<DiagnosticImage | null>(null);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Upload form state
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [imageType, setImageType] = useState<ImageType>("XRAY");
  const [description, setDescription] = useState("");

  // Viewer state
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    fetchImagingResults();
  }, []);

  const fetchImagingResults = async () => {
    try {
      setLoading(true);
      // Get all orders and filter for IMAGING category results
      const response = await labOrderService.getAll();
      const allResults: LabTestResult[] = [];
      
      response.content?.forEach((order) => {
        order.results
          .filter((r) => r.labTestCategory === "IMAGING")
          .forEach((r) => allResults.push(r));
      });

      setImagingResults(allResults);
    } catch (error) {
      console.error("Failed to fetch imaging results:", error);
      toast.error("Không thể tải danh sách xét nghiệm hình ảnh");
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files));
    }
  };

  const handleUpload = async () => {
    if (!selectedResult || selectedFiles.length === 0) {
      toast.error("Vui lòng chọn ít nhất 1 hình ảnh");
      return;
    }

    try {
      setUploading(true);
      await labResultService.uploadImages(
        selectedResult.id,
        selectedFiles,
        imageType,
        description || undefined
      );
      toast.success("Đã tải lên hình ảnh thành công!");
      setUploadModalOpen(false);
      setSelectedFiles([]);
      setDescription("");
      await fetchImagingResults();
    } catch (error: any) {
      console.error("Failed to upload images:", error);
      toast.error(error.response?.data?.message || "Không thể tải lên hình ảnh");
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteImage = async (imageId: string) => {
    if (!confirm("Bạn có chắc muốn xóa hình ảnh này?")) return;

    try {
      await labResultService.deleteImage(imageId);
      toast.success("Đã xóa hình ảnh");
      await fetchImagingResults();
      if (viewerImage?.id === imageId) {
        setViewerImage(null);
      }
    } catch (error) {
      toast.error("Không thể xóa hình ảnh");
    }
  };

  const openUploadModal = (result: LabTestResult) => {
    setSelectedResult(result);
    setUploadModalOpen(true);
    setSelectedFiles([]);
    setDescription("");
  };

  const openViewer = (image: DiagnosticImage) => {
    setViewerImage(image);
    setZoom(1);
    setRotation(0);
  };

  const filteredResults = imagingResults.filter((result) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      result.patientName.toLowerCase().includes(query) ||
      result.labTestName.toLowerCase().includes(query) ||
      result.labTestCode.toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-page flex items-center gap-2">
            <ImageIcon className="w-6 h-6" />
            Quản lý hình ảnh chẩn đoán
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {filteredResults.length} xét nghiệm hình ảnh
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="card-base p-4">
        <div className="search-input">
          <Search className="w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm theo tên BN, tên XN, mã XN..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Results Grid */}
      {loading ? (
        <div className="card-base p-12 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-[hsl(var(--primary))]" />
        </div>
      ) : filteredResults.length === 0 ? (
        <div className="card-base p-12 text-center">
          <ImageIcon className="w-12 h-12 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">Không có xét nghiệm hình ảnh nào</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredResults.map((result) => {
            const imageCount = result.images?.length || 0;
            
            return (
              <div key={result.id} className="card-base p-5">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold">{result.labTestName}</h3>
                    <p className="text-sm text-gray-500">
                      {result.patientName} • {result.labTestCode}
                    </p>
                  </div>
                  <button
                    onClick={() => openUploadModal(result)}
                    className="btn-primary text-sm"
                  >
                    <Upload className="w-4 h-4" />
                    Tải ảnh
                  </button>
                </div>

                {/* Images Grid */}
                {imageCount === 0 ? (
                  <div className="bg-gray-50 rounded-lg p-8 text-center">
                    <ImageIcon className="w-8 h-8 mx-auto text-gray-300 mb-2" />
                    <p className="text-sm text-gray-500">Chưa có hình ảnh</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-4 gap-2">
                    {result.images.map((img) => {
                      const typeConfig = IMAGE_TYPE_CONFIG[img.imageType];
                      
                      return (
                        <div key={img.id} className="relative group">
                          {/* Image */}
                          <img
                            src={img.thumbnailUrl || img.downloadUrl}
                            alt={img.description || ""}
                            className="w-full h-24 object-cover rounded-lg border cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => openViewer(img)}
                          />
                          
                          {/* Type Badge */}
                          <div className={`absolute top-1 left-1 px-1.5 py-0.5 rounded text-xs ${typeConfig.color}`}>
                            {typeConfig.icon}
                          </div>

                          {/* Actions */}
                          <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                            <button
                              onClick={() => openViewer(img)}
                              className="p-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                              title="Xem"
                            >
                              <Eye className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => handleDeleteImage(img.id)}
                              className="p-1 bg-red-600 text-white rounded hover:bg-red-700"
                              title="Xóa"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Upload Modal */}
      <Dialog open={uploadModalOpen} onOpenChange={setUploadModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Tải lên hình ảnh chẩn đoán</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Test Info */}
            {selectedResult && (
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="font-medium">{selectedResult.labTestName}</p>
                <p className="text-sm text-gray-600">
                  {selectedResult.patientName} • {selectedResult.labTestCode}
                </p>
              </div>
            )}

            {/* Image Type */}
            <div>
              <label className="label-base">Loại hình ảnh *</label>
              <select
                className="input-base"
                value={imageType}
                onChange={(e) => setImageType(e.target.value as ImageType)}
              >
                {Object.entries(IMAGE_TYPE_CONFIG).map(([key, config]) => (
                  <option key={key} value={key}>
                    {config.icon} {config.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div>
              <label className="label-base">Mô tả</label>
              <textarea
                className="input-base min-h-[60px]"
                placeholder="Mô tả hình ảnh..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            {/* File Upload */}
            <div>
              <label className="label-base">Chọn hình ảnh *</label>
              <input
                type="file"
                multiple
                accept="image/*"
                className="input-base"
                onChange={handleFileSelect}
              />
              {selectedFiles.length > 0 && (
                <p className="text-sm text-gray-500 mt-2">
                  Đã chọn {selectedFiles.length} hình ảnh
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <button
                onClick={() => setUploadModalOpen(false)}
                className="btn-secondary flex-1"
                disabled={uploading}
              >
                Hủy
              </button>
              <button
                onClick={handleUpload}
                disabled={uploading || selectedFiles.length === 0}
                className="btn-primary flex-1"
              >
                {uploading && <Loader2 className="w-4 h-4 animate-spin" />}
                <Upload className="w-4 h-4" />
                Tải lên
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Image Viewer Modal */}
      <Dialog open={!!viewerImage} onOpenChange={() => setViewerImage(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Xem hình ảnh</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setZoom(Math.max(0.5, zoom - 0.25))}
                  className="btn-icon"
                  title="Thu nhỏ"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setZoom(Math.min(3, zoom + 0.25))}
                  className="btn-icon"
                  title="Phóng to"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setRotation((rotation + 90) % 360)}
                  className="btn-icon"
                  title="Xoay"
                >
                  <RotateCw className="w-4 h-4" />
                </button>
                {viewerImage?.downloadUrl && (
                  <a
                    href={viewerImage.downloadUrl}
                    download
                    className="btn-icon"
                    title="Tải xuống"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                )}
              </div>
            </DialogTitle>
          </DialogHeader>

          {viewerImage && (
            <div className="space-y-4">
              {/* Image Info */}
              <div className="bg-gray-50 p-3 rounded-lg text-sm">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-gray-500">Loại:</span>{" "}
                    <span className="font-medium">
                      {IMAGE_TYPE_CONFIG[viewerImage.imageType].label}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Kích thước:</span>{" "}
                    <span className="font-medium">
                      {(viewerImage.fileSize / 1024).toFixed(1)} KB
                    </span>
                  </div>
                  {viewerImage.description && (
                    <div className="col-span-2">
                      <span className="text-gray-500">Mô tả:</span>{" "}
                      <span className="font-medium">{viewerImage.description}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Image Viewer */}
              <div className="flex items-center justify-center bg-gray-900 rounded-lg overflow-hidden min-h-[400px]">
                <img
                  src={viewerImage.downloadUrl}
                  alt={viewerImage.description || ""}
                  style={{
                    transform: `scale(${zoom}) rotate(${rotation}deg)`,
                    transition: "transform 0.2s",
                    maxWidth: "100%",
                    maxHeight: "60vh",
                  }}
                  className="object-contain"
                />
              </div>

              {/* Zoom Info */}
              <div className="text-center text-sm text-gray-500">
                Zoom: {Math.round(zoom * 100)}% • Xoay: {rotation}°
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

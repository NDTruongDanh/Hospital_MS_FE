"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Save,
  Loader2,
  User,
  Calendar,
  Stethoscope,
  TestTube,
  AlertCircle,
  CheckCircle,
  Upload,
  X,
  Image as ImageIcon,
} from "lucide-react";
import { toast } from "sonner";
import { labOrderService, labResultService } from "@/services/lab.service";
import type { LabOrder, LabTestResult, ResultStatus, ImageType } from "@/interfaces/lab";

const STATUS_OPTIONS: ResultStatus[] = ["PENDING", "PROCESSING", "COMPLETED"];
const STATUS_LABELS: Record<ResultStatus, string> = {
  PENDING: "Chờ xử lý",
  PROCESSING: "Đang xử lý",
  COMPLETED: "Hoàn thành",
  CANCELLED: "Đã hủy",
};

const IMAGE_TYPE_OPTIONS: ImageType[] = ["XRAY", "CT_SCAN", "MRI", "ULTRASOUND", "PHOTO"];
const IMAGE_TYPE_LABELS: Record<ImageType, string> = {
  XRAY: "X-Quang",
  CT_SCAN: "CT Scan",
  MRI: "MRI",
  ULTRASOUND: "Siêu âm",
  ENDOSCOPY: "Nội soi",
  PATHOLOGY_SLIDE: "Tiêu bản GPB",
  PHOTO: "Hình ảnh khác",
};


export default function LabOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.orderId as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [order, setOrder] = useState<LabOrder | null>(null);
  const [results, setResults] = useState<Record<string, Partial<LabTestResult>>>({});
  const [uploadingImages, setUploadingImages] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchOrderDetail();
  }, [orderId]);

  const fetchOrderDetail = async () => {
    try {
      setLoading(true);
      const orderData = await labOrderService.getById(orderId);
      setOrder(orderData);

      // Initialize results state from existing data
      const initialResults: Record<string, Partial<LabTestResult>> = {};
      orderData.results.forEach((result) => {
        initialResults[result.id] = {
          resultValue: result.resultValue || "",
          status: result.status,
          isAbnormal: result.isAbnormal,
          interpretation: result.interpretation || "",
          notes: result.notes || "",
        };
      });
      setResults(initialResults);
    } catch (error) {
      console.error("Failed to fetch order detail:", error);
      toast.error("Không thể tải thông tin đơn xét nghiệm");
     router.back();
    } finally {
      setLoading(false);
    }
  };

  const updateResult = (resultId: string, field: keyof LabTestResult, value: any) => {
    setResults((prev) => ({
      ...prev,
      [resultId]: {
        ...prev[resultId],
        [field]: value,
      },
    }));
  };

  const handleSaveResult = async (result: LabTestResult) => {
    const updates = results[result.id];
    if (!updates) return;

    try {
      setSaving(true);
      await labResultService.update(result.id, {
        resultValue: updates.resultValue,
        status: updates.status,
        isAbnormal: updates.isAbnormal,
        interpretation: updates.interpretation,
        notes: updates.notes,
      });
      toast.success(`Đã lưu kết quả ${result.labTestName}`);
      await fetchOrderDetail(); // Refresh to get updated data
    } catch (error: any) {
      console.error("Failed to save result:", error);
      toast.error(error.response?.data?.message || "Không thể lưu kết quả");
    } finally {
      setSaving(false);
    }
  };

  const handleUploadImages = async (resultId: string, files: FileList | null) => {
    if (!files || files.length === 0) return;

    try {
      setUploadingImages((prev) => ({ ...prev, [resultId]: true }));
      const fileArray = Array.from(files);
      await labResultService.uploadImages(resultId, fileArray, "PHOTO");
      toast.success("Đã tải lên hình ảnh thành công");
      await fetchOrderDetail();
    } catch (error: any) {
      console.error("Failed to upload images:", error);
      toast.error(error.response?.data?.message || "Không thể tải lên hình ảnh");
    } finally {
      setUploadingImages((prev) => ({ ...prev, [resultId]: false }));
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("vi-VN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-[hsl(var(--primary))]" />
      </div>
    );
  }

  if (!order) {
    return null;
  }

  const completedCount = order.results.filter((r) => r.status === "COMPLETED").length;
  const progress = order.totalTests > 0 ? Math.round((completedCount / order.totalTests) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="btn-icon">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-display">Đơn xét nghiệm #{order.orderNumber}</h1>
          <p className="text-sm text-gray-500 mt-1">
            {completedCount}/{order.totalTests} xét nghiệm hoàn thành ({progress}%)
          </p>
        </div>
        {order.priority === "URGENT" && (
          <span className="badge bg-red-100 text-red-700 border-red-200 text-lg px-4 py-2">
            🚨 Khẩn cấp
          </span>
        )}
      </div>

      {/* Patient & Doctor Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card-base p-4">
          <div className="flex items-center gap-2 text-blue-600 mb-2">
            <User className="w-4 h-4" />
            <span className="font-semibold">Bệnh nhân</span>
          </div>
          <p className="font-medium">{order.patientName}</p>
          <p className="text-sm text-gray-500">ID: {order.patientId}</p>
        </div>

        <div className="card-base p-4">
          <div className="flex items-center gap-2 text-green-600 mb-2">
            <Stethoscope className="w-4 h-4" />
            <span className="font-semibold">Bác sĩ chỉ định</span>
          </div>
          <p className="font-medium">{order.orderingDoctorName || "—"}</p>
        </div>

        <div className="card-base p-4">
          <div className="flex items-center gap-2 text-purple-600 mb-2">
            <Calendar className="w-4 h-4" />
            <span className="font-semibold">Ngày chỉ định</span>
          </div>
          <p className="font-medium">{formatDate(order.orderDate)}</p>
        </div>
      </div>

      {/* Notes */}
      {order.notes && (
        <div className="card-base p-4 bg-amber-50 border-amber-200">
          <p className="font-semibold text-amber-900 mb-1">📝 Ghi chú từ bác sĩ:</p>
          <p className="text-amber-800">{order.notes}</p>
        </div>
      )}

      {/* Test Results */}
      <div className="space-y-4">
        <h2 className="text-section">Kết quả xét nghiệm</h2>

        {order.results.map((result) => {
          const currentData = results[result.id] || {};
          const isUploading = uploadingImages[result.id];

          return (
            <div key={result.id} className="card-base p-6">
              {/* Test Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <TestTube className="w-5 h-5 text-[hsl(var(--primary))]" />
                    {result.labTestName}
                  </h3>
                  <p className="text-sm text-gray-500">
                    Mã: {result.labTestCode} • Loại: {result.labTestCategory}
                  </p>
                </div>
                <span
                  className={`badge ${
                    result.status === "COMPLETED"
                      ? "badge-success"
                      : result.status === "PROCESSING"
                      ? "badge-warning"
                      : "badge-secondary"
                  }`}
                >
                  {result.status === "COMPLETED" && <CheckCircle className="w-3 h-3" />}
                  {STATUS_LABELS[result.status]}
                </span>
              </div>

              {/* Form Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Status */}
                <div>
                  <label className="label-base">Trạng thái *</label>
                  <select
                    className="input-base"
                    value={currentData.status || result.status}
                    onChange={(e) =>
                      updateResult(result.id, "status", e.target.value as ResultStatus)
                    }
                  >
                    {STATUS_OPTIONS.map((status) => (
                      <option key={status} value={status}>
                        {STATUS_LABELS[status]}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Result Value */}
                <div>
                  <label className="label-base">Giá trị kết quả</label>
                  <input
                    type="text"
                    className="input-base"
                    placeholder="Nhập kết quả..."
                    value={currentData.resultValue || ""}
                    onChange={(e) => updateResult(result.id, "resultValue", e.target.value)}
                  />
                </div>

                {/* Abnormal Checkbox */}
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id={`abnormal-${result.id}`}
                    className="w-4 h-4"
                    checked={currentData.isAbnormal ?? result.isAbnormal}
                    onChange={(e) => updateResult(result.id, "isAbnormal", e.target.checked)}
                  />
                  <label htmlFor={`abnormal-${result.id}`} className="text-sm font-medium cursor-pointer">
                    ⚠️ Kết quả bất thường
                  </label>
                </div>

                {/* Interpretation */}
                <div className="md:col-span-2">
                  <label className="label-base">Diễn giải kết quả</label>
                  <textarea
                    className="input-base min-h-[80px] resize-none"
                    placeholder="Nhập diễn giải kết quả..."
                    value={currentData.interpretation || ""}
                    onChange={(e) => updateResult(result.id, "interpretation", e.target.value)}
                  />
                </div>

                {/* Notes */}
                <div className="md:col-span-2">
                  <label className="label-base">Ghi chú</label>
                  <textarea
                    className="input-base min-h-[60px] resize-none"
                    placeholder="Ghi chú thêm..."
                    value={currentData.notes || ""}
                    onChange={(e) => updateResult(result.id, "notes", e.target.value)}
                  />
                </div>
              </div>

              {/* Images */}
              {result.labTestCategory === "IMAGING" && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <label className="label-base mb-2">Hình ảnh chẩn đoán</label>
                  
                  {/* Upload Button */}
                  <div className="flex gap-2 mb-3">
                    <label className="btn-secondary cursor-pointer">
                      <Upload className="w-4 h-4" />
                      Tải lên hình ảnh
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleUploadImages(result.id, e.target.files)}
                        disabled={isUploading}
                      />
                    </label>
                    {isUploading && (
                      <span className="flex items-center gap-2 text-sm text-gray-500">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Đang tải lên...
                      </span>
                    )}
                  </div>

                  {/* Image Grid */}
                  {result.images && result.images.length > 0 && (
                    <div className="grid grid-cols-4 gap-2">
                      {result.images.map((img) => (
                        <div key={img.id} className="relative group">
                          <img
                            src={img.thumbnailUrl || img.downloadUrl}
                            alt={img.description || ""}
                            className="w-full h-24 object-cover rounded-lg border"
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all rounded-lg flex items-center justify-center">
                            <ImageIcon className="w-6 h-6 text-white opacity-0 group-hover:opacity-100" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Save Button */}
              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => handleSaveResult(result)}
                  disabled={saving}
                  className="btn-primary"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  <Save className="w-4 h-4" />
                  Lưu kết quả
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

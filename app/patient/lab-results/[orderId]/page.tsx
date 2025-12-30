"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  User,
  Stethoscope,
  TestTube,
  AlertTriangle,
  CheckCircle,
  Download,
  Image as ImageIcon,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { labOrderService } from "@/services/lab.service";
import type { LabOrder, LabTestResult } from "@/interfaces/lab";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function PatientLabResultDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.orderId as string;

  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<LabOrder | null>(null);
  const [viewerImage, setViewerImage] = useState<string | null>(null);

  useEffect(() => {
    fetchOrderDetail();
  }, [orderId]);

  const fetchOrderDetail = async () => {
    try {
      setLoading(true);
      const data = await labOrderService.getById(orderId);
      setOrder(data);
    } catch (error) {
      console.error("Failed to fetch order detail:", error);
      toast.error("Không thể tải thông tin kết quả");
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("vi-VN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  const getResultStatusBadge = (result: LabTestResult) => {
    if (result.status === "COMPLETED") {
      if (result.isAbnormal) {
        return (
          <span className="badge bg-red-100 text-red-700 border-red-200">
            <AlertTriangle className="w-3 h-3" />
            Bất thường
          </span>
        );
      }
      return (
        <span className="badge bg-green-100 text-green-700 border-green-200">
          <CheckCircle className="w-3 h-3" />
          Bình thường
        </span>
      );
    }
    return (
      <span className="badge badge-secondary">
        Đang xử lý
      </span>
    );
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

  const completedResults = order.results.filter((r) => r.status === "COMPLETED");
  const abnormalResults = completedResults.filter((r) => r.isAbnormal);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="btn-icon">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-display">Kết quả xét nghiệm #{order.orderNumber}</h1>
          <p className="text-sm text-gray-500 mt-1">
            {completedResults.length}/{order.totalTests} xét nghiệm đã hoàn thành
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card-base p-4">
          <div className="flex items-center gap-2 text-blue-600 mb-2">
            <Calendar className="w-4 h-4" />
            <span className="font-semibold">Ngày chỉ định</span>
          </div>
          <p className="font-medium">{formatDate(order.orderDate)}</p>
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
            <TestTube className="w-4 h-4" />
            <span className="font-semibold">Trạng thái</span>
          </div>
          <p className="font-medium">
            {order.status === "COMPLETED" ? "Hoàn thành" : "Đang xử lý"}
          </p>
        </div>
      </div>

      {/* Abnormal Alert */}
      {abnormalResults.length > 0 && (
        <div className="card-base p-4 bg-red-50 border-red-200">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-red-900 mb-1">
                ⚠️ Phát hiện {abnormalResults.length} kết quả bất thường
              </p>
              <p className="text-sm text-red-800">
                Vui lòng liên hệ bác sĩ để được tư vấn thêm về các chỉ số này.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Notes */}
      {order.notes && (
        <div className="card-base p-4 bg-blue-50 border-blue-200">
          <p className="font-semibold text-blue-900 mb-1">📝 Ghi chú từ bác sĩ:</p>
          <p className="text-blue-800">{order.notes}</p>
        </div>
      )}

      {/* Results */}
      <div className="space-y-4">
        <h2 className="text-section">Chi tiết kết quả</h2>

        {order.results.map((result) => (
          <div
            key={result.id}
            className={`card-base p-6 ${
              result.isAbnormal && result.status === "COMPLETED"
                ? "border-l-4 border-l-red-500 bg-red-50/30"
                : ""
            }`}
          >
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
              {getResultStatusBadge(result)}
            </div>

            {/* Result Details */}
            {result.status === "COMPLETED" ? (
              <div className="space-y-3">
                {/* Result Value */}
                {result.resultValue && (
                  <div className="bg-white rounded-lg p-4 border">
                    <p className="text-sm text-gray-500 mb-1">Kết quả</p>
                    <p className={`text-xl font-bold ${result.isAbnormal ? "text-red-600" : "text-green-600"}`}>
                      {result.resultValue}
                    </p>
                  </div>
                )}

                {/* Interpretation */}
                {result.interpretation && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm font-semibold text-gray-700 mb-1">Diễn giải:</p>
                    <p className="text-gray-800">{result.interpretation}</p>
                  </div>
                )}

                {/* Notes */}
                {result.notes && (
                  <div className="bg-blue-50 rounded-lg p-4">
                    <p className="text-sm font-semibold text-blue-700 mb-1">Ghi chú:</p>
                    <p className="text-blue-800">{result.notes}</p>
                  </div>
                )}

                {/* Images */}
                {result.images && result.images.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold mb-2">Hình ảnh chẩn đoán ({result.images.length})</p>
                    <div className="grid grid-cols-4 gap-2">
                      {result.images.map((img) => (
                        <div
                          key={img.id}
                          className="relative group cursor-pointer"
                          onClick={() => setViewerImage(img.downloadUrl || "")}
                        >
                          <img
                            src={img.thumbnailUrl || img.downloadUrl}
                            alt={img.description || ""}
                            className="w-full h-24 object-cover rounded-lg border hover:opacity-80 transition-opacity"
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all rounded-lg flex items-center justify-center">
                            <ImageIcon className="w-6 h-6 text-white opacity-0 group-hover:opacity-100" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Performed Info */}
                <div className="text-xs text-gray-500 pt-2 border-t">
                  {result.performedBy && <span>Thực hiện bởi: {result.performedBy}</span>}
                  {result.completedAt && (
                    <span className="ml-4">
                      • Hoàn thành: {formatDate(result.completedAt)}
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 rounded-lg p-8 text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-gray-400 mb-2" />
                <p className="text-gray-500">Kết quả đang được xử lý...</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Image Viewer Modal */}
      <Dialog open={!!viewerImage} onOpenChange={() => setViewerImage(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Hình ảnh chẩn đoán</DialogTitle>
          </DialogHeader>
          {viewerImage && (
            <div className="flex items-center justify-center bg-gray-900 rounded-lg overflow-hidden min-h-[400px]">
              <img
                src={viewerImage}
                alt=""
                className="max-w-full max-h-[70vh] object-contain"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

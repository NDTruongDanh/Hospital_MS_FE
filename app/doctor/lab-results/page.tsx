"use client";

import { useState, useEffect } from "react";
import {
  Search,
  TestTube,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  Eye,
  Edit,
  Image,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import { labResultService, LabTestResult, ResultStatus } from "@/services/lab.service";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const STATUS_CONFIG: Record<ResultStatus, { label: string; class: string; icon: typeof CheckCircle }> = {
  PENDING: { label: "Chờ xử lý", class: "badge-warning", icon: Clock },
  PROCESSING: { label: "Đang xử lý", class: "badge-info", icon: Loader2 },
  COMPLETED: { label: "Hoàn thành", class: "badge-success", icon: CheckCircle },
  CANCELLED: { label: "Đã hủy", class: "badge-secondary", icon: AlertCircle },
};

export default function DoctorLabResultsPage() {
  const [results, setResults] = useState<LabTestResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedResult, setSelectedResult] = useState<LabTestResult | null>(null);
  const [editingResult, setEditingResult] = useState<LabTestResult | null>(null);

  useEffect(() => {
    fetchResults();
  }, [statusFilter]);

  const fetchResults = async () => {
    try {
      setLoading(true);
      const response = await labResultService.getAll();
      let data = response.content || [];
      
      // Filter by status if selected
      if (statusFilter) {
        data = data.filter((r: LabTestResult) => r.status === statusFilter);
      }
      
      setResults(data);
    } catch (error) {
      console.error("Failed to fetch lab results:", error);
      toast.error("Không thể tải kết quả xét nghiệm");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateInterpretation = async (result: LabTestResult, interpretation: string) => {
    try {
      await labResultService.update(result.id, { 
        interpretation,
        interpretedBy: "current-doctor" // Backend should use JWT
      });
      toast.success("Đã cập nhật nhận định");
      fetchResults();
      setEditingResult(null);
    } catch (error) {
      toast.error("Không thể cập nhật nhận định");
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const filteredResults = results.filter(r => 
    !searchQuery || 
    r.patientName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.labTestName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pendingCount = results.filter(r => r.status === "PENDING" || r.status === "PROCESSING").length;
  const completedCount = results.filter(r => r.status === "COMPLETED").length;
  const abnormalCount = results.filter(r => r.isAbnormal).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-display">Kết quả xét nghiệm</h1>
        <p className="text-[hsl(var(--muted-foreground))] mt-1">
          Xem và nhận định kết quả xét nghiệm bệnh nhân
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card-base flex items-center gap-4">
          <div className="p-3 rounded-lg bg-amber-100 dark:bg-amber-900">
            <Clock className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <p className="text-small">Chờ xử lý</p>
            <p className="text-2xl font-bold">{pendingCount}</p>
          </div>
        </div>
        
        <div className="card-base flex items-center gap-4">
          <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900">
            <CheckCircle className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <p className="text-small">Hoàn thành</p>
            <p className="text-2xl font-bold">{completedCount}</p>
          </div>
        </div>
        
        <div className="card-base flex items-center gap-4">
          <div className="p-3 rounded-lg bg-red-100 dark:bg-red-900">
            <AlertCircle className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <p className="text-small">Bất thường</p>
            <p className="text-2xl font-bold text-red-600">{abnormalCount}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card-base">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="search-input w-full max-w-none">
              <Search className="w-4 h-4 text-[hsl(var(--muted-foreground))]" />
              <input
                type="text"
                placeholder="Tìm theo tên bệnh nhân, loại xét nghiệm..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <select
            className="dropdown min-w-[180px]"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">Tất cả trạng thái</option>
            <option value="PENDING">Chờ xử lý</option>
            <option value="PROCESSING">Đang xử lý</option>
            <option value="COMPLETED">Hoàn thành</option>
          </select>
        </div>
      </div>

      {/* Results Table */}
      <div className="table-container">
        <table className="table-base">
          <thead>
            <tr>
              <th>Bệnh nhân</th>
              <th>Xét nghiệm</th>
              <th>Kết quả</th>
              <th>Trạng thái</th>
              <th>Ngày thực hiện</th>
              <th className="w-24">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="text-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto text-[hsl(var(--primary))]" />
                  <p className="text-small mt-2">Đang tải...</p>
                </td>
              </tr>
            ) : filteredResults.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-12">
                  <TestTube className="w-12 h-12 mx-auto text-[hsl(var(--muted-foreground))] opacity-50" />
                  <p className="text-[hsl(var(--muted-foreground))] mt-2">
                    Không có kết quả xét nghiệm
                  </p>
                </td>
              </tr>
            ) : (
              filteredResults.map((result) => {
                const statusConfig = STATUS_CONFIG[result.status];
                const StatusIcon = statusConfig.icon;

                return (
                  <tr key={result.id} className={result.isAbnormal ? "bg-red-50 dark:bg-red-900/10" : ""}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="avatar">
                          {result.patientName?.charAt(0) || "?"}
                        </div>
                        <div>
                          <p className="font-medium">{result.patientName}</p>
                          <p className="text-small">ID: {result.patientId?.slice(0, 8)}</p>
                        </div>
                      </div>
                    </td>

                    <td>
                      <div>
                        <p className="font-medium">{result.labTestName}</p>
                        <p className="text-small">{result.labTestCode}</p>
                      </div>
                    </td>

                    <td>
                      <div className="flex items-center gap-2">
                        <span className={result.isAbnormal ? "text-red-600 font-bold" : ""}>
                          {result.resultValue || "-"}
                        </span>
                        {result.isAbnormal && (
                          <span className="badge badge-danger">Bất thường</span>
                        )}
                      </div>
                    </td>

                    <td>
                      <span className={`badge ${statusConfig.class}`}>
                        <StatusIcon className="w-3 h-3" />
                        {statusConfig.label}
                      </span>
                    </td>

                    <td className="text-small">
                      {formatDate(result.performedAt || result.createdAt)}
                    </td>

                    <td>
                      <div className="flex gap-1">
                        <button
                          className="btn-icon w-8 h-8"
                          onClick={() => setSelectedResult(result)}
                          title="Xem chi tiết"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {result.status === "COMPLETED" && (
                          <button
                            className="btn-icon w-8 h-8"
                            onClick={() => setEditingResult(result)}
                            title="Nhận định"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Result Detail Modal */}
      <Dialog open={!!selectedResult} onOpenChange={() => setSelectedResult(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Chi tiết kết quả xét nghiệm</DialogTitle>
          </DialogHeader>
          
          {selectedResult && (
            <div className="space-y-6">
              {/* Patient Info */}
              <div className="flex items-center gap-4 p-4 rounded-lg bg-[hsl(var(--secondary))]">
                <div className="avatar w-12 h-12 text-lg">
                  {selectedResult.patientName?.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-lg">{selectedResult.patientName}</p>
                  <p className="text-small">ID: {selectedResult.patientId}</p>
                </div>
              </div>

              {/* Test Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-label">Loại xét nghiệm</p>
                  <p className="font-medium">{selectedResult.labTestName}</p>
                </div>
                <div>
                  <p className="text-label">Mã xét nghiệm</p>
                  <p className="font-medium">{selectedResult.labTestCode}</p>
                </div>
                <div>
                  <p className="text-label">Kết quả</p>
                  <p className={`font-bold text-lg ${selectedResult.isAbnormal ? "text-red-600" : ""}`}>
                    {selectedResult.resultValue || "Chưa có"}
                  </p>
                </div>
                <div>
                  <p className="text-label">Trạng thái</p>
                  <span className={`badge ${STATUS_CONFIG[selectedResult.status].class}`}>
                    {STATUS_CONFIG[selectedResult.status].label}
                  </span>
                </div>
              </div>

              {/* Interpretation */}
              {selectedResult.interpretation && (
                <div className="p-4 bg-white border-2 border-gray-200 rounded-xl shadow-sm">
                  <p className="text-label mb-2">Nhận định của bác sĩ</p>
                  <p>{selectedResult.interpretation}</p>
                  {selectedResult.interpretedBy && (
                    <p className="text-small mt-2">- BS. {selectedResult.interpretedBy}</p>
                  )}
                </div>
              )}

              {/* Images */}
              {selectedResult.images && selectedResult.images.length > 0 && (
                <div>
                  <p className="text-label mb-2">Hình ảnh ({selectedResult.images.length})</p>
                  <div className="grid grid-cols-3 gap-2">
                    {selectedResult.images.map((img, index) => (
                      <div key={index} className="p-4 bg-white border-2 border-gray-200 rounded-xl shadow-sm space-y-3">
                        <Image className="w-8 h-8 text-[hsl(var(--muted-foreground))]" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              {selectedResult.notes && (
                <div>
                  <p className="text-label mb-2">Ghi chú</p>
                  <p className="text-sm">{selectedResult.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Interpretation Modal */}
      <Dialog open={!!editingResult} onOpenChange={() => setEditingResult(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nhận định kết quả</DialogTitle>
          </DialogHeader>
          
          {editingResult && (
            <InterpretationForm 
              result={editingResult} 
              onSubmit={handleUpdateInterpretation}
              onCancel={() => setEditingResult(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Interpretation Form Component
function InterpretationForm({ 
  result, 
  onSubmit, 
  onCancel 
}: { 
  result: LabTestResult; 
  onSubmit: (result: LabTestResult, interpretation: string) => void;
  onCancel: () => void;
}) {
  const [interpretation, setInterpretation] = useState(result.interpretation || "");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await onSubmit(result, interpretation);
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-4 bg-white border-2 border-gray-200 rounded-xl shadow-sm">
        <p className="font-medium">{result.labTestName}</p>
        <p className="text-small">Bệnh nhân: {result.patientName}</p>
        <p className={`font-bold mt-2 ${result.isAbnormal ? "text-red-600" : ""}`}>
          Kết quả: {result.resultValue}
          {result.isAbnormal && " (Bất thường)"}
        </p>
      </div>

      <div className="space-y-2">
        <label className="text-label">Nhận định *</label>
        <textarea
          className="input-base min-h-[120px]"
          placeholder="Nhập nhận định của bác sĩ về kết quả xét nghiệm..."
          value={interpretation}
          onChange={(e) => setInterpretation(e.target.value)}
          required
        />
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-[hsl(var(--border))]">
        <button type="button" onClick={onCancel} className="btn-secondary">
          Hủy
        </button>
        <button type="submit" disabled={loading} className="btn-primary">
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          Lưu nhận định
        </button>
      </div>
    </form>
  );
}

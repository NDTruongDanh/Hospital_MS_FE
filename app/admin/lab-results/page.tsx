"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Search,
  TestTube,
  Eye,
  Edit2,
  Loader2,
  CheckCircle,
  Clock,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { labResultService, LabTestResult, ResultStatus, LabTestResultUpdateRequest } from "@/services/lab.service";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const STATUS_CONFIG: Record<ResultStatus, { label: string; class: string; icon: typeof Clock }> = {
  PENDING: { label: "Chờ xử lý", class: "badge-warning", icon: Clock },
  PROCESSING: { label: "Đang làm", class: "badge-info", icon: Loader2 },
  COMPLETED: { label: "Hoàn thành", class: "badge-success", icon: CheckCircle },
  CANCELLED: { label: "Đã hủy", class: "badge-danger", icon: Clock },
};

export default function AdminLabResultsPage() {
  const router = useRouter();
  const [results, setResults] = useState<LabTestResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [selectedResult, setSelectedResult] = useState<LabTestResult | null>(null);
  const [editingResult, setEditingResult] = useState<LabTestResult | null>(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    resultValue: "",
    isAbnormal: false,
    interpretation: "",
    performedBy: "",
  });

  useEffect(() => {
    fetchResults();
  }, []);

  const fetchResults = async () => {
    try {
      setLoading(true);
      const response = await labResultService.getAll();
      setResults(response.content || []);
    } catch (error) {
      console.error("Failed to fetch lab results:", error);
      toast.error("Không thể tải danh sách kết quả");
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (result: LabTestResult) => {
    setEditingResult(result);
    setFormData({
      resultValue: result.resultValue || "",
      isAbnormal: result.isAbnormal || false,
      interpretation: result.interpretation || "",
      performedBy: result.performedBy || "",
    });
  };

  const handleSave = async () => {
    if (!editingResult) return;
    try {
      setSaving(true);
      const updateData: LabTestResultUpdateRequest = {
        resultValue: formData.resultValue,
        isAbnormal: formData.isAbnormal,
        interpretation: formData.interpretation || undefined,
        performedBy: formData.performedBy || undefined,
        status: "COMPLETED",
      };
      
      await labResultService.update(editingResult.id, updateData);
      toast.success("Đã lưu kết quả xét nghiệm");
      setEditingResult(null);
      fetchResults();
    } catch (error) {
      console.error("Failed to save result:", error);
      toast.error("Không thể lưu kết quả");
    } finally {
      setSaving(false);
    }
  };

  const formatDateTime = (dateStr?: string) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleString("vi-VN");
  };

  const filteredResults = results.filter(r => {
    const matchesSearch = r.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         r.labTestName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = !statusFilter || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-display">Kết quả xét nghiệm</h1>
        <p className="text-[hsl(var(--muted-foreground))] mt-1">
          Quản lý và xem tất cả kết quả xét nghiệm
        </p>
      </div>

      {/* Filters */}
      <div className="card-base">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="search-input w-full max-w-none">
              <Search className="w-4 h-4 text-[hsl(var(--muted-foreground))]" />
              <input
                type="text"
                placeholder="Tìm theo bệnh nhân, xét nghiệm..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <select
            className="dropdown"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">Tất cả trạng thái</option>
            <option value="PENDING">Chờ xử lý</option>
            <option value="PROCESSING">Đang làm</option>
            <option value="COMPLETED">Hoàn thành</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="table-container">
        <table className="table-base">
          <thead>
            <tr>
              <th>Bệnh nhân</th>
              <th>Xét nghiệm</th>
              <th>Danh mục</th>
              <th>Trạng thái</th>
              <th>Kết quả</th>
              <th className="w-32"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="text-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto text-[hsl(var(--primary))]" />
                </td>
              </tr>
            ) : filteredResults.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-12">
                  <TestTube className="w-12 h-12 mx-auto text-[hsl(var(--muted-foreground))] opacity-50" />
                  <p className="text-[hsl(var(--muted-foreground))] mt-2">
                    Không có kết quả nào
                  </p>
                </td>
              </tr>
            ) : (
              filteredResults.map((result) => {
                const status = STATUS_CONFIG[result.status] || STATUS_CONFIG.PENDING;
                const StatusIcon = status.icon;
                return (
                  <tr key={result.id}>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="avatar w-8 h-8 text-sm">{result.patientName.charAt(0)}</div>
                        {result.patientName}
                      </div>
                    </td>
                    <td>{result.labTestName}</td>
                    <td>
                      <span className="badge badge-secondary">{result.labTestCategory}</span>
                    </td>
                    <td>
                      <span className={`badge ${status.class}`}>
                        <StatusIcon className={`w-3 h-3 ${result.status === "PROCESSING" ? "animate-spin" : ""}`} />
                        {status.label}
                      </span>
                    </td>
                    <td>
                      {result.resultValue ? (
                        <div className="flex items-center gap-2">
                          <span className="text-sm truncate max-w-[150px]">{result.resultValue}</span>
                          {result.isAbnormal && (
                            <AlertCircle className="w-4 h-4 text-red-500" />
                          )}
                        </div>
                      ) : (
                        <span className="text-[hsl(var(--muted-foreground))]">-</span>
                      )}
                    </td>
                    <td>
                      <div className="flex gap-2">
                        <button
                          onClick={() => router.push(`/admin/lab-results/${result.id}`)}
                          className="btn-icon"
                          title="Xem chi tiết"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openEditModal(result)}
                          className="btn-icon"
                          title="Nhập/Sửa kết quả"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* View Modal */}
      <Dialog open={!!selectedResult} onOpenChange={() => setSelectedResult(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Chi tiết kết quả xét nghiệm</DialogTitle>
          </DialogHeader>
          {selectedResult && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-label">Bệnh nhân</p>
                  <p className="font-semibold">{selectedResult.patientName}</p>
                </div>
                <div>
                  <p className="text-label">Xét nghiệm</p>
                  <p className="font-semibold">{selectedResult.labTestName}</p>
                </div>
              </div>
              
              {selectedResult.resultValue && (
                <div>
                  <p className="text-label">Kết quả</p>
                  <p className={`font-semibold ${selectedResult.isAbnormal ? "text-red-600" : ""}`}>
                    {selectedResult.resultValue}
                    {selectedResult.isAbnormal && " (Bất thường)"}
                  </p>
                </div>
              )}

              {selectedResult.interpretation && (
                <div>
                  <p className="text-label">Diễn giải</p>
                  <p>{selectedResult.interpretation}</p>
                </div>
              )}

              {selectedResult.performedBy && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-label">Người thực hiện</p>
                    <p>{selectedResult.performedBy}</p>
                  </div>
                  {selectedResult.performedAt && (
                    <div>
                      <p className="text-label">Thời gian</p>
                      <p>{formatDateTime(selectedResult.performedAt)}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={!!editingResult} onOpenChange={() => setEditingResult(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nhập kết quả xét nghiệm</DialogTitle>
          </DialogHeader>
          {editingResult && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-[hsl(var(--secondary))]">
                <p className="font-semibold">{editingResult.patientName}</p>
                <p className="text-small">{editingResult.labTestName}</p>
              </div>

              <div className="space-y-2">
                <label className="text-label">Kết quả *</label>
                <textarea
                  className="input-base min-h-[80px] resize-none"
                  value={formData.resultValue}
                  onChange={(e) => setFormData({ ...formData, resultValue: e.target.value })}
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isAbnormal"
                  checked={formData.isAbnormal}
                  onChange={(e) => setFormData({ ...formData, isAbnormal: e.target.checked })}
                  className="w-4 h-4"
                />
                <label htmlFor="isAbnormal" className="text-sm font-medium">Kết quả bất thường</label>
              </div>

              <div className="space-y-2">
                <label className="text-label">Diễn giải</label>
                <textarea
                  className="input-base min-h-[60px] resize-none"
                  value={formData.interpretation}
                  onChange={(e) => setFormData({ ...formData, interpretation: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-label">Người thực hiện</label>
                <input
                  type="text"
                  className="input-base"
                  value={formData.performedBy}
                  onChange={(e) => setFormData({ ...formData, performedBy: e.target.value })}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button onClick={() => setEditingResult(null)} className="btn-secondary flex-1">
                  Hủy
                </button>
                <button onClick={handleSave} disabled={saving} className="btn-primary flex-1">
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  Lưu kết quả
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

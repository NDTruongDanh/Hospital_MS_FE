"use client";

import { useState, useEffect } from "react";
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  MoreHorizontal,
  TestTube,
  Clock,
  DollarSign,
  Loader2,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { labTestService } from "@/services/lab.service";
import type { LabTest, LabTestCategory, LabTestCreateRequest } from "@/interfaces/lab";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const CATEGORY_CONFIG: Record<LabTestCategory, { label: string; color: string; icon: string }> = {
  LAB: { label: "Xét nghiệm", color: "bg-blue-100 text-blue-700 border-blue-200", icon: "🧪" },
  IMAGING: { label: "Chẩn đoán hình ảnh", color: "bg-purple-100 text-purple-700 border-purple-200", icon: "📷" },
  PATHOLOGY: { label: "Giải phẫu bệnh", color: "bg-orange-100 text-orange-700 border-orange-200", icon: "🔬" },
};

export default function LabTestsPage() {
  const [labTests, setLabTests] = useState<LabTest[]>([]);
  const [filteredTests, setFilteredTests] = useState<LabTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<LabTestCategory | "">("");
  const [statusFilter, setStatusFilter] = useState<"active" | "inactive" | "">("");
  
  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingLabTest, setEditingLabTest] = useState<LabTest | null>(null);
  const [deleteLabTest, setDeleteLabTest] = useState<LabTest | null>(null);

  useEffect(() => {
    fetchLabTests();
  }, []);

  useEffect(() => {
    // Client-side filtering
    let filtered = labTests;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (test) =>
          test.code.toLowerCase().includes(query) ||
          test.name.toLowerCase().includes(query) ||
          test.description?.toLowerCase().includes(query)
      );
    }

    if (categoryFilter) {
      filtered = filtered.filter((test) => test.category === categoryFilter);
    }

    if (statusFilter === "active") {
      filtered = filtered.filter((test) => test.isActive);
    } else if (statusFilter === "inactive") {
      filtered = filtered.filter((test) => !test.isActive);
    }

    setFilteredTests(filtered);
  }, [searchQuery, categoryFilter, statusFilter, labTests]);

  const fetchLabTests = async () => {
    try {
      setLoading(true);
      const response = await labTestService.getAll();
      setLabTests(response.content || []);
    } catch (error) {
      console.error("Failed to fetch lab tests:", error);
      toast.error("Không thể tải danh sách xét nghiệm");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteLabTest) return;
    
    try {
      await labTestService.delete(deleteLabTest.id);
      toast.success("Đã xóa xét nghiệm thành công");
      setDeleteLabTest(null);
      fetchLabTests();
    } catch (error) {
      toast.error("Không thể xóa xét nghiệm");
    }
  };

  const handleToggleStatus = async (labTest: LabTest) => {
    try {
      await labTestService.update(labTest.id, { isActive: !labTest.isActive });
      toast.success(`Đã ${labTest.isActive ? "vô hiệu hóa" : "kích hoạt"} xét nghiệm`);
      fetchLabTests();
    } catch (error) {
      toast.error("Không thể cập nhật trạng thái");
    }
  };

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    setEditingLabTest(null);
    fetchLabTests();
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(value);
  };

  const formatTurnaroundTime = (hours?: number) => {
    if (!hours) return "-";
    if (hours < 24) return `${hours} giờ`;
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    if (remainingHours === 0) return `${days} ngày`;
    return `${days} ngày ${remainingHours} giờ`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-display">Quản lý xét nghiệm</h1>
          <p className="text-[hsl(var(--muted-foreground))] mt-1">
            {labTests.length} loại xét nghiệm
          </p>
        </div>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <button className="btn-primary" onClick={() => setEditingLabTest(null)}>
              <Plus className="w-5 h-5" />
              Thêm xét nghiệm
            </button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingLabTest ? "Chỉnh sửa xét nghiệm" : "Thêm xét nghiệm mới"}
              </DialogTitle>
            </DialogHeader>
            <LabTestForm
              labTest={editingLabTest}
              onSuccess={handleFormSuccess}
              onCancel={() => setIsFormOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="card-base">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="search-input w-full max-w-none">
              <Search className="w-4 h-4 text-[hsl(var(--muted-foreground))]" />
              <input
                type="text"
                placeholder="Tìm theo tên xét nghiệm, mã..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Category Filter */}
          <select
            className="dropdown min-w-[180px]"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as LabTestCategory | "")}
          >
            <option value="">🔬 Tất cả loại</option>
            {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
              <option key={key} value={key}>
                {config.icon} {config.label}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            className="dropdown min-w-[150px]"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as "active" | "inactive" | "")}
          >
            <option value="">Tất cả trạng thái</option>
            <option value="active">✅ Đang hoạt động</option>
            <option value="inactive">❌ Ngưng hoạt động</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="table-container">
        <table className="table-base">
          <thead>
            <tr>
              <th className="w-32">Mã XN</th>
              <th>Tên xét nghiệm</th>
              <th className="w-40">Loại</th>
              <th className="w-32">Đơn vị</th>
              <th className="w-40">Giá</th>
              <th className="w-32">Trạng thái</th>
              <th className="w-20"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="text-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto text-[hsl(var(--primary))]" />
                  <p className="text-small mt-2">Đang tải...</p>
                </td>
              </tr>
            ) : filteredTests.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-12">
                  <TestTube className="w-12 h-12 mx-auto text-[hsl(var(--muted-foreground))] opacity-50" />
                  <p className="text-[hsl(var(--muted-foreground))] mt-2">
                    {searchQuery || categoryFilter ? "Không tìm thấy xét nghiệm phù hợp" : "Chưa có xét nghiệm nào"}
                  </p>
                </td>
              </tr>
            ) : (
              filteredTests.map((labTest) => {
                const categoryConfig = CATEGORY_CONFIG[labTest.category];
                return (
                <tr key={labTest.id}>
                  <td>
                    <span className="font-mono font-semibold text-sm">{labTest.code}</span>
                  </td>
                  <td>
                    <p className="font-medium">{labTest.name}</p>
                    {labTest.description && (
                      <p className="text-sm text-gray-500 truncate max-w-md">
                        {labTest.description}
                      </p>
                    )}
                    {labTest.normalRange && (
                      <p className="text-xs text-gray-400 mt-1">
                        Chỉ số bình thường: {labTest.normalRange}
                      </p>
                    )}
                  </td>
                  <td>
                    <span className={`badge ${categoryConfig.color} border text-xs`}>
                      {categoryConfig.icon} {categoryConfig.label}
                    </span>
                  </td>
                  <td className="text-sm">{labTest.unit || "—"}</td>
                  <td className="font-semibold text-[hsl(var(--primary))]">
                    {formatCurrency(labTest.price)}
                  </td>

                  {/* Status */}
                  <td>
                    <button
                      onClick={() => handleToggleStatus(labTest)}
                      className={`badge cursor-pointer hover:opacity-80 ${
                        labTest.isActive ? "badge-success" : "badge-danger"
                      }`}
                    >
                      {labTest.isActive ? (
                        <>
                          <CheckCircle className="w-3 h-3" />
                          Hoạt động
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3 h-3" />
                          Vô hiệu
                        </>
                      )}
                    </button>
                  </td>

                  {/* Actions */}
                  <td>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="btn-icon w-8 h-8">
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            setEditingLabTest(labTest);
                            setIsFormOpen(true);
                          }}
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Chỉnh sửa
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => setDeleteLabTest(labTest)}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Xóa
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteLabTest} onOpenChange={() => setDeleteLabTest(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa xét nghiệm</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa xét nghiệm "{deleteLabTest?.name}"?
              Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Lab Test Form Component
interface LabTestFormProps {
  labTest: LabTest | null;
  onSuccess: () => void;
  onCancel: () => void;
}

function LabTestForm({ labTest, onSuccess, onCancel }: LabTestFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<LabTestCreateRequest>({
    code: labTest?.code || "",
    name: labTest?.name || "",
    category: labTest?.category || "LAB",
    description: labTest?.description || "",
    price: labTest?.price || 0,
    unit: labTest?.unit || "",
    normalRange: labTest?.normalRange || "",
    isActive: labTest?.isActive ?? true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (labTest) {
        await labTestService.update(labTest.id, formData);
        toast.success("Đã cập nhật xét nghiệm thành công");
      } else {
        await labTestService.create(formData);
        toast.success("Đã thêm xét nghiệm mới thành công");
      }
      onSuccess();
    } catch (error) {
      toast.error(labTest ? "Không thể cập nhật xét nghiệm" : "Không thể thêm xét nghiệm");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {/* Code */}
        <div className="space-y-2">
          <label className="text-label">Mã xét nghiệm *</label>
          <input
            type="text"
            className="input-base"
            placeholder="Ví dụ: XN-001"
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
            required
            disabled={!!labTest}
          />
        </div>

        {/* Category */}
        <div className="space-y-2">
          <label className="text-label">Loại xét nghiệm *</label>
          <select
            className="input-base"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value as LabTestCategory })}
            required
          >
            {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
              <option key={key} value={key}>
                {config.icon} {config.label}
              </option>
            ))}
          </select>
        </div>

        {/* Name */}
        <div className="col-span-2 space-y-2">
          <label className="text-label">Tên xét nghiệm *</label>
          <input
            type="text"
            className="input-base"
            placeholder="Ví dụ: Công thức máu toàn phần"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>

        {/* Description */}
        <div className="col-span-2 space-y-2">
          <label className="text-label">Mô tả</label>
          <textarea
            className="input-base min-h-[80px] resize-none"
            placeholder="Mô tả xét nghiệm, chỉ định..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-3 gap-4 col-span-2">
          {/* Price */}
          <div className="space-y-2">
            <label className="text-label">Giá (VNĐ) *</label>
            <input
              type="number"
              className="input-base"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
              required
              min="0"
            />
          </div>

          {/* Unit */}
          <div className="space-y-2">
            <label className="text-label">Đơn vị kết quả</label>
            <input
              type="text"
              className="input-base"
              placeholder="Ví dụ: g/L, mmol/L"
              value={formData.unit}
              onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
            />
          </div>

          {/* Normal Range */}
          <div className="space-y-2">
            <label className="text-label">Khoảng tham chiếu</label>
            <input
              type="text"
              className="input-base"
              placeholder="Ví dụ: 4.0 - 10.0"
              value={formData.normalRange}
              onChange={(e) => setFormData({ ...formData, normalRange: e.target.value })}
            />
          </div>
        </div>

        {/* Active Status */}
        <div className="col-span-2 flex items-center gap-3">
          <input
            type="checkbox"
            id="isActive"
            checked={formData.isActive}
            onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
            className="w-4 h-4 rounded border-[hsl(var(--border))] text-[hsl(var(--primary))]"
          />
          <label htmlFor="isActive" className="text-sm">
            Kích hoạt xét nghiệm (hiển thị trong danh sách chọn)
          </label>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t border-[hsl(var(--border))]">
        <button type="button" onClick={onCancel} className="btn-secondary">
          Hủy
        </button>
        <button type="submit" disabled={loading} className="btn-primary">
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {labTest ? "Cập nhật" : "Thêm mới"}
        </button>
      </div>
    </form>
  );
}

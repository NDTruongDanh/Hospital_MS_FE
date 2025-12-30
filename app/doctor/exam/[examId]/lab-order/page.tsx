"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  ArrowLeft,
  Save,
  Loader2,
  TestTube,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { labTestService } from "@/services/lab.service";
import { labOrderService } from "@/services/lab.service";
import type { LabTest, LabTestCategory, OrderPriority, LabOrderCreateRequest } from "@/interfaces/lab";

const CATEGORY_CONFIG: Record<LabTestCategory, { label: string; icon: string }> = {
  LAB: { label: "Xét nghiệm", icon: "🧪" },
  IMAGING: { label: "Chẩn đoán hình ảnh", icon: "📷" },
  PATHOLOGY: { label: "Giải phẫu bệnh", icon: "🔬" },
};

const PRIORITY_CONFIG: Partial<Record<OrderPriority, { label: string; color: string }>> = {
  NORMAL: { label: "Bình thường", color: "text-blue-600" },
  URGENT: { label: "Khẩn cấp", color: "text-red-600" },
};


export default function DoctorLabOrderPage() {
  const params = useParams();
  const router = useRouter();
  const examId = params.examId as string;
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [labTests, setLabTests] = useState<LabTest[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<LabTestCategory>("LAB");
  const [selectedTestIds, setSelectedTestIds] = useState<string[]>([]);
  const [priority, setPriority] = useState<OrderPriority>("NORMAL");
  const [notes,  setNotes] = useState("");

  useEffect(() => {
    fetchLabTests();
  }, []);

  const fetchLabTests = async () => {
    try {
      setLoading(true);
      const data = await labTestService.getActive();
      setLabTests(data || []);
    } catch (error) {
      console.error("Failed to fetch lab tests:", error);
      toast.error("Không thể tải danh sách xét nghiệm");
    } finally {
      setLoading(false);
    }
  };

  const filteredTests = labTests.filter(t => t.category === selectedCategory);

  const toggleTest = (testId: string) => {
    if (selectedTestIds.includes(testId)) {
      setSelectedTestIds(selectedTestIds.filter(id => id !== testId));
    } else {
      setSelectedTestIds([...selectedTestIds, testId]);
    }
  };

  const isSelected = (testId: string) => selectedTestIds.includes(testId);

  const handleSubmit = async () => {
    if (selectedTestIds.length === 0) {
      toast.error("Vui lòng chọn ít nhất 1 xét nghiệm");
      return;
    }

    try {
      setSaving(true);
      
      const orderRequest: LabOrderCreateRequest = {
        medicalExamId: examId,
        labTestIds: selectedTestIds,
        priority: priority,
        notes: notes || undefined,
      };
      
      await labOrderService.create(orderRequest);
      
      toast.success("Đã tạo yêu cầu xét nghiệm thành công!");
      router.back();
    } catch (error: any) {
      console.error("Failed to create lab order:", error);
      toast.error(error.response?.data?.message || "Không thể tạo yêu cầu xét nghiệm");
    } finally {
      setSaving(false);
    }
  };

  const selectedTests = labTests.filter(t => selectedTestIds.includes(t.id));
  const totalAmount = selectedTests.reduce((sum, test) => sum + test.price, 0);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-[hsl(var(--primary))]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="btn-icon">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-display">Yêu cầu xét nghiệm</h1>
          <p className="text-[hsl(var(--muted-foreground))] mt-1">
            Phiếu khám #{examId?.slice(0, 8)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lab Tests Selection */}
        <div className="lg:col-span-2 card-base">
          <h3 className="text-section mb-4">Chọn xét nghiệm</h3>
          
          {/* Category Tabs */}
          <div className="flex gap-2 mb-4 flex-wrap">
            {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
              <button
                key={key}
                onClick={() => setSelectedCategory(key as LabTestCategory)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedCategory === key
                    ? "bg-[hsl(var(--primary))] text-white"
                    : "bg-[hsl(var(--secondary))] hover:bg-[hsl(var(--secondary))]/80"
                }`}
              >
                {config.icon} {config.label}
              </button>
            ))}
          </div>

          {/* Tests List */}
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {filteredTests.length === 0 ? (
              <div className="text-center py-8">
                <TestTube className="w-12 h-12 mx-auto text-[hsl(var(--muted-foreground))] opacity-50" />
                <p className="text-[hsl(var(--muted-foreground))] mt-2">
                  Không có xét nghiệm nào trong danh mục này
                </p>
              </div>
            ) : (
              filteredTests.map((test) => (
                <button
                  key={test.id}
                  onClick={() => toggleTest(test.id)}
                  className={`w-full p-4 rounded-xl text-left transition-all flex items-center gap-3 ${
                    isSelected(test.id)
                      ? "bg-white border-2 border-[hsl(var(--primary))] shadow-md"
                      : "bg-white border-2 border-gray-200 shadow-sm hover:border-[hsl(var(--primary))] hover:shadow-md"
                  }`}
                >
                  <div className={`w-5 h-5 rounded border flex items-center justify-center ${
                    isSelected(test.id)
                      ? "bg-[hsl(var(--primary))] border-[hsl(var(--primary))]"
                      : "border-[hsl(var(--border))]"
                  }`}>
                    {isSelected(test.id) && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{test.name}</p>
                    <p className="text-small text-gray-500">{test.code} • {test.description || "Không có mô tả"}</p>
                  </div>
                  <span className="font-semibold text-[hsl(var(--primary))]">
                    {formatCurrency(test.price)}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Order Summary */}
        <div className="card-base h-fit">
          <h3 className="text-section mb-4">Tóm tắt yêu cầu</h3>
          
          {/* Priority */}
          <div className="mb-4">
            <label className="text-label">Mức độ ưu tiên</label>
            <select
              className="input-base mt-1"
              value={priority}
              onChange={(e) => setPriority(e.target.value as OrderPriority)}
            >
              {Object.entries(PRIORITY_CONFIG).map(([key, config]) => (
                <option key={key} value={key}>
                  {config.label}
                </option>
              ))}
            </select>
          </div>

          {/* Notes */}
          <div className="mb-4">
            <label className="text-label">Ghi chú</label>
            <textarea
              className="input-base mt-1 min-h-[80px] resize-none"
              placeholder="Ghi chú cho kỹ thuật viên..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {/* Selected Items */}
          <div className="mb-4">
            <p className="text-label mb-2">Xét nghiệm đã chọn ({selectedTests.length})</p>
            {selectedTests.length === 0 ? (
              <p className="text-[hsl(var(--muted-foreground))] text-sm">
                Chưa chọn xét nghiệm nào
              </p>
            ) : (
              <div className="space-y-2">
                {selectedTests.map((test) => (
                  <div key={test.id} className="flex justify-between text-sm">
                    <span className="truncate">{test.name}</span>
                    <span className="font-medium">{formatCurrency(test.price)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Total */}
          <div className="pt-4 border-t border-[hsl(var(--border))] mb-4">
            <div className="flex justify-between items-center">
              <span className="font-semibold">Tổng cộng</span>
              <span className="text-xl font-bold text-[hsl(var(--primary))]">
                {formatCurrency(totalAmount)}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button onClick={() => router.back()} className="btn-secondary flex-1">
              Hủy
            </button>
            <button
              onClick={handleSubmit}
              disabled={saving || selectedTests.length === 0}
              className="btn-primary flex-1"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              <Save className="w-4 h-4" />
              Tạo yêu cầu
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

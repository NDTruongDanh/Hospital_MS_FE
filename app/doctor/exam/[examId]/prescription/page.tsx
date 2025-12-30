"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  ArrowLeft,
  Search,
  Trash2,
  Save,
  Loader2,
  Pill,
} from "lucide-react";
import { toast } from "sonner";
import { getMedicines } from "@/services/medicine.service";
import medicalExamService from "@/services/medical-exam.service";
import type { Medicine } from "@/interfaces/medicine";

interface PrescriptionItem {
  medicineId: string;
  medicineName: string;
  quantity: number;
  dosage: string;
  instructions: string;
  unitPrice: number;
}

export default function DoctorPrescriptionPage() {
  const params = useParams();
  const router = useRouter();
  const examId = params.examId as string;
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [items, setItems] = useState<PrescriptionItem[]>([]);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    fetchData();
  }, [examId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Load medicines
      const medResponse = await getMedicines({ size: 100 });
      setMedicines(medResponse.content || []);
      
      // Try to load existing prescription
      try {
        const existingRxResponse = await medicalExamService.getPrescriptionByExam(examId);
        const existingRx = existingRxResponse?.data;
        if (existingRx) {
          setNotes(existingRx.notes || "");
          // Map existing items
          if (existingRx.items && existingRx.items.length > 0) {
            setItems(existingRx.items.map((item: any) => ({
              medicineId: item.medicineId || item.medicine?.id,
              medicineName: item.medicineName || item.medicine?.name,
              quantity: item.quantity,
              dosage: item.dosage,
              instructions: item.instructions || "",
              unitPrice: item.medicine?.sellingPrice || 0,
            })));
          }
        }
      } catch {
        // No existing prescription, that's fine
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
      toast.error("Không thể tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  const filteredMedicines = medicines.filter(med =>
    med.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (med.activeIngredient?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const addMedicine = (medicine: Medicine) => {
    if (items.some(item => item.medicineId === medicine.id)) {
      toast.error("Thuốc đã có trong đơn");
      return;
    }
    setItems([...items, {
      medicineId: medicine.id,
      medicineName: medicine.name,
      quantity: 1,
      dosage: "",
      instructions: "",
      unitPrice: medicine.sellingPrice,
    }]);
    setSearchQuery("");
  };

  const updateItem = (index: number, field: keyof PrescriptionItem, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (items.length === 0) {
      toast.error("Vui lòng thêm ít nhất 1 loại thuốc");
      return;
    }

    for (const item of items) {
      if (!item.dosage || item.quantity < 1) {
        toast.error("Vui lòng điền đầy đủ thông tin thuốc");
        return;
      }
    }

    try {
      setSaving(true);
      const prescriptionData = {
        notes: notes || undefined,
        items: items.map(item => ({
          medicineId: item.medicineId,
          quantity: item.quantity,
          dosage: item.dosage,
          instructions: item.instructions || undefined,
        })),
      };

      await medicalExamService.createPrescription(examId, prescriptionData);
      toast.success("Đã lưu đơn thuốc thành công!");
      router.back();
    } catch (error) {
      console.error("Failed to save prescription:", error);
      toast.error("Không thể lưu đơn thuốc");
    } finally {
      setSaving(false);
    }
  };

  const totalAmount = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);

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
          <h1 className="text-display">Kê đơn thuốc</h1>
          <p className="text-[hsl(var(--muted-foreground))] mt-1">
            Phiếu khám #{examId?.slice(0, 8)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Medicine Search */}
        <div className="card-base">
          <h3 className="text-section mb-4">Tìm thuốc</h3>
          <div className="search-input w-full max-w-none mb-4">
            <Search className="w-4 h-4 text-[hsl(var(--muted-foreground))]" />
            <input
              type="text"
              placeholder="Tên thuốc, hoạt chất..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {searchQuery && filteredMedicines.map((med) => (
              <button
                key={med.id}
                onClick={() => addMedicine(med)}
                className="w-full p-4 bg-white border-2 border-gray-200 rounded-xl shadow-sm hover:border-[hsl(var(--primary))] hover:shadow-md transition-all text-left"
              >
                <p className="font-medium">{med.name}</p>
                <p className="text-small">{med.activeIngredient} • {formatCurrency(med.sellingPrice)}/{med.unit}</p>
              </button>
            ))}
            {searchQuery && filteredMedicines.length === 0 && (
              <p className="text-center text-[hsl(var(--muted-foreground))] py-4">
                Không tìm thấy thuốc
              </p>
            )}
          </div>
        </div>

        {/* Prescription Items */}
        <div className="lg:col-span-2 card-base">
          <h3 className="text-section mb-4">Danh sách thuốc trong đơn</h3>
          
          {items.length === 0 ? (
            <div className="text-center py-12">
              <Pill className="w-12 h-12 mx-auto text-[hsl(var(--muted-foreground))] opacity-50" />
              <p className="text-[hsl(var(--muted-foreground))] mt-2">
                Chưa có thuốc nào. Tìm và thêm thuốc từ danh sách bên trái.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item, index) => (
                <div key={index} className="p-4 rounded-xl border border-[hsl(var(--border))]">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="font-semibold">{item.medicineName}</p>
                      <p className="text-small">{formatCurrency(item.unitPrice)}/đơn vị</p>
                    </div>
                    <button
                      onClick={() => removeItem(index)}
                      className="btn-icon text-red-500 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="text-label text-xs">Số lượng *</label>
                      <input
                        type="number"
                        className="input-base"
                        min={1}
                        value={item.quantity}
                        onChange={(e) => updateItem(index, "quantity", parseInt(e.target.value) || 1)}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-label text-xs">Liều dùng *</label>
                      <input
                        type="text"
                        className="input-base"
                        placeholder="1 viên x 3 lần/ngày"
                        value={item.dosage}
                        onChange={(e) => updateItem(index, "dosage", e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-label text-xs">Hướng dẫn</label>
                      <input
                        type="text"
                        className="input-base"
                        placeholder="Uống sau ăn"
                        value={item.instructions}
                        onChange={(e) => updateItem(index, "instructions", e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="text-right mt-2">
                    <span className="font-semibold text-[hsl(var(--primary))]">
                      {formatCurrency(item.quantity * item.unitPrice)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Notes */}
          <div className="mt-4 pt-4 border-t border-[hsl(var(--border))]">
            <label className="text-label">Ghi chú đơn thuốc</label>
            <textarea
              className="input-base mt-2 min-h-[80px] resize-none"
              placeholder="Lưu ý đặc biệt cho bệnh nhân..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {/* Total & Actions */}
          <div className="mt-4 pt-4 border-t border-[hsl(var(--border))] flex justify-between items-center">
            <div>
              <p className="text-label">Tổng tiền</p>
              <p className="text-2xl font-bold text-[hsl(var(--primary))]">
                {formatCurrency(totalAmount)}
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => router.back()} className="btn-secondary">
                Hủy
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="btn-primary"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                <Save className="w-4 h-4" />
                Lưu đơn thuốc
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

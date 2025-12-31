"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Pill,
  Plus,
  Trash2,
  Loader2,
  FileText,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import medicalExamService from "@/services/medical-exam.service";
import { getMedicines } from "@/services/medicine.service";
import { MedicalExam, PrescriptionItemRequest } from "@/interfaces/medical-exam";
import { Medicine } from "@/interfaces/medicine";

interface PrescriptionItemForm {
  medicineId: string;
  quantity: number;
  dosage: string;
  durationDays: number;
  instructions: string;
}

export default function CreatePrescriptionPage() {
  const router = useRouter();
  const params = useParams();
  const examId = params.id as string;
  
  const [exam, setExam] = useState<MedicalExam | null>(null);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [items, setItems] = useState<PrescriptionItemForm[]>([
    { medicineId: "", quantity: 1, dosage: "", durationDays: 5, instructions: "" }
  ]);
  const [notes, setNotes] = useState("");
  
  // Search states for medicine dropdowns
  const [searchQueries, setSearchQueries] = useState<string[]>([""]);

  useEffect(() => {
    fetchData();
  }, [examId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [examData, medicineData] = await Promise.all([
        medicalExamService.getById(examId),
        getMedicines({ size: 200 })
      ]);
      setExam(examData);
      setMedicines(medicineData.content || []);
      
      if (examData.hasPrescription) {
        toast.error("Phiếu khám này đã có đơn thuốc");
        router.replace(`/admin/exams/${examId}`);
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
      toast.error("Không thể tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  const addItem = () => {
    setItems([...items, { medicineId: "", quantity: 1, dosage: "", durationDays: 5, instructions: "" }]);
    setSearchQueries([...searchQueries, ""]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
      setSearchQueries(searchQueries.filter((_, i) => i !== index));
    }
  };

  const updateItem = (index: number, field: keyof PrescriptionItemForm, value: string | number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const updateSearchQuery = (index: number, value: string) => {
    const newQueries = [...searchQueries];
    newQueries[index] = value;
    setSearchQueries(newQueries);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate
    const invalidItems = items.filter(item => !item.medicineId || !item.dosage || item.quantity < 1);
    if (invalidItems.length > 0) {
      toast.error("Vui lòng điền đầy đủ thông tin thuốc");
      return;
    }

    setSubmitting(true);
    try {
      await medicalExamService.createPrescription(examId, {
        notes,
        items: items.map(item => ({
          medicineId: item.medicineId,
          quantity: item.quantity,
          dosage: item.dosage,
          durationDays: item.durationDays || undefined,
          instructions: item.instructions || undefined,
        }))
      });
      toast.success("Đã tạo đơn thuốc thành công");
      router.push(`/admin/exams/${examId}`);
    } catch (error) {
      console.error("Failed to create prescription:", error);
      toast.error("Không thể tạo đơn thuốc");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-[hsl(var(--primary))]" />
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="text-center py-12">
        <p>Không tìm thấy phiếu khám</p>
        <button onClick={() => router.back()} className="btn-primary mt-4">
          Quay lại
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-h1 flex items-center gap-2">
            <Pill className="w-8 h-8 text-emerald-500" />
            Tạo đơn thuốc
          </h1>
          <p className="text-small">
            Bệnh nhân: <strong>{exam.patient.fullName}</strong> • 
            Bác sĩ: <strong>{exam.doctor.fullName}</strong>
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Prescription Items */}
        <div className="card-base">
          <div className="p-4 bg-gray-50 border-b flex items-center gap-2">
            <Pill className="h-5 w-5 text-emerald-500" />
            <h3 className="font-semibold">Danh sách thuốc</h3>
          </div>
          <div className="p-6 space-y-4">
            {items.map((item, index) => (
              <div
                key={index}
                className="flex flex-col gap-4 rounded-lg border p-4 bg-gray-50/50"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-gray-700">
                    Thuốc {index + 1}
                  </h4>
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="p-1 text-red-500 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Medicine Select with Search */}
                  <div className="col-span-2 sm:col-span-1">
                    <label className="text-label">Thuốc *</label>
                    <select
                      className="input-base"
                      value={item.medicineId}
                      onChange={(e) => updateItem(index, "medicineId", e.target.value)}
                      required
                    >
                      <option value="">Chọn thuốc...</option>
                      {medicines.map((med) => (
                        <option key={med.id} value={med.id}>
                          {med.name} - {med.unit} ({med.quantity} có sẵn)
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Quantity */}
                  <div>
                    <label className="text-label">Số lượng *</label>
                    <input
                      type="number"
                      className="input-base"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, "quantity", parseInt(e.target.value) || 1)}
                      min={1}
                      required
                    />
                  </div>

                  {/* Dosage */}
                  <div>
                    <label className="text-label">Liều dùng *</label>
                    <input
                      type="text"
                      className="input-base"
                      placeholder="VD: 1 viên x 3 lần/ngày"
                      value={item.dosage}
                      onChange={(e) => updateItem(index, "dosage", e.target.value)}
                      required
                    />
                  </div>

                  {/* Duration */}
                  <div>
                    <label className="text-label">Số ngày dùng</label>
                    <input
                      type="number"
                      className="input-base"
                      value={item.durationDays}
                      onChange={(e) => updateItem(index, "durationDays", parseInt(e.target.value) || 0)}
                      min={0}
                    />
                  </div>

                  {/* Instructions */}
                  <div className="col-span-2">
                    <label className="text-label">Hướng dẫn sử dụng</label>
                    <input
                      type="text"
                      className="input-base"
                      placeholder="VD: Uống sau ăn, tránh rượu bia..."
                      value={item.instructions}
                      onChange={(e) => updateItem(index, "instructions", e.target.value)}
                    />
                  </div>
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={addItem}
              className="btn-secondary w-full"
            >
              <Plus className="mr-2 h-4 w-4" />
              Thêm thuốc
            </button>
          </div>
        </div>

        {/* Notes */}
        <div className="card-base">
          <div className="p-4 bg-gray-50 border-b flex items-center gap-2">
            <FileText className="h-5 w-5 text-amber-500" />
            <h3 className="font-semibold">Ghi chú đơn thuốc</h3>
          </div>
          <div className="p-6">
            <textarea
              className="input-base min-h-[100px]"
              placeholder="Ghi chú thêm cho đơn thuốc..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="btn-secondary"
            disabled={submitting}
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="btn-primary bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600"
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Check className="w-4 h-4 mr-2" />
            )}
            Lưu đơn thuốc
          </button>
        </div>
      </form>
    </div>
  );
}

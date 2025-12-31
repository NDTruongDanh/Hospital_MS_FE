"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { format, differenceInMilliseconds } from "date-fns";
import { vi } from "date-fns/locale";
import { 
  ArrowLeft, 
  Stethoscope, 
  Save,
  Clock,
  AlertCircle,
  Loader2,
  Heart,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import medicalExamService from "@/services/medical-exam.service";
import { MedicalExam } from "@/interfaces/medical-exam";

export default function EditMedicalExamPage() {
  const router = useRouter();
  const params = useParams();
  const examId = params.id as string;
  
  const [exam, setExam] = useState<MedicalExam | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState("");
  
  // Form state
  const [formData, setFormData] = useState({
    diagnosis: "",
    symptoms: "",
    treatment: "",
    notes: "",
    followUpDate: "",
    // Vitals
    temperature: "",
    bloodPressureSystolic: "",
    bloodPressureDiastolic: "",
    heartRate: "",
    weight: "",
    height: "",
  });

  useEffect(() => {
    if (examId) {
      fetchExam();
    }
  }, [examId]);

  // 24-hour edit rule timer
  useEffect(() => {
    if (!exam || !exam.createdAt) return;
    
    const createdAt = new Date(exam.createdAt);
    const expiresAt = createdAt.getTime() + 24 * 60 * 60 * 1000;
    
    const timer = setInterval(() => {
      const diff = differenceInMilliseconds(expiresAt, new Date());
      if (diff <= 0) {
        setTimeLeft("Hết hạn");
        clearInterval(timer);
        toast.error("Đã quá thời hạn chỉnh sửa (24 giờ)");
        router.push(`/admin/exams/${examId}`);
      } else {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        setTimeLeft(`${hours}h ${minutes}m còn lại`);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [exam, examId, router]);

  const fetchExam = async () => {
    setLoading(true);
    try {
      const data = await medicalExamService.getById(examId);
      setExam(data);
      
      // Check if editable (24-hour rule) - only if createdAt exists
      if (data.createdAt) {
        const createdAt = new Date(data.createdAt);
        const expiresAt = createdAt.getTime() + 24 * 60 * 60 * 1000;
        console.log("[EditExam] createdAt:", data.createdAt, "expiresAt:", new Date(expiresAt).toISOString(), "now:", new Date().toISOString());
        
        if (new Date().getTime() >= expiresAt) {
          toast.error("Phiếu khám này đã quá thời hạn chỉnh sửa (24 giờ)");
          router.replace(`/admin/exams/${examId}`);
          return;
        }
      } else {
        console.log("[EditExam] No createdAt field, allowing edit");
      }
      
      // Populate form
      setFormData({
        diagnosis: data.diagnosis || "",
        symptoms: data.symptoms || "",
        treatment: data.treatment || "",
        notes: data.notes || "",
        followUpDate: data.followUpDate ? data.followUpDate.split("T")[0] : "",
        temperature: data.vitals?.temperature?.toString() || "",
        bloodPressureSystolic: data.vitals?.bloodPressureSystolic?.toString() || "",
        bloodPressureDiastolic: data.vitals?.bloodPressureDiastolic?.toString() || "",
        heartRate: data.vitals?.heartRate?.toString() || "",
        weight: data.vitals?.weight?.toString() || "",
        height: data.vitals?.height?.toString() || "",
      });
    } catch (error) {
      console.error("Failed to fetch exam:", error);
      toast.error("Không thể tải chi tiết phiếu khám");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      await medicalExamService.update(examId, {
        diagnosis: formData.diagnosis || undefined,
        symptoms: formData.symptoms || undefined,
        treatment: formData.treatment || undefined,
        notes: formData.notes || undefined,
        followUpDate: formData.followUpDate || undefined,
        temperature: formData.temperature ? parseFloat(formData.temperature) : undefined,
        bloodPressureSystolic: formData.bloodPressureSystolic ? parseInt(formData.bloodPressureSystolic) : undefined,
        bloodPressureDiastolic: formData.bloodPressureDiastolic ? parseInt(formData.bloodPressureDiastolic) : undefined,
        heartRate: formData.heartRate ? parseInt(formData.heartRate) : undefined,
        weight: formData.weight ? parseFloat(formData.weight) : undefined,
        height: formData.height ? parseFloat(formData.height) : undefined,
      });
      toast.success("Đã cập nhật phiếu khám thành công");
      router.push(`/admin/exams/${examId}`);
    } catch (error) {
      console.error("Failed to update exam:", error);
      toast.error("Không thể cập nhật phiếu khám");
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
        <Stethoscope className="w-16 h-16 mx-auto mb-4 opacity-30" />
        <h2 className="text-xl font-semibold mb-2">Không tìm thấy phiếu khám</h2>
        <button onClick={() => router.back()} className="btn-primary mt-4">
          Quay lại
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-h1 flex items-center gap-2">
              <Stethoscope className="w-8 h-8 text-sky-500" />
              Chỉnh sửa phiếu khám
            </h1>
            <p className="text-small">
              Bệnh nhân: <strong>{exam.patient.fullName}</strong> • 
              Bác sĩ: <strong>{exam.doctor.fullName}</strong>
            </p>
          </div>
        </div>
        
        {/* Time remaining badge */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200">
          <Clock className="h-4 w-4 text-amber-600" />
          <span className="text-sm font-medium text-amber-800">{timeLeft}</span>
        </div>
      </div>

      {/* Warning */}
      <div className="flex items-start gap-3 p-4 rounded-lg bg-amber-50 border border-amber-200">
        <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-medium text-amber-800">Lưu ý về thời hạn chỉnh sửa</p>
          <p className="text-sm text-amber-700">
            Bạn chỉ có thể chỉnh sửa phiếu khám trong vòng 24 giờ sau khi tạo.
            Sau thời gian này, phiếu khám sẽ bị khóa và không thể thay đổi.
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Clinical Findings */}
        <div className="card-base">
          <div className="p-4 bg-gray-50 border-b flex items-center gap-2">
            <FileText className="h-5 w-5 text-sky-600" />
            <h3 className="font-semibold">Kết quả khám lâm sàng</h3>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="text-label">Chẩn đoán</label>
              <textarea
                name="diagnosis"
                className="input-base min-h-[100px]"
                placeholder="Nhập chẩn đoán..."
                value={formData.diagnosis}
                onChange={handleChange}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-label">Triệu chứng</label>
                <textarea
                  name="symptoms"
                  className="input-base min-h-[80px]"
                  placeholder="Mô tả triệu chứng..."
                  value={formData.symptoms}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="text-label">Phương pháp điều trị</label>
                <textarea
                  name="treatment"
                  className="input-base min-h-[80px]"
                  placeholder="Mô tả phương pháp điều trị..."
                  value={formData.treatment}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div>
              <label className="text-label">Ghi chú</label>
              <textarea
                name="notes"
                className="input-base min-h-[80px]"
                placeholder="Ghi chú thêm..."
                value={formData.notes}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="text-label">Ngày tái khám (nếu có)</label>
              <input
                type="date"
                name="followUpDate"
                className="input-base max-w-xs"
                value={formData.followUpDate}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>

        {/* Vitals */}
        <div className="card-base">
          <div className="p-4 bg-gray-50 border-b flex items-center gap-2">
            <Heart className="h-5 w-5 text-rose-500" />
            <h3 className="font-semibold">Chỉ số sinh hiệu</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className="text-label">Nhiệt độ (°C)</label>
                <input
                  type="number"
                  step="0.1"
                  name="temperature"
                  className="input-base"
                  placeholder="36.5"
                  value={formData.temperature}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="text-label">Huyết áp tâm thu (mmHg)</label>
                <input
                  type="number"
                  name="bloodPressureSystolic"
                  className="input-base"
                  placeholder="120"
                  value={formData.bloodPressureSystolic}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="text-label">Huyết áp tâm trương (mmHg)</label>
                <input
                  type="number"
                  name="bloodPressureDiastolic"
                  className="input-base"
                  placeholder="80"
                  value={formData.bloodPressureDiastolic}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="text-label">Nhịp tim (bpm)</label>
                <input
                  type="number"
                  name="heartRate"
                  className="input-base"
                  placeholder="75"
                  value={formData.heartRate}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="text-label">Cân nặng (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  name="weight"
                  className="input-base"
                  placeholder="60"
                  value={formData.weight}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="text-label">Chiều cao (cm)</label>
                <input
                  type="number"
                  step="0.1"
                  name="height"
                  className="input-base"
                  placeholder="170"
                  value={formData.height}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Link href={`/admin/exams/${examId}`} className="btn-secondary">
            Hủy
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="btn-primary bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-600 hover:to-cyan-600"
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Lưu thay đổi
          </button>
        </div>
      </form>
    </div>
  );
}

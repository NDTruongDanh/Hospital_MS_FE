"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { 
  ArrowLeft, 
  Pill,
  Printer,
  Clock,
  User,
  Stethoscope,
  FileText,
  Loader2,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import medicalExamService, { getPrescriptionByExam } from "@/services/medical-exam.service";
import { MedicalExam, Prescription, PrescriptionStatus } from "@/interfaces/medical-exam";

const STATUS_COLORS: Record<PrescriptionStatus, { bg: string; text: string; label: string }> = {
  ACTIVE: { bg: "bg-blue-100", text: "text-blue-700", label: "Đang hoạt động" },
  DISPENSED: { bg: "bg-green-100", text: "text-green-700", label: "Đã phát thuốc" },
  CANCELLED: { bg: "bg-red-100", text: "text-red-700", label: "Đã hủy" },
};

export default function ViewPrescriptionPage() {
  const router = useRouter();
  const params = useParams();
  const examId = params.id as string;
  
  const [exam, setExam] = useState<MedicalExam | null>(null);
  const [prescription, setPrescription] = useState<Prescription | null>(null);
  const [loading, setLoading] = useState(true);
  const [dispensing, setDispensing] = useState(false);

  useEffect(() => {
    if (examId) {
      fetchData();
    }
  }, [examId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const examData = await medicalExamService.getById(examId);
      setExam(examData);
      
      if (!examData.hasPrescription) {
        toast.error("Phiếu khám này chưa có đơn thuốc");
        router.replace(`/admin/exams/${examId}`);
        return;
      }
      
      // Fetch prescription separately
      const prescriptionData = await getPrescriptionByExam(examId);
      if (prescriptionData?.data) {
        setPrescription(prescriptionData.data);
      } else {
        toast.error("Không thể tải đơn thuốc");
        router.replace(`/admin/exams/${examId}`);
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
      toast.error("Không thể tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  const handleDispense = async () => {
    if (!prescription) return;
    
    setDispensing(true);
    try {
      await medicalExamService.dispensePrescription(prescription.id);
      toast.success("Đã phát thuốc thành công");
      fetchData(); // Refresh data
    } catch (error) {
      console.error("Failed to dispense:", error);
      toast.error("Không thể phát thuốc");
    } finally {
      setDispensing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-[hsl(var(--primary))]" />
      </div>
    );
  }

  if (!exam || !prescription) {
    return (
      <div className="text-center py-12">
        <Pill className="w-16 h-16 mx-auto mb-4 opacity-30" />
        <h2 className="text-xl font-semibold mb-2">Không tìm thấy đơn thuốc</h2>
        <button onClick={() => router.back()} className="btn-primary mt-4">
          Quay lại
        </button>
      </div>
    );
  }

  const totalItems = prescription.items.length;
  const totalQuantity = prescription.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="relative rounded-xl bg-gradient-to-r from-emerald-500 to-green-500 p-6 text-white overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-white" />
          <div className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full bg-white" />
        </div>

        <div className="relative flex items-start justify-between gap-6 flex-wrap">
          <div className="flex items-center gap-5">
            <button
              onClick={() => router.back()}
              className="p-2 rounded-lg text-white/90 hover:text-white hover:bg-white/20 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>

            <div className="h-16 w-16 rounded-xl bg-white/20 flex items-center justify-center">
              <Pill className="h-8 w-8 text-white" />
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold tracking-tight">
                  Đơn thuốc #{prescription.id.slice(-6).toUpperCase()}
                </h1>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${STATUS_COLORS[prescription.status].bg} ${STATUS_COLORS[prescription.status].text}`}>
                  {STATUS_COLORS[prescription.status].label}
                </span>
              </div>
              <p className="text-white/80 text-sm font-medium">
                {exam.patient.fullName} • {format(new Date(prescription.prescribedAt), "PPP", { locale: vi })}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button className="inline-flex items-center px-4 py-2 rounded-lg bg-white/10 border border-white/30 text-white hover:bg-white/20 transition-colors">
              <Printer className="mr-2 h-4 w-4" />
              In đơn
            </button>
            {prescription.status === "ACTIVE" && (
              <button
                onClick={handleDispense}
                disabled={dispensing}
                className="inline-flex items-center px-4 py-2 rounded-lg bg-white text-emerald-600 hover:bg-white/90 transition-colors disabled:opacity-50"
              >
                {dispensing ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4 mr-2" />
                )}
                Phát thuốc
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="card-base p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-sky-100 flex items-center justify-center">
            <User className="h-5 w-5 text-sky-600" />
          </div>
          <div>
            <p className="text-xs text-[hsl(var(--muted-foreground))]">Bệnh nhân</p>
            <p className="font-medium">{exam.patient.fullName}</p>
          </div>
        </div>
        <div className="card-base p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-violet-100 flex items-center justify-center">
            <Stethoscope className="h-5 w-5 text-violet-600" />
          </div>
          <div>
            <p className="text-xs text-[hsl(var(--muted-foreground))]">Bác sĩ kê đơn</p>
            <p className="font-medium">{prescription.doctor.fullName}</p>
          </div>
        </div>
        <div className="card-base p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-emerald-100 flex items-center justify-center">
            <Pill className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-xs text-[hsl(var(--muted-foreground))]">Số loại thuốc</p>
            <p className="font-medium">{totalItems}</p>
          </div>
        </div>
        <div className="card-base p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-amber-100 flex items-center justify-center">
            <FileText className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <p className="text-xs text-[hsl(var(--muted-foreground))]">Tổng số lượng</p>
            <p className="font-medium">{totalQuantity} đơn vị</p>
          </div>
        </div>
      </div>

      {/* Prescription Items */}
      <div className="card-base">
        <div className="p-4 bg-gray-50 border-b flex items-center gap-2">
          <Pill className="h-5 w-5 text-emerald-500" />
          <h3 className="font-semibold">Chi tiết đơn thuốc</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-4 text-left font-semibold">#</th>
                <th className="px-6 py-4 text-left font-semibold">Tên thuốc</th>
                <th className="px-6 py-4 text-center font-semibold">Số lượng</th>
                <th className="px-6 py-4 text-left font-semibold">Liều dùng</th>
                <th className="px-6 py-4 text-center font-semibold">Số ngày</th>
                <th className="px-6 py-4 text-left font-semibold">Hướng dẫn</th>
              </tr>
            </thead>
            <tbody>
              {prescription.items.map((item, idx) => (
                <tr key={idx} className="border-b last:border-b-0 hover:bg-gray-50">
                  <td className="px-6 py-4 text-gray-500">{idx + 1}</td>
                  <td className="px-6 py-4">
                    <p className="font-medium">{item.medicine.name}</p>
                  </td>
                  <td className="px-6 py-4 text-center font-medium">{item.quantity}</td>
                  <td className="px-6 py-4 text-gray-600">{item.dosage}</td>
                  <td className="px-6 py-4 text-center text-gray-600">
                    {item.durationDays || "—"}
                  </td>
                  <td className="px-6 py-4 text-gray-500 text-sm">
                    {item.instructions || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Notes */}
      {prescription.notes && (
        <div className="card-base">
          <div className="p-4 bg-gray-50 border-b flex items-center gap-2">
            <FileText className="h-5 w-5 text-amber-500" />
            <h3 className="font-semibold">Ghi chú</h3>
          </div>
          <div className="p-6">
            <p className="text-gray-700 whitespace-pre-wrap">{prescription.notes}</p>
          </div>
        </div>
      )}

      {/* Dispensed Info */}
      {prescription.status === "DISPENSED" && prescription.dispense?.dispensedAt && (
        <div className="card-base border-green-200 bg-green-50">
          <div className="p-4 flex items-center gap-3">
            <CheckCircle className="h-6 w-6 text-green-600" />
            <div>
              <p className="font-medium text-green-800">Đã phát thuốc</p>
              <p className="text-sm text-green-600">
                {format(new Date(prescription.dispense.dispensedAt), "PPPp", { locale: vi })}
                {prescription.dispense.dispensedBy && ` • Nhân viên: ${prescription.dispense.dispensedBy}`}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Audit Info */}
      <div className="card-base">
        <div className="p-4 bg-gray-50 border-b">
          <h3 className="font-semibold text-sm">Thông tin kiểm toán</h3>
        </div>
        <div className="p-4 grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-medium text-gray-500">Tạo lúc</p>
            <p className="text-sm text-gray-700">
              {format(new Date(prescription.createdAt), "PPPp", { locale: vi })}
            </p>
            {prescription.createdBy && (
              <p className="text-xs text-gray-500">bởi {prescription.createdBy}</p>
            )}
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500">Kê đơn lúc</p>
            <p className="text-sm text-gray-700">
              {format(new Date(prescription.prescribedAt), "PPPp", { locale: vi })}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

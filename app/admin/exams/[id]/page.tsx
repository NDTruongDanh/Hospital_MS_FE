"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { format, differenceInMilliseconds, formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { 
  ArrowLeft, 
  Stethoscope, 
  User, 
  Calendar,
  FileText,
  Pill,
  Heart,
  Clock,
  Printer,
  Edit,
  PlusCircle,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import medicalExamService, { getPrescriptionByExam } from "@/services/medical-exam.service";
import { MedicalExam, ExamStatus, Prescription } from "@/interfaces/medical-exam";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Status badge colors
const STATUS_COLORS: Record<ExamStatus, { bg: string; text: string; label: string }> = {
  PENDING: { bg: "bg-yellow-100", text: "text-yellow-700", label: "Chờ khám" },
  IN_PROGRESS: { bg: "bg-blue-100", text: "text-blue-700", label: "Đang khám" },
  FINALIZED: { bg: "bg-green-100", text: "text-green-700", label: "Hoàn thành" },
  CANCELLED: { bg: "bg-red-100", text: "text-red-700", label: "Đã hủy" },
};

export default function MedicalExamDetailPage() {
  const router = useRouter();
  const params = useParams();
  const examId = params.id as string;
  
  const [exam, setExam] = useState<MedicalExam | null>(null);
  const [prescription, setPrescription] = useState<Prescription | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    if (examId) {
      fetchExam();
    }
  }, [examId]);

  // 24-hour edit rule timer
  useEffect(() => {
    if (!exam) return;
    
    const createdAt = new Date(exam.createdAt);
    const expiresAt = createdAt.getTime() + 24 * 60 * 60 * 1000;
    const isEditable = new Date().getTime() < expiresAt;

    if (isEditable) {
      const timer = setInterval(() => {
        const diff = differenceInMilliseconds(expiresAt, new Date());
        if (diff <= 0) {
          setTimeLeft("Chỉ đọc");
          clearInterval(timer);
        } else {
          const hours = Math.floor(diff / (1000 * 60 * 60));
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          setTimeLeft(`${hours}h ${minutes}m còn lại`);
        }
      }, 1000);
      return () => clearInterval(timer);
    } else {
      setTimeLeft("Chỉ đọc");
    }
  }, [exam]);

  const fetchExam = async () => {
    setLoading(true);
    try {
      const data = await medicalExamService.getById(examId);
      setExam(data);
      
      // Fetch prescription separately if exam has one
      if (data.hasPrescription) {
        try {
          const prescriptionData = await getPrescriptionByExam(examId);
          if (prescriptionData?.data) {
            setPrescription(prescriptionData.data);
          }
        } catch (err) {
          console.error("Failed to fetch prescription:", err);
          // Don't fail entire page if prescription fetch fails
        }
      }
    } catch (error) {
      console.error("Failed to fetch exam:", error);
      toast.error("Không thể tải chi tiết phiếu khám");
    } finally {
      setLoading(false);
    }
  };

  // Check if exam can still be edited (24-hour rule) - handle missing createdAt
  const isEditable = exam && exam.createdAt 
    ? new Date().getTime() < (new Date(exam.createdAt).getTime() + 24 * 60 * 60 * 1000) 
    : true; // If no createdAt, assume editable

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
        <p className="text-[hsl(var(--muted-foreground))] mb-4">
          Phiếu khám này không tồn tại hoặc đã bị xóa.
        </p>
        <button onClick={() => router.back()} className="btn-primary">
          Quay lại
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header - Sky Blue Gradient like OLD-Frontend */}
      <div className="relative rounded-xl bg-gradient-to-r from-sky-500 to-cyan-500 p-6 text-white overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-white" />
          <div className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full bg-white" />
        </div>

        <div className="relative flex items-start justify-between gap-6 flex-wrap">
          <div className="flex items-center gap-5">
            {/* Back button */}
            <button
              onClick={() => router.back()}
              className="p-2 rounded-lg text-white/90 hover:text-white hover:bg-white/20 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>

            {/* Icon */}
            <div className="h-16 w-16 rounded-xl bg-white/20 flex items-center justify-center">
              <Stethoscope className="h-8 w-8 text-white" />
            </div>

            {/* Title & Meta */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold tracking-tight">
                  Chi tiết phiếu khám
                </h1>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  isEditable 
                    ? "bg-white/20 text-white border border-white/30" 
                    : "bg-white/10 text-white/80 border border-white/20"
                }`}>
                  <Clock className="h-3 w-3 mr-1" />
                  {timeLeft}
                </span>
              </div>
              <p className="text-white/80 text-sm font-medium">
                {format(new Date(exam.examDate), "PPP", { locale: vi })} • {exam.patient.fullName}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            <button className="inline-flex items-center px-4 py-2 rounded-lg bg-white/10 border border-white/30 text-white hover:bg-white/20 transition-colors">
              <Printer className="mr-2 h-4 w-4" />
              In
            </button>
            {isEditable && (
              <Link
                href={`/admin/exams/${exam.id}/edit`}
                className="inline-flex items-center px-4 py-2 rounded-lg bg-white/10 border border-white/30 text-white hover:bg-white/20 transition-colors"
              >
                <Edit className="h-4 w-4 mr-2" />
                Sửa
              </Link>
            )}
            {!exam.hasPrescription && (
              <Link
                href={`/admin/exams/${exam.id}/prescription`}
                className="inline-flex items-center px-4 py-2 rounded-lg bg-white text-sky-600 hover:bg-white/90 transition-colors"
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                Thêm đơn thuốc
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Stats Summary Bar */}
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
            <p className="text-xs text-[hsl(var(--muted-foreground))]">Bác sĩ</p>
            <p className="font-medium">{exam.doctor.fullName}</p>
          </div>
        </div>
        <div className="card-base p-4 flex items-center gap-3">
          <div className={`h-10 w-10 rounded-lg ${exam.hasPrescription ? 'bg-emerald-100' : 'bg-gray-100'} flex items-center justify-center`}>
            <Pill className={`h-5 w-5 ${exam.hasPrescription ? 'text-emerald-600' : 'text-gray-400'}`} />
          </div>
          <div>
            <p className="text-xs text-[hsl(var(--muted-foreground))]">Đơn thuốc</p>
            <p className="font-medium">{exam.hasPrescription ? "Có" : "Không"}</p>
          </div>
        </div>
        <div className="card-base p-4 flex items-center gap-3">
          <div className={`h-10 w-10 rounded-lg ${isEditable ? 'bg-emerald-100' : 'bg-gray-100'} flex items-center justify-center`}>
            <FileText className={`h-5 w-5 ${isEditable ? 'text-emerald-600' : 'text-gray-400'}`} />
          </div>
          <div>
            <p className="text-xs text-[hsl(var(--muted-foreground))]">Trạng thái</p>
            <p className="font-medium">{isEditable ? "Có thể chỉnh sửa" : "Đã lưu trữ"}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Main Content - 2 columns */}
        <div className="md:col-span-2 space-y-6">
          {/* Clinical Findings */}
          <div className="card-base">
            <div className="p-4 bg-gray-50 border-b flex items-center gap-2">
              <FileText className="h-5 w-5 text-sky-600" />
              <h3 className="font-semibold">Kết quả khám lâm sàng</h3>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Chẩn đoán
                </h4>
                <p className="text-gray-800 text-lg">
                  {exam.diagnosis || <span className="text-gray-400 italic">Chưa có chẩn đoán</span>}
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    Triệu chứng
                  </h4>
                  <p className="text-gray-700">
                    {exam.symptoms || <span className="text-gray-400 italic">Chưa ghi nhận</span>}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    Phương pháp điều trị
                  </h4>
                  <p className="text-gray-700">
                    {exam.treatment || <span className="text-gray-400 italic">Chưa ghi nhận</span>}
                  </p>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Ghi chú của bác sĩ
                </h4>
                <p className="text-gray-700 bg-gray-50 p-4 rounded-lg border">
                  {exam.notes || <span className="text-gray-400 italic">Không có ghi chú</span>}
                </p>
              </div>
            </div>
          </div>

          {/* Vital Signs */}
          {exam.vitals && Object.values(exam.vitals).some(v => v) && (
            <div className="card-base">
              <div className="p-4 bg-gray-50 border-b flex items-center gap-2">
                <Heart className="h-5 w-5 text-rose-500" />
                <h3 className="font-semibold">Chỉ số sinh hiệu</h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-3 gap-4">
                  {exam.vitals.temperature && (
                    <div className="p-4 rounded-lg bg-orange-50 border border-orange-200 text-center">
                      <p className="text-2xl font-bold text-orange-700">{exam.vitals.temperature}°C</p>
                      <p className="text-sm text-orange-600">Nhiệt độ</p>
                    </div>
                  )}
                  {(exam.vitals.bloodPressureSystolic && exam.vitals.bloodPressureDiastolic) && (
                    <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-center">
                      <p className="text-2xl font-bold text-red-700">
                        {exam.vitals.bloodPressureSystolic}/{exam.vitals.bloodPressureDiastolic}
                      </p>
                      <p className="text-sm text-red-600">Huyết áp (mmHg)</p>
                    </div>
                  )}
                  {exam.vitals.heartRate && (
                    <div className="p-4 rounded-lg bg-pink-50 border border-pink-200 text-center">
                      <p className="text-2xl font-bold text-pink-700">{exam.vitals.heartRate}</p>
                      <p className="text-sm text-pink-600">Nhịp tim (bpm)</p>
                    </div>
                  )}
                  {exam.vitals.weight && (
                    <div className="p-4 rounded-lg bg-purple-50 border border-purple-200 text-center">
                      <p className="text-2xl font-bold text-purple-700">{exam.vitals.weight}</p>
                      <p className="text-sm text-purple-600">Cân nặng (kg)</p>
                    </div>
                  )}
                  {exam.vitals.height && (
                    <div className="p-4 rounded-lg bg-indigo-50 border border-indigo-200 text-center">
                      <p className="text-2xl font-bold text-indigo-700">{exam.vitals.height}</p>
                      <p className="text-sm text-indigo-600">Chiều cao (cm)</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Prescription */}
          <div className="card-base">
            <div className="p-4 bg-gray-50 border-b flex items-center gap-2">
              <Pill className="h-5 w-5 text-emerald-600" />
              <h3 className="font-semibold">Đơn thuốc</h3>
            </div>
            <div className="p-6">
              {exam.hasPrescription && prescription ? (
                <div>
                  <div className="flex items-center justify-between bg-emerald-50 p-4 rounded-lg border border-emerald-200 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
                        <Pill className="h-5 w-5 text-emerald-600" />
                      </div>
                      <div>
                        <p className="font-medium text-emerald-800">
                          Đơn thuốc #{prescription.id.slice(-6).toUpperCase()}
                        </p>
                        <p className="text-sm text-emerald-600">
                          Tạo ngày {format(new Date(prescription.createdAt), "PPP", { locale: vi })}
                        </p>
                      </div>
                    </div>
                    <Link
                      href={`/admin/exams/${exam.id}/prescription/view`}
                      className="btn-secondary inline-flex items-center"
                    >
                      Xem chi tiết
                      <ExternalLink className="ml-2 h-4 w-4" />
                    </Link>
                  </div>
                  
                  {/* Prescription items table */}
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left font-medium">Thuốc</th>
                          <th className="px-4 py-3 text-center font-medium">SL</th>
                          <th className="px-4 py-3 text-left font-medium">Liều dùng</th>
                          <th className="px-4 py-3 text-left font-medium">Ghi chú</th>
                        </tr>
                      </thead>
                      <tbody>
                        {prescription.items.map((item, idx) => (
                          <tr key={idx} className="border-t">
                            <td className="px-4 py-3 font-medium">{item.medicine.name}</td>
                            <td className="px-4 py-3 text-center">{item.quantity}</td>
                            <td className="px-4 py-3 text-gray-600">{item.dosage}</td>
                            <td className="px-4 py-3 text-gray-500">{item.instructions || "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  {prescription.notes && (
                    <div className="mt-4 p-4 bg-amber-50 rounded-lg border border-amber-200">
                      <p className="text-sm text-amber-800">
                        <strong>Ghi chú đơn thuốc:</strong> {prescription.notes}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                      <Pill className="h-5 w-5 text-gray-400" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-600">Chưa có đơn thuốc</p>
                      <p className="text-sm text-gray-500">
                        Chưa có đơn thuốc được tạo cho phiếu khám này
                      </p>
                    </div>
                  </div>
                  <Link
                    href={`/admin/exams/${exam.id}/prescription`}
                    className="btn-primary inline-flex items-center"
                  >
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Thêm đơn thuốc
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar - 1 column */}
        <div className="space-y-6">
          {/* Patient Information */}
          <div className="card-base">
            <div className="p-3 bg-gray-50 border-b flex items-center gap-2">
              <User className="h-4 w-4" />
              <h3 className="font-medium text-sm">Thông tin bệnh nhân</h3>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-sky-50">
                <User className="h-4 w-4 text-sky-600" />
                <div>
                  <p className="text-xs text-gray-500">Họ tên</p>
                  <p className="font-medium">{exam.patient.fullName}</p>
                </div>
              </div>
              {exam.patient.phoneNumber && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                  <div>
                    <p className="text-xs text-gray-500">Số điện thoại</p>
                    <p className="text-sm">{exam.patient.phoneNumber}</p>
                  </div>
                </div>
              )}
              {exam.patient.gender && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                  <div>
                    <p className="text-xs text-gray-500">Giới tính</p>
                    <p className="text-sm">{exam.patient.gender === "MALE" ? "Nam" : "Nữ"}</p>
                  </div>
                </div>
              )}
              <Link
                href={`/admin/patients/${exam.patient.id}`}
                className="text-sm text-sky-600 hover:underline inline-flex items-center mt-2"
              >
                Xem hồ sơ bệnh nhân
                <ExternalLink className="ml-1 h-3 w-3" />
              </Link>
            </div>
          </div>

          {/* Appointment Information */}
          <div className="card-base">
            <div className="p-3 bg-gray-50 border-b flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <h3 className="font-medium text-sm">Lịch hẹn</h3>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-violet-50">
                <Calendar className="h-4 w-4 text-violet-600" />
                <div>
                  <p className="text-xs text-gray-500">Thời gian</p>
                  <p className="font-medium">
                    {format(new Date(exam.appointment.appointmentTime), "PPPp", { locale: vi })}
                  </p>
                </div>
              </div>
              <Link
                href={`/admin/appointments/${exam.appointment.id}`}
                className="text-sm text-violet-600 hover:underline inline-flex items-center mt-2"
              >
                Xem lịch hẹn
                <ExternalLink className="ml-1 h-3 w-3" />
              </Link>
            </div>
          </div>

          {/* Audit Information */}
          <div className="card-base">
            <div className="p-3 bg-gray-50 border-b">
              <h3 className="font-medium text-sm">Thông tin kiểm toán</h3>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <p className="text-xs font-medium text-gray-500">Tạo lúc</p>
                <p className="text-sm text-gray-700">
                  {format(new Date(exam.createdAt), "PPPp", { locale: vi })}
                </p>
                <p className="text-xs text-gray-500">
                  bởi {exam.doctor.fullName}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500">Cập nhật lần cuối</p>
                <p className="text-sm text-gray-700">
                  {format(new Date(exam.updatedAt), "PPPp", { locale: vi })}
                </p>
              </div>
            </div>
          </div>

          {/* Follow-up */}
          {exam.followUpDate && (
            <div className="card-base border-amber-200 bg-amber-50">
              <div className="p-4">
                <h4 className="font-medium text-amber-800 mb-1 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Ngày tái khám
                </h4>
                <p className="text-lg font-semibold text-amber-900">
                  {format(new Date(exam.followUpDate), "PPP", { locale: vi })}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

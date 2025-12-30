"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  Clock,
  User,
  Stethoscope,
  Phone,
  FileText,
  CheckCircle,
  XCircle,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { appointmentService, Appointment } from "@/services/appointment.service";

const STATUS_CONFIG: Record<string, { label: string; class: string; icon: typeof Calendar }> = {
  SCHEDULED: { label: "Đã lên lịch", class: "badge-info", icon: Calendar },
  PENDING: { label: "Chờ xác nhận", class: "badge-warning", icon: Calendar },
  CONFIRMED: { label: "Đã xác nhận", class: "badge-info", icon: Calendar },
  IN_PROGRESS: { label: "Đang khám", class: "badge-primary", icon: Clock },
  COMPLETED: { label: "Hoàn thành", class: "badge-success", icon: CheckCircle },
  CANCELLED: { label: "Đã hủy", class: "badge-danger", icon: XCircle },
  NO_SHOW: { label: "Vắng mặt", class: "badge-warning", icon: AlertTriangle },
};

const TYPE_CONFIG: Record<string, { label: string; class: string }> = {
  CONSULTATION: { label: "Khám bệnh", class: "badge-info" },
  FOLLOW_UP: { label: "Tái khám", class: "badge-secondary" },
  EMERGENCY: { label: "Cấp cứu", class: "badge-danger" },
  WALK_IN: { label: "Walk-in", class: "badge-warning" },
};

export default function AppointmentDetailPage() {
  const params = useParams();
  const appointmentId = params.id as string;

  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (appointmentId) {
      fetchAppointment();
    }
  }, [appointmentId]);

  const fetchAppointment = async () => {
    try {
      setLoading(true);
      const data = await appointmentService.getById(appointmentId);
      setAppointment(data);
    } catch (error) {
      console.error("Failed to fetch appointment:", error);
      toast.error("Không thể tải thông tin cuộc hẹn");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-[hsl(var(--primary))]" />
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="text-center py-12">
        <Calendar className="w-16 h-16 mx-auto text-gray-300 mb-4" />
        <p className="text-gray-500">Không tìm thấy cuộc hẹn</p>
        <Link href="/receptionist/appointments" className="btn-primary mt-4 inline-flex">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Quay lại
        </Link>
      </div>
    );
  }

  const status = STATUS_CONFIG[appointment.status] || STATUS_CONFIG.PENDING;
  const type = TYPE_CONFIG[appointment.type] || TYPE_CONFIG.CONSULTATION;
  const StatusIcon = status.icon;

  const date = new Date(appointment.appointmentTime).toLocaleDateString("vi-VN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const time = new Date(appointment.appointmentTime).toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/receptionist/appointments" className="btn-icon">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-display">Chi tiết lịch hẹn</h1>
          <p className="text-[hsl(var(--muted-foreground))] mt-1">
            Mã: {appointment.id.slice(0, 8)}...
          </p>
        </div>
        <span className={`badge ${status.class} text-sm`}>
          <StatusIcon className="w-4 h-4" />
          {status.label}
        </span>
      </div>

      {/* Main Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Patient Card */}
        <Link 
          href={`/receptionist/patients/${appointment.patient.id}`}
          className="backdrop-blur-lg bg-white/70 border border-white/50 rounded-2xl p-6 shadow-xl hover:border-blue-300 transition-all group"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-blue-400 to-indigo-500 shadow-lg">
                <User className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-section">Bệnh nhân</h3>
            </div>
            <span className="text-xs text-blue-500 group-hover:underline">Xem chi tiết →</span>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center text-lg font-semibold text-blue-600">
                {appointment.patient.fullName?.charAt(0) || "?"}
              </div>
              <div>
                <p className="font-semibold text-lg text-gray-800">{appointment.patient.fullName}</p>
                {appointment.patient.phoneNumber && (
                  <p className="text-small flex items-center gap-1 text-gray-500">
                    <Phone className="w-3 h-3" />
                    {appointment.patient.phoneNumber}
                  </p>
                )}
              </div>
            </div>
          </div>
        </Link>

        {/* Doctor Card */}
        <div className="backdrop-blur-lg bg-white/70 border border-white/50 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-gradient-to-br from-green-400 to-emerald-500 shadow-lg">
              <Stethoscope className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-section">Bác sĩ</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center text-lg font-semibold text-green-600">
                {appointment.doctor.fullName?.charAt(0) || "?"}
              </div>
              <div>
                <p className="font-semibold text-lg text-gray-800">BS. {appointment.doctor.fullName}</p>
                {appointment.doctor.department && (
                  <p className="text-small text-gray-500">{appointment.doctor.department}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Appointment Details */}
      <div className="backdrop-blur-lg bg-white/70 border border-white/50 rounded-2xl p-6 shadow-xl">
        <h3 className="text-section mb-4">Thông tin cuộc hẹn</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-100">
            <div className="flex items-center gap-2 text-purple-600 mb-1">
              <Calendar className="w-4 h-4" />
              <span className="text-sm">Ngày hẹn</span>
            </div>
            <p className="font-semibold text-gray-800">{date}</p>
          </div>
          <div className="p-4 rounded-xl bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-100">
            <div className="flex items-center gap-2 text-orange-600 mb-1">
              <Clock className="w-4 h-4" />
              <span className="text-sm">Giờ hẹn</span>
            </div>
            <p className="font-semibold text-lg text-gray-800">{time}</p>
          </div>
          <div className="p-4 rounded-xl bg-gradient-to-r from-cyan-50 to-teal-50 border border-cyan-100">
            <div className="text-cyan-600 text-sm mb-1">Loại khám</div>
            <span className={`badge ${type.class}`}>{type.label}</span>
          </div>
          {appointment.queueNumber && (
            <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-50 to-violet-50 border border-indigo-100">
              <div className="text-indigo-600 text-sm mb-1">Số thứ tự</div>
              <p className="font-bold text-2xl text-indigo-600">#{appointment.queueNumber}</p>
            </div>
          )}
        </div>

        {/* Reason & Notes */}
        <div className="mt-4 space-y-4">
          <div className="p-4 rounded-xl bg-gradient-to-r from-slate-50 to-gray-50 border border-slate-200">
            <div className="flex items-center gap-2 text-slate-600 mb-1">
              <FileText className="w-4 h-4" />
              <span className="text-sm">Lý do khám</span>
            </div>
            <p className="text-gray-800">{appointment.reason || "Không có"}</p>
          </div>
          {appointment.notes && (
            <div className="p-4 rounded-xl bg-gradient-to-r from-blue-50 to-sky-50 border border-blue-100">
              <div className="text-blue-600 text-sm mb-1">Ghi chú</div>
              <p className="text-gray-800">{appointment.notes}</p>
            </div>
          )}
          {appointment.cancelReason && (
            <div className="p-4 rounded-xl bg-gradient-to-r from-red-50 to-rose-50 border border-red-200">
              <div className="text-red-600 text-sm mb-1">Lý do hủy</div>
              <p className="text-red-700">{appointment.cancelReason}</p>
            </div>
          )}
        </div>
      </div>

      {/* Metadata */}
      <div className="backdrop-blur-lg bg-white/60 border border-white/50 rounded-2xl p-6">
        <h3 className="text-section mb-4 text-gray-700">Thông tin hệ thống</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="p-3 rounded-lg bg-gradient-to-r from-gray-50 to-slate-50 border border-gray-100">
            <span className="text-gray-500">Tạo lúc</span>
            <p className="text-gray-800 font-medium">{new Date(appointment.createdAt).toLocaleString("vi-VN")}</p>
          </div>
          <div className="p-3 rounded-lg bg-gradient-to-r from-gray-50 to-slate-50 border border-gray-100">
            <span className="text-gray-500">Cập nhật lúc</span>
            <p className="text-gray-800 font-medium">{new Date(appointment.updatedAt).toLocaleString("vi-VN")}</p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Link 
          href="/receptionist/appointments" 
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/70 backdrop-blur border border-white/50 text-gray-700 font-medium hover:bg-white/90 transition-all shadow-md"
        >
          <ArrowLeft className="w-4 h-4" />
          Quay lại danh sách
        </Link>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  Clock,
  User,
  Stethoscope,
  Phone,
  FileText,
  Edit,
  XCircle,
  CheckCircle,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { appointmentService, Appointment } from "@/services/appointment.service";
import { authService } from "@/services/auth.service";
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

const STATUS_CONFIG = {
  SCHEDULED: { label: "Đã lên lịch", class: "badge-info", icon: Calendar },
  PENDING: { label: "Chờ xác nhận", class: "badge-warning", icon: Calendar },
  CONFIRMED: { label: "Đã xác nhận", class: "badge-info", icon: Calendar },
  IN_PROGRESS: { label: "Đang khám", class: "badge-primary", icon: Clock },
  COMPLETED: { label: "Hoàn thành", class: "badge-success", icon: CheckCircle },
  CANCELLED: { label: "Đã hủy", class: "badge-danger", icon: XCircle },
  NO_SHOW: { label: "Vắng mặt", class: "badge-warning", icon: AlertTriangle },
};

const TYPE_CONFIG = {
  CONSULTATION: { label: "Khám bệnh", class: "badge-info" },
  FOLLOW_UP: { label: "Tái khám", class: "badge-secondary" },
  EMERGENCY: { label: "Cấp cứu", class: "badge-danger" },
  WALK_IN: { label: "Walk-in", class: "badge-warning" },
};

export default function AppointmentDetailPage() {
  const router = useRouter();
  const params = useParams();
  const appointmentId = params.id as string;

  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [creatorEmail, setCreatorEmail] = useState<string | null>(null);
  const [updaterEmail, setUpdaterEmail] = useState<string | null>(null);

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
      
      // Fetch creator/updater emails from account IDs
      if (data?.createdBy) {
        try {
          const creator = await authService.getAccount(data.createdBy);
          setCreatorEmail(creator.email);
        } catch {
          setCreatorEmail(null);
        }
      }
      if (data?.updatedBy && data.updatedBy !== data.createdBy) {
        try {
          const updater = await authService.getAccount(data.updatedBy);
          setUpdaterEmail(updater.email);
        } catch {
          setUpdaterEmail(null);
        }
      } else if (data?.updatedBy === data?.createdBy) {
        // Same person created and updated
        setUpdaterEmail(creatorEmail);
      }
    } catch (error) {
      console.error("Failed to fetch appointment:", error);
      toast.error("Không thể tải thông tin cuộc hẹn");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!appointment) return;
    try {
      setActionLoading(true);
      await appointmentService.cancel(appointment.id, { cancelReason: "Hủy bởi quản trị viên" });
      toast.success("Đã hủy lịch hẹn thành công");
      setShowCancelDialog(false);
      fetchAppointment();
    } catch (error) {
      toast.error("Không thể hủy lịch hẹn");
    } finally {
      setActionLoading(false);
    }
  };

  const handleComplete = async () => {
    if (!appointment) return;
    try {
      setActionLoading(true);
      await appointmentService.complete(appointment.id);
      toast.success("Đã hoàn thành cuộc hẹn");
      fetchAppointment();
    } catch (error) {
      toast.error("Không thể hoàn thành cuộc hẹn");
    } finally {
      setActionLoading(false);
    }
  };

  const formatDateTime = (isoDate: string) => {
    const date = new Date(isoDate);
    return {
      date: date.toLocaleDateString("vi-VN", {
        weekday: "long",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }),
      time: date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-[hsl(var(--primary))]" />
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="text-center py-20">
        <AlertTriangle className="w-12 h-12 mx-auto text-[hsl(var(--muted-foreground))] opacity-50" />
        <p className="text-[hsl(var(--muted-foreground))] mt-2">Không tìm thấy cuộc hẹn</p>
        <Link href="/admin/appointments" className="btn-primary mt-4 inline-flex">
          Quay lại danh sách
        </Link>
      </div>
    );
  }

  const status = STATUS_CONFIG[appointment.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.SCHEDULED;
  const type = TYPE_CONFIG[appointment.type as keyof typeof TYPE_CONFIG] || TYPE_CONFIG.CONSULTATION;
  const StatusIcon = status.icon;
  const { date, time } = formatDateTime(appointment.appointmentTime);
  const canCancel = appointment.status === "PENDING" || appointment.status === "CONFIRMED" || appointment.status === "SCHEDULED";
  const canComplete = appointment.status === "IN_PROGRESS" || appointment.status === "SCHEDULED" || appointment.status === "CONFIRMED";

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/appointments" className="btn-icon">
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
        <div className="backdrop-blur-lg bg-white/70 border border-white/50 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-400 to-indigo-500 shadow-lg">
              <User className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-section">Bệnh nhân</h3>
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
        </div>

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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="p-3 rounded-lg bg-gradient-to-r from-gray-50 to-slate-50 border border-gray-100">
            <span className="text-gray-500">Tạo lúc</span>
            <p className="text-gray-800 font-medium">{new Date(appointment.createdAt).toLocaleString("vi-VN")}</p>
          </div>
          <div className="p-3 rounded-lg bg-gradient-to-r from-gray-50 to-slate-50 border border-gray-100">
            <span className="text-gray-500">Cập nhật lúc</span>
            <p className="text-gray-800 font-medium">{new Date(appointment.updatedAt).toLocaleString("vi-VN")}</p>
          </div>
          {creatorEmail && (
            <div className="p-3 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100">
              <span className="text-blue-600">Tạo bởi</span>
              <p className="text-gray-800 font-medium truncate" title={creatorEmail}>{creatorEmail}</p>
            </div>
          )}
          {updaterEmail && updaterEmail !== creatorEmail && (
            <div className="p-3 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 border border-green-100">
              <span className="text-green-600">Cập nhật bởi</span>
              <p className="text-gray-800 font-medium truncate" title={updaterEmail}>{updaterEmail}</p>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <Link 
          href="/admin/appointments" 
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/70 backdrop-blur border border-white/50 text-gray-700 font-medium hover:bg-white/90 transition-all shadow-md"
        >
          <ArrowLeft className="w-4 h-4" />
          Quay lại
        </Link>
        {canCancel && (
          <Link 
            href={`/admin/appointments/${appointmentId}/edit`}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-400 to-indigo-500 text-white font-medium hover:from-blue-500 hover:to-indigo-600 transition-all shadow-md"
          >
            <Edit className="w-4 h-4" />
            Chỉnh sửa
          </Link>
        )}
        {canComplete && (
          <button 
            onClick={handleComplete} 
            disabled={actionLoading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-green-400 to-emerald-500 text-white font-medium hover:from-green-500 hover:to-emerald-600 transition-all shadow-md disabled:opacity-50"
          >
            {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
            Hoàn thành
          </button>
        )}
        {canCancel && (
          <button 
            onClick={() => setShowCancelDialog(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-400 to-rose-500 text-white font-medium hover:from-red-500 hover:to-rose-600 transition-all shadow-md"
          >
            <XCircle className="w-4 h-4" />
            Hủy lịch hẹn
          </button>
        )}
      </div>

      {/* Cancel Dialog */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận hủy lịch hẹn</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn hủy lịch hẹn của bệnh nhân "{appointment.patient.fullName}"?
              Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Không</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancel}
              className="bg-red-600 hover:bg-red-700"
              disabled={actionLoading}
            >
              {actionLoading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Hủy lịch hẹn
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

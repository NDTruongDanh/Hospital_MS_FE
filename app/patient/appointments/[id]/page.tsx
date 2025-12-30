"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Stethoscope,
  FileText,
  CheckCircle,
  XCircle,
  Loader2,
  AlertTriangle,
  Building2,
} from "lucide-react";
import { toast } from "sonner";
import { appointmentService, Appointment } from "@/services/appointment.service";
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

const STATUS_CONFIG: Record<string, { label: string; class: string; icon: typeof Calendar }> = {
  SCHEDULED: { label: "Đã lên lịch", class: "badge-info", icon: Calendar },
  IN_PROGRESS: { label: "Đang khám", class: "badge-primary", icon: Clock },
  COMPLETED: { label: "Hoàn thành", class: "badge-success", icon: CheckCircle },
  CANCELLED: { label: "Đã hủy", class: "badge-danger", icon: XCircle },
  NO_SHOW: { label: "Vắng mặt", class: "badge-warning", icon: AlertTriangle },
};

export default function PatientAppointmentDetailPage() {
  const params = useParams();
  const appointmentId = params.id as string;

  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

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

  const handleCancel = async () => {
    if (!cancelReason.trim()) {
      toast.error("Vui lòng nhập lý do hủy");
      return;
    }
    try {
      setActionLoading(true);
      await appointmentService.cancel(appointmentId, { cancelReason });
      toast.success("Đã hủy lịch hẹn");
      setShowCancelDialog(false);
      fetchAppointment();
    } catch (error) {
      toast.error("Không thể hủy lịch hẹn");
    } finally {
      setActionLoading(false);
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
        <Link href="/patient/appointments" className="btn-primary mt-4 inline-flex">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Quay lại
        </Link>
      </div>
    );
  }

  const status = STATUS_CONFIG[appointment.status] || STATUS_CONFIG.SCHEDULED;
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

  const canCancel = appointment.status === "SCHEDULED";

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-8">
      {/* Background */}
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-blue-50 via-purple-50/30 to-pink-50/40" />

      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/patient/appointments" className="btn-icon">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-display">Chi tiết lịch hẹn</h1>
          <p className="text-[hsl(var(--muted-foreground))] mt-1">
            Mã: {appointment.id.slice(0, 8)}...
          </p>
        </div>
        <span className={`badge ${status.class} text-sm px-4 py-2`}>
          <StatusIcon className="w-4 h-4" />
          {status.label}
        </span>
      </div>

      {/* Doctor Card */}
      <div className="backdrop-blur-lg bg-white/70 border border-white/50 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-green-400 to-emerald-500 shadow-lg">
            <Stethoscope className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-section">Thông tin bác sĩ</h3>
        </div>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center text-xl font-semibold text-green-600">
              {appointment.doctor.fullName?.charAt(0) || "?"}
            </div>
            <div>
              <p className="font-semibold text-lg text-gray-800">BS. {appointment.doctor.fullName}</p>
              {appointment.doctor.department && (
                <p className="text-small flex items-center gap-1 text-gray-500">
                  <Building2 className="w-3 h-3" />
                  {appointment.doctor.department}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Appointment Details */}
      <div className="backdrop-blur-lg bg-white/70 border border-white/50 rounded-2xl p-6 shadow-xl">
        <h3 className="text-section mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-blue-600" />
          Thông tin cuộc hẹn
        </h3>
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
        </div>

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

      {/* Actions */}
      <div className="flex gap-3">
        <Link
          href="/patient/appointments"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/70 backdrop-blur border border-white/50 text-gray-700 font-medium hover:bg-white/90 transition-all shadow-md"
        >
          <ArrowLeft className="w-4 h-4" />
          Quay lại
        </Link>

        {canCancel && (
          <button
            onClick={() => setShowCancelDialog(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-500 to-rose-600 text-white font-medium hover:shadow-lg transition-all shadow-md"
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
            <AlertDialogTitle>Hủy lịch hẹn</AlertDialogTitle>
            <AlertDialogDescription>
              Vui lòng nhập lý do hủy lịch hẹn
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="my-4">
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Nhập lý do hủy..."
              className="w-full p-3 border rounded-lg resize-none"
              rows={3}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Đóng</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancel} disabled={actionLoading}>
              {actionLoading ? "Đang xử lý..." : "Xác nhận hủy"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

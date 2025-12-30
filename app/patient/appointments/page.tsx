"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Plus,
  Calendar,
  Clock,
  Stethoscope,
  CheckCircle,
  XCircle,
  Loader2,
  MoreHorizontal,
} from "lucide-react";
import { toast } from "sonner";
import { appointmentService, Appointment } from "@/services/appointment.service";
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

const STATUS_CONFIG = {
  PENDING: { label: "Chờ xác nhận", class: "badge-warning", icon: Calendar },
  CONFIRMED: { label: "Đã xác nhận", class: "badge-info", icon: Calendar },
  COMPLETED: { label: "Hoàn thành", class: "badge-success", icon: CheckCircle },
  CANCELLED: { label: "Đã hủy", class: "badge-danger", icon: XCircle },
  NO_SHOW: { label: "Vắng mặt", class: "badge-warning", icon: XCircle },
};

export default function PatientAppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"upcoming" | "past" | "all">("upcoming");
  const [cancelItem, setCancelItem] = useState<Appointment | null>(null);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const response = await appointmentService.list({});
      setAppointments(response.content);
    } catch (error) {
      console.error("Failed to fetch appointments:", error);
      toast.error("Không thể tải danh sách lịch hẹn");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!cancelItem) return;
    try {
      await appointmentService.cancel(cancelItem.id, { cancelReason: "Bệnh nhân hủy" });
      toast.success("Đã hủy lịch hẹn thành công");
      setCancelItem(null);
      fetchAppointments();
    } catch (error) {
      toast.error("Không thể hủy lịch hẹn");
    }
  };

  const now = new Date().toISOString();
  const filteredAppointments = appointments.filter(apt => {
    if (filter === "upcoming") return apt.appointmentTime >= now && (apt.status === "PENDING" || apt.status === "CONFIRMED");
    if (filter === "past") return apt.appointmentTime < now || (apt.status !== "PENDING" && apt.status !== "CONFIRMED");
    return true;
  }).sort((a, b) => {
    if (filter === "upcoming") return a.appointmentTime.localeCompare(b.appointmentTime);
    return b.appointmentTime.localeCompare(a.appointmentTime);
  });

  const formatDate = (isoDate: string) => {
    return new Date(isoDate).toLocaleDateString("vi-VN", {
      weekday: "long",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatTime = (isoDate: string) => {
    return new Date(isoDate).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-display">Lịch hẹn của tôi</h1>
          <p className="text-[hsl(var(--muted-foreground))] mt-1">
            Quản lý các lịch hẹn khám bệnh
          </p>
        </div>
        <Link href="/patient/appointments/new" className="btn-primary">
          <Plus className="w-5 h-5" />
          Đặt lịch mới
        </Link>
      </div>

      {/* Filters */}
      <div className="card-base">
        <div className="flex gap-2">
          {[
            { value: "upcoming", label: "Sắp tới" },
            { value: "past", label: "Đã qua" },
            { value: "all", label: "Tất cả" },
          ].map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value as any)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === f.value
                  ? "bg-[hsl(var(--primary))] text-white"
                  : "bg-[hsl(var(--secondary))] hover:bg-[hsl(var(--secondary))]/80"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Appointments List */}
      <div className="space-y-4">
        {loading ? (
          <div className="card-base text-center py-12">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-[hsl(var(--primary))]" />
            <p className="text-small mt-2">Đang tải...</p>
          </div>
        ) : filteredAppointments.length === 0 ? (
          <div className="card-base text-center py-12">
            <Calendar className="w-12 h-12 mx-auto text-[hsl(var(--muted-foreground))] opacity-50" />
            <p className="text-[hsl(var(--muted-foreground))] mt-2">
              {filter === "upcoming" ? "Bạn không có lịch hẹn sắp tới" : "Không có lịch hẹn nào"}
            </p>
            <Link href="/patient/appointments/new" className="btn-primary mt-4 inline-flex">
              <Plus className="w-4 h-4" />
              Đặt lịch ngay
            </Link>
          </div>
        ) : (
          filteredAppointments.map((apt) => {
            const status = STATUS_CONFIG[apt.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.PENDING;
            const StatusIcon = status.icon;
            const isUpcoming = apt.appointmentTime >= now && (apt.status === "PENDING" || apt.status === "CONFIRMED");
            
            return (
              <div
                key={apt.id}
                className={`card-base ${isUpcoming ? "border-l-4 border-l-[hsl(var(--primary))]" : ""}`}
              >
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  {/* Date */}
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-xl flex flex-col items-center justify-center ${
                      isUpcoming ? "bg-[hsl(var(--primary))] text-white" : "bg-[hsl(var(--secondary))]"
                    }`}>
                      <span className="text-2xl font-bold">
                        {new Date(apt.appointmentTime).getDate()}
                      </span>
                      <span className="text-xs">
                        Th{new Date(apt.appointmentTime).getMonth() + 1}
                      </span>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`badge ${status.class}`}>
                        <StatusIcon className="w-3 h-3" />
                        {status.label}
                      </span>
                      <span className="text-sm text-[hsl(var(--muted-foreground))]">
                        {formatDate(apt.appointmentTime)}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 mt-2">
                      <span className="flex items-center gap-1 text-sm font-medium">
                        <Clock className="w-4 h-4 text-[hsl(var(--primary))]" />
                        {formatTime(apt.appointmentTime)}
                      </span>
                      <span className="flex items-center gap-1 text-sm">
                        <Stethoscope className="w-4 h-4" />
                        BS. {apt.doctor.fullName}
                      </span>
                    </div>
                    {apt.reason && (
                      <p className="text-small mt-2">Lý do: {apt.reason}</p>
                    )}
                  </div>

                  {/* Actions */}
                  {(apt.status === "PENDING" || apt.status === "CONFIRMED") && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="btn-icon w-10 h-10">
                          <MoreHorizontal className="w-5 h-5" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => setCancelItem(apt)}
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Hủy lịch hẹn
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Cancel Confirmation */}
      <AlertDialog open={!!cancelItem} onOpenChange={() => setCancelItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận hủy lịch hẹn</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn hủy lịch hẹn này? Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Không</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancel}
              className="bg-red-600 hover:bg-red-700"
            >
              Hủy lịch hẹn
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

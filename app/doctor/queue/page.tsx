"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Clock,
  Phone,
  Stethoscope,
  CheckCircle,
  Loader2,
  User,
  AlertCircle,
  Play,
  Bell,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { appointmentService, Appointment } from "@/services/appointment.service";

export default function DoctorQueuePage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [callingNext, setCallingNext] = useState(false);
  const [doctorId, setDoctorId] = useState<string>("");

  useEffect(() => {
    // Get doctor ID from localStorage (set during login)
    const userData = localStorage.getItem("user");
    if (userData) {
      const user = JSON.parse(userData);
      setDoctorId(user.employeeId || user.id || "");
    }
  }, []);

  useEffect(() => {
    if (doctorId) {
      fetchQueue();
    }
  }, [doctorId]);

  const fetchQueue = async () => {
    try {
      setLoading(true);
      // Use the new getDoctorQueue API method
      const queue = await appointmentService.getDoctorQueue(doctorId);
      setAppointments(queue);
    } catch (error) {
      console.error("Failed to fetch queue:", error);
      // Fallback to list method if getDoctorQueue fails
      try {
        const response = await appointmentService.list({
          doctorId,
          status: "SCHEDULED",
        });
        const today = new Date().toISOString().split("T")[0];
        const todayAppts = response.content
          .filter(apt => apt.appointmentTime.startsWith(today))
          .sort((a, b) => (a.priority || 5) - (b.priority || 5) || (a.queueNumber || 0) - (b.queueNumber || 0));
        setAppointments(todayAppts);
      } catch (fallbackError) {
        toast.error("Không thể tải hàng đợi");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCallNext = async () => {
    try {
      setCallingNext(true);
      const called = await appointmentService.callNextPatient(doctorId);
      if (called) {
        toast.success(`Đã gọi bệnh nhân: ${called.patient.fullName} (STT: #${called.queueNumber || "N/A"})`);
        fetchQueue();
      } else {
        toast.info("Không có bệnh nhân nào đang chờ");
      }
    } catch (error) {
      console.error("Failed to call next:", error);
      toast.error("Không thể gọi bệnh nhân tiếp theo");
    } finally {
      setCallingNext(false);
    }
  };

  const handleComplete = async (apt: Appointment) => {
    try {
      await appointmentService.complete(apt.id);
      toast.success(`Đã hoàn thành khám cho ${apt.patient.fullName}`);
      fetchQueue();
    } catch (error) {
      toast.error("Không thể cập nhật trạng thái");
    }
  };

  const formatTime = (isoDate: string) => {
    return new Date(isoDate).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
  };

  const getStatusBadge = (status: string) => {
    if (status === "IN_PROGRESS") {
      return <span className="badge badge-warning">Đang khám</span>;
    }
    return <span className="badge badge-info">Chờ khám</span>;
  };

  const getPriorityBadge = (apt: Appointment) => {
    // Check priorityReason first (more descriptive)
    if (apt.priorityReason) {
      const priorityMap: Record<string, { label: string; class: string }> = {
        EMERGENCY: { label: "Cấp cứu", class: "badge-danger" },
        ELDERLY: { label: "Người cao tuổi", class: "badge-warning" },
        PREGNANT: { label: "Thai phụ", class: "badge-warning" },
        DISABILITY: { label: "Người khuyết tật", class: "badge-warning" },
        CHILD: { label: "Trẻ em", class: "badge-info" },
        VIP: { label: "VIP", class: "badge-primary" },
      };
      const config = priorityMap[apt.priorityReason];
      if (config) {
        return <span className={`badge ${config.class}`}>{config.label}</span>;
      }
    }
    // Fallback to priority number
    if (apt.priority && apt.priority <= 20) {
      return <span className="badge badge-danger">Ưu tiên cao</span>;
    }
    return null;
  };

  // Count waiting vs in-progress
  const waitingCount = appointments.filter(a => a.status === "SCHEDULED").length;
  const inProgressCount = appointments.filter(a => a.status === "IN_PROGRESS").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-display">Hàng đợi bệnh nhân</h1>
          <p className="text-[hsl(var(--muted-foreground))] mt-1">
            {waitingCount} đang chờ • {inProgressCount} đang khám
          </p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleCallNext} 
            className="btn-primary"
            disabled={callingNext || waitingCount === 0}
          >
            {callingNext ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Bell className="w-4 h-4" />
            )}
            Gọi bệnh nhân tiếp
          </button>
          <button onClick={fetchQueue} className="btn-secondary">
            <Loader2 className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Làm mới
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="card-base flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
            <Users className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <p className="text-2xl font-bold">{waitingCount}</p>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">Đang chờ</p>
          </div>
        </div>
        <div className="card-base flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
            <Stethoscope className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <p className="text-2xl font-bold">{inProgressCount}</p>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">Đang khám</p>
          </div>
        </div>
      </div>

      {/* Queue List */}
      <div className="space-y-4">
        {loading ? (
          <div className="card-base text-center py-12">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-[hsl(var(--primary))]" />
            <p className="text-small mt-2">Đang tải hàng đợi...</p>
          </div>
        ) : appointments.length === 0 ? (
          <div className="card-base text-center py-12">
            <CheckCircle className="w-12 h-12 mx-auto text-green-500 opacity-50" />
            <p className="text-[hsl(var(--muted-foreground))] mt-2">
              Không có bệnh nhân nào đang chờ
            </p>
            <p className="text-small mt-1">
              Hàng đợi sẽ tự động cập nhật khi có bệnh nhân mới
            </p>
          </div>
        ) : (
          appointments.map((apt, index) => (
            <div
              key={apt.id}
              className={`card-base flex flex-col md:flex-row md:items-center gap-4 ${
                apt.status === "IN_PROGRESS" 
                  ? "border-2 border-amber-400 bg-amber-50" 
                  : index === 0 
                    ? "border-2 border-[hsl(var(--primary))] bg-[hsl(var(--primary-light))]" 
                    : ""
              }`}
            >
              {/* Queue Number */}
              <div className={`w-16 h-16 rounded-xl flex items-center justify-center text-2xl font-bold ${
                apt.status === "IN_PROGRESS"
                  ? "bg-amber-400 text-white"
                  : index === 0 
                    ? "bg-[hsl(var(--primary))] text-white" 
                    : "bg-[hsl(var(--secondary))] text-[hsl(var(--foreground))]"
              }`}>
                #{apt.queueNumber || (index + 1)}
              </div>

              {/* Patient Info */}
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-lg font-semibold">{apt.patient.fullName}</p>
                  {getStatusBadge(apt.status)}
                  {getPriorityBadge(apt)}
                </div>
                <div className="flex flex-wrap gap-4 mt-2 text-sm text-[hsl(var(--muted-foreground))]">
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {formatTime(apt.appointmentTime)}
                  </span>
                  {apt.patient.phoneNumber && (
                    <span className="flex items-center gap-1">
                      <Phone className="w-4 h-4" />
                      {apt.patient.phoneNumber}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Stethoscope className="w-4 h-4" />
                    {apt.type === "WALK_IN" ? "Walk-in" : apt.type === "CONSULTATION" ? "Khám mới" : apt.type === "FOLLOW_UP" ? "Tái khám" : "Cấp cứu"}
                  </span>
                </div>
                {apt.reason && (
                  <p className="mt-2 text-sm">
                    <span className="font-medium">Lý do:</span> {apt.reason}
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Link
                  href={`/doctor/exam/${apt.id}`}
                  className={`btn-primary ${apt.status === "IN_PROGRESS" || index === 0 ? "" : "opacity-70"}`}
                >
                  {apt.status === "IN_PROGRESS" ? (
                    <>
                      <Stethoscope className="w-4 h-4" />
                      Tiếp tục khám
                    </>
                  ) : index === 0 ? (
                    <>
                      <Play className="w-4 h-4" />
                      Bắt đầu khám
                    </>
                  ) : (
                    "Khám"
                  )}
                </Link>
                <button
                  onClick={() => handleComplete(apt)}
                  className="btn-secondary"
                >
                  <CheckCircle className="w-4 h-4" />
                  Hoàn thành
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Legend */}
      {appointments.length > 0 && (
        <div className="card-base">
          <h3 className="text-label mb-3">Chú thích</h3>
          <div className="flex flex-wrap gap-4 text-sm">
            <span className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-[hsl(var(--primary))]" />
              Bệnh nhân tiếp theo
            </span>
            <span className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-amber-400" />
              Đang khám
            </span>
            <span className="flex items-center gap-2">
              <span className="badge badge-error text-xs">Ưu tiên cao</span>
              Cấp cứu / VIP
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

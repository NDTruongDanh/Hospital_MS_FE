"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Plus, 
  Search, 
  Calendar,
  Clock,
  Phone,
  MoreHorizontal,
  Edit,
  XCircle,
  CheckCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
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

export default function ReceptionistAppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [dateFilter, setDateFilter] = useState<string>(new Date().toISOString().split("T")[0]);
  const [cancelItem, setCancelItem] = useState<Appointment | null>(null);

  useEffect(() => {
    fetchAppointments();
  }, [statusFilter, dateFilter]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const response = await appointmentService.list({
        status: statusFilter as any || undefined,
      });
      // Filter by date on client side
      const filtered = response.content.filter(apt => 
        apt.appointmentTime.startsWith(dateFilter)
      );
      setAppointments(filtered);
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
      await appointmentService.cancel(cancelItem.id, { cancelReason: "Hủy bởi lễ tân" });
      toast.success("Đã hủy lịch hẹn thành công");
      setCancelItem(null);
      fetchAppointments();
    } catch (error) {
      toast.error("Không thể hủy lịch hẹn");
    }
  };

  const navigateDate = (days: number) => {
    const current = new Date(dateFilter);
    current.setDate(current.getDate() + days);
    setDateFilter(current.toISOString().split("T")[0]);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("vi-VN", { 
      weekday: "long", 
      day: "2-digit", 
      month: "2-digit", 
      year: "numeric" 
    });
  };

  const formatTime = (isoDate: string) => {
    const date = new Date(isoDate);
    return date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-display">Quản lý lịch hẹn</h1>
          <p className="text-[hsl(var(--muted-foreground))] mt-1">
            {appointments.length} lịch hẹn
          </p>
        </div>
        <Link href="/receptionist/walk-in" className="btn-primary">
          <Plus className="w-5 h-5" />
          Đặt lịch mới
        </Link>
      </div>

      {/* Date Navigation */}
      <div className="card-base">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-4">
            <button onClick={() => navigateDate(-1)} className="btn-icon">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="text-center min-w-[200px]">
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="input-base text-center font-medium"
              />
              <p className="text-small mt-1">{formatDate(dateFilter)}</p>
            </div>
            <button onClick={() => navigateDate(1)} className="btn-icon">
              <ChevronRight className="w-5 h-5" />
            </button>
            <button
              onClick={() => setDateFilter(new Date().toISOString().split("T")[0])}
              className="btn-secondary text-sm py-2"
            >
              Hôm nay
            </button>
          </div>

          <div className="flex gap-3">
            <select
              className="dropdown"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">Tất cả trạng thái</option>
              <option value="PENDING">Chờ xác nhận</option>
              <option value="CONFIRMED">Đã xác nhận</option>
              <option value="COMPLETED">Hoàn thành</option>
              <option value="CANCELLED">Đã hủy</option>
              <option value="NO_SHOW">Vắng mặt</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="table-container">
        <table className="table-base">
          <thead>
            <tr>
              <th>Bệnh nhân</th>
              <th>Giờ hẹn</th>
              <th>Bác sĩ</th>
              <th>Lý do khám</th>
              <th>Trạng thái</th>
              <th className="w-12"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="text-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto text-[hsl(var(--primary))]" />
                  <p className="text-small mt-2">Đang tải...</p>
                </td>
              </tr>
            ) : appointments.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-12">
                  <Calendar className="w-12 h-12 mx-auto text-[hsl(var(--muted-foreground))] opacity-50" />
                  <p className="text-[hsl(var(--muted-foreground))] mt-2">
                    Không có lịch hẹn nào trong ngày này
                  </p>
                </td>
              </tr>
            ) : (
              appointments.map((apt) => {
                const status = STATUS_CONFIG[apt.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.PENDING;
                const StatusIcon = status.icon;
                return (
                  <tr key={apt.id}>
                    {/* Patient */}
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="avatar">
                          {apt.patient.fullName?.charAt(0) || "?"}
                        </div>
                        <div>
                          <p className="font-medium">{apt.patient.fullName}</p>
                          {apt.patient.phoneNumber && (
                            <p className="text-small flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {apt.patient.phoneNumber}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Time */}
                    <td>
                      <div className="flex items-center gap-1 font-medium">
                        <Clock className="w-4 h-4 text-[hsl(var(--primary))]" />
                        {formatTime(apt.appointmentTime)}
                      </div>
                    </td>

                    {/* Doctor */}
                    <td>
                      <p>{apt.doctor.fullName}</p>
                      {apt.doctor.department && (
                        <p className="text-small">{apt.doctor.department}</p>
                      )}
                    </td>

                    {/* Reason */}
                    <td className="max-w-[200px] truncate">
                      {apt.reason || "-"}
                    </td>

                    {/* Status */}
                    <td>
                      <span className={`badge ${status.class}`}>
                        <StatusIcon className="w-3 h-3" />
                        {status.label}
                      </span>
                    </td>

                    {/* Actions */}
                    <td>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="btn-icon w-8 h-8">
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/receptionist/appointments/${apt.id}`}>
                              <Edit className="w-4 h-4 mr-2" />
                              Chỉnh sửa
                            </Link>
                          </DropdownMenuItem>
                          {(apt.status === "PENDING" || apt.status === "CONFIRMED") && (
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => setCancelItem(apt)}
                            >
                              <XCircle className="w-4 h-4 mr-2" />
                              Hủy lịch hẹn
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Cancel Confirmation */}
      <AlertDialog open={!!cancelItem} onOpenChange={() => setCancelItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận hủy lịch hẹn</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn hủy lịch hẹn của bệnh nhân "{cancelItem?.patient.fullName}"?
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

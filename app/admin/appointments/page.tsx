"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  SCHEDULED: { label: "Đã lên lịch", class: "badge-info", icon: Calendar },
  CONFIRMED: { label: "Đã xác nhận", class: "badge-info", icon: Calendar },
  IN_PROGRESS: { label: "Đang khám", class: "badge-primary", icon: Clock },
  COMPLETED: { label: "Hoàn thành", class: "badge-success", icon: CheckCircle },
  CANCELLED: { label: "Đã hủy", class: "badge-danger", icon: XCircle },
  NO_SHOW: { label: "Vắng mặt", class: "badge-warning", icon: XCircle },
};

const TYPE_CONFIG: Record<string, { label: string; class: string }> = {
  CONSULTATION: { label: "Khám bệnh", class: "badge-info" },
  FOLLOW_UP: { label: "Tái khám", class: "badge-secondary" },
  EMERGENCY: { label: "Cấp cứu", class: "badge-danger" },
  WALK_IN: { label: "Walk-in", class: "badge-warning" },
};

export default function AdminAppointmentsPage() {
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [allAppointments, setAllAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("");
  
  // Date range filter
  const today = new Date().toISOString().split("T")[0];
  const [dateFrom, setDateFrom] = useState<string>(today);
  const [dateTo, setDateTo] = useState<string>(today);
  const [isRangeMode, setIsRangeMode] = useState(false);
  
  // Doctor filter and patient search
  const [doctorFilter, setDoctorFilter] = useState<string>("");
  const [patientSearch, setPatientSearch] = useState<string>("");
  const [doctors, setDoctors] = useState<any[]>([]);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  const [cancelItem, setCancelItem] = useState<Appointment | null>(null);

  useEffect(() => {
    fetchDoctors();
  }, []);

  useEffect(() => {
    fetchAppointments();
  }, [statusFilter, dateFrom, dateTo]);

  useEffect(() => {
    applyFilters();
  }, [allAppointments, doctorFilter, patientSearch, currentPage, itemsPerPage]);

  const fetchDoctors = async () => {
    try {
      const response = await fetch("/api/hr/employees?role=DOCTOR&status=ACTIVE");
      const data = await response.json();
      setDoctors(data.data || []);
    } catch (error) {
      console.error("Failed to fetch doctors:", error);
    }
  };

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const response = await appointmentService.list({
        status: statusFilter as any || undefined,
      });
      // Filter by date range on client side
      const filtered = response.content.filter(apt => {
        const aptDate = apt.appointmentTime.split("T")[0];
        return aptDate >= dateFrom && aptDate <= dateTo;
      });
      setAllAppointments(filtered);
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
      await appointmentService.cancel(cancelItem.id, { cancelReason: "Hủy bởi quản trị viên" });
      toast.success("Đã hủy lịch hẹn thành công");
      setCancelItem(null);
      fetchAppointments();
    } catch (error) {
      toast.error("Không thể hủy lịch hẹn");
    }
  };

  const navigateDate = (days: number) => {
    const currentFrom = new Date(dateFrom);
    const currentTo = new Date(dateTo);
    currentFrom.setDate(currentFrom.getDate() + days);
    currentTo.setDate(currentTo.getDate() + days);
    setDateFrom(currentFrom.toISOString().split("T")[0]);
    setDateTo(currentTo.toISOString().split("T")[0]);
  };

  const setToday = () => {
    const today = new Date().toISOString().split("T")[0];
    setDateFrom(today);
    setDateTo(today);
    setIsRangeMode(false);
  };

  const setThisWeek = () => {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay() + 1); // Monday
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6); // Sunday
    setDateFrom(startOfWeek.toISOString().split("T")[0]);
    setDateTo(endOfWeek.toISOString().split("T")[0]);
    setIsRangeMode(true);
  };

  const setThisMonth = () => {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    setDateFrom(startOfMonth.toISOString().split("T")[0]);
    setDateTo(endOfMonth.toISOString().split("T")[0]);
    setIsRangeMode(true);
  };

  const applyFilters = () => {
    let filtered = [...allAppointments];

    // Doctor filter
    if (doctorFilter) {
      filtered = filtered.filter(apt => apt.doctor.id === doctorFilter);
    }

    // Patient search
    if (patientSearch.trim()) {
      const search = patientSearch.toLowerCase();
      filtered = filtered.filter(apt =>
        apt.patient.fullName?.toLowerCase().includes(search) ||
        apt.patient.phoneNumber?.includes(search)
      );
    }

    // Pagination
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    setAppointments(filtered.slice(startIndex, endIndex));
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
        <Link href="/admin/appointments/new" className="btn-primary">
          <Plus className="w-5 h-5" />
          Đặt lịch mới
        </Link>
      </div>

      {/* Date Navigation */}
      <div className="card-base">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-4 flex-wrap">
            <button onClick={() => navigateDate(-1)} className="btn-icon">
              <ChevronLeft className="w-5 h-5" />
            </button>
            
            {/* Date Range Picker */}
            <div className="flex items-center gap-2">
              <div className="text-center">
                <label className="text-xs text-gray-500 block mb-1">Từ ngày</label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => {
                    setDateFrom(e.target.value);
                    if (e.target.value > dateTo) setDateTo(e.target.value);
                    setIsRangeMode(e.target.value !== dateTo);
                  }}
                  className="input-base text-center font-medium text-sm"
                />
              </div>
              <span className="text-gray-400 mt-4">→</span>
              <div className="text-center">
                <label className="text-xs text-gray-500 block mb-1">Đến ngày</label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => {
                    setDateTo(e.target.value);
                    if (e.target.value < dateFrom) setDateFrom(e.target.value);
                    setIsRangeMode(e.target.value !== dateFrom);
                  }}
                  className="input-base text-center font-medium text-sm"
                />
              </div>
            </div>
            
            <button onClick={() => navigateDate(1)} className="btn-icon">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Select Buttons */}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={setToday}
              className={`btn-secondary text-sm py-2 ${!isRangeMode && dateFrom === today ? 'bg-blue-100 border-blue-300' : ''}`}
            >
              Hôm nay
            </button>
            <button
              onClick={setThisWeek}
              className="btn-secondary text-sm py-2"
            >
              Tuần này
            </button>
            <button
              onClick={setThisMonth}
              className="btn-secondary text-sm py-2"
            >
              Tháng này
            </button>
          </div>

          {/* Filters */}
          <div className="flex gap-3 flex-wrap">
            {/* Patient Search */}
            <input
              type="text"
              placeholder="Tìm bệnh nhân..."
              value={patientSearch}
              onChange={(e) => {
                setPatientSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="input-base w-48"
            />

            {/* Doctor Filter */}
            <select
              className="dropdown"
              value={doctorFilter}
              onChange={(e) => {
                setDoctorFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="">Tất cả bác sĩ</option>
              {doctors.map((doctor) => (
                <option key={doctor.id} value={doctor.id}>
                  BS. {doctor.fullName}
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              className="dropdown"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">Tất cả trạng thái</option>
            <option value="PENDING">Chờ xác nhận</option>
            <option value="SCHEDULED">Đã lên lịch</option>
            <option value="CONFIRMED">Đã xác nhận</option>
            <option value="COMPLETED">Hoàn thành</option>
            <option value="CANCELLED">Đã hủy</option>
            <option value="NO_SHOW">Vắng mặt</option>
          </select>
          </div>
        </div>
        
        {/* Show date range info */}
        {isRangeMode && (
          <p className="text-sm text-gray-500 mt-2">
            Đang xem từ <span className="font-medium">{formatDate(dateFrom)}</span> đến <span className="font-medium">{formatDate(dateTo)}</span>
          </p>
        )}
      </div>

      {/* Table */}
      <div className="table-container">
        <table className="table-base">
          <thead>
            <tr>
              <th>Bệnh nhân</th>
              <th>Giờ hẹn</th>
              <th>Bác sĩ</th>
              <th>Loại khám</th>
              <th>Lý do khám</th>
              <th>Trạng thái</th>
              <th className="w-12"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="text-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto text-[hsl(var(--primary))]" />
                  <p className="text-small mt-2">Đang tải...</p>
                </td>
              </tr>
            ) : appointments.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-12">
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
                  <tr 
                    key={apt.id}
                    onClick={() => router.push(`/admin/appointments/${apt.id}`)}
                    className="cursor-pointer hover:bg-[hsl(var(--secondary))] transition-colors"
                  >
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

                    {/* Type */}
                    <td>
                      <span className={`badge ${TYPE_CONFIG[apt.type]?.class || 'badge-secondary'}`}>
                        {TYPE_CONFIG[apt.type]?.label || apt.type}
                      </span>
                    </td>

                    {/* Reason */}
                    <td className="max-w-[150px] truncate">
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
                    <td onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="btn-icon w-8 h-8">
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/appointments/${apt.id}`}>
                              <Edit className="w-4 h-4 mr-2" />
                              Xem chi tiết
                            </Link>
                          </DropdownMenuItem>
                          {(apt.status === "PENDING" || apt.status === "CONFIRMED" || apt.status === "SCHEDULED") && (
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

      {/* Pagination */}
      {allAppointments.length > 0 && (
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">
              Hiển thị {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, allAppointments.length)} / {allAppointments.length}
            </span>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="input-base py-1 text-sm"
            >
              <option value={10}>10 / trang</option>
              <option value={20}>20 / trang</option>
              <option value={50}>50 / trang</option>
            </select>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="btn-icon disabled:opacity-50"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-4 py-2 text-sm font-medium">
              Trang {currentPage} / {Math.ceil(allAppointments.length / itemsPerPage)}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(Math.ceil(allAppointments.length / itemsPerPage), p + 1))}
              disabled={currentPage >= Math.ceil(allAppointments.length / itemsPerPage)}
              className="btn-icon disabled:opacity-50"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

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

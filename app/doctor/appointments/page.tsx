"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Calendar,
  Clock,
  User,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Filter,
  TrendingUp,
  Activity,
} from "lucide-react";
import { toast } from "sonner";
import { appointmentService, Appointment } from "@/services/appointment.service";

const STATUS_CONFIG: Record<string, { label: string; class: string; icon: typeof Clock; gradient: string }> = {
  SCHEDULED: { 
    label: "Đã lên lịch", 
    class: "badge-info", 
    icon: Clock,
    gradient: "from-blue-400 to-cyan-500"
  },
  IN_PROGRESS: { 
    label: "Đang khám", 
    class: "badge-primary", 
    icon: Activity,
    gradient: "from-purple-400 to-indigo-500"
  },
  COMPLETED: { 
    label: "Hoàn thành", 
    class: "badge-success", 
    icon: CheckCircle,
    gradient: "from-green-400 to-emerald-500"
  },
  CANCELLED: { 
    label: "Đã hủy", 
    class: "badge-danger", 
    icon: XCircle,
    gradient: "from-red-400 to-rose-500"
  },
  NO_SHOW: { 
    label: "Vắng mặt", 
    class: "badge-warning", 
    icon: AlertCircle,
    gradient: "from-amber-400 to-orange-500"
  },
};

export default function DoctorAppointmentsPage() {
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [viewMode, setViewMode] = useState<"today" | "week" | "calendar">("today");
  
  const today = new Date().toISOString().split("T")[0];
  const [selectedDate, setSelectedDate] = useState(today);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    fetchAppointments();
  }, [statusFilter, selectedDate, viewMode]);

  const fetchAppointments = async () => {
    try {
      setLoading(loading);
      // TODO: Get current doctor ID from session
      const doctorId = "current-doctor-id"; // Replace with actual
      
      const response = await appointmentService.list({
        doctorId,
        status: statusFilter as any || undefined,
      });
      
      // Filter by date based on view mode
      const filtered = response.content.filter(apt => {
        const aptDate = apt.appointmentTime.split("T")[0];
        if (viewMode === "today") {
          return aptDate === selectedDate;
        } else {
          // Week view logic
          const weekStart = new Date(selectedDate);
          weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1);
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekStart.getDate() + 6);
          const aptDateObj = new Date(aptDate);
          return aptDateObj >= weekStart && aptDateObj <= weekEnd;
        }
      });
      
      setAppointments(filtered.sort((a, b) => 
        a.appointmentTime.localeCompare(b.appointmentTime)
      ));
    } catch (error) {
      console.error("Failed to fetch appointments:", error);
      toast.error("Không thể tải danh sách lịch hẹn");
    } finally {
      setLoading(false);
    }
  };

  const navigateDate = (days: number) => {
    const current = new Date(selectedDate);
    current.setDate(current.getDate() + days);
    setSelectedDate(current.toISOString().split("T")[0]);
  };

  const formatTime = (isoDate: string) => {
    return new Date(isoDate).toLocaleTimeString("vi-VN", { 
      hour: "2-digit", 
      minute: "2-digit" 
    });
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("vi-VN", {
      weekday: "long",
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    });
  };

  // Statistics
  const stats = {
    total: appointments.length,
    scheduled: appointments.filter(a => a.status === "SCHEDULED").length,
    completed: appointments.filter(a => a.status === "COMPLETED").length,
    cancelled: appointments.filter(a => a.status === "CANCELLED").length,
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Background gradient */}
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-blue-50 via-indigo-50/30 to-purple-50/40" />
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-display flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            Lịch Hẹn Của Tôi
          </h1>
          <p className="text-[hsl(var(--muted-foreground))] mt-2">
            {formatDate(selectedDate)}
          </p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="backdrop-blur-lg bg-white/70 border border-white/50 rounded-2xl p-5 shadow-xl hover:shadow-2xl transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Tổng số</p>
              <p className="text-3xl font-bold text-gray-800 mt-1">{stats.total}</p>
            </div>
            <div className="p-3 rounded-xl bg-gradient-to-br from-blue-400 to-cyan-500 shadow-lg">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="backdrop-blur-lg bg-white/70 border border-white/50 rounded-2xl p-5 shadow-xl hover:shadow-2xl transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Chờ khám</p>
              <p className="text-3xl font-bold text-blue-600 mt-1">{stats.scheduled}</p>
            </div>
            <div className="p-3 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-500 shadow-lg">
              <Clock className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="backdrop-blur-lg bg-white/70 border border-white/50 rounded-2xl p-5 shadow-xl hover:shadow-2xl transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Hoàn thành</p>
              <p className="text-3xl font-bold text-green-600 mt-1">{stats.completed}</p>
            </div>
            <div className="p-3 rounded-xl bg-gradient-to-br from-green-400 to-emerald-500 shadow-lg">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="backdrop-blur-lg bg-white/70 border border-white/50 rounded-2xl p-5 shadow-xl hover:shadow-2xl transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Đã hủy</p>
              <p className="text-3xl font-bold text-red-600 mt-1">{stats.cancelled}</p>
            </div>
            <div className="p-3 rounded-xl bg-gradient-to-br from-red-400 to-rose-500 shadow-lg">
              <XCircle className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="backdrop-blur-lg bg-white/70 border border-white/50 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Date Navigation */}
          <div className="flex items-center gap-3">
            <button onClick={() => navigateDate(-1)} className="btn-icon">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="input-base text-center font-medium"
            />
            <button onClick={() => navigateDate(1)} className="btn-icon">
              <ChevronRight className="w-5 h-5" />
            </button>
            <button
              onClick={() => setSelectedDate(today)}
              className="btn-secondary text-sm"
            >
              Hôm nay
            </button>
          </div>

          {/* View Mode & Status Filter */}
          <div className="flex gap-3">
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode("today")}
                className={`px-4 py-2 rounded-xl font-medium transition-all ${
                  viewMode === "today"
                    ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg"
                    : "bg-white/60 text-gray-700 hover:bg-white/80"
                }`}
              >
                Hôm nay
              </button>
              <button
                onClick={() => setViewMode("week")}
                className={`px-4 py-2 rounded-xl font-medium transition-all ${
                  viewMode === "week"
                    ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg"
                    : "bg-white/60 text-gray-700 hover:bg-white/80"
                }`}
              >
                Tuần này
              </button>
              <button
                onClick={() => setViewMode("calendar")}
                className={`px-4 py-2 rounded-xl font-medium transition-all ${
                  viewMode === "calendar"
                    ? "bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-lg"
                    : "bg-white/60 text-gray-700 hover:bg-white/80"
                }`}
              >
                📅 Lịch
              </button>
            </div>

            <select
              className="dropdown"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">Tất cả trạng thái</option>
              <option value="SCHEDULED">Đã lên lịch</option>
              <option value="IN_PROGRESS">Đang khám</option>
              <option value="COMPLETED">Hoàn thành</option>
              <option value="CANCELLED">Đã hủy</option>
            </select>
          </div>
        </div>
      </div>

      {/* Calendar View */}
      {viewMode === "calendar" ? (
        <CalendarView 
          appointments={appointments}
          currentMonth={currentMonth}
          setCurrentMonth={setCurrentMonth}
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
          loading={loading}
        />
      ) : (
        /* Appointments List */
        <div className="backdrop-blur-lg bg-white/70 border border-white/50 rounded-2xl p-6 shadow-xl">
          <h3 className="text-section mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-600" />
            Danh sách lịch hẹn
          </h3>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-500 mt-4">Đang tải...</p>
            </div>
          ) : appointments.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">Không có lịch hẹn nào</p>
            </div>
          ) : (
            <div className="space-y-3">
              {appointments.map((appointment) => {
                const status = STATUS_CONFIG[appointment.status] || STATUS_CONFIG.SCHEDULED;
                const StatusIcon = status.icon;
                
                return (
                  <Link
                    key={appointment.id}
                    href={`/doctor/appointments/${appointment.id}`}
                    className="block p-5 rounded-xl bg-gradient-to-r from-white/80 to-white/60 backdrop-blur border border-white/50 hover:shadow-lg transition-all group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        {/* Time */}
                        <div className={`px-4 py-3 rounded-xl bg-gradient-to-br ${status.gradient} shadow-lg`}>
                          <Clock className="w-5 h-5 text-white mb-1" />
                          <p className="text-white font-bold text-lg">{formatTime(appointment.appointmentTime)}</p>
                        </div>

                        {/* Patient Info */}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <User className="w-4 h-4 text-gray-500" />
                            <p className="font-semibold text-gray-800">{appointment.patient.fullName}</p>
                          </div>
                          <p className="text-sm text-gray-600">{appointment.reason}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className={`badge ${status.class} text-xs`}>
                              <StatusIcon className="w-3 h-3" />
                              {status.label}
                            </span>
                            {appointment.type && (
                              <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700">
                                {appointment.type === "CONSULTATION" ? "Khám bệnh" :
                                 appointment.type === "FOLLOW_UP" ? "Tái khám" : "Cấp cứu"}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Arrow */}
                        <div className="text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all">
                          →
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Calendar View Component
interface CalendarViewProps {
  appointments: Appointment[];
  currentMonth: Date;
  setCurrentMonth: (date: Date) => void;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  loading: boolean;
}

function CalendarView({ appointments, currentMonth, setCurrentMonth, selectedDate, setSelectedDate, loading }: CalendarViewProps) {
  const monthNames = ["Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6",
    "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"];
  const dayNames = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

  const navigateMonth = (direction: number) => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(currentMonth.getMonth() + direction);
    setCurrentMonth(newMonth);
  };

  // Generate calendar days
  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Previous month days
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push({ date: null, isCurrentMonth: false });
    }
    
    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      days.push({ date: dateStr, isCurrentMonth: true });
    }
    
    return days;
  };

  const calendarDays = generateCalendarDays();
  
  // Get appointments for a specific date
  const getAppointmentsForDate = (dateStr: string) => {
    return appointments.filter(apt => apt.appointmentTime.split('T')[0] === dateStr);
  };

  // Get appointments for selected date
  const selectedDateAppointments = selectedDate ? getAppointmentsForDate(selectedDate) : [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Calendar Grid */}
      <div className="lg:col-span-2 backdrop-blur-lg bg-white/70 border border-white/50 rounded-2xl p-6 shadow-xl">
        {/* Month Navigation */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigateMonth(-1)}
            className="p-2 rounded-xl bg-white/60 hover:bg-white/80 transition-all"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h3 className="text-xl font-bold text-gray-800">
            {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </h3>
          <button
            onClick={() => navigateMonth(1)}
            className="p-2 rounded-xl bg-white/60 hover:bg-white/80 transition-all"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Day Headers */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {dayNames.map((day) => (
            <div key={day} className="text-center text-sm font-semibold text-gray-600 py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7 gap-2">
          {calendarDays.map((day, idx) => {
            if (!day.date) {
              return <div key={idx} className="aspect-square" />;
            }

            const dayAppointments = getAppointmentsForDate(day.date);
            const isSelected = day.date === selectedDate;
            const isToday = day.date === new Date().toISOString().split('T')[0];
            const hasAppointments = dayAppointments.length > 0;

            return (
              <button
                key={idx}
                onClick={() => setSelectedDate(day.date!)}
                className={`aspect-square p-2 rounded-xl transition-all relative ${
                  isSelected
                    ? "bg-gradient-to-br from-purple-500 to-pink-600 text-white shadow-lg scale-110"
                    : isToday
                    ? "bg-gradient-to-br from-blue-100 to-cyan-100 border-2 border-blue-400 text-blue-800"
                    : hasAppointments
                    ? "bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 hover:shadow-md"
                    : "bg-white/40 hover:bg-white/60"
                }`}
              >
                <div className="text-sm font-semibold">
                  {parseInt(day.date.split('-')[2])}
                </div>
                {hasAppointments && (
                  <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 flex gap-0.5">
                    {dayAppointments.slice(0, 3).map((_, i) => (
                      <div
                        key={i}
                        className={`w-1 h-1 rounded-full ${
                          isSelected ? "bg-white" : "bg-blue-500"
                        }`}
                      />
                    ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Date Appointments */}
      <div className="backdrop-blur-lg bg-white/70 border border-white/50 rounded-2xl p-6 shadow-xl">
        <h3 className="text-lg font-bold text-gray-800 mb-4">
          {selectedDate ? (
            <>
              📅 {new Date(selectedDate).toLocaleDateString("vi-VN", {
                weekday: "long",
                day: "2-digit",
                month: "2-digit",
              })}
            </>
          ) : (
            "Chọn ngày"
          )}
        </h3>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
          </div>
        ) : selectedDateAppointments.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="w-12 h-12 mx-auto text-gray-300 mb-2" />
            <p className="text-sm text-gray-500">Không có lịch hẹn</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[500px] overflow-y-auto">
            {selectedDateAppointments.map((apt) => {
              const status = STATUS_CONFIG[apt.status] || STATUS_CONFIG.SCHEDULED;
              const StatusIcon = status.icon;
              const time = new Date(apt.appointmentTime).toLocaleTimeString("vi-VN", {
                hour: "2-digit",
                minute: "2-digit",
              });

              return (
                <Link
                  key={apt.id}
                  href={`/doctor/appointments/${apt.id}`}
                  className="block p-4 rounded-xl bg-gradient-to-r from-white/80 to-white/60 border border-white/50 hover:shadow-lg transition-all"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`px-3 py-2 rounded-lg bg-gradient-to-br ${status.gradient} shadow-md`}>
                      <Clock className="w-4 h-4 text-white mb-0.5" />
                      <p className="text-white font-bold text-sm">{time}</p>
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-800 text-sm">{apt.patient.fullName}</p>
                      <span className={`badge ${status.class} text-xs mt-1`}>
                        <StatusIcon className="w-3 h-3" />
                        {status.label}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 line-clamp-2">{apt.reason}</p>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

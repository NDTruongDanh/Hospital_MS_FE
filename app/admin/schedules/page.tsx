"use client";

import { useState, useEffect } from "react";
import { 
  Plus, 
  ChevronLeft, 
  ChevronRight,
  Edit, 
  Trash2, 
  MoreHorizontal,
  Calendar,
  Clock,
  User,
  Loader2,
  Filter,
} from "lucide-react";
import { toast } from "sonner";
import { hrService } from "@/services/hr.service";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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

// Schedule interface matching backend ScheduleResponse DTO
interface Schedule {
  id: string;
  employeeId: string;
  employeeName?: string;
  workDate: string; // YYYY-MM-DD (LocalDate)
  startTime: string; // HH:mm (LocalTime)
  endTime: string; // HH:mm (LocalTime)
  status: "AVAILABLE" | "BOOKED" | "CANCELLED";
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

const DAYS_OF_WEEK = [
  { value: "MONDAY", label: "Thứ 2" },
  { value: "TUESDAY", label: "Thứ 3" },
  { value: "WEDNESDAY", label: "Thứ 4" },
  { value: "THURSDAY", label: "Thứ 5" },
  { value: "FRIDAY", label: "Thứ 6" },
  { value: "SATURDAY", label: "Thứ 7" },
  { value: "SUNDAY", label: "CN" },
];

const SHIFT_TYPES = [
  { value: "MORNING", label: "Ca sáng", time: "07:00 - 12:00", color: "bg-blue-100 text-blue-700" },
  { value: "AFTERNOON", label: "Ca chiều", time: "12:00 - 17:00", color: "bg-orange-100 text-orange-700" },
  { value: "EVENING", label: "Ca tối", time: "17:00 - 22:00", color: "bg-purple-100 text-purple-700" },
  { value: "NIGHT", label: "Ca đêm", time: "22:00 - 07:00", color: "bg-gray-100 text-gray-700" },
];

export default function SchedulesPage() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [employees, setEmployees] = useState<{ id: string; fullName: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [selectedEmployee, setSelectedEmployee] = useState<string>("");
  
  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  const [deleteSchedule, setDeleteSchedule] = useState<Schedule | null>(null);
  const [prefilledDay, setPrefilledDay] = useState<string>("");

  // Fetch data
  useEffect(() => {
    fetchSchedules();
    fetchEmployees();
  }, [currentWeek, selectedEmployee]);

  const fetchSchedules = async () => {
    try {
      setLoading(true);
      const response = await hrService.getSchedules({
        employeeId: selectedEmployee || undefined,
      });
      // Map to include employeeName from nested employee object
      const mappedSchedules = (response.content || []).map((s: any) => ({
        ...s,
        employeeName: s.employee?.fullName || s.employeeName,
      }));
      setSchedules(mappedSchedules);
    } catch (error) {
      console.error("Failed to fetch schedules:", error);
      // Use mock data for demo
      setSchedules([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await hrService.getEmployees();
      setEmployees(
        (response.content || []).map((e: any) => ({
          id: e.id,
          fullName: e.fullName,
        }))
      );
    } catch (error) {
      console.error("Failed to fetch employees:", error);
    }
  };

  const handleDelete = async () => {
    if (!deleteSchedule) return;
    
    try {
      await hrService.deleteSchedule(deleteSchedule.id);
      toast.success("Đã xóa lịch làm việc thành công");
      setDeleteSchedule(null);
      fetchSchedules();
    } catch (error) {
      toast.error("Không thể xóa lịch làm việc");
    }
  };

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    setEditingSchedule(null);
    setPrefilledDay("");
    fetchSchedules();
  };

  const openCreateModal = (day?: string) => {
    setEditingSchedule(null);
    setPrefilledDay(day || "");
    setIsFormOpen(true);
  };

  // Get week dates
  const getWeekDates = () => {
    const startOfWeek = new Date(currentWeek);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
    startOfWeek.setDate(diff);
    
    return DAYS_OF_WEEK.map((_, index) => {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + index);
      return date;
    });
  };

  const weekDates = getWeekDates();

  // Get schedules for a specific date by comparing workDate
  const getSchedulesForDate = (date: Date) => {
    const dateStr = date.toISOString().split("T")[0]; // YYYY-MM-DD
    return schedules.filter((s) => s.workDate === dateStr);
  };

  // Get style based on schedule status
  const getStatusStyle = (status: string) => {
    switch (status) {
      case "AVAILABLE": return "bg-green-100 text-green-700";
      case "BOOKED": return "bg-blue-100 text-blue-700";
      case "CANCELLED": return "bg-gray-100 text-gray-500";
      default: return "bg-gray-100";
    }
  };

  const navigateWeek = (direction: number) => {
    const newDate = new Date(currentWeek);
    newDate.setDate(newDate.getDate() + direction * 7);
    setCurrentWeek(newDate);
  };

  const formatDateRange = () => {
    const start = weekDates[0];
    const end = weekDates[6];
    const formatOptions: Intl.DateTimeFormatOptions = { day: "2-digit", month: "2-digit" };
    return `${start.toLocaleDateString("vi-VN", formatOptions)} - ${end.toLocaleDateString("vi-VN", formatOptions)}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-display">Lịch làm việc</h1>
          <p className="text-[hsl(var(--muted-foreground))] mt-1">
            Quản lý ca làm việc của nhân viên
          </p>
        </div>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <button className="btn-primary" onClick={() => openCreateModal()}>
              <Plus className="w-5 h-5" />
              Thêm lịch
            </button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingSchedule ? "Chỉnh sửa lịch làm việc" : "Thêm lịch làm việc"}
              </DialogTitle>
            </DialogHeader>
            <ScheduleForm
              schedule={editingSchedule}
              employees={employees}
              prefilledDay={prefilledDay}
              onSuccess={handleFormSuccess}
              onCancel={() => setIsFormOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Week Navigation & Filters */}
      <div className="card-base">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Week Navigation */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigateWeek(-1)}
              className="btn-icon"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="text-center min-w-[180px]">
              <p className="text-lg font-semibold">{formatDateRange()}</p>
              <p className="text-small">
                Tuần {Math.ceil((weekDates[0].getDate() + new Date(weekDates[0].getFullYear(), weekDates[0].getMonth(), 1).getDay()) / 7)}
              </p>
            </div>
            <button
              onClick={() => navigateWeek(1)}
              className="btn-icon"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            <button
              onClick={() => setCurrentWeek(new Date())}
              className="btn-secondary text-sm py-2"
            >
              Hôm nay
            </button>
          </div>

          {/* Employee Filter */}
          <div className="flex items-center gap-3">
            <Filter className="w-4 h-4 text-[hsl(var(--muted-foreground))]" />
            <select
              className="dropdown min-w-[200px]"
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
            >
              <option value="">Tất cả nhân viên</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.fullName}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-[hsl(var(--primary))]" />
        </div>
      ) : (
        <div className="grid grid-cols-7 gap-2">
          {/* Headers */}
          {DAYS_OF_WEEK.map((day, index) => {
            const date = weekDates[index];
            const isToday = date.toDateString() === new Date().toDateString();
            
            return (
              <div
                key={day.value}
                className={`text-center p-3 rounded-t-xl ${
                  isToday ? "bg-[hsl(var(--primary))] text-white" : "bg-[hsl(var(--secondary))]"
                }`}
              >
                <p className="font-semibold">{day.label}</p>
                <p className={`text-sm ${isToday ? "text-white/80" : "text-[hsl(var(--muted-foreground))]"}`}>
                  {date.getDate()}/{date.getMonth() + 1}
                </p>
              </div>
            );
          })}

          {/* Day Cells */}
          {DAYS_OF_WEEK.map((day, index) => {
            const date = weekDates[index];
            const daySchedules = getSchedulesForDate(date);
            
            return (
              <div
                key={`cell-${day.value}`}
                className="min-h-[200px] bg-white rounded-b-xl border border-[hsl(var(--border))] p-2"
              >
                <div className="space-y-2">
                  {daySchedules.map((schedule) => (
                    <div
                      key={schedule.id}
                      className={`p-2 rounded-lg text-xs ${getStatusStyle(schedule.status)} group relative`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium">{schedule.employeeName || "Nhân viên"}</p>
                          <p className="opacity-80">
                            {schedule.startTime} - {schedule.endTime}
                          </p>
                          {schedule.notes && (
                            <p className="opacity-60 text-[10px]">{schedule.notes}</p>
                          )}
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-black/10 rounded">
                              <MoreHorizontal className="w-3 h-3" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => {
                                setEditingSchedule(schedule);
                                setIsFormOpen(true);
                              }}
                            >
                              <Edit className="w-4 h-4 mr-2" />
                              Sửa
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => setDeleteSchedule(schedule)}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Xóa
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}

                  {/* Add Button */}
                  <button
                    onClick={() => openCreateModal(day.value)}
                    className="w-full py-1.5 border-2 border-dashed border-[hsl(var(--border))] rounded-lg text-[hsl(var(--muted-foreground))] hover:border-[hsl(var(--primary))] hover:text-[hsl(var(--primary))] transition-colors text-xs"
                  >
                    + Thêm ca
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Status Legend */}
      <div className="card-base">
        <p className="text-card-title mb-3">Chú thích trạng thái</p>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-green-100" />
            <span className="text-sm">Có thể đặt lịch</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-blue-100" />
            <span className="text-sm">Đã đặt</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-gray-100" />
            <span className="text-sm">Đã hủy</span>
          </div>
        </div>
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteSchedule} onOpenChange={() => setDeleteSchedule(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa lịch làm việc</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa lịch làm việc này? Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Schedule Form Component
interface ScheduleFormProps {
  schedule: Schedule | null;
  employees: { id: string; fullName: string }[];
  prefilledDay: string;
  onSuccess: () => void;
  onCancel: () => void;
}

function ScheduleForm({ schedule, employees, prefilledDay, onSuccess, onCancel }: ScheduleFormProps) {
  const [loading, setLoading] = useState(false);
  
  // Calculate default workDate based on prefilledDay
  const getDefaultWorkDate = () => {
    if (!prefilledDay) return "";
    const today = new Date();
    const currentDay = today.getDay(); // 0 = Sunday, 1 = Monday...
    const dayMap: Record<string, number> = {
      MONDAY: 1, TUESDAY: 2, WEDNESDAY: 3, THURSDAY: 4,
      FRIDAY: 5, SATURDAY: 6, SUNDAY: 0
    };
    const targetDay = dayMap[prefilledDay] ?? 1;
    const diff = targetDay - currentDay;
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + diff);
    return targetDate.toISOString().split("T")[0];
  };

  // Form state matching backend ScheduleRequest DTO exactly
  const [formData, setFormData] = useState({
    employeeId: schedule?.employeeId || "",
    workDate: schedule?.workDate || getDefaultWorkDate(), // YYYY-MM-DD format
    startTime: schedule?.startTime || "07:00", // HH:mm format
    endTime: schedule?.endTime || "12:00", // HH:mm format
    status: "AVAILABLE" as "AVAILABLE" | "BOOKED" | "CANCELLED",
    notes: "",
  });

  // Shift presets for convenience (no overnight - backend requires startTime < endTime)
  const SHIFT_PRESETS = [
    { label: "Ca sáng", start: "07:00", end: "12:00" },
    { label: "Ca chiều", start: "12:00", end: "17:00" },
    { label: "Ca tối", start: "17:00", end: "22:00" },
    // Note: Overnight shifts (Ca đêm 22:00-07:00) not supported - backend requires startTime < endTime
  ];

  const applyShiftPreset = (preset: typeof SHIFT_PRESETS[0]) => {
    setFormData(prev => ({
      ...prev,
      startTime: preset.start,
      endTime: preset.end,
    }));
  };

  // Check if times are valid (start < end)
  const isTimeValid = () => {
    if (!formData.startTime || !formData.endTime) return true;
    return formData.startTime < formData.endTime;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.employeeId || !formData.workDate || !formData.startTime || !formData.endTime) {
      toast.error("Vui lòng điền đầy đủ thông tin bắt buộc");
      return;
    }

    // Validate startTime < endTime
    if (formData.startTime >= formData.endTime) {
      toast.error("Giờ kết thúc phải sau giờ bắt đầu. Ca đêm qua ngày hiện chưa được hỗ trợ.");
      return;
    }

    setLoading(true);

    try {
      // Send data matching ScheduleRequest DTO
      const payload = {
        employeeId: formData.employeeId,
        workDate: formData.workDate, // YYYY-MM-DD
        startTime: formData.startTime, // HH:mm
        endTime: formData.endTime, // HH:mm
        status: formData.status,
        notes: formData.notes || undefined,
      };
      
      console.log("Submitting schedule:", payload);
      
      if (schedule) {
        await hrService.updateSchedule(schedule.id, payload);
        toast.success("Đã cập nhật lịch làm việc");
      } else {
        await hrService.createSchedule(payload);
        toast.success("Đã thêm lịch làm việc mới");
      }
      onSuccess();
    } catch (error: any) {
      console.error("Schedule error:", error);
      const message = error?.response?.data?.message || "Có lỗi xảy ra";
      toast.error(schedule ? `Không thể cập nhật: ${message}` : `Không thể thêm: ${message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Employee */}
      <div className="space-y-2">
        <label className="text-label">Nhân viên *</label>
        <select
          className="input-base"
          value={formData.employeeId}
          onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
          required
        >
          <option value="">Chọn nhân viên</option>
          {employees.map((emp) => (
            <option key={emp.id} value={emp.id}>
              {emp.fullName}
            </option>
          ))}
        </select>
      </div>

      {/* Work Date */}
      <div className="space-y-2">
        <label className="text-label">Ngày làm việc *</label>
        <input
          type="date"
          className="input-base"
          value={formData.workDate}
          onChange={(e) => setFormData({ ...formData, workDate: e.target.value })}
          required
        />
      </div>

      {/* Shift Presets */}
      <div className="space-y-2">
        <label className="text-label">Chọn nhanh ca làm</label>
        <div className="flex flex-wrap gap-2">
          {SHIFT_PRESETS.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => applyShiftPreset(preset)}
              className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                formData.startTime === preset.start && formData.endTime === preset.end
                  ? "bg-[hsl(var(--primary))] text-white border-[hsl(var(--primary))]"
                  : "border-[hsl(var(--border))] hover:border-[hsl(var(--primary))]"
              }`}
            >
              {preset.label} ({preset.start} - {preset.end})
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Start Time */}
        <div className="space-y-2">
          <label className="text-label">Giờ bắt đầu *</label>
          <input
            type="time"
            className={`input-base ${!isTimeValid() ? "border-red-500" : ""}`}
            value={formData.startTime}
            onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
            required
          />
        </div>

        {/* End Time */}
        <div className="space-y-2">
          <label className="text-label">Giờ kết thúc *</label>
          <input
            type="time"
            className={`input-base ${!isTimeValid() ? "border-red-500" : ""}`}
            value={formData.endTime}
            onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
            required
          />
        </div>
      </div>

      {/* Time Validation Warning */}
      {!isTimeValid() && (
        <div className="text-sm text-red-600 bg-red-50 p-2 rounded-lg">
          ⚠️ Giờ kết thúc phải sau giờ bắt đầu. Ca đêm qua ngày hiện chưa được hỗ trợ.
        </div>
      )}

      {/* Status */}
      <div className="space-y-2">
        <label className="text-label">Trạng thái</label>
        <select
          className="input-base"
          value={formData.status}
          onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
        >
          <option value="AVAILABLE">Có thể đặt lịch</option>
          <option value="BOOKED">Đã đặt</option>
          <option value="CANCELLED">Đã hủy</option>
        </select>
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <label className="text-label">Ghi chú (tùy chọn)</label>
        <textarea
          className="input-base min-h-[60px] resize-none"
          placeholder="Ghi chú thêm..."
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
        />
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t border-[hsl(var(--border))]">
        <button type="button" onClick={onCancel} className="btn-secondary">
          Hủy
        </button>
        <button type="submit" disabled={loading} className="btn-primary">
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {schedule ? "Cập nhật" : "Thêm mới"}
        </button>
      </div>
    </form>
  );
}

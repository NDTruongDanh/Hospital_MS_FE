"use client";

// Calendar types and interfaces

export type CalendarViewMode = "month" | "week" | "day";

export type EventType = "appointment" | "billing" | "lab" | "schedule";

export interface CalendarEvent {
  id: string;
  type: EventType;
  date: Date;
  time?: string;
  endTime?: string;
  title: string;
  subtitle?: string;
  status: string;
  color: string;
  icon?: string;
  data?: Record<string, unknown>; // Original data from API
}

export interface DayEvents {
  date: Date;
  events: CalendarEvent[];
  isToday: boolean;
  isCurrentMonth: boolean;
}

export interface CalendarProps {
  activeTab: EventType;
  onTabChange: (tab: EventType) => void;
  events: CalendarEvent[];
  loading?: boolean;
  onEventClick?: (event: CalendarEvent) => void;
  onDateClick?: (date: Date) => void;
  onAddClick?: (date?: Date) => void;
}

// Color mapping for event types
export const EVENT_COLORS: Record<EventType, { bg: string; text: string; border: string; dot: string }> = {
  appointment: {
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
    dot: "bg-blue-500",
  },
  billing: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    dot: "bg-emerald-500",
  },
  lab: {
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    dot: "bg-amber-500",
  },
  schedule: {
    bg: "bg-purple-50",
    text: "text-purple-700",
    border: "border-purple-200",
    dot: "bg-purple-500",
  },
};

// Status badges for events
export const STATUS_BADGES: Record<string, { label: string; class: string }> = {
  // Appointments
  SCHEDULED: { label: "Đã lên lịch", class: "badge-info" },
  CONFIRMED: { label: "Đã xác nhận", class: "badge-success" },
  COMPLETED: { label: "Hoàn thành", class: "badge-success" },
  CANCELLED: { label: "Đã hủy", class: "badge-danger" },
  NO_SHOW: { label: "Vắng mặt", class: "badge-danger" },
  // Billing
  PAID: { label: "Đã thanh toán", class: "badge-success" },
  UNPAID: { label: "Chờ thanh toán", class: "badge-warning" },
  PARTIALLY_PAID: { label: "Thanh toán một phần", class: "badge-info" },
  OVERDUE: { label: "Quá hạn", class: "badge-danger" },
  // Lab
  PENDING: { label: "Chờ xử lý", class: "badge-warning" },
  IN_PROGRESS: { label: "Đang xử lý", class: "badge-info" },
  READY: { label: "Có kết quả", class: "badge-success" },
};

// Helper functions
export function getMonthDays(year: number, month: number): DayEvents[] {
  const result: DayEvents[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // First day of month
  const firstDay = new Date(year, month, 1);
  // Last day of month
  const lastDay = new Date(year, month + 1, 0);
  
  // Start from Monday of the week containing first day
  const startOffset = (firstDay.getDay() + 6) % 7; // Convert Sunday=0 to Monday=0
  const startDate = new Date(firstDay);
  startDate.setDate(startDate.getDate() - startOffset);
  
  // Generate 6 weeks (42 days)
  for (let i = 0; i < 42; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    date.setHours(0, 0, 0, 0);
    
    result.push({
      date,
      events: [],
      isToday: date.getTime() === today.getTime(),
      isCurrentMonth: date.getMonth() === month,
    });
  }
  
  return result;
}

export function getWeekDays(date: Date): DayEvents[] {
  const result: DayEvents[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Find Monday of the week
  const dayOfWeek = (date.getDay() + 6) % 7;
  const monday = new Date(date);
  monday.setDate(date.getDate() - dayOfWeek);
  
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    d.setHours(0, 0, 0, 0);
    
    result.push({
      date: d,
      events: [],
      isToday: d.getTime() === today.getTime(),
      isCurrentMonth: true,
    });
  }
  
  return result;
}

export function formatMonthYear(date: Date): string {
  return date.toLocaleDateString("vi-VN", { month: "long", year: "numeric" });
}

export function formatWeekRange(date: Date): string {
  const days = getWeekDays(date);
  const start = days[0].date;
  const end = days[6].date;
  
  if (start.getMonth() === end.getMonth()) {
    return `${start.getDate()} - ${end.getDate()} ${start.toLocaleDateString("vi-VN", { month: "long", year: "numeric" })}`;
  }
  return `${start.getDate()} ${start.toLocaleDateString("vi-VN", { month: "short" })} - ${end.getDate()} ${end.toLocaleDateString("vi-VN", { month: "short", year: "numeric" })}`;
}

export function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

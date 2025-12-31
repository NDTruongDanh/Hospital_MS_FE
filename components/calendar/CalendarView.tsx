"use client";

import { useState, useMemo } from "react";
import {
  CalendarViewMode,
  EventType,
  CalendarEvent,
  getMonthDays,
  getWeekDays,
  formatMonthYear,
  formatWeekRange,
} from "@/interfaces/calendar";
import { MonthlyGrid } from "./MonthlyGrid";
import { WeeklyView } from "./WeeklyView";
import { DayView } from "./DayView";
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  DollarSign,
  FileText,
  Grid3X3,
  LayoutList,
  CalendarDays,
  Loader2,
  Plus,
  ClipboardList,
} from "lucide-react";

interface CalendarViewProps {
  activeTab: EventType;
  onTabChange: (tab: EventType) => void;
  events: CalendarEvent[];
  loading?: boolean;
  onEventClick?: (event: CalendarEvent) => void;
  onDateClick?: (date: Date) => void;
  onAddClick?: (date?: Date) => void;
}

const TABS: { value: EventType; label: string; icon: typeof Calendar }[] = [
  { value: "appointment", label: "Lịch hẹn", icon: Calendar },
  { value: "schedule", label: "Lịch làm việc", icon: ClipboardList },
  { value: "billing", label: "Hóa đơn", icon: DollarSign },
  { value: "lab", label: "Xét nghiệm", icon: FileText },
];

const VIEW_MODES: { value: CalendarViewMode; label: string; icon: typeof Grid3X3 }[] = [
  { value: "month", label: "Tháng", icon: Grid3X3 },
  { value: "week", label: "Tuần", icon: LayoutList },
  { value: "day", label: "Ngày", icon: CalendarDays },
];

export function CalendarView({
  activeTab,
  onTabChange,
  events,
  loading = false,
  onEventClick,
  onDateClick,
  onAddClick,
}: CalendarViewProps) {
  const [viewMode, setViewMode] = useState<CalendarViewMode>("month");
  const [currentDate, setCurrentDate] = useState(new Date());

  // Calculate days based on view mode
  const days = useMemo(() => {
    if (viewMode === "month") {
      return getMonthDays(currentDate.getFullYear(), currentDate.getMonth());
    }
    return getWeekDays(currentDate);
  }, [viewMode, currentDate]);

  // Navigation handlers
  const handlePrev = () => {
    const newDate = new Date(currentDate);
    if (viewMode === "month") {
      newDate.setMonth(newDate.getMonth() - 1);
    } else if (viewMode === "week") {
      newDate.setDate(newDate.getDate() - 7);
    } else {
      newDate.setDate(newDate.getDate() - 1);
    }
    setCurrentDate(newDate);
  };

  const handleNext = () => {
    const newDate = new Date(currentDate);
    if (viewMode === "month") {
      newDate.setMonth(newDate.getMonth() + 1);
    } else if (viewMode === "week") {
      newDate.setDate(newDate.getDate() + 7);
    } else {
      newDate.setDate(newDate.getDate() + 1);
    }
    setCurrentDate(newDate);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Get display title
  const getTitle = () => {
    if (viewMode === "month") {
      return formatMonthYear(currentDate);
    } else if (viewMode === "week") {
      return formatWeekRange(currentDate);
    } else {
      return currentDate.toLocaleDateString("vi-VN", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
        {/* Top Row: Tabs and View Mode */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          {/* Tabs */}
          <div className="flex gap-1 p-1 bg-gray-100 rounded-lg">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.value}
                  onClick={() => onTabChange(tab.value)}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium
                    transition-all duration-200
                    ${activeTab === tab.value
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* View Mode Toggle */}
          <div className="flex gap-1 p-1 bg-gray-100 rounded-lg">
            {VIEW_MODES.map((mode) => {
              const Icon = mode.icon;
              return (
                <button
                  key={mode.value}
                  onClick={() => setViewMode(mode.value)}
                  className={`
                    flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm
                    transition-all duration-200
                    ${viewMode === mode.value
                      ? "bg-blue-500 text-white"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                    }
                  `}
                  title={mode.label}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{mode.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Bottom Row: Navigation */}
        <div className="flex items-center justify-between">
          {/* Nav Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrev}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            <button
              onClick={handleToday}
              className="px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              Hôm nay
            </button>
            <button
              onClick={handleNext}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Title */}
          <h2 className="text-lg font-semibold text-gray-900 capitalize">
            {getTitle()}
          </h2>

          {/* Add Button */}
          <button
            onClick={() => onAddClick?.()}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Thêm mới</span>
          </button>
        </div>
      </div>

      {/* Calendar Content */}
      {loading ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-500" />
          <p className="mt-2 text-gray-500">Đang tải dữ liệu...</p>
        </div>
      ) : (
        <>
          {viewMode === "month" && (
            <MonthlyGrid
              days={days}
              events={events}
              onDayClick={onDateClick}
              onEventClick={onEventClick}
              onAddClick={onAddClick}
            />
          )}
          {viewMode === "week" && (
            <WeeklyView
              days={days}
              events={events}
              onDayClick={onDateClick}
              onEventClick={onEventClick}
              onAddClick={onAddClick}
            />
          )}
          {viewMode === "day" && (
            <DayView
              date={currentDate}
              events={events}
              onEventClick={onEventClick}
              onAddClick={onAddClick}
            />
          )}
        </>
      )}
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import { format, addDays, startOfWeek, isSameDay, isToday, isWithinInterval, endOfDay, startOfDay } from "date-fns";
import { ChevronLeft, ChevronRight, Clock, CheckCircle2, User, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Appointment, AppointmentStatus } from "@/interfaces/appointment";
import { Spinner } from "@/components/ui/spinner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface AppointmentScheduleViewProps {
  appointments: Appointment[];
  onAppointmentClick: (appointment: Appointment) => void;
  onEmptySlotClick?: (date: Date) => void;
  onMarkComplete?: (appointment: Appointment) => void;
  onViewPatient?: (patientId: string) => void;
  isLoading: boolean;
  weekStart?: Date;
  onWeekChange?: (newWeekStart: Date) => void;
  showQuickActions?: boolean;
}

// Time slots for 24 hours (30-minute intervals from 00:00 to 23:30)
const TIME_SLOTS = Array.from({ length: 48 }, (_, i) => {
  const hour = Math.floor(i / 2);
  const minute = i % 2 === 0 ? "00" : "30";
  return `${hour.toString().padStart(2, "0")}:${minute}`;
});

const STATUS_COLORS: Record<AppointmentStatus, { bg: string; border: string; text: string }> = {
  SCHEDULED: { bg: "bg-sky-50", border: "border-sky-200", text: "text-sky-700" },
  IN_PROGRESS: { bg: "bg-yellow-50", border: "border-yellow-200", text: "text-yellow-700" },
  COMPLETED: { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-700" },
  CANCELLED: { bg: "bg-red-50", border: "border-red-200", text: "text-red-500 line-through" },
  NO_SHOW: { bg: "bg-rose-50", border: "border-rose-200", text: "text-rose-600" },
};

export function AppointmentScheduleView({
  appointments,
  onAppointmentClick,
  onEmptySlotClick,
  onMarkComplete,
  onViewPatient,
  isLoading,
  weekStart: externalWeekStart,
  onWeekChange,
  showQuickActions = false,
}: AppointmentScheduleViewProps) {
  const [internalWeekStart, setInternalWeekStart] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );

  const weekStart = externalWeekStart || internalWeekStart;

  // Generate 7 days of the week
  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  }, [weekStart]);

  // Group appointments by date and time
  const appointmentsByDateAndTime = useMemo(() => {
    const map = new Map<string, Appointment[]>();

    appointments.forEach((apt) => {
      const dateStr = format(new Date(apt.appointmentTime), "yyyy-MM-dd");
      const timeStr = format(new Date(apt.appointmentTime), "HH:mm");
      // Round to nearest 30-minute slot
      const [hours, mins] = timeStr.split(":").map(Number);
      const roundedMins = mins < 30 ? "00" : "30";
      const slotKey = `${dateStr}-${hours.toString().padStart(2, "0")}:${roundedMins}`;

      const existing = map.get(slotKey) || [];
      existing.push(apt);
      map.set(slotKey, existing);
    });

    return map;
  }, [appointments]);

  // Count appointments within the displayed week
  const weekAppointmentsCount = useMemo(() => {
    const weekEnd = addDays(weekStart, 6);
    return appointments.filter((apt) => {
      const aptDate = new Date(apt.appointmentTime);
      return isWithinInterval(aptDate, { 
        start: startOfDay(weekStart), 
        end: endOfDay(weekEnd) 
      });
    }).length;
  }, [appointments, weekStart]);

  const handlePrevWeek = () => {
    const newStart = addDays(weekStart, -7);
    if (onWeekChange) {
      onWeekChange(newStart);
    } else {
      setInternalWeekStart(newStart);
    }
  };

  const handleNextWeek = () => {
    const newStart = addDays(weekStart, 7);
    if (onWeekChange) {
      onWeekChange(newStart);
    } else {
      setInternalWeekStart(newStart);
    }
  };

  const handleToday = () => {
    const newStart = startOfWeek(new Date(), { weekStartsOn: 1 });
    if (onWeekChange) {
      onWeekChange(newStart);
    } else {
      setInternalWeekStart(newStart);
    }
  };

  if (isLoading) {
    return (
      <Card className="border-2 border-slate-200 shadow-md rounded-xl p-8">
        <div className="flex items-center justify-center py-12">
          <Spinner className="h-8 w-8" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-slate-200 shadow-md rounded-xl overflow-hidden">
      {/* Week Navigation Header */}
      <div className="flex items-center justify-between p-4 border-b bg-slate-50">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handlePrevWeek}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleToday}>
            Today
          </Button>
          <Button variant="outline" size="icon" onClick={handleNextWeek}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <h3 className="font-semibold text-lg">
          {format(weekStart, "MMM d")} - {format(addDays(weekStart, 6), "MMM d, yyyy")}
        </h3>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>{weekAppointmentsCount} appointments this week</span>
        </div>
      </div>

      {/* Schedule Grid */}
      <div className="overflow-x-auto">
        <div className="min-w-[900px]">
          {/* Day Headers */}
          <div className="grid grid-cols-8 border-b bg-sky-100">
            <div className="p-3 text-center font-medium text-sm text-slate-600 border-r">
              Time
            </div>
            {weekDays.map((day) => (
              <div
                key={day.toISOString()}
                className={cn(
                  "p-3 text-center border-r last:border-r-0",
                  isToday(day) && "bg-sky-200"
                )}
              >
                <div className="text-xs text-slate-500 uppercase">
                  {format(day, "EEE")}
                </div>
                <div
                  className={cn(
                    "text-lg font-semibold",
                    isToday(day) ? "text-sky-700" : "text-slate-700"
                  )}
                >
                  {format(day, "d")}
                </div>
              </div>
            ))}
          </div>

          {/* Time Slots */}
          <div className="max-h-[600px] overflow-y-auto">
            {TIME_SLOTS.map((time) => (
              <div key={time} className="grid grid-cols-8 border-b last:border-b-0">
                {/* Time Label */}
                <div className="p-2 text-xs text-slate-500 text-center border-r bg-slate-50 flex items-start justify-center">
                  {time}
                </div>

                {/* Day Cells */}
                {weekDays.map((day) => {
                  const dateStr = format(day, "yyyy-MM-dd");
                  const slotKey = `${dateStr}-${time}`;
                  const slotAppointments = appointmentsByDateAndTime.get(slotKey) || [];

                  return (
                    <div
                      key={slotKey}
                      className={cn(
                        "p-1 border-r last:border-r-0 min-h-[48px] transition-colors",
                        isToday(day) && "bg-sky-50/50",
                        slotAppointments.length === 0 &&
                          onEmptySlotClick &&
                          "hover:bg-slate-100 cursor-pointer"
                      )}
                      onClick={() => {
                        if (slotAppointments.length === 0 && onEmptySlotClick) {
                          const [hours, mins] = time.split(":").map(Number);
                          const slotDate = new Date(day);
                          slotDate.setHours(hours, mins, 0, 0);
                          onEmptySlotClick(slotDate);
                        }
                      }}
                    >
                      {slotAppointments.map((apt) => {
                        const colors = STATUS_COLORS[apt.status];
                        const canComplete = apt.status === "SCHEDULED" || apt.status === "IN_PROGRESS";
                        return (
                          <TooltipProvider key={apt.id} delayDuration={200}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onAppointmentClick(apt);
                                  }}
                                  className={cn(
                                    "rounded-md p-1.5 mb-1 cursor-pointer border text-xs transition-all hover:shadow-md group relative",
                                    colors.bg,
                                    colors.border
                                  )}
                                >
                                  <div className={cn("font-medium truncate", colors.text)}>
                                    {apt.patient?.fullName}
                                  </div>
                                  <div className="text-slate-500 truncate text-[10px]">
                                    {format(new Date(apt.appointmentTime), "HH:mm")}
                                  </div>
                                  
                                  {/* Quick Actions - shown on hover */}
                                  {showQuickActions && (
                                    <div className="absolute -right-1 -top-1 hidden group-hover:flex gap-0.5">
                                      {canComplete && onMarkComplete && (
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            onMarkComplete(apt);
                                          }}
                                          className="p-1 bg-emerald-500 rounded-full text-white shadow-sm hover:bg-emerald-600 transition-colors"
                                          title="Mark Complete"
                                        >
                                          <CheckCircle2 className="h-3 w-3" />
                                        </button>
                                      )}
                                      {apt.patient?.id && onViewPatient && (
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            onViewPatient(apt.patient!.id);
                                          }}
                                          className="p-1 bg-sky-500 rounded-full text-white shadow-sm hover:bg-sky-600 transition-colors"
                                          title="View Patient"
                                        >
                                          <User className="h-3 w-3" />
                                        </button>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </TooltipTrigger>
                              <TooltipContent side="right" className="max-w-xs bg-slate-800 text-white border-slate-700">
                                <div className="space-y-1">
                                  <p className="font-medium text-white">{apt.patient?.fullName}</p>
                                  <p className="text-xs text-sky-200">
                                    {format(new Date(apt.appointmentTime), "HH:mm")} - {apt.reason || 'General checkup'}
                                  </p>
                                  <Badge variant="outline" className="text-[10px]">
                                    {apt.status}
                                  </Badge>
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 p-3 border-t bg-slate-50 text-xs">
        <span className="text-slate-600 font-medium">Status:</span>
        {Object.entries(STATUS_COLORS).map(([status, colors]) => (
          <div key={status} className="flex items-center gap-1">
            <div className={cn("w-3 h-3 rounded border", colors.bg, colors.border)} />
            <span className="text-slate-600 capitalize">{status.toLowerCase().replace("_", " ")}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

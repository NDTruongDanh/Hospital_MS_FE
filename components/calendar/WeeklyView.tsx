"use client";

import { DayEvents, CalendarEvent, isSameDay } from "@/interfaces/calendar";
import { EventCard } from "./EventCard";
import { Plus } from "lucide-react";

interface WeeklyViewProps {
  days: DayEvents[];
  events: CalendarEvent[];
  onDayClick?: (date: Date) => void;
  onEventClick?: (event: CalendarEvent) => void;
  onAddClick?: (date: Date) => void;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const WEEKDAY_SHORT = ["CN", "Th 2", "Th 3", "Th 4", "Th 5", "Th 6", "Th 7"];

export function WeeklyView({
  days,
  events,
  onDayClick,
  onEventClick,
  onAddClick,
}: WeeklyViewProps) {
  // Group events by date
  const eventsByDate = days.map((day) => ({
    ...day,
    events: events.filter((event) => isSameDay(event.date, day.date)),
  }));

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
      {/* Day Headers */}
      <div className="grid grid-cols-8 border-b border-gray-200 sticky top-0 bg-white z-10">
        <div className="p-3 text-center text-xs font-medium text-gray-500 border-r border-gray-100">
          Giờ
        </div>
        {eventsByDate.map((day, i) => (
          <div
            key={i}
            onClick={() => onDayClick?.(day.date)}
            className={`
              p-3 text-center cursor-pointer border-r border-gray-100
              ${day.isToday ? "bg-blue-50" : "hover:bg-gray-50"}
            `}
          >
            <div className="text-xs font-medium text-gray-500">
              {WEEKDAY_SHORT[day.date.getDay()]}
            </div>
            <div
              className={`
                text-lg font-semibold
                ${day.isToday
                  ? "text-blue-600"
                  : "text-gray-900"
                }
              `}
            >
              {day.date.getDate()}
            </div>
          </div>
        ))}
      </div>

      {/* Time Grid */}
      <div className="max-h-[600px] overflow-y-auto">
        {HOURS.map((hour) => (
          <div key={hour} className="grid grid-cols-8 min-h-[60px] border-b border-gray-100">
            {/* Hour Label */}
            <div className="p-2 text-xs text-gray-500 text-right border-r border-gray-100">
              {hour.toString().padStart(2, "0")}:00
            </div>

            {/* Day Columns */}
            {eventsByDate.map((day, i) => {
              const hourEvents = day.events.filter((e) => {
                if (!e.time) return hour === 9; // Default to 9am if no time
                const eventHour = parseInt(e.time.split(":")[0]);
                return eventHour === hour;
              });

              return (
                <div
                  key={i}
                  onClick={() => onDayClick?.(day.date)}
                  className={`
                    relative group border-r border-gray-100 p-1
                    hover:bg-blue-50/30 cursor-pointer
                    ${day.isToday ? "bg-blue-50/20" : ""}
                  `}
                >
                  {hourEvents.map((event) => (
                    <EventCard
                      key={event.id}
                      event={event}
                      compact
                      onClick={() => onEventClick?.(event)}
                    />
                  ))}

                  {/* Quick Add */}
                  {hourEvents.length === 0 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onAddClick?.(day.date);
                      }}
                      className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Plus className="w-4 h-4 text-gray-400" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

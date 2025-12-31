"use client";

import { CalendarEvent, isSameDay } from "@/interfaces/calendar";
import { EventCard } from "./EventCard";
import { Plus } from "lucide-react";

interface DayViewProps {
  date: Date;
  events: CalendarEvent[];
  onEventClick?: (event: CalendarEvent) => void;
  onAddClick?: (date: Date) => void;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);

export function DayView({ date, events, onEventClick, onAddClick }: DayViewProps) {
  // Filter events for this day
  const dayEvents = events.filter((event) => isSameDay(event.date, date));

  // Group by hour
  const eventsByHour = HOURS.reduce((acc, hour) => {
    acc[hour] = dayEvents.filter((e) => {
      if (!e.time) return hour === 9;
      const eventHour = parseInt(e.time.split(":")[0]);
      return eventHour === hour;
    });
    return acc;
  }, {} as Record<number, CalendarEvent[]>);

  const isToday = isSameDay(date, new Date());
  const currentHour = new Date().getHours();

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
      {/* Day Header */}
      <div className={`p-4 border-b border-gray-200 ${isToday ? "bg-blue-50" : "bg-gray-50"}`}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className={`text-2xl font-bold ${isToday ? "text-blue-600" : "text-gray-900"}`}>
              {date.toLocaleDateString("vi-VN", { weekday: "long" })}
            </h2>
            <p className="text-gray-500">
              {date.toLocaleDateString("vi-VN", { day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>
          <button
            onClick={() => onAddClick?.(date)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Thêm mới
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="p-4 bg-gray-50 border-b border-gray-200">
        <p className="text-sm text-gray-600">
          <span className="font-semibold text-gray-900">{dayEvents.length}</span> sự kiện trong ngày
        </p>
      </div>

      {/* Hourly Timeline */}
      <div className="max-h-[600px] overflow-y-auto">
        {HOURS.map((hour) => {
          const hourEvents = eventsByHour[hour];
          const hasEvents = hourEvents.length > 0;
          const isCurrentHour = isToday && hour === currentHour;

          return (
            <div
              key={hour}
              className={`
                grid grid-cols-12 min-h-[80px] border-b border-gray-100
                ${isCurrentHour ? "bg-blue-50/50" : ""}
              `}
            >
              {/* Hour Label */}
              <div className="col-span-1 p-3 border-r border-gray-100 text-right">
                <span
                  className={`
                    text-sm font-medium
                    ${isCurrentHour ? "text-blue-600" : "text-gray-500"}
                  `}
                >
                  {hour.toString().padStart(2, "0")}:00
                </span>
              </div>

              {/* Events Area */}
              <div className="col-span-11 p-2 relative group">
                {hasEvents ? (
                  <div className="space-y-2">
                    {hourEvents.map((event) => (
                      <EventCard
                        key={event.id}
                        event={event}
                        onClick={() => onEventClick?.(event)}
                      />
                    ))}
                  </div>
                ) : (
                  <button
                    onClick={() => onAddClick?.(date)}
                    className="w-full h-full flex items-center justify-center text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Plus className="w-5 h-5 mr-1" />
                    <span className="text-sm">Thêm sự kiện</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

"use client";

import { DayEvents, CalendarEvent, isSameDay } from "@/interfaces/calendar";
import { EventCard, EventDot } from "./EventCard";
import { Plus } from "lucide-react";

interface MonthlyGridProps {
  days: DayEvents[];
  events: CalendarEvent[];
  onDayClick?: (date: Date) => void;
  onEventClick?: (event: CalendarEvent) => void;
  onAddClick?: (date: Date) => void;
}

const WEEKDAY_LABELS = ["Th 2", "Th 3", "Th 4", "Th 5", "Th 6", "Th 7", "CN"];

export function MonthlyGrid({
  days,
  events,
  onDayClick,
  onEventClick,
  onAddClick,
}: MonthlyGridProps) {
  // Group events by date
  const eventsByDate = days.map((day) => ({
    ...day,
    events: events.filter((event) => isSameDay(event.date, day.date)),
  }));

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
      {/* Weekday Headers */}
      <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
        {WEEKDAY_LABELS.map((label, i) => (
          <div
            key={label}
            className={`
              py-3 text-center text-xs font-semibold uppercase tracking-wide
              ${i >= 5 ? "text-red-500" : "text-gray-600"}
            `}
          >
            {label}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7">
        {eventsByDate.map((day, index) => {
          const hasEvents = day.events.length > 0;
          const displayEvents = day.events.slice(0, 3);
          const moreCount = day.events.length - 3;

          return (
            <div
              key={index}
              onClick={() => onDayClick?.(day.date)}
              className={`
                group relative min-h-[120px] p-2 border-b border-r border-gray-100
                cursor-pointer transition-all duration-200
                ${!day.isCurrentMonth ? "bg-gray-50/50" : "bg-white"}
                hover:bg-blue-50/50
              `}
            >
              {/* Day Number */}
              <div className="flex items-center justify-between mb-1">
                <span
                  className={`
                    inline-flex items-center justify-center w-7 h-7 rounded-full text-sm
                    ${day.isToday
                      ? "bg-blue-600 text-white font-bold"
                      : day.isCurrentMonth
                      ? "text-gray-900 font-medium"
                      : "text-gray-400"
                    }
                  `}
                >
                  {day.date.getDate()}
                </span>

                {/* Event dots indicator */}
                {hasEvents && (
                  <div className="flex gap-0.5">
                    {[...new Set(day.events.map((e) => e.type))].map((type) => (
                      <EventDot key={type} type={type} />
                    ))}
                  </div>
                )}
              </div>

              {/* Events */}
              <div className="space-y-1">
                {displayEvents.map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    compact
                    onClick={() => onEventClick?.(event)}
                  />
                ))}
                {moreCount > 0 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDayClick?.(day.date);
                    }}
                    className="w-full text-left px-1.5 py-0.5 text-xs text-blue-600 hover:text-blue-700 font-medium"
                  >
                    +{moreCount} khác
                  </button>
                )}
              </div>

              {/* Quick Add Button - appears on hover */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAddClick?.(day.date);
                }}
                className={`
                  absolute bottom-2 right-2 w-6 h-6 rounded-full
                  bg-blue-500 text-white flex items-center justify-center
                  opacity-0 group-hover:opacity-100 transition-opacity
                  hover:bg-blue-600 shadow-sm
                `}
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

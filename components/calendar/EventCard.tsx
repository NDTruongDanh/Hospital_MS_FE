"use client";

import { CalendarEvent, EVENT_COLORS, STATUS_BADGES } from "@/interfaces/calendar";
import { Calendar, DollarSign, FileText, Clock, ClipboardList } from "lucide-react";

interface EventCardProps {
  event: CalendarEvent;
  compact?: boolean;
  onClick?: () => void;
}

const EVENT_ICONS = {
  appointment: Calendar,
  billing: DollarSign,
  lab: FileText,
  schedule: ClipboardList,
};

export function EventCard({ event, compact = false, onClick }: EventCardProps) {
  const colors = EVENT_COLORS[event.type];
  const status = STATUS_BADGES[event.status] || { label: event.status, class: "badge-secondary" };
  const Icon = EVENT_ICONS[event.type];

  if (compact) {
    // Compact mode for monthly grid
    return (
      <button
        onClick={(e) => {
          e.stopPropagation();
          onClick?.();
        }}
        className={`
          w-full text-left px-1.5 py-0.5 rounded text-xs truncate
          ${colors.bg} ${colors.text} ${colors.border} border
          hover:opacity-80 transition-opacity
        `}
        title={`${event.time || ""} ${event.title}`}
      >
        {event.time && <span className="font-medium">{event.time} </span>}
        <span>{event.title}</span>
      </button>
    );
  }

  // Full card mode for week/day view
  return (
    <div
      onClick={onClick}
      className={`
        group p-3 rounded-lg border cursor-pointer
        ${colors.bg} ${colors.border}
        hover:shadow-md transition-all duration-200
      `}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className={`p-1.5 rounded-lg ${colors.bg} ${colors.text}`}>
            <Icon className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h4 className={`font-medium text-sm truncate ${colors.text}`}>
              {event.title}
            </h4>
            {event.subtitle && (
              <p className="text-xs text-gray-500 truncate">{event.subtitle}</p>
            )}
          </div>
        </div>
        <span className={`badge ${status.class} text-[10px] shrink-0`}>
          {status.label}
        </span>
      </div>

      {/* Time */}
      {event.time && (
        <div className="flex items-center gap-1.5 mt-2 text-xs text-gray-500">
          <Clock className="w-3 h-3" />
          <span>
            {event.time}
            {event.endTime && ` - ${event.endTime}`}
          </span>
        </div>
      )}
    </div>
  );
}

// Dot indicator for monthly calendar
export function EventDot({ type }: { type: CalendarEvent["type"] }) {
  const colors = EVENT_COLORS[type];
  return (
    <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
  );
}

"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTimeSlots } from "@/hooks/queries/useAppointment"; // Import useTimeSlots
import { Spinner } from "@/components/ui/spinner";
import { TimeSlot } from "@/interfaces/appointment";

interface TimeSlotPickerProps {
  doctorId: string;
  date: string; // YYYY-MM-DD format
  selectedSlot: string | null | undefined;
  onSelect: (time: string) => void; // Changed to just time (HH:mm)
  disabled?: boolean;
  excludeAppointmentId?: string;
}

export function TimeSlotPicker({
  doctorId,
  date,
  selectedSlot,
  onSelect,
  disabled,
  excludeAppointmentId,
}: TimeSlotPickerProps) {
  // Fetch slots using the hook
  const { data: slots, isLoading } = useTimeSlots(
    doctorId,
    date,
    excludeAppointmentId
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-24">
        <Spinner className="mr-2 text-muted-foreground" />
        <span className="text-muted-foreground">Loading slots...</span>
      </div>
    );
  }

  if (!slots || slots.length === 0) {
    return (
      <div className="text-muted-foreground text-sm py-4 text-center">
        No available slots for this date.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
      {slots.map((slot) => {
        const datetime = `${date}T${slot.time}:00`;
        return (
          <button
            key={slot.time}
            type="button"
            disabled={disabled || !slot.available}
            onClick={() => onSelect(slot.time)}
            className={cn(
              "px-3 py-2 text-sm font-medium rounded-md border transition-colors",
              {
                "bg-primary text-primary-foreground border-primary":
                  selectedSlot === slot.time,
                "bg-white hover:bg-gray-50 border-gray-300":
                  slot.available && selectedSlot !== datetime,
                "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed":
                  !slot.available,
                "ring-2 ring-offset-2 ring-blue-500": slot.current,
              }
            )}
          >
            {slot.time}
            {slot.current && <span className="block text-xs">(Current)</span>}
          </button>
        );
      })}
    </div>
  );
}

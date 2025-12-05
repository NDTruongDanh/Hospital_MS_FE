"use client";

import { Button } from "@/components/ui/button";

interface TimeSlot {
  time: string;
  available: boolean;
  current?: boolean;
}

interface TimeSlotPickerProps {
  slots: TimeSlot[];
  value?: string;
  onSelect: (time: string) => void;
}

export function TimeSlotPicker({ slots, value, onSelect }: TimeSlotPickerProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {slots.map((slot) => (
        <Button
          key={slot.time}
          type="button"
          variant={value === slot.time ? "default" : "outline"}
          disabled={!slot.available}
          onClick={() => onSelect(slot.time)}
        >
          {slot.time} {slot.current ? "(Current)" : ""}
        </Button>
      ))}
    </div>
  );
}

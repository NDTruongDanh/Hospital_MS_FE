"use client";

import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

interface AppointmentCalendarProps {
  value?: Date;
  onChange: (date?: Date) => void;
  availableDates?: Date[];
}

export function AppointmentCalendar({
  value,
  onChange,
  availableDates = [],
}: AppointmentCalendarProps) {
  const [selected, setSelected] = useState<Date | undefined>(value);

  const isDateAvailable = (day: Date) =>
    availableDates.length === 0 ||
    availableDates.some(
      (d) =>
        d.getFullYear() === day.getFullYear() &&
        d.getMonth() === day.getMonth() &&
        d.getDate() === day.getDate()
    );

  return (
    <div className="space-y-2">
      <Calendar
        mode="single"
        selected={selected}
        onSelect={(d) => {
          setSelected(d);
          onChange(d);
        }}
        disabled={(day) => !isDateAvailable(day)}
        initialFocus
      />
      <div className="flex justify-between items-center text-sm text-muted-foreground">
        <span>
          {selected ? `Đã chọn: ${format(selected, "dd/MM/yyyy")}` : "Chưa chọn ngày"}
        </span>
        {selected && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelected(undefined);
              onChange(undefined);
            }}
          >
            Xóa chọn
          </Button>
        )}
      </div>
    </div>
  );
}

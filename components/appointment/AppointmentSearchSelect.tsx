"use client";

import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { format } from "date-fns";

import { cn } from "@/lib/utils";
import { useDebounce } from "@/hooks/useDebounce";
import {
  useAppointmentSearch,
  useCompletedAppointmentsWithoutExam,
} from "@/hooks/queries/useAppointment";
import { Appointment } from "@/interfaces/appointment";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface AppointmentSearchSelectProps {
  onSelect: (appointment: Appointment) => void;
  mode?: "scheduled" | "completedWithoutExam"; // Add mode prop
}

export function AppointmentSearchSelect({
  onSelect,
  mode = "scheduled", // Default to scheduled
}: AppointmentSearchSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);

  // Use different hook based on mode
  const scheduledQuery = useAppointmentSearch(debouncedSearch);
  const completedQuery = useCompletedAppointmentsWithoutExam(debouncedSearch);

  const { data: appointments, isLoading } =
    mode === "completedWithoutExam" ? completedQuery : scheduledQuery;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {mode === "completedWithoutExam"
            ? "Select completed appointment without exam..."
            : "Select an appointment..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[450px] p-0">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search by patient or doctor..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            {isLoading && (
              <div className="p-4 text-sm text-muted-foreground">
                Loading...
              </div>
            )}
            <CommandEmpty>
              {mode === "completedWithoutExam"
                ? "No completed appointments without exams found."
                : "No scheduled appointments found."}
            </CommandEmpty>
            <CommandGroup>
              {appointments?.map((appointment) => (
                <CommandItem
                  key={appointment.id}
                  value={`${appointment.patient.fullName} ${appointment.doctor.fullName} ${appointment.id}`}
                  onSelect={() => {
                    onSelect(appointment);
                    setOpen(false);
                  }}
                >
                  <div>
                    <p className="font-medium">
                      {appointment.patient.fullName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      with {appointment.doctor.fullName} on{" "}
                      {format(
                        new Date(appointment.appointmentTime),
                        "MMM d, yyyy 'at' h:mm a"
                      )}
                    </p>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

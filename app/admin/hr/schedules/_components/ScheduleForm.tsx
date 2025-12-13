"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import { Textarea } from "@/components/ui/textarea";
import { ScheduleRequest } from "@/interfaces/hr";
import { useEmployees } from "@/hooks/queries/useHr";
import { Check, ChevronsUpDown } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";

const formSchema = z
  .object({
    employeeId: z.string().min(1, "Employee is required"),
    workDate: z.string().min(1, "Date is required"),
    startTime: z.string().min(1, "Start time is required"),
    endTime: z.string().min(1, "End time is required"),
    status: z.enum(["AVAILABLE", "BOOKED", "CANCELLED"]),
    notes: z.string().optional(),
  })
  .superRefine((values, ctx) => {
    const today = new Date();
    const dateVal = new Date(values.workDate);
    if (isFinite(dateVal.getTime())) {
      const todayStart = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate()
      );
      if (dateVal < todayStart) {
        ctx.addIssue({
          code: "custom",
          path: ["workDate"],
          message: "Work date cannot be in the past",
        });
      }
    }

    const toMinutes = (time: string) => {
      const [h, m] = time.split(":").map((v) => Number(v));
      return h * 60 + m;
    };

    const startMin = toMinutes(values.startTime || "0:0");
    const endMin = toMinutes(values.endTime || "0:0");
    if (startMin >= endMin) {
      ctx.addIssue({
        code: "custom",
        path: ["startTime"],
        message: "Start time must be before end time",
      });
    }

    const incrementOk = (min: number) => min % 30 === 0;
    if (!incrementOk(startMin) || !incrementOk(endMin)) {
      ctx.addIssue({
        code: "custom",
        path: ["startTime"],
        message: "Time must be in 30-minute increments",
      });
    }
  });

type ScheduleFormValues = z.infer<typeof formSchema>;

interface ScheduleFormProps {
  initialData?: any; // TODO: Type properly
  onSubmit: (data: ScheduleRequest) => void;
  isLoading: boolean;
  onCancel: () => void;
}

export default function ScheduleForm({
  initialData,
  onSubmit,
  isLoading,
  onCancel,
}: ScheduleFormProps) {
  const form = useForm<ScheduleFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      employeeId: initialData?.employeeId || "",
      workDate: initialData?.workDate || new Date().toISOString().split("T")[0],
      startTime: initialData?.startTime || "09:00",
      endTime: initialData?.endTime || "17:00",
      status: initialData?.status || "AVAILABLE",
      notes: initialData?.notes || "",
    },
  });

  // Fetch employees for combobox
  const { data: employeesData } = useEmployees({ size: 100, status: "ACTIVE" });
  const employees = employeesData?.content ?? [];

  const handleSubmit = (values: ScheduleFormValues) => {
    onSubmit(values);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="employeeId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Employee</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      role="combobox"
                      className="w-full justify-between"
                    >
                      {field.value
                        ? employees.find((emp) => emp.id === field.value)
                            ?.fullName
                        : "Select employee"}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search employee" />
                    <CommandEmpty>No employee found.</CommandEmpty>
                    <CommandGroup>
                      {employees.map((emp) => (
                        <CommandItem
                          key={emp.id}
                          value={emp.fullName}
                          onSelect={() => field.onChange(emp.id)}
                        >
                          <Check
                            className={`mr-2 h-4 w-4 ${
                              field.value === emp.id
                                ? "opacity-100"
                                : "opacity-0"
                            }`}
                          />
                          {emp.fullName} ({emp.role})
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="workDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Date</FormLabel>
              <FormControl>
                <Input
                  type="date"
                  min={new Date().toISOString().split("T")[0]}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="startTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Start Time</FormLabel>
                <FormControl>
                  <Input type="time" step={1800} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="endTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>End Time</FormLabel>
                <FormControl>
                  <Input type="time" step={1800} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="AVAILABLE">Available</SelectItem>
                  <SelectItem value="BOOKED">Booked</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea placeholder="Optional notes" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Spinner size="sm" className="mr-2" />}
            Save
          </Button>
        </div>
      </form>
    </Form>
  );
}

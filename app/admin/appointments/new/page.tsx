"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { ArrowLeft, Loader2, CalendarDays } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { cn } from "@/lib/utils";

import { useCreateAppointment } from "@/hooks/queries/useAppointment";
import { PatientSearchSelect } from "@/components/appointment/PatientSearchSelect";
import { DoctorSearchSelect } from "@/components/appointment/DoctorSearchSelect";
import { DepartmentSelect } from "@/components/hr/DepartmentSelect";
import { TimeSlotPicker } from "@/components/appointment/TimeSlotPicker";
import { Spinner } from "@/components/ui/spinner";

// Form schema
const appointmentFormSchema = z.object({
  patientId: z.string().min(1, "Please select a patient"),
  doctorId: z.string().min(1, "Please select a doctor"),
  appointmentDate: z.date({ message: "Please select a date" }),
  appointmentTime: z.string().min(1, "Please select a time slot"),
  type: z.enum(["CONSULTATION", "FOLLOW_UP", "EMERGENCY"], {
    message: "Please select appointment type",
  }),
  reason: z
    .string()
    .min(1, "Please enter reason for visit")
    .max(500, "Reason cannot exceed 500 characters"),
  notes: z.string().max(1000, "Notes cannot exceed 1000 characters").optional(),
});

type FormValues = z.infer<typeof appointmentFormSchema>;

export default function NewAppointmentPage() {
  const router = useRouter();
  const createMutation = useCreateAppointment();
  const [departmentId, setDepartmentId] = useState<string | undefined>();

  const form = useForm<FormValues>({
    resolver: zodResolver(appointmentFormSchema) as any,
    defaultValues: {
      patientId: "",
      doctorId: "",
      appointmentTime: "",
      type: "CONSULTATION",
      reason: "",
      notes: "",
    },
  });

  const watchedDoctorId = form.watch("doctorId");
  const watchedDate = form.watch("appointmentDate");

  // Reset doctor and time slot when department changes
  useEffect(() => {
    form.setValue("doctorId", "");
    form.setValue("appointmentTime", "");
  }, [departmentId, form]);

  // Reset time slot when date or doctor changes
  useEffect(() => {
    form.setValue("appointmentTime", "");
  }, [watchedDoctorId, watchedDate, form]);

  const onSubmit = async (data: FormValues) => {
    const appointmentTime =
      format(data.appointmentDate, "yyyy-MM-dd") +
      "T" +
      data.appointmentTime +
      ":00";

    createMutation.mutate(
      {
        patientId: data.patientId,
        doctorId: data.doctorId,
        appointmentTime,
        type: data.type,
        reason: data.reason,
        notes: data.notes,
      },
      {
        onSuccess: () => {
          router.push("/admin/appointments");
        },
      }
    );
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/appointments">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Book Appointment
          </h1>
          <p className="text-muted-foreground">
            Schedule a new appointment for a patient
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Patient Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Patient Information</CardTitle>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="patientId"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Patient *</FormLabel>
                    <PatientSearchSelect
                      value={field.value}
                      onChange={field.onChange}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Doctor Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Doctor Selection</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormItem>
                <FormLabel>Department</FormLabel>
                <DepartmentSelect
                  value={departmentId}
                  onChange={setDepartmentId}
                />
              </FormItem>
              <FormField
                control={form.control}
                name="doctorId"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Doctor *</FormLabel>
                    <DoctorSearchSelect
                      value={field.value}
                      onChange={field.onChange}
                      departmentId={
                        departmentId === "ALL" ? undefined : departmentId
                      }
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Schedule Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Schedule Selection</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Date picker */}
              <FormField
                control={form.control}
                name="appointmentDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Date *</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            <CalendarDays className="mr-2 h-4 w-4" />
                            {field.value
                              ? format(field.value, "MMMM d, yyyy")
                              : "Select a date"}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date < new Date()}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Time slots */}
              <FormField
                control={form.control}
                name="appointmentTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Time Slot *</FormLabel>
                    <TimeSlotPicker
                      doctorId={watchedDoctorId}
                      date={
                        watchedDate ? format(watchedDate, "yyyy-MM-dd") : ""
                      }
                      selectedSlot={field.value}
                      onSelect={field.onChange}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Appointment Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Appointment Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Type */}
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type *</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex flex-wrap gap-4"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem
                            value="CONSULTATION"
                            id="consultation"
                          />
                          <Label
                            htmlFor="consultation"
                            className="cursor-pointer"
                          >
                            Consultation
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="FOLLOW_UP" id="follow_up" />
                          <Label htmlFor="follow_up" className="cursor-pointer">
                            Follow-up
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="EMERGENCY" id="emergency" />
                          <Label htmlFor="emergency" className="cursor-pointer">
                            Emergency
                          </Label>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Reason */}
              <FormField
                control={form.control}
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reason for Visit *</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe symptoms or reason for this appointment..."
                        className="min-h-[100px] resize-none"
                        maxLength={500}
                        {...field}
                      />
                    </FormControl>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <FormMessage />
                      <span>{field.value?.length || 0}/500</span>
                    </div>
                  </FormItem>
                )}
              />

              {/* Notes */}
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes (Staff only)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Additional notes about the appointment..."
                        className="min-h-[100px] resize-none"
                        maxLength={1000}
                        {...field}
                      />
                    </FormControl>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <FormMessage />
                      <span>{field.value?.length || 0}/1000</span>
                    </div>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" asChild>
              <Link href="/admin/appointments">Cancel</Link>
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending && (
                <Spinner size="sm" className="mr-2" />
              )}
              Book Appointment
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}

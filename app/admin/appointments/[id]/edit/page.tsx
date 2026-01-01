"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format, parseISO } from "date-fns";
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
import { RoleGuard } from "@/components/auth/RoleGuard";

import {
  useAppointment,
  useUpdateAppointment,
} from "@/hooks/queries/useAppointment";
import { TimeSlotPicker } from "@/components/appointment/TimeSlotPicker";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";

// Schema is slightly different for admin/staff: they can't change patient/doctor
const appointmentFormSchema = z.object({
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

function EditAppointmentForm() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const { data: appointment, isLoading: isLoadingAppointment } =
    useAppointment(id);
  const updateMutation = useUpdateAppointment();

  const form = useForm<FormValues>({
    resolver: zodResolver(appointmentFormSchema) as any,
  });

  useEffect(() => {
    if (appointment) {
      const appointmentDateTime = parseISO(appointment.appointmentTime);
      // WALK_IN appointments shouldn't be edited via this form, default to CONSULTATION if encountered
      const appointmentType = appointment.type === "WALK_IN" ? "CONSULTATION" : appointment.type;
      form.reset({
        appointmentDate: appointmentDateTime,
        appointmentTime: format(appointmentDateTime, "HH:mm"),
        type: appointmentType as "CONSULTATION" | "FOLLOW_UP" | "EMERGENCY",
        reason: appointment.reason,
        notes: appointment.notes || "",
      });
    }
  }, [appointment, form]);

  const watchedDate = form.watch("appointmentDate");

  // Reset time slot when date changes
  useEffect(() => {
    form.setValue("appointmentTime", "");
  }, [watchedDate, form]);

  const onSubmit = async (data: FormValues) => {
    if (!appointment) return;

    // Construct Date object to get ISO string (UTC) for backend Instant
    const [hours, minutes] = data.appointmentTime.split(":").map(Number);
    const date = new Date(data.appointmentDate);
    date.setHours(hours, minutes, 0, 0);
    const appointmentTime = date.toISOString();

    updateMutation.mutate(
      {
        id,
        data: {
          patientId: appointment.patient.id,
          doctorId: appointment.doctor.id,
          appointmentTime,
          type: data.type,
          reason: data.reason,
          notes: data.notes,
        },
      },
      {
        onSuccess: () => {
          router.push(`/admin/appointments/${id}`);
        },
      }
    );
  };

  if (isLoadingAppointment) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <Skeleton className="h-12 w-1/2" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-60 w-full" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/admin/appointments/${id}`}>
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Reschedule Appointment
          </h1>
          <p className="text-muted-foreground">
            Reschedule or update appointment details. Patient and Doctor are
            read-only.
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                Patient & Doctor Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormItem>
                <FormLabel>Patient</FormLabel>
                <div className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  {appointment?.patient.fullName}
                </div>
              </FormItem>
              <FormItem>
                <FormLabel>Doctor</FormLabel>
                <div className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  {appointment?.doctor.fullName}
                </div>
              </FormItem>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Schedule Selection</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
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
                          disabled={(date) => {
                            const today = new Date();
                            today.setHours(0, 0, 0, 0);
                            return date < today;
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="appointmentTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Time Slot *</FormLabel>
                    <TimeSlotPicker
                      doctorId={appointment?.doctor.id || ""}
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

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Appointment Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type *</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        value={field.value}
                        className="flex flex-wrap gap-4"
                      >
                        <RadioGroupItem
                          value="CONSULTATION"
                          id="consultation"
                        />
                        <Label htmlFor="consultation">Consultation</Label>
                        <RadioGroupItem value="FOLLOW_UP" id="follow_up" />
                        <Label htmlFor="follow_up">Follow-up</Label>
                        <RadioGroupItem value="EMERGENCY" id="emergency" />
                        <Label htmlFor="emergency">Emergency</Label>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reason for Visit *</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe symptoms..."
                        className="min-h-[100px] resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes (Staff only)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Additional notes..."
                        className="min-h-[100px] resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" asChild>
              <Link href={`/admin/appointments/${id}`}>Cancel</Link>
            </Button>
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending && (
                <Spinner size="sm" className="mr-2" />
              )}
              Save Changes
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}

export default function EditAppointmentPage() {
  return (
    <RoleGuard allowedRoles={["ADMIN", "NURSE", "RECEPTIONIST"]}>
      <EditAppointmentForm />
    </RoleGuard>
  );
}

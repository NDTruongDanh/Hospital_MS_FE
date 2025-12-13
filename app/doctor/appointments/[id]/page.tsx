"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

import { useAppointment } from "@/hooks/queries/useAppointment";
import { useAuth } from "@/contexts/AuthContext";
import { AppointmentDetailView } from "@/app/admin/appointments/_components/AppointmentDetailView";

export default function DoctorAppointmentDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const { user } = useAuth();
  const { data: appointment, isLoading, error } = useAppointment(id);

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div className="space-y-2">
            <Skeleton className="h-9 w-48" />
            <Skeleton className="h-5 w-32" />
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (error || !appointment) {
    return (
      <div className="container mx-auto py-6">
        <Card className="p-8 text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-destructive" />
          <h2 className="mt-4 text-2xl font-bold tracking-tight">
            Appointment Not Found
          </h2>
          <p className="mt-2 text-muted-foreground">
            The appointment you&apos;re looking for doesn&apos;t exist or has
            been removed.
          </p>
          <Button className="mt-4" asChild>
            <Link href="/doctor/appointments">Back to Appointments</Link>
          </Button>
        </Card>
      </div>
    );
  }

  if (user?.role === "DOCTOR" && user?.employeeId !== appointment.doctor.id) {
    return (
      <div className="container mx-auto py-6">
        <Card className="p-8 text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-destructive" />
          <h2 className="mt-4 text-2xl font-bold tracking-tight">
            Access Denied
          </h2>
          <p className="mt-2 text-muted-foreground">
            You are not authorized to view this appointment as it is not
            assigned to you.
          </p>
          <Button className="mt-4" asChild>
            <Link href="/doctor/appointments">Back to Appointments</Link>
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <AppointmentDetailView
      appointment={appointment}
      user={user}
      backHref="/doctor/appointments"
      editHref={`/doctor/appointments/${appointment.id}/edit`}
      createExamHref={`/doctor/exams/new?appointmentId=${appointment.id}`}
      viewExamHref={`/doctor/exams/${appointment.medicalExamId}`}
      patientProfileBaseHref="/doctor/patients"
    />
  );
}

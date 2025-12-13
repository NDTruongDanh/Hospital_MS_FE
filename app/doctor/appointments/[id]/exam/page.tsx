"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { MedicalExamForm } from "@/app/admin/exams/_components/medical-exam-form";

import { useAppointment } from "@/hooks/queries/useAppointment";
import { useAuth } from "@/contexts/AuthContext";
import { useCreateMedicalExam } from "@/hooks/queries/useMedicalExam";
import { MedicalExamFormValues } from "@/lib/schemas/medical-exam";

export default function CreateExamFromAppointmentPage() {
  const router = useRouter();
  const params = useParams();
  const appointmentId = params.id as string;

  const { user } = useAuth();
  const {
    data: appointment,
    isLoading: isLoadingAppointment,
    error,
  } = useAppointment(appointmentId);
  const createMutation = useCreateMedicalExam();

  const handleSubmit = (
    data: MedicalExamFormValues,
    status: "PENDING" | "FINALIZED"
  ) => {
    createMutation.mutate(
      { ...data, status },
      {
        onSuccess: (createdExam) => {
          // Redirect to the new exam's detail page
          router.push(`/admin/exams/${createdExam.id}`);
        },
      }
    );
  };

  if (isLoadingAppointment) {
    return (
      <div className="page-shell">
        <Skeleton className="h-12 w-1/2" />
        <Skeleton className="h-96 w-full mt-4" />
      </div>
    );
  }

  if (error || !appointment) {
    return (
      <div className="page-shell text-center">
        <AlertCircle className="mx-auto h-12 w-12 text-destructive" />
        <h2 className="mt-4 text-xl font-semibold">Appointment Not Found</h2>
        <p className="mt-2 text-muted-foreground">
          The appointment you are trying to create an exam for does not exist.
        </p>
        <Button className="mt-4" asChild>
          <Link href="/doctor/appointments">Back to My Appointments</Link>
        </Button>
      </div>
    );
  }

  if (appointment.status !== "COMPLETED") {
    return (
      <div className="page-shell text-center">
        <AlertCircle className="mx-auto h-12 w-12 text-destructive" />
        <h2 className="mt-4 text-xl font-semibold">Cannot Create Exam</h2>
        <p className="mt-2 text-muted-foreground">
          A medical exam can only be created for a &apos;COMPLETED&apos;
          appointment.
        </p>
        <Button className="mt-4" asChild>
          <Link href={`/doctor/appointments/${appointmentId}`}>
            Back to Appointment
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="page-shell space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/doctor/appointments/${appointmentId}`}>
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Create Medical Exam
          </h1>
          <p className="text-muted-foreground">
            Creating a new exam record for the completed appointment.
          </p>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <MedicalExamForm
            appointment={appointment}
            onSubmit={(values) => handleSubmit(values, "FINALIZED")}
            onSubmitWithStatus={handleSubmit}
            isSubmitting={createMutation.isPending}
            userRole={user?.role}
          />
        </CardContent>
      </Card>
    </div>
  );
}

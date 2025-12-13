"use client";

import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MedicalExamForm } from "../../_components/medical-exam-form";
import { MedicalExamFormValues } from "@/lib/schemas/medical-exam";
import {
  useMedicalExam,
  useUpdateMedicalExam,
} from "@/hooks/queries/useMedicalExam";
import { toast } from "sonner";
import { useAuth, UserRole } from "@/contexts/AuthContext"; // Import useAuth

import Link from "next/link";
import { Spinner } from "@/components/ui/spinner";

export default function EditMedicalExamPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth(); // Use useAuth to get the current user
  const { data: exam, isLoading, error } = useMedicalExam(params.id);
  const updateExamMutation = useUpdateMedicalExam();

  // Determine if the exam is editable based on status and user role
  const isExamEditable =
    user?.role === "ADMIN" || // Admin can edit any exam (admin override)
    (user?.role === "DOCTOR" &&
      exam?.status === "PENDING" &&
      exam?.doctor.id === user?.employeeId); // Doctor can edit if PENDING and assigned

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner className="text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">
          Loading exam details...
        </span>
      </div>
    );
  }

  if (error || !exam) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <p className="text-muted-foreground">Exam not found</p>
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
        </Button>
      </div>
    );
  }

  // If not editable, display a warning and prevent form access
  if (!isExamEditable) {
    return (
      <div className="mx-auto max-w-3xl">
        {" "}
        <Card className="p-8 text-center">
          {" "}
          <AlertCircle className="mx-auto h-12 w-12 text-amber-500" />{" "}
          <h2 className="mt-4 text-xl font-semibold">Cannot Edit Exam</h2>{" "}
          <p className="mt-2 text-muted-foreground">
            {" "}
            This exam cannot be edited because of its status ({" "}
            <span className="font-medium">{exam.status}</span>) or your
            permissions.{" "}
          </p>{" "}
          <Button className="mt-4" asChild>
            {" "}
            <Link href={`/admin/exams/${exam.id}`}>View Exam</Link>{" "}
          </Button>{" "}
        </Card>{" "}
      </div>
    );
  }

  const handleSubmit = async (
    data: MedicalExamFormValues,
    newStatus: "PENDING" | "FINALIZED"
  ) => {
    try {
      // Admins can change status to FINALIZED regardless of exam.status,
      // Doctors can only change status from PENDING to FINALIZED
      const statusToUpdate =
        user?.role === "ADMIN"
          ? newStatus
          : exam.status === "PENDING"
            ? newStatus
            : exam.status;

      await updateExamMutation.mutateAsync({
        id: exam.id,
        data: {
          status: statusToUpdate,
          diagnosis: data.diagnosis,
          symptoms: data.symptoms,
          treatment: data.treatment,
          temperature: data.temperature,
          bloodPressureSystolic: data.bloodPressureSystolic,
          bloodPressureDiastolic: data.bloodPressureDiastolic,
          heartRate: data.heartRate,
          weight: data.weight,
          height: data.height,
          notes: data.notes,
        },
      });
      toast.success("Medical exam updated successfully");
      router.push(`/admin/exams/${exam.id}`);
    } catch (error) {
      toast.error("Failed to update medical exam");
    }
  };

  const defaultValues: Partial<MedicalExamFormValues> = {
    appointmentId: exam.appointment.id,
    diagnosis: exam.diagnosis || "",
    symptoms: exam.symptoms || "",
    treatment: exam.treatment || "",
    temperature: exam.vitals?.temperature,
    bloodPressureSystolic: exam.vitals?.bloodPressureSystolic,
    bloodPressureDiastolic: exam.vitals?.bloodPressureDiastolic,
    heartRate: exam.vitals?.heartRate,
    weight: exam.vitals?.weight,
    height: exam.vitals?.height,
    notes: exam.notes || "",
  };

  return (
    <div className="w-full space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Edit Medical Exam
            </h1>
            <p className="text-muted-foreground">
              Patient: {exam.patient.fullName}
            </p>
          </div>
        </div>
        {/* Removed timeRemaining badge as it's no longer relevant with status-based editing */}
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Update Exam Details</CardTitle>
          <CardDescription>Modify the examination information.</CardDescription>
        </CardHeader>
        <CardContent>
          <MedicalExamForm
            defaultValues={defaultValues}
            onSubmit={() => {}} // onSubmit is not directly used here
            onSubmitWithStatus={handleSubmit}
            isSubmitting={updateExamMutation.isPending}
            currentExamStatus={exam.status} // Pass current status to form for conditional rendering
            userRole={user ? (user.role as UserRole) : undefined} // Explicitly cast
          />
        </CardContent>
      </Card>
    </div>
  );
}

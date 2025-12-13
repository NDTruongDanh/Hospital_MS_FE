"use client";

import { use, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MedicalExamForm } from "@/app/admin/exams/_components/medical-exam-form";
import { MedicalExamFormValues } from "@/lib/schemas/medical-exam";
import { useMedicalExam } from "@/hooks/queries/useMedicalExam";
import { useAuth } from "@/contexts/AuthContext";
import { AlertCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";

export default function EditDoctorMedicalExamPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { user } = useAuth();
  const { data: medicalExam, isLoading } = useMedicalExam(id);

  // Check permissions and edit window
  const isEditable =
    medicalExam &&
    user &&
    medicalExam.doctor?.id === user.employeeId &&
    medicalExam.status === "PENDING";

  useEffect(() => {
    if (medicalExam && user) {
      // Check if user is the creator
      if (medicalExam.doctor?.id !== user.employeeId) {
        router.push(`/doctor/exams/${id}`);
        return;
      }

      // Check if exam is editable (PENDING status)
      if (medicalExam.status !== "PENDING") {
        router.push(`/doctor/exams/${id}`);
      }
    }
  }, [medicalExam, user, id, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" variant="muted" />
      </div>
    );
  }

  if (!medicalExam) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-destructive">
            Medical Exam Not Found
          </h2>
          <Button onClick={() => router.push("/doctor/exams")} className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to My Exams
          </Button>
        </div>
      </div>
    );
  }

  if (!isEditable) {
    return (
      <div className="container mx-auto py-6 max-w-2xl">
        <Card className="p-8 text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-amber-500" />
          <h2 className="mt-4 text-xl font-semibold">Cannot Edit Exam</h2>
          <p className="mt-2 text-muted-foreground">
            This exam cannot be edited because it has been finalized or you are
            not the creator.
          </p>
          <Button
            className="mt-4"
            onClick={() => router.push(`/doctor/exams/${id}`)}
          >
            View Exam
          </Button>
        </Card>
      </div>
    );
  }

  const handleSubmit = async (
    data: MedicalExamFormValues,
    status: "PENDING" | "FINALIZED"
  ) => {
    try {
      // TODO: Implement updateMedicalExam mutation
      toast.error("Update functionality not implemented yet");
      // await updateExamMutation.mutateAsync({
      //   id,
      //   data: { ...data, status },
      // });
      // toast.success("Medical exam updated successfully");
      // router.push(`/doctor/exams/${id}`);
    } catch (error) {
      toast.error("Failed to update medical exam");
    }
  };

  return (
    <div className="container mx-auto py-6">
      <MedicalExamForm
        defaultValues={medicalExam}
        onSubmit={(data) => handleSubmit(data, "PENDING")}
        onSubmitWithStatus={handleSubmit}
        isSubmitting={false}
        userRole="DOCTOR"
        currentExamStatus={medicalExam.status}
      />
    </div>
  );
}

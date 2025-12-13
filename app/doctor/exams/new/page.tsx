"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { MedicalExamForm } from "@/app/admin/exams/_components/medical-exam-form";
import { MedicalExamFormValues } from "@/lib/schemas/medical-exam";
import { useCreateMedicalExam } from "@/hooks/queries/useMedicalExam";
import { useAppointment } from "@/hooks/queries/useAppointment";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function CreateMedicalExamPage() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const appointmentId = searchParams.get("appointmentId");
  const createExamMutation = useCreateMedicalExam();
  const [showPrescriptionPrompt, setShowPrescriptionPrompt] = useState(false);
  const [createdExamId, setCreatedExamId] = useState<string | null>(null);

  // Fetch appointment details if appointmentId exists
  const { data: appointment } = useAppointment(appointmentId || "");

  useEffect(() => {
    // Only doctors can create exams
    if (user && user.role !== "DOCTOR") {
      router.push("/");
    }
  }, [user, router]);

  if (!user || user.role !== "DOCTOR") {
    return null;
  }

  const handleSubmit = async (
    data: MedicalExamFormValues,
    status: "PENDING" | "FINALIZED"
  ) => {
    try {
      const result = await createExamMutation.mutateAsync({
        ...data,
        status,
      });

      const examId = result.data.data.id;
      toast.success("Medical exam created successfully");

      // Show prompt to add prescription
      setCreatedExamId(examId);
      setShowPrescriptionPrompt(true);
    } catch (error) {
      // Error handling is done in the mutation
    }
  };

  const handleAddPrescription = () => {
    if (createdExamId) {
      router.push(`/doctor/exams/${createdExamId}/prescription`);
    }
  };

  const handleViewExam = () => {
    if (createdExamId) {
      router.push(`/doctor/exams/${createdExamId}`);
    }
  };

  return (
    <>
      <div className="container mx-auto py-6">
        <MedicalExamForm
          onSubmit={(data) => handleSubmit(data, "PENDING")}
          onSubmitWithStatus={handleSubmit}
          isSubmitting={createExamMutation.isPending}
          userRole="DOCTOR"
          defaultAppointmentId={appointmentId || undefined}
          appointment={appointment}
        />
      </div>

      <AlertDialog
        open={showPrescriptionPrompt}
        onOpenChange={setShowPrescriptionPrompt}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Add Prescription?</AlertDialogTitle>
            <AlertDialogDescription>
              Medical exam created successfully. Would you like to add a
              prescription for this exam now?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleViewExam}>
              Later
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleAddPrescription}>
              Add Prescription
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

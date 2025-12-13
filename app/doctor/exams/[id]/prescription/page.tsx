"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import {
  useCreatePrescription,
  useMedicalExam,
} from "@/hooks/queries/useMedicalExam";
import { PrescriptionForm } from "@/app/admin/exams/_components/prescription-form";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { PrescriptionFormValues } from "@/lib/schemas/medical-exam";
import { toast } from "sonner";

export default function CreateDoctorPrescriptionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { user } = useAuth();
  const { data: medicalExam, isLoading } = useMedicalExam(id);
  const { mutateAsync: createPrescription, isPending } =
    useCreatePrescription(id);

  const onSubmit = async (data: PrescriptionFormValues) => {
    try {
      await createPrescription(data);
      toast.success("Prescription created successfully");
      router.push(`/doctor/exams/${id}`);
    } catch (error) {
      // The hook's onError will handle the toast
    }
  };

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

  // Check if doctor is the creator
  if (medicalExam.doctor?.id !== user?.employeeId) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-destructive">Access Denied</h2>
          <p className="text-muted-foreground mt-2">
            Only the doctor who created this exam can add a prescription.
          </p>
          <Button onClick={() => router.push("/doctor/exams")} className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to My Exams
          </Button>
        </div>
      </div>
    );
  }

  // Check if prescription already exists
  if (medicalExam.prescription) {
    router.push(`/doctor/exams/${id}`);
    return null;
  }

  return (
    <div className="container mx-auto py-6">
      <PrescriptionForm onSubmit={onSubmit} isSubmitting={isPending} />
    </div>
  );
}

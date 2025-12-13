"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Printer } from "lucide-react";
import { useMedicalExam } from "@/hooks/queries/useMedicalExam";
import { MedicalExamDetailView } from "@/app/admin/exams/_components/MedicalExamDetailView";
import { useAuth } from "@/contexts/AuthContext";
import { Spinner } from "@/components/ui/spinner";

export default function PatientMedicalRecordDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { user } = useAuth();
  const { data: medicalExam, isLoading, error } = useMedicalExam(id);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" variant="muted" />
      </div>
    );
  }

  if (error || !medicalExam) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-destructive">
            Medical Record Not Found
          </h2>
          <p className="text-muted-foreground mt-2">
            The medical record you're looking for doesn't exist or you don't
            have permission to view it.
          </p>
          <Button
            onClick={() => router.push("/patient/medical-records")}
            className="mt-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to My Records
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header with Actions */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={() => router.push("/patient/medical-records")}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to My Records
        </Button>

        <Button variant="outline" onClick={() => window.print()}>
          <Printer className="mr-2 h-4 w-4" />
          Print
        </Button>
      </div>

      {/* Medical Exam Detail */}
      <MedicalExamDetailView medicalExam={medicalExam} userRole="PATIENT" />
    </div>
  );
}

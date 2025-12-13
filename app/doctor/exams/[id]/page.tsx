"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit, FilePlus, Printer } from "lucide-react";
import { useMedicalExam } from "@/hooks/queries/useMedicalExam";
import { MedicalExamDetailView } from "@/app/admin/exams/_components/MedicalExamDetailView";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import { Spinner } from "@/components/ui/spinner";

export default function DoctorMedicalExamDetailPage({
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
            Medical Exam Not Found
          </h2>
          <p className="text-muted-foreground mt-2">
            The medical exam you're looking for doesn't exist or you don't have
            permission to view it.
          </p>
          <Button onClick={() => router.push("/doctor/exams")} className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to My Exams
          </Button>
        </div>
      </div>
    );
  }

  // Check if doctor is the creator
  const isCreator = medicalExam.doctor?.id === user?.employeeId;

  // Check if exam is editable (within 24 hours)
  const examDate = new Date(medicalExam.examDate);
  const now = new Date();
  const hoursSinceExam =
    (now.getTime() - examDate.getTime()) / (1000 * 60 * 60);
  const isEditable = isCreator && hoursSinceExam < 24;

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header with Actions */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={() => router.push("/doctor/exams")}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to My Exams
        </Button>

        <div className="flex gap-2">
          {isEditable && (
            <Button asChild variant="outline">
              <Link href={`/doctor/exams/${id}/edit`}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Exam
              </Link>
            </Button>
          )}

          {isCreator && !medicalExam.prescription && (
            <Button asChild>
              <Link href={`/doctor/exams/${id}/prescription`}>
                <FilePlus className="mr-2 h-4 w-4" />
                Add Prescription
              </Link>
            </Button>
          )}

          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
        </div>
      </div>

      {/* Medical Exam Detail */}
      <MedicalExamDetailView
        medicalExam={medicalExam}
        userRole="DOCTOR"
        patientProfileBaseHref="/doctor/patients"
      />
    </div>
  );
}

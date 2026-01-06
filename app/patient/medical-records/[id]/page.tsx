"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Printer, Pill, FileText } from "lucide-react";
import { useMedicalExam } from "@/hooks/queries/useMedicalExam";
import { MedicalExamDetailView } from "@/app/admin/exams/_components/MedicalExamDetailView";
import { useAuth } from "@/contexts/AuthContext";
import { Spinner } from "@/components/ui/spinner";
import Link from "next/link";

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
        <Card className="p-8 text-center">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-bold tracking-tight text-destructive">
            Không tìm thấy hồ sơ khám bệnh
          </h2>
          <p className="text-muted-foreground mt-2">
            Hồ sơ bạn đang tìm không tồn tại hoặc bạn không có quyền xem.
          </p>
          <Button
            onClick={() => router.push("/patient/medical-records")}
            className="mt-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Quay lại danh sách
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header with Actions */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <Button
          variant="ghost"
          onClick={() => router.push("/patient/medical-records")}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Quay lại danh sách
        </Button>

        <div className="flex gap-2 flex-wrap">
          {/* View Prescription Button - only show if prescription exists */}
          {medicalExam.prescription && (
            <Button asChild variant="outline">
              <Link href={`/patient/medical-records/${id}/prescription`}>
                <Pill className="mr-2 h-4 w-4" />
                Xem đơn thuốc
              </Link>
            </Button>
          )}

          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="mr-2 h-4 w-4" />
            In
          </Button>
        </div>
      </div>

      {/* Medical Exam Detail - Patient view only, no edit capabilities */}
      {/* LabSection is already included inside MedicalExamDetailView */}
      <MedicalExamDetailView
        medicalExam={medicalExam}
        userRole="PATIENT"
        patientProfileBaseHref="/patient/profile"
        examBaseHref="/patient/medical-records"
        appointmentBaseHref="/patient/appointments"
      />
    </div>
  );
}

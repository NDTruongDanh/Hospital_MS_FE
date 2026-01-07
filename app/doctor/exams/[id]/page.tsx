"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { useMedicalExam } from "@/hooks/queries/useMedicalExam";
import { MedicalExamDetailView } from "@/app/admin/exams/_components/MedicalExamDetailView";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import { useMyEmployeeProfile } from "@/hooks/queries/useHr";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DoctorMedicalExamDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { user } = useAuth();
  const { data: medicalExam, isLoading, error, refetch } = useMedicalExam(id);

  // Get current doctor's employee profile for proper isCreator check
  const { data: myProfile } = useMyEmployeeProfile();
  const myEmployeeId = myProfile?.id || user?.employeeId;

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Header skeleton */}
        <Skeleton className="h-40 w-full rounded-2xl" />
        {/* Stats skeleton */}
        <Skeleton className="h-20 w-full rounded-xl" />
        {/* Content skeleton */}
        <div className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-2 space-y-6">
            <Skeleton className="h-64 w-full rounded-xl" />
            <Skeleton className="h-48 w-full rounded-xl" />
            <Skeleton className="h-32 w-full rounded-xl" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-40 w-full rounded-xl" />
            <Skeleton className="h-40 w-full rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !medicalExam) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] py-12">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-rose-500 to-red-500 p-8 text-white text-center max-w-md">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute -top-16 -right-16 w-48 h-48 bg-white rounded-full" />
          </div>
          <div className="relative z-10">
            <div className="h-16 w-16 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="h-8 w-8" />
            </div>
            <h2 className="text-xl font-bold mb-2">Không tìm thấy phiếu khám</h2>
            <p className="text-white/80 mb-6">
              Phiếu khám bạn tìm không tồn tại hoặc bạn không có quyền xem.
            </p>
            <Button
              variant="outline"
              className="bg-white/10 border-white/30 text-white hover:bg-white/20"
              onClick={() => router.push("/doctor/exams")}
            >
              Quay lại danh sách
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Check if doctor is the creator using fetched employeeId
  const isCreator = medicalExam.doctor?.id === myEmployeeId;

  return (
    <div className="space-y-6">
      {/* Medical Exam Detail - Enhanced Component */}
      <MedicalExamDetailView
        medicalExam={medicalExam}
        userRole="DOCTOR"
        patientProfileBaseHref="/doctor/patients"
        examBaseHref="/doctor/exams"
        appointmentBaseHref="/doctor/appointments"
        currentEmployeeId={myEmployeeId}
      />
    </div>
  );
}

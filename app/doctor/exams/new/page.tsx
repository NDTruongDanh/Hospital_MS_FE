"use client";

import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { MedicalExamForm } from "@/app/admin/exams/_components/medical-exam-form";
import { MedicalExamFormValues } from "@/lib/schemas/medical-exam";
import { useCreateMedicalExam, useUpdateMedicalExam, useMedicalExamByAppointment } from "@/hooks/queries/useMedicalExam";
import { useAppointment } from "@/hooks/queries/useAppointment";
import { useCompleteAppointment } from "@/hooks/queries/useQueue";
import { useAuth } from "@/contexts/AuthContext";
import { Suspense, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
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
import {
  ArrowLeft,
  Stethoscope,
  Pill,
  FileText,
  Loader2,
  Activity,
} from "lucide-react";

function CreateMedicalExamPageClient() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const appointmentId = searchParams.get("appointmentId");
  const createExamMutation = useCreateMedicalExam();
  const updateExamMutation = useUpdateMedicalExam();
  const completeAppointmentMutation = useCompleteAppointment();
  const [showPrescriptionPrompt, setShowPrescriptionPrompt] = useState(false);
  const [createdExamId, setCreatedExamId] = useState<string | null>(null);

  // Fetch appointment details if appointmentId exists
  const { data: appointment, isLoading: isLoadingAppointment } = useAppointment(appointmentId || "");

  // Fetch existing medical exam for this appointment (nurse may have created one with vital signs)
  const { data: existingExam, isLoading: isLoadingExistingExam } = useMedicalExamByAppointment(
    appointmentId || "",
    !!appointmentId
  );

  // Determine if we're editing an existing exam (created by nurse with vital signs)
  const isEditing = !!existingExam;

  useEffect(() => {
    // Only doctors can create exams
    if (user && user.role !== "DOCTOR") {
      router.push("/");
    }
  }, [user, router]);

  // If exam exists and is already FINALIZED, redirect to view
  useEffect(() => {
    if (existingExam && existingExam.status === "FINALIZED") {
      toast.info("Phiếu khám đã hoàn thành. Đang chuyển đến trang chi tiết...");
      router.push(`/doctor/exams/${existingExam.id}`);
    }
  }, [existingExam, router]);

  if (!user || user.role !== "DOCTOR") {
    return null;
  }

  // Show loading while checking for existing exam
  if ((isLoadingAppointment || isLoadingExistingExam) && appointmentId) {
    return (
      <div className="space-y-6">
        {/* Header skeleton */}
        <Skeleton className="h-32 w-full rounded-2xl" />
        {/* Content skeleton */}
        <div className="space-y-4">
          <Skeleton className="h-40 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-xl" />
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  // If exam is finalized, show redirect message
  if (existingExam?.status === "FINALIZED") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <Loader2 className="h-8 w-8 animate-spin text-violet-500 mb-4" />
        <p className="text-muted-foreground">
          Phiếu khám đã hoàn thành. Đang chuyển hướng...
        </p>
      </div>
    );
  }

  const handleSubmit = async (
    data: MedicalExamFormValues,
    status: "PENDING" | "FINALIZED"
  ) => {
    try {
      let examId: string;

      if (isEditing && existingExam) {
        // Update existing exam (nurse created with vital signs, doctor adds diagnosis/treatment)
        await updateExamMutation.mutateAsync({
          id: existingExam.id,
          data: {
            ...data,
            status,
          },
        });
        examId = existingExam.id;
        toast.success("Đã cập nhật phiếu khám thành công!");
      } else {
        // Create new exam
        const result = await createExamMutation.mutateAsync({
          data: {
            ...data,
            status,
          },
          doctorInfo: user?.employeeId
            ? { id: user.employeeId, fullName: user.fullName || "Doctor" }
            : undefined,
          patientInfo: appointment?.patient
            ? { id: appointment.patient.id, fullName: appointment.patient.fullName }
            : undefined,
        });
        examId = result.id;
        toast.success("Đã tạo phiếu khám thành công!");
      }

      // Auto-complete the appointment if it exists
      if (appointmentId) {
        try {
          await completeAppointmentMutation.mutateAsync(appointmentId);
          console.log("Appointment auto-completed:", appointmentId);
        } catch (err) {
          // Non-critical error, just log it
          console.warn("Could not auto-complete appointment:", err);
        }
      }

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

  // Prepare default values from existing exam (nurse's vital signs)
  const defaultValuesFromExam = existingExam
    ? {
        appointmentId: existingExam.appointment?.id || appointmentId || "",
        temperature: existingExam.vitals?.temperature,
        bloodPressureSystolic: existingExam.vitals?.bloodPressureSystolic,
        bloodPressureDiastolic: existingExam.vitals?.bloodPressureDiastolic,
        heartRate: existingExam.vitals?.heartRate,
        weight: existingExam.vitals?.weight,
        height: existingExam.vitals?.height,
        diagnosis: existingExam.diagnosis || "",
        symptoms: existingExam.symptoms || "",
        treatment: existingExam.treatment || "",
        notes: existingExam.notes || "",
      }
    : undefined;

  return (
    <>
      <div className="space-y-6">
        {/* Gradient Header */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-violet-600 via-purple-500 to-fuchsia-500 p-6 text-white shadow-lg">
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -translate-y-32 translate-x-32" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full translate-y-24 -translate-x-24" />
          </div>

          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-4">
              <Button
                variant="ghost"
                size="icon"
                asChild
                className="bg-white/10 hover:bg-white/20 text-white"
              >
                <Link href="/doctor/appointments">
                  <ArrowLeft className="h-5 w-5" />
                </Link>
              </Button>
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                  <Stethoscope className="h-7 w-7" />
                  {isEditing ? "Tiếp tục Khám Bệnh" : "Tạo Phiếu Khám Bệnh"}
                </h1>
                <p className="text-white/80 text-sm mt-1">
                  {appointment
                    ? `Cho bệnh nhân: ${appointment.patient.fullName}`
                    : "Chọn cuộc hẹn để bắt đầu"}
                </p>
              </div>
            </div>

            {/* Quick info badges */}
            {(appointment || existingExam) && (
              <div className="flex flex-wrap gap-2 mt-4">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-sm">
                  <FileText className="h-4 w-4" />
                  ID: {appointmentId?.slice(0, 8)}...
                </span>
                {existingExam && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/80 text-sm">
                    <Activity className="h-4 w-4" />
                    Đã có Vital Signs từ Y tá
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Form */}
        <MedicalExamForm
          onSubmit={(data) => handleSubmit(data, "PENDING")}
          onSubmitWithStatus={handleSubmit}
          isSubmitting={createExamMutation.isPending || updateExamMutation.isPending}
          userRole="DOCTOR"
          defaultAppointmentId={appointmentId || undefined}
          appointment={appointment}
          defaultValues={defaultValuesFromExam}
          isEditMode={isEditing}
          currentExamStatus={existingExam?.status}
        />
      </div>

      {/* Prescription Prompt Dialog */}
      <AlertDialog
        open={showPrescriptionPrompt}
        onOpenChange={setShowPrescriptionPrompt}
      >
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Pill className="h-5 w-5 text-violet-500" />
              Thêm đơn thuốc?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Phiếu khám đã được {isEditing ? "cập nhật" : "tạo"} thành công. Bạn có muốn kê đơn thuốc cho
              bệnh nhân ngay bây giờ không?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleViewExam}>
              Để sau
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleAddPrescription}
              className="bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600"
            >
              <Pill className="h-4 w-4 mr-2" />
              Thêm đơn thuốc
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default function CreateMedicalExamPage() {
  return (
    <Suspense fallback={<div className="p-6" />}>
      <CreateMedicalExamPageClient />
    </Suspense>
  );
}

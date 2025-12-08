"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MedicalExamForm } from "../_components/medical-exam-form";
import { MedicalExamFormValues } from "@/lib/schemas/medical-exam";
import { useCreateMedicalExam } from "@/hooks/queries/useMedicalExam";
import { toast } from "sonner";

import { useAuth } from "@/contexts/AuthContext"; // Import useAuth
import { UserRole } from "@/hooks/use-auth"; // Import UserRole

export default function NewMedicalExamPage() {
  const router = useRouter();
  const { user } = useAuth(); // Use useAuth hook to get the user
  const createExamMutation = useCreateMedicalExam();

  const handleSubmit = async (data: MedicalExamFormValues, status: "PENDING" | "FINALIZED") => {
    try {
      await createExamMutation.mutateAsync({
        appointmentId: data.appointmentId,
        status,
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
      });
      toast.success("Medical exam created successfully");
      router.push("/admin/exams");
    } catch (error) {
      toast.error("Failed to create medical exam");
    }
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
                Create Medical Exam
              </h1>
              <p className="text-muted-foreground">
                Record vitals, diagnosis, and treatment plan.
              </p>
            </div>
          </div>
        </div>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Exam Details</CardTitle>
            <CardDescription>
              Enter the patient examination information
            </CardDescription>
          </CardHeader>
          <CardContent>
                      <MedicalExamForm
                        onSubmit={() => {}}
                        onSubmitWithStatus={handleSubmit}
                        isSubmitting={createExamMutation.isPending}
                        userRole={user ? (user.role as UserRole) : undefined}
                        currentExamStatus="PENDING" // For new exams, status is pending initially
                      />          </CardContent>
        </Card>
      </div>  );
}

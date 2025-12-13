"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Printer } from "lucide-react";
import { usePrescriptionByExam } from "@/hooks/queries/useMedicalExam";
import { PrescriptionDetailView } from "@/app/admin/exams/_components/PrescriptionDetailView";
import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/contexts/AuthContext";

export default function PatientPrescriptionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { user } = useAuth();
  const { data: prescription, isLoading, error } = usePrescriptionByExam(id);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner className="h-8 w-8 text-muted-foreground" />
      </div>
    );
  }

  if (error || !prescription) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-destructive">
            Prescription Not Found
          </h2>
          <p className="text-muted-foreground mt-2">
            The prescription you're looking for doesn't exist or you don't have
            permission to view it.
          </p>
          <Button
            onClick={() => router.push("/patient/prescriptions")}
            className="mt-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to My Prescriptions
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
          onClick={() => router.push("/patient/prescriptions")}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to My Prescriptions
        </Button>

        <Button variant="outline" onClick={() => window.print()}>
          <Printer className="mr-2 h-4 w-4" />
          Print
        </Button>
      </div>

      {/* Prescription Detail */}
      <PrescriptionDetailView prescription={prescription} userRole="PATIENT" />
    </div>
  );
}

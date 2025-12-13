"use client";

import { usePrescriptionByExam } from "@/hooks/queries/useMedicalExam";
import { useParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { PrescriptionDetailView } from "../../../_components/PrescriptionDetailView";
import { useAuth } from "@/contexts/AuthContext";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { Spinner } from "@/components/ui/spinner";

export default function PrescriptionDetailPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const examId = params.id as string;

  const {
    data: prescription,
    isLoading,
    isError,
    error,
  } = usePrescriptionByExam(examId);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Spinner size="lg" className="text-primary" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="container mx-auto py-10">
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Failed to load prescription:{" "}
            {error?.message || "An unknown error occurred."}
            {error?.response?.status === 404 && (
              <p>No prescription found for this medical exam.</p>
            )}
          </AlertDescription>
        </Alert>
        <div className="flex justify-center mt-4">
          <Button onClick={() => router.back()}>Go Back</Button>
        </div>
      </div>
    );
  }

  if (!prescription) {
    return (
      <div className="container mx-auto py-10">
        <Alert>
          <AlertTitle>Not Found</AlertTitle>
          <AlertDescription>
            No prescription was found for this medical exam.
          </AlertDescription>
        </Alert>
        <div className="flex justify-center mt-4">
          <Button onClick={() => router.back()}>Go Back</Button>
        </div>
      </div>
    );
  }

  return (
    <RoleGuard allowedRoles={["ADMIN", "DOCTOR", "NURSE", "PATIENT"]}>
      <PrescriptionDetailView
        prescription={prescription}
        userRole={user?.role}
      />
    </RoleGuard>
  );
}

"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pill, FileText } from "lucide-react";
import { format } from "date-fns";
import { useMedicalExamList } from "@/hooks/queries/useMedicalExam";
import { useAuth } from "@/contexts/AuthContext";
import { Spinner } from "@/components/ui/spinner";

export default function PatientPrescriptionsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [page, setPage] = useState(0);
  const pageSize = 10;

  // Get patientId from authenticated user
  const patientId = user?.patientId || "";

  const { data, isLoading } = useMedicalExamList({
    patientId,
    page,
    size: pageSize,
    sort: "examDate,desc",
  });

  // Filter for exams that have prescriptions
  const allExams = data?.data?.content || [];
  const examsWithPrescriptions = useMemo(
    () => allExams.filter((exam) => exam.prescription),
    [allExams]
  );

  const prescriptions = examsWithPrescriptions.map((exam) => ({
    id: exam.id,
    examId: exam.id,
    prescription: exam.prescription,
    doctor: exam.doctor,
    prescribedAt: exam.examDate,
    patient: exam.patient,
  }));

  const totalElements = prescriptions.length;

  if (!user || user.role !== "PATIENT") {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-destructive">Access Denied</h2>
          <p className="text-muted-foreground mt-2">
            Only patients can access prescriptions.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Prescriptions</h1>
        <p className="text-muted-foreground">
          View your prescribed medications and dosage instructions
        </p>
      </div>

      {/* Prescriptions List */}
      {isLoading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <Spinner size="lg" variant="muted" />
        </div>
      ) : prescriptions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center min-h-[400px] text-center">
            <Pill className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">No Prescriptions Found</h3>
            <p className="text-muted-foreground mt-2">
              You don't have any prescriptions yet.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {prescriptions.map((prescription: any) => (
            <Card
              key={prescription.id}
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() =>
                router.push(`/patient/prescriptions/${prescription.id}`)
              }
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Pill className="h-5 w-5 text-blue-500" />
                      <span className="text-lg font-semibold">
                        Prescription #{prescription.id.slice(0, 8)}
                      </span>
                    </div>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <div>
                        <span className="font-medium">Prescribed by:</span>{" "}
                        {prescription.doctor?.fullName || "Unknown Doctor"}
                      </div>
                      <div>
                        <span className="font-medium">Date:</span>{" "}
                        {format(
                          new Date(prescription.prescribedAt),
                          "MMMM dd, yyyy"
                        )}
                      </div>
                      <div>
                        <span className="font-medium">Medicines:</span>{" "}
                        {prescription.itemCount}{" "}
                        {prescription.itemCount === 1 ? "item" : "items"}
                      </div>
                    </div>
                  </div>
                  <Button size="sm" variant="ghost">
                    View Details →
                  </Button>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalElements > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {prescriptions.length} prescription
            {prescriptions.length !== 1 ? "s" : ""}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!data?.data || page >= data.data.totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

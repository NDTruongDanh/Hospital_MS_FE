"use client";

import { useEffect, useState } from "react";
import { MedicalExam } from "@/interfaces/medical-exam";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  format,
  formatDistanceToNow,
  differenceInMilliseconds,
} from "date-fns";
import { VitalsPanel } from "@/components/medical-exam/VitalsPanel";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Printer, Edit, PlusCircle, ArrowLeft, Clock } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth, UserRole } from "@/contexts/AuthContext";
import { usePatient } from "@/hooks/queries/usePatient";
import { useAppointment } from "@/hooks/queries/useAppointment";
import { Badge } from "@/components/ui/badge";

interface MedicalExamDetailViewProps {
  medicalExam: MedicalExam;
  userRole?: UserRole;
  patientProfileBaseHref?: string; // Base path for patient profile link (default: /admin/patients)
}

export function MedicalExamDetailView({
  medicalExam,
  userRole,
  patientProfileBaseHref = "/admin/patients",
}: MedicalExamDetailViewProps) {
  const router = useRouter();
  const { user } = useAuth();

  const { data: patientData } = usePatient(medicalExam.patient.id);
  const { data: appointmentData } = useAppointment(medicalExam.appointment.id);

  const [timeLeft, setTimeLeft] = useState("");

  const createdAt = new Date(medicalExam.createdAt);
  const expiresAt = createdAt.getTime() + 24 * 60 * 60 * 1000;
  const isEditable = new Date().getTime() < expiresAt;

  useEffect(() => {
    if (isEditable) {
      const timer = setInterval(() => {
        const diff = differenceInMilliseconds(expiresAt, new Date());
        if (diff <= 0) {
          setTimeLeft("Read-only");
          clearInterval(timer);
        } else {
          setTimeLeft(
            formatDistanceToNow(expiresAt, {
              addSuffix: true,
              includeSeconds: true,
            }).replace("in", "")
          );
        }
      }, 1000);
      return () => clearInterval(timer);
    } else {
      setTimeLeft("Read-only");
    }
  }, [isEditable, expiresAt]);

  const canEdit =
    userRole === "DOCTOR" &&
    user?.employeeId === medicalExam.doctor.id &&
    isEditable;
  const canAddPrescription =
    userRole === "DOCTOR" &&
    user?.employeeId === medicalExam.doctor.id &&
    !medicalExam.hasPrescription;

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <div className="flex items-center gap-2">
          {canEdit && (
            <Button asChild>
              <Link href={`/doctor/exams/${medicalExam.id}/edit`}>
                <Edit className="h-4 w-4 mr-2" /> Edit
              </Link>
            </Button>
          )}
          {canAddPrescription && (
            <Button asChild>
              <Link href={`/doctor/exams/${medicalExam.id}/prescription`}>
                <PlusCircle className="h-4 w-4 mr-2" /> Add Prescription
              </Link>
            </Button>
          )}
          <Button variant="outline">
            <Printer className="h-4 w-4 mr-2" /> Print
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>Medical Exam #{medicalExam.id}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {format(new Date(medicalExam.examDate), "PPP")}
              </p>
            </div>
            <Badge
              variant={isEditable ? "default" : "secondary"}
              className="flex items-center gap-2"
            >
              <Clock className="h-4 w-4" />
              {isEditable ? `Editable: ${timeLeft} left` : "Read-only"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Patient Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p>
                <strong>Name:</strong> {medicalExam.patient.fullName}
              </p>
              <p>
                <strong>DOB:</strong>{" "}
                {patientData
                  ? format(new Date(patientData.dateOfBirth), "PPP")
                  : "Loading..."}
              </p>
              <p>
                <strong>Gender:</strong> {patientData?.gender || "Loading..."}
              </p>
              <Button variant="link" className="p-0 h-auto">
                <Link
                  href={`${patientProfileBaseHref}/${medicalExam.patient.id}`}
                >
                  View Patient Profile →
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Appointment Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p>
                <strong>Date & Time:</strong>{" "}
                {format(
                  new Date(medicalExam.appointment.appointmentTime),
                  "PPPp"
                )}
              </p>
              <p>
                <strong>Type:</strong> {appointmentData?.type || "Loading..."}
              </p>
              <p>
                <strong>Reason:</strong>{" "}
                {appointmentData?.reason || "Loading..."}
              </p>
              <Button variant="link" className="p-0 h-auto">
                <Link
                  href={`/admin/appointments/${medicalExam.appointment.id}`}
                >
                  View Appointment →
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Clinical Findings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold">Diagnosis</h3>
                <p className="text-muted-foreground">
                  {medicalExam.diagnosis || "N/A"}
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold">Symptoms</h3>
                <p className="text-muted-foreground">
                  {medicalExam.symptoms || "N/A"}
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold">Treatment Plan</h3>
                <p className="text-muted-foreground">
                  {medicalExam.treatment || "N/A"}
                </p>
              </div>
            </CardContent>
          </Card>

          {medicalExam.vitals && (
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Vital Signs</CardTitle>
              </CardHeader>
              <CardContent>
                <VitalsPanel vitals={medicalExam.vitals} showStatus />
              </CardContent>
            </Card>
          )}

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Doctor's Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                {medicalExam.notes || "N/A"}
              </p>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Prescription</CardTitle>
            </CardHeader>
            <CardContent>
              {medicalExam.hasPrescription ? (
                <div className="flex items-center justify-between">
                  <p className="text-muted-foreground">
                    💊 Prescription created on{" "}
                    {format(new Date(medicalExam.createdAt), "PPP")}
                  </p>
                  <Button variant="link" className="p-0 h-auto">
                    <Link
                      href={`/admin/exams/${medicalExam.id}/prescription/view`}
                    >
                      View Prescription →
                    </Link>
                  </Button>
                </div>
              ) : (
                <p className="text-muted-foreground">
                  No prescription created yet.
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Audit Information</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground text-sm space-y-1">
              <p>
                <strong>Created:</strong>{" "}
                {format(new Date(medicalExam.createdAt), "PPPp")} by{" "}
                {medicalExam.doctor.fullName}
              </p>
              <p>
                <strong>Last Updated:</strong>{" "}
                {format(new Date(medicalExam.updatedAt), "PPPp")}
              </p>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
}

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
import {
  Printer,
  Edit,
  PlusCircle,
  ArrowLeft,
  Clock,
  Stethoscope,
  User,
  Calendar,
  FileText,
  Heart,
  Pill,
  Receipt,
  ExternalLink,
  FlaskConical,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth, UserRole } from "@/contexts/AuthContext";
import { usePatient } from "@/hooks/queries/usePatient";
import { useAppointment } from "@/hooks/queries/useAppointment";
import { Badge } from "@/components/ui/badge";
import { StatsSummaryBar } from "@/components/ui/stats-summary-bar";
import { InfoItem, InfoGrid } from "@/components/ui/info-item";
import { LabOrdersSection } from "@/components/lab/LabOrdersSection";
import { OrderLabOrderDialog } from "@/components/lab/OrderLabOrderDialog";

interface MedicalExamDetailViewProps {
  medicalExam: MedicalExam;
  userRole?: UserRole;
  patientProfileBaseHref?: string;
  examBaseHref?: string; // Base path for exam-related links
  appointmentBaseHref?: string; // Base path for appointment links
}

export function MedicalExamDetailView({
  medicalExam,
  userRole,
  patientProfileBaseHref = "/admin/patients",
  examBaseHref = "/admin/exams", // Default to admin path
  appointmentBaseHref = "/admin/appointments", // Default to admin path
}: MedicalExamDetailViewProps) {
  const router = useRouter();
  const { user } = useAuth();

  // Only fetch additional patient data if not a PATIENT (they may not have permission)
  const { data: patientData } = usePatient(
    userRole !== "PATIENT" ? medicalExam.patient.id : ""
  );
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
  // Allow ADMIN and DOCTOR roles to add prescriptions
  // DOCTOR can only add to their own exams, ADMIN can add to any exam
  const canAddPrescription =
    !medicalExam.hasPrescription &&
    (userRole === "ADMIN" ||
      (userRole === "DOCTOR" && user?.employeeId === medicalExam.doctor.id));

  return (
    <div className="space-y-6">
      {/* Sky Blue Gradient Header */}
      <div className="relative rounded-xl bg-gradient-to-r from-sky-500 to-cyan-500 p-6 text-white overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-white" />
          <div className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full bg-white" />
        </div>

        <div className="relative flex items-start justify-between gap-6">
          <div className="flex items-center gap-5">
            {/* Back button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
              className="text-white/90 hover:text-white hover:bg-white/20 shrink-0"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>

            {/* Icon */}
            <div className="h-16 w-16 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <Stethoscope className="h-8 w-8 text-white" />
            </div>

            {/* Title & Meta */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight">
                  Medical Exam
                </h1>
                <Badge
                  variant={isEditable ? "default" : "secondary"}
                  className={
                    isEditable
                      ? "bg-white/20 text-white border-white/30"
                      : "bg-white/10 text-white/80 border-white/20"
                  }
                >
                  <Clock className="h-3 w-3 mr-1" />
                  {isEditable ? `${timeLeft} left` : "Read-only"}
                </Badge>
              </div>
              <p className="text-white/80 text-sm font-medium">
                {format(new Date(medicalExam.examDate), "PPP")} •{" "}
                {medicalExam.patient.fullName}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              className="bg-white/10 border-white/30 text-white hover:bg-white/20"
            >
              <Printer className="mr-2 h-4 w-4" />
              Print
            </Button>
            {canEdit && (
              <Button
                size="sm"
                asChild
                className="bg-white/10 border-white/30 text-white hover:bg-white/20"
                variant="outline"
              >
                <Link href={`/doctor/exams/${medicalExam.id}/edit`}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Link>
              </Button>
            )}
            {canAddPrescription && (
              <Button
                size="sm"
                asChild
                className="bg-white text-sky-600 hover:bg-white/90"
              >
                <Link href={`${examBaseHref}/${medicalExam.id}/prescription`}>
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Add Prescription
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Stats Summary Bar */}
      <StatsSummaryBar
        stats={[
          {
            label: "Patient",
            value: medicalExam.patient.fullName,
            icon: <User className="h-5 w-5" />,
            color: "sky",
          },
          {
            label: "Doctor",
            value: medicalExam.doctor.fullName,
            icon: <Stethoscope className="h-5 w-5" />,
            color: "violet",
          },
          {
            label: "Prescription",
            value: medicalExam.hasPrescription ? "Yes" : "No",
            icon: <Pill className="h-5 w-5" />,
            color: medicalExam.hasPrescription ? "emerald" : "slate",
          },
          {
            label: "Status",
            value: isEditable ? "Active" : "Archived",
            icon: <FileText className="h-5 w-5" />,
            color: isEditable ? "emerald" : "slate",
          },
        ]}
      />

      <div className="grid gap-6 md:grid-cols-3">
        {/* Main Content - 2 columns */}
        <div className="md:col-span-2 space-y-6">
          {/* Clinical Findings */}
          <Card className="border-2 border-slate-200 shadow-md rounded-xl">
            <CardHeader className="bg-slate-50 border-b">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-sky-600" />
                Clinical Findings
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div>
                <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-2">
                  Diagnosis
                </h4>
                <p className="text-slate-800 text-lg">
                  {medicalExam.diagnosis || (
                    <span className="text-slate-400 italic">
                      No diagnosis recorded
                    </span>
                  )}
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-2">
                    Symptoms
                  </h4>
                  <p className="text-slate-700">
                    {medicalExam.symptoms || (
                      <span className="text-slate-400 italic">
                        No symptoms recorded
                      </span>
                    )}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-2">
                    Treatment Plan
                  </h4>
                  <p className="text-slate-700">
                    {medicalExam.treatment || (
                      <span className="text-slate-400 italic">
                        No treatment recorded
                      </span>
                    )}
                  </p>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-2">
                  Doctor's Notes
                </h4>
                <p className="text-slate-700 bg-slate-50 p-4 rounded-lg border">
                  {medicalExam.notes || (
                    <span className="text-slate-400 italic">
                      No additional notes
                    </span>
                  )}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Vital Signs */}
          {medicalExam.vitals && (
            <Card className="border-2 border-slate-200 shadow-md rounded-xl">
              <CardHeader className="bg-slate-50 border-b">
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-5 w-5 text-rose-500" />
                  Vital Signs
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <VitalsPanel vitals={medicalExam.vitals} showStatus />
              </CardContent>
            </Card>
          )}

          {/* Lab Orders Section */}
          <Card className="border-2 border-slate-200 shadow-md rounded-xl">
            <CardHeader className="bg-slate-50 border-b flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FlaskConical className="h-5 w-5 text-teal-600" />
                Lab Orders
              </CardTitle>
              {(userRole === "ADMIN" || userRole === "DOCTOR") && (
                <OrderLabOrderDialog
                  medicalExamId={medicalExam.id}
                  patientId={medicalExam.patient.id}
                  patientName={medicalExam.patient.fullName}
                />
              )}
            </CardHeader>
            <CardContent className="p-0">
              <LabOrdersSection 
                medicalExamId={medicalExam.id} 
                basePath="/admin/lab-orders"
              />
            </CardContent>
          </Card>

          {/* Prescription */}
          <Card className="border-2 border-slate-200 shadow-md rounded-xl">
            <CardHeader className="bg-slate-50 border-b">
              <CardTitle className="flex items-center gap-2">
                <Pill className="h-5 w-5 text-emerald-600" />
                Prescription
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {medicalExam.hasPrescription ? (
                <div className="flex items-center justify-between bg-emerald-50 p-4 rounded-lg border border-emerald-200">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
                      <Pill className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="font-medium text-emerald-800">
                        Prescription Available
                      </p>
                      <p className="text-sm text-emerald-600">
                        Created on{" "}
                        {format(new Date(medicalExam.createdAt), "PPP")}
                      </p>
                    </div>
                  </div>
                  <Button asChild variant="outline" className="border-emerald-300 text-emerald-700 hover:bg-emerald-100">
                    <Link
                      href={`${examBaseHref}/${medicalExam.id}/prescription/view`}
                    >
                      View Prescription
                      <ExternalLink className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-between bg-slate-50 p-4 rounded-lg border border-slate-200">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center">
                      <Pill className="h-5 w-5 text-slate-400" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-600">
                        No Prescription
                      </p>
                      <p className="text-sm text-slate-500">
                        No prescription has been created for this exam
                      </p>
                    </div>
                  </div>
                  {canAddPrescription && (
                    <Button asChild>
                      <Link
                        href={`${examBaseHref}/${medicalExam.id}/prescription`}
                      >
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Add Prescription
                      </Link>
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - 1 column */}
        <div className="space-y-6">
          {/* Patient Information */}
          <div className="detail-section-card">
            <div className="detail-section-card-header">
              <User className="h-4 w-4" />
              <h3>Patient Information</h3>
            </div>
            <div className="detail-section-card-content">
              <InfoGrid columns={1}>
                <InfoItem
                  icon={<User className="h-4 w-4" />}
                  label="Name"
                  value={medicalExam.patient.fullName}
                  color="sky"
                />
                {medicalExam.patient.phoneNumber && (
                  <InfoItem
                    icon={<User className="h-4 w-4" />}
                    label="Phone"
                    value={medicalExam.patient.phoneNumber}
                    color="slate"
                  />
                )}
              </InfoGrid>
              {/* Only show profile link for staff, not for patients viewing their own records */}
              {userRole !== "PATIENT" && (
                <Button
                  variant="link"
                  className="p-0 h-auto mt-3 text-sky-600"
                  asChild
                >
                  <Link
                    href={`${patientProfileBaseHref}/${medicalExam.patient.id}`}
                  >
                    View Patient Profile
                    <ExternalLink className="ml-1 h-3 w-3" />
                  </Link>
                </Button>
              )}
            </div>
          </div>

          {/* Appointment Information */}
          <div className="detail-section-card">
            <div className="detail-section-card-header">
              <Calendar className="h-4 w-4" />
              <h3>Appointment</h3>
            </div>
            <div className="detail-section-card-content">
              <InfoGrid columns={1}>
                <InfoItem
                  icon={<Calendar className="h-4 w-4" />}
                  label="Date & Time"
                  value={format(
                    new Date(medicalExam.appointment.appointmentTime),
                    "PPPp"
                  )}
                  color="violet"
                />
                <InfoItem
                  icon={<FileText className="h-4 w-4" />}
                  label="Type"
                  value={appointmentData?.type || "N/A"}
                  color="slate"
                />
                <InfoItem
                  icon={<FileText className="h-4 w-4" />}
                  label="Reason"
                  value={appointmentData?.reason || "N/A"}
                  color="slate"
                />
              </InfoGrid>
              <Button
                variant="link"
                className="p-0 h-auto mt-3 text-violet-600"
                asChild
              >
                <Link
                  href={`${appointmentBaseHref}/${medicalExam.appointment.id}`}
                >
                  View Appointment
                  <ExternalLink className="ml-1 h-3 w-3" />
                </Link>
              </Button>
            </div>
          </div>

          {/* Audit Information */}
          <Card className="border-2 border-slate-200 shadow-md rounded-xl">
            <CardHeader className="py-3 px-4 bg-slate-50 border-b">
              <CardTitle className="text-sm font-medium">
                Audit Information
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <div>
                <p className="text-xs font-medium text-slate-500">Created</p>
                <p className="text-sm text-slate-700">
                  {format(new Date(medicalExam.createdAt), "PPPp")}
                </p>
                <p className="text-xs text-slate-500">
                  by {medicalExam.doctor.fullName}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500">
                  Last Updated
                </p>
                <p className="text-sm text-slate-700">
                  {format(new Date(medicalExam.updatedAt), "PPPp")}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { MedicalExam } from "@/interfaces/medical-exam";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  format,
  formatDistanceToNow,
  differenceInMilliseconds,
} from "date-fns";
import { vi } from "date-fns/locale";
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
  ExternalLink,
  Phone,
  CheckCircle,
  AlertCircle,
  ClipboardList,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth, UserRole } from "@/contexts/AuthContext";
import { usePatient } from "@/hooks/queries/usePatient";
import { useAppointment } from "@/hooks/queries/useAppointment";
import { Badge } from "@/components/ui/badge";
import { StatsSummaryBar } from "@/components/ui/stats-summary-bar";
import { InfoItem, InfoGrid } from "@/components/ui/info-item";
import { LabSection } from "@/components/lab/LabSection";

// Generate consistent color for avatar
function getAvatarColor(name: string): string {
  const colors = [
    "from-cyan-400 to-teal-500",
    "from-blue-400 to-indigo-500",
    "from-purple-400 to-pink-500",
    "from-rose-400 to-red-500",
    "from-orange-400 to-amber-500",
    "from-emerald-400 to-green-500",
  ];
  const index = name.charCodeAt(0) % colors.length;
  return colors[index];
}

interface MedicalExamDetailViewProps {
  medicalExam: MedicalExam;
  userRole?: UserRole;
  patientProfileBaseHref?: string;
  examBaseHref?: string;
  appointmentBaseHref?: string;
  currentEmployeeId?: string; // Pass from parent for accurate permission check
}

export function MedicalExamDetailView({
  medicalExam,
  userRole,
  patientProfileBaseHref = "/admin/patients",
  examBaseHref = "/admin/exams",
  appointmentBaseHref = "/admin/appointments",
  currentEmployeeId,
}: MedicalExamDetailViewProps) {
  const router = useRouter();
  const { user } = useAuth();

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
          setTimeLeft("Chỉ xem");
          clearInterval(timer);
        } else {
          setTimeLeft(
            formatDistanceToNow(expiresAt, {
              addSuffix: false,
              locale: vi,
            })
          );
        }
      }, 1000);
      return () => clearInterval(timer);
    } else {
      setTimeLeft("Chỉ xem");
    }
  }, [isEditable, expiresAt]);

  // Use currentEmployeeId from prop (if provided) or fall back to user.employeeId
  const effectiveEmployeeId = currentEmployeeId || user?.employeeId;

  const canEdit =
    userRole === "DOCTOR" &&
    effectiveEmployeeId === medicalExam.doctor.id &&
    isEditable;

  const canAddPrescription =
    !medicalExam.hasPrescription &&
    (userRole === "ADMIN" ||
      (userRole === "DOCTOR" && effectiveEmployeeId === medicalExam.doctor.id));

  const statusConfig = medicalExam.status === "FINALIZED"
    ? { label: "Hoàn thành", color: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: CheckCircle }
    : { label: "Đang xử lý", color: "bg-amber-100 text-amber-700 border-amber-200", icon: Clock };

  return (
    <div className="space-y-6">
      {/* Enhanced Gradient Header */}
      <div className="relative rounded-2xl bg-gradient-to-r from-violet-600 via-purple-500 to-fuchsia-500 p-6 text-white overflow-hidden shadow-xl">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-white" />
          <div className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full bg-white" />
        </div>

        <div className="relative flex flex-col lg:flex-row lg:items-start justify-between gap-6">
          <div className="flex items-start gap-5">
            {/* Back button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
              className="text-white/90 hover:text-white hover:bg-white/20 shrink-0 mt-1"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>

            {/* Patient Avatar */}
            <div
              className={`h-16 w-16 rounded-full bg-gradient-to-br ${getAvatarColor(
                medicalExam.patient.fullName
              )} flex items-center justify-center text-white font-bold text-2xl shadow-lg shrink-0 ring-4 ring-white/30`}
            >
              {medicalExam.patient.fullName.charAt(0).toUpperCase()}
            </div>

            {/* Title & Meta */}
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight">
                  Phiếu Khám Bệnh
                </h1>
                <Badge
                  variant="outline"
                  className={`${statusConfig.color} border gap-1`}
                >
                  <statusConfig.icon className="h-3 w-3" />
                  {statusConfig.label}
                </Badge>
                {isEditable && (
                  <Badge
                    variant="outline"
                    className="bg-white/20 text-white border-white/30"
                  >
                    <Clock className="h-3 w-3 mr-1" />
                    Còn {timeLeft}
                  </Badge>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-4 text-white/80 text-sm">
                <span className="flex items-center gap-1.5">
                  <User className="h-4 w-4" />
                  {medicalExam.patient.fullName}
                </span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  {format(new Date(medicalExam.examDate), "dd/MM/yyyy HH:mm", { locale: vi })}
                </span>
                <span className="flex items-center gap-1.5">
                  <Stethoscope className="h-4 w-4" />
                  BS. {medicalExam.doctor.fullName}
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-2 shrink-0 ml-auto lg:ml-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.print()}
              className="bg-white/10 border-white/30 text-white hover:bg-white/20"
            >
              <Printer className="mr-2 h-4 w-4" />
              In
            </Button>
            {canEdit && (
              <Button
                size="sm"
                asChild
                className="bg-white/10 border-white/30 text-white hover:bg-white/20"
                variant="outline"
              >
                <Link href={`${examBaseHref}/${medicalExam.id}/edit`}>
                  <Edit className="h-4 w-4 mr-2" />
                  Sửa
                </Link>
              </Button>
            )}
            {canAddPrescription && (
              <Button
                size="sm"
                asChild
                className="bg-white text-violet-600 hover:bg-white/90"
              >
                <Link href={`${examBaseHref}/${medicalExam.id}/prescription`}>
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Kê đơn
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
            label: "Bệnh nhân",
            value: medicalExam.patient.fullName,
            icon: <User className="h-5 w-5" />,
            color: "sky",
          },
          {
            label: "Bác sĩ",
            value: medicalExam.doctor.fullName,
            icon: <Stethoscope className="h-5 w-5" />,
            color: "violet",
          },
          {
            label: "Đơn thuốc",
            value: medicalExam.hasPrescription ? "Có" : "Chưa có",
            icon: <Pill className="h-5 w-5" />,
            color: medicalExam.hasPrescription ? "emerald" : "slate",
          },
          {
            label: "Trạng thái",
            value: medicalExam.status === "FINALIZED" ? "Hoàn thành" : "Đang xử lý",
            icon: <FileText className="h-5 w-5" />,
            color: medicalExam.status === "FINALIZED" ? "emerald" : "amber",
          },
        ]}
      />

      <div className="grid gap-6 md:grid-cols-3">
        {/* Main Content - 2 columns */}
        <div className="md:col-span-2 space-y-6">
          {/* Clinical Findings - Enhanced */}
          <Card className="overflow-hidden shadow-lg border-0">
            <div className="bg-gradient-to-r from-violet-500 to-purple-500 px-5 py-3">
              <CardTitle className="flex items-center gap-2 text-white font-semibold">
                <ClipboardList className="h-5 w-5" />
                Kết quả lâm sàng
              </CardTitle>
            </div>
            <CardContent className="p-6 space-y-6">
              {/* Diagnosis - Highlighted */}
              <div className="bg-gradient-to-r from-violet-50 to-purple-50 p-5 rounded-xl border border-violet-100">
                <h4 className="text-sm font-semibold text-violet-600 uppercase tracking-wide mb-2 flex items-center gap-2">
                  <Stethoscope className="h-4 w-4" />
                  Chẩn đoán
                </h4>
                <p className="text-slate-800 text-lg font-medium">
                  {medicalExam.diagnosis || (
                    <span className="text-slate-400 italic">
                      Chưa có chẩn đoán
                    </span>
                  )}
                </p>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div className="bg-slate-50 p-4 rounded-xl border">
                  <h4 className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-2">
                    Triệu chứng
                  </h4>
                  <p className="text-slate-700">
                    {medicalExam.symptoms || (
                      <span className="text-slate-400 italic">
                        Không ghi nhận triệu chứng
                      </span>
                    )}
                  </p>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border">
                  <h4 className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-2">
                    Phương pháp điều trị
                  </h4>
                  <p className="text-slate-700">
                    {medicalExam.treatment || (
                      <span className="text-slate-400 italic">
                        Chưa có phác đồ điều trị
                      </span>
                    )}
                  </p>
                </div>
              </div>

              {medicalExam.notes && (
                <div className="bg-amber-50 p-4 rounded-xl border border-amber-200">
                  <h4 className="text-sm font-semibold text-amber-700 uppercase tracking-wide mb-2 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Ghi chú của bác sĩ
                  </h4>
                  <p className="text-slate-700">{medicalExam.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Vital Signs - Enhanced */}
          {medicalExam.vitals && (
            <Card className="overflow-hidden shadow-lg border-0">
              <div className="bg-gradient-to-r from-rose-500 to-pink-500 px-5 py-3">
                <CardTitle className="flex items-center gap-2 text-white font-semibold">
                  <Heart className="h-5 w-5" />
                  Chỉ số sinh tồn
                </CardTitle>
              </div>
              <CardContent className="p-6">
                <VitalsPanel vitals={medicalExam.vitals} showStatus />
              </CardContent>
            </Card>
          )}

          {/* Lab Section */}
          <LabSection
            medicalExamId={medicalExam.id}
            patientId={medicalExam.patient.id}
            patientName={medicalExam.patient.fullName}
            userRole={userRole}
            labOrdersBasePath={examBaseHref.includes('/doctor') ? '/doctor/lab-orders' : '/admin/lab-orders'}
            labResultsBasePath={examBaseHref.includes('/doctor') ? '/doctor/lab-results' : '/admin/lab-results'}
          />

          {/* Prescription - Enhanced */}
          <Card className="overflow-hidden shadow-lg border-0">
            <div className="bg-gradient-to-r from-emerald-500 to-teal-500 px-5 py-3">
              <CardTitle className="flex items-center gap-2 text-white font-semibold">
                <Pill className="h-5 w-5" />
                Đơn thuốc
              </CardTitle>
            </div>
            <CardContent className="p-6">
              {medicalExam.hasPrescription ? (
                <div className="flex items-center justify-between bg-emerald-50 p-5 rounded-xl border border-emerald-200">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center">
                      <Pill className="h-6 w-6 text-emerald-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-emerald-800">
                        Đã kê đơn thuốc
                      </p>
                      <p className="text-sm text-emerald-600">
                        Ngày tạo:{" "}
                        {format(new Date(medicalExam.createdAt), "dd/MM/yyyy", { locale: vi })}
                      </p>
                    </div>
                  </div>
                  <Button asChild variant="outline" className="border-emerald-300 text-emerald-700 hover:bg-emerald-100">
                    <Link
                      href={`${examBaseHref}/${medicalExam.id}/prescription/view`}
                    >
                      Xem đơn thuốc
                      <ExternalLink className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-between bg-slate-50 p-5 rounded-xl border border-slate-200">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center">
                      <Pill className="h-6 w-6 text-slate-400" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-600">
                        Chưa có đơn thuốc
                      </p>
                      <p className="text-sm text-slate-500">
                        Phiếu khám này chưa được kê đơn
                      </p>
                    </div>
                  </div>
                  {canAddPrescription && (
                    <Button asChild className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white border-0">
                      <Link
                        href={`${examBaseHref}/${medicalExam.id}/prescription`}
                      >
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Kê đơn thuốc
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
          {/* Patient Information - Enhanced */}
          <Card className="overflow-hidden shadow-lg border-0">
            <div className="bg-gradient-to-r from-sky-500 to-cyan-500 px-4 py-3">
              <CardTitle className="flex items-center gap-2 text-white font-semibold text-sm">
                <User className="h-4 w-4" />
                Thông tin Bệnh nhân
              </CardTitle>
            </div>
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-4">
                <div
                  className={`h-12 w-12 rounded-full bg-gradient-to-br ${getAvatarColor(
                    medicalExam.patient.fullName
                  )} flex items-center justify-center text-white font-bold shadow-md`}
                >
                  {medicalExam.patient.fullName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-slate-800">
                    {medicalExam.patient.fullName}
                  </p>
                  {medicalExam.patient.phoneNumber && (
                    <p className="text-sm text-slate-500 flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {medicalExam.patient.phoneNumber}
                    </p>
                  )}
                </div>
              </div>
              {userRole !== "PATIENT" && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full border-sky-200 text-sky-600 hover:bg-sky-50"
                  asChild
                >
                  <Link
                    href={`${patientProfileBaseHref}/${medicalExam.patient.id}`}
                  >
                    Xem hồ sơ
                    <ExternalLink className="ml-2 h-3 w-3" />
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Appointment Information - Enhanced */}
          <Card className="overflow-hidden shadow-lg border-0">
            <div className="bg-gradient-to-r from-violet-500 to-purple-500 px-4 py-3">
              <CardTitle className="flex items-center gap-2 text-white font-semibold text-sm">
                <Calendar className="h-4 w-4" />
                Thông tin Cuộc hẹn
              </CardTitle>
            </div>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-violet-500" />
                <span className="text-slate-600">Thời gian:</span>
                <span className="font-medium">
                  {appointmentData?.appointmentTime ? (
                    format(
                      new Date(appointmentData.appointmentTime),
                      "dd/MM/yyyy HH:mm",
                      { locale: vi }
                    )
                  ) : medicalExam.appointment.appointmentTime ? (
                    format(
                      new Date(medicalExam.appointment.appointmentTime),
                      "dd/MM/yyyy HH:mm",
                      { locale: vi }
                    )
                  ) : (
                    <span className="text-slate-400 italic">Không có dữ liệu</span>
                  )}
                </span>
              </div>
              {appointmentData?.type && (
                <div className="flex items-center gap-2 text-sm">
                  <FileText className="h-4 w-4 text-slate-400" />
                  <span className="text-slate-600">Loại:</span>
                  <Badge variant="outline">{appointmentData.type}</Badge>
                </div>
              )}
              {appointmentData?.reason && (
                <div className="text-sm">
                  <span className="text-slate-600">Lý do: </span>
                  <span className="text-slate-800">{appointmentData.reason}</span>
                </div>
              )}
              <Button
                variant="outline"
                size="sm"
                className="w-full border-violet-200 text-violet-600 hover:bg-violet-50 mt-2"
                asChild
              >
                <Link
                  href={`${appointmentBaseHref}/${medicalExam.appointment.id}`}
                >
                  Xem cuộc hẹn
                  <ExternalLink className="ml-2 h-3 w-3" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Audit Information - Enhanced */}
          <Card className="overflow-hidden shadow-lg border-0">
            <div className="bg-gradient-to-r from-slate-500 to-slate-600 px-4 py-3">
              <CardTitle className="flex items-center gap-2 text-white font-semibold text-sm">
                <Clock className="h-4 w-4" />
                Thông tin Lịch sử
              </CardTitle>
            </div>
            <CardContent className="p-4 space-y-4">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase">Ngày tạo</p>
                <p className="text-sm text-slate-800 font-medium">
                  {format(new Date(medicalExam.createdAt), "dd/MM/yyyy HH:mm", { locale: vi })}
                </p>
                <p className="text-xs text-slate-500">
                  bởi {medicalExam.doctor.fullName}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase">
                  Cập nhật lần cuối
                </p>
                <p className="text-sm text-slate-800 font-medium">
                  {format(new Date(medicalExam.updatedAt), "dd/MM/yyyy HH:mm", { locale: vi })}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

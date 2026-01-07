"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { usePatient } from "@/hooks/queries/usePatient";
import { useQuery } from "@tanstack/react-query";
import { appointmentService } from "@/services/appointment.service";
import { getMedicalExams } from "@/services/medical-exam.service";
import { getPatientInvoices } from "@/services/billing.service";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { DetailPageHeader } from "@/components/ui/detail-page-header";
import { StatsSummaryBar } from "@/components/ui/stats-summary-bar";
import { InfoItem, InfoGrid } from "@/components/ui/info-item";
import { AlertBanner } from "@/components/ui/alert-banner";
import { GenderBadge } from "@/components/patients/GenderBadge";
import { BloodTypeBadge } from "@/components/patients/BloodTypeBadge";
import { AllergyTags } from "@/components/patients/AllergyTags";
import {
  AlertCircle,
  User,
  Calendar,
  Activity,
  Pill,
  Receipt,
  Phone,
  Mail,
  MapPin,
  Heart,
  AlertTriangle,
  Shield,
  CreditCard,
  Clock,
  Stethoscope,
  FileText,
  Users,
  ArrowLeft,
  ChevronRight,
} from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

export default function DoctorPatientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const patientId = params.id as string;
  const [activeTab, setActiveTab] = useState("info");

  const { data: patient, isLoading, error } = usePatient(patientId);

  // Fetch appointments for this patient
  const { data: appointmentsData, isLoading: loadingAppointments } = useQuery({
    queryKey: ["patient-appointments", patientId],
    queryFn: () => appointmentService.list({ patientId, size: 50 }),
    enabled: !!patientId,
  });

  // Fetch medical exams for this patient
  const { data: examsData, isLoading: loadingExams } = useQuery({
    queryKey: ["patient-exams", patientId],
    queryFn: () => getMedicalExams({ patientId, size: 50 }),
    enabled: !!patientId,
  });

  // Fetch invoices for this patient
  const { data: invoicesData, isLoading: loadingInvoices } = useQuery({
    queryKey: ["patient-invoices", patientId],
    queryFn: () => getPatientInvoices(patientId),
    enabled: !!patientId,
  });

  const calculateAge = (dob: string | null) => {
    if (!dob) return null;
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const formatDate = (date: string | null) => {
    if (!date) return "N/A";
    try {
      return format(new Date(date), "dd/MM/yyyy", { locale: vi });
    } catch {
      return date;
    }
  };

  const formatDateTime = (date: string) => {
    try {
      return format(new Date(date), "dd/MM/yyyy HH:mm", { locale: vi });
    } catch {
      return date;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      SCHEDULED: { label: "Đã đặt lịch", variant: "default" },
      IN_PROGRESS: { label: "Đang khám", variant: "default" },
      COMPLETED: { label: "Hoàn thành", variant: "secondary" },
      CANCELLED: { label: "Đã hủy", variant: "destructive" },
      NO_SHOW: { label: "Không đến", variant: "outline" },
      UNPAID: { label: "Chưa thanh toán", variant: "destructive" },
      PAID: { label: "Đã thanh toán", variant: "secondary" },
      PARTIALLY_PAID: { label: "Thanh toán một phần", variant: "outline" },
    };
    const config = statusConfig[status] || { label: status, variant: "outline" };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-48 w-full rounded-2xl" />
        <Skeleton className="h-20 w-full rounded-xl" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  // Error state
  if (error || !patient) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-semibold">Chi tiết bệnh nhân</h1>
        </div>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <AlertCircle className="h-12 w-12 text-destructive mb-4" />
          <h3 className="text-lg font-medium">Không tìm thấy bệnh nhân</h3>
          <p className="text-muted-foreground mb-4">
            Bệnh nhân bạn tìm kiếm không tồn tại hoặc đã bị xóa.
          </p>
          <Button asChild>
            <Link href="/doctor/patients">Quay lại danh sách</Link>
          </Button>
        </div>
      </div>
    );
  }

  const appointments = appointmentsData?.content || [];
  const exams = examsData?.data?.content || [];
  const invoices = (invoicesData?.data as any) || [];
  const age = calculateAge(patient.dateOfBirth);

  // Extract prescriptions from exams
  const prescriptions = exams
    .filter((exam: any) => exam.hasPrescription && exam.prescription)
    .map((exam: any) => ({
      ...exam.prescription,
      examDate: exam.examDate,
      diagnosis: exam.diagnosis,
      doctor: exam.doctor,
    }));
  const allergyList = patient.allergies?.split(",").map((s) => s.trim()).filter(Boolean) || [];
  const totalBalance = invoices.reduce((sum: number, inv: any) => sum + (inv.balance || inv.balanceDue || 0), 0);

  return (
    <div className="space-y-6">
      {/* Hero Header - Teal theme for doctor view */}
      <DetailPageHeader
        title={patient.fullName}
        subtitle={`Mã BN: ${patient.id?.slice(0, 8)}...`}
        theme="teal"
        backHref="/doctor/patients"
        avatar={{
          initials: patient.fullName.charAt(0).toUpperCase(),
          src: patient.profileImageUrl || undefined,
          alt: patient.fullName,
        }}
        metaItems={[
          { icon: <Phone className="h-4 w-4" />, text: patient.phoneNumber || "Chưa có SĐT" },
          { icon: <Mail className="h-4 w-4" />, text: patient.email || "Chưa có email" },
          age ? { icon: <Calendar className="h-4 w-4" />, text: `${age} tuổi` } : null,
        ].filter(Boolean) as any}
        statusBadge={patient.bloodType && <BloodTypeBadge bloodType={patient.bloodType as any} />}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              asChild
              className="bg-white/10 border-white/30 text-white hover:bg-white/20"
            >
              <Link href={`/doctor/appointments/new?patientId=${patientId}`}>
                <Calendar className="h-4 w-4 mr-2" />
                Đặt lịch
              </Link>
            </Button>
          </div>
        }
      />

      {/* Stats Summary */}
      <StatsSummaryBar
        stats={[
          { label: "Lịch hẹn", value: appointments.length, icon: <Calendar className="h-5 w-5" />, color: "violet" },
          { label: "Lần khám", value: exams.length, icon: <Stethoscope className="h-5 w-5" />, color: "teal" },
          { label: "Đơn thuốc", value: prescriptions.length, icon: <Pill className="h-5 w-5" />, color: "amber" },
          { label: "Hóa đơn", value: invoices.length, icon: <Receipt className="h-5 w-5" />, color: totalBalance > 0 ? "rose" : "emerald" },
        ]}
      />

      {/* Allergy Alert */}
      {allergyList.length > 0 && (
        <AlertBanner
          type="warning"
          title="Cảnh báo dị ứng"
          description={allergyList.join(", ")}
          icon={<AlertTriangle className="h-5 w-5" />}
        />
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="info" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Thông tin</span>
          </TabsTrigger>
          <TabsTrigger value="appointments" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline">Lịch hẹn</span>
            {appointments.length > 0 && <Badge variant="secondary" className="ml-1">{appointments.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="exams" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            <span className="hidden sm:inline">Lịch sử khám</span>
            {exams.length > 0 && <Badge variant="secondary" className="ml-1">{exams.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="prescriptions" className="flex items-center gap-2">
            <Pill className="h-4 w-4" />
            <span className="hidden sm:inline">Đơn thuốc</span>
            {prescriptions.length > 0 && <Badge variant="secondary" className="ml-1">{prescriptions.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="invoices" className="flex items-center gap-2">
            <Receipt className="h-4 w-4" />
            <span className="hidden sm:inline">Hóa đơn</span>
            {invoices.length > 0 && <Badge variant="secondary" className="ml-1">{invoices.length}</Badge>}
          </TabsTrigger>
        </TabsList>

        {/* Tab: Thông tin cá nhân */}
        <TabsContent value="info" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Thông tin cá nhân */}
            <div className="detail-section-card">
              <div className="detail-section-card-header">
                <User className="h-4 w-4" />
                <h3>Thông tin cá nhân</h3>
              </div>
              <div className="detail-section-card-content">
                <InfoGrid columns={1}>
                  <InfoItem icon={<User className="h-4 w-4" />} label="Họ và tên" value={patient.fullName} color="teal" />
                  <InfoItem icon={<Calendar className="h-4 w-4" />} label="Ngày sinh" value={formatDate(patient.dateOfBirth)} color="violet" />
                  <InfoItem icon={<Phone className="h-4 w-4" />} label="Số điện thoại" value={patient.phoneNumber} color="sky" />
                  <InfoItem icon={<Mail className="h-4 w-4" />} label="Email" value={patient.email} color="amber" />
                  <InfoItem icon={<MapPin className="h-4 w-4" />} label="Địa chỉ" value={patient.address} color="rose" />
                  <InfoItem icon={<CreditCard className="h-4 w-4" />} label="Số CMND/CCCD" value={patient.identificationNumber} color="slate" />
                  <InfoItem icon={<Shield className="h-4 w-4" />} label="Số BHYT" value={patient.healthInsuranceNumber} color="emerald" />
                </InfoGrid>
              </div>
            </div>

            {/* Thông tin y tế */}
            <div className="detail-section-card">
              <div className="detail-section-card-header">
                <Heart className="h-4 w-4" />
                <h3>Thông tin y tế</h3>
              </div>
              <div className="detail-section-card-content space-y-4">
                <div className="flex items-center gap-3">
                  <div className="info-pair">
                    <span className="info-pair-label">Giới tính</span>
                    <GenderBadge gender={patient.gender as any} />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="info-pair">
                    <span className="info-pair-label">Nhóm máu</span>
                    <BloodTypeBadge bloodType={patient.bloodType as any} />
                  </div>
                </div>
                <div>
                  <p className="info-pair-label flex items-center gap-1 mb-2">
                    <AlertTriangle className="h-3 w-3" />
                    Dị ứng
                  </p>
                  <AllergyTags allergies={allergyList} />
                </div>
              </div>
            </div>

            {/* Thông tin người thân */}
            <div className="detail-section-card md:col-span-2">
              <div className="detail-section-card-header">
                <Users className="h-4 w-4" />
                <h3>Thông tin người thân / Liên hệ khẩn cấp</h3>
              </div>
              <div className="detail-section-card-content">
                <InfoGrid columns={3}>
                  <InfoItem icon={<User className="h-4 w-4" />} label="Họ và tên" value={patient.relativeFullName} color="violet" />
                  <InfoItem icon={<Phone className="h-4 w-4" />} label="Số điện thoại" value={patient.relativePhoneNumber} color="teal" />
                  <InfoItem icon={<Heart className="h-4 w-4" />} label="Mối quan hệ" value={patient.relativeRelationship} color="rose" />
                </InfoGrid>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Tab: Lịch hẹn */}
        <TabsContent value="appointments" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Lịch hẹn ({appointments.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingAppointments ? (
                <div className="space-y-3">
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-24 w-full" />
                </div>
              ) : appointments.length === 0 ? (
                <EmptyState icon={Calendar} message="Chưa có lịch hẹn nào" description="Bệnh nhân chưa có cuộc hẹn nào được ghi nhận" />
              ) : (
                <div className="space-y-3">
                  {appointments.map((apt: any) => (
                    <div
                      key={apt.id}
                      className="relative overflow-hidden rounded-xl border bg-white p-4 shadow-sm transition-all duration-300 hover:shadow-md hover:border-teal-200"
                    >
                      <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-teal-400 to-emerald-500 rounded-l-xl" />
                      <div className="flex items-start justify-between pl-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            {getStatusBadge(apt.status)}
                            <Badge variant="outline">{apt.type}</Badge>
                          </div>
                          <p className="font-medium">Bác sĩ: {apt.doctor?.fullName || "N/A"}</p>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDateTime(apt.appointmentTime)}
                          </p>
                          <p className="text-sm text-muted-foreground">Lý do: {apt.reason}</p>
                        </div>
                        <ChevronRight className="h-5 w-5 text-slate-400" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Lịch sử khám */}
        <TabsContent value="exams" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Lịch sử khám bệnh ({exams.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingExams ? (
                <div className="space-y-3">
                  <Skeleton className="h-32 w-full" />
                  <Skeleton className="h-32 w-full" />
                </div>
              ) : exams.length === 0 ? (
                <EmptyState icon={Activity} message="Chưa có lịch sử khám" description="Bệnh nhân chưa có lần khám bệnh nào được ghi nhận" />
              ) : (
                <div className="space-y-3">
                  {exams.map((exam: any) => (
                    <Link
                      key={exam.id}
                      href={`/doctor/exams/${exam.id}`}
                      className="block group"
                    >
                      <div className="relative overflow-hidden rounded-xl border bg-white p-4 shadow-sm transition-all duration-300 hover:shadow-md hover:border-teal-200">
                        <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-cyan-400 to-teal-500 rounded-l-xl" />
                        <div className="pl-3">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <Stethoscope className="h-5 w-5 text-teal-600" />
                              <span className="font-semibold group-hover:text-teal-600 transition-colors">
                                {exam.diagnosis || "Chưa chẩn đoán"}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-muted-foreground">
                                {formatDateTime(exam.examDate)}
                              </span>
                              <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-teal-500 group-hover:translate-x-1 transition-all" />
                            </div>
                          </div>
                          <div className="space-y-1 text-sm text-slate-600">
                            <p><span className="text-slate-400">Bác sĩ:</span> {exam.doctor?.fullName}</p>
                            {exam.symptoms && <p><span className="text-slate-400">Triệu chứng:</span> {exam.symptoms}</p>}
                            {exam.treatment && <p><span className="text-slate-400">Điều trị:</span> {exam.treatment}</p>}
                          </div>
                          {exam.hasPrescription && (
                            <Badge variant="secondary" className="mt-2 bg-green-100 text-green-700">
                              <Pill className="h-3 w-3 mr-1" />
                              Có đơn thuốc
                            </Badge>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Đơn thuốc */}
        <TabsContent value="prescriptions" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Pill className="h-5 w-5" />
                Đơn thuốc ({prescriptions.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingExams ? (
                <div className="space-y-3">
                  <Skeleton className="h-32 w-full" />
                </div>
              ) : prescriptions.length === 0 ? (
                <EmptyState icon={Pill} message="Chưa có đơn thuốc" description="Bệnh nhân chưa được kê đơn thuốc nào" />
              ) : (
                <div className="space-y-3">
                  {prescriptions.map((rx: any) => (
                    <div
                      key={rx.id}
                      className="relative overflow-hidden rounded-xl border bg-white p-4 shadow-sm transition-all duration-300 hover:shadow-md hover:border-amber-200"
                    >
                      <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-amber-400 to-orange-500 rounded-l-xl" />
                      <div className="pl-3">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <p className="font-semibold">{rx.diagnosis}</p>
                            <p className="text-sm text-muted-foreground">Bác sĩ: {rx.doctor?.fullName}</p>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {formatDateTime(rx.examDate)}
                          </span>
                        </div>
                        <div className="bg-slate-50 rounded-lg p-3 space-y-2">
                          {rx.items?.map((item: any, idx: number) => (
                            <div key={idx} className="flex justify-between items-start text-sm">
                              <div>
                                <span className="font-medium">{item.medicineName || item.medicine?.name}</span>
                                <span className="text-muted-foreground"> x {item.quantity}</span>
                              </div>
                              <span className="text-muted-foreground text-right">
                                {item.dosage} - {item.frequency || item.instructions}
                              </span>
                            </div>
                          ))}
                        </div>
                        {rx.notes && (
                          <p className="text-sm text-muted-foreground mt-3">
                            <FileText className="h-3 w-3 inline mr-1" />
                            Ghi chú: {rx.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Hóa đơn */}
        <TabsContent value="invoices" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5" />
                Hóa đơn ({invoices.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingInvoices ? (
                <div className="space-y-3">
                  <Skeleton className="h-24 w-full" />
                </div>
              ) : invoices.length === 0 ? (
                <EmptyState icon={Receipt} message="Chưa có hóa đơn" description="Bệnh nhân chưa có hóa đơn nào được ghi nhận" />
              ) : (
                <div className="space-y-3">
                  {invoices.map((invoice: any) => (
                    <div
                      key={invoice.id}
                      className="relative overflow-hidden rounded-xl border bg-white p-4 shadow-sm transition-all duration-300 hover:shadow-md hover:border-emerald-200"
                    >
                      <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-emerald-400 to-green-500 rounded-l-xl" />
                      <div className="flex items-start justify-between pl-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{invoice.invoiceNumber}</span>
                            {getStatusBadge(invoice.status)}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Ngày: {formatDateTime(invoice.invoiceDate)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-lg text-emerald-600">
                            {formatCurrency(invoice.totalAmount)}
                          </p>
                          {invoice.balance > 0 && (
                            <p className="text-sm text-destructive">
                              Còn nợ: {formatCurrency(invoice.balance)}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function EmptyState({ icon: Icon, message, description }: { icon: React.ComponentType<{ className?: string }>; message: string; description: string }) {
  return (
    <div className="text-center py-12">
      <Icon className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
      <p className="font-medium">{message}</p>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

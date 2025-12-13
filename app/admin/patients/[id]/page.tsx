"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { usePatient, useDeletePatient } from "@/hooks/queries/usePatient";
import { useQuery } from "@tanstack/react-query";
import { appointmentService } from "@/services/appointment.service";
import { getMedicalExams } from "@/services/medical-exam.service";
import { getPatientInvoices } from "@/services/billing.service";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { PatientAvatar } from "@/components/patients/PatientAvatar";
import { GenderBadge } from "@/components/patients/GenderBadge";
import { BloodTypeBadge } from "@/components/patients/BloodTypeBadge";
import { AllergyTags } from "@/components/patients/AllergyTags";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  ArrowLeft,
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
  Edit,
  Trash2,
  Clock,
  Stethoscope,
  FileText,
} from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { useAuth } from "@/contexts/AuthContext";
import { Spinner } from "@/components/ui/spinner";

export default function PatientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const patientId = params.id as string;
  const [activeTab, setActiveTab] = useState("info");
  const { user } = useAuth();
  const canDelete = user?.role === "ADMIN";

  const { data: patient, isLoading, error } = usePatient(patientId);
  const { mutate: deletePatient, isPending: isDeleting } = useDeletePatient();

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

  const handleDelete = () => {
    deletePatient(patientId, {
      onSuccess: () => {
        router.push("/admin/patients");
      },
    });
  };

  const calculateAge = (dob: string | null) => {
    if (!dob) return null;
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
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
    const statusConfig: Record<
      string,
      {
        label: string;
        variant: "default" | "secondary" | "destructive" | "outline";
      }
    > = {
      SCHEDULED: { label: "Đã đặt lịch", variant: "default" },
      COMPLETED: { label: "Hoàn thành", variant: "secondary" },
      CANCELLED: { label: "Đã hủy", variant: "destructive" },
      NO_SHOW: { label: "Không đến", variant: "outline" },
      UNPAID: { label: "Chưa thanh toán", variant: "destructive" },
      PAID: { label: "Đã thanh toán", variant: "secondary" },
      PARTIALLY_PAID: { label: "Thanh toán một phần", variant: "outline" },
    };
    const config = statusConfig[status] || {
      label: status,
      variant: "outline",
    };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <Skeleton className="h-48 w-full rounded-xl" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  // Error state
  if (error || !patient) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/patients">
              <ArrowLeft className="h-5 w-5" />
            </Link>
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
            <Link href="/admin/patients">Quay lại danh sách</Link>
          </Button>
        </div>
      </div>
    );
  }

  const appointments = appointmentsData?.content || [];
  const exams = examsData?.data?.content || [];
  const invoices = invoicesData?.data?.content || [];
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
  const allergyList =
    patient.allergies
      ?.split(",")
      .map((s) => s.trim())
      .filter(Boolean) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/patients">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-semibold">Chi tiết bệnh nhân</h1>
            <p className="text-muted-foreground">Mã: {patient.id}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href={`/admin/appointments/new?patientId=${patientId}`}>
              <Calendar className="h-4 w-4 mr-2" />
              Đặt lịch
            </Link>
          </Button>
          {user?.role !== "RECEPTIONIST" && (
            <Button variant="outline" asChild>
              <Link href={`/admin/patients/${patientId}/history`}>
                <FileText className="h-4 w-4 mr-2" />
                Lịch sử
              </Link>
            </Button>
          )}
          <Button variant="outline" asChild>
            <Link href={`/admin/patients/${patientId}/edit`}>
              <Edit className="h-4 w-4 mr-2" />
              Chỉnh sửa
            </Link>
          </Button>
          {canDelete && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Xóa
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Xóa bệnh nhân</AlertDialogTitle>
                  <AlertDialogDescription>
                    Bạn có chắc chắn muốn xóa{" "}
                    <strong>{patient.fullName}</strong>? Hành động này không thể
                    hoàn tác.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Hủy</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive hover:bg-destructive/90"
                    onClick={handleDelete}
                    disabled={isDeleting}
                  >
                    {isDeleting ? (
                      <>
                        <Spinner size="sm" className="mr-2" />
                        Đang xóa...
                      </>
                    ) : (
                      "Xóa"
                    )}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      {/* Patient Info Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start gap-6">
            <PatientAvatar name={patient.fullName} size="xl" />
            <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Họ và tên</p>
                <p className="font-semibold text-lg">{patient.fullName}</p>
              </div>
              <div className="flex flex-col gap-1">
                <p className="text-sm text-muted-foreground">Giới tính</p>
                <GenderBadge gender={patient.gender as any} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tuổi</p>
                <p className="font-medium">{age ? `${age} tuổi` : "N/A"}</p>
              </div>
              <div className="flex flex-col gap-1">
                <p className="text-sm text-muted-foreground">Nhóm máu</p>
                <BloodTypeBadge bloodType={patient.bloodType as any} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="info" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Thông tin</span>
          </TabsTrigger>
          <TabsTrigger value="appointments" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline">Lịch hẹn</span>
            {appointments.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {appointments.length}
              </Badge>
            )}
          </TabsTrigger>
          {user?.role !== "RECEPTIONIST" && (
            <>
              <TabsTrigger value="exams" className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                <span className="hidden sm:inline">Lịch sử khám</span>
                {exams.length > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {exams.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="prescriptions"
                className="flex items-center gap-2"
              >
                <Pill className="h-4 w-4" />
                <span className="hidden sm:inline">Đơn thuốc</span>
                {prescriptions.length > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {prescriptions.length}
                  </Badge>
                )}
              </TabsTrigger>
            </>
          )}
          <TabsTrigger value="invoices" className="flex items-center gap-2">
            <Receipt className="h-4 w-4" />
            <span className="hidden sm:inline">Hóa đơn</span>
            {invoices.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {invoices.length}
              </Badge>
            )}
          </TabsTrigger>
          {user?.role !== "RECEPTIONIST" && (
            <TabsTrigger value="history" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Lịch sử</span>
            </TabsTrigger>
          )}
        </TabsList>

        {/* Tab: Thông tin cá nhân */}
        <TabsContent value="info" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Thông tin cá nhân */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Thông tin cá nhân
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <InfoRow
                  icon={<User className="h-4 w-4" />}
                  label="Họ và tên"
                  value={patient.fullName}
                />
                <InfoRow
                  icon={<Calendar className="h-4 w-4" />}
                  label="Ngày sinh"
                  value={formatDate(patient.dateOfBirth)}
                />
                <InfoRow
                  icon={<Phone className="h-4 w-4" />}
                  label="Số điện thoại"
                  value={patient.phoneNumber}
                />
                <InfoRow
                  icon={<Mail className="h-4 w-4" />}
                  label="Email"
                  value={patient.email}
                />
                <InfoRow
                  icon={<MapPin className="h-4 w-4" />}
                  label="Địa chỉ"
                  value={patient.address}
                />
                <InfoRow
                  icon={<CreditCard className="h-4 w-4" />}
                  label="Số CMND/CCCD"
                  value={patient.identificationNumber}
                />
                <InfoRow
                  icon={<Shield className="h-4 w-4" />}
                  label="Số BHYT"
                  value={patient.healthInsuranceNumber}
                />
              </CardContent>
            </Card>

            {/* Thông tin y tế */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-5 w-5" />
                  Thông tin y tế
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Nhóm máu</p>
                  <BloodTypeBadge bloodType={patient.bloodType as any} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    Dị ứng
                  </p>
                  <AllergyTags allergies={allergyList} />
                </div>
              </CardContent>
            </Card>

            {/* Thông tin người thân */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="h-5 w-5" />
                  Thông tin người thân / Liên hệ khẩn cấp
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Họ và tên</p>
                    <p className="font-medium">
                      {patient.relativeFullName || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Số điện thoại
                    </p>
                    <p className="font-medium">
                      {patient.relativePhoneNumber || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Mối quan hệ</p>
                    <p className="font-medium">
                      {patient.relativeRelationship || "N/A"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
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
                <EmptyState
                  icon={Calendar}
                  message="Chưa có lịch hẹn nào"
                  description="Bệnh nhân chưa có cuộc hẹn nào được ghi nhận"
                />
              ) : (
                <div className="space-y-4">
                  {appointments.map((apt: any) => (
                    <div
                      key={apt.id}
                      className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            {getStatusBadge(apt.status)}
                            <Badge variant="outline">{apt.type}</Badge>
                          </div>
                          <p className="font-medium">
                            Bác sĩ: {apt.doctor?.fullName || "N/A"}
                          </p>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDateTime(apt.appointmentTime)}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Lý do: {apt.reason}
                          </p>
                        </div>
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
                <EmptyState
                  icon={Activity}
                  message="Chưa có lịch sử khám"
                  description="Bệnh nhân chưa có lần khám bệnh nào được ghi nhận"
                />
              ) : (
                <div className="space-y-4">
                  {exams.map((exam: any) => (
                    <div
                      key={exam.id}
                      className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Stethoscope className="h-5 w-5 text-primary" />
                          <span className="font-semibold">
                            {exam.diagnosis}
                          </span>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {formatDateTime(exam.examDate)}
                        </span>
                      </div>
                      <div className="space-y-2 text-sm">
                        <p>
                          <span className="text-muted-foreground">Bác sĩ:</span>{" "}
                          {exam.doctor?.fullName}
                        </p>
                        <p>
                          <span className="text-muted-foreground">
                            Triệu chứng:
                          </span>{" "}
                          {exam.symptoms}
                        </p>
                        <p>
                          <span className="text-muted-foreground">
                            Điều trị:
                          </span>{" "}
                          {exam.treatment}
                        </p>
                        {exam.hasPrescription && (
                          <Badge variant="secondary" className="mt-2">
                            <Pill className="h-3 w-3 mr-1" />
                            Có đơn thuốc
                          </Badge>
                        )}
                      </div>
                    </div>
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
                <EmptyState
                  icon={Pill}
                  message="Chưa có đơn thuốc"
                  description="Bệnh nhân chưa được kê đơn thuốc nào"
                />
              ) : (
                <div className="space-y-4">
                  {prescriptions.map((rx: any) => (
                    <div
                      key={rx.id}
                      className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-semibold">{rx.diagnosis}</p>
                          <p className="text-sm text-muted-foreground">
                            Bác sĩ: {rx.doctor?.fullName}
                          </p>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {formatDateTime(rx.examDate)}
                        </span>
                      </div>
                      <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                        {rx.items?.map((item: any, idx: number) => (
                          <div
                            key={idx}
                            className="flex justify-between items-start text-sm"
                          >
                            <div>
                              <span className="font-medium">
                                {item.medicineName || item.medicine?.name}
                              </span>
                              <span className="text-muted-foreground">
                                {" "}
                                x {item.quantity}
                              </span>
                            </div>
                            <span className="text-muted-foreground text-right">
                              {item.dosage} -{" "}
                              {item.frequency || item.instructions}
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
                <EmptyState
                  icon={Receipt}
                  message="Chưa có hóa đơn"
                  description="Bệnh nhân chưa có hóa đơn nào được ghi nhận"
                />
              ) : (
                <div className="space-y-4">
                  {invoices.map((invoice: any) => (
                    <div
                      key={invoice.id}
                      className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">
                              {invoice.invoiceNumber}
                            </span>
                            {getStatusBadge(invoice.status)}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Ngày: {formatDateTime(invoice.invoiceDate)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-primary text-lg">
                            {formatCurrency(invoice.totalAmount)}
                          </p>
                          {invoice.balance > 0 && (
                            <p className="text-sm text-destructive">
                              Còn nợ: {formatCurrency(invoice.balance)}
                            </p>
                          )}
                        </div>
                      </div>
                      {invoice.items && invoice.items.length > 0 && (
                        <div className="mt-3 pt-3 border-t">
                          <p className="text-sm font-medium mb-2">Chi tiết:</p>
                          <div className="space-y-1">
                            {invoice.items.slice(0, 3).map((item: any) => (
                              <div
                                key={item.id}
                                className="flex justify-between text-sm"
                              >
                                <span className="text-muted-foreground">
                                  {item.description}
                                </span>
                                <span>{formatCurrency(item.amount)}</span>
                              </div>
                            ))}
                            {invoice.items.length > 3 && (
                              <p className="text-sm text-muted-foreground">
                                +{invoice.items.length - 3} mục khác...
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Lịch sử tổng hợp */}
        <TabsContent value="history" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Lịch sử bệnh nhân
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Xem dòng thời gian cuộc hẹn, khám và hóa đơn của bệnh nhân.
              </p>
              <Button asChild>
                <Link href={`/admin/patients/${patientId}/history`}>
                  Xem lịch sử
                </Link>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Helper Components
function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="text-muted-foreground mt-0.5">{icon}</span>
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="font-medium">{value || "N/A"}</p>
      </div>
    </div>
  );
}

function EmptyState({
  icon: Icon,
  message,
  description,
}: {
  icon: React.ComponentType<{ className?: string }>;
  message: string;
  description: string;
}) {
  return (
    <div className="text-center py-12">
      <Icon className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
      <p className="font-medium">{message}</p>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

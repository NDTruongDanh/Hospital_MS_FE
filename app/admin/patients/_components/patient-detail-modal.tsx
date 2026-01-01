"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  User,
  Calendar,
  Activity,
  Pill,
  Receipt,
  Phone,
  Mail,
  MapPin,
  AlertTriangle,
  Heart,
  FileText,
  Clock,
  Stethoscope,
} from "lucide-react";
import { Patient } from "@/interfaces/patient";
import { useQuery } from "@tanstack/react-query";
import { appointmentService } from "@/services/appointment.service";
import { getMedicalExams } from "@/services/medical-exam.service";
import { getPatientInvoices } from "@/services/billing.service";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

interface PatientDetailModalProps {
  open: boolean;
  onClose: () => void;
  patient: Patient | null;
}

export function PatientDetailModal({
  open,
  onClose,
  patient,
}: PatientDetailModalProps) {
  const [activeTab, setActiveTab] = useState("info");

  // Fetch appointments for this patient
  const { data: appointmentsData, isLoading: loadingAppointments } = useQuery({
    queryKey: ["patient-appointments", patient?.id],
    queryFn: () =>
      appointmentService.list({ patientId: patient?.id, size: 50 }),
    enabled: !!patient?.id && open,
  });

  // Fetch medical exams for this patient
  const { data: examsData, isLoading: loadingExams } = useQuery({
    queryKey: ["patient-exams", patient?.id],
    queryFn: () => getMedicalExams({ patientId: patient?.id, size: 50 }),
    enabled: !!patient?.id && open,
  });

  // Fetch invoices for this patient
  const { data: invoicesData, isLoading: loadingInvoices } = useQuery({
    queryKey: ["patient-invoices", patient?.id],
    queryFn: () => getPatientInvoices(patient?.id || ""),
    enabled: !!patient?.id && open,
  });

  if (!patient) return null;

  const appointments = appointmentsData?.content || [];
  const exams = examsData?.data?.content || [];
  const invoices = (invoicesData?.data as any) || [];

  // Extract prescriptions from exams
  const prescriptions = exams
    .filter((exam: any) => exam.hasPrescription && exam.prescription)
    .map((exam: any) => ({
      ...exam.prescription,
      examDate: exam.examDate,
      diagnosis: exam.diagnosis,
    }));

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

  const getGenderLabel = (gender: string | null) => {
    if (!gender) return "N/A";
    switch (gender) {
      case "MALE":
        return "Nam";
      case "FEMALE":
        return "Nữ";
      default:
        return "Khác";
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<
      string,
      {
        label: string;
        variant: "default" | "secondary" | "destructive" | "outline";
      }
    > = {
      SCHEDULED: { label: "SCHEDULED", variant: "default" },
      COMPLETED: { label: "COMPLETED", variant: "secondary" },
      CANCELLED: { label: "CANCELLED", variant: "destructive" },
      NO_SHOW: { label: "NO SHOW", variant: "outline" },
      UNPAID: { label: "UNPAID", variant: "destructive" },
      PAID: { label: "PAID", variant: "secondary" },
      PARTIALLY_PAID: { label: "PARTIAL", variant: "outline" },
    };
    const config = statusConfig[status] || {
      label: status,
      variant: "outline",
    };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const formatDate = (date: string) => {
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

  const age = calculateAge(patient.dateOfBirth);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-5xl max-h-[90vh] p-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="px-6 py-4 bg-blue-600 text-white">
          <DialogTitle className="text-white">Hồ sơ bệnh nhân</DialogTitle>
          <p className="text-blue-100 text-sm">{patient.fullName}</p>
        </DialogHeader>

        {/* Quick Info Bar */}
        <div className="px-6 py-4 bg-gray-50 border-b grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-500">Mã bệnh nhân</p>
            <p className="font-medium">{patient.id}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Giới tính</p>
            <p className="font-medium">{getGenderLabel(patient.gender)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Tuổi</p>
            <p className="font-medium">{age ? `${age} tuổi` : "N/A"}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Nhóm máu</p>
            <p className="font-medium text-red-600">
              {patient.bloodType || "N/A"}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
          <TabsList className="px-6 border-b rounded-none justify-start bg-transparent h-auto">
            <TabsTrigger
              value="info"
              className="data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none"
            >
              <User className="h-4 w-4 mr-2" />
              Thông tin cá nhân
            </TabsTrigger>
            <TabsTrigger
              value="appointments"
              className="data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none"
            >
              <Calendar className="h-4 w-4 mr-2" />
              Lịch hẹn
            </TabsTrigger>
            <TabsTrigger
              value="exams"
              className="data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none"
            >
              <Activity className="h-4 w-4 mr-2" />
              Lịch sử khám
            </TabsTrigger>
            <TabsTrigger
              value="prescriptions"
              className="data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none"
            >
              <Pill className="h-4 w-4 mr-2" />
              Đơn thuốc
            </TabsTrigger>
            <TabsTrigger
              value="invoices"
              className="data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none"
            >
              <Receipt className="h-4 w-4 mr-2" />
              Hóa đơn
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[400px]">
            {/* Tab: Thông tin cá nhân */}
            <TabsContent value="info" className="p-6 mt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Personal Info */}
                <div>
                  <h3 className="font-semibold text-blue-600 mb-4">
                    Thông tin cá nhân
                  </h3>
                  <div className="space-y-3">
                    <InfoRow label="Họ và tên" value={patient.fullName} />
                    <InfoRow label="Ngày sinh" value={patient.dateOfBirth} />
                    <InfoRow label="Email" value={patient.email} />
                    <InfoRow
                      label="Số điện thoại"
                      value={patient.phoneNumber}
                    />
                    <InfoRow label="Địa chỉ" value={patient.address} />
                    <InfoRow
                      label="Số CMND/CCCD"
                      value={patient.identificationNumber}
                    />
                    <InfoRow label="Nhóm máu" value={patient.bloodType} />
                  </div>
                </div>

                {/* Relative & Health Info */}
                <div>
                  <h3 className="font-semibold text-blue-600 mb-4">
                    Thông tin người thân
                  </h3>
                  <div className="space-y-3">
                    <InfoRow
                      label="Họ và tên"
                      value={patient.relativeFullName}
                    />
                    <InfoRow
                      label="Số điện thoại"
                      value={patient.relativePhoneNumber}
                    />
                    <InfoRow
                      label="Mối quan hệ"
                      value={patient.relativeRelationship}
                    />
                  </div>

                  <h3 className="font-semibold text-blue-600 mb-4 mt-6">
                    Thông tin y tế
                  </h3>
                  <div className="space-y-3">
                    <InfoRow label="Nhóm máu" value={patient.bloodType} />
                    <InfoRow
                      label="Dị ứng"
                      value={patient.allergies}
                      highlight={!!patient.allergies}
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Tab: Lịch hẹn */}
            <TabsContent value="appointments" className="p-6 mt-0">
              <h3 className="font-semibold text-blue-600 mb-4">
                Lịch hẹn ({appointments.length})
              </h3>
              {loadingAppointments ? (
                <div className="space-y-3">
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-24 w-full" />
                </div>
              ) : appointments.length === 0 ? (
                <EmptyState icon={Calendar} message="Chưa có lịch hẹn nào" />
              ) : (
                <div className="space-y-3">
                  {appointments.map((apt: any) => (
                    <div
                      key={apt.id}
                      className="border rounded-lg p-4 hover:bg-gray-50"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            {getStatusBadge(apt.status)}
                            <Badge variant="outline">{apt.type}</Badge>
                          </div>
                          <p className="font-medium">
                            Bác sĩ: {apt.doctor?.fullName}
                          </p>
                          <p className="text-sm text-gray-500 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Thời gian: {formatDate(apt.appointmentTime)}
                          </p>
                          <p className="text-sm text-gray-500">
                            Lý do: {apt.reason}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Tab: Lịch sử khám */}
            <TabsContent value="exams" className="p-6 mt-0">
              <h3 className="font-semibold text-blue-600 mb-4">
                Lịch sử khám bệnh ({exams.length})
              </h3>
              {loadingExams ? (
                <div className="space-y-3">
                  <Skeleton className="h-32 w-full" />
                  <Skeleton className="h-32 w-full" />
                </div>
              ) : exams.length === 0 ? (
                <EmptyState
                  icon={Activity}
                  message="Chưa có lịch sử khám bệnh"
                />
              ) : (
                <div className="space-y-3">
                  {exams.map((exam: any) => (
                    <div
                      key={exam.id}
                      className="border rounded-lg p-4 hover:bg-gray-50"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-medium flex items-center gap-2">
                            <Stethoscope className="h-4 w-4 text-blue-600" />
                            {exam.diagnosis}
                          </p>
                          <p className="text-sm text-gray-500">
                            Bác sĩ: {exam.doctor?.fullName}
                          </p>
                        </div>
                        <p className="text-sm text-gray-500">
                          {formatDate(exam.examDate)}
                        </p>
                      </div>
                      <p className="text-sm">
                        <span className="text-gray-500">Triệu chứng:</span>{" "}
                        {exam.symptoms}
                      </p>
                      <p className="text-sm">
                        <span className="text-gray-500">Điều trị:</span>{" "}
                        {exam.treatment}
                      </p>
                      {exam.hasPrescription && (
                        <Badge variant="secondary" className="mt-2">
                          <Pill className="h-3 w-3 mr-1" />
                          Có đơn thuốc
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Tab: Đơn thuốc */}
            <TabsContent value="prescriptions" className="p-6 mt-0">
              <h3 className="font-semibold text-blue-600 mb-4">
                Đơn thuốc ({prescriptions.length})
              </h3>
              {loadingExams ? (
                <div className="space-y-3">
                  <Skeleton className="h-32 w-full" />
                </div>
              ) : prescriptions.length === 0 ? (
                <EmptyState icon={Pill} message="Chưa có đơn thuốc nào" />
              ) : (
                <div className="space-y-3">
                  {prescriptions.map((rx: any) => (
                    <div
                      key={rx.id}
                      className="border rounded-lg p-4 hover:bg-gray-50"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <p className="font-medium">{rx.diagnosis}</p>
                        <p className="text-sm text-gray-500">
                          {formatDate(rx.examDate)}
                        </p>
                      </div>
                      <div className="space-y-1">
                        {rx.items?.map((item: any, idx: number) => (
                          <div
                            key={idx}
                            className="text-sm flex justify-between"
                          >
                            <span>
                              • {item.medicineName || item.medicine?.name} x{" "}
                              {item.quantity}
                            </span>
                            <span className="text-gray-500">
                              {item.dosage} -{" "}
                              {item.frequency || item.instructions}
                            </span>
                          </div>
                        ))}
                      </div>
                      {rx.notes && (
                        <p className="text-sm text-gray-500 mt-2">
                          Ghi chú: {rx.notes}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Tab: Hóa đơn */}
            <TabsContent value="invoices" className="p-6 mt-0">
              <h3 className="font-semibold text-blue-600 mb-4">
                Hóa đơn ({invoices.length})
              </h3>
              {loadingInvoices ? (
                <div className="space-y-3">
                  <Skeleton className="h-24 w-full" />
                </div>
              ) : invoices.length === 0 ? (
                <EmptyState icon={Receipt} message="Chưa có hóa đơn nào" />
              ) : (
                <div className="space-y-3">
                  {invoices.map((invoice: any) => (
                    <div
                      key={invoice.id}
                      className="border rounded-lg p-4 hover:bg-gray-50"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium flex items-center gap-2">
                            {invoice.invoiceNumber}
                            {getStatusBadge(invoice.status)}
                          </p>
                          <p className="text-sm text-gray-500">
                            Ngày: {formatDate(invoice.invoiceDate)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-blue-600">
                            Tổng tiền: {formatCurrency(invoice.totalAmount)}
                          </p>
                          {invoice.balance > 0 && (
                            <p className="text-sm text-red-500">
                              Còn nợ: {formatCurrency(invoice.balance)}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </ScrollArea>
        </Tabs>

        {/* Footer */}
        <div className="px-6 py-4 border-t flex justify-end">
          <Button onClick={onClose}>Đóng</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Helper Components
function InfoRow({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string | null | undefined;
  highlight?: boolean;
}) {
  return (
    <div>
      <p className="text-sm text-gray-500">{label}</p>
      <p className={highlight ? "text-red-600 font-medium" : ""}>
        {value || "N/A"}
      </p>
    </div>
  );
}

function EmptyState({
  icon: Icon,
  message,
}: {
  icon: React.ComponentType<{ className?: string }>;
  message: string;
}) {
  return (
    <div className="text-center py-12 text-gray-500">
      <Icon className="w-12 h-12 mx-auto mb-3 text-gray-400" />
      <p>{message}</p>
    </div>
  );
}

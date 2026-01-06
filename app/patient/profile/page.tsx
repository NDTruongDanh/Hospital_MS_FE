"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMyProfile } from "@/hooks/queries/usePatient";
import { uploadMyProfileImage, deleteMyProfileImage } from "@/services/patient.service";
import api from "@/config/axios";
import { toast } from "sonner";
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
  Edit,
  Clock,
  Stethoscope,
  FileText,
  Users,
  Camera,
  Trash2,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

export default function PatientProfilePage() {
  const [activeTab, setActiveTab] = useState("info");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const { data: patient, isLoading, error } = useMyProfile();

  // Upload profile image mutation
  const uploadImageMutation = useMutation({
    mutationFn: uploadMyProfileImage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-profile"] });
      toast.success("Đã cập nhật ảnh đại diện");
    },
    onError: (error: Error) => {
      toast.error(`Lỗi upload ảnh: ${error.message}`);
    },
  });

  // Delete profile image mutation
  const deleteImageMutation = useMutation({
    mutationFn: deleteMyProfileImage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-profile"] });
      toast.success("Đã xóa ảnh đại diện");
    },
    onError: (error: Error) => {
      toast.error(`Lỗi xóa ảnh: ${error.message}`);
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        toast.error("Kích thước file tối đa 2MB");
        return;
      }
      // Validate file type
      if (!file.type.match(/^image\/(jpeg|png|webp)$/)) {
        toast.error("Chỉ chấp nhận file JPEG, PNG hoặc WebP");
        return;
      }
      uploadImageMutation.mutate(file);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDeleteImage = () => {
    if (confirm("Bạn có chắc muốn xóa ảnh đại diện?")) {
      deleteImageMutation.mutate();
    }
  };
  
  // Get patientId from profile for data fetching
  const patientId = patient?.id;
  
  // Fetch appointments for this patient using /appointments/by-patient/{patientId}
  const { data: appointmentsData, isLoading: loadingAppointments } = useQuery({
    queryKey: ["patient-appointments", patientId],
    queryFn: async () => {
      if (!patientId) return [];
      const res = await api.get(`/appointments/by-patient/${patientId}`, { params: { size: 50 } });
      return res.data.data?.content || res.data.data || [];
    },
    enabled: !!patientId,
  });
  const appointments = appointmentsData || [];

  // Fetch medical exams for this patient using /exams/all with filter
  const { data: examsData, isLoading: loadingExams } = useQuery({
    queryKey: ["patient-exams", patientId],
    queryFn: async () => {
      if (!patientId) return [];
      const res = await api.get("/exams/all", { 
        params: { 
          size: 50,
          filter: `patientId==${patientId}`,
        } 
      });
      return res.data.data?.content || res.data.data || [];
    },
    enabled: !!patientId,
  });

  // Fetch prescriptions for this patient using dedicated endpoint
  const { data: prescriptionsData, isLoading: loadingPrescriptions } = useQuery({
    queryKey: ["patient-prescriptions", patientId],
    queryFn: async () => {
      if (!patientId) return [];
      try {
        const res = await api.get(`/exams/prescriptions/by-patient/${patientId}`, { params: { size: 50 } });
        return res.data.data?.content || res.data.data || [];
      } catch {
        return [];
      }
    },
    enabled: !!patientId,
  });

  // Fetch invoices for this patient using patientId (more reliable than /my)
  const { data: invoicesData, isLoading: loadingInvoices } = useQuery({
    queryKey: ["patient-invoices", patientId],
    queryFn: async () => {
      if (!patientId) return [];
      const res = await api.get(`/invoices/by-patient/${patientId}`, { params: { size: 50 } });
      return res.data.data || [];
    },
    enabled: !!patientId,
  });
  const invoices = invoicesData || [];

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

  if (error || !patient) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <AlertCircle className="h-12 w-12 text-destructive mb-4" />
          <h3 className="text-lg font-medium">Không tải được hồ sơ</h3>
          <p className="text-muted-foreground mb-4">Vui lòng thử lại sau.</p>
        </div>
      </div>
    );
  }

  const exams = examsData || [];
  const age = calculateAge(patient.dateOfBirth);
  // Use prescriptions from dedicated endpoint
  const prescriptions = prescriptionsData || [];
  const allergyList = patient.allergies?.split(",").map((s: string) => s.trim()).filter(Boolean) || [];
  const totalBalance = invoices.reduce((sum: number, inv: any) => sum + (inv.balance || inv.balanceDue || 0), 0);

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <DetailPageHeader
        title={patient.fullName}
        subtitle="Hồ sơ cá nhân của tôi"
        theme="sky"
        avatar={{
          initials: patient.fullName.charAt(0).toUpperCase(),
          src: patient.profileImageUrl || undefined,
          alt: patient.fullName,
        }}
        metaItems={[
          { icon: <Phone className="h-4 w-4" />, text: patient.phoneNumber || "Chưa có SĐT" },
          { icon: <Mail className="h-4 w-4" />, text: patient.email || "Chưa có email" },
        ]}
        statusBadge={patient.bloodType && <BloodTypeBadge bloodType={patient.bloodType as any} />}
        actions={
          <div className="flex items-center gap-2">
            {/* Hidden file input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
            />
            {/* Upload/Change image button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadImageMutation.isPending}
              className="bg-white/10 border-white/30 text-white hover:bg-white/20"
            >
              {uploadImageMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Camera className="h-4 w-4 mr-2" />
              )}
              {patient.profileImageUrl ? "Đổi ảnh" : "Thêm ảnh"}
            </Button>
            {/* Delete image button */}
            {patient.profileImageUrl && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleDeleteImage}
                disabled={deleteImageMutation.isPending}
                className="bg-white/10 border-white/30 text-white hover:bg-white/20"
              >
                {deleteImageMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </Button>
            )}
            {/* Edit profile button */}
            <Button
              variant="outline"
              size="sm"
              asChild
              className="bg-white/10 border-white/30 text-white hover:bg-white/20"
            >
              <Link href="/patient/profile/edit">
                <Edit className="h-4 w-4 mr-2" />
                Chỉnh sửa
              </Link>
            </Button>
          </div>
        }
      />

      {/* Stats Summary */}
      <StatsSummaryBar
        stats={[
          { label: "Tuổi", value: age ? `${age}` : "N/A", icon: <User className="h-5 w-5" />, color: "sky" },
          { label: "Lịch hẹn", value: appointments.length, icon: <Calendar className="h-5 w-5" />, color: "violet" },
          { label: "Lần khám", value: exams.length, icon: <Stethoscope className="h-5 w-5" />, color: "teal" },
          { label: "Còn nợ", value: totalBalance > 0 ? formatCurrency(totalBalance) : "0₫", icon: <CreditCard className="h-5 w-5" />, color: totalBalance > 0 ? "rose" : "emerald" },
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
                  <InfoItem icon={<User className="h-4 w-4" />} label="Họ và tên" value={patient.fullName} color="sky" />
                  <InfoItem icon={<Calendar className="h-4 w-4" />} label="Ngày sinh" value={formatDate(patient.dateOfBirth)} color="violet" />
                  <InfoItem icon={<Phone className="h-4 w-4" />} label="Số điện thoại" value={patient.phoneNumber} color="teal" />
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
                <EmptyState icon={Calendar} message="Chưa có lịch hẹn nào" description="Bạn chưa có cuộc hẹn nào được ghi nhận" />
              ) : (
                <div className="space-y-4">
                  {appointments.map((apt: any) => (
                    <div key={apt.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                      <div className="flex items-start justify-between">
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
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/patient/appointments/${apt.id}`}>Chi tiết</Link>
                        </Button>
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
                <EmptyState icon={Activity} message="Chưa có lịch sử khám" description="Bạn chưa có lần khám bệnh nào được ghi nhận" />
              ) : (
                <div className="space-y-4">
                  {exams.map((exam: any) => (
                    <div key={exam.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Stethoscope className="h-5 w-5 text-primary" />
                          <span className="font-semibold">{exam.diagnosis}</span>
                        </div>
                        <span className="text-sm text-muted-foreground">{formatDateTime(exam.examDate)}</span>
                      </div>
                      <div className="space-y-2 text-sm">
                        <p><span className="text-muted-foreground">Bác sĩ:</span> {exam.doctor?.fullName}</p>
                        <p><span className="text-muted-foreground">Triệu chứng:</span> {exam.symptoms}</p>
                        <p><span className="text-muted-foreground">Điều trị:</span> {exam.treatment}</p>
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
                <EmptyState icon={Pill} message="Chưa có đơn thuốc" description="Bạn chưa được kê đơn thuốc nào" />
              ) : (
                <div className="space-y-4">
                  {prescriptions.map((rx: any) => (
                    <div key={rx.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-semibold">{rx.diagnosis}</p>
                          <p className="text-sm text-muted-foreground">Bác sĩ: {rx.doctor?.fullName}</p>
                        </div>
                        <span className="text-sm text-muted-foreground">{formatDateTime(rx.examDate)}</span>
                      </div>
                      <div className="bg-muted/50 rounded-lg p-3 space-y-2">
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
                <EmptyState icon={Receipt} message="Chưa có hóa đơn" description="Bạn chưa có hóa đơn nào được ghi nhận" />
              ) : (
                <div className="space-y-4">
                  {invoices.map((invoice: any) => (
                    <Link key={invoice.id} href={`/patient/billing/${invoice.id}`} className="block">
                      <div className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{invoice.invoiceNumber}</span>
                              {getStatusBadge(invoice.status)}
                            </div>
                            <p className="text-sm text-muted-foreground">Ngày: {formatDateTime(invoice.invoiceDate)}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-primary text-lg">{formatCurrency(invoice.totalAmount)}</p>
                            {invoice.balance > 0 && (
                              <p className="text-sm text-destructive">Còn nợ: {formatCurrency(invoice.balance)}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </Link>
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

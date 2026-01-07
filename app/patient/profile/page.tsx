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
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  Sparkles,
  ChevronRight,
  CheckCircle,
  Info,
} from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { cn } from "@/lib/utils";

// Tab configuration
const tabs = [
  { id: "info", label: "Thông tin", icon: User },
  { id: "appointments", label: "Lịch hẹn", icon: Calendar },
  { id: "exams", label: "Lịch sử khám", icon: Activity },
  { id: "prescriptions", label: "Đơn thuốc", icon: Pill },
  { id: "invoices", label: "Hóa đơn", icon: Receipt },
];

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
      if (file.size > 2 * 1024 * 1024) {
        toast.error("Kích thước file tối đa 2MB");
        return;
      }
      if (!file.type.match(/^image\/(jpeg|png|webp)$/)) {
        toast.error("Chỉ chấp nhận file JPEG, PNG hoặc WebP");
        return;
      }
      uploadImageMutation.mutate(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDeleteImage = () => {
    if (confirm("Bạn có chắc muốn xóa ảnh đại diện?")) {
      deleteImageMutation.mutate();
    }
  };
  
  const patientId = patient?.id;
  
  // Fetch appointments
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

  // Fetch medical exams
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

  // Fetch prescriptions
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

  // Fetch invoices
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

  const getStatusConfig = (status: string) => {
    const config: Record<string, { label: string; color: string; bgColor: string }> = {
      SCHEDULED: { label: "Đã đặt lịch", color: "text-blue-700", bgColor: "bg-blue-100" },
      IN_PROGRESS: { label: "Đang khám", color: "text-amber-700", bgColor: "bg-amber-100" },
      COMPLETED: { label: "Hoàn thành", color: "text-emerald-700", bgColor: "bg-emerald-100" },
      CANCELLED: { label: "Đã hủy", color: "text-red-700", bgColor: "bg-red-100" },
      NO_SHOW: { label: "Không đến", color: "text-slate-700", bgColor: "bg-slate-100" },
      UNPAID: { label: "Chưa thanh toán", color: "text-amber-700", bgColor: "bg-amber-100" },
      PAID: { label: "Đã thanh toán", color: "text-emerald-700", bgColor: "bg-emerald-100" },
      PARTIALLY_PAID: { label: "Thanh toán một phần", color: "text-blue-700", bgColor: "bg-blue-100" },
    };
    return config[status] || { label: status, color: "text-slate-700", bgColor: "bg-slate-100" };
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-64 w-full rounded-2xl" />
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  if (error || !patient) {
    return (
      <div className="space-y-6">
        <Card className="border-2 border-red-200">
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-red-700">Không tải được hồ sơ</h3>
            <p className="text-red-600 mt-1">Vui lòng thử lại sau.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const exams = examsData || [];
  const prescriptions = prescriptionsData || [];
  const allergyList = patient.allergies?.split(",").map((s: string) => s.trim()).filter(Boolean) || [];
  const totalBalance = invoices.reduce((sum: number, inv: any) => sum + (inv.balance || inv.balanceDue || 0), 0);
  const isMale = patient.gender?.toUpperCase() !== "FEMALE";

  return (
    <div className="space-y-6">
      {/* Enhanced Gradient Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-violet-600 via-purple-500 to-fuchsia-500 p-6 text-white shadow-xl">
        {/* Background decorations */}
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
        <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-white/5" />
        <div className="absolute top-1/2 right-1/4 h-20 w-20 rounded-full bg-white/5" />

        <div className="relative">
          <div className="flex flex-wrap items-start justify-between gap-6">
            {/* Profile Info */}
            <div className="flex items-center gap-5">
              {/* Avatar with upload overlay */}
              <div className="relative group">
                <Avatar className={cn(
                  "h-24 w-24 ring-4 ring-white/30 shadow-xl",
                  isMale ? "ring-offset-2 ring-offset-purple-500" : "ring-offset-2 ring-offset-pink-500"
                )}>
                  <AvatarImage src={patient.profileImageUrl || undefined} alt={patient.fullName} />
                  <AvatarFallback className={cn(
                    "text-3xl font-bold text-white",
                    isMale 
                      ? "bg-gradient-to-br from-sky-400 to-cyan-500" 
                      : "bg-gradient-to-br from-pink-400 to-rose-500"
                  )}>
                    {patient.fullName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                {/* Upload overlay */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                  disabled={uploadImageMutation.isPending}
                >
                  {uploadImageMutation.isPending ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    <Camera className="h-6 w-6" />
                  )}
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                />
              </div>

              <div>
                <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                  {patient.fullName}
                  <Badge className="bg-white/20 text-white border-0">
                    <Sparkles className="h-3 w-3 mr-1" />
                    Bệnh nhân
                  </Badge>
                </h1>
                <div className="flex flex-wrap items-center gap-4 mt-2 text-purple-100">
                  <span className="flex items-center gap-1.5">
                    <Phone className="h-4 w-4" />
                    {patient.phoneNumber || "Chưa có SĐT"}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Mail className="h-4 w-4" />
                    {patient.email || "Chưa có email"}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-3">
                  <GenderBadge gender={patient.gender as any} />
                  {patient.bloodType && <BloodTypeBadge bloodType={patient.bloodType as any} />}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
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
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-white/20">
            <div className="text-center">
              <div className="text-3xl font-bold">{appointments.length}</div>
              <div className="text-sm text-purple-200">Lịch hẹn</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">{exams.length}</div>
              <div className="text-sm text-purple-200">Lần khám</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">{prescriptions.length}</div>
              <div className="text-sm text-purple-200">Đơn thuốc</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">{totalBalance > 0 ? formatCurrency(totalBalance) : "0₫"}</div>
              <div className="text-sm text-purple-200">Còn nợ</div>
            </div>
          </div>
        </div>
      </div>

      {/* Allergy Alert */}
      {allergyList.length > 0 && (
        <Card className="border-2 border-amber-300 bg-gradient-to-r from-amber-50 to-orange-50">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-amber-100">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <h3 className="font-semibold text-amber-800">Cảnh báo dị ứng</h3>
                <div className="mt-2">
                  <AllergyTags allergies={allergyList} />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Custom Tab Navigation */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const count = tab.id === "appointments" ? appointments.length
            : tab.id === "exams" ? exams.length
            : tab.id === "prescriptions" ? prescriptions.length
            : tab.id === "invoices" ? invoices.length
            : 0;
          
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap",
                isActive
                  ? "bg-gradient-to-r from-violet-500 to-purple-500 text-white shadow-md"
                  : "bg-white text-slate-600 border-2 border-slate-200 hover:border-violet-300 hover:bg-violet-50"
              )}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
              {count > 0 && (
                <Badge 
                  variant="secondary" 
                  className={cn(
                    "text-xs",
                    isActive ? "bg-white/20 text-white" : "bg-slate-100"
                  )}
                >
                  {count}
                </Badge>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {/* Tab: Thông tin cá nhân */}
        {activeTab === "info" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Personal Info */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="border-2 border-slate-200 shadow-sm overflow-hidden">
                <div className="h-1 bg-gradient-to-r from-violet-500 to-purple-500" />
                <CardContent className="pt-5">
                  <h3 className="font-semibold text-slate-800 flex items-center gap-2 mb-4">
                    <User className="h-5 w-5 text-violet-600" />
                    Thông tin cá nhân
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InfoRow icon={User} label="Họ và tên" value={patient.fullName} />
                    <InfoRow icon={Calendar} label="Ngày sinh" value={formatDate(patient.dateOfBirth)} />
                    <InfoRow icon={Phone} label="Số điện thoại" value={patient.phoneNumber} />
                    <InfoRow icon={Mail} label="Email" value={patient.email} />
                    <InfoRow icon={MapPin} label="Địa chỉ" value={patient.address} className="md:col-span-2" />
                    <InfoRow icon={CreditCard} label="Số CMND/CCCD" value={patient.identificationNumber} />
                    <InfoRow icon={Shield} label="Số BHYT" value={patient.healthInsuranceNumber} />
                  </div>
                </CardContent>
              </Card>

              {/* Emergency Contact */}
              <Card className="border-2 border-slate-200 shadow-sm overflow-hidden">
                <div className="h-1 bg-gradient-to-r from-rose-500 to-pink-500" />
                <CardContent className="pt-5">
                  <h3 className="font-semibold text-slate-800 flex items-center gap-2 mb-4">
                    <Users className="h-5 w-5 text-rose-600" />
                    Thông tin liên hệ khẩn cấp
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <InfoRow icon={User} label="Họ và tên" value={patient.relativeFullName} />
                    <InfoRow icon={Phone} label="Số điện thoại" value={patient.relativePhoneNumber} />
                    <InfoRow icon={Heart} label="Mối quan hệ" value={patient.relativeRelationship} />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              <Card className="border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-white shadow-sm">
                <CardContent className="pt-5">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-emerald-100">
                      <Heart className="h-4 w-4 text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-800 mb-3">Thông tin y tế</h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-slate-600">Giới tính</span>
                          <GenderBadge gender={patient.gender as any} />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-slate-600">Nhóm máu</span>
                          <BloodTypeBadge bloodType={patient.bloodType as any} />
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white shadow-sm">
                <CardContent className="pt-5">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-blue-100">
                      <Info className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-800 mb-2">Mẹo</h3>
                      <ul className="space-y-2 text-sm text-slate-600">
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-emerald-500" />
                          Di chuột vào ảnh để đổi
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-emerald-500" />
                          Nhấn "Chỉnh sửa" để cập nhật
                        </li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Tab: Lịch hẹn */}
        {activeTab === "appointments" && (
          <div className="space-y-4">
            {loadingAppointments ? (
              <LoadingCards count={3} />
            ) : appointments.length === 0 ? (
              <EmptyState icon={Calendar} message="Chưa có lịch hẹn nào" />
            ) : (
              appointments.map((apt: any) => (
                <AppointmentCard key={apt.id} appointment={apt} getStatusConfig={getStatusConfig} formatDateTime={formatDateTime} />
              ))
            )}
          </div>
        )}

        {/* Tab: Lịch sử khám */}
        {activeTab === "exams" && (
          <div className="space-y-4">
            {loadingExams ? (
              <LoadingCards count={3} />
            ) : exams.length === 0 ? (
              <EmptyState icon={Activity} message="Chưa có lịch sử khám" />
            ) : (
              exams.map((exam: any) => (
                <ExamCard key={exam.id} exam={exam} formatDateTime={formatDateTime} />
              ))
            )}
          </div>
        )}

        {/* Tab: Đơn thuốc */}
        {activeTab === "prescriptions" && (
          <div className="space-y-4">
            {loadingPrescriptions ? (
              <LoadingCards count={2} />
            ) : prescriptions.length === 0 ? (
              <EmptyState icon={Pill} message="Chưa có đơn thuốc" />
            ) : (
              prescriptions.map((rx: any) => (
                <PrescriptionCard key={rx.id} prescription={rx} formatDateTime={formatDateTime} />
              ))
            )}
          </div>
        )}

        {/* Tab: Hóa đơn */}
        {activeTab === "invoices" && (
          <div className="space-y-4">
            {loadingInvoices ? (
              <LoadingCards count={2} />
            ) : invoices.length === 0 ? (
              <EmptyState icon={Receipt} message="Chưa có hóa đơn" />
            ) : (
              invoices.map((invoice: any) => (
                <InvoiceCard key={invoice.id} invoice={invoice} getStatusConfig={getStatusConfig} formatDateTime={formatDateTime} formatCurrency={formatCurrency} />
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Helper Components
function InfoRow({ icon: Icon, label, value, className }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string | null; className?: string }) {
  return (
    <div className={cn("flex items-center gap-3 p-3 bg-slate-50 rounded-lg", className)}>
      <Icon className="h-4 w-4 text-slate-400 flex-shrink-0" />
      <div className="min-w-0">
        <p className="text-xs text-slate-500">{label}</p>
        <p className="font-medium text-slate-800 truncate">{value || "Chưa cập nhật"}</p>
      </div>
    </div>
  );
}

function EmptyState({ icon: Icon, message }: { icon: React.ComponentType<{ className?: string }>; message: string }) {
  return (
    <Card className="border-2 border-dashed border-slate-200">
      <CardContent className="py-16 text-center">
        <div className="rounded-full bg-slate-100 p-4 w-fit mx-auto mb-4">
          <Icon className="h-12 w-12 text-slate-400" />
        </div>
        <h3 className="text-lg font-semibold text-slate-700">{message}</h3>
        <p className="text-slate-500 mt-1">Dữ liệu sẽ hiển thị ở đây khi có</p>
      </CardContent>
    </Card>
  );
}

function LoadingCards({ count }: { count: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-32 w-full rounded-xl" />
      ))}
    </>
  );
}

function AppointmentCard({ appointment, getStatusConfig, formatDateTime }: any) {
  const status = getStatusConfig(appointment.status);
  return (
    <Link href={`/patient/appointments/${appointment.id}`}>
      <Card className="border-2 border-slate-200 hover:border-violet-300 hover:shadow-lg transition-all cursor-pointer group overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-violet-500 to-purple-500" />
        <CardContent className="py-5">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="p-2.5 rounded-xl bg-violet-100">
                <Calendar className="h-5 w-5 text-violet-600" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Badge className={cn(status.bgColor, status.color, "border-0")}>
                    {status.label}
                  </Badge>
                  <Badge variant="outline">{appointment.type}</Badge>
                </div>
                <p className="font-semibold text-slate-800">BS: {appointment.doctor?.fullName || "N/A"}</p>
                <p className="text-sm text-slate-500 flex items-center gap-1 mt-1">
                  <Clock className="h-3.5 w-3.5" />
                  {formatDateTime(appointment.appointmentTime)}
                </p>
                {appointment.reason && (
                  <p className="text-sm text-slate-600 mt-2">Lý do: {appointment.reason}</p>
                )}
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-violet-500 transition-colors" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function ExamCard({ exam, formatDateTime }: any) {
  return (
    <Card className="border-2 border-slate-200 hover:shadow-md transition-all overflow-hidden">
      <div className="h-1 bg-gradient-to-r from-teal-500 to-emerald-500" />
      <CardContent className="py-5">
        <div className="flex items-start gap-4">
          <div className="p-2.5 rounded-xl bg-teal-100">
            <Stethoscope className="h-5 w-5 text-teal-600" />
          </div>
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold text-slate-800">{exam.diagnosis || "Chưa có chẩn đoán"}</p>
                <p className="text-sm text-slate-500 mt-1">BS: {exam.doctor?.fullName}</p>
              </div>
              <span className="text-sm text-slate-500">{formatDateTime(exam.examDate)}</span>
            </div>
            <div className="mt-3 p-3 bg-slate-50 rounded-lg text-sm space-y-1">
              <p><span className="text-slate-500">Triệu chứng:</span> {exam.symptoms || "N/A"}</p>
              <p><span className="text-slate-500">Điều trị:</span> {exam.treatment || "N/A"}</p>
            </div>
            {exam.hasPrescription && (
              <Badge className="mt-3 bg-blue-100 text-blue-700">
                <Pill className="h-3 w-3 mr-1" />
                Có đơn thuốc
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function PrescriptionCard({ prescription, formatDateTime }: any) {
  return (
    <Card className="border-2 border-slate-200 hover:shadow-md transition-all overflow-hidden">
      <div className="h-1 bg-gradient-to-r from-blue-500 to-cyan-500" />
      <CardContent className="py-5">
        <div className="flex items-start gap-4">
          <div className="p-2.5 rounded-xl bg-blue-100">
            <Pill className="h-5 w-5 text-blue-600" />
          </div>
          <div className="flex-1">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="font-semibold text-slate-800">{prescription.diagnosis}</p>
                <p className="text-sm text-slate-500">BS: {prescription.doctor?.fullName}</p>
              </div>
              <span className="text-sm text-slate-500">{formatDateTime(prescription.examDate)}</span>
            </div>
            <div className="bg-slate-50 rounded-lg p-3 space-y-2">
              {prescription.items?.map((item: any, idx: number) => (
                <div key={idx} className="flex justify-between items-start text-sm">
                  <div>
                    <span className="font-medium">{item.medicineName || item.medicine?.name}</span>
                    <span className="text-slate-500"> x {item.quantity}</span>
                  </div>
                  <span className="text-slate-500 text-right">
                    {item.dosage} - {item.frequency || item.instructions}
                  </span>
                </div>
              ))}
            </div>
            {prescription.notes && (
              <p className="text-sm text-slate-600 mt-3 flex items-center gap-1">
                <FileText className="h-3.5 w-3.5" />
                Ghi chú: {prescription.notes}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function InvoiceCard({ invoice, getStatusConfig, formatDateTime, formatCurrency }: any) {
  const status = getStatusConfig(invoice.status);
  return (
    <Link href={`/patient/billing/${invoice.id}`}>
      <Card className="border-2 border-slate-200 hover:border-emerald-300 hover:shadow-lg transition-all cursor-pointer group overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-emerald-500 to-teal-500" />
        <CardContent className="py-5">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="p-2.5 rounded-xl bg-emerald-100">
                <Receipt className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-slate-800">{invoice.invoiceNumber}</span>
                  <Badge className={cn(status.bgColor, status.color, "border-0")}>
                    {status.label}
                  </Badge>
                </div>
                <p className="text-sm text-slate-500">{formatDateTime(invoice.invoiceDate)}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-bold text-lg text-emerald-600">{formatCurrency(invoice.totalAmount)}</p>
              {invoice.balance > 0 && (
                <p className="text-sm text-red-500">Còn nợ: {formatCurrency(invoice.balance)}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

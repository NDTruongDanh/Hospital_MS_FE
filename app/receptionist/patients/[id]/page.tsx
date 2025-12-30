"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { z } from "zod";
import { 
  ArrowLeft,
  User,
  Phone,
  MapPin,
  Calendar,
  Heart,
  Clock,
  Receipt,
  Edit,
  Loader2,
  CheckCircle,
  XCircle,
  TrendingUp,
  TrendingDown,
  TestTube,
  AlertCircle,
  Eye,
} from "lucide-react";
import { toast } from "sonner";
import { getPatient, updatePatient } from "@/services/patient.service";
import { labOrderService } from "@/services/lab.service";
import type { LabOrder, LabOrderStatus } from "@/interfaces/lab";
import { appointmentService } from "@/services/appointment.service";
import { getPatientInvoices } from "@/services/billing.service";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Zod schema for edit form
const editPatientSchema = z.object({
  fullName: z.string().min(1, "Vui lòng nhập họ tên").max(100, "Họ tên không quá 100 ký tự"),
  phoneNumber: z.string().regex(/^(0|\+84)(\d{9})$/, "Số điện thoại phải có 10 số, bắt đầu bằng 0"),
  email: z.string().email("Email không hợp lệ").optional().or(z.literal("")),
  dateOfBirth: z.string().min(1, "Vui lòng chọn ngày sinh"),
  gender: z.enum(["MALE", "FEMALE"], { message: "Vui lòng chọn giới tính" }),
  address: z.string().optional(),
  bloodType: z.string().optional(),
  healthInsuranceNumber: z.string().max(20, "Số BHYT không quá 20 ký tự").optional(),
  allergies: z.string().max(100, "Dị ứng không quá 100 ký tự").optional(),
  relativeFullName: z.string().max(100).optional(),
  relativePhoneNumber: z.string().regex(/^(0|\+84)(\d{9})$/, "SĐT người thân phải có 10 số").optional().or(z.literal("")),
  relativeRelationship: z.string().max(100).optional(),
});

interface PatientDetail {
  id: string;
  fullName: string;
  dateOfBirth: string;
  gender: "MALE" | "FEMALE" | "OTHER";
  phoneNumber?: string;
  email?: string;
  address?: string;
  bloodType?: string;
  healthInsuranceNumber?: string;
  allergies?: string;
  relativeFullName?: string;
  relativePhoneNumber?: string;
  relativeRelationship?: string;
  appointments: {
    id: string;
    appointmentTime: string;
    doctorName: string;
    status: string;
  }[];
  invoices: {
    id: string;
    invoiceNumber: string;
    totalAmount: number;
    paidAmount: number;
    balanceDue: number;
    discount: number;
    status: string;
    createdAt: string;
  }[];
}

export default function ReceptionistPatientDetailPage() {
  const params = useParams();
  const patientId = params.id as string;
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"info" | "appointments" | "invoices" | "lab-results">("info");
  const [patient, setPatient] = useState<PatientDetail | null>(null);
  const [labOrders, setLabOrders] = useState<LabOrder[]>([]);
  
  // Edit modal state
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});
  const [editForm, setEditForm] = useState({
    fullName: "",
    phoneNumber: "",
    email: "",
    dateOfBirth: "",
    gender: "MALE" as "MALE" | "FEMALE",
    address: "",
    bloodType: "",
    healthInsuranceNumber: "",
    allergies: "",
    relativeFullName: "",
    relativePhoneNumber: "",
    relativeRelationship: "",
  });

  // Helper to update form and clear field error if valid
  const updateEditField = (field: string, value: string) => {
    const newForm = { ...editForm, [field]: value };
    setEditForm(newForm);
    
    // Validate single field and clear error if valid
    const fieldSchema = editPatientSchema.shape[field as keyof typeof editPatientSchema.shape];
    if (fieldSchema) {
      const result = fieldSchema.safeParse(value);
      if (result.success) {
        setEditErrors(prev => {
          const { [field]: _, ...rest } = prev;
          return rest;
        });
      }
    }
  };

  useEffect(() => {
    fetchPatient();
    fetchLabOrders();
  }, [patientId]);

  const fetchPatient = async () => {
    try {
      setLoading(true);
      // Fetch real patient data, appointments and invoices from API
      const [patientData, appointmentsData, invoicesData] = await Promise.all([
        getPatient(patientId),
        appointmentService.list({ patientId, page: 0, size: 20 }).catch(() => ({ content: [] })),
        getPatientInvoices(patientId, { page: 0, size: 20 }).catch(() => ({ data: { data: { content: [] } } }))
      ]);
      
      // Extract invoices from nested response
      const invoices = invoicesData?.data?.data?.content || invoicesData?.data?.content || [];
      
      setPatient({
        ...patientData,
        appointments: appointmentsData.content.map((apt: any) => ({
          id: apt.id,
          appointmentTime: apt.appointmentTime,
          doctorName: apt.doctor?.fullName || "Bác sĩ",
          status: apt.status,
        })),
        invoices: invoices.map((inv: any) => ({
          id: inv.id,
          invoiceNumber: inv.invoiceNumber || `INV-${inv.id?.slice(0, 8)}`,
          totalAmount: inv.totalAmount || 0,
          paidAmount: inv.paidAmount || 0,
          balanceDue: inv.balanceDue || 0,
          discount: inv.discount || 0,
          status: inv.status || "PENDING",
          createdAt: inv.createdAt,
        })),
      } as PatientDetail);
    } catch (error) {
      console.error("Failed to fetch patient:", error);
      toast.error("Không thể tải thông tin bệnh nhân");
    } finally {
      setLoading(false);
    }
  };

  const fetchLabOrders = async () => {
    try {
      const orders = await labOrderService.getByPatient(patientId);
      setLabOrders(orders || []);
    } catch (error) {
      console.error("Failed to fetch lab orders:", error);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("vi-VN");
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value);
  };

  const openEditModal = () => {
    if (patient) {
      setEditErrors({}); // Clear previous errors
      setEditForm({
        fullName: patient.fullName || "",
        phoneNumber: patient.phoneNumber || "",
        email: patient.email || "",
        dateOfBirth: patient.dateOfBirth || "",
        gender: patient.gender === "FEMALE" ? "FEMALE" : "MALE",
        address: patient.address || "",
        bloodType: patient.bloodType || "",
        healthInsuranceNumber: patient.healthInsuranceNumber || "",
        allergies: patient.allergies || "",
        relativeFullName: patient.relativeFullName || "",
        relativePhoneNumber: patient.relativePhoneNumber || "",
        relativeRelationship: patient.relativeRelationship || "",
      });
      setIsEditOpen(true);
    }
  };

  const handleUpdatePatient = async () => {
    // Validate with zod
    const result = editPatientSchema.safeParse(editForm);
    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.issues.forEach(issue => {
        const field = issue.path[0] as string;
        errors[field] = issue.message;
      });
      setEditErrors(errors);
      toast.error("Vui lòng kiểm tra lại thông tin");
      return;
    }
    
    // Clear errors on success
    setEditErrors({});

    try {
      setSaving(true);
      const updateData: any = {
        fullName: editForm.fullName.trim(),
        phoneNumber: editForm.phoneNumber.trim(),
        dateOfBirth: editForm.dateOfBirth,
        gender: editForm.gender,
      };

      if (editForm.email && editForm.email.includes('@')) updateData.email = editForm.email.trim();
      if (editForm.address) updateData.address = editForm.address.trim();
      if (editForm.bloodType) updateData.bloodType = editForm.bloodType;
      if (editForm.healthInsuranceNumber) updateData.healthInsuranceNumber = editForm.healthInsuranceNumber.trim();
      if (editForm.allergies) updateData.allergies = editForm.allergies.trim();
      if (editForm.relativeFullName) updateData.relativeFullName = editForm.relativeFullName.trim();
      if (editForm.relativePhoneNumber && /^(0|\+84)(\d{9})$/.test(editForm.relativePhoneNumber.trim())) {
        updateData.relativePhoneNumber = editForm.relativePhoneNumber.trim();
      }
      if (editForm.relativeRelationship) updateData.relativeRelationship = editForm.relativeRelationship.trim();

      await updatePatient(patientId, updateData);
      toast.success("Cập nhật thông tin thành công!");
      setIsEditOpen(false);
      setEditErrors({});
      fetchPatient(); // Reload data
    } catch (error) {
      console.error("Failed to update patient:", error);
      toast.error("Không thể cập nhật thông tin bệnh nhân");
    } finally {
      setSaving(false);
    }
  };

  if (loading || !patient) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-[hsl(var(--primary))]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/receptionist/patients" className="btn-icon">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-display">{patient.fullName}</h1>
          <p className="text-[hsl(var(--muted-foreground))] mt-1">
            Chi tiết hồ sơ bệnh nhân
          </p>
        </div>
        <button onClick={openEditModal} className="btn-secondary">
          <Edit className="w-4 h-4" />
          Chỉnh sửa
        </button>
      </div>

      {/* Tabs */}
      <div className="card-base">
        <div className="flex gap-2">
          {[
            { value: "info", label: "Thông tin" },
            { value: "appointments", label: "Lịch hẹn" },
            { value: "invoices", label: "Hóa đơn" },
            { value: "lab-results", label: "Xét nghiệm" },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value as any)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.value
                  ? "bg-[hsl(var(--primary))] text-white"
                  : "bg-[hsl(var(--secondary))] hover:bg-[hsl(var(--secondary))]/80"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === "info" && (
        <div className="space-y-6">
          {/* Row 1: Personal Info & Contact */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Personal Info Card */}
            <div className="bg-gradient-to-br from-blue-50 to-white border-2 border-blue-200 rounded-xl p-5 shadow-sm">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-blue-900">
                <User className="w-5 h-5 text-blue-600" />
                Thông tin cá nhân
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-blue-100">
                  <span className="text-gray-600">Họ tên</span>
                  <span className="font-semibold text-gray-900">{patient.fullName}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-blue-100">
                  <span className="text-gray-600">Ngày sinh</span>
                  <span className="font-medium">{formatDate(patient.dateOfBirth)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-blue-100">
                  <span className="text-gray-600">Giới tính</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    patient.gender === "MALE" 
                      ? "bg-blue-100 text-blue-700" 
                      : "bg-pink-100 text-pink-700"
                  }`}>
                    {patient.gender === "MALE" ? "Nam" : "Nữ"}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-blue-100">
                  <span className="text-gray-600">Điện thoại</span>
                  <span className="font-medium flex items-center gap-1">
                    <Phone className="w-4 h-4 text-blue-500" />
                    {patient.phoneNumber || "-"}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-600">Địa chỉ</span>
                  <span className="font-medium text-right max-w-[60%] flex items-center gap-1">
                    <MapPin className="w-4 h-4 text-blue-500 flex-shrink-0" />
                    {patient.address || "-"}
                  </span>
                </div>
              </div>
            </div>

            {/* Medical Info Card */}
            <div className="bg-gradient-to-br from-red-50 to-white border-2 border-red-200 rounded-xl p-5 shadow-sm">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-red-900">
                <Heart className="w-5 h-5 text-red-600" />
                Thông tin y tế
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-red-100">
                  <span className="text-gray-600">Nhóm máu</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                    patient.bloodType 
                      ? "bg-red-100 text-red-700" 
                      : "bg-gray-100 text-gray-500"
                  }`}>
                    {patient.bloodType || "N/A"}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-red-100">
                  <span className="text-gray-600">Số BHYT</span>
                  <span className={`font-medium ${patient.healthInsuranceNumber ? "text-green-600" : ""}`}>
                    {patient.healthInsuranceNumber || "-"}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-600">Dị ứng</span>
                  {patient.allergies ? (
                    <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium animate-pulse">
                      ⚠️ {patient.allergies}
                    </span>
                  ) : (
                    <span className="text-green-600 font-medium">Không có</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Row 2: Emergency Contact */}
          <div className="bg-gradient-to-br from-amber-50 to-white border-2 border-amber-200 rounded-xl p-5 shadow-sm">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-amber-900">
              <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              Liên hệ khẩn cấp
            </h3>
            {patient.relativeFullName || patient.relativePhoneNumber ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-lg p-4 border border-amber-100">
                  <p className="text-sm text-gray-500 mb-1">Họ tên người thân</p>
                  <p className="font-semibold text-gray-900">{patient.relativeFullName || "-"}</p>
                </div>
                <div className="bg-white rounded-lg p-4 border border-amber-100">
                  <p className="text-sm text-gray-500 mb-1">Số điện thoại</p>
                  <p className="font-semibold text-gray-900 flex items-center gap-1">
                    <Phone className="w-4 h-4 text-amber-500" />
                    {patient.relativePhoneNumber || "-"}
                  </p>
                </div>
                <div className="bg-white rounded-lg p-4 border border-amber-100">
                  <p className="text-sm text-gray-500 mb-1">Mối quan hệ</p>
                  <p className="font-semibold text-gray-900">{patient.relativeRelationship || "-"}</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500">
                <svg className="w-12 h-12 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <p>Chưa có thông tin liên hệ khẩn cấp</p>
                <button onClick={openEditModal} className="mt-2 text-amber-600 hover:text-amber-700 font-medium text-sm">
                  + Thêm ngay
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "appointments" && (
        <div className="card-base">
          <h3 className="text-section mb-4">Lịch hẹn</h3>
          <div className="space-y-3">
            {patient.appointments.length === 0 ? (
              <p className="text-center py-8 text-[hsl(var(--muted-foreground))]">
                Chưa có lịch hẹn nào
              </p>
            ) : (
              patient.appointments.map((apt) => (
                <div key={apt.id} className="flex items-center justify-between p-4 rounded-xl border border-[hsl(var(--border))]">
                  <div>
                    <p className="font-medium">{apt.doctorName}</p>
                    <p className="text-small flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDate(apt.appointmentTime)}
                    </p>
                  </div>
                  <span className={`badge ${
                    apt.status === "COMPLETED" ? "badge-success" :
                    apt.status === "PENDING" || apt.status === "CONFIRMED" ? "badge-info" : "badge-secondary"
                  }`}>
                    {apt.status === "COMPLETED" ? "Hoàn thành" :
                     apt.status === "PENDING" ? "Chờ xác nhận" :
                     apt.status === "CONFIRMED" ? "Đã xác nhận" : apt.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === "invoices" && (
        <div className="card-base">
          <h3 className="text-section mb-4">Hóa đơn</h3>
          <div className="space-y-3">
            {patient.invoices.length === 0 ? (
              <p className="text-center py-8 text-[hsl(var(--muted-foreground))]">
                Chưa có hóa đơn nào
              </p>
            ) : (
              patient.invoices.map((inv) => (
                <div key={inv.id} className="p-4 rounded-xl border border-[hsl(var(--border))] hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-semibold text-lg">{inv.invoiceNumber}</p>
                      <p className="text-sm text-gray-500">{formatDate(inv.createdAt)}</p>
                    </div>
                    <span className={`badge ${
                      inv.status === "PAID" ? "badge-success" : 
                      inv.status === "CANCELLED" ? "badge-error" : "badge-warning"
                    }`}>
                      {inv.status === "PAID" ? "Đã thanh toán" : 
                       inv.status === "CANCELLED" ? "Đã hủy" : "Chờ thanh toán"}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div className="bg-gray-50 rounded-lg p-2">
                      <p className="text-gray-500 text-xs">Tổng tiền</p>
                      <p className="font-semibold text-gray-900">{formatCurrency(inv.totalAmount)}</p>
                    </div>
                    {inv.discount > 0 && (
                      <div className="bg-green-50 rounded-lg p-2">
                        <p className="text-green-600 text-xs">Giảm giá</p>
                        <p className="font-semibold text-green-700">-{formatCurrency(inv.discount)}</p>
                      </div>
                    )}
                    <div className="bg-blue-50 rounded-lg p-2">
                      <p className="text-blue-600 text-xs">Đã thanh toán</p>
                      <p className="font-semibold text-blue-700">{formatCurrency(inv.paidAmount)}</p>
                    </div>
                    {inv.balanceDue > 0 && (
                      <div className="bg-amber-50 rounded-lg p-2">
                        <p className="text-amber-600 text-xs">Còn nợ</p>
                        <p className="font-semibold text-amber-700">{formatCurrency(inv.balanceDue)}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === "lab-results" && (
        <div className="card-base">
          <h3 className="text-section mb-4">Lịch sử xét nghiệm</h3>
          <div className="space-y-3">
            {labOrders.length === 0 ? (
              <p className="text-center py-8 text-[hsl(var(--muted-foreground))]">
                Chưa có kết quả xét nghiệm nào
              </p>
            ) : (
              labOrders.map((order) => {
                const statusColors: Record<LabOrderStatus, string> = {
                  ORDERED: "bg-blue-100 text-blue-700",
                  IN_PROGRESS: "bg-amber-100 text-amber-700",
                  COMPLETED: "bg-green-100 text-green-700",
                  CANCELLED: "bg-gray-100 text-gray-600",
                };
                const statusLabels: Record<LabOrderStatus, string> = {
                  ORDERED: "Đã chỉ định",
                  IN_PROGRESS: "Đang xử lý",
                  COMPLETED: "Hoàn thành",
                  CANCELLED: "Đã hủy",
                };
                const progress = order.totalTests > 0 ? Math.round((order.completedTests / order.totalTests) * 100) : 0;

                return (
                  <div key={order.id} className="p-4 rounded-xl border border-[hsl(var(--border))] hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <TestTube className="w-4 h-4 text-[hsl(var(--primary))]" />
                          <p className="font-semibold">#{order.orderNumber}</p>
                          <span className={`badge ${statusColors[order.status]}`}>
                            {statusLabels[order.status]}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500">
                          Bác sĩ: {order.orderingDoctorName || "—"} • {formatDate(order.orderDate)}
                        </p>
                      </div>
                      <Link
                        href={`/lab/orders/${order.id}`}
                        className="btn-secondary text-sm"
                      >
                        <Eye className="w-4 h-4" />
                        Xem
                      </Link>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm mb-2">
                      <div className="bg-gray-50 rounded-lg p-2">
                        <p className="text-gray-500 text-xs">Số xét nghiệm</p>
                        <p className="font-semibold">{order.totalTests}</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-2">
                        <p className="text-gray-500 text-xs">Hoàn thành</p>
                        <p className="font-semibold text-green-600">{order.completedTests}/{order.totalTests}</p>
                      </div>
                    </div>
                    {order.status !== "CANCELLED" && (
                      <div>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-gray-500">Tiến độ</span>
                          <span className="font-medium">{progress}%</span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all ${progress === 100 ? "bg-green-500" : "bg-blue-500"}`}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="flex gap-3">
        <Link href={`/receptionist/appointments/new?patientId=${patientId}`} className="btn-primary">
          <Calendar className="w-4 h-4" />
          Đặt lịch hẹn
        </Link>
        <Link href={`/receptionist/billing?patientId=${patientId}`} className="btn-secondary">
          <Receipt className="w-4 h-4" />
          Xem hóa đơn
        </Link>
      </div>

      {/* Edit Patient Modal */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa thông tin bệnh nhân</DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto pr-2 space-y-4" style={{ maxHeight: 'calc(90vh - 140px)' }}>
            {/* Basic Info */}
            <div className="bg-gradient-to-br from-blue-50 to-white border-2 border-blue-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-4">
                <User className="w-5 h-5 text-blue-600" />
                <h4 className="font-semibold text-blue-900">Thông tin cơ bản</h4>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Họ và tên *</label>
                  <input
                    type="text"
                    className={`input-base ${editErrors.fullName ? 'border-red-500' : ''}`}
                    value={editForm.fullName}
                    onChange={(e) => updateEditField('fullName', e.target.value)}
                    required
                  />
                  {editErrors.fullName && <p className="text-xs text-red-600">{editErrors.fullName}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Số điện thoại *</label>
                  <input
                    type="tel"
                    className={`input-base ${editErrors.phoneNumber ? 'border-red-500' : ''}`}
                    value={editForm.phoneNumber}
                    onChange={(e) => updateEditField('phoneNumber', e.target.value)}
                    required
                  />
                  {editErrors.phoneNumber && <p className="text-xs text-red-600">{editErrors.phoneNumber}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email</label>
                  <input
                    type="email"
                    className={`input-base ${editErrors.email ? 'border-red-500' : ''}`}
                    value={editForm.email}
                    onChange={(e) => updateEditField('email', e.target.value)}
                  />
                  {editErrors.email && <p className="text-xs text-red-600">{editErrors.email}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Ngày sinh *</label>
                  <input
                    type="date"
                    className={`input-base ${editErrors.dateOfBirth ? 'border-red-500' : ''}`}
                    value={editForm.dateOfBirth}
                    max={new Date().toISOString().split('T')[0]}
                    onChange={(e) => updateEditField('dateOfBirth', e.target.value)}
                    required
                  />
                  {editErrors.dateOfBirth && <p className="text-xs text-red-600">{editErrors.dateOfBirth}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Giới tính *</label>
                  <select
                    className="input-base"
                    value={editForm.gender}
                    onChange={(e) => setEditForm({ ...editForm, gender: e.target.value as "MALE" | "FEMALE" })}
                  >
                    <option value="MALE">Nam</option>
                    <option value="FEMALE">Nữ</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Địa chỉ</label>
                  <input
                    type="text"
                    className="input-base"
                    value={editForm.address}
                    onChange={(e) => updateEditField('address', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Medical Info */}
            <div className="bg-gradient-to-br from-red-50 to-white border-2 border-red-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-4">
                <Heart className="w-5 h-5 text-red-600" />
                <h4 className="font-semibold text-red-900">Thông tin y tế</h4>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Nhóm máu</label>
                  <select
                    className="input-base"
                    value={editForm.bloodType}
                    onChange={(e) => setEditForm({ ...editForm, bloodType: e.target.value })}
                  >
                    <option value="">-- Chọn --</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Số BHYT</label>
                  <input
                    type="text"
                    className="input-base"
                    placeholder="VD: HS123456789"
                    maxLength={20}
                    value={editForm.healthInsuranceNumber}
                    onChange={(e) => setEditForm({ ...editForm, healthInsuranceNumber: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Dị ứng</label>
                  <input
                    type="text"
                    className="input-base"
                    placeholder="VD: Penicillin..."
                    maxLength={100}
                    value={editForm.allergies}
                    onChange={(e) => setEditForm({ ...editForm, allergies: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Emergency Contact */}
            <div className="bg-gradient-to-br from-amber-50 to-white border-2 border-amber-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-4">
                <Phone className="w-5 h-5 text-amber-600" />
                <h4 className="font-semibold text-amber-900">Người liên hệ khẩn cấp</h4>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Họ tên người thân</label>
                  <input
                    type="text"
                    className="input-base"
                    placeholder="Nguyễn Văn A"
                    maxLength={100}
                    value={editForm.relativeFullName}
                    onChange={(e) => setEditForm({ ...editForm, relativeFullName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">SĐT người thân</label>
                  <input
                    type="tel"
                    className={`input-base ${editErrors.relativePhoneNumber ? 'border-red-500' : ''}`}
                    placeholder="0987654321"
                    value={editForm.relativePhoneNumber}
                    onChange={(e) => updateEditField('relativePhoneNumber', e.target.value)}
                  />
                  {editErrors.relativePhoneNumber && <p className="text-xs text-red-600">{editErrors.relativePhoneNumber}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Mối quan hệ</label>
                  <input
                    type="text"
                    className="input-base"
                    placeholder="VD: Cha, Mẹ..."
                    maxLength={100}
                    value={editForm.relativeRelationship}
                    onChange={(e) => setEditForm({ ...editForm, relativeRelationship: e.target.value })}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t mt-2">
            <button
              onClick={() => setIsEditOpen(false)}
              className="btn-secondary flex-1"
              disabled={saving}
            >
              Hủy
            </button>
            <button
              onClick={handleUpdatePatient}
              className="btn-primary flex-1"
              disabled={saving}
            >
              {saving ? "Đang lưu..." : "Lưu thay đổi"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

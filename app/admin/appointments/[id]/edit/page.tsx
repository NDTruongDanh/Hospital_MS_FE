"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Save,
  Loader2,
  Calendar,
  Clock,
  User,
  Stethoscope,
} from "lucide-react";
import { toast } from "sonner";
import { appointmentService, Appointment } from "@/services/appointment.service";
import { hrService } from "@/services/hr.service";
import type { AppointmentType } from "@/interfaces/appointment";

interface Doctor {
  id: string;
  fullName: string;
  department?: string;
  departmentId?: string;
}

const TYPE_OPTIONS = [
  { value: "CONSULTATION", label: "Khám bệnh" },
  { value: "FOLLOW_UP", label: "Tái khám" },
  { value: "EMERGENCY", label: "Cấp cứu" },
];

export default function EditAppointmentPage() {
  const router = useRouter();
  const params = useParams();
  const appointmentId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  
  // Departments and Doctors
  const [departments, setDepartments] = useState<{id: string; name: string}[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [allDoctors, setAllDoctors] = useState<Doctor[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  
  const [timeSlots, setTimeSlots] = useState<{time: string; available: boolean; current?: boolean}[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const [formData, setFormData] = useState({
    doctorId: "",
    appointmentDate: "",
    appointmentTime: "",
    type: "CONSULTATION" as AppointmentType,
    reason: "",
    notes: "",
  });

  useEffect(() => {
    fetchAppointment();
    fetchDepartments();
    fetchDoctors();
  }, [appointmentId]);

  // Filter doctors when department changes
  useEffect(() => {
    if (!selectedDepartment) {
      setDoctors(allDoctors);
    } else {
      setDoctors(allDoctors.filter(d => d.departmentId === selectedDepartment));
    }
  }, [selectedDepartment, allDoctors]);

  // Fetch time slots when doctor or date changes
  useEffect(() => {
    const fetchSlots = async () => {
      if (!formData.doctorId || !formData.appointmentDate) {
        setTimeSlots([]);
        return;
      }

      try {
        setLoadingSlots(true);
        let slots = await appointmentService.getAvailableSlots(
          formData.doctorId,
          formData.appointmentDate
        );
        
        // Mark current time slot as available
        if (appointment) {
          const currentTime = new Date(appointment.appointmentTime);
          const currentTimeStr = currentTime.toTimeString().slice(0, 5);
          slots = slots.map(slot => ({
            ...slot,
            available: slot.available || slot.time === currentTimeStr,
            current: slot.time === currentTimeStr
          }));
        }
        
        setTimeSlots(slots);
      } catch (error) {
        console.error("Failed to fetch slots:", error);
        setTimeSlots([]);
      } finally {
        setLoadingSlots(false);
      }
    };

    fetchSlots();
  }, [formData.doctorId, formData.appointmentDate, appointment]);

  const fetchAppointment = async () => {
    try {
      setLoading(true);
      const data = await appointmentService.getById(appointmentId);
      if (!data) {
        toast.error("Không tìm thấy cuộc hẹn");
        return;
      }
      setAppointment(data);
      
      // Parse appointment time
      const appointmentDate = new Date(data.appointmentTime);
      
      setFormData({
        doctorId: data.doctor.id,
        appointmentDate: appointmentDate.toISOString().split("T")[0],
        appointmentTime: appointmentDate.toTimeString().slice(0, 5),
        type: data.type,
        reason: data.reason || "",
        notes: data.notes || "",
      });
    } catch (error) {
      console.error("Failed to fetch appointment:", error);
      toast.error("Không thể tải thông tin cuộc hẹn");
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await hrService.getDepartments();
      setDepartments(response.content.map((dept: any) => ({
        id: dept.id,
        name: dept.name,
      })));
    } catch (error) {
      console.error("Failed to fetch departments:", error);
    }
  };

  const fetchDoctors = async () => {
    try {
      const response = await hrService.getEmployees({ role: "DOCTOR" });
      const doctorList = response.content.map((emp: any) => ({
        id: emp.id,
        fullName: emp.fullName,
        department: emp.departmentName,
        departmentId: emp.departmentId,
      }));
      setAllDoctors(doctorList);
      setDoctors(doctorList);
    } catch (error) {
      console.error("Failed to fetch doctors:", error);
    }
  };

  const handleSubmit = async () => {
    if (!appointment || !formData.doctorId || !formData.appointmentDate || !formData.appointmentTime) {
      toast.error("Vui lòng điền đầy đủ thông tin");
      return;
    }

    try {
      setSaving(true);
      const appointmentTime = `${formData.appointmentDate}T${formData.appointmentTime}:00+07:00`;
      
      await appointmentService.update(appointmentId, {
        patientId: appointment.patient.id, // Backend requires patientId
        doctorId: formData.doctorId,
        appointmentTime,
        type: formData.type,
        reason: formData.reason || undefined,
        notes: formData.notes || undefined,
      });

      toast.success("Đã cập nhật lịch hẹn thành công!");
      router.push(`/admin/appointments/${appointmentId}`);
    } catch (error) {
      console.error("Failed to update appointment:", error);
      toast.error("Không thể cập nhật lịch hẹn");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-[hsl(var(--primary))]" />
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="text-center py-20">
        <p className="text-[hsl(var(--muted-foreground))]">Không tìm thấy cuộc hẹn</p>
        <Link href="/admin/appointments" className="btn-primary mt-4 inline-flex">
          Quay lại danh sách
        </Link>
      </div>
    );
  }

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/admin/appointments/${appointmentId}`} className="btn-icon">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-display">Chỉnh sửa lịch hẹn</h1>
          <p className="text-[hsl(var(--muted-foreground))] mt-1">
            Cập nhật thông tin cuộc hẹn
          </p>
        </div>
      </div>

      {/* Patient Info (readonly) */}
      <div className="backdrop-blur-lg bg-white/70 border border-white/50 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-gradient-to-br from-blue-400 to-indigo-500 shadow-lg">
            <User className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-section">Bệnh nhân</h3>
        </div>
        <div className="p-4 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100">
          <p className="font-semibold text-gray-800">{appointment.patient.fullName}</p>
          {appointment.patient.phoneNumber && (
            <p className="text-small text-gray-500">{appointment.patient.phoneNumber}</p>
          )}
        </div>
      </div>

      {/* Edit Form */}
      <div className="backdrop-blur-lg bg-white/70 border border-white/50 rounded-2xl p-6 shadow-xl space-y-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-gradient-to-br from-green-400 to-emerald-500 shadow-lg">
            <Stethoscope className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-section">Thông tin cuộc hẹn</h3>
        </div>

        {/* Department */}
        <div className="space-y-2">
          <label className="text-label">Khoa *</label>
          <select
            className="dropdown w-full bg-gradient-to-r from-white/80 to-white/60 backdrop-blur border-white/50"
            value={selectedDepartment}
            onChange={(e) => {
              setSelectedDepartment(e.target.value);
              setFormData({ ...formData, doctorId: "" }); // Reset doctor when department changes
            }}
          >
            <option value="">-- Tất cả khoa --</option>
            {departments.map((dept) => (
              <option key={dept.id} value={dept.id}>
                {dept.name}
              </option>
            ))}
          </select>
        </div>

        {/* Doctor */}
        <div className="space-y-2">
          <label className="text-label">Bác sĩ *</label>
          <select
            className="dropdown w-full bg-gradient-to-r from-white/80 to-white/60 backdrop-blur border-white/50"
            value={formData.doctorId}
            onChange={(e) => setFormData({ ...formData, doctorId: e.target.value })}
          >
            <option value="">-- Chọn bác sĩ --</option>
            {doctors.map((doc) => (
              <option key={doc.id} value={doc.id}>
                BS. {doc.fullName} {doc.department && `- ${doc.department}`}
              </option>
            ))}
          </select>
        </div>

        {/* Date & Time */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-label">Ngày khám *</label>
            <input
              type="date"
              className="input-base bg-gradient-to-r from-white/80 to-white/60 backdrop-blur border-white/50"
              min={today}
              value={formData.appointmentDate}
              onChange={(e) => setFormData({ ...formData, appointmentDate: e.target.value, appointmentTime: "" })}
            />
          </div>
          <div className="space-y-2">
            <label className="text-label">Giờ khám *</label>
            <select
              className="dropdown w-full bg-gradient-to-r from-white/80 to-white/60 backdrop-blur border-white/50"
              value={formData.appointmentTime}
              onChange={(e) => setFormData({ ...formData, appointmentTime: e.target.value })}
              disabled={loadingSlots || timeSlots.length === 0}
            >
              <option value="">
                {loadingSlots ? "Đang tải..." : timeSlots.length === 0 ? "Chọn bác sĩ và ngày" : "-- Chọn giờ --"}
              </option>
              {timeSlots.map((slot) => (
                <option key={slot.time} value={slot.time} disabled={!slot.available}>
                  {slot.time} {!slot.available && "(Đã đặt)"} {slot.current && "(Hiện tại)"}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Type */}
        <div className="space-y-2">
          <label className="text-label">Loại khám *</label>
          <select
            className="dropdown w-full bg-gradient-to-r from-white/80 to-white/60 backdrop-blur border-white/50"
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value as AppointmentType })}
          >
            {TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        {/* Reason */}
        <div className="space-y-2">
          <label className="text-label">Lý do khám</label>
          <textarea
            className="input-base min-h-[80px] resize-none bg-gradient-to-r from-white/80 to-white/60 backdrop-blur border-white/50"
            placeholder="Nhập lý do khám..."
            value={formData.reason}
            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
          />
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <label className="text-label">Ghi chú</label>
          <textarea
            className="input-base min-h-[60px] resize-none bg-gradient-to-r from-white/80 to-white/60 backdrop-blur border-white/50"
            placeholder="Ghi chú thêm..."
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Link 
          href={`/admin/appointments/${appointmentId}`} 
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white/70 backdrop-blur border border-white/50 text-gray-700 font-medium hover:bg-white/90 transition-all shadow-lg"
        >
          Hủy
        </Link>
        <button
          onClick={handleSubmit}
          disabled={saving}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium hover:from-blue-600 hover:to-indigo-700 transition-all shadow-lg disabled:opacity-50"
        >
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
          <Save className="w-4 h-4" />
          Lưu thay đổi
        </button>
      </div>
    </div>
  );
}

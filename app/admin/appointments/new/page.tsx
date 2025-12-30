"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft,
  Search,
  User,
  Plus,
  Calendar,
  Clock,
  Stethoscope,
  Save,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { getPatients } from "@/services/patient.service";
import { hrService } from "@/services/hr.service";
import { appointmentService } from "@/services/appointment.service";
import type { AppointmentType } from "@/interfaces/appointment";
import { Patient } from "@/interfaces/patient";

interface Doctor {
  id: string;
  fullName: string;
  department?: string;
  departmentId?: string;
}

const TYPE_LABELS: Record<string, string> = {
  CONSULTATION: "Khám bệnh",
  FOLLOW_UP: "Tái khám",
  EMERGENCY: "Cấp cứu",
  WALK_IN: "Walk-in",
};

export default function AdminNewAppointmentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedPatientId = searchParams.get("patientId");
  
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(preselectedPatientId ? 2 : 1);
  
  // Step 1: Patient
  const [allPatients, setAllPatients] = useState<Patient[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [patientSearch, setPatientSearch] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [loadingPatients, setLoadingPatients] = useState(false);
  
  // Step 2: Doctor & Time
  const [departments, setDepartments] = useState<{id: string; name: string}[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [allDoctors, setAllDoctors] = useState<Doctor[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [timeSlots, setTimeSlots] = useState<{time: string; available: boolean}[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [formData, setFormData] = useState<{
    doctorId: string;
    appointmentDate: string;
    appointmentTime: string;
    reason: string;
    notes: string;
    type: AppointmentType;
  }>({
    doctorId: "",
    appointmentDate: "",
    appointmentTime: "",
    reason: "",
    notes: "",
    type: "CONSULTATION",
  });

  useEffect(() => {
    fetchDepartments();
    fetchDoctors();
    fetchAllPatients(); // Load all patients on mount
    if (preselectedPatientId) {
      fetchPatientById(preselectedPatientId);
    }
  }, []);

  // Filter patients client-side when search changes
  useEffect(() => {
    if (!patientSearch.trim()) {
      setPatients(allPatients);
    } else {
      const searchLower = patientSearch.toLowerCase().trim();
      const filtered = allPatients.filter(p => 
        p.fullName.toLowerCase().includes(searchLower) ||
        (p.phoneNumber && p.phoneNumber.includes(patientSearch.trim()))
      );
      setPatients(filtered);
    }
  }, [patientSearch, allPatients]);

  // Filter doctors when department changes
  useEffect(() => {
    if (!selectedDepartment) {
      setDoctors(allDoctors);
    } else {
      setDoctors(allDoctors.filter(d => d.departmentId === selectedDepartment));
    }
    // Reset doctor selection when department changes
    setFormData(prev => ({ ...prev, doctorId: "" }));
  }, [selectedDepartment, allDoctors]);

  // Fetch all patients for client-side filtering
  const fetchAllPatients = async () => {
    try {
      setLoadingPatients(true);
      const response = await getPatients({ size: 1000 }); // Fetch all (or max reasonable)
      setAllPatients(response.content);
      setPatients(response.content);
    } catch (error) {
      console.error("Failed to fetch patients:", error);
      toast.error("Không thể tải danh sách bệnh nhân");
    } finally {
      setLoadingPatients(false);
    }
  };

  const fetchPatientById = async (id: string) => {
    try {
      // Use getPatient single fetch instead of list search
      const { getPatient } = await import("@/services/patient.service");
      const patient = await getPatient(id);
      setSelectedPatient(patient);
    } catch (error) {
      console.error("Failed to fetch patient:", error);
    }
  };

  // searchPatients is no longer needed - filtering happens client-side

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

  // Fetch available time slots when doctor and date are selected
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
        
        // Filter out past time slots if the selected date is today
        const today = new Date().toISOString().split("T")[0];
        if (formData.appointmentDate === today) {
          const now = new Date();
          const currentHour = now.getHours();
          const currentMinute = now.getMinutes();
          
          slots = slots.map(slot => {
            const [slotHour, slotMinute] = slot.time.split(":").map(Number);
            // Mark as unavailable if the time has passed
            const isPast = slotHour < currentHour || 
              (slotHour === currentHour && slotMinute <= currentMinute);
            return {
              ...slot,
              available: slot.available && !isPast
            };
          });
        }
        
        setTimeSlots(slots);
      } catch (error) {
        console.error("Failed to fetch time slots:", error);
        toast.error("Không thể tải danh sách giờ khám");
        setTimeSlots([]);
      } finally {
        setLoadingSlots(false);
      }
    };

    fetchSlots();
  }, [formData.doctorId, formData.appointmentDate]);

  const handleSubmit = async () => {
    if (!selectedPatient || !formData.doctorId || !formData.appointmentDate || !formData.appointmentTime) {
      toast.error("Vui lòng điền đầy đủ thông tin");
      return;
    }

    try {
      setLoading(true);
      // Format datetime with local timezone offset (Asia/Ho_Chi_Minh = +07:00)
      const appointmentTime = `${formData.appointmentDate}T${formData.appointmentTime}:00+07:00`;
      
      await appointmentService.create({
        patientId: selectedPatient.id,
        doctorId: formData.doctorId,
        appointmentTime,
        type: formData.type,
        reason: formData.reason || "Khám tổng quát",
        notes: formData.notes || undefined,
      });

      toast.success("Đặt lịch hẹn thành công!");
      router.push("/admin/appointments");
    } catch (error) {
      toast.error("Không thể đặt lịch hẹn");
    } finally {
      setLoading(false);
    }
  };

  // timeSlots now loaded dynamically via useEffect

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/appointments" className="btn-icon">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-display">Đặt lịch hẹn mới</h1>
          <p className="text-[hsl(var(--muted-foreground))] mt-1">
            Đặt lịch khám cho bệnh nhân
          </p>
        </div>
      </div>

      {/* Progress */}
      <div className="flex gap-2">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={`flex-1 h-2 rounded-full ${
              s <= step ? "bg-[hsl(var(--primary))]" : "bg-[hsl(var(--secondary))]"
            }`}
          />
        ))}
      </div>

      {/* Step 1: Select Patient */}
      {step === 1 && (
        <div className="card-base space-y-4">
          <h3 className="text-section">Bước 1: Chọn bệnh nhân</h3>
          
          <div className="search-input w-full">
            <Search className="w-4 h-4 text-[hsl(var(--muted-foreground))]" />
            <input
              type="text"
              placeholder="Gõ để lọc theo tên hoặc SĐT..."
              value={patientSearch}
              onChange={(e) => setPatientSearch(e.target.value)}
              autoFocus
            />
          </div>

          {loadingPatients ? (
            <div className="text-center py-8">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-[hsl(var(--primary))]" />
              <p className="text-small mt-2">Đang tải danh sách bệnh nhân...</p>
            </div>
          ) : patients.length > 0 ? (
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              <p className="text-small text-[hsl(var(--muted-foreground))]">
                {patientSearch ? `Tìm thấy ${patients.length} bệnh nhân` : `Tất cả ${patients.length} bệnh nhân`}
              </p>
              {patients.slice(0, 20).map((patient) => (
                <button
                  key={patient.id}
                  onClick={() => {
                    setSelectedPatient(patient);
                    setStep(2);
                  }}
                  className="w-full flex items-center gap-4 p-4 rounded-xl border border-[hsl(var(--border))] hover:border-[hsl(var(--primary))] hover:bg-[hsl(var(--primary-light))] text-left transition-colors"
                >
                  <div className="avatar">{patient.fullName.charAt(0)}</div>
                  <div>
                    <p className="font-medium">{patient.fullName}</p>
                    <p className="text-small">{patient.phoneNumber || "Chưa có SĐT"}</p>
                  </div>
                </button>
              ))}
              {patients.length > 20 && (
                <p className="text-small text-center text-[hsl(var(--muted-foreground))]">
                  Còn {patients.length - 20} bệnh nhân nữa, hãy nhập thêm để lọc...
                </p>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-[hsl(var(--muted-foreground))]">
              <User className="w-12 h-12 mx-auto opacity-50" />
              <p className="mt-2">Không tìm thấy bệnh nhân nào</p>
            </div>
          )}
        </div>
      )}

      {/* Step 2: Select Doctor & Time */}
      {step === 2 && selectedPatient && (
        <div className="card-base space-y-4">
          <h3 className="text-section">Bước 2: Chọn bác sĩ và thời gian</h3>
          
          <div className="p-4 rounded-xl bg-[hsl(var(--secondary))]">
            <p className="text-label">Bệnh nhân</p>
            <p className="font-semibold">{selectedPatient.fullName}</p>
          </div>

          <div className="space-y-2">
            <label className="text-label">Khoa *</label>
            <select
              className="dropdown w-full"
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
            >
              <option value="">-- Tất cả khoa --</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-label">Bác sĩ *</label>
            <select
              className="dropdown w-full"
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-label">Ngày khám *</label>
              <input
                type="date"
                className="input-base"
                min={today}
                value={formData.appointmentDate}
                onChange={(e) => setFormData({ ...formData, appointmentDate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-label">Giờ khám *</label>
              <select
                className="dropdown w-full"
                value={formData.appointmentTime}
                onChange={(e) => setFormData({ ...formData, appointmentTime: e.target.value })}
                disabled={loadingSlots || timeSlots.length === 0}
              >
                <option value="">
                  {loadingSlots ? "Đang tải..." : timeSlots.length === 0 ? "Chọn bác sĩ và ngày trước" : "-- Chọn giờ --"}
                </option>
                {timeSlots.map((slot) => (
                  <option key={slot.time} value={slot.time} disabled={!slot.available}>
                    {slot.time} {!slot.available && "(Đã đặt)"}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Loại khám */}
          <div className="space-y-2">
            <label className="text-label">Loại khám *</label>
            <select
              className="dropdown w-full"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as AppointmentType })}
            >
              <option value="CONSULTATION">Khám bệnh</option>
              <option value="FOLLOW_UP">Tái khám</option>
              <option value="EMERGENCY">Cấp cứu</option>
            </select>
          </div>

          <div className="flex gap-3 pt-4 border-t border-[hsl(var(--border))]">
            <button onClick={() => setStep(1)} className="btn-secondary flex-1">
              Quay lại
            </button>
            <button
              onClick={() => setStep(3)}
              disabled={!formData.doctorId || !formData.appointmentDate || !formData.appointmentTime}
              className="btn-primary flex-1"
            >
              Tiếp tục
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Confirm */}
      {step === 3 && selectedPatient && (
        <div className="card-base space-y-4">
          <h3 className="text-section">Bước 3: Xác nhận</h3>
          
          <div className="space-y-3">
            <div className="p-4 rounded-xl bg-[hsl(var(--secondary))]">
              <p className="text-label">Bệnh nhân</p>
              <p className="font-semibold">{selectedPatient.fullName}</p>
            </div>
            <div className="p-4 rounded-xl bg-[hsl(var(--secondary))]">
              <p className="text-label">Bác sĩ</p>
              <p className="font-semibold">
                {doctors.find(d => d.id === formData.doctorId)?.fullName}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-[hsl(var(--secondary))]">
              <p className="text-label">Thời gian</p>
              <p className="font-semibold">{formData.appointmentDate} lúc {formData.appointmentTime}</p>
            </div>
            <div className="p-4 rounded-xl bg-[hsl(var(--secondary))]">
              <p className="text-label">Loại khám</p>
              <p className="font-semibold">{TYPE_LABELS[formData.type]}</p>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-label">Lý do khám</label>
            <textarea
              className="input-base min-h-[80px] resize-none"
              placeholder="Nhập lý do khám (tuỳ chọn)..."
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <label className="text-label">Ghi chú</label>
            <textarea
              className="input-base min-h-[60px] resize-none"
              placeholder="Ghi chú thêm cho cuộc hẹn (tuỳ chọn)..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>

          <div className="flex gap-3 pt-4 border-t border-[hsl(var(--border))]">
            <button onClick={() => setStep(2)} className="btn-secondary flex-1">
              Quay lại
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="btn-primary flex-1"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              <Save className="w-4 h-4" />
              Đặt lịch
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

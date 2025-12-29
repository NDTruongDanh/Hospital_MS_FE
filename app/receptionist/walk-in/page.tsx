"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  User,
  Phone,
  Mail,
  Calendar,
  MapPin,
  Stethoscope,
  Clock,
  Loader2,
  CheckCircle,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import { getPatients, createPatient } from "@/services/patient.service";
import { hrService } from "@/services/hr.service";
import { appointmentService } from "@/services/appointment.service";

interface Doctor {
  id: string;
  fullName: string;
  department?: string;
  departmentId?: string;
}

export default function WalkInPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState<{id: string; name: string}[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [allDoctors, setAllDoctors] = useState<Doctor[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  
  // Patient search/create
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [isNewPatient, setIsNewPatient] = useState(false);
  
  // New patient form
  const [patientForm, setPatientForm] = useState({
    fullName: "",
    phoneNumber: "",
    email: "",
    dateOfBirth: "",
    gender: "MALE" as "MALE" | "FEMALE",
    address: "",
  });

  // Appointment form
  const [appointmentForm, setAppointmentForm] = useState({
    doctorId: "",
    reason: "",
    appointmentDate: new Date().toISOString().split("T")[0],
    appointmentTime: "",
  });
  const [timeSlots, setTimeSlots] = useState<{time: string; available: boolean}[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  useEffect(() => {
    fetchDepartments();
    fetchDoctors();
  }, []);

  // Filter doctors when department changes
  useEffect(() => {
    if (!selectedDepartment) {
      setDoctors(allDoctors);
    } else {
      setDoctors(allDoctors.filter(d => d.departmentId === selectedDepartment));
    }
    setAppointmentForm(prev => ({ ...prev, doctorId: "" }));
  }, [selectedDepartment, allDoctors]);

  // Fetch available time slots when doctor and date are selected
  useEffect(() => {
    const fetchSlots = async () => {
      if (!appointmentForm.doctorId || !appointmentForm.appointmentDate) {
        setTimeSlots([]);
        return;
      }

      try {
        setLoadingSlots(true);
        const slots = await appointmentService.getAvailableSlots(
          appointmentForm.doctorId,
          appointmentForm.appointmentDate
        );
        setTimeSlots(slots);
      } catch (error) {
        console.error("Failed to fetch time slots:", error);
        setTimeSlots([]);
      } finally {
        setLoadingSlots(false);
      }
    };

    fetchSlots();
  }, [appointmentForm.doctorId, appointmentForm.appointmentDate]);

  useEffect(() => {
    if (searchQuery.length >= 2) {
      searchPatients();
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const fetchDepartments = async () => {
    try {
      const response = await hrService.getDepartments();
      setDepartments(response.content.map((dept: any) => ({ id: dept.id, name: dept.name })));
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

  const searchPatients = async () => {
    try {
      const response = await getPatients({ search: searchQuery });
      setSearchResults(response.content || []);
    } catch (error) {
      console.error("Failed to search patients:", error);
    }
  };

  const handleSelectPatient = (patient: any) => {
    setSelectedPatient(patient);
    setIsNewPatient(false);
    setStep(2);
  };

  const handleNewPatient = () => {
    setSelectedPatient(null);
    setIsNewPatient(true);
    setPatientForm({
      ...patientForm,
      fullName: searchQuery,
    });
    setStep(2);
  };

  const handleCreatePatient = async () => {
    if (!patientForm.fullName || !patientForm.phoneNumber) {
      toast.error("Vui lòng nhập họ tên và số điện thoại");
      return;
    }

    try {
      setLoading(true);
      const newPatient = await createPatient(patientForm);
      setSelectedPatient(newPatient);
      setIsNewPatient(false);
      toast.success("Đã tạo hồ sơ bệnh nhân mới");
      setStep(3);
    } catch (error) {
      toast.error("Không thể tạo hồ sơ bệnh nhân");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAppointment = async () => {
    if (!selectedPatient || !appointmentForm.doctorId) {
      toast.error("Vui lòng chọn bác sĩ");
      return;
    }

    try {
      setLoading(true);
      // Format datetime with local timezone offset (Asia/Ho_Chi_Minh = +07:00)
      const appointmentTime = `${appointmentForm.appointmentDate}T${appointmentForm.appointmentTime}:00+07:00`;
      
      await appointmentService.create({
        patientId: selectedPatient.id,
        doctorId: appointmentForm.doctorId,
        appointmentTime,
        reason: appointmentForm.reason || "Khám tổng quát",
        type: "CONSULTATION",
      });
      toast.success("Đã tiếp nhận bệnh nhân thành công!");
      router.push("/receptionist/queue");
    } catch (error) {
      toast.error("Không thể tạo lịch hẹn");
    } finally {
      setLoading(false);
    }
  };

  // timeSlots now loaded dynamically via useEffect

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-display">Tiếp nhận bệnh nhân</h1>
        <p className="text-[hsl(var(--muted-foreground))] mt-1">
          Đăng ký khám cho bệnh nhân walk-in
        </p>
      </div>

      {/* Steps Indicator */}
      <div className="flex items-center gap-4">
        {[
          { num: 1, label: "Bệnh nhân" },
          { num: 2, label: "Thông tin" },
          { num: 3, label: "Đặt lịch" },
        ].map((s, i) => (
          <div key={s.num} className="flex items-center flex-1">
            <div className={`flex items-center gap-2 ${step >= s.num ? "text-[hsl(var(--primary))]" : "text-[hsl(var(--muted-foreground))]"}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step > s.num 
                  ? "bg-[hsl(var(--primary))] text-white" 
                  : step === s.num 
                    ? "border-2 border-[hsl(var(--primary))] text-[hsl(var(--primary))]"
                    : "border-2 border-[hsl(var(--border))]"
              }`}>
                {step > s.num ? <CheckCircle className="w-4 h-4" /> : s.num}
              </div>
              <span className="font-medium hidden sm:block">{s.label}</span>
            </div>
            {i < 2 && (
              <div className={`flex-1 h-0.5 mx-4 ${step > s.num ? "bg-[hsl(var(--primary))]" : "bg-[hsl(var(--border))]"}`} />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Search/Select Patient */}
      {step === 1 && (
        <div className="card-base space-y-4">
          <h2 className="text-section">Tìm kiếm bệnh nhân</h2>
          
          <div className="search-input w-full max-w-none">
            <Search className="w-4 h-4 text-[hsl(var(--muted-foreground))]" />
            <input
              type="text"
              placeholder="Nhập tên hoặc số điện thoại bệnh nhân..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
          </div>

          {searchResults.length > 0 && (
            <div className="space-y-2">
              <p className="text-small">Kết quả tìm kiếm ({searchResults.length})</p>
              {searchResults.map((patient) => (
                <button
                  key={patient.id}
                  onClick={() => handleSelectPatient(patient)}
                  className="w-full flex items-center gap-4 p-4 rounded-xl border border-[hsl(var(--border))] hover:border-[hsl(var(--primary))] hover:bg-[hsl(var(--primary-light))] transition-colors text-left"
                >
                  <div className="avatar">{patient.fullName?.charAt(0)}</div>
                  <div className="flex-1">
                    <p className="font-medium">{patient.fullName}</p>
                    <p className="text-small">{patient.phoneNumber}</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {searchQuery.length >= 2 && searchResults.length === 0 && (
            <div className="text-center py-8">
              <User className="w-12 h-12 mx-auto text-[hsl(var(--muted-foreground))] opacity-50" />
              <p className="text-[hsl(var(--muted-foreground))] mt-2">Không tìm thấy bệnh nhân</p>
              <button onClick={handleNewPatient} className="btn-primary mt-4">
                Tạo hồ sơ mới
              </button>
            </div>
          )}
        </div>
      )}

      {/* Step 2: Patient Form */}
      {step === 2 && (
        <div className="card-base space-y-4">
          <h2 className="text-section">
            {isNewPatient ? "Tạo hồ sơ bệnh nhân mới" : "Thông tin bệnh nhân"}
          </h2>

          {isNewPatient ? (
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-2">
                <label className="text-label">Họ và tên *</label>
                <input
                  type="text"
                  className="input-base"
                  value={patientForm.fullName}
                  onChange={(e) => setPatientForm({ ...patientForm, fullName: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-label">Số điện thoại *</label>
                <input
                  type="tel"
                  className="input-base"
                  value={patientForm.phoneNumber}
                  onChange={(e) => setPatientForm({ ...patientForm, phoneNumber: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-label">Email</label>
                <input
                  type="email"
                  className="input-base"
                  value={patientForm.email}
                  onChange={(e) => setPatientForm({ ...patientForm, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-label">Ngày sinh</label>
                <input
                  type="date"
                  className="input-base"
                  value={patientForm.dateOfBirth}
                  onChange={(e) => setPatientForm({ ...patientForm, dateOfBirth: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-label">Giới tính</label>
                <select
                  className="input-base"
                  value={patientForm.gender}
                  onChange={(e) => setPatientForm({ ...patientForm, gender: e.target.value as "MALE" | "FEMALE" })}
                >
                  <option value="MALE">Nam</option>
                  <option value="FEMALE">Nữ</option>
                </select>
              </div>
              <div className="col-span-2 space-y-2">
                <label className="text-label">Địa chỉ</label>
                <input
                  type="text"
                  className="input-base"
                  value={patientForm.address}
                  onChange={(e) => setPatientForm({ ...patientForm, address: e.target.value })}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-4 rounded-xl bg-[hsl(var(--secondary))]">
                <div className="avatar w-14 h-14 text-lg">
                  {selectedPatient?.fullName?.charAt(0)}
                </div>
                <div>
                  <p className="text-lg font-semibold">{selectedPatient?.fullName}</p>
                  <p className="text-small">{selectedPatient?.phoneNumber}</p>
                </div>
              </div>
              {selectedPatient?.email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="w-4 h-4" /> {selectedPatient.email}
                </div>
              )}
              {selectedPatient?.address && (
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="w-4 h-4" /> {selectedPatient.address}
                </div>
              )}
            </div>
          )}

          <div className="flex justify-between pt-4 border-t border-[hsl(var(--border))]">
            <button onClick={() => setStep(1)} className="btn-secondary">
              Quay lại
            </button>
            <button
              onClick={() => isNewPatient ? handleCreatePatient() : setStep(3)}
              disabled={loading}
              className="btn-primary"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {isNewPatient ? "Tạo và tiếp tục" : "Tiếp tục"}
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Schedule Appointment */}
      {step === 3 && (
        <div className="card-base space-y-4">
          <h2 className="text-section">Đặt lịch khám</h2>

          <div className="space-y-4">
            {/* Doctor Selection */}
            <div className="space-y-2">
              <label className="text-label">Chọn khoa</label>
              <select
                className="input-base"
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
              >
                <option value="">-- Tất cả khoa --</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>{dept.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-label">Chọn bác sĩ *</label>
              <select
                className="input-base"
                value={appointmentForm.doctorId}
                onChange={(e) => setAppointmentForm({ ...appointmentForm, doctorId: e.target.value })}
                required
              >
                <option value="">-- Chọn bác sĩ --</option>
                {doctors.map((doc) => (
                  <option key={doc.id} value={doc.id}>
                    {doc.fullName} {doc.department ? `(${doc.department})` : ""}
                  </option>
                ))}
              </select>
            </div>

            {/* Time Selection */}
            <div className="space-y-2">
              <label className="text-label">Chọn giờ khám *</label>
              <div className="grid grid-cols-6 gap-2">
                {loadingSlots ? (
                  <div className="col-span-6 text-center py-4 text-sm text-[hsl(var(--muted-foreground))]">
                    Đang tải danh sách giờ khám...
                  </div>
                ) : timeSlots.length === 0 ? (
                  <div className="col-span-6 text-center py-4 text-sm text-[hsl(var(--muted-foreground))]">
                    Chọn bác sĩ và ngày để xem giờ khám
                  </div>
                ) : (
                  timeSlots.map((slot) => (
                    <button
                      key={slot.time}
                      type="button"
                      onClick={() => setAppointmentForm({ ...appointmentForm, appointmentTime: slot.time })}
                      disabled={!slot.available}
                      className={`py-2 px-3 rounded-lg text-sm font-medium border transition-colors ${
                        appointmentForm.appointmentTime === slot.time
                          ? "bg-[hsl(var(--primary))] text-white border-[hsl(var(--primary))]"
                          : !slot.available
                          ? "border-[hsl(var(--border))] opacity-50 cursor-not-allowed bg-gray-100"
                          : "border-[hsl(var(--border))] hover:border-[hsl(var(--primary))]"
                      }`}
                    >
                      {slot.time}
                      {!slot.available && <span className="block text-xs">Đã đặt</span>}
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Reason */}
            <div className="space-y-2">
              <label className="text-label">Lý do khám</label>
              <textarea
                className="input-base min-h-[80px] resize-none"
                placeholder="Mô tả triệu chứng hoặc lý do khám..."
                value={appointmentForm.reason}
                onChange={(e) => setAppointmentForm({ ...appointmentForm, reason: e.target.value })}
              />
            </div>
          </div>

          <div className="flex justify-between pt-4 border-t border-[hsl(var(--border))]">
            <button onClick={() => setStep(2)} className="btn-secondary">
              Quay lại
            </button>
            <button
              onClick={handleCreateAppointment}
              disabled={loading || !appointmentForm.doctorId || !appointmentForm.appointmentTime}
              className="btn-primary"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Hoàn tất tiếp nhận
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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

// Zod validation schema
const patientSchema = z.object({
  fullName: z.string().min(1, "Vui lòng nhập họ tên").max(100, "Họ tên không quá 100 ký tự"),
  phoneNumber: z.string()
    .regex(/^(0|\+84)(\d{9})$/, "Số điện thoại phải có 10 số, bắt đầu bằng 0 (VD: 0987654321)"),
  email: z.string().email("Email không hợp lệ").optional().or(z.literal("")),
  dateOfBirth: z.string().min(1, "Vui lòng chọn ngày sinh"),
  gender: z.enum(["MALE", "FEMALE"], { message: "Vui lòng chọn giới tính" }),
  address: z.string().optional(),
  // Medical info (optional)
  bloodType: z.string().optional(),
  healthInsuranceNumber: z.string().max(20, "Số BHYT không quá 20 ký tự").optional(),
  allergies: z.string().max(100, "Dị ứng không quá 100 ký tự").optional(),
  // Emergency contact (optional)
  relativeFullName: z.string().max(100).optional(),
  relativePhoneNumber: z.string().regex(/^(0|\+84)(\d{9})$/, "Số điện thoại không hợp lệ").optional().or(z.literal("")),
  relativeRelationship: z.string().max(100).optional(),
});

type PatientFormData = z.infer<typeof patientSchema>;
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
    // Medical info
    bloodType: "",
    healthInsuranceNumber: "",
    allergies: "",
    // Emergency contact
    relativeFullName: "",
    relativePhoneNumber: "",
    relativeRelationship: "",
  });
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Appointment form
  const [appointmentForm, setAppointmentForm] = useState({
    doctorId: "",
    reason: "",
    appointmentDate: new Date().toISOString().split("T")[0],
    appointmentTime: "",
    priority: 5, // Default normal priority (1-2 = high, 5 = normal)
    notes: "",
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
    // Validate with zod
    const result = patientSchema.safeParse(patientForm);
    
    if (!result.success) {
      // Extract and set validation errors
      const errors: Record<string, string> = {};
      result.error.issues.forEach((err: any) => {
        if (err.path[0]) {
          errors[err.path[0] as string] = err.message;
        }
      });
      setValidationErrors(errors);
      toast.error("Vui lòng kiểm tra lại thông tin");
      return;
    }

    // Clear validation errors
    setValidationErrors({});

    try {
      setLoading(true);
      // Clean data before sending to backend
      const cleanedData: any = {
        fullName: patientForm.fullName.trim(),
        phoneNumber: patientForm.phoneNumber.trim(),
        dateOfBirth: patientForm.dateOfBirth,
        gender: patientForm.gender,
      };

      // Only add email if it's valid
      if (patientForm.email && patientForm.email.includes('@')) {
        cleanedData.email = patientForm.email.trim();
      }

      // Only add address if not empty
      if (patientForm.address) {
        cleanedData.address = patientForm.address.trim();
      }

      // Medical info (optional)
      if (patientForm.bloodType) {
        cleanedData.bloodType = patientForm.bloodType;
      }
      if (patientForm.healthInsuranceNumber) {
        cleanedData.healthInsuranceNumber = patientForm.healthInsuranceNumber.trim();
      }
      if (patientForm.allergies) {
        cleanedData.allergies = patientForm.allergies.trim();
      }

      // Emergency contact (optional)
      if (patientForm.relativeFullName) {
        cleanedData.relativeFullName = patientForm.relativeFullName.trim();
      }
      if (patientForm.relativePhoneNumber) {
        cleanedData.relativePhoneNumber = patientForm.relativePhoneNumber.trim();
      }
      if (patientForm.relativeRelationship) {
        cleanedData.relativeRelationship = patientForm.relativeRelationship.trim();
      }

      const newPatient = await createPatient(cleanedData);
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
      
      // Map priority number to priorityReason string for backend
      const priorityReasonMap: Record<number, string | undefined> = {
        1: "EMERGENCY",
        2: "EMERGENCY",
        3: "ELDERLY",
        4: undefined, // Normal priority, no reason
        5: undefined,
      };
      
      // Use registerWalkIn API for walk-in patients
      const result = await appointmentService.registerWalkIn({
        patientId: selectedPatient.id,
        doctorId: appointmentForm.doctorId,
        reason: appointmentForm.reason || "Khám tổng quát",
        priorityReason: priorityReasonMap[appointmentForm.priority],
      });
      
      // Show queue number in success message
      const queueMsg = result.queueNumber 
        ? `Số thứ tự: #${result.queueNumber}` 
        : "";
      toast.success(`Đã tiếp nhận bệnh nhân thành công! ${queueMsg}`);
      router.push("/receptionist/dashboard");
    } catch (error) {
      console.error("Walk-in registration error:", error);
      toast.error("Không thể đăng ký bệnh nhân walk-in");
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
                  className={`input-base ${validationErrors.fullName ? 'border-red-500' : ''}`}
                  value={patientForm.fullName}
                  onChange={(e) => setPatientForm({ ...patientForm, fullName: e.target.value })}
                  required
                />
                {validationErrors.fullName && (
                  <p className="text-xs text-red-600 mt-1">{validationErrors.fullName}</p>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-label">Số điện thoại *</label>
                <input
                  type="tel"
                  className={`input-base ${validationErrors.phoneNumber ? 'border-red-500' : ''}`}
                  placeholder="VD: 0987654321"
                  pattern="^(0|\+84)(\d{9})$"
                  title="Số điện thoại phải có 10 số, bắt đầu bằng 0 (VD: 0987654321)"
                  value={patientForm.phoneNumber}
                  onChange={(e) => setPatientForm({ ...patientForm, phoneNumber: e.target.value })}
                  required
                />
                {validationErrors.phoneNumber ? (
                  <p className="text-xs text-red-600 mt-1">{validationErrors.phoneNumber}</p>
                ) : (
                  <p className="text-xs text-gray-500">10 số, bắt đầu bằng 0</p>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-label">Email</label>
                <input
                  type="email"
                  className={`input-base ${validationErrors.email ? 'border-red-500' : ''}`}
                  placeholder="VD: nguyen@gmail.com"
                  value={patientForm.email}
                  onChange={(e) => setPatientForm({ ...patientForm, email: e.target.value })}
                />
                {validationErrors.email ? (
                  <p className="text-xs text-red-600 mt-1">{validationErrors.email}</p>
                ) : (
                  <p className="text-xs text-gray-500">Để trống nếu không có</p>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-label">Ngày sinh *</label>
                <input
                  type="date"
                  className={`input-base ${validationErrors.dateOfBirth ? 'border-red-500' : ''}`}
                  max={new Date().toISOString().split('T')[0]}
                  value={patientForm.dateOfBirth}
                  onChange={(e) => setPatientForm({ ...patientForm, dateOfBirth: e.target.value })}
                  required
                />
                {validationErrors.dateOfBirth && (
                  <p className="text-xs text-red-600 mt-1">{validationErrors.dateOfBirth}</p>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-label">Giới tính *</label>
                <select
                  className="input-base"
                  value={patientForm.gender}
                  onChange={(e) => setPatientForm({ ...patientForm, gender: e.target.value as "MALE" | "FEMALE" })}
                  required
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

              {/* Medical Info Section */}
              <div className="col-span-2 mt-4">
                <div className="bg-gradient-to-br from-red-50 to-white border-2 border-red-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-4">
                    <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    <h4 className="font-semibold text-red-900">Thông tin y tế (không bắt buộc)</h4>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="text-label">Nhóm máu</label>
                      <select
                        className="input-base"
                        value={patientForm.bloodType}
                        onChange={(e) => setPatientForm({ ...patientForm, bloodType: e.target.value })}
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
                      <label className="text-label">Số BHYT</label>
                      <input
                        type="text"
                        className="input-base"
                        placeholder="VD: HS123456789"
                        maxLength={20}
                        value={patientForm.healthInsuranceNumber}
                        onChange={(e) => setPatientForm({ ...patientForm, healthInsuranceNumber: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-label">Dị ứng</label>
                      <input
                        type="text"
                        className="input-base"
                        placeholder="VD: Penicillin, hải sản..."
                        maxLength={100}
                        value={patientForm.allergies}
                        onChange={(e) => setPatientForm({ ...patientForm, allergies: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Emergency Contact Section */}
              <div className="col-span-2 mt-2">
                <div className="bg-gradient-to-br from-amber-50 to-white border-2 border-amber-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-4">
                    <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <h4 className="font-semibold text-amber-900">Người liên hệ khẩn cấp (không bắt buộc)</h4>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="text-label">Họ tên người thân</label>
                      <input
                        type="text"
                        className="input-base"
                        placeholder="Nguyễn Văn A"
                        maxLength={100}
                        value={patientForm.relativeFullName}
                        onChange={(e) => setPatientForm({ ...patientForm, relativeFullName: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-label">SĐT người thân</label>
                      <input
                        type="tel"
                        className={`input-base ${validationErrors.relativePhoneNumber ? 'border-red-500' : ''}`}
                        placeholder="0987654321"
                        value={patientForm.relativePhoneNumber}
                        onChange={(e) => setPatientForm({ ...patientForm, relativePhoneNumber: e.target.value })}
                      />
                      {validationErrors.relativePhoneNumber && (
                        <p className="text-xs text-red-600 mt-1">{validationErrors.relativePhoneNumber}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <label className="text-label">Mối quan hệ</label>
                      <input
                        type="text"
                        className="input-base"
                        placeholder="VD: Cha, Mẹ, Vợ, Chồng..."
                        maxLength={100}
                        value={patientForm.relativeRelationship}
                        onChange={(e) => setPatientForm({ ...patientForm, relativeRelationship: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
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

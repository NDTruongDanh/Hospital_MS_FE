"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft,
  ArrowRight,
  Calendar,
  Clock,
  Stethoscope,
  CheckCircle,
  Loader2,
  Building2,
  User,
  FileText,
  Sparkles,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { appointmentService } from "@/services/appointment.service";
import { hrService } from "@/services/hr.service";
import { useAuth } from "@/contexts/AuthContext";

interface Doctor {
  id: string;
  fullName: string;
  department?: string;
  specialization?: string;
}

interface Department {
  id: string;
  name: string;
}

export default function PatientBookingWizard() {
  const router = useRouter();
  const { user } = useAuth();
  
  // Wizard state
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  // Data
  const [departments, setDepartments] = useState<Department[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [filteredDoctors, setFilteredDoctors] = useState<Doctor[]>([]);
  const [loadingDoctors, setLoadingDoctors] = useState(true);
  
  // Form data
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [appointmentType, setAppointmentType] = useState<"CONSULTATION" | "FOLLOW_UP" | "EMERGENCY">("CONSULTATION");
  const [reason, setReason] = useState("");

  useEffect(() => {
    fetchDepartments();
    fetchDoctors();
  }, []);

  useEffect(() => {
    if (selectedDepartment) {
      setFilteredDoctors(doctors.filter(d => d.department === selectedDepartment));
    } else {
      setFilteredDoctors(doctors);
    }
  }, [selectedDepartment, doctors]);

  const fetchDepartments = async () => {
    try {
      const response = await fetch("/api/hr/departments");
      const data = await response.json();
      setDepartments(data.data || []);
    } catch (error) {
      console.error("Failed to fetch departments:", error);
    }
  };

  const fetchDoctors = async () => {
    try {
      setLoadingDoctors(true);
      const response = await hrService.getEmployees({ role: "DOCTOR", status: "ACTIVE" });
      const doctorList = response.content.map((emp: any) => ({
        id: emp.id,
        fullName: emp.fullName,
        department: emp.department?.name,
        specialization: emp.specialization,
      }));
      setDoctors(doctorList);
      setFilteredDoctors(doctorList);
    } catch (error) {
      console.error("Failed to fetch doctors:", error);
      toast.error("Không thể tải danh sách bác sĩ");
    } finally {
      setLoadingDoctors(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedDoctor || !selectedDate || !selectedTime) {
      toast.error("Vui lòng điền đầy đủ thông tin");
      return;
    }

    try {
      setLoading(true);
      const appointmentTime = `${selectedDate}T${selectedTime}:00`;
      
      await appointmentService.create({
        patientId: user?.accountId || "",
        doctorId: selectedDoctor.id,
        appointmentTime,
        type: appointmentType,
        reason: reason || "Khám tổng quát",
      });

      toast.success("🎉 Đặt lịch hẹn thành công!");
      router.push("/patient/appointments");
    } catch (error) {
      toast.error("Không thể đặt lịch hẹn. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  // Generate time slots
  const timeSlots = [];
  for (let h = 8; h <= 17; h++) {
    for (let m = 0; m < 60; m += 30) {
      if (h === 17 && m > 0) break;
      timeSlots.push(`${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`);
    }
  }

  // Generate available dates (next 30 days)
  const availableDates = [];
  const today = new Date();
  for (let i = 0; i < 30; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    availableDates.push(date.toISOString().split("T")[0]);
  }

  const canGoNext = () => {
    if (currentStep === 1) return selectedDoctor !== null;
    if (currentStep === 2) return selectedDate && selectedTime;
    return true;
  };

  return (
    <div className="min-h-screen pb-12">
      {/* Animated Background */}
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-purple-50 via-pink-50/30 to-blue-50/40">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
      </div>

      <div className="max-w-4xl mx-auto space-y-6 pt-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/patient/appointments" className="btn-icon">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex-1">
            <h1 className="text-display flex items-center gap-3">
              <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 shadow-lg">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              Đặt lịch khám bệnh
            </h1>
            <p className="text-gray-600 mt-2">
              Chỉ 3 bước đơn giản để đặt lịch hẹn với bác sĩ
            </p>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="backdrop-blur-lg bg-white/70 border border-white/50 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between">
            {[
              { num: 1, label: "Chọn bác sĩ", icon: Stethoscope },
              { num: 2, label: "Chọn ngày giờ", icon: Calendar },
              { num: 3, label: "Xác nhận", icon: CheckCircle },
            ].map((step, idx) => {
              const StepIcon = step.icon;
              const isActive = currentStep === step.num;
              const isCompleted = currentStep > step.num;
              
              return (
                <div key={step.num} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-lg ${
                      isCompleted 
                        ? "bg-gradient-to-br from-green-500 to-emerald-600 text-white" 
                        : isActive
                        ? "bg-gradient-to-br from-purple-500 to-pink-600 text-white scale-110"
                        : "bg-white/60 text-gray-400"
                    }`}>
                      <StepIcon className="w-6 h-6" />
                    </div>
                    <p className={`text-sm font-medium mt-2 ${isActive ? "text-purple-600" : "text-gray-600"}`}>
                      {step.label}
                    </p>
                  </div>
                  {idx < 2 && (
                    <div className={`h-1 flex-1 mx-2 rounded-full transition-all ${
                      currentStep > step.num ? "bg-gradient-to-r from-green-500 to-emerald-600" : "bg-gray-200"
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Step Content */}
        <div className="backdrop-blur-lg bg-white/70 border border-white/50 rounded-2xl p-8 shadow-xl min-h-[500px]">
          {/* Step 1: Select Doctor */}
          {currentStep === 1 && (
            <div className="space-y-6 animate-fade-in">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">👨‍⚕️ Chọn bác sĩ</h2>
                <p className="text-gray-600">Chọn bác sĩ bạn muốn khám</p>
              </div>

              {/* Department Filter */}
              <div className="flex gap-2 flex-wrap justify-center mb-6">
                <button
                  onClick={() => setSelectedDepartment("")}
                  className={`px-4 py-2 rounded-xl font-medium transition-all ${
                    !selectedDepartment
                      ? "bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-lg"
                      : "bg-white/60 text-gray-700 hover:bg-white/80"
                  }`}
                >
                  Tất cả khoa
                </button>
                {departments.map((dept) => (
                  <button
                    key={dept.id}
                    onClick={() => setSelectedDepartment(dept.name)}
                    className={`px-4 py-2 rounded-xl font-medium transition-all ${
                      selectedDepartment === dept.name
                        ? "bg-gradient-to-r from-blue-500 to-cyan-600 text-white shadow-lg"
                        : "bg-white/60 text-gray-700 hover:bg-white/80"
                    }`}
                  >
                    {dept.name}
                  </button>
                ))}
              </div>

              {/* Doctor Cards */}
              {loadingDoctors ? (
                <div className="text-center py-12">
                  <Loader2 className="w-12 h-12 animate-spin mx-auto text-purple-600" />
                  <p className="text-gray-500 mt-4">Đang tải danh sách bác sĩ...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto pr-2">
                  {filteredDoctors.map((doctor) => (
                    <button
                      key={doctor.id}
                      onClick={() => setSelectedDoctor(doctor)}
                      className={`p-6 rounded-2xl text-left transition-all ${
                        selectedDoctor?.id === doctor.id
                          ? "bg-gradient-to-br from-purple-100 to-pink-100 border-2 border-purple-400 shadow-lg scale-105"
                          : "bg-gradient-to-br from-white/80 to-white/60 border border-white/50 hover:shadow-lg hover:scale-102"
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold shadow-lg ${
                          selectedDoctor?.id === doctor.id
                            ? "bg-gradient-to-br from-purple-500 to-pink-600 text-white"
                            : "bg-gradient-to-br from-blue-100 to-cyan-100 text-blue-600"
                        }`}>
                          {doctor.fullName.charAt(0)}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg text-gray-800">BS. {doctor.fullName}</h3>
                          {doctor.department && (
                            <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                              <Building2 className="w-3 h-3" />
                              {doctor.department}
                            </p>
                          )}
                          {doctor.specialization && (
                            <p className="text-xs text-gray-500 mt-1">{doctor.specialization}</p>
                          )}
                        </div>
                        {selectedDoctor?.id === doctor.id && (
                          <CheckCircle className="w-6 h-6 text-purple-600" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 2: Select Date & Time */}
          {currentStep === 2 && (
            <div className="space-y-6 animate-fade-in">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">📅 Chọn ngày giờ</h2>
                <p className="text-gray-600">Chọn thời gian phù hợp với bạn</p>
              </div>

              {/* Selected Doctor Info */}
              {selectedDoctor && (
                <div className="p-4 rounded-xl bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 mb-6">
                  <p className="text-sm text-gray-600">Bác sĩ đã chọn:</p>
                  <p className="font-semibold text-gray-800">BS. {selectedDoctor.fullName}</p>
                </div>
              )}

              {/* Date Selection */}
              <div className="space-y-3">
                <label className="text-label flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-purple-600" />
                  Chọn ngày khám
                </label>
                <div className="grid grid-cols-7 gap-2">
                  {availableDates.slice(0, 14).map((date) => {
                    const dateObj = new Date(date);
                    const isSelected = selectedDate === date;
                    const dayName = dateObj.toLocaleDateString("vi-VN", { weekday: "short" });
                    const day = dateObj.getDate();
                    
                    return (
                      <button
                        key={date}
                        type="button"
                        onClick={() => setSelectedDate(date)}
                        className={`p-3 rounded-xl text-center transition-all ${
                          isSelected
                            ? "bg-gradient-to-br from-purple-500 to-pink-600 text-white shadow-lg scale-110"
                            : "bg-white/60 hover:bg-white/80 text-gray-700"
                        }`}
                      >
                        <div className="text-xs">{dayName}</div>
                        <div className="text-lg font-bold">{day}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Time Selection */}
              {selectedDate && (
                <div className="space-y-3">
                  <label className="text-label flex items-center gap-2">
                    <Clock className="w-4 h-4 text-purple-600" />
                    Chọn giờ khám
                  </label>
                  <div className="grid grid-cols-4 md:grid-cols-6 gap-2 max-h-[200px] overflow-y-auto">
                    {timeSlots.map((time) => {
                      const isSelected = selectedTime === time;
                      return (
                        <button
                          key={time}
                          type="button"
                          onClick={() => setSelectedTime(time)}
                          className={`p-3 rounded-xl font-medium transition-all ${
                            isSelected
                              ? "bg-gradient-to-br from-orange-500 to-amber-600 text-white shadow-lg"
                              : "bg-white/60 hover:bg-white/80 text-gray-700"
                          }`}
                        >
                          {time}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Confirm */}
          {currentStep === 3 && (
            <div className="space-y-6 animate-fade-in">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">✅ Xác nhận thông tin</h2>
                <p className="text-gray-600">Kiểm tra lại thông tin trước khi đặt lịch</p>
              </div>

              {/* Summary */}
              <div className="space-y-4">
                <div className="p-6 rounded-2xl bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200">
                  <div className="flex items-center gap-3 mb-4">
                    <Stethoscope className="w-5 h-5 text-blue-600" />
                    <h3 className="font-semibold text-gray-800">Bác sĩ</h3>
                  </div>
                  <p className="text-lg font-semibold text-gray-800">BS. {selectedDoctor?.fullName}</p>
                  <p className="text-sm text-gray-600">{selectedDoctor?.department}</p>
                </div>

                <div className="p-6 rounded-2xl bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200">
                  <div className="flex items-center gap-3 mb-4">
                    <Calendar className="w-5 h-5 text-purple-600" />
                    <h3 className="font-semibold text-gray-800">Thời gian</h3>
                  </div>
                  <p className="text-lg font-semibold text-gray-800">
                    {new Date(selectedDate).toLocaleDateString("vi-VN", { 
                      weekday: "long", 
                      year: "numeric", 
                      month: "long", 
                      day: "numeric" 
                    })}
                  </p>
                  <p className="text-sm text-gray-600">Lúc {selectedTime}</p>
                </div>

                {/* Type Selection */}
                <div className="space-y-3">
                  <label className="text-label">Loại khám</label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { value: "CONSULTATION", label: "🩺 Khám mới", gradient: "from-blue-500 to-cyan-600" },
                      { value: "FOLLOW_UP", label: "🔄 Tái khám", gradient: "from-green-500 to-emerald-600" },
                    ].map((type) => (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => setAppointmentType(type.value as any)}
                        className={`p-4 rounded-xl font-medium transition-all ${
                          appointmentType === type.value
                            ? `bg-gradient-to-r ${type.gradient} text-white shadow-lg`
                            : "bg-white/60 text-gray-700 hover:bg-white/80"
                        }`}
                      >
                        {type.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Reason */}
                <div className="space-y-3">
                  <label className="text-label flex items-center gap-2">
                    <FileText className="w-4 h-4 text-purple-600" />
                    Lý do khám
                  </label>
                  <textarea
                    className="w-full p-4 rounded-xl bg-white/60 border border-white/50 focus:border-purple-300 focus:ring-2 focus:ring-purple-200 resize-none"
                    rows={4}
                    placeholder="Mô tả triệu chứng hoặc lý do khám..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    maxLength={500}
                  />
                  <p className="text-xs text-gray-500 text-right">{reason.length}/500</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex gap-4">
          {currentStep > 1 && (
            <button
              onClick={() => setCurrentStep(currentStep - 1)}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white/70 backdrop-blur border border-white/50 text-gray-700 font-medium hover:bg-white/90 transition-all shadow-md"
            >
              <ChevronLeft className="w-5 h-5" />
              Quay lại
            </button>
          )}
          
          <div className="flex-1" />
          
          {currentStep < 3 ? (
            <button
              onClick={() => setCurrentStep(currentStep + 1)}
              disabled={!canGoNext()}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-600 text-white font-medium hover:shadow-lg transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Tiếp theo
              <ChevronRight className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex items-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white font-medium hover:shadow-lg transition-all shadow-md disabled:opacity-50"
            >
              {loading && <Loader2 className="w-5 h-5 animate-spin" />}
              <CheckCircle className="w-5 h-5" />
              Xác nhận đặt lịch
            </button>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  User,
  Phone,
  Calendar,
  Clock,
  Stethoscope,
  FileText,
  Save,
  Loader2,
  ArrowLeft,
  Plus,
  Trash2,
  Pill,
  TestTube,
} from "lucide-react";
import { toast } from "sonner";
import { appointmentService, Appointment } from "@/services/appointment.service";

export default function DoctorExamPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentPatient, setCurrentPatient] = useState<Appointment | null>(null);
  
  // Exam form
  const [examData, setExamData] = useState({
    symptoms: "",
    diagnosis: "",
    notes: "",
    vitalSigns: {
      bloodPressure: "",
      heartRate: "",
      temperature: "",
      weight: "",
    },
  });

  // Prescription items
  const [prescriptions, setPrescriptions] = useState<{
    medicineName: string;
    dosage: string;
    frequency: string;
    duration: string;
    notes: string;
  }[]>([]);

  // Lab tests
  const [labTests, setLabTests] = useState<{
    testName: string;
    notes: string;
  }[]>([]);

  useEffect(() => {
    fetchNextPatient();
  }, []);

  const fetchNextPatient = async () => {
    try {
      setLoading(true);
      const response = await appointmentService.list({
        status: "SCHEDULED",
      });
      
      const today = new Date().toISOString().split("T")[0];
      const todayAppts = response.content
        .filter(apt => apt.appointmentTime.startsWith(today))
        .sort((a, b) => a.appointmentTime.localeCompare(b.appointmentTime));
      
      if (todayAppts.length > 0) {
        setCurrentPatient(todayAppts[0]);
      }
    } catch (error) {
      console.error("Failed to fetch patient:", error);
      toast.error("Không thể tải thông tin bệnh nhân");
    } finally {
      setLoading(false);
    }
  };

  const addPrescription = () => {
    setPrescriptions([
      ...prescriptions,
      { medicineName: "", dosage: "", frequency: "", duration: "", notes: "" }
    ]);
  };

  const removePrescription = (index: number) => {
    setPrescriptions(prescriptions.filter((_, i) => i !== index));
  };

  const updatePrescription = (index: number, field: string, value: string) => {
    const updated = [...prescriptions];
    updated[index] = { ...updated[index], [field]: value };
    setPrescriptions(updated);
  };

  const addLabTest = () => {
    setLabTests([...labTests, { testName: "", notes: "" }]);
  };

  const removeLabTest = (index: number) => {
    setLabTests(labTests.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!currentPatient) return;
    
    try {
      setSaving(true);
      // Save exam data - in real app, this would call exam API
      await appointmentService.complete(currentPatient.id);
      toast.success("Đã lưu kết quả khám và hoàn thành");
      router.push("/doctor/queue");
    } catch (error) {
      toast.error("Không thể lưu kết quả khám");
    } finally {
      setSaving(false);
    }
  };

  const formatTime = (isoDate: string) => {
    return new Date(isoDate).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-[hsl(var(--primary))]" />
      </div>
    );
  }

  if (!currentPatient) {
    return (
      <div className="card-base text-center py-12">
        <Stethoscope className="w-16 h-16 mx-auto text-[hsl(var(--muted-foreground))] opacity-50" />
        <h2 className="text-lg font-semibold mt-4">Không có bệnh nhân</h2>
        <p className="text-[hsl(var(--muted-foreground))] mt-2">
          Hiện không có bệnh nhân nào trong hàng đợi
        </p>
        <Link href="/doctor/queue" className="btn-primary mt-4 inline-flex">
          Xem hàng đợi
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/doctor/queue" className="btn-icon">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-display">Khám bệnh</h1>
          <p className="text-[hsl(var(--muted-foreground))] mt-1">
            Bệnh nhân: {currentPatient.patient.fullName}
          </p>
        </div>
      </div>

      {/* Patient Info Card */}
      <div className="card-base bg-[hsl(var(--primary-light))] border-[hsl(var(--primary))]">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="avatar w-16 h-16 text-2xl">
            {currentPatient.patient.fullName.charAt(0)}
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold">{currentPatient.patient.fullName}</h2>
            <div className="flex flex-wrap gap-4 mt-2 text-sm text-[hsl(var(--muted-foreground))]">
              {currentPatient.patient.phoneNumber && (
                <span className="flex items-center gap-1">
                  <Phone className="w-4 h-4" />
                  {currentPatient.patient.phoneNumber}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {formatTime(currentPatient.appointmentTime)}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {currentPatient.type === "CONSULTATION" ? "Khám mới" : currentPatient.type === "FOLLOW_UP" ? "Tái khám" : "Cấp cứu"}
              </span>
            </div>
          </div>
          {currentPatient.reason && (
            <div className="p-3 rounded-lg bg-white/50">
              <p className="text-label">Lý do khám</p>
              <p className="font-medium">{currentPatient.reason}</p>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Medical Exam */}
        <div className="space-y-6">
          {/* Vital Signs */}
          <div className="card-base">
            <h3 className="text-section mb-4">Sinh hiệu</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-label">Huyết áp</label>
                <input
                  type="text"
                  className="input-base"
                  placeholder="120/80 mmHg"
                  value={examData.vitalSigns.bloodPressure}
                  onChange={(e) => setExamData({
                    ...examData,
                    vitalSigns: { ...examData.vitalSigns, bloodPressure: e.target.value }
                  })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-label">Nhịp tim</label>
                <input
                  type="text"
                  className="input-base"
                  placeholder="72 bpm"
                  value={examData.vitalSigns.heartRate}
                  onChange={(e) => setExamData({
                    ...examData,
                    vitalSigns: { ...examData.vitalSigns, heartRate: e.target.value }
                  })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-label">Nhiệt độ</label>
                <input
                  type="text"
                  className="input-base"
                  placeholder="37°C"
                  value={examData.vitalSigns.temperature}
                  onChange={(e) => setExamData({
                    ...examData,
                    vitalSigns: { ...examData.vitalSigns, temperature: e.target.value }
                  })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-label">Cân nặng</label>
                <input
                  type="text"
                  className="input-base"
                  placeholder="65 kg"
                  value={examData.vitalSigns.weight}
                  onChange={(e) => setExamData({
                    ...examData,
                    vitalSigns: { ...examData.vitalSigns, weight: e.target.value }
                  })}
                />
              </div>
            </div>
          </div>

          {/* Symptoms & Diagnosis */}
          <div className="card-base">
            <h3 className="text-section mb-4">Khám lâm sàng</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-label">Triệu chứng</label>
                <textarea
                  className="input-base min-h-[100px] resize-none"
                  placeholder="Mô tả triệu chứng của bệnh nhân..."
                  value={examData.symptoms}
                  onChange={(e) => setExamData({ ...examData, symptoms: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-label">Chẩn đoán</label>
                <textarea
                  className="input-base min-h-[100px] resize-none"
                  placeholder="Chẩn đoán bệnh..."
                  value={examData.diagnosis}
                  onChange={(e) => setExamData({ ...examData, diagnosis: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-label">Ghi chú</label>
                <textarea
                  className="input-base min-h-[80px] resize-none"
                  placeholder="Ghi chú thêm..."
                  value={examData.notes}
                  onChange={(e) => setExamData({ ...examData, notes: e.target.value })}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Prescription & Lab */}
        <div className="space-y-6">
          {/* Prescription */}
          <div className="card-base">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-section flex items-center gap-2">
                <Pill className="w-5 h-5" />
                Đơn thuốc
              </h3>
              <button onClick={addPrescription} className="btn-secondary text-sm py-2">
                <Plus className="w-4 h-4" />
                Thêm thuốc
              </button>
            </div>

            {prescriptions.length === 0 ? (
              <p className="text-[hsl(var(--muted-foreground))] text-center py-4">
                Chưa có thuốc nào được kê
              </p>
            ) : (
              <div className="space-y-4">
                {prescriptions.map((rx, index) => (
                  <div key={index} className="p-4 bg-white border-2 border-gray-200 rounded-xl shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Thuốc #{index + 1}</span>
                      <button
                        onClick={() => removePrescription(index)}
                        className="text-red-500 hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <input
                      type="text"
                      className="input-base"
                      placeholder="Tên thuốc"
                      value={rx.medicineName}
                      onChange={(e) => updatePrescription(index, "medicineName", e.target.value)}
                    />
                    <div className="grid grid-cols-3 gap-2">
                      <input
                        type="text"
                        className="input-base"
                        placeholder="Liều dùng"
                        value={rx.dosage}
                        onChange={(e) => updatePrescription(index, "dosage", e.target.value)}
                      />
                      <input
                        type="text"
                        className="input-base"
                        placeholder="Tần suất"
                        value={rx.frequency}
                        onChange={(e) => updatePrescription(index, "frequency", e.target.value)}
                      />
                      <input
                        type="text"
                        className="input-base"
                        placeholder="Thời gian"
                        value={rx.duration}
                        onChange={(e) => updatePrescription(index, "duration", e.target.value)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Lab Tests */}
          <div className="card-base">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-section flex items-center gap-2">
                <TestTube className="w-5 h-5" />
                Xét nghiệm
              </h3>
              <button onClick={addLabTest} className="btn-secondary text-sm py-2">
                <Plus className="w-4 h-4" />
                Thêm xét nghiệm
              </button>
            </div>

            {labTests.length === 0 ? (
              <p className="text-[hsl(var(--muted-foreground))] text-center py-4">
                Chưa có xét nghiệm nào được yêu cầu
              </p>
            ) : (
              <div className="space-y-3">
                {labTests.map((test, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      type="text"
                      className="input-base flex-1"
                      placeholder="Tên xét nghiệm"
                      value={test.testName}
                      onChange={(e) => {
                        const updated = [...labTests];
                        updated[index].testName = e.target.value;
                        setLabTests(updated);
                      }}
                    />
                    <button
                      onClick={() => removeLabTest(index)}
                      className="btn-icon text-red-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="card-base flex flex-col sm:flex-row justify-end gap-3">
        <Link href="/doctor/queue" className="btn-secondary">
          Hủy
        </Link>
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary"
        >
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
          <Save className="w-4 h-4" />
          Lưu & Hoàn thành
        </button>
      </div>
    </div>
  );
}

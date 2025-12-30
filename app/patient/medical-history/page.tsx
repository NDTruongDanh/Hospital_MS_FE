"use client";

import { useState, useEffect } from "react";
import { 
  Search,
  FileText,
  Calendar,
  Eye,
  Loader2,
  Pill,
} from "lucide-react";
import { toast } from "sonner";
import medicalExamService from "@/services/medical-exam.service";
import type { MedicalExam } from "@/interfaces/medical-exam";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function PatientMedicalHistoryPage() {
  const [exams, setExams] = useState<MedicalExam[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedExam, setSelectedExam] = useState<MedicalExam | null>(null);

  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    try {
      setLoading(true);
      // Get patient's own exams
      const response = await medicalExamService.getList({ size: 50 });
      setExams(response.content || []);
    } catch (error) {
      console.error("Failed to fetch medical history:", error);
      toast.error("Không thể tải lịch sử khám bệnh");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const filteredExams = exams.filter(exam =>
    exam.diagnosis?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    exam.doctor.fullName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-display">Lịch sử khám bệnh</h1>
        <p className="text-[hsl(var(--muted-foreground))] mt-1">
          Xem lịch sử các lần khám bệnh của bạn
        </p>
      </div>

      {/* Search */}
      <div className="card-base">
        <div className="search-input w-full max-w-md">
          <Search className="w-4 h-4 text-[hsl(var(--muted-foreground))]" />
          <input
            type="text"
            placeholder="Tìm theo chẩn đoán, bác sĩ..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Exams List */}
      <div className="space-y-4">
        {loading ? (
          <div className="card-base text-center py-12">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-[hsl(var(--primary))]" />
            <p className="text-small mt-2">Đang tải...</p>
          </div>
        ) : filteredExams.length === 0 ? (
          <div className="card-base text-center py-12">
            <FileText className="w-12 h-12 mx-auto text-[hsl(var(--muted-foreground))] opacity-50" />
            <p className="text-[hsl(var(--muted-foreground))] mt-2">
              Chưa có lịch sử khám bệnh
            </p>
          </div>
        ) : (
          filteredExams.map((exam) => (
            <div key={exam.id} className="card-base">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[hsl(var(--primary-light))] flex items-center justify-center text-[hsl(var(--primary))]">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-semibold">
                      {exam.diagnosis || "Phiếu khám"}
                    </p>
                    <div className="flex items-center gap-4 mt-1 text-small">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(exam.examDate)}
                      </span>
                      <span>BS. {exam.doctor.fullName}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {exam.hasPrescription && (
                    <span className="badge badge-success">
                      <Pill className="w-3 h-3" />
                      Có đơn thuốc
                    </span>
                  )}
                  <button
                    onClick={() => setSelectedExam(exam)}
                    className="btn-secondary text-sm py-2"
                  >
                    <Eye className="w-4 h-4" />
                    Chi tiết
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Detail Modal */}
      <Dialog open={!!selectedExam} onOpenChange={() => setSelectedExam(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Chi tiết phiếu khám</DialogTitle>
          </DialogHeader>
          {selectedExam && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-[hsl(var(--secondary))]">
                <p className="font-semibold text-lg">{selectedExam.diagnosis || "Không có chẩn đoán"}</p>
                <p className="text-small mt-1">
                  {formatDate(selectedExam.examDate)} - BS. {selectedExam.doctor.fullName}
                </p>
              </div>

              {selectedExam.symptoms && (
                <div className="space-y-1">
                  <p className="text-label">Triệu chứng</p>
                  <p>{selectedExam.symptoms}</p>
                </div>
              )}

              {selectedExam.treatment && (
                <div className="space-y-1">
                  <p className="text-label">Điều trị</p>
                  <p>{selectedExam.treatment}</p>
                </div>
              )}

              {selectedExam.vitals && (
                <div className="space-y-1">
                  <p className="text-label">Sinh hiệu</p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {selectedExam.vitals.temperature && (
                      <div>Nhiệt độ: {selectedExam.vitals.temperature}°C</div>
                    )}
                    {(selectedExam.vitals.bloodPressureSystolic || selectedExam.vitals.bloodPressureDiastolic) && (
                      <div>
                        Huyết áp: {selectedExam.vitals.bloodPressureSystolic}/{selectedExam.vitals.bloodPressureDiastolic} mmHg
                      </div>
                    )}
                    {selectedExam.vitals.heartRate && (
                      <div>Nhịp tim: {selectedExam.vitals.heartRate} bpm</div>
                    )}
                    {selectedExam.vitals.weight && (
                      <div>Cân nặng: {selectedExam.vitals.weight} kg</div>
                    )}
                  </div>
                </div>
              )}

              {selectedExam.notes && (
                <div className="space-y-1">
                  <p className="text-label">Ghi chú</p>
                  <p className="text-small">{selectedExam.notes}</p>
                </div>
              )}

              {selectedExam.followUpDate && (
                <div className="p-4 bg-white border-2 border-gray-200 rounded-xl shadow-sm">
                  <p className="text-label">Ngày tái khám</p>
                  <p className="font-semibold">{formatDate(selectedExam.followUpDate)}</p>
                </div>
              )}

              {selectedExam.hasPrescription && selectedExam.prescription && (
                <div className="space-y-2">
                  <p className="text-label">Đơn thuốc</p>
                  <div className="space-y-2">
                    {selectedExam.prescription.items?.map((item, i) => (
                      <div key={i} className="p-3 bg-white border-2 border-gray-200 rounded-xl shadow-sm flex justify-between">
                        <div>
                          <p className="font-medium">{item.medicine.name}</p>
                          <p className="text-small">{item.dosage}</p>
                        </div>
                        <span className="badge badge-info">x{item.quantity}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

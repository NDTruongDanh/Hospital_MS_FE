"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { 
  Search, 
  Stethoscope, 
  Pill,
  Eye,
  Loader2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import medicalExamService from "@/services/medical-exam.service";
import { hrService } from "@/services/hr.service";
import { MedicalExamListItem } from "@/interfaces/medical-exam";
import { Employee } from "@/interfaces/hr";

export default function MedicalExamsPage() {
  const router = useRouter();
  const [exams, setExams] = useState<MedicalExamListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [doctorFilter, setDoctorFilter] = useState<string>("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  
  // Doctors for filter dropdown
  const [doctors, setDoctors] = useState<Employee[]>([]);

  useEffect(() => {
    fetchExams();
  }, [page, doctorFilter, startDate, endDate]);

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchExams = async () => {
    setLoading(true);
    try {
      const response = await medicalExamService.getList({
        page,
        size: 10,
        doctorId: doctorFilter || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        search: searchQuery || undefined,
      });
      setExams(response.content || []);
      setTotalPages(response.totalPages || 1);
      setTotalElements(response.totalElements || 0);
    } catch (error) {
      console.error("Failed to fetch exams:", error);
      toast.error("Không thể tải danh sách phiếu khám");
    } finally {
      setLoading(false);
    }
  };

  const fetchDoctors = async () => {
    try {
      const response = await hrService.getEmployees({ role: "DOCTOR", size: 100 });
      setDoctors(response.content || []);
    } catch (error) {
      console.error("Failed to fetch doctors:", error);
    }
  };

  // Navigate to detail page
  const handleViewExam = (examId: string) => {
    router.push(`/admin/exams/${examId}`);
  };

  // Filter exams by search query (client-side)
  const filteredExams = useMemo(() => {
    if (!searchQuery) return exams;
    const q = searchQuery.toLowerCase();
    return exams.filter(exam => 
      exam.patient.fullName.toLowerCase().includes(q) ||
      exam.doctor.fullName.toLowerCase().includes(q) ||
      (exam.diagnosis?.toLowerCase().includes(q))
    );
  }, [exams, searchQuery]);

  // Stats
  const withPrescription = filteredExams.filter(e => e.hasPrescription).length;

  const clearFilters = () => {
    setSearchQuery("");
    setDoctorFilter("");
    setStartDate("");
    setEndDate("");
    setPage(0);
  };

  const hasFilters = searchQuery || doctorFilter || startDate || endDate;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-h1 flex items-center gap-2">
            <Stethoscope className="w-8 h-8 text-[hsl(var(--primary))]" />
            Hồ sơ khám bệnh
          </h1>
          <p className="text-small mt-1">
            Quản lý và xem tất cả hồ sơ khám bệnh
          </p>
        </div>
        {/* Stats */}
        <div className="flex gap-4">
          <div className="card-base p-3 text-center min-w-[100px]">
            <p className="text-2xl font-bold text-[hsl(var(--primary))]">{totalElements}</p>
            <p className="text-xs text-[hsl(var(--muted-foreground))]">Tổng số</p>
          </div>
          <div className="card-base p-3 text-center min-w-[100px]">
            <p className="text-2xl font-bold text-green-600">{withPrescription}</p>
            <p className="text-xs text-[hsl(var(--muted-foreground))]">Có đơn thuốc</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card-base p-4">
        <div className="flex flex-wrap items-center gap-4">
          {/* Search */}
          <div className="relative flex-1 min-w-[250px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--muted-foreground))]" />
            <input
              type="text"
              placeholder="Tìm theo tên bệnh nhân, bác sĩ..."
              className="input-base pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Doctor Filter */}
          <select
            className="input-base w-[180px]"
            value={doctorFilter}
            onChange={(e) => { setDoctorFilter(e.target.value); setPage(0); }}
          >
            <option value="">Tất cả bác sĩ</option>
            {doctors.map(doc => (
              <option key={doc.id} value={doc.id}>{doc.fullName}</option>
            ))}
          </select>

          {/* Date Range */}
          <div className="flex items-center gap-2">
            <input
              type="date"
              className="input-base w-[140px]"
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setPage(0); }}
            />
            <span className="text-[hsl(var(--muted-foreground))]">-</span>
            <input
              type="date"
              className="input-base w-[140px]"
              value={endDate}
              onChange={(e) => { setEndDate(e.target.value); setPage(0); }}
            />
          </div>

          {hasFilters && (
            <button 
              onClick={clearFilters}
              className="btn-secondary text-sm"
            >
              <X className="w-4 h-4 mr-1" />
              Xóa bộ lọc
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="card-base overflow-hidden">
        <table className="table-base">
          <thead>
            <tr>
              <th>Bệnh nhân</th>
              <th>Bác sĩ</th>
              <th>Chẩn đoán</th>
              <th>Ngày khám</th>
              <th className="text-center">Đơn thuốc</th>
              <th className="text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="py-12 text-center">
                  <div className="flex items-center justify-center gap-2 text-[hsl(var(--muted-foreground))]">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Đang tải...
                  </div>
                </td>
              </tr>
            ) : filteredExams.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center">
                  <div className="text-[hsl(var(--muted-foreground))]">
                    <Stethoscope className="w-12 h-12 mx-auto mb-2 opacity-30" />
                    <p>Không tìm thấy phiếu khám nào</p>
                    {hasFilters && (
                      <button 
                        onClick={clearFilters}
                        className="mt-2 text-sm text-[hsl(var(--primary))] hover:underline"
                      >
                        Xóa bộ lọc
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              filteredExams.map((exam) => (
                <tr 
                  key={exam.id} 
                  className="cursor-pointer hover:bg-[hsl(var(--accent))]"
                  onClick={() => handleViewExam(exam.id)}
                >
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="avatar w-8 h-8 text-xs">
                        {exam.patient.fullName.charAt(0)}
                      </div>
                      <span className="font-medium">{exam.patient.fullName}</span>
                    </div>
                  </td>
                  <td className="text-[hsl(var(--muted-foreground))]">
                    {exam.doctor.fullName}
                  </td>
                  <td className="max-w-[200px] truncate text-[hsl(var(--muted-foreground))]">
                    {exam.diagnosis || <span className="italic opacity-50">Chưa có</span>}
                  </td>
                  <td className="text-[hsl(var(--muted-foreground))]">
                    {format(new Date(exam.examDate), "dd/MM/yyyy", { locale: vi })}
                  </td>
                  <td className="text-center">
                    {exam.hasPrescription ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                        <Pill className="w-3 h-3 mr-1" />
                        Có
                      </span>
                    ) : (
                      <span className="text-[hsl(var(--muted-foreground))]">—</span>
                    )}
                  </td>
                  <td className="text-right" onClick={(e) => e.stopPropagation()}>
                    <button 
                      className="btn-ghost p-2"
                      onClick={() => handleViewExam(exam.id)}
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-small">
            Hiển thị {filteredExams.length} / {totalElements} kết quả
          </p>
          <div className="flex gap-2">
            <button
              className="btn-secondary"
              disabled={page === 0}
              onClick={() => setPage(p => Math.max(0, p - 1))}
            >
              Trước
            </button>
            <span className="flex items-center px-3 text-sm">
              Trang {page + 1} / {totalPages}
            </span>
            <button
              className="btn-secondary"
              disabled={page >= totalPages - 1}
              onClick={() => setPage(p => p + 1)}
            >
              Sau
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  AlertCircle, 
  CalendarClock, 
  Search, 
  Stethoscope, 
  Clock, 
  CheckCircle2, 
  Activity, 
  Eye,
  LayoutGrid,
  Calendar,
  ChevronRight,
  ChevronDown,
  Pill,
  FileText,
  User
} from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { useMedicalExamList } from "@/hooks/queries/useMedicalExam";
import { useDebounce } from "@/hooks/useDebounce";
import { MedicalExamListItem } from "@/interfaces/medical-exam";
import { DataTablePagination } from "@/components/ui/data-table-pagination";
import { useMyEmployeeProfile } from "@/hooks/queries/useHr";
import { Skeleton } from "@/components/ui/skeleton";

const formatDate = (value: string) =>
  new Date(value).toLocaleString("vi-VN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

const formatDateFull = (value: string) =>
  new Date(value).toLocaleString("vi-VN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

const formatTime = (value: string) =>
  new Date(value).toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });

// Group exams by date
function groupExamsByDate(exams: MedicalExamListItem[]) {
  const groups: { [key: string]: MedicalExamListItem[] } = {};
  exams.forEach((exam) => {
    const date = new Date(exam.examDate).toDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(exam);
  });
  return Object.entries(groups).sort(([a], [b]) => 
    new Date(b).getTime() - new Date(a).getTime()
  );
}

// Timeline View Component
function TimelineView({ exams, isLoading }: { exams: MedicalExamListItem[]; isLoading: boolean }) {
  const [collapsedDates, setCollapsedDates] = useState<Set<string>>(new Set());

  const toggleDate = (dateStr: string) => {
    setCollapsedDates((prev) => {
      const next = new Set(prev);
      if (next.has(dateStr)) {
        next.delete(dateStr);
      } else {
        next.add(dateStr);
      }
      return next;
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-4">
            <Skeleton className="h-4 w-4 rounded-full mt-1" />
            <div className="flex-1 space-y-3">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-24 w-full rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (exams.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-slate-500">
        <Calendar className="h-12 w-12 text-slate-300 mb-4" />
        <p className="text-lg font-medium">Chưa có hồ sơ khám</p>
        <p className="text-sm text-slate-400">Các lượt khám sẽ hiển thị theo timeline tại đây</p>
      </div>
    );
  }

  const groupedExams = groupExamsByDate(exams);

  return (
    <div className="relative p-6">
      {/* Vertical Timeline Line */}
      <div className="absolute left-[29px] top-6 bottom-6 w-0.5 bg-gradient-to-b from-teal-400 via-emerald-400 to-teal-300 rounded-full" />

      <div className="space-y-8">
        {groupedExams.map(([dateStr, dayExams]) => {
          const isCollapsed = collapsedDates.has(dateStr);
          return (
            <div key={dateStr} className="relative">
              {/* Date Header - Clickable */}
              <button
                onClick={() => toggleDate(dateStr)}
                className="flex items-center gap-4 mb-4 w-full text-left group"
              >
                <div className="relative z-10 h-4 w-4 rounded-full bg-gradient-to-br from-teal-500 to-emerald-500 shadow-lg shadow-teal-500/30 ring-4 ring-white" />
                <div className="flex items-center gap-2 flex-1">
                  <span className="font-semibold text-slate-800 capitalize group-hover:text-teal-600 transition-colors">
                    {formatDateFull(dayExams[0].examDate)}
                  </span>
                  <Badge variant="secondary" className="bg-teal-100 text-teal-700">
                    {dayExams.length} hồ sơ
                  </Badge>
                </div>
                <ChevronDown 
                  className={`h-5 w-5 text-slate-400 group-hover:text-teal-500 transition-all duration-300 ${
                    isCollapsed ? '-rotate-90' : ''
                  }`} 
                />
              </button>

              {/* Exam Cards for this date - Collapsible */}
              <div 
                className={`ml-8 space-y-3 transition-all duration-300 ease-in-out overflow-hidden ${
                  isCollapsed ? 'max-h-0 opacity-0' : 'max-h-[2000px] opacity-100'
                }`}
              >
                {dayExams.map((exam, index) => (
                  <Link
                    key={exam.id}
                    href={`/doctor/exams/${exam.id}`}
                    className="block group"
                  >
                    <div className="relative overflow-hidden rounded-xl border bg-white p-4 shadow-sm transition-all duration-300 hover:shadow-lg hover:border-teal-300 hover:-translate-y-0.5">
                      {/* Decorative gradient bar */}
                      <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-teal-400 to-emerald-500 rounded-l-xl" />

                      <div className="flex items-start gap-4 pl-3">
                        {/* Patient Avatar */}
                        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center text-white font-bold text-lg shadow-md shadow-teal-500/20 flex-shrink-0">
                          {exam.patient.fullName?.charAt(0)?.toUpperCase() || "P"}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <h3 className="font-semibold text-slate-900 group-hover:text-teal-600 transition-colors">
                                {exam.patient.fullName}
                              </h3>
                              <p className="text-sm text-slate-500 flex items-center gap-1 mt-0.5">
                                <Clock className="h-3 w-3" />
                                {formatTime(exam.examDate)}
                              </p>
                            </div>

                            {/* Action indicator */}
                            <div className="flex items-center gap-2">
                              {exam.hasPrescription && (
                                <div className="h-7 w-7 rounded-full bg-green-100 flex items-center justify-center" title="Có đơn thuốc">
                                  <Pill className="h-3.5 w-3.5 text-green-600" />
                                </div>
                              )}
                              <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-teal-500 group-hover:translate-x-1 transition-all" />
                            </div>
                          </div>

                          {/* Diagnosis */}
                          {exam.diagnosis && (
                            <div className="mt-3 p-3 rounded-lg bg-slate-50 border border-slate-100">
                              <div className="flex items-start gap-2">
                                <FileText className="h-4 w-4 text-slate-400 mt-0.5 flex-shrink-0" />
                                <div>
                                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">
                                    Chẩn đoán
                                  </p>
                                  <p className="text-sm text-slate-700 line-clamp-2">
                                    {exam.diagnosis}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* No diagnosis placeholder */}
                          {!exam.diagnosis && (
                            <div className="mt-3 p-3 rounded-lg bg-amber-50 border border-amber-100">
                              <p className="text-sm text-amber-600 italic">
                                Chưa có chẩn đoán
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// View Toggle Button
function ViewToggle({ view, onChange }: { view: "table" | "timeline"; onChange: (v: "table" | "timeline") => void }) {
  return (
    <div className="flex bg-slate-100 rounded-lg p-1">
      <button
        onClick={() => onChange("table")}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
          view === "table"
            ? "bg-white text-slate-900 shadow-sm"
            : "text-slate-600 hover:text-slate-900"
        }`}
      >
        <LayoutGrid className="h-4 w-4" />
        Bảng
      </button>
      <button
        onClick={() => onChange("timeline")}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
          view === "timeline"
            ? "bg-white text-slate-900 shadow-sm"
            : "text-slate-600 hover:text-slate-900"
        }`}
      >
        <Calendar className="h-4 w-4" />
        Timeline
      </button>
    </div>
  );
}

export default function DoctorExamsPage() {
  // Get current doctor's employee profile
  const { data: myProfile, isLoading: isLoadingProfile } = useMyEmployeeProfile();
  const doctorId = myProfile?.id;

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(20);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [status, setStatus] = useState("ALL");
  const [viewMode, setViewMode] = useState<"table" | "timeline">("table");

  const debouncedSearch = useDebounce(search, 300);

  const { data, isLoading } = useMedicalExamList({
    page,
    size,
    doctorId: doctorId || undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    status: status !== "ALL" ? (status as any) : undefined,
    search: debouncedSearch || undefined,
  });

  const exams = data?.content || [];
  const totalPages = data?.totalPages || 1;
  const totalElements = data?.totalElements || 0;

  // Calculate stats - only total is reliable
  const examStats = useMemo(() => {
    return { total: totalElements };
  }, [totalElements]);

  // Loading state while fetching employee profile
  if (isLoadingProfile) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div>
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-5 w-80 mt-2" />
        </div>
        <Card className="shadow-sm">
          <CardHeader>
            <Skeleton className="h-6 w-24" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-48 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show message if employee profile not found
  if (!doctorId && !isLoadingProfile) {
    return (
      <div className="container mx-auto py-6">
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="flex items-center gap-3 pt-6">
            <AlertCircle className="h-5 w-5 text-amber-600" />
            <div>
              <p className="font-medium text-amber-800">Employee Profile Not Found</p>
              <p className="text-sm text-amber-700">
                Your account is not linked to an employee record. Please contact an administrator.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Enhanced Gradient Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-teal-600 via-teal-500 to-emerald-500 p-6 text-white shadow-lg">
        {/* Background decoration */}
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
        <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-white/5" />
        
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          {/* Left: Title and description */}
          <div className="flex items-center gap-4">
            <div className="rounded-xl bg-white/20 p-3 backdrop-blur-sm">
              <Stethoscope className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Hồ sơ khám của tôi</h1>
              <p className="mt-1 text-teal-100">
                Danh sách lượt khám do bác sĩ thực hiện
              </p>
            </div>
          </div>
          
          {/* Right: Total stat only */}
          <div className="hidden md:flex gap-6">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-teal-100 text-sm">
                <Activity className="h-4 w-4" />
                Tổng số hồ sơ
              </div>
              <div className="text-2xl font-bold">{examStats.total}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Compact Filter Toolbar with View Toggle */}
      <div className="flex flex-wrap items-center gap-3 rounded-lg bg-slate-50 p-3 border">
        {/* View Toggle */}
        <ViewToggle view={viewMode} onChange={setViewMode} />

        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
          <Input
            placeholder="Tìm theo tên bệnh nhân..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            className="h-9 rounded-lg pl-9 bg-white"
          />
        </div>
        
        {/* Date Range */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-500 hidden sm:inline">Từ</span>
          <Input
            type="date"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
              setPage(0);
            }}
            className="h-9 w-[140px] bg-white"
            aria-label="Start date"
          />
          <span className="text-sm text-slate-500">→</span>
          <Input
            type="date"
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value);
              setPage(0);
            }}
            className="h-9 w-[140px] bg-white"
            aria-label="End date"
          />
        </div>
      </div>

      {/* Content Card */}
      <Card className="shadow-sm">
        <CardContent className="p-0">
          {viewMode === "table" ? (
            /* Table View */
            <div className="overflow-hidden rounded-xl">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Bệnh nhân</TableHead>
                    <TableHead>Chẩn đoán</TableHead>
                    <TableHead>Ngày khám</TableHead>
                    <TableHead className="text-center">Rx</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="py-10 text-center">
                        <span className="inline-flex items-center gap-2 text-muted-foreground">
                          <Spinner size="sm" /> Đang tải...
                        </span>
                      </TableCell>
                    </TableRow>
                  ) : exams.length ? (
                    exams.map((exam: MedicalExamListItem, index: number) => (
                      <TableRow 
                        key={exam.id}
                        className={`hover:bg-slate-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}
                      >
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-3">
                            {/* Patient Avatar */}
                            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                              {exam.patient.fullName?.charAt(0)?.toUpperCase() || 'P'}
                            </div>
                            <Link
                              href={`/doctor/patients/${exam.patient.id}`}
                              className="text-slate-900 font-medium hover:text-teal-600 transition-colors"
                            >
                              {exam.patient.fullName}
                            </Link>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground truncate max-w-[220px]">
                          {exam.diagnosis || "-"}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDate(exam.examDate)}
                        </TableCell>
                        <TableCell className="text-center">
                          {exam.hasPrescription ? (
                            <Badge
                              variant="secondary"
                              className="bg-green-100 text-green-700"
                            >
                              💊
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Link href={`/doctor/exams/${exam.id}`}>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-slate-500 hover:text-teal-600 hover:bg-teal-50"
                              title="Xem chi tiết"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="py-10 text-center text-muted-foreground"
                      >
                        <span className="inline-flex items-center gap-2 justify-center">
                          <CalendarClock className="h-4 w-4" /> Không có hồ sơ
                        </span>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          ) : (
            /* Timeline View */
            <TimelineView exams={exams} isLoading={isLoading} />
          )}

          {!isLoading && totalElements > 0 && (
            <div className="px-6 py-4 border-t">
              <DataTablePagination
                currentPage={page}
                totalPages={totalPages}
                totalElements={totalElements}
                pageSize={size}
                onPageChange={setPage}
                infoText={`Hiển thị ${page * size + 1}-${Math.min((page + 1) * size, totalElements)} / ${totalElements}`}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

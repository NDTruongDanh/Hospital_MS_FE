"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import {
  FileText,
  Pill,
  ChevronRight,
  Calendar,
  RefreshCw,
  List,
  GitBranch,
  Stethoscope,
  Heart,
  Activity,
  Clock,
  Sparkles,
  Info,
  CheckCircle,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { DataTablePagination } from "@/components/ui/data-table-pagination";
import { DateRangeFilter, DateRange } from "@/components/ui/date-range-filter";
import { useMedicalExamList } from "@/hooks/queries/useMedicalExam";
import { useAuth } from "@/contexts/AuthContext";
import { useMyProfile } from "@/hooks/queries/usePatient";
import { cn } from "@/lib/utils";

type ViewMode = "list" | "timeline";

// View toggle component
function ViewToggle({ view, onChange }: { view: ViewMode; onChange: (v: ViewMode) => void }) {
  return (
    <div className="flex bg-slate-100 rounded-lg p-1">
      <button
        onClick={() => onChange("list")}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
          view === "list"
            ? "bg-white text-slate-900 shadow-sm"
            : "text-slate-600 hover:text-slate-900"
        }`}
      >
        <List className="h-4 w-4" />
        Danh sách
      </button>
      <button
        onClick={() => onChange("timeline")}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
          view === "timeline"
            ? "bg-white text-slate-900 shadow-sm"
            : "text-slate-600 hover:text-slate-900"
        }`}
      >
        <GitBranch className="h-4 w-4" />
        Timeline
      </button>
    </div>
  );
}

// Group exams by month for timeline view
function groupExamsByMonth(exams: any[]) {
  const groups: Record<string, { month: string; exams: any[] }> = {};
  
  exams.forEach((exam) => {
    const date = new Date(exam.examDate);
    const monthKey = format(date, "yyyy-MM");
    const monthLabel = format(date, "MMMM yyyy", { locale: vi });
    
    if (!groups[monthKey]) {
      groups[monthKey] = { month: monthLabel, exams: [] };
    }
    groups[monthKey].exams.push(exam);
  });

  return Object.entries(groups)
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([, v]) => v);
}

// Timeline Item Component
function TimelineItem({ exam, isLast }: { exam: any; isLast: boolean }) {
  return (
    <div className="relative flex gap-4 pb-6">
      {!isLast && (
        <div className="absolute left-[13px] top-10 bottom-0 w-0.5 bg-gradient-to-b from-violet-300 to-slate-200" />
      )}
      
      <div className="relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-purple-600 shadow-md">
        <FileText className="h-3.5 w-3.5 text-white" />
      </div>
      
      <Link href={`/patient/medical-records/${exam.id}`} className="flex-1 min-w-0">
        <Card className="border-2 border-slate-200 hover:border-violet-300 hover:shadow-md transition-all cursor-pointer group">
          <CardContent className="py-4 px-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-slate-800">
                    {format(new Date(exam.examDate), "dd/MM/yyyy")}
                  </span>
                  <Badge variant="secondary" className="text-xs">
                    {format(new Date(exam.examDate), "HH:mm")}
                  </Badge>
                  {exam.hasPrescription && (
                    <Badge className="bg-blue-100 text-blue-700 border border-blue-200">
                      <Pill className="h-3 w-3 mr-1" />
                      Đơn thuốc
                    </Badge>
                  )}
                </div>
                
                <div className="flex items-center gap-3 text-sm text-slate-500 mt-2">
                  <span className="flex items-center gap-1.5">
                    <Stethoscope className="h-3.5 w-3.5" />
                    {exam.doctor?.fullName || "Không xác định"}
                  </span>
                </div>
                
                {exam.diagnosis && (
                  <p className="text-sm text-slate-600 mt-2 line-clamp-1">
                    <span className="font-medium text-slate-700">Chẩn đoán:</span> {exam.diagnosis}
                  </p>
                )}
              </div>
              
              <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-violet-500 shrink-0 mt-1 transition-colors" />
            </div>
          </CardContent>
        </Card>
      </Link>
    </div>
  );
}

// Timeline View Component
function TimelineView({ exams }: { exams: any[] }) {
  const groupedExams = useMemo(() => groupExamsByMonth(exams), [exams]);

  if (exams.length === 0) {
    return (
      <Card className="border-2 border-dashed border-slate-200">
        <CardContent className="py-16 text-center">
          <div className="rounded-full bg-slate-100 p-4 w-fit mx-auto mb-4">
            <FileText className="h-12 w-12 text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-700">Chưa có hồ sơ bệnh án</h3>
          <p className="text-slate-500 mt-1">Lịch sử khám bệnh sẽ hiển thị ở đây</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      {groupedExams.map((group) => (
        <div key={group.month}>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-violet-100">
              <Calendar className="h-4 w-4 text-violet-600" />
            </div>
            <h3 className="font-semibold text-slate-800 capitalize">{group.month}</h3>
            <Badge className="bg-violet-100 text-violet-700">{group.exams.length} lần khám</Badge>
          </div>
          
          <div className="ml-3">
            {group.exams.map((exam, index) => (
              <TimelineItem 
                key={exam.id} 
                exam={exam} 
                isLast={index === group.exams.length - 1}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// List View Component
function ListView({ exams }: { exams: any[] }) {
  if (exams.length === 0) {
    return (
      <Card className="border-2 border-dashed border-slate-200">
        <CardContent className="py-16 text-center">
          <div className="rounded-full bg-slate-100 p-4 w-fit mx-auto mb-4">
            <FileText className="h-12 w-12 text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-700">Chưa có hồ sơ bệnh án</h3>
          <p className="text-slate-500 mt-1">Lịch sử khám bệnh sẽ hiển thị ở đây</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {exams.map((exam) => (
        <Link
          key={exam.id}
          href={`/patient/medical-records/${exam.id}`}
          className="block"
        >
          <Card className="border-2 border-slate-200 hover:border-violet-300 hover:shadow-lg transition-all cursor-pointer group overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500" />
            <CardContent className="py-5">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-lg bg-violet-100">
                      <FileText className="h-5 w-5 text-violet-600" />
                    </div>
                    <div>
                      <span className="font-bold text-lg text-slate-800">
                        {format(new Date(exam.examDate), "dd/MM/yyyy")}
                      </span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant="secondary" className="text-xs">
                          <Clock className="h-3 w-3 mr-1" />
                          {format(new Date(exam.examDate), "HH:mm")}
                        </Badge>
                        {exam.hasPrescription && (
                          <Badge className="bg-blue-100 text-blue-700 border border-blue-200">
                            <Pill className="h-3 w-3 mr-1" />
                            Có đơn thuốc
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600 ml-12">
                    <span className="flex items-center gap-1.5">
                      <Stethoscope className="h-4 w-4 text-slate-400" />
                      <span className="font-medium">{exam.doctor?.fullName || "Không xác định"}</span>
                    </span>
                  </div>

                  {exam.diagnosis && (
                    <div className="mt-3 ml-12 p-3 bg-slate-50 rounded-lg border border-slate-100">
                      <p className="text-sm text-slate-700">
                        <span className="font-semibold text-violet-600">Chẩn đoán:</span> {exam.diagnosis}
                      </p>
                    </div>
                  )}
                </div>

                <ChevronRight className="h-6 w-6 text-slate-400 group-hover:text-violet-500 flex-shrink-0 ml-4 transition-colors" />
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}

export default function PatientMedicalRecordsPage() {
  const { user } = useAuth();
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [page, setPage] = useState(0);
  const pageSize = 10;

  // Fetch patient profile to get patientId
  const { data: profile, isLoading: isLoadingProfile } = useMyProfile();
  const patientId = profile?.id || "";

  const queryParams = useMemo(
    () => ({
      patientId: patientId || undefined,
      startDate: dateRange?.from ? format(dateRange.from, "yyyy-MM-dd") : undefined,
      endDate: dateRange?.to ? format(dateRange.to, "yyyy-MM-dd") : undefined,
      page,
      size: pageSize,
      sort: "examDate,desc",
    }),
    [patientId, dateRange, page]
  );

  const { data, isLoading, refetch, isFetching } = useMedicalExamList(queryParams);

  const exams = data?.content || [];
  const totalPages = data?.totalPages || 0;
  const totalElements = data?.totalElements || 0;

  // Stats
  const withPrescription = exams.filter((e: any) => e.hasPrescription).length;

  if (isLoadingProfile) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" variant="muted" />
      </div>
    );
  }

  if (!user || user.role !== "PATIENT") {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-destructive">Truy cập bị từ chối</h2>
          <p className="text-muted-foreground mt-2">
            Chỉ bệnh nhân mới có thể xem hồ sơ bệnh án.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Enhanced Gradient Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-violet-600 via-purple-500 to-fuchsia-500 p-6 text-white shadow-xl">
        {/* Background decorations */}
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
        <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-white/5" />
        <div className="absolute top-1/2 right-1/4 h-20 w-20 rounded-full bg-white/5" />

        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="rounded-xl bg-white/20 p-3 backdrop-blur-sm">
              <FileText className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                Hồ sơ bệnh án
                {isFetching && <RefreshCw className="h-4 w-4 animate-spin" />}
              </h1>
              <p className="mt-1 text-purple-100">
                Xem lịch sử khám bệnh và đơn thuốc của bạn
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="flex gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold">{totalElements}</div>
              <div className="text-sm text-purple-200">Tổng hồ sơ</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">{withPrescription}</div>
              <div className="text-sm text-purple-200">Có đơn thuốc</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-3 space-y-4">
          {/* Filter Bar */}
          <Card className="border-2 border-slate-200 shadow-sm">
            <CardContent className="py-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <DateRangeFilter
                    value={dateRange}
                    onChange={(range) => {
                      setDateRange(range);
                      setPage(0);
                    }}
                    theme="purple"
                    presetKeys={["all", "today", "7days", "30days", "thisMonth"]}
                  />
                </div>

                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => refetch()}
                    disabled={isFetching}
                    className="gap-2"
                  >
                    <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
                    Làm mới
                  </Button>
                  <ViewToggle view={viewMode} onChange={setViewMode} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Content */}
          {isLoading ? (
            <div className="flex items-center justify-center min-h-[300px]">
              <Spinner size="lg" variant="muted" />
            </div>
          ) : viewMode === "list" ? (
            <ListView exams={exams} />
          ) : (
            <TimelineView exams={exams} />
          )}

          {/* Pagination */}
          {totalElements > 0 && viewMode === "list" && (
            <Card className="border-2 border-slate-200">
              <CardContent className="py-3">
                <DataTablePagination
                  currentPage={page}
                  totalPages={totalPages}
                  totalElements={totalElements}
                  pageSize={pageSize}
                  onPageChange={setPage}
                  showRowsPerPage={false}
                />
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Info Card */}
          <Card className="border-2 border-violet-200 bg-gradient-to-br from-violet-50 to-white shadow-sm">
            <CardContent className="pt-5">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-violet-100">
                  <Info className="h-4 w-4 text-violet-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800 mb-2">Thông tin</h3>
                  <p className="text-sm text-slate-600">
                    Đây là lịch sử các lần khám bệnh của bạn tại bệnh viện, bao gồm chẩn đoán và đơn thuốc.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Features Card */}
          <Card className="border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-white shadow-sm">
            <CardContent className="pt-5">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-emerald-100">
                  <Heart className="h-4 w-4 text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800 mb-2">Tính năng</h3>
                  <ul className="space-y-2 text-sm text-slate-600">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                      Xem chi tiết từng lần khám
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                      Xem đơn thuốc đã kê
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                      Lọc theo thời gian
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats Card */}
          <Card className="border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-white shadow-sm">
            <CardContent className="pt-5">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-amber-100">
                  <Activity className="h-4 w-4 text-amber-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-800 mb-3">Thống kê nhanh</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">Tổng số lần khám</span>
                      <Badge className="bg-amber-100 text-amber-700">{totalElements}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">Có đơn thuốc</span>
                      <Badge className="bg-blue-100 text-blue-700">{withPrescription}</Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

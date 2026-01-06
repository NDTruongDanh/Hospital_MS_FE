"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import {
  FileText,
  Pill,
  ChevronRight,
  Search,
  Calendar,
  RefreshCw,
  X,
  List,
  GitBranch,
  Stethoscope,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { ListPageHeader } from "@/components/ui/list-page-header";
import { DataTablePagination } from "@/components/ui/data-table-pagination";
import { useMedicalExamList } from "@/hooks/queries/useMedicalExam";
import { useAuth } from "@/contexts/AuthContext";
import { useMyProfile } from "@/hooks/queries/usePatient";
import { cn } from "@/lib/utils";

type ViewMode = "list" | "timeline";

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
        <div className="absolute left-[11px] top-8 bottom-0 w-0.5 bg-border" />
      )}
      
      <div className="relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-500">
        <FileText className="h-3 w-3 text-white" />
      </div>
      
      <Link href={`/patient/medical-records/${exam.id}`} className="flex-1 min-w-0">
        <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
          <CardContent className="py-3 px-4">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold">
                    {format(new Date(exam.examDate), "dd/MM/yyyy HH:mm")}
                  </span>
                  {exam.hasPrescription && (
                    <Badge variant="outline" className="text-blue-600 border-blue-200">
                      <Pill className="h-3 w-3 mr-1" />
                      Có đơn thuốc
                    </Badge>
                  )}
                </div>
                
                <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                  <span className="flex items-center gap-1">
                    <Stethoscope className="h-3 w-3" />
                    {exam.doctor?.fullName || "Không xác định"}
                  </span>
                </div>
                
                {exam.diagnosis && (
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                    <span className="font-medium">Chẩn đoán:</span> {exam.diagnosis}
                  </p>
                )}
              </div>
              
              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
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
      <Card>
        <CardContent className="py-12 text-center">
          <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground">Không có hồ sơ bệnh án nào</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {groupedExams.map((group) => (
        <div key={group.month}>
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="h-4 w-4 text-violet-600" />
            <h3 className="font-semibold text-violet-700 capitalize">{group.month}</h3>
            <Badge variant="secondary" className="ml-2">{group.exams.length}</Badge>
          </div>
          
          <div className="ml-2">
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
      <Card>
        <CardContent className="py-12 text-center">
          <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground">Không có hồ sơ bệnh án nào</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {exams.map((exam) => (
        <Link
          key={exam.id}
          href={`/patient/medical-records/${exam.id}`}
          className="block"
        >
          <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <FileText className="h-5 w-5 text-violet-600" />
                    <span className="font-semibold text-lg">
                      {format(new Date(exam.examDate), "dd/MM/yyyy")}
                    </span>
                    {exam.hasPrescription && (
                      <Badge variant="outline" className="text-blue-600 border-blue-200">
                        <Pill className="h-3 w-3 mr-1" />
                        Đơn thuốc
                      </Badge>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {format(new Date(exam.examDate), "HH:mm")}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Stethoscope className="h-3.5 w-3.5" />
                      {exam.doctor?.fullName || "Không xác định"}
                    </span>
                  </div>

                  {exam.diagnosis && (
                    <p className="mt-2 text-sm text-muted-foreground line-clamp-1">
                      <span className="font-medium">Chẩn đoán:</span> {exam.diagnosis}
                    </p>
                  )}
                </div>

                <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0 ml-4" />
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
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [page, setPage] = useState(0);
  const pageSize = 10;

  // Fetch patient profile to get patientId
  const { data: profile, isLoading: isLoadingProfile } = useMyProfile();
  const patientId = profile?.id || "";

  const queryParams = useMemo(
    () => ({
      patientId: patientId || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      page,
      size: pageSize,
      sort: "examDate,desc",
    }),
    [patientId, startDate, endDate, page]
  );

  const { data, isLoading, refetch, isFetching } = useMedicalExamList(queryParams);

  const exams = data?.content || [];
  const totalPages = data?.totalPages || 0;
  const totalElements = data?.totalElements || 0;

  // Stats
  const withPrescription = exams.filter((e: any) => e.hasPrescription).length;

  const clearDateFilter = () => {
    setStartDate("");
    setEndDate("");
    setPage(0);
  };

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
      {/* Header */}
      <ListPageHeader
        title="Hồ sơ bệnh án"
        description="Xem lịch sử khám bệnh và đơn thuốc của bạn"
        theme="violet"
        icon={<FileText className="h-6 w-6 text-white" />}
        stats={[
          { label: "Tổng hồ sơ", value: totalElements },
          { label: "Có đơn thuốc", value: withPrescription },
        ]}
      />

      {/* View Toggle + Actions */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        {/* Date Range Filter */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <Input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPage(0);
              }}
              className="w-36"
            />
          </div>
          <span className="text-muted-foreground">-</span>
          <Input
            type="date"
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value);
              setPage(0);
            }}
            className="w-36"
            min={startDate}
          />
          {(startDate || endDate) && (
            <Button variant="ghost" size="icon" onClick={clearDateFilter}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {/* Refresh */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? "animate-spin" : ""}`} />
            Làm mới
          </Button>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-muted rounded-lg p-1">
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
              className="gap-1.5"
            >
              <List className="h-4 w-4" />
              List
            </Button>
            <Button
              variant={viewMode === "timeline" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("timeline")}
              className="gap-1.5"
            >
              <GitBranch className="h-4 w-4" />
              Timeline
            </Button>
          </div>
        </div>
      </div>

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
        <DataTablePagination
          currentPage={page}
          totalPages={totalPages}
          totalElements={totalElements}
          pageSize={pageSize}
          onPageChange={setPage}
          showRowsPerPage={false}
        />
      )}
    </div>
  );
}

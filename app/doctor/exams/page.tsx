"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CalendarClock, Loader2, Search } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { useMedicalExamList } from "@/hooks/queries/useMedicalExam";
import { useDebounce } from "@/hooks/useDebounce";
import { MedicalExamListItem } from "@/interfaces/medical-exam";
import { ExamStatusBadge } from "@/app/admin/exams/_components/exam-status-badge";
import { DataTablePagination } from "@/components/ui/data-table-pagination";
import { DataTableRowActions } from "@/components/ui/data-table-row-actions";

const formatDate = (value: string) =>
  new Date(value).toLocaleString("vi-VN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

export default function DoctorExamsPage() {
  const [doctorId, setDoctorId] = useState<string | null>(() => {
    const stored =
      typeof window !== "undefined" ? localStorage.getItem("doctorId") : null;
    return stored || "emp-101";
  });

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(20);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [status, setStatus] = useState("ALL");

  const debouncedSearch = useDebounce(search, 300);

  const { data, isLoading } = useMedicalExamList({
    page,
    size,
    doctorId: doctorId || undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    status: status !== "ALL" ? (status as any) : undefined,
  });

  const exams = data?.content || [];
  const totalPages = data?.totalPages || 1;

  const filtered = useMemo(() => {
    if (!debouncedSearch) return exams;
    const term = debouncedSearch.toLowerCase();
    return exams.filter(
      (exam: MedicalExamListItem) =>
        exam.patient.fullName.toLowerCase().includes(term) ||
        exam.diagnosis?.toLowerCase().includes(term)
    );
  }, [exams, debouncedSearch]);

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Hồ sơ khám của tôi
          </h1>
          <p className="text-muted-foreground mt-1">
            Danh sách lượt khám do bác sĩ thực hiện.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Bộ lọc</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-end gap-4">
          <div className="relative w-full sm:max-w-xl">
            <Search className="text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
            <Input
              placeholder="Tìm theo bệnh nhân, chẩn đoán..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
              className="h-10 rounded-lg pl-9"
            />
          </div>
          <Select
            value={status}
            onValueChange={(v) => {
              setStatus(v);
              setPage(0);
            }}
          >
            <SelectTrigger className="h-10 w-full sm:w-44">
              <SelectValue placeholder="Trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tất cả</SelectItem>
              <SelectItem value="PENDING">PENDING</SelectItem>
              <SelectItem value="IN_PROGRESS">IN_PROGRESS</SelectItem>
              <SelectItem value="FINALIZED">FINALIZED</SelectItem>
              <SelectItem value="CANCELLED">CANCELLED</SelectItem>
            </SelectContent>
          </Select>
          <Input
            type="date"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
              setPage(0);
            }}
            className="h-10"
            aria-label="Start date"
          />
          <Input
            type="date"
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value);
              setPage(0);
            }}
            className="h-10"
            aria-label="End date"
          />
        </CardContent>

        <CardContent className="p-0">
          <div className="overflow-hidden rounded-b-xl border-t">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bệnh nhân</TableHead>
                  <TableHead>Chẩn đoán</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Ngày khám</TableHead>
                  <TableHead className="text-center">Rx</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-10 text-center">
                      <span className="inline-flex items-center gap-2 text-muted-foreground">
                        <Spinner size="sm" /> Đang tải...
                      </span>
                    </TableCell>
                  </TableRow>
                ) : filtered.length ? (
                  filtered.map((exam) => (
                    <TableRow key={exam.id}>
                      <TableCell className="font-medium">
                        {exam.patient.fullName}
                      </TableCell>
                      <TableCell className="text-muted-foreground truncate max-w-[220px]">
                        {exam.diagnosis || "-"}
                      </TableCell>
                      <TableCell>
                        <ExamStatusBadge status={exam.status as any} />
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
                        <DataTableRowActions
                          rowId={exam.id}
                          actions={[
                            {
                              label: "View details",
                              href: `/doctor/exams/${exam.id}`,
                            },
                          ]}
                        />
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={6}
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

          {!isLoading && data && data.totalElements > 0 && (
            <div className="px-6 py-4 border-t">
              <DataTablePagination
                currentPage={page}
                totalPages={totalPages}
                totalElements={data.totalElements}
                pageSize={size}
                onPageChange={setPage}
                infoText={`Hiển thị ${page * size + 1}-${Math.min((page + 1) * size, data.totalElements)} / ${data.totalElements}`}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

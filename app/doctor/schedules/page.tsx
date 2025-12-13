"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { addDays, format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDoctorSchedules } from "@/hooks/queries/useHr";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

type ScheduleStatus = "AVAILABLE" | "BOOKED" | "CANCELLED";

const statusTone: Record<ScheduleStatus, string> = {
  AVAILABLE: "bg-emerald-100 text-emerald-700",
  BOOKED: "bg-blue-100 text-blue-700",
  CANCELLED: "bg-red-100 text-red-700",
};

const SchedulePageSkeleton = () => (
  <div className="page-shell space-y-6">
    <div>
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-64 mt-2" />
    </div>
    <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
      <Card className="shadow-sm">
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48 mt-1" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-40 w-full" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-10 w-[180px]" />
            <Skeleton className="h-10 w-20" />
          </div>
        </CardContent>
      </Card>
      <Card className="shadow-sm w-full">
        <CardHeader>
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-4 w-40 mt-1" />
        </CardHeader>
        <CardContent className="p-0">
          <div className="p-4 border-t">
            <Skeleton className="h-10 w-full mb-2" />
            <Skeleton className="h-10 w-full mb-2" />
            <Skeleton className="h-10 w-full" />
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
);


export default function MySchedulesPage() {
  const router = useRouter();
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date } | undefined>(undefined);
  const [status, setStatus] = useState<ScheduleStatus | "ALL">("ALL");
  const [doctorId, setDoctorId] = useState<string | undefined>(() => {
    const stored =
      typeof window !== "undefined" ? localStorage.getItem("doctorId") : null;
    return stored || undefined;
  });

  useEffect(() => {
    setDateRange({
        from: new Date(),
        to: addDays(new Date(), 7),
    });
  }, []);

  const { data, isLoading, refetch } = useDoctorSchedules({
    startDate: dateRange ? format(dateRange.from, "yyyy-MM-dd") : undefined,
    endDate: dateRange ? format(dateRange.to, "yyyy-MM-dd") : undefined,
    status: status === "ALL" ? undefined : status,
    doctorId,
    enabled: !!dateRange,
  });

  if (!dateRange) {
    return <SchedulePageSkeleton />;
  }

  return (
    <div className="page-shell space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">My Schedules</h1>
        <p className="text-muted-foreground">
          Lịch trực và ca khám của bác sĩ.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Khoảng thời gian</CardTitle>
            <CardDescription>Chọn ngày bắt đầu và kết thúc</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-sm text-muted-foreground">Start</label>
                <input
                  type="date"
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  value={format(dateRange.from, "yyyy-MM-dd")}
                  onChange={(e) =>
                    setDateRange((prev) => ({
                      ...prev!,
                      from: e.target.value
                        ? new Date(e.target.value)
                        : prev!.from,
                    }))
                  }
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm text-muted-foreground">End</label>
                <input
                  type="date"
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  value={format(dateRange.to, "yyyy-MM-dd")}
                  onChange={(e) =>
                    setDateRange((prev) => ({
                      ...prev!,
                      to: e.target.value ? new Date(e.target.value) : prev!.to,
                    }))
                  }
                />
              </div>
            </div>
            <Calendar
              mode="range"
              selected={{ from: dateRange.from, to: dateRange.to }}
              onSelect={(range) => {
                if (range?.from && range?.to)
                  setDateRange({ from: range.from, to: range.to });
              }}
              defaultMonth={dateRange.from}
              numberOfMonths={1}
            />
            <div className="flex items-center gap-2">
              <Select value={status} onValueChange={(v) => setStatus(v as any)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All statuses</SelectItem>
                  <SelectItem value="AVAILABLE">Available</SelectItem>
                  <SelectItem value="BOOKED">Booked</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                Refresh
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm w-full">
          <CardHeader className="flex-row items-center justify-between gap-3">
            <div>
              <CardTitle className="text-lg">Lịch của tôi</CardTitle>
              <CardDescription>
                {format(dateRange.from, "dd/MM/yyyy")} -{" "}
                {format(dateRange.to, "dd/MM/yyyy")}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-hidden rounded-b-xl border-t">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ngày</TableHead>
                    <TableHead>Giờ</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead>Ghi chú</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="text-center py-6 text-muted-foreground"
                      >
                        Đang tải...
                      </TableCell>
                    </TableRow>
                  ) : data?.content && data.content.length > 0 ? (
                    data.content.map((schedule: any) => (
                      <TableRow key={schedule.id}>
                        <TableCell className="text-muted-foreground">
                          {format(new Date(schedule.workDate), "dd/MM/yyyy")}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {schedule.startTime} - {schedule.endTime}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className={`rounded-full px-3 py-1 text-xs font-medium ${
                              statusTone[schedule.status as ScheduleStatus] ||
                              ""
                            }`}
                          >
                            {schedule.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {schedule.notes ||
                            `${schedule.appointments || 0} appointments`}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="py-10 text-center text-muted-foreground"
                      >
                        Không có lịch
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

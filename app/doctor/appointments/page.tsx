"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useDoctorAppointments, useCompleteAppointment } from "@/hooks/queries/useAppointment";
import { AppointmentStatusBadge } from "@/app/admin/appointments/_components/appointment-status-badge";
import { toast } from "sonner";
import { format } from "date-fns";

export default function DoctorAppointmentsPage() {
  const [doctorId, setDoctorId] = useState<string | null>(null);
  const { data: appointments = [], isLoading } = useDoctorAppointments(doctorId || "");
  const completeMutation = useCompleteAppointment();
  const [viewMode, setViewMode] = useState<"all" | "week">("all");

  useEffect(() => {
    const id = typeof window !== "undefined" ? localStorage.getItem("doctorId") : null;
    setDoctorId(id || "emp-101"); // fallback mock doctor
  }, []);

  const handleComplete = async (id: string) => {
    try {
      await completeMutation.mutateAsync(id);
      toast.success("Đã đánh dấu hoàn tất");
    } catch {
      toast.error("Không thể hoàn tất lịch hẹn");
    }
  };

  const filtered = useMemo(() => {
    if (viewMode === "week") {
      const now = new Date();
      const end = new Date();
      end.setDate(now.getDate() + 7);
      return appointments.filter((apt: any) => {
        const at = new Date(apt.appointmentTime);
        return at >= now && at <= end;
      });
    }
    return appointments;
  }, [appointments, viewMode]);

  const stats = useMemo(() => {
    const total = filtered.length;
    const pending = filtered.filter((a: any) => a.status === "SCHEDULED").length;
    const completed = filtered.filter((a: any) => a.status === "COMPLETED").length;
    const cancelled = filtered.filter((a: any) => a.status === "CANCELLED").length;
    return { total, pending, completed, cancelled };
  }, [filtered]);

  return (
    <div className="page-shell space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Lịch khám của bác sĩ</h1>
          <p className="text-muted-foreground">Xem các lịch hẹn trong ngày/tuần</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={viewMode === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("all")}
          >
            Tất cả
          </Button>
          <Button
            variant={viewMode === "week" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("week")}
          >
            Tuần này
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Tổng</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Pending</p>
            <p className="text-2xl font-bold">{stats.pending}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Completed</p>
            <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Cancelled</p>
            <p className="text-2xl font-bold text-destructive">{stats.cancelled}</p>
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Đang tải...</p>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            Không có lịch hẹn.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map((apt: any) => {
            const isToday =
              new Date(apt.appointmentTime).toDateString() === new Date().toDateString();
            const canComplete = apt.status === "SCHEDULED";
            return (
              <Card key={apt.id}>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-base">
                      {apt.patient?.fullName} • {apt.patient?.phoneNumber || ""}
                    </CardTitle>
                  <p className="text-sm text-muted-foreground">
                      {new Date(apt.appointmentTime).toLocaleString("vi-VN")}
                    </p>
                  </div>
                  <AppointmentStatusBadge status={apt.status} />
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">Loại: {apt.type}</p>
                  <p className="text-sm text-muted-foreground">Lý do: {apt.reason}</p>
                  <div className="flex gap-2 flex-wrap">
                    <Button size="sm" variant="outline" asChild>
                      <Link href={`/doctor/appointments/${apt.id}`}>Chi tiết</Link>
                    </Button>
                    {canComplete && (
                      <Button
                        size="sm"
                        onClick={() => handleComplete(apt.id)}
                        disabled={completeMutation.isPending}
                      >
                        Complete
                      </Button>
                    )}
                    {isToday && <Badge variant="secondary">Hôm nay</Badge>}
                    {isToday || new Date(apt.appointmentTime) > new Date() ? (
                      <Badge variant="outline">Upcoming</Badge>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

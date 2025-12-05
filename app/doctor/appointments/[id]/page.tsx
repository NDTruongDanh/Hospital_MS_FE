"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AppointmentStatusBadge } from "@/app/admin/appointments/_components/appointment-status-badge";
import { useAppointment, useCompleteAppointment } from "@/hooks/queries/useAppointment";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

export default function DoctorAppointmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [doctorId, setDoctorId] = useState<string | null>(null);
  const { data: appointment, isLoading } = useAppointment(id);
  const completeMutation = useCompleteAppointment();

  useEffect(() => {
    const did = typeof window !== "undefined" ? localStorage.getItem("doctorId") : null;
    setDoctorId(did || "emp-101");
  }, []);

  if (isLoading) return <p className="p-6 text-muted-foreground">Đang tải...</p>;
  if (!appointment) return <p className="p-6">Không tìm thấy lịch hẹn</p>;

  if (doctorId && appointment.doctor.id !== doctorId) {
    return (
      <div className="page-shell py-10 text-center space-y-2">
        <p className="text-lg font-semibold text-destructive">
          Bạn không có quyền xem lịch hẹn này (403)
        </p>
        <Button variant="link" onClick={() => router.push("/doctor/appointments")}>
          Về danh sách
        </Button>
      </div>
    );
  }

  const handleComplete = async () => {
    try {
      await completeMutation.mutateAsync(appointment.id);
      toast.success("Đã hoàn tất");
    } catch {
      toast.error("Không thể hoàn tất");
    }
  };

  return (
    <div className="page-shell space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Chi tiết lịch hẹn</h1>
          <p className="text-muted-foreground">ID: {appointment.id}</p>
        </div>
        <AppointmentStatusBadge status={appointment.status} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Thông tin</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            <span className="text-muted-foreground">Bệnh nhân: </span>
            {appointment.patient.fullName}
          </p>
          <p>
            <span className="text-muted-foreground">Thời gian: </span>
            {new Date(appointment.appointmentTime).toLocaleString("vi-VN")}
          </p>
          <p>
            <span className="text-muted-foreground">Loại: </span>
            {appointment.type}
          </p>
          <p>
            <span className="text-muted-foreground">Lý do: </span>
            {appointment.reason}
          </p>
          {appointment.notes && (
            <p>
              <span className="text-muted-foreground">Ghi chú: </span>
              {appointment.notes}
            </p>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <Button variant="outline" asChild>
          <Link href="/doctor/appointments">Quay lại</Link>
        </Button>
        <Button onClick={handleComplete} disabled={completeMutation.isPending}>
          Start Visit / Complete
        </Button>
        <Button variant="secondary" asChild>
          <Link href={`/admin/patients/${appointment.patient.id}`}>
            View Patient Profile
          </Link>
        </Button>
        {appointment.status === "COMPLETED" && (
          <Button asChild>
            <Link href={`/admin/exams/new?appointmentId=${appointment.id}`}>
              Create Medical Exam
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}

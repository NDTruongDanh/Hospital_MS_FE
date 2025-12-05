"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAppointment, useCancelAppointment } from "@/hooks/queries/useAppointment";
import { AppointmentStatusBadge } from "@/app/admin/appointments/_components/appointment-status-badge";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export default function PatientAppointmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [patientId, setPatientId] = useState<string | null>(null);
  const { data: appointment, isLoading } = useAppointment(id);
  const cancelMutation = useCancelAppointment();

  useEffect(() => {
    const pid = typeof window !== "undefined" ? localStorage.getItem("patientId") : null;
    setPatientId(pid || "p001");
  }, []);

  if (isLoading) return <p className="p-6 text-muted-foreground">Đang tải...</p>;
  if (!appointment) return <p className="p-6">Không tìm thấy lịch hẹn</p>;

  if (patientId && appointment.patient.id !== patientId) {
    return (
      <div className="page-shell py-10 text-center space-y-2">
        <p className="text-lg font-semibold text-destructive">
          Bạn không có quyền xem lịch hẹn này (403)
        </p>
        <Button variant="link" onClick={() => router.push("/patient/appointments")}>
          Về danh sách lịch hẹn
        </Button>
      </div>
    );
  }

  const isCancelable = appointment.status === "SCHEDULED";

  const handleCancel = async () => {
    try {
      await cancelMutation.mutateAsync({
        id: appointment.id,
        data: { cancelReason: "Patient cancelled" },
      });
      toast.success("Đã hủy lịch hẹn");
      router.push("/patient/appointments");
    } catch {
      toast.error("Không thể hủy lịch hẹn");
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
            <span className="text-muted-foreground">Bác sĩ: </span>
            {appointment.doctor.fullName}{" "}
            {appointment.doctor.department ? `• ${appointment.doctor.department}` : ""}
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
          {appointment.status === "CANCELLED" && appointment.cancelReason && (
            <Badge variant="destructive">Đã hủy: {appointment.cancelReason}</Badge>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <Button variant="outline" asChild>
          <Link href="/patient/appointments">Quay lại</Link>
        </Button>
        {isCancelable && (
          <Button
            variant="destructive"
            onClick={handleCancel}
            disabled={cancelMutation.isPending}
          >
            Hủy lịch
          </Button>
        )}
      </div>
    </div>
  );
}

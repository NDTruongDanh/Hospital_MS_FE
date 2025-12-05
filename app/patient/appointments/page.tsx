"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { usePatientAppointments, useCancelAppointment } from "@/hooks/queries/useAppointment";
import { AppointmentStatusBadge } from "@/app/admin/appointments/_components/appointment-status-badge";
import { toast } from "sonner";

export default function PatientAppointmentListPage() {
  const [patientId, setPatientId] = useState<string | null>(null);
  const { data: appointments = [], isLoading } = usePatientAppointments(patientId || "");
  const cancelMutation = useCancelAppointment();

  useEffect(() => {
    const pid = typeof window !== "undefined" ? localStorage.getItem("patientId") : null;
    setPatientId(pid || "p001"); // fallback mock patient
  }, []);

  const handleCancel = async (id: string) => {
    try {
      await cancelMutation.mutateAsync({ id, data: { cancelReason: "User cancelled" } });
    } catch (error) {
      toast.error("Không thể hủy lịch");
    }
  };

  return (
    <div className="page-shell space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Lịch hẹn của tôi</h1>
          <p className="text-muted-foreground">Xem và quản lý lịch hẹn</p>
        </div>
        <Button asChild>
          <Link href="/patient/appointments/new">Đặt lịch mới</Link>
        </Button>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Đang tải...</p>
      ) : appointments.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            Bạn chưa có lịch hẹn nào.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {appointments.map((apt: any) => {
            const isCancelable = apt.status === "SCHEDULED";
            const isUpcoming = new Date(apt.appointmentTime) > new Date();
            return (
              <Card key={apt.id}>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-base">
                      {apt.patient?.fullName || "Bạn"} • {apt.doctor?.fullName}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {new Date(apt.appointmentTime).toLocaleString("vi-VN")}
                    </p>
                  </div>
                  <AppointmentStatusBadge status={apt.status} />
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex gap-2 flex-wrap">
                    <Button size="sm" variant="outline" asChild>
                      <Link href={`/patient/appointments/${apt.id}`}>Chi tiết</Link>
                    </Button>
                    {isCancelable && (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleCancel(apt.id)}
                        disabled={cancelMutation.isPending}
                      >
                        Hủy lịch
                      </Button>
                    )}
                    {isUpcoming && <Badge variant="secondary">Upcoming</Badge>}
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

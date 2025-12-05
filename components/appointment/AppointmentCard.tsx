"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { AppointmentStatusBadge } from "@/app/admin/appointments/_components/appointment-status-badge";

interface AppointmentCardProps {
  appointment: {
    id: string;
    appointmentTime: string;
    status: any;
    type: string;
    reason: string;
    patientName?: string;
    doctorName?: string;
  };
  onCancel?: () => void;
  cancelable?: boolean;
}

export function AppointmentCard({
  appointment,
  onCancel,
  cancelable,
}: AppointmentCardProps) {
  const isUpcoming = new Date(appointment.appointmentTime) > new Date();

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base">
            {appointment.patientName || "Bạn"} • {appointment.doctorName}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {new Date(appointment.appointmentTime).toLocaleString("vi-VN")}
          </p>
        </div>
        <AppointmentStatusBadge status={appointment.status} />
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <p>Loại: {appointment.type}</p>
        <p className="text-muted-foreground">Lý do: {appointment.reason}</p>
        <div className="flex gap-2 flex-wrap">
          <Button size="sm" variant="outline" asChild>
            <Link href={`/patient/appointments/${appointment.id}`}>Chi tiết</Link>
          </Button>
          {cancelable && onCancel && (
            <Button size="sm" variant="destructive" onClick={onCancel}>
              Hủy lịch
            </Button>
          )}
          {isUpcoming && <Badge variant="secondary">Upcoming</Badge>}
        </div>
      </CardContent>
    </Card>
  );
}

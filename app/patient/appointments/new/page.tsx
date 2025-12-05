"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { useCreateAppointment, useTimeSlots } from "@/hooks/queries/useAppointment";
import { AppointmentCreateRequest } from "@/interfaces/appointment";
import { toast } from "sonner";

type Step = 1 | 2 | 3;

export default function PatientBookingPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [patientId, setPatientId] = useState<string>("p001");
  const [doctorId, setDoctorId] = useState<string>("");
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [slot, setSlot] = useState<string>("");
  const [reason, setReason] = useState<string>("");
  const [type, setType] = useState<"CONSULTATION" | "FOLLOW_UP" | "EMERGENCY">("CONSULTATION");

  useEffect(() => {
    const pid = typeof window !== "undefined" ? localStorage.getItem("patientId") : null;
    setPatientId(pid || "p001");
  }, []);

  const isoDate = useMemo(() => (date ? date.toISOString().split("T")[0] : ""), [date]);
  const { data: slots } = useTimeSlots(doctorId, isoDate, undefined);
  const createMutation = useCreateAppointment();

  const canNextStep2 = doctorId && date;
  const canNextStep3 = slot && reason;

  const submitBooking = async () => {
    const payload: AppointmentCreateRequest = {
      patientId,
      doctorId,
      appointmentTime: `${isoDate}T${slot}`,
      type,
      reason,
    };
    try {
      await createMutation.mutateAsync(payload);
      toast.success("Đặt lịch thành công");
      router.push("/patient/appointments");
    } catch {
      toast.error("Không thể đặt lịch");
    }
  };

  return (
    <div className="page-shell space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Đặt lịch khám</h1>
        <p className="text-muted-foreground">Quy trình 3 bước: Chọn bác sĩ → Chọn thời gian → Xác nhận</p>
      </div>

      <div className="flex gap-2 text-sm">
        <span className={step === 1 ? "font-semibold" : "text-muted-foreground"}>Bước 1: Chọn bác sĩ & ngày</span>
        <span className={step === 2 ? "font-semibold" : "text-muted-foreground"}>Bước 2: Chọn giờ & lý do</span>
        <span className={step === 3 ? "font-semibold" : "text-muted-foreground"}>Bước 3: Xác nhận</span>
      </div>

      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Chọn bác sĩ & ngày</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Bác sĩ</Label>
              <Select value={doctorId} onValueChange={setDoctorId}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn bác sĩ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="emp-101">Dr. John Smith</SelectItem>
                  <SelectItem value="emp-102">Dr. Sarah Nguyen</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Ngày</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-[220px] justify-start">
                    {date ? format(date, "dd/MM/yyyy") : "Chọn ngày"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
                </PopoverContent>
              </Popover>
            </div>
            <div className="flex justify-end gap-2">
              <Button onClick={() => setStep(2)} disabled={!canNextStep2}>
                Tiếp tục
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Chọn giờ & lý do</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Giờ khám</Label>
              <div className="flex flex-wrap gap-2">
                {(slots || []).map((t: any) => (
                  <Button
                    key={t.time}
                    type="button"
                    variant={slot === t.time ? "default" : "outline"}
                    disabled={!t.available}
                    onClick={() => setSlot(t.time)}
                  >
                    {t.time}
                  </Button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Lý do</Label>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Mô tả triệu chứng"
              />
            </div>
            <div className="space-y-2">
              <Label>Loại khám</Label>
              <Select value={type} onValueChange={(v: any) => setType(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CONSULTATION">Khám mới</SelectItem>
                  <SelectItem value="FOLLOW_UP">Tái khám</SelectItem>
                  <SelectItem value="EMERGENCY">Cấp cứu</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(1)}>
                Quay lại
              </Button>
              <Button onClick={() => setStep(3)} disabled={!canNextStep3}>
                Tiếp tục
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Xác nhận</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>Patient: {patientId}</p>
            <p>Doctor: {doctorId}</p>
            <p>
              Thời gian: {date ? format(date, "dd/MM/yyyy") : ""} {slot}
            </p>
            <p>Loại: {type}</p>
            <p>Lý do: {reason}</p>
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(2)}>
                Quay lại
              </Button>
              <Button onClick={submitBooking} disabled={createMutation.isPending}>
                Xác nhận đặt lịch
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

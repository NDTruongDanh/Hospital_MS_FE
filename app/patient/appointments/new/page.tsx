"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import {
  useCreateAppointment,
  useTimeSlots,
} from "@/hooks/queries/useAppointment";
import {
  useDepartments,
  useEmployees,
  useDoctorSchedules,
} from "@/hooks/queries/useHr";
import {
  AppointmentCreateRequest,
  AppointmentType,
  TimeSlot,
} from "@/interfaces/appointment";
import { toast } from "sonner";
import { Department, Employee } from "@/interfaces/hr";
import { Loader2, User } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Spinner } from "@/components/ui/spinner";

type Step = 1 | 2 | 3;

function DoctorCard({
  doctor,
  isSelected,
  onSelect,
}: {
  doctor: Employee;
  isSelected: boolean;
  onSelect: (id: string) => void;
}) {
  return (
    <Card
      className={cn("cursor-pointer", {
        "border-primary ring-2 ring-primary": isSelected,
      })}
    >
      <CardHeader
        className="flex flex-row items-center gap-4"
        onClick={() => onSelect(doctor.id)}
      >
        <div className="p-3 bg-muted rounded-full">
          <User className="h-6 w-6 text-muted-foreground" />
        </div>
        <div>
          <CardTitle className="text-base">{doctor.fullName}</CardTitle>
          <p className="text-sm text-muted-foreground">
            {doctor.specialization}
          </p>
        </div>
      </CardHeader>
    </Card>
  );
}

export default function PatientBookingPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [patientId, setPatientId] = useState<string>(() => {
    const pid =
      typeof window !== "undefined" ? localStorage.getItem("patientId") : null;
    return pid || "p001";
  });

  // Step 1 state
  const [departmentId, setDepartmentId] = useState<string>("");
  const [doctorId, setDoctorId] = useState<string>("");

  // Step 2 state
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [slot, setSlot] = useState<string>("");
  const [displayMonth, setDisplayMonth] = useState(new Date());

  // Step 3 state
  const [reason, setReason] = useState<string>("");
  const [type, setType] = useState<AppointmentType>("CONSULTATION");
  const [isConfirming, setIsConfirming] = useState(false);

  const { data: departmentsData, isLoading: isLoadingDepartments } =
    useDepartments({});
  const departments = useMemo(
    () => departmentsData?.content || [],
    [departmentsData],
  );

  const { data: doctorsData, isLoading: isLoadingDoctors } = useEmployees({
    departmentId: departmentId === "all-departments" ? undefined : departmentId,
    role: "DOCTOR",
    size: 999,
  });
  const doctors = useMemo(() => doctorsData?.content || [], [doctorsData]);

  const isoDate = useMemo(
    () => (date ? date.toISOString().split("T")[0] : ""),
    [date],
  );
  const { data: slots, isLoading: isLoadingSlots } = useTimeSlots(
    doctorId,
    isoDate,
  );

  // For Calendar Highlighting
  const { data: monthlySchedule } = useDoctorSchedules({
    doctorId,
    startDate: new Date(displayMonth.getFullYear(), displayMonth.getMonth(), 1)
      .toISOString()
      .split("T")[0],
    endDate: new Date(
      displayMonth.getFullYear(),
      displayMonth.getMonth() + 1,
      0,
    )
      .toISOString()
      .split("T")[0],
    status: "AVAILABLE",
  });
  const availableDays = useMemo(() => {
    return (
      monthlySchedule?.content.map((schedule) => parseISO(schedule.workDate)) ||
      []
    );
  }, [monthlySchedule]);

  // Reset dependent state when selections change
  useEffect(() => {
    setDoctorId("");
  }, [departmentId]);
  useEffect(() => {
    setDate(undefined);
  }, [doctorId]);
  useEffect(() => {
    setSlot("");
  }, [date]);

  // Navigation enablement
  const canNextStep2 = !!doctorId;
  const canNextStep3 = !!date && !!slot;
  const canConfirm = !!reason;

  const createMutation = useCreateAppointment();
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
      router.push("/patient/appointments");
    } catch (e) {
      // onError in the hook handles toast
    } finally {
      setIsConfirming(false);
    }
  };

  const selectedDoctor = useMemo(
    () => doctors.find((d) => d.id === doctorId),
    [doctors, doctorId],
  );

  return (
    <div className="page-shell space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Đặt lịch khám</h1>
        <p className="text-muted-foreground">
          Quy trình 3 bước: Chọn bác sĩ → Chọn thời gian → Xác nhận
        </p>
      </div>

      <div className="flex gap-2 text-sm">
        <span
          className={cn(
            "p-2 rounded",
            step === 1 ? "font-semibold bg-muted" : "text-muted-foreground",
          )}
        >
          Bước 1: Chọn Bác sĩ
        </span>
        <span
          className={cn(
            "p-2 rounded",
            step === 2 ? "font-semibold bg-muted" : "text-muted-foreground",
          )}
        >
          Bước 2: Chọn Thời gian
        </span>
        <span
          className={cn(
            "p-2 rounded",
            step === 3 ? "font-semibold bg-muted" : "text-muted-foreground",
          )}
        >
          Bước 3: Xác nhận
        </span>
      </div>

      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Chọn bác sĩ</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Lọc theo chuyên khoa</Label>
              <Select
                value={departmentId}
                onValueChange={setDepartmentId}
                disabled={isLoadingDepartments}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tất cả chuyên khoa" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all-departments">
                    Tất cả chuyên khoa
                  </SelectItem>
                  {departments.map((dept: Department) => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-4">
              {isLoadingDoctors ? (
                <div className="flex items-center justify-center py-10">
                  <Spinner className="h-8 w-8" />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {doctors.map((doctor) => (
                    <DoctorCard
                      key={doctor.id}
                      doctor={doctor}
                      isSelected={doctorId === doctor.id}
                      onSelect={setDoctorId}
                    />
                  ))}
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2 pt-4 border-t">
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
            <CardTitle>Chọn ngày & giờ khám</CardTitle>
            <p className="text-muted-foreground">
              Chọn lịch cho bác sĩ: <strong>{selectedDoctor?.fullName}</strong>
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="flex justify-center">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  onMonthChange={setDisplayMonth}
                  initialFocus
                  disabled={(d) =>
                    d < new Date(new Date().setHours(0, 0, 0, 0))
                  }
                  modifiers={{ available: availableDays }}
                  modifiersClassNames={{
                    available: "bg-primary/20 rounded-full",
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label>
                  Giờ khám có sẵn (Ngày {date ? format(date, "dd/MM") : ""})
                </Label>
                {isLoadingSlots && (
                  <div className="flex items-center">
                    <Spinner className="h-4 w-4 mr-2" /> Đang
                    tải...
                  </div>
                )}
                {date && !isLoadingSlots && (
                  <div className="grid grid-cols-3 gap-2">
                    {(slots || []).map((t: TimeSlot) => (
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
                    {(slots || []).length === 0 && (
                      <p className="col-span-3 text-sm text-muted-foreground">
                        Không có lịch trống cho ngày này.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="flex justify-between pt-4 border-t">
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
            <CardTitle>Xác nhận thông tin</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 border rounded-lg bg-muted/50 text-sm space-y-2">
              <p>
                <strong>Bác sĩ:</strong> {selectedDoctor?.fullName}
              </p>
              <p>
                <strong>Chuyên khoa:</strong>{" "}
                {departments.find((d) => d.id === selectedDoctor?.departmentId)
                  ?.name || "N/A"}
              </p>
              <p>
                <strong>Thời gian:</strong> {slot} -{" "}
                {date ? format(date, "dd/MM/yyyy") : ""}
              </p>
            </div>
            <div className="space-y-2">
              <Label>Loại khám</Label>
              <Select
                value={type}
                onValueChange={(value) => setType(value as AppointmentType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CONSULTATION">Khám mới</SelectItem>
                  <SelectItem value="FOLLOW_UP">Tái khám</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Lý do khám (bắt buộc)</Label>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Mô tả ngắn gọn triệu chứng..."
              />
            </div>
            <div className="flex justify-between pt-4 border-t">
              <Button variant="outline" onClick={() => setStep(2)}>
                Quay lại
              </Button>
              <Button
                onClick={() => setIsConfirming(true)}
                disabled={!canConfirm || createMutation.isPending}
              >
                Xác nhận
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <AlertDialog open={isConfirming} onOpenChange={setIsConfirming}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận đặt lịch?</AlertDialogTitle>
            <AlertDialogDescription>
              Vui lòng kiểm tra lại thông tin trước khi xác nhận.
              <div className="p-4 border rounded-lg bg-muted/50 text-sm space-y-1 my-4">
                <p>
                  <strong>Bác sĩ:</strong> {selectedDoctor?.fullName}
                </p>
                <p>
                  <strong>Thời gian:</strong> {slot} -{" "}
                  {date ? format(date, "dd/MM/yyyy") : ""}
                </p>
                <p>
                  <strong>Lý do:</strong> {reason || "Chưa nhập"}
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={submitBooking}
              disabled={createMutation.isPending}
            >
              {createMutation.isPending && (
                <Spinner className="mr-2 h-4 w-4" />
              )}
              Xác nhận
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

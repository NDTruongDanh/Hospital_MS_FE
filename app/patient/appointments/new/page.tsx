"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { format, parseISO } from "date-fns";
import { vi } from "date-fns/locale";
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
import { useMyProfile } from "@/hooks/queries/usePatient";
import {
  AppointmentCreateRequest,
  AppointmentType,
  TimeSlot,
} from "@/interfaces/appointment";
import { toast } from "sonner";
import { Department, Employee } from "@/interfaces/hr";
import { 
  User, 
  CalendarDays, 
  Check, 
  Stethoscope, 
  Clock, 
  FileText,
  Sparkles,
  ChevronRight,
  Building2,
  CalendarCheck,
  Heart,
  Info,
  CheckCircle,
} from "lucide-react";
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

// Enhanced Step Indicator
function StepIndicator({ currentStep }: { currentStep: Step }) {
  const steps = [
    { step: 1, label: "Chọn Bác sĩ", icon: Stethoscope },
    { step: 2, label: "Chọn Thời gian", icon: Clock },
    { step: 3, label: "Xác nhận", icon: FileText },
  ];

  return (
    <div className="flex items-center justify-center gap-0 w-full max-w-2xl mx-auto">
      {steps.map((s, index) => {
        const Icon = s.icon;
        const isActive = currentStep === s.step;
        const isCompleted = currentStep > s.step;
        
        return (
          <div key={s.step} className="flex items-center flex-1">
            <div className="flex flex-col items-center gap-2 flex-1">
              <div
                className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-md",
                  isActive && "bg-gradient-to-r from-violet-500 to-purple-500 text-white scale-110",
                  isCompleted && "bg-emerald-500 text-white",
                  !isActive && !isCompleted && "bg-slate-200 text-slate-500"
                )}
              >
                {isCompleted ? <Check className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
              </div>
              <span
                className={cn(
                  "text-sm font-medium text-center",
                  isActive && "text-violet-600",
                  isCompleted && "text-emerald-600",
                  !isActive && !isCompleted && "text-slate-500"
                )}
              >
                {s.label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div className={cn(
                "h-1 flex-1 mx-2 rounded-full transition-colors",
                currentStep > s.step ? "bg-emerald-500" : "bg-slate-200"
              )} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// Enhanced Doctor Card
function DoctorCard({
  doctor,
  isSelected,
  onSelect,
}: {
  doctor: Employee;
  isSelected: boolean;
  onSelect: (id: string) => void;
}) {
  const isMale = (doctor as any).gender?.toUpperCase() !== "FEMALE";
  
  return (
    <Card
      className={cn(
        "cursor-pointer transition-all hover:shadow-md border-2",
        isSelected 
          ? "border-violet-500 shadow-lg bg-violet-50/50 scale-[1.02]" 
          : "border-slate-200 hover:border-violet-300"
      )}
      onClick={() => onSelect(doctor.id)}
    >
      <CardContent className="pt-5">
        <div className="flex items-center gap-4">
          <Avatar className={cn(
            "h-14 w-14 ring-2 ring-offset-2 shadow-sm",
            isSelected ? "ring-violet-500" : "ring-slate-200"
          )}>
            <AvatarImage src={(doctor as any).profileImageUrl} alt={doctor.fullName} />
            <AvatarFallback className={cn(
              "text-lg font-bold text-white",
              isMale 
                ? "bg-gradient-to-br from-sky-400 to-cyan-500" 
                : "bg-gradient-to-br from-pink-400 to-rose-500"
            )}>
              {doctor.fullName.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h3 className={cn(
              "font-semibold truncate",
              isSelected ? "text-violet-700" : "text-slate-800"
            )}>
              {doctor.fullName}
            </h3>
            <p className="text-sm text-slate-500 truncate">
              {doctor.specialization || "Đa khoa"}
            </p>
          </div>
          {isSelected && (
            <div className="p-1.5 rounded-full bg-violet-500 text-white">
              <Check className="h-4 w-4" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Enhanced Time Slot Button
function TimeSlotButton({
  slot,
  isSelected,
  onSelect,
}: {
  slot: TimeSlot;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      disabled={!slot.available}
      onClick={onSelect}
      className={cn(
        "p-3 rounded-xl border-2 font-medium transition-all text-center",
        slot.available && !isSelected && "border-slate-200 hover:border-violet-300 hover:bg-violet-50 text-slate-700",
        isSelected && "border-violet-500 bg-violet-500 text-white shadow-md scale-[1.02]",
        !slot.available && "border-slate-100 bg-slate-50 text-slate-400 cursor-not-allowed"
      )}
    >
      {slot.time}
    </button>
  );
}

export default function PatientBookingPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  
  // Get patient ID from profile API
  const { data: myProfile, isLoading: isLoadingProfile } = useMyProfile();
  const patientId = myProfile?.id || "";

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
    () => {
      if (!date) return "";
      // Use local date format to avoid timezone conversion issues
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    },
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
      monthlySchedule?.content.map((schedule: any) => parseISO(schedule.workDate)) ||
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
    // Construct Date object with selected date and time slot (local time)
    // Then convert to ISO string (UTC) for backend
    const appointmentDate = new Date(date!);
    const [hours, minutes] = slot.split(":").map(Number);
    appointmentDate.setHours(hours, minutes, 0, 0);
    const appointmentTimeISO = appointmentDate.toISOString();

    const payload: AppointmentCreateRequest = {
      patientId,
      doctorId,
      appointmentTime: appointmentTimeISO,
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
    () => doctors.find((d: Employee) => d.id === doctorId),
    [doctors, doctorId],
  );

  return (
    <div className="space-y-6">
      {/* Enhanced Gradient Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-violet-600 via-purple-500 to-fuchsia-500 p-6 text-white shadow-xl">
        {/* Background decorations */}
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
        <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-white/5" />
        <div className="absolute top-1/2 right-1/4 h-20 w-20 rounded-full bg-white/5" />

        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="rounded-xl bg-white/20 p-3 backdrop-blur-sm">
              <CalendarDays className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                Đặt lịch khám bệnh
                <Badge className="bg-white/20 text-white border-0 animate-pulse">
                  <Sparkles className="h-3 w-3 mr-1" />
                  Online
                </Badge>
              </h1>
              <p className="mt-1 text-purple-100">
                Đặt lịch hẹn nhanh chóng chỉ với 3 bước đơn giản
              </p>
            </div>
          </div>

          <div className="hidden lg:flex items-center gap-6 text-purple-100">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span className="text-sm">~2 phút</span>
            </div>
          </div>
        </div>
      </div>

      {/* Step Indicator */}
      <StepIndicator currentStep={step} />

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form Area */}
        <div className="lg:col-span-2">
          {/* Step 1: Select Doctor */}
          {step === 1 && (
            <Card className="border-2 border-slate-200 shadow-md rounded-xl overflow-hidden">
              <div className="border-b bg-gradient-to-r from-violet-50 to-purple-50 px-5 py-4">
                <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                  <Stethoscope className="h-5 w-5 text-violet-600" />
                  Bước 1: Chọn bác sĩ
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  Chọn bác sĩ phù hợp với nhu cầu khám của bạn
                </p>
              </div>
              <CardContent className="pt-5 space-y-5">
                {/* Department Filter */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-slate-700">
                    <Building2 className="h-4 w-4 text-slate-500" />
                    Lọc theo chuyên khoa
                  </Label>
                  <Select
                    value={departmentId}
                    onValueChange={setDepartmentId}
                    disabled={isLoadingDepartments}
                  >
                    <SelectTrigger className="border-2 h-11">
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

                {/* Doctor Grid */}
                <div className="space-y-3">
                  <Label className="text-slate-700">Danh sách bác sĩ</Label>
                  {isLoadingDoctors ? (
                    <div className="flex items-center justify-center py-16">
                      <Spinner className="h-8 w-8" />
                    </div>
                  ) : doctors.length === 0 ? (
                    <div className="text-center py-16 text-slate-500">
                      <User className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                      <p>Không tìm thấy bác sĩ</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {doctors.map((doctor: Employee) => (
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

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-5 border-t border-slate-200">
                  <Button 
                    onClick={() => setStep(2)} 
                    disabled={!canNextStep2}
                    className="px-6 bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600"
                  >
                    Tiếp tục
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Select Date & Time */}
          {step === 2 && (
            <Card className="border-2 border-slate-200 shadow-md rounded-xl overflow-hidden">
              <div className="border-b bg-gradient-to-r from-emerald-50 to-teal-50 px-5 py-4">
                <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                  <Clock className="h-5 w-5 text-emerald-600" />
                  Bước 2: Chọn thời gian
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  Bác sĩ: <strong className="text-emerald-600">{selectedDoctor?.fullName}</strong>
                </p>
              </div>
              <CardContent className="pt-5 space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Calendar */}
                  <div>
                    <Label className="mb-3 block text-slate-700">Chọn ngày khám</Label>
                    <div className="flex justify-center p-4 border-2 border-slate-200 rounded-xl bg-white">
                      <Calendar
                        mode="single"
                        selected={date}
                        onSelect={setDate}
                        onMonthChange={setDisplayMonth}
                        locale={vi}
                        initialFocus
                        disabled={(d) =>
                          d < new Date(new Date().setHours(0, 0, 0, 0))
                        }
                        modifiers={{ available: availableDays }}
                        modifiersClassNames={{
                          available: "bg-emerald-100 text-emerald-700 rounded-full font-semibold",
                        }}
                      />
                    </div>
                  </div>

                  {/* Time Slots */}
                  <div>
                    <Label className="mb-3 block text-slate-700">
                      Giờ khám có sẵn {date && (
                        <Badge variant="secondary" className="ml-2">
                          {format(date, "dd/MM/yyyy")}
                        </Badge>
                      )}
                    </Label>
                    {!date ? (
                      <div className="text-center py-12 text-slate-500 border-2 border-dashed border-slate-200 rounded-xl">
                        <CalendarDays className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                        <p>Vui lòng chọn ngày khám trước</p>
                      </div>
                    ) : isLoadingSlots ? (
                      <div className="flex items-center justify-center py-12">
                        <Spinner className="h-6 w-6 mr-2" />
                        <span className="text-slate-600">Đang tải...</span>
                      </div>
                    ) : (slots || []).length === 0 ? (
                      <div className="text-center py-12 text-slate-500 border-2 border-dashed border-slate-200 rounded-xl">
                        <Clock className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                        <p>Không có lịch trống cho ngày này</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-3 gap-3">
                        {(slots || []).map((t: TimeSlot) => (
                          <TimeSlotButton
                            key={t.time}
                            slot={t}
                            isSelected={slot === t.time}
                            onSelect={() => setSlot(t.time)}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-between pt-5 border-t border-slate-200">
                  <Button variant="outline" onClick={() => setStep(1)} className="px-6">
                    Quay lại
                  </Button>
                  <Button 
                    onClick={() => setStep(3)} 
                    disabled={!canNextStep3}
                    className="px-6 bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600"
                  >
                    Tiếp tục
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Confirm */}
          {step === 3 && (
            <Card className="border-2 border-slate-200 shadow-md rounded-xl overflow-hidden">
              <div className="border-b bg-gradient-to-r from-amber-50 to-orange-50 px-5 py-4">
                <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-amber-600" />
                  Bước 3: Xác nhận thông tin
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  Kiểm tra lại thông tin trước khi đặt lịch
                </p>
              </div>
              <CardContent className="pt-5 space-y-5">
                {/* Summary Card */}
                <div className="p-5 border-2 border-violet-200 rounded-xl bg-gradient-to-br from-violet-50 to-purple-50">
                  <h4 className="font-semibold text-violet-800 mb-3 flex items-center gap-2">
                    <CalendarCheck className="h-4 w-4" />
                    Thông tin lịch hẹn
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Stethoscope className="h-4 w-4 text-slate-400" />
                      <span className="text-slate-600">Bác sĩ:</span>
                      <span className="font-medium text-slate-800">{selectedDoctor?.fullName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-slate-400" />
                      <span className="text-slate-600">Chuyên khoa:</span>
                      <span className="font-medium text-slate-800">
                        {departments.find((d: Department) => d.id === selectedDoctor?.departmentId)?.name || "N/A"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CalendarDays className="h-4 w-4 text-slate-400" />
                      <span className="text-slate-600">Ngày khám:</span>
                      <span className="font-medium text-slate-800">
                        {date ? format(date, "EEEE, dd/MM/yyyy", { locale: vi }) : ""}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-slate-400" />
                      <span className="text-slate-600">Giờ khám:</span>
                      <Badge className="bg-violet-100 text-violet-700">{slot}</Badge>
                    </div>
                  </div>
                </div>

                {/* Appointment Type */}
                <div className="space-y-2">
                  <Label className="text-slate-700">Loại khám</Label>
                  <Select
                    value={type}
                    onValueChange={(value) => setType(value as AppointmentType)}
                  >
                    <SelectTrigger className="border-2 h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CONSULTATION">Khám mới</SelectItem>
                      <SelectItem value="FOLLOW_UP">Tái khám</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Reason */}
                <div className="space-y-2">
                  <Label className="text-slate-700">
                    Lý do khám <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Mô tả ngắn gọn triệu chứng hoặc lý do khám bệnh..."
                    className="min-h-[100px] border-2"
                  />
                </div>

                {/* Actions */}
                <div className="flex justify-between pt-5 border-t border-slate-200">
                  <Button variant="outline" onClick={() => setStep(2)} className="px-6">
                    Quay lại
                  </Button>
                  <Button
                    onClick={() => setIsConfirming(true)}
                    disabled={!canConfirm || createMutation.isPending}
                    className="px-6 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
                  >
                    {createMutation.isPending && <Spinner className="mr-2 h-4 w-4" />}
                    Xác nhận đặt lịch
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar - Tips */}
        <div className="space-y-4">
          {/* Info Card */}
          <Card className="border-2 border-violet-200 bg-gradient-to-br from-violet-50 to-white shadow-sm">
            <CardContent className="pt-5">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-violet-100">
                  <Info className="h-4 w-4 text-violet-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800 mb-2">Hướng dẫn đặt lịch</h3>
                  <ul className="space-y-2 text-sm text-slate-600">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                      Chọn bác sĩ phù hợp
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                      Chọn ngày và giờ khám
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                      Mô tả lý do khám
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tip Card */}
          <Card className="border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-white shadow-sm">
            <CardContent className="pt-5">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-emerald-100">
                  <Heart className="h-4 w-4 text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800 mb-2">Mẹo hữu ích</h3>
                  <p className="text-sm text-slate-600">
                    Ngày có lịch trông sẽ được đánh dấu màu xanh trên lịch. Hãy chọn ngày và giờ phù hợp nhất với bạn.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Card */}
          <Card className="border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-white shadow-sm">
            <CardContent className="pt-5">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-amber-100">
                  <Stethoscope className="h-4 w-4 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800 mb-2">Cần hỗ trợ?</h3>
                  <p className="text-sm text-slate-600">
                    Gọi hotline: <strong>1900 xxxx</strong> để được hỗ trợ đặt lịch.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Confirm Dialog */}
      <AlertDialog open={isConfirming} onOpenChange={setIsConfirming}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <CalendarCheck className="h-5 w-5 text-violet-600" />
              Xác nhận đặt lịch?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Vui lòng kiểm tra lại thông tin trước khi xác nhận.
            </AlertDialogDescription>
            <div className="p-4 border-2 border-violet-200 rounded-xl bg-violet-50 text-sm space-y-2 my-4">
              <div className="flex items-center gap-2">
                <Stethoscope className="h-4 w-4 text-violet-500" />
                <span className="text-slate-600">Bác sĩ:</span>
                <span className="font-medium">{selectedDoctor?.fullName}</span>
              </div>
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-violet-500" />
                <span className="text-slate-600">Thời gian:</span>
                <span className="font-medium">
                  {slot} - {date ? format(date, "dd/MM/yyyy") : ""}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-violet-500" />
                <span className="text-slate-600">Lý do:</span>
                <span className="font-medium">{reason || "Chưa nhập"}</span>
              </div>
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={submitBooking}
              disabled={createMutation.isPending}
              className="bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600"
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

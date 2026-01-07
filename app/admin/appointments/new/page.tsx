"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { 
  ArrowLeft, 
  CalendarDays, 
  User, 
  Stethoscope, 
  Clock, 
  FileText,
  Sparkles,
  Info,
  CheckCircle,
  AlertTriangle,
  Heart,
  CalendarCheck,
} from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { cn } from "@/lib/utils";

import { useCreateAppointment } from "@/hooks/queries/useAppointment";
import { PatientSearchSelect } from "@/components/appointment/PatientSearchSelect";
import { DoctorSearchSelect } from "@/components/appointment/DoctorSearchSelect";
import { DepartmentSelect } from "@/components/hr/DepartmentSelect";
import { TimeSlotPicker } from "@/components/appointment/TimeSlotPicker";
import { Spinner } from "@/components/ui/spinner";

// Form schema
const appointmentFormSchema = z.object({
  patientId: z.string().min(1, "Vui lòng chọn bệnh nhân"),
  doctorId: z.string().min(1, "Vui lòng chọn bác sĩ"),
  appointmentDate: z.date({ message: "Vui lòng chọn ngày" }),
  appointmentTime: z.string().min(1, "Vui lòng chọn khung giờ"),
  type: z.enum(["CONSULTATION", "FOLLOW_UP", "EMERGENCY"], {
    message: "Vui lòng chọn loại lịch hẹn",
  }),
  reason: z
    .string()
    .min(1, "Vui lòng nhập lý do khám")
    .max(500, "Lý do không được vượt quá 500 ký tự"),
  notes: z.string().max(1000, "Ghi chú không được vượt quá 1000 ký tự").optional(),
});

type FormValues = z.infer<typeof appointmentFormSchema>;

// Appointment type options with colors
const appointmentTypes = [
  { value: "CONSULTATION", label: "Khám mới", icon: Stethoscope, color: "bg-sky-100 text-sky-700 border-sky-200" },
  { value: "FOLLOW_UP", label: "Tái khám", icon: CalendarCheck, color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  { value: "EMERGENCY", label: "Cấp cứu", icon: AlertTriangle, color: "bg-red-100 text-red-700 border-red-200" },
];

export default function NewAppointmentPage() {
  const router = useRouter();
  const createMutation = useCreateAppointment();
  const [departmentId, setDepartmentId] = useState<string | undefined>();

  const form = useForm<FormValues>({
    resolver: zodResolver(appointmentFormSchema) as any,
    defaultValues: {
      patientId: "",
      doctorId: "",
      appointmentTime: "",
      type: "CONSULTATION",
      reason: "",
      notes: "",
    },
  });

  const watchedDoctorId = form.watch("doctorId");
  const watchedDate = form.watch("appointmentDate");
  const watchedType = form.watch("type");

  // Reset doctor and time slot when department changes
  useEffect(() => {
    form.setValue("doctorId", "");
    form.setValue("appointmentTime", "");
  }, [departmentId, form]);

  // Reset time slot when date or doctor changes
  useEffect(() => {
    form.setValue("appointmentTime", "");
  }, [watchedDoctorId, watchedDate, form]);

  const onSubmit = async (data: FormValues) => {
    // Construct Date object to get ISO string (UTC) for backend Instant
    const [hours, minutes] = data.appointmentTime.split(":").map(Number);
    const date = new Date(data.appointmentDate);
    date.setHours(hours, minutes, 0, 0);
    const appointmentTime = date.toISOString();

    createMutation.mutate(
      {
        patientId: data.patientId,
        doctorId: data.doctorId,
        appointmentTime,
        type: data.type,
        reason: data.reason,
        notes: data.notes,
      },
      {
        onSuccess: () => {
          router.push("/admin/appointments");
        },
      }
    );
  };

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
            <Button 
              variant="ghost" 
              size="icon" 
              asChild
              className="text-white hover:bg-white/10 rounded-xl"
            >
              <Link href="/admin/appointments">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div className="rounded-xl bg-white/20 p-3 backdrop-blur-sm">
              <CalendarDays className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                Đặt lịch hẹn mới
                <Badge className="bg-white/20 text-white border-0 animate-pulse">
                  <Sparkles className="h-3 w-3 mr-1" />
                  Mới
                </Badge>
              </h1>
              <p className="mt-1 text-purple-100">
                Lên lịch khám bệnh cho bệnh nhân
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

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form - Main content */}
        <div className="lg:col-span-2">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Patient Selection */}
              <Card className="border-2 border-slate-200 shadow-sm overflow-hidden">
                <div className="border-b bg-gradient-to-r from-sky-50 to-cyan-50 px-5 py-3">
                  <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                    <User className="h-4 w-4 text-sky-600" />
                    Thông tin bệnh nhân
                  </h3>
                </div>
                <CardContent className="pt-5">
                  <FormField
                    control={form.control}
                    name="patientId"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel className="text-slate-700">
                          Bệnh nhân <span className="text-red-500">*</span>
                        </FormLabel>
                        <PatientSearchSelect
                          value={field.value}
                          onChange={field.onChange}
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Doctor Selection */}
              <Card className="border-2 border-slate-200 shadow-sm overflow-hidden">
                <div className="border-b bg-gradient-to-r from-violet-50 to-purple-50 px-5 py-3">
                  <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                    <Stethoscope className="h-4 w-4 text-violet-600" />
                    Lựa chọn bác sĩ
                  </h3>
                </div>
                <CardContent className="pt-5 space-y-4">
                  <FormItem>
                    <FormLabel className="text-slate-700">Khoa</FormLabel>
                    <DepartmentSelect
                      value={departmentId}
                      onChange={setDepartmentId}
                    />
                  </FormItem>
                  <FormField
                    control={form.control}
                    name="doctorId"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel className="text-slate-700">
                          Bác sĩ <span className="text-red-500">*</span>
                        </FormLabel>
                        <DoctorSearchSelect
                          value={field.value}
                          onChange={field.onChange}
                          departmentId={
                            departmentId === "ALL" ? undefined : departmentId
                          }
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Schedule Selection */}
              <Card className="border-2 border-slate-200 shadow-sm overflow-hidden">
                <div className="border-b bg-gradient-to-r from-emerald-50 to-teal-50 px-5 py-3">
                  <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                    <Clock className="h-4 w-4 text-emerald-600" />
                    Chọn thời gian
                  </h3>
                </div>
                <CardContent className="pt-5 space-y-6">
                  {/* Date picker */}
                  <FormField
                    control={form.control}
                    name="appointmentDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel className="text-slate-700">
                          Ngày khám <span className="text-red-500">*</span>
                        </FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full justify-start text-left font-normal border-2 hover:border-slate-300 h-11",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                <CalendarDays className="mr-2 h-4 w-4 text-slate-500" />
                                {field.value
                                  ? format(field.value, "EEEE, dd MMMM yyyy", { locale: vi })
                                  : "Chọn ngày khám"}
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) => {
                                const today = new Date();
                                today.setHours(0, 0, 0, 0);
                                return date < today;
                              }}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Time slots */}
                  <FormField
                    control={form.control}
                    name="appointmentTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-700">
                          Khung giờ <span className="text-red-500">*</span>
                        </FormLabel>
                        <TimeSlotPicker
                          doctorId={watchedDoctorId}
                          date={
                            watchedDate ? format(watchedDate, "yyyy-MM-dd") : ""
                          }
                          selectedSlot={field.value}
                          onSelect={field.onChange}
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Appointment Details */}
              <Card className="border-2 border-slate-200 shadow-sm overflow-hidden">
                <div className="border-b bg-gradient-to-r from-amber-50 to-orange-50 px-5 py-3">
                  <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-amber-600" />
                    Chi tiết lịch hẹn
                  </h3>
                </div>
                <CardContent className="pt-5 space-y-6">
                  {/* Type - Enhanced Radio buttons */}
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-700">
                          Loại lịch hẹn <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <div className="grid grid-cols-3 gap-3">
                            {appointmentTypes.map((type) => {
                              const Icon = type.icon;
                              const isSelected = field.value === type.value;
                              return (
                                <button
                                  key={type.value}
                                  type="button"
                                  onClick={() => field.onChange(type.value)}
                                  className={cn(
                                    "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
                                    isSelected 
                                      ? `${type.color} border-current shadow-md scale-[1.02]` 
                                      : "border-slate-200 hover:border-slate-300 bg-white"
                                  )}
                                >
                                  <Icon className={cn(
                                    "h-6 w-6",
                                    isSelected ? "" : "text-slate-400"
                                  )} />
                                  <span className={cn(
                                    "text-sm font-medium",
                                    isSelected ? "" : "text-slate-600"
                                  )}>
                                    {type.label}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Reason */}
                  <FormField
                    control={form.control}
                    name="reason"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-700">
                          Lý do khám <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Mô tả triệu chứng hoặc lý do khám bệnh..."
                            className="min-h-[100px] resize-none border-2"
                            maxLength={500}
                            {...field}
                          />
                        </FormControl>
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <FormMessage />
                          <span>{field.value?.length || 0}/500</span>
                        </div>
                      </FormItem>
                    )}
                  />

                  {/* Notes */}
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-700">
                          Ghi chú (Chỉ nhân viên xem)
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Ghi chú bổ sung về lịch hẹn..."
                            className="min-h-[100px] resize-none border-2"
                            maxLength={1000}
                            {...field}
                          />
                        </FormControl>
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <FormMessage />
                          <span>{field.value?.length || 0}/1000</span>
                        </div>
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <Button type="button" variant="outline" asChild className="px-6">
                  <Link href="/admin/appointments">Hủy</Link>
                </Button>
                <Button 
                  type="submit" 
                  disabled={createMutation.isPending}
                  className="px-6 bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 text-white border-0"
                >
                  {createMutation.isPending && (
                    <Spinner size="sm" className="mr-2" />
                  )}
                  Đặt lịch hẹn
                </Button>
              </div>
            </form>
          </Form>
        </div>

        {/* Sidebar - Tips and Info */}
        <div className="space-y-4">
          {/* Required Fields Card */}
          <Card className="border-2 border-violet-200 bg-gradient-to-br from-violet-50 to-white shadow-sm">
            <CardContent className="pt-5">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-violet-100">
                  <Info className="h-4 w-4 text-violet-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800 mb-2">Thông tin cần thiết</h3>
                  <ul className="space-y-2 text-sm text-slate-600">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-emerald-500" />
                      Bệnh nhân
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-emerald-500" />
                      Bác sĩ
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-emerald-500" />
                      Ngày và giờ khám
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-emerald-500" />
                      Lý do khám
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Appointment Types Card */}
          <Card className="border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-white shadow-sm">
            <CardContent className="pt-5">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-amber-100">
                  <CalendarCheck className="h-4 w-4 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800 mb-2">Loại lịch hẹn</h3>
                  <ul className="space-y-2 text-sm text-slate-600">
                    <li><strong>Khám mới:</strong> Lần khám đầu tiên</li>
                    <li><strong>Tái khám:</strong> Khám theo dõi sau điều trị</li>
                    <li><strong>Cấp cứu:</strong> Trường hợp khẩn cấp</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tips Card */}
          <Card className="border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-white shadow-sm">
            <CardContent className="pt-5">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-emerald-100">
                  <Heart className="h-4 w-4 text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800 mb-2">Mẹo hữu ích</h3>
                  <p className="text-sm text-slate-600">
                    Mô tả chi tiết triệu chứng giúp bác sĩ chuẩn bị tốt hơn cho buổi khám.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

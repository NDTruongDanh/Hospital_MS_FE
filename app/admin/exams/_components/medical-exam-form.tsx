"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  MedicalExamFormValues,
  medicalExamSchema,
} from "@/lib/schemas/medical-exam";
import { UserRole } from "@/contexts/AuthContext";
import { Appointment } from "@/interfaces/appointment";
import { ExamStatus } from "@/interfaces/medical-exam";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AppointmentSearchSelect } from "@/components/appointment/AppointmentSearchSelect";
import {
  User,
  Briefcase,
  CalendarClock,
  HeartPulse,
  Stethoscope,
  FileText,
  CalendarPlus,
  Thermometer,
  Heart,
  Activity,
  Scale,
  Ruler,
  AlertTriangle,
  Phone,
  Clock,
  Save,
  CheckCircle,
} from "lucide-react";

// Generate consistent color for avatar
function getAvatarColor(name: string): string {
  const colors = [
    "from-cyan-400 to-teal-500",
    "from-blue-400 to-indigo-500",
    "from-purple-400 to-pink-500",
    "from-rose-400 to-red-500",
    "from-orange-400 to-amber-500",
    "from-emerald-400 to-green-500",
  ];
  const index = name.charCodeAt(0) % colors.length;
  return colors[index];
}

interface MedicalExamFormProps {
  appointment?: Appointment | null;
  defaultValues?: Partial<MedicalExamFormValues>;
  onSubmit: (data: MedicalExamFormValues) => void;
  isSubmitting?: boolean;
  onSubmitWithStatus?: (
    data: MedicalExamFormValues,
    status: "PENDING" | "FINALIZED"
  ) => void;
  userRole?: UserRole;
  currentExamStatus?: ExamStatus;
  defaultAppointmentId?: string;
  isEditMode?: boolean;
}

export function MedicalExamForm({
  appointment,
  defaultValues,
  onSubmit,
  isSubmitting,
  onSubmitWithStatus,
  userRole,
  currentExamStatus,
  defaultAppointmentId,
  isEditMode = false,
}: MedicalExamFormProps) {
  const [selectedAppointment, setSelectedAppointment] =
    useState<Appointment | null>(appointment || null);

  const form = useForm<MedicalExamFormValues>({
    resolver: zodResolver(medicalExamSchema) as any,
    defaultValues: defaultValues || {
      appointmentId: appointment?.id || defaultAppointmentId || "",
      temperature: 37,
      bloodPressureSystolic: 120,
      bloodPressureDiastolic: 80,
      heartRate: 75,
      weight: 70,
      height: 170,
      diagnosis: "",
      symptoms: "",
      treatment: "",
      notes: "",
    },
  });

  useEffect(() => {
    if (appointment) {
      form.setValue("appointmentId", appointment.id);
      setSelectedAppointment(appointment);
    }
  }, [appointment, form]);

  // Reset form when defaultValues change (for loading nurse's vital signs when editing)
  useEffect(() => {
    if (defaultValues) {
      form.reset(defaultValues);
    }
  }, [defaultValues, form]);

  const handleAppointmentSelect = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    form.setValue("appointmentId", appointment.id, { shouldValidate: true });
  };

  const canFinalize =
    (userRole === "ADMIN" || userRole === "DOCTOR") &&
    currentExamStatus !== "FINALIZED";

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Patient Info Section - Enhanced */}
        {!isEditMode && (
          selectedAppointment ? (
            <Card className="overflow-hidden border-0 shadow-lg">
              {/* Gradient bar */}
              <div className="h-1.5 bg-gradient-to-r from-teal-400 via-cyan-500 to-blue-500" />
              <CardContent className="p-5">
                <div className="flex flex-col lg:flex-row lg:items-center gap-5">
                  {/* Patient Info */}
                  <div className="flex items-center gap-4 flex-1">
                    {/* Avatar */}
                    <div
                      className={`h-16 w-16 rounded-full bg-gradient-to-br ${getAvatarColor(
                        selectedAppointment.patient.fullName
                      )} flex items-center justify-center text-white font-bold text-2xl shadow-lg flex-shrink-0`}
                    >
                      {selectedAppointment.patient.fullName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-900">
                        {selectedAppointment.patient.fullName}
                      </h3>
                      <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-slate-600">
                        <span className="flex items-center gap-1">
                          <Phone className="h-3.5 w-3.5 text-slate-400" />
                          {selectedAppointment.patient.phoneNumber || "Chưa có SĐT"}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5 text-slate-400" />
                          {new Date(selectedAppointment.appointmentTime).toLocaleString("vi-VN")}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Doctor & Appointment Info */}
                  <div className="flex flex-wrap gap-3">
                    <Badge variant="outline" className="bg-violet-50 text-violet-700 border-violet-200 px-3 py-1.5">
                      <Stethoscope className="h-3.5 w-3.5 mr-1.5" />
                      {selectedAppointment.doctor.fullName}
                    </Badge>
                    <Badge variant="outline" className="bg-cyan-50 text-cyan-700 border-cyan-200 px-3 py-1.5">
                      <CalendarClock className="h-3.5 w-3.5 mr-1.5" />
                      {selectedAppointment.type}
                    </Badge>
                    {selectedAppointment.reason && (
                      <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 px-3 py-1.5">
                        <AlertTriangle className="h-3.5 w-3.5 mr-1.5" />
                        {selectedAppointment.reason}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-dashed border-2 border-slate-300 bg-slate-50/50">
              <CardContent className="p-6">
                <FormField
                  control={form.control}
                  name="appointmentId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-semibold flex items-center gap-2">
                        <CalendarClock className="h-5 w-5 text-cyan-500" />
                        Tìm kiếm cuộc hẹn
                      </FormLabel>
                      <FormControl>
                        <AppointmentSearchSelect
                          onSelect={handleAppointmentSelect}
                          mode="completedWithoutExam"
                        />
                      </FormControl>
                      <p className="text-sm text-muted-foreground mt-2">
                        Tìm kiếm theo tên bệnh nhân hoặc mã cuộc hẹn
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          )
        )}

        {/* Vitals Section - Enhanced */}
        <Card className="overflow-hidden shadow-sm">
          <div className="bg-gradient-to-r from-rose-500 to-pink-500 px-5 py-3">
            <h3 className="text-white font-semibold flex items-center gap-2">
              <HeartPulse className="h-5 w-5" />
              Chỉ số sinh tồn
            </h3>
          </div>
          <CardContent className="p-5">
            <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
              <FormField
                control={form.control}
                name="temperature"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
                      <Thermometer className="h-4 w-4 text-red-500" />
                      Nhiệt độ
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type="number"
                          step="0.1"
                          className="pr-8"
                          {...field}
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                          °C
                        </span>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="bloodPressureSystolic"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
                      <Activity className="h-4 w-4 text-indigo-500" />
                      HA Tâm thu
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input type="number" className="pr-12" {...field} />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                          mmHg
                        </span>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="bloodPressureDiastolic"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
                      <Activity className="h-4 w-4 text-indigo-500" />
                      HA Tâm trương
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input type="number" className="pr-12" {...field} />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                          mmHg
                        </span>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="heartRate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
                      <Heart className="h-4 w-4 text-pink-500" />
                      Nhịp tim
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input type="number" className="pr-10" {...field} />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                          bpm
                        </span>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="weight"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
                      <Scale className="h-4 w-4 text-amber-500" />
                      Cân nặng
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type="number"
                          step="0.1"
                          className="pr-8"
                          {...field}
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                          kg
                        </span>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="height"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
                      <Ruler className="h-4 w-4 text-emerald-500" />
                      Chiều cao
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input type="number" className="pr-8" {...field} />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                          cm
                        </span>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Clinical Findings Section - Enhanced */}
        <Card className="overflow-hidden shadow-sm">
          <div className="bg-gradient-to-r from-violet-500 to-purple-500 px-5 py-3">
            <h3 className="text-white font-semibold flex items-center gap-2">
              <Stethoscope className="h-5 w-5" />
              Kết quả lâm sàng
            </h3>
          </div>
          <CardContent className="p-5 space-y-5">
            <FormField
              control={form.control}
              name="symptoms"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-slate-700">
                    Triệu chứng
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Mô tả các triệu chứng của bệnh nhân..."
                      className="min-h-[100px] resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="diagnosis"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-slate-700">
                    Chẩn đoán
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Nhập chẩn đoán..."
                      className="min-h-[100px] resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="treatment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-slate-700">
                    Phương pháp điều trị
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Mô tả phương pháp điều trị..."
                      className="min-h-[100px] resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Additional Notes Section */}
        <Card className="overflow-hidden shadow-sm">
          <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-5 py-3">
            <h3 className="text-white font-semibold flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Ghi chú bổ sung
            </h3>
          </div>
          <CardContent className="p-5">
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-slate-700">
                    Ghi chú (Tùy chọn)
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Các ghi chú bổ sung..."
                      className="min-h-[80px] resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Follow-up Section */}
        <Card className="overflow-hidden shadow-sm">
          <div className="bg-gradient-to-r from-emerald-500 to-teal-500 px-5 py-3">
            <h3 className="text-white font-semibold flex items-center gap-2">
              <CalendarPlus className="h-5 w-5" />
              Hẹn tái khám
            </h3>
          </div>
          <CardContent className="p-5">
            <FormField
              control={form.control}
              name="followUpDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-slate-700">
                    Ngày tái khám (Tùy chọn)
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      className="max-w-xs"
                      min={new Date().toISOString().split("T")[0]}
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <p className="text-sm text-muted-foreground mt-2">
                    Nếu chọn, bệnh nhân sẽ nhận email nhắc nhở vào ngày này.
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Action Buttons - Enhanced */}
        {onSubmitWithStatus ? (
          <div className="sticky bottom-0 bg-white/95 backdrop-blur-sm border-t border-slate-200 -mx-6 px-6 py-4 -mb-6 flex flex-wrap gap-3 justify-end shadow-lg">
            {(userRole === "ADMIN" ||
              userRole === "DOCTOR" ||
              userRole === "NURSE") && (
              <Button
                type="button"
                variant="outline"
                disabled={isSubmitting}
                className="px-6 gap-2"
                onClick={() =>
                  form.handleSubmit((values) =>
                    onSubmitWithStatus(values, "PENDING")
                  )()
                }
              >
                <Save className="h-4 w-4" />
                {isSubmitting ? "Đang lưu..." : "Lưu nháp"}
              </Button>
            )}
            {(userRole === "ADMIN" || userRole === "DOCTOR") && (
              <Button
                type="button"
                disabled={isSubmitting || !canFinalize}
                className="px-6 bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 text-white border-0 gap-2"
                onClick={() =>
                  form.handleSubmit((values) =>
                    onSubmitWithStatus(values, "FINALIZED")
                  )()
                }
              >
                <CheckCircle className="h-4 w-4" />
                {isSubmitting ? "Đang hoàn thành..." : "Lưu & Hoàn thành"}
              </Button>
            )}
          </div>
        ) : (
          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="px-8 bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 text-white border-0 gap-2"
            >
              <Save className="h-4 w-4" />
              {isSubmitting ? "Đang lưu..." : "Lưu phiếu khám"}
            </Button>
          </div>
        )}
      </form>
    </Form>
  );
}

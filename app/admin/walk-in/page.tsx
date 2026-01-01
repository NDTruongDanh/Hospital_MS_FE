"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  UserPlus,
  Search,
  Stethoscope,
  User,
  Clock,
  AlertTriangle,
  CheckCircle,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { usePatients } from "@/hooks/queries/usePatient";
import { useEmployees } from "@/hooks/queries/useHr";
import { useRegisterWalkIn, PriorityReason } from "@/hooks/queries/useQueue";
import { toast } from "sonner";

const priorityReasons = [
  { value: "", label: "Bình thường (không ưu tiên)" },
  { value: "ELDERLY", label: "Người cao tuổi (trên 60)" },
  { value: "PREGNANT", label: "Phụ nữ mang thai" },
  { value: "DISABILITY", label: "Người khuyết tật" },
  { value: "CHILD", label: "Trẻ em dưới 6 tuổi" },
];

export default function WalkInRegistrationPage() {
  const router = useRouter();
  const [patientSearch, setPatientSearch] = useState("");
  const [selectedPatientId, setSelectedPatientId] = useState<string>("");
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>("");
  const [reason, setReason] = useState("");
  const [priorityReason, setPriorityReason] = useState("");

  // Fetch patients
  const { data: patientsData, isLoading: isLoadingPatients } = usePatients({
    search: patientSearch,
    size: 10,
  });
  const patients = patientsData?.content || [];

  // Fetch doctors
  const { data: doctorsData, isLoading: isLoadingDoctors } = useEmployees({
    role: "DOCTOR",
    status: "ACTIVE",
  });
  const doctors = (doctorsData?.content || []) as Array<{
    id: string;
    fullName: string;
    departmentName?: string;
  }>;

  // Register mutation
  const registerMutation = useRegisterWalkIn();

  const selectedPatient = patients.find((p) => p.id === selectedPatientId);
  const selectedDoctor = doctors.find((d) => d.id === selectedDoctorId);

  const handleSubmit = async () => {
    if (!selectedPatientId) {
      toast.error("Vui lòng chọn bệnh nhân");
      return;
    }
    if (!selectedDoctorId) {
      toast.error("Vui lòng chọn bác sĩ");
      return;
    }

    try {
      const result = await registerMutation.mutateAsync({
        patientId: selectedPatientId,
        doctorId: selectedDoctorId,
        reason: reason || undefined,
        priorityReason: (priorityReason as PriorityReason) || undefined,
      });

      toast.success(
        `Đăng ký thành công! Số thứ tự: ${result.queueNumber}`,
        {
          description: `Bệnh nhân: ${selectedPatient?.fullName || result.patientName || "N/A"}`,
          duration: 5000,
        }
      );

      // Reset form
      setSelectedPatientId("");
      setSelectedDoctorId("");
      setReason("");
      setPriorityReason("");
      setPatientSearch("");

    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Không thể đăng ký. Vui lòng thử lại."
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="page-header">
        <h1>
          <UserPlus className="h-6 w-6 text-sky-500" />
          Tiếp nhận Bệnh nhân (Walk-in)
        </h1>
        <p>Đăng ký bệnh nhân vào hàng đợi khám bệnh</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left: Form */}
        <div className="space-y-6">
          {/* Patient Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-sky-500" />
                1. Chọn Bệnh nhân
              </CardTitle>
              <CardDescription>Tìm kiếm và chọn bệnh nhân đã có trong hệ thống</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm theo tên, số điện thoại, CCCD..."
                  value={patientSearch}
                  onChange={(e) => setPatientSearch(e.target.value)}
                  className="pl-9"
                />
              </div>

              {isLoadingPatients ? (
                <div className="flex items-center gap-2 text-muted-foreground p-4">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Đang tìm kiếm...
                </div>
              ) : patients.length > 0 ? (
                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                  {patients.map((patient) => (
                    <div
                      key={patient.id}
                      onClick={() => setSelectedPatientId(patient.id)}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedPatientId === patient.id
                          ? "bg-sky-50 border-sky-300"
                          : "hover:bg-muted/50"
                      }`}
                    >
                      <div className="h-10 w-10 rounded-full bg-sky-100 flex items-center justify-center text-sky-600 font-medium">
                        {patient.fullName?.charAt(0) || "?"}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{patient.fullName}</p>
                        <p className="text-sm text-muted-foreground">
                          {patient.phoneNumber || patient.email}
                        </p>

                      </div>
                      {selectedPatientId === patient.id && (
                        <CheckCircle className="h-5 w-5 text-sky-500" />
                      )}
                    </div>
                  ))}
                </div>
              ) : patientSearch ? (
                <div className="text-center py-4 text-muted-foreground">
                  <p>Không tìm thấy bệnh nhân</p>
                  <Button variant="link" className="text-sky-500" onClick={() => router.push("/admin/patients/new")}>
                    + Thêm bệnh nhân mới
                  </Button>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nhập từ khóa để tìm kiếm bệnh nhân
                </p>
              )}
            </CardContent>
          </Card>

          {/* Doctor Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Stethoscope className="h-5 w-5 text-violet-500" />
                2. Chọn Bác sĩ
              </CardTitle>
              <CardDescription>Chọn bác sĩ tiếp nhận khám</CardDescription>
            </CardHeader>
            <CardContent>
              <Select value={selectedDoctorId} onValueChange={setSelectedDoctorId}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn bác sĩ..." />
                </SelectTrigger>
                <SelectContent>
                  {doctors.map((doctor) => (
                    <SelectItem key={doctor.id} value={doctor.id}>
                      <div className="flex items-center gap-2">
                        <span>{doctor.fullName}</span>
                        {doctor.departmentName && (
                          <span className="text-muted-foreground">
                            - {doctor.departmentName}
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Reason & Priority */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-amber-500" />
                3. Thông tin bổ sung
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Lý do khám</Label>
                <Textarea
                  placeholder="Nhập triệu chứng hoặc lý do khám bệnh..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={2}
                />
              </div>

              <div className="space-y-3">
                <Label>Mức ưu tiên</Label>
                <RadioGroup value={priorityReason} onValueChange={setPriorityReason}>
                  {priorityReasons.map((option) => (
                    <div key={option.value} className="flex items-center space-x-2">
                      <RadioGroupItem value={option.value} id={option.value || "normal"} />
                      <Label htmlFor={option.value || "normal"} className="font-normal cursor-pointer">
                        {option.label}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Summary & Submit */}
        <div>
          <Card className="sticky top-6">
            <CardHeader className="bg-gradient-to-r from-sky-500 to-cyan-500 text-white rounded-t-lg">
              <CardTitle>Xác nhận đăng ký</CardTitle>
              <CardDescription className="text-white/80">
                Kiểm tra thông tin trước khi đăng ký
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {/* Patient Summary */}
              <div className="space-y-2">
                <Label className="text-muted-foreground">Bệnh nhân</Label>
                {selectedPatient ? (
                  <div className="flex items-center gap-3 p-3 bg-sky-50 rounded-lg">
                    <div className="h-12 w-12 rounded-full bg-sky-100 flex items-center justify-center text-sky-600 font-bold text-lg">
                      {selectedPatient.fullName?.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium">{selectedPatient.fullName}</p>
                      <p className="text-sm text-muted-foreground">
                        {selectedPatient.phoneNumber}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground italic">Chưa chọn bệnh nhân</p>
                )}
              </div>

              {/* Doctor Summary */}
              <div className="space-y-2">
                <Label className="text-muted-foreground">Bác sĩ khám</Label>
                {selectedDoctor ? (
                  <div className="flex items-center gap-3 p-3 bg-violet-50 rounded-lg">
                    <div className="h-12 w-12 rounded-full bg-violet-100 flex items-center justify-center text-violet-600 font-bold text-lg">
                      <Stethoscope className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium">{selectedDoctor.fullName}</p>
                      {selectedDoctor.departmentName && (
                        <p className="text-sm text-muted-foreground">
                          {selectedDoctor.departmentName}
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground italic">Chưa chọn bác sĩ</p>
                )}
              </div>

              {/* Priority */}
              {priorityReason && (
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Ưu tiên</Label>
                  <Badge className="bg-amber-100 text-amber-800">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    {priorityReasons.find((p) => p.value === priorityReason)?.label}
                  </Badge>
                </div>
              )}

              {/* Reason */}
              {reason && (
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Lý do khám</Label>
                  <p className="text-sm bg-muted p-2 rounded">{reason}</p>
                </div>
              )}

              <Button
                className="w-full mt-4"
                size="lg"
                onClick={handleSubmit}
                disabled={!selectedPatientId || !selectedDoctorId || registerMutation.isPending}
              >
                {registerMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    <UserPlus className="mr-2 h-5 w-5" />
                    Đăng ký vào hàng đợi
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

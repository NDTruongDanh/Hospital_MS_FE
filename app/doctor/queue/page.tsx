"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { format, formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import {
  Users,
  Clock,
  UserCheck,
  Play,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  ArrowRight,
  Phone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { useDoctorQueue, useCallNextPatient, useCompleteAppointment } from "@/hooks/queries/useQueue";
import {
  getPriorityColor,
  getPriorityReasonLabel,
  QueueItem,
} from "@/services/queue.service";
import { toast } from "sonner";

export default function DoctorQueuePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [doctorId, setDoctorId] = useState<string>("");
  const [loadingProfile, setLoadingProfile] = useState(true);

  // Fetch employee profile to get employeeId if not in user context
  useEffect(() => {
    const fetchEmployeeProfile = async () => {
      // If already have employeeId from context, use it
      if (user?.employeeId) {
        setDoctorId(user.employeeId);
        setLoadingProfile(false);
        return;
      }

      // Otherwise fetch from hr-service
      try {
        const { default: api } = await import("@/config/axios");
        const response = await api.get("/hr/employees/me");
        const employeeId = response.data?.data?.id;
        if (employeeId) {
          setDoctorId(employeeId);
        }
      } catch (error) {
        console.error("Failed to fetch employee profile:", error);
      } finally {
        setLoadingProfile(false);
      }
    };

    fetchEmployeeProfile();
  }, [user?.employeeId]);

  const {
    data: queue,
    isLoading,
    refetch,
    isFetching,
  } = useDoctorQueue(doctorId);

  const callNextMutation = useCallNextPatient();
  const completeMutation = useCompleteAppointment();

  // Current patient: IN_PROGRESS first, then most recent COMPLETED (for exam creation)
  const inProgressPatient = queue?.find((q) => q.status === "IN_PROGRESS");
  const completedPatient = queue?.find((q) => q.status === "COMPLETED");
  const currentPatient = inProgressPatient || completedPatient;
  
  // Waiting patients (SCHEDULED)
  const waitingPatients = queue?.filter((q) => q.status === "SCHEDULED") || [];

  const handleCallNext = async () => {
    if (!doctorId) return;
    try {
      const called = await callNextMutation.mutateAsync(doctorId);
      if (called) {
        toast.success(`Đã gọi bệnh nhân: ${called.patient?.fullName || "Bệnh nhân"}`);
      } else {
        toast.info("Không còn bệnh nhân trong hàng đợi");
      }
    } catch {
      toast.error("Không thể gọi bệnh nhân tiếp theo");
    }
  };

  const handleStartExam = (appointment: QueueItem) => {
    router.push(`/doctor/exams/new?appointmentId=${appointment.id}`);
  };

  const handleComplete = async (appointmentId: string) => {
    try {
      await completeMutation.mutateAsync(appointmentId);
      toast.success("Đã hoàn thành khám bệnh");
    } catch {
      toast.error("Không thể hoàn thành");
    }
  };

  const formatWaitTime = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), { locale: vi, addSuffix: false });
  };

  if (loadingProfile) {
    return (
      <div className="text-center py-12">
        <Skeleton className="h-8 w-48 mx-auto" />
        <p className="text-muted-foreground mt-4">Đang tải thông tin...</p>
      </div>
    );
  }

  if (!doctorId) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Không tìm thấy thông tin bác sĩ. Vui lòng đăng nhập lại.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="page-header">
          <h1>
            <Users className="h-6 w-6 text-sky-500" />
            Hàng đợi của tôi
          </h1>
          <p>Quản lý bệnh nhân đang chờ khám hôm nay (ID: {doctorId?.slice(-8) || "N/A"})</p>
        </div>

        <Button
          variant="outline"
          onClick={() => refetch()}
          disabled={isFetching}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? "animate-spin" : ""}`} />
          Làm mới
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left: Current Patient */}
          <div className="lg:col-span-1">
            <Card className="border-2 border-sky-200 bg-gradient-to-br from-sky-50 to-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCheck className="h-5 w-5 text-sky-600" />
                  Đang khám
                </CardTitle>
              </CardHeader>
              <CardContent>
                {currentPatient ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="h-16 w-16 rounded-full bg-sky-100 flex items-center justify-center text-2xl font-bold text-sky-600">
                        {currentPatient.queueNumber}
                      </div>
                      <div>
                        <p className="text-xl font-semibold">{currentPatient.patient?.fullName || `Bệnh nhân #${currentPatient.queueNumber}`}</p>
                        <p className="text-sm text-muted-foreground">
                          Đợi: {formatWaitTime(currentPatient.appointmentTime)}
                        </p>
                      </div>
                    </div>

                    {currentPatient.reason && (
                      <div className="bg-white p-3 rounded-lg border">
                        <p className="text-sm text-muted-foreground">Lý do khám:</p>
                        <p className="text-sm">{currentPatient.reason}</p>
                      </div>
                    )}

                    <div className="flex gap-2">
                      {/* IN_PROGRESS: Show only "Hoàn thành" */}
                      {currentPatient.status === "IN_PROGRESS" && (
                        <Button
                          className="flex-1"
                          variant="outline"
                          onClick={() => handleComplete(currentPatient.id)}
                          disabled={completeMutation.isPending}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Hoàn thành
                        </Button>
                      )}
                      
                      {/* COMPLETED: Show "Bắt đầu khám" */}
                      {currentPatient.status === "COMPLETED" && (
                        <Button
                          className="flex-1"
                          onClick={() => handleStartExam(currentPatient)}
                        >
                          <Play className="h-4 w-4 mr-2" />
                          Bắt đầu khám
                        </Button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <UserCheck className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>Chưa có bệnh nhân đang khám</p>
                    {waitingPatients.length > 0 && (
                      <Button className="mt-4" onClick={handleCallNext}>
                        <Phone className="h-4 w-4 mr-2" />
                        Gọi bệnh nhân tiếp
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 mt-4">
              <Card>
                <CardContent className="pt-4">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-sky-600">
                      {waitingPatients.length}
                    </p>
                    <p className="text-sm text-muted-foreground">Đang chờ</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-emerald-600">
                      {queue?.filter((q) => q.status === "COMPLETED").length || 0}
                    </p>
                    <p className="text-sm text-muted-foreground">Đã khám</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Right: Queue List */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Danh sách chờ</CardTitle>
                  <CardDescription>
                    Sắp xếp theo mức ưu tiên và số thứ tự
                  </CardDescription>
                </div>
                {waitingPatients.length > 0 && !currentPatient && (
                  <Button onClick={handleCallNext} disabled={callNextMutation.isPending}>
                    <Phone className="h-4 w-4 mr-2" />
                    Gọi bệnh nhân tiếp
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                {waitingPatients.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>Không có bệnh nhân trong hàng đợi</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {waitingPatients.map((patient, index) => (
                      <div
                        key={patient.id}
                        className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${
                          index === 0
                            ? "bg-sky-50 border-sky-200"
                            : "hover:bg-muted/50"
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className={`h-12 w-12 rounded-full flex items-center justify-center text-lg font-bold ${
                              index === 0
                                ? "bg-sky-500 text-white"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {patient.queueNumber}
                          </div>

                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{patient.patient?.fullName || `Bệnh nhân #${patient.queueNumber}`}</span>
                              {patient.priorityReason && (
                                <Badge className={getPriorityColor(patient.priority)}>
                                  {getPriorityReasonLabel(patient.priorityReason)}
                                </Badge>
                              )}
                              {patient.type === "EMERGENCY" && (
                                <Badge variant="destructive">
                                  <AlertTriangle className="h-3 w-3 mr-1" />
                                  Cấp cứu
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                Đợi: {formatWaitTime(patient.appointmentTime)}
                              </span>
                              {patient.reason && (
                                <>
                                  <span>•</span>
                                  <span className="truncate max-w-[200px]">
                                    {patient.reason}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {index === 0 && !currentPatient && (
                          <Button size="sm" onClick={handleCallNext}>
                            Gọi
                            <ArrowRight className="h-4 w-4 ml-2" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

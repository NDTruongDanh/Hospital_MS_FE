"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { format, formatDistanceToNow } from "date-fns";
import { enUS } from "date-fns/locale";
import {
  Users,
  Clock,
  UserCheck,
  Play,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  ArrowRight,
  Stethoscope,
  Phone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import {
  useAllQueues,
  useDoctorQueue,
  useCallNextPatient,
  useCompleteAppointment,
} from "@/hooks/queries/useQueue";
import { useEmployees } from "@/hooks/queries/useHr";
import {
  getPriorityLabel,
  getPriorityColor,
  getPriorityReasonLabel,
  QueueItem,
} from "@/services/queue.service";
import { toast } from "sonner";

export default function QueuePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>("all");

  // Auto-select doctor if logged in as doctor
  useEffect(() => {
    if (user?.employeeId && user.role === "DOCTOR") {
      setSelectedDoctorId(user.employeeId);
    }
  }, [user]);

  // Fetch doctors list for selection (filter by role=DOCTOR)
  const { data: doctorsData } = useEmployees({ role: "DOCTOR" });
  const doctors = (doctorsData?.content || []) as Array<{
    id: string;
    fullName: string;
  }>;

  // Fetch all queues for receptionist view
  const {
    data: allQueues,
    isLoading: isLoadingAll,
    refetch: refetchAll,
    isFetching: isFetchingAll,
  } = useAllQueues();

  // Fetch queue for specific doctor (when doctor is selected)
  const {
    data: doctorQueue,
    isLoading: isLoadingDoctor,
    refetch: refetchDoctor,
    isFetching: isFetchingDoctor,
  } = useDoctorQueue(selectedDoctorId === "all" ? "" : selectedDoctorId);

  // Use appropriate data based on selection
  const queue = useMemo(() => {
    if (selectedDoctorId === "all") {
      return allQueues || [];
    }
    return doctorQueue || [];
  }, [selectedDoctorId, allQueues, doctorQueue]);

  const isLoading = selectedDoctorId === "all" ? isLoadingAll : isLoadingDoctor;
  const isFetching =
    selectedDoctorId === "all" ? isFetchingAll : isFetchingDoctor;
  const refetch = selectedDoctorId === "all" ? refetchAll : refetchDoctor;

  // Mutations
  const callNextMutation = useCallNextPatient();
  const completeMutation = useCompleteAppointment();

  // Current patient (IN_PROGRESS)
  const currentPatient = queue?.find((q) => q.status === "IN_PROGRESS");
  // Waiting patients (SCHEDULED)
  const waitingPatients = queue?.filter((q) => q.status === "SCHEDULED") || [];

  // Check if user can call patients (only Doctor/Nurse, not Receptionist)
  const canCallPatient =
    user?.role === "DOCTOR" || user?.role === "NURSE" || user?.role === "ADMIN";

  const handleCallNext = async () => {
    if (!selectedDoctorId) return;
    try {
      const called = await callNextMutation.mutateAsync(selectedDoctorId);
      if (called) {
        toast.success(
          `Called patient: ${called.patient?.fullName || "Patient"}`
        );
      } else {
        toast.info("No patients in queue");
      }
    } catch {
      toast.error("Cannot call next patient");
    }
  };

  const handleStartExam = (appointment: QueueItem) => {
    // Navigate to create exam page with appointmentId
    router.push(`/doctor/exams/create?appointmentId=${appointment.id}`);
  };

  const handleComplete = async (appointmentId: string) => {
    try {
      await completeMutation.mutateAsync(appointmentId);
      toast.success("Examination completed");
    } catch {
      toast.error("Cannot complete");
    }
  };

  const formatWaitTime = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), {
      locale: enUS,
      addSuffix: false,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="page-header">
          <h1>
            <Users className="h-6 w-6 text-sky-500" />
            Patient Queue
          </h1>
          <p>Manage and call patients by priority order</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Doctor selector */}
          {user?.role !== "DOCTOR" && (
            <Select
              value={selectedDoctorId}
              onValueChange={setSelectedDoctorId}
            >
              <SelectTrigger className="w-[250px]">
                <SelectValue placeholder="Select doctor..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  <span className="font-medium">All doctors</span>
                </SelectItem>
                {doctors.map((doc) => (
                  <SelectItem key={doc.id} value={doc.id}>
                    {doc.fullName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <Button
            variant="outline"
            onClick={() => refetch()}
            disabled={isFetching || !selectedDoctorId}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${isFetching ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>
      </div>

      {!selectedDoctorId ? (
        <Card className="p-12 text-center">
          <Stethoscope className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h2 className="text-xl font-semibold mb-2">
            Select a doctor to view queue
          </h2>
          <p className="text-muted-foreground">
            Please select a doctor from the list above to view the patient queue
          </p>
        </Card>
      ) : isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-32 w-full" />
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
                  In Examination
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
                        <p className="text-xl font-semibold">
                          {currentPatient.patient?.fullName ||
                            currentPatient.patientName ||
                            `Patient #${currentPatient.queueNumber}`}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Waited:{" "}
                          {formatWaitTime(currentPatient.appointmentTime)}
                        </p>
                      </div>
                    </div>

                    {currentPatient.reason && (
                      <div className="bg-white p-3 rounded-lg border">
                        <p className="text-sm text-muted-foreground">
                          Visit reason:
                        </p>
                        <p className="text-sm">{currentPatient.reason}</p>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button
                        className="flex-1"
                        onClick={() => handleStartExam(currentPatient)}
                      >
                        <Play className="h-4 w-4 mr-2" />
                        Start Exam
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleComplete(currentPatient.id)}
                        disabled={completeMutation.isPending}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Complete
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <UserCheck className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No patient currently in examination</p>
                    {waitingPatients.length > 0 &&
                      canCallPatient &&
                      selectedDoctorId !== "all" && (
                        <Button className="mt-4" onClick={handleCallNext}>
                          <Phone className="h-4 w-4 mr-2" />
                          Call next patient
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
                    <p className="text-sm text-muted-foreground">Waiting</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-emerald-600">
                      {queue?.filter((q) => q.status === "COMPLETED").length ||
                        0}
                    </p>
                    <p className="text-sm text-muted-foreground">Completed</p>
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
                  <CardTitle>Waiting List</CardTitle>
                  <CardDescription>
                    Sorted by priority and queue number
                  </CardDescription>
                </div>
                {waitingPatients.length > 0 &&
                  !currentPatient &&
                  canCallPatient &&
                  selectedDoctorId !== "all" && (
                    <Button
                      onClick={handleCallNext}
                      disabled={callNextMutation.isPending}
                    >
                      <Phone className="h-4 w-4 mr-2" />
                      Call next patient
                    </Button>
                  )}
              </CardHeader>
              <CardContent>
                {waitingPatients.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No patients in queue</p>
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
                          {/* Queue Number */}
                          <div
                            className={`h-12 w-12 rounded-full flex items-center justify-center text-lg font-bold ${
                              index === 0
                                ? "bg-sky-500 text-white"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {patient.queueNumber}
                          </div>

                          {/* Patient Info */}
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-base">
                                {patient.patient?.fullName ||
                                  patient.patientName ||
                                  `Patient #${patient.queueNumber}`}
                              </span>
                              {patient.priorityReason && (
                                <Badge
                                  className={getPriorityColor(patient.priority)}
                                >
                                  {getPriorityReasonLabel(
                                    patient.priorityReason
                                  )}
                                </Badge>
                              )}
                              {patient.type === "EMERGENCY" && (
                                <Badge variant="destructive">
                                  <AlertTriangle className="h-3 w-3 mr-1" />
                                  Emergency
                                </Badge>
                              )}
                            </div>

                            {/* Doctor info - always show */}
                            <div className="flex items-center gap-1 text-sm text-violet-600 mt-1">
                              <Stethoscope className="h-3 w-3" />
                              <span>
                                Dr.{" "}
                                {patient.doctor?.fullName ||
                                  patient.doctorName ||
                                  "Not assigned"}
                              </span>
                            </div>

                            <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                Wait: {formatWaitTime(patient.appointmentTime)}
                              </span>
                            </div>

                            {/* Reason */}
                            {patient.reason && (
                              <div className="mt-2 text-sm bg-slate-50 p-2 rounded text-slate-600">
                                <span className="font-medium">Reason:</span>{" "}
                                {patient.reason}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Actions - only show for Doctor/Nurse, not Receptionist */}
                        {index === 0 &&
                          !currentPatient &&
                          canCallPatient &&
                          selectedDoctorId !== "all" && (
                            <Button size="sm" onClick={handleCallNext}>
                              Call
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

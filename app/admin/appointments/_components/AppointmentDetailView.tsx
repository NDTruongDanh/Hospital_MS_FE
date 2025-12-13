"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import {
  ArrowLeft,
  Pencil,
  XCircle,
  CheckCircle2,
  User,
  Stethoscope,
  Calendar,
  FileText,
  Clock,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
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

import {
  useCancelAppointment,
  useCompleteAppointment,
} from "@/hooks/queries/useAppointment";
import {
  AppointmentStatusBadge,
  AppointmentTypeBadge,
  CancelAppointmentDialog,
} from ".";
import { Appointment } from "@/interfaces/appointment";
import { Spinner } from "@/components/ui/spinner";

interface AppointmentDetailViewProps {
  appointment: Appointment;
  user: {
    email: string;
    role: string;
    fullName?: string;
    employeeId?: string;
    patientId?: string;
    department?: string;
  } | null;
  backHref: string;
  editHref?: string;
  createExamHref?: string;
  viewExamHref?: string;
  patientProfileBaseHref?: string; // Base path for patient profile link (default: /admin/patients)
}

export function AppointmentDetailView({
  appointment,
  user,
  backHref,
  editHref,
  createExamHref,
  viewExamHref,
  patientProfileBaseHref = "/admin/patients",
}: AppointmentDetailViewProps) {
  const router = useRouter();
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);

  const cancelMutation = useCancelAppointment(user?.employeeId, user?.role);
  const completeMutation = useCompleteAppointment(user?.employeeId, user?.role);

  const isScheduled = appointment.status === "SCHEDULED";
  const canEdit =
    isScheduled &&
    ["ADMIN", "NURSE", "RECEPTIONIST", "DOCTOR"].includes(user?.role || "");
  const canCancel =
    isScheduled &&
    ["ADMIN", "NURSE", "RECEPTIONIST", "DOCTOR", "PATIENT"].includes(
      user?.role || ""
    );
  const canComplete =
    isScheduled &&
    user?.role === "DOCTOR" &&
    user?.employeeId === appointment.doctor.id;

  const formatDateTime = (dateTime: string) => {
    const date = new Date(dateTime);
    return {
      date: format(date, "EEEE, MMMM d, yyyy"),
      time: format(date, "h:mm a"),
    };
  };

  const { date, time } = formatDateTime(appointment.appointmentTime);

  const handleConfirmCancel = (reason: string) => {
    cancelMutation.mutate(
      { id: appointment.id, data: { cancelReason: reason } },
      {
        onSuccess: () => {
          setCancelDialogOpen(false);
        },
      }
    );
  };

  const handleConfirmComplete = () => {
    completeMutation.mutate(appointment.id, {
      onSuccess: () => {
        setCompleteDialogOpen(false);
        if (createExamHref) {
          router.push(createExamHref);
        }
      },
    });
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={backHref}>
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold tracking-tight">
                Appointment Details
              </h1>
              <AppointmentStatusBadge status={appointment.status} />
            </div>
            <p className="text-muted-foreground">
              Booked on {format(new Date(appointment.createdAt), "MMM d, yyyy")}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {canEdit && editHref && (
            <Button variant="outline" asChild>
              <Link href={editHref}>
                <Pencil className="mr-2 h-4 w-4" />
                Reschedule
              </Link>
            </Button>
          )}
          {canComplete && (
            <Button
              variant="default"
              onClick={() => setCompleteDialogOpen(true)}
            >
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Mark as Completed
            </Button>
          )}
          {canCancel && (
            <Button
              variant="destructive"
              onClick={() => setCancelDialogOpen(true)}
            >
              <XCircle className="mr-2 h-4 w-4" />
              Cancel
            </Button>
          )}
        </div>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <User className="h-5 w-5 text-muted-foreground" />
              Patient Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Name</p>
              <p className="font-medium">{appointment.patient.fullName}</p>
            </div>
            {appointment.patient.phoneNumber && (
              <div>
                <p className="text-sm text-muted-foreground">Phone</p>
                <p className="font-medium">{appointment.patient.phoneNumber}</p>
              </div>
            )}
            <div className="pt-2">
              <Button
                variant="link"
                className="h-auto p-0 text-primary"
                asChild
              >
                <Link
                  href={`${patientProfileBaseHref}/${appointment.patient.id}`}
                >
                  View Patient Profile →
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Stethoscope className="h-5 w-5 text-muted-foreground" />
              Doctor Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Name</p>
              <p className="font-medium">{appointment.doctor.fullName}</p>
            </div>
            {appointment.doctor.department && (
              <div>
                <p className="text-sm text-muted-foreground">Department</p>
                <p className="font-medium">{appointment.doctor.department}</p>
              </div>
            )}
            {appointment.doctor.specialization && (
              <div>
                <p className="text-sm text-muted-foreground">Specialization</p>
                <p className="font-medium">
                  {appointment.doctor.specialization}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calendar className="h-5 w-5 text-muted-foreground" />
            Appointment Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <p className="text-sm text-muted-foreground">Date</p>
              <p className="font-medium">{date}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Time</p>
              <p className="font-medium">{time}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Type</p>
              <div className="pt-1">
                <AppointmentTypeBadge type={appointment.type} />
              </div>
            </div>
          </div>
          <Separator />
          <div>
            <p className="text-sm text-muted-foreground">Reason for Visit</p>
            <p className="mt-1">{appointment.reason}</p>
          </div>
          {appointment.notes && (
            <div>
              <p className="text-sm text-muted-foreground">Notes</p>
              <p className="mt-1">{appointment.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>
      {appointment.status === "CANCELLED" && appointment.cancelledAt && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg text-destructive">
              <XCircle className="h-5 w-5" />
              Cancellation Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Cancelled At</p>
              <p className="font-medium">
                {format(
                  new Date(appointment.cancelledAt),
                  "MMMM d, yyyy 'at' h:mm a"
                )}
              </p>
            </div>
            {appointment.cancelReason && (
              <div>
                <p className="text-sm text-muted-foreground">Reason</p>
                <p className="mt-1">{appointment.cancelReason}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
      {appointment.status === "COMPLETED" && (
        <Card className="border-green-500/50 bg-green-50/50 dark:bg-green-950/20">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg text-green-700 dark:text-green-400">
              <FileText className="h-5 w-5" />
              Medical Examination
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {appointment.medicalExamId && viewExamHref ? (
                <Button asChild>
                  <Link href={viewExamHref}>View Medical Exam Record</Link>
                </Button>
              ) : createExamHref ? (
                <Button asChild>
                  <Link href={createExamHref}>Create Medical Exam</Link>
                </Button>
              ) : null}
            </div>
          </CardContent>
        </Card>
      )}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Clock className="h-5 w-5 text-muted-foreground" />
            Audit Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground">Created</p>
              <p className="font-medium">
                {format(
                  new Date(appointment.createdAt),
                  "MMM d, yyyy 'at' h:mm a"
                )}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Last Updated</p>
              <p className="font-medium">
                {format(
                  new Date(appointment.updatedAt),
                  "MMM d, yyyy 'at' h:mm a"
                )}
                {appointment.updatedBy && (
                  <span className="text-muted-foreground">
                    {" "}
                    by {appointment.updatedBy}
                  </span>
                )}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      <CancelAppointmentDialog
        open={cancelDialogOpen}
        onOpenChange={setCancelDialogOpen}
        onConfirm={handleConfirmCancel}
        isLoading={cancelMutation.isPending}
      />
      <AlertDialog
        open={completeDialogOpen}
        onOpenChange={setCompleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mark as Completed?</AlertDialogTitle>
            <AlertDialogDescription>
              This will mark the appointment as completed. You can then create a
              medical exam record for this appointment.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={completeMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmComplete}
              disabled={completeMutation.isPending}
            >
              {completeMutation.isPending && (
                <Spinner size="sm" className="mr-2" />
              )}
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

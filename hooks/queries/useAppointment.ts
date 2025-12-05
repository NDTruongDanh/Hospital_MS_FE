import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import appointmentService from "@/services/appointment.service";
import {
  AppointmentCreateRequest,
  AppointmentUpdateRequest,
  AppointmentCancelRequest,
  AppointmentListParams,
  PaginatedResponse,
} from "@/interfaces/appointment";

// Query Keys
export const appointmentKeys = {
  all: ["appointments"] as const,
  lists: () => [...appointmentKeys.all, "list"] as const,
  list: (params: AppointmentListParams) =>
    [...appointmentKeys.lists(), params] as const,
  details: () => [...appointmentKeys.all, "detail"] as const,
  detail: (id: string) => [...appointmentKeys.details(), id] as const,
  timeSlots: (doctorId: string, date: string) =>
    [...appointmentKeys.all, "timeSlots", doctorId, date] as const,
};

// Error message mapping
function getAppointmentErrorMessage(errorCode: string): string {
  const errorMessages: Record<string, string> = {
    VALIDATION_ERROR: "Please check your input and try again",
    PAST_APPOINTMENT: "Cannot book appointments in the past",
    PATIENT_NOT_FOUND: "Patient not found",
    EMPLOYEE_NOT_FOUND: "Doctor not found",
    DOCTOR_NOT_AVAILABLE: "Doctor is not available on the selected date",
    TIME_SLOT_TAKEN: "Selected time slot is already booked",
    APPOINTMENT_NOT_FOUND: "Appointment not found",
    APPOINTMENT_NOT_MODIFIABLE:
      "Cannot modify completed, cancelled, or no-show appointments",
    APPOINTMENT_NOT_CANCELLABLE:
      "Cannot cancel completed or no-show appointments",
    ALREADY_CANCELLED: "Appointment is already cancelled",
    ALREADY_COMPLETED: "Appointment is already completed",
    APPOINTMENT_CANCELLED: "Cannot complete a cancelled appointment",
    APPOINTMENT_NO_SHOW: "Cannot complete a no-show appointment",
    FORBIDDEN: "You do not have permission to perform this action",
    UNAUTHORIZED: "Please log in to continue",
  };

  return (
    errorMessages[errorCode] ||
    "An unexpected error occurred. Please try again."
  );
}

// Get appointment list
export const useAppointmentList = (params: AppointmentListParams) => {
  return useQuery({
    queryKey: appointmentKeys.list(params),
    queryFn: () => appointmentService.list(params),
  });
};

export const usePatientAppointments = (patientId?: string) => {
  return useQuery({
    queryKey: appointmentKeys.list({ patientId } as AppointmentListParams),
    queryFn: () =>
      appointmentService.list({
        patientId,
        page: 1,
        size: 20,
        sort: "appointmentTime,desc",
      }),
    enabled: !!patientId,
    select: (res: PaginatedResponse<any>) => res?.content ?? [],
  });
};

export const useDoctorAppointments = (doctorId?: string) => {
  return useQuery({
    queryKey: appointmentKeys.list({ doctorId } as AppointmentListParams),
    queryFn: () =>
      appointmentService.list({
        doctorId,
        page: 1,
        size: 20,
        sort: "appointmentTime,asc",
      }),
    enabled: !!doctorId,
    select: (res: PaginatedResponse<any>) => res?.content ?? [],
  });
};

// Get appointment by ID
export const useAppointment = (id: string) => {
  return useQuery({
    queryKey: appointmentKeys.detail(id),
    queryFn: () => appointmentService.getById(id),
    enabled: !!id,
  });
};

// Get available time slots
export const useTimeSlots = (
  doctorId: string,
  date: string,
  excludeAppointmentId?: string
) => {
  return useQuery({
    queryKey: appointmentKeys.timeSlots(doctorId, date),
    queryFn: () =>
      appointmentService.getTimeSlots(doctorId, date, excludeAppointmentId),
    enabled: !!doctorId && !!date,
  });
};

// Create appointment
export const useCreateAppointment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: AppointmentCreateRequest) =>
      appointmentService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: appointmentKeys.lists() });
      toast.success("Appointment booked successfully");
    },
    onError: (error: any) => {
      const errorCode = error.response?.data?.error?.code;
      const errorMessage = getAppointmentErrorMessage(errorCode);
      toast.error(errorMessage);
    },
  });
};

// Update appointment
export const useUpdateAppointment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: AppointmentUpdateRequest;
    }) => appointmentService.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: appointmentKeys.lists() });
      queryClient.invalidateQueries({ queryKey: appointmentKeys.detail(id) });
      toast.success("Appointment rescheduled successfully");
    },
    onError: (error: any) => {
      const errorCode = error.response?.data?.error?.code;
      const errorMessage = getAppointmentErrorMessage(errorCode);
      toast.error(errorMessage);
    },
  });
};

// Cancel appointment
export const useCancelAppointment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: AppointmentCancelRequest;
    }) => appointmentService.cancel(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: appointmentKeys.lists() });
      queryClient.invalidateQueries({ queryKey: appointmentKeys.detail(id) });
      toast.success("Appointment cancelled successfully");
    },
    onError: (error: any) => {
      const errorCode = error.response?.data?.error?.code;
      const errorMessage = getAppointmentErrorMessage(errorCode);
      toast.error(errorMessage);
    },
  });
};

// Complete appointment
export const useCompleteAppointment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => appointmentService.complete(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: appointmentKeys.lists() });
      queryClient.invalidateQueries({ queryKey: appointmentKeys.detail(id) });
      toast.success("Appointment marked as completed");
    },
    onError: (error: any) => {
      const errorCode = error.response?.data?.error?.code;
      const errorMessage = getAppointmentErrorMessage(errorCode);
      toast.error(errorMessage);
    },
  });
};

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getDoctorQueue,
  getAllQueues,
  getNextInQueue,
  callNextPatient,
  registerWalkIn,
  completeAppointment,
  cancelAppointment,
  WalkInRequest,
  QueueItem,
  PriorityReason,
} from "@/services/queue.service";

// Re-export types
export type { PriorityReason };

// ============ Query Keys ============
export const queueKeys = {
  all: ["queue"] as const,
  allQueues: () => [...queueKeys.all, "all"] as const,
  doctorQueue: (doctorId: string) => [...queueKeys.all, "doctor", doctorId] as const,
  nextInQueue: (doctorId: string) => [...queueKeys.all, "next", doctorId] as const,
};

// ============ Queries ============

/**
 * Get today's queue for a specific doctor
 */
export function useDoctorQueue(doctorId: string) {
  return useQuery({
    queryKey: queueKeys.doctorQueue(doctorId),
    queryFn: () => getDoctorQueue(doctorId),
    enabled: !!doctorId,
    refetchInterval: 30000, // Auto-refresh every 30 seconds
  });
}

/**
 * Get all queues for today across all doctors
 * Used by receptionists to see entire waiting room
 */
export function useAllQueues() {
  return useQuery({
    queryKey: queueKeys.allQueues(),
    queryFn: getAllQueues,
    refetchInterval: 30000, // Auto-refresh every 30 seconds
  });
}


/**
 * Get next patient in queue for a doctor
 */
export function useNextInQueue(doctorId: string) {
  return useQuery({
    queryKey: queueKeys.nextInQueue(doctorId),
    queryFn: () => getNextInQueue(doctorId),
    enabled: !!doctorId,
    refetchInterval: 30000,
  });
}

// ============ Mutations ============

/**
 * Register a walk-in patient
 */
export function useRegisterWalkIn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: WalkInRequest) => registerWalkIn(request),
    onSuccess: () => {
      // Invalidate all queue queries to refresh
      queryClient.invalidateQueries({ queryKey: queueKeys.all });
    },
  });
}

/**
 * Call next patient in queue
 */
export function useCallNextPatient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (doctorId: string) => callNextPatient(doctorId),
    onSuccess: (_, doctorId) => {
      queryClient.invalidateQueries({ queryKey: queueKeys.doctorQueue(doctorId) });
      queryClient.invalidateQueries({ queryKey: queueKeys.nextInQueue(doctorId) });
    },
  });
}

/**
 * Complete an appointment
 */
export function useCompleteAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (appointmentId: string) => completeAppointment(appointmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queueKeys.all });
    },
  });
}

/**
 * Cancel an appointment
 */
export function useCancelAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ appointmentId, reason }: { appointmentId: string; reason: string }) =>
      cancelAppointment(appointmentId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queueKeys.all });
    },
  });
}

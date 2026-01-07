import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getLabOrders,
  getLabOrder,
  getLabOrdersByExam,
  getLabOrdersByPatient,
  getLabOrdersByDoctor,
  createLabOrder,
  updateLabOrder,
  cancelLabOrder,
  LabOrderRequest,
  LabOrderUpdateRequest,
  LabOrderResponse,
} from "@/services/lab-order.service";

// ============ Query Keys ============
export const labOrderKeys = {
  all: ["lab-orders"] as const,
  lists: () => [...labOrderKeys.all, "list"] as const,
  list: (params?: { page?: number; size?: number }) =>
    [...labOrderKeys.lists(), params] as const,
  details: () => [...labOrderKeys.all, "detail"] as const,
  detail: (id: string) => [...labOrderKeys.details(), id] as const,
  byExam: (examId: string) => [...labOrderKeys.all, "exam", examId] as const,
  byPatient: (patientId: string) => [...labOrderKeys.all, "patient", patientId] as const,
  byDoctor: (doctorId: string) => [...labOrderKeys.all, "doctor", doctorId] as const,
};

// ============ Queries ============

/**
 * Get all lab orders with pagination
 */
export function useLabOrders(params?: { page?: number; size?: number }) {
  return useQuery({
    queryKey: labOrderKeys.list(params),
    queryFn: () => getLabOrders(params),
  });
}

/**
 * Get lab order by ID
 */
export function useLabOrder(id: string) {
  return useQuery({
    queryKey: labOrderKeys.detail(id),
    queryFn: () => getLabOrder(id),
    enabled: !!id,
  });
}

/**
 * Get lab orders for a medical exam
 */
export function useLabOrdersByExam(examId: string) {
  return useQuery({
    queryKey: labOrderKeys.byExam(examId),
    queryFn: () => getLabOrdersByExam(examId),
    enabled: !!examId,
  });
}

/**
 * Get lab orders for a patient
 */
export function useLabOrdersByPatient(patientId: string) {
  return useQuery({
    queryKey: labOrderKeys.byPatient(patientId),
    queryFn: () => getLabOrdersByPatient(patientId),
    enabled: !!patientId,
  });
}

/**
 * Get lab orders created by a specific doctor
 */
export function useLabOrdersByDoctor(doctorId: string) {
  return useQuery({
    queryKey: labOrderKeys.byDoctor(doctorId),
    queryFn: () => getLabOrdersByDoctor(doctorId),
    enabled: !!doctorId,
  });
}

// ============ Mutations ============

/**
 * Create a new lab order
 */
export function useCreateLabOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: LabOrderRequest) => createLabOrder(request),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: labOrderKeys.lists() });
      if (data.medicalExamId) {
        queryClient.invalidateQueries({
          queryKey: labOrderKeys.byExam(data.medicalExamId),
        });
      }
    },
  });
}

/**
 * Update a lab order
 */
export function useUpdateLabOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, request }: { id: string; request: LabOrderUpdateRequest }) =>
      updateLabOrder(id, request),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: labOrderKeys.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: labOrderKeys.lists() });
    },
  });
}

/**
 * Cancel a lab order
 */
export function useCancelLabOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => cancelLabOrder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: labOrderKeys.all });
    },
  });
}

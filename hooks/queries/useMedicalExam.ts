"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  createPrescriptionMock,
  getMedicalExam,
  getMedicalExams,
  getPrescriptionByExam,
} from "@/services/medical-exam.service";
import { PrescriptionFormValues } from "@/lib/schemas/medical-exam";
import { MedicalExam, Prescription } from "@/interfaces/medical-exam";

export function useMedicalExamList(params: {
  patientId?: string;
  doctorId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  size?: number;
  sort?: string;
}) {
  return useQuery({
    queryKey: ["medical-exams", params],
    queryFn: () => getMedicalExams(params),
  });
}

export function useMedicalExam(id: string) {
  return useQuery<MedicalExam | undefined, Error>({
    queryKey: ["medical-exam", id],
    queryFn: () => getMedicalExam(id),
    enabled: !!id,
  });
}

export function useCreatePrescription(examId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: PrescriptionFormValues) =>
      createPrescriptionMock(examId, data),
    onSuccess: () => {
      toast.success("Prescription created successfully");
      queryClient.invalidateQueries({ queryKey: ["medical-exam", examId] });
      queryClient.invalidateQueries({ queryKey: ["medical-exams"] });
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Failed to create prescription"
      );
    },
  });
}

export function usePrescriptionByExam(examId: string): {
  data: Prescription | undefined;
  isLoading: boolean;
  error: Error | null;
} {
  return useQuery({
    queryKey: ["prescription", examId],
    queryFn: () => getPrescriptionByExam(examId),
    enabled: !!examId,
    select: (data) => data?.data,
  }) as any;
}

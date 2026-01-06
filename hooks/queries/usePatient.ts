import {
  getPatients,
  getPatient,
  getMyProfile,
  createPatient,
  updatePatient,
  updateMyProfile,
  deletePatient,
} from "@/services/patient.service";
import {
  PatientListParams,
  CreatePatientRequest,
  UpdatePatientRequest,
  UpdateMyProfileRequest,
} from "@/interfaces/patient";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

// Query key factory
export const patientKeys = {
  all: ["patients"] as const,
  list: (params: PatientListParams) => ["patients", "list", params] as const,
  detail: (id: string) => ["patients", "detail", id] as const,
  me: () => ["patients", "me"] as const,
};

// List patients with filters and pagination
export const usePatients = (params: PatientListParams) => {
  return useQuery({
    queryKey: patientKeys.list(params),
    queryFn: () => getPatients(params),
  });
};

// Get single patient by ID
export const usePatient = (id: string) => {
  return useQuery({
    queryKey: patientKeys.detail(id),
    queryFn: () => getPatient(id),
    enabled: !!id,
  });
};

// Get current user's patient profile (self-service)
export const useMyProfile = () => {
  return useQuery({
    queryKey: patientKeys.me(),
    queryFn: () => getMyProfile(),
  });
};

// Create new patient
export const useCreatePatient = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreatePatientRequest) => createPatient(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: patientKeys.all });
      toast.success("Patient registered successfully");
    },
    onError: (error: any) => {
      const code = error?.response?.data?.error?.code;
      if (code === "DUPLICATE_PHONE") {
        toast.error("A patient with this phone number already exists");
      } else if (code === "DUPLICATE_EMAIL") {
        toast.error("A patient with this email already exists");
      } else {
        toast.error("Failed to register patient");
      }
    },
  });
};

// Update patient
export const useUpdatePatient = (id: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdatePatientRequest) => updatePatient(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: patientKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: patientKeys.all });
      toast.success("Patient updated successfully");
    },
    onError: (error: any) => {
      console.error("Update patient failed:", error);
      console.error("Server response:", error?.response?.data);

      // Handle "Validation Error" with "errors" map
      if (error?.response?.data?.errors) {
        const fieldErrors = error.response.data.errors;
        const messages = Object.entries(fieldErrors)
          .map(([field, msg]) => `${field}: ${msg}`)
          .join(", ");
        if (messages) {
          toast.error(`Validation Failed: ${messages}`);
          // Don't return, allow specific code checks to run if needed, though usually validation stops here
        }
      }

      if (error?.response?.data?.error) {
        toast.error(
          `Error: ${error.response.data.error.message || "Unknown server error"}`
        );
      }

      const code = error?.response?.data?.error?.code;
      if (code === "PATIENT_NOT_FOUND") {
        toast.error("Patient not found");
      } else if (code === "DUPLICATE_PHONE") {
        toast.error("Phone number already in use by another patient");
      } else if (code === "DUPLICATE_EMAIL") {
        toast.error("Email already in use by another patient");
      } else {
        toast.error("Failed to update patient");
      }
    },
  });
};

// Update own profile (patient self-service)
export const useUpdateMyProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateMyProfileRequest) => updateMyProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: patientKeys.me() });
      toast.success("Profile updated successfully");
    },
    onError: () => {
      toast.error("Failed to update profile");
    },
  });
};

// Delete patient
export const useDeletePatient = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deletePatient(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: patientKeys.all });
      toast.success("Patient deleted successfully");
    },
    onError: (error: any) => {
      const code = error?.response?.data?.error?.code;
      if (code === "PATIENT_NOT_FOUND") {
        toast.error("Patient not found");
      } else if (code === "HAS_FUTURE_APPOINTMENTS") {
        const details = error?.response?.data?.error?.details;
        const message =
          details?.[0]?.message || "Patient has scheduled appointments";
        toast.error(`Cannot delete: ${message}. Cancel them first.`);
      } else {
        toast.error("Failed to delete patient");
      }
    },
  });
};

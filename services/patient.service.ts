import {
  Patient,
  PatientListParams,
  PatientListResponse,
  CreatePatientRequest,
  UpdatePatientRequest,
  UpdateMyProfileRequest,
  DeletePatientResponse,
  PatientFormValues,
} from "@/interfaces/patient";
import { mockPatients } from "@/lib/mocks";
import axiosInstance from "@/config/axios";
import { USE_MOCK } from "@/lib/mocks/toggle";

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Helper: Load patients from localStorage or use mock data
const STORAGE_KEY = "hms_mock_patients";

const loadPatientData = (): Patient[] => {
  if (typeof window === "undefined") return [...mockPatients];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.warn("Failed to load patients from localStorage:", e);
  }
  return [...mockPatients];
};

const savePatientData = (data: Patient[]) => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn("Failed to save patients to localStorage:", e);
  }
};

let patientData: Patient[] = loadPatientData();

// GET /api/patients - List patients with pagination and filters
export const getPatients = async (
  params: PatientListParams
): Promise<PatientListResponse> => {
  if (!USE_MOCK) {
    // Build RSQL filter string from params
    const filterParts: string[] = [];

    // Search filter - search across fullName, phoneNumber, email
    if (params.search) {
      const searchTerm = params.search.trim();
      if (searchTerm) {
        // RSQL pattern matching with wildcard
        filterParts.push(
          `fullName==*${searchTerm}*,phoneNumber==*${searchTerm}*,email==*${searchTerm}*`
        );
      }
    }

    // Gender filter
    if (params.gender) {
      filterParts.push(`gender==${params.gender}`);
    }

    // Blood type filter
    if (params.bloodType) {
      filterParts.push(`bloodType==${params.bloodType}`);
    }

    // Combine filters with AND (;) - use parentheses for OR (,) groups
    const filterString =
      filterParts.length > 0
        ? filterParts.map((f) => (f.includes(",") ? `(${f})` : f)).join(";")
        : undefined;

    // Build API params with 0-based pagination
    const apiParams: Record<string, unknown> = {
      page: params.page ?? 0,
      size: params.size ?? 10,
    };

    if (filterString) {
      apiParams.filter = filterString;
    }

    if (params.sort) {
      apiParams.sort = params.sort;
    }

    const response = await axiosInstance.get<{ data: PatientListResponse }>(
      "/patients/all",
      {
        params: apiParams,
      }
    );
    return response.data.data; // Extract from ApiResponse wrapper
  }

  await delay(300);

  let filtered = [...patientData];

  // Search filter
  if (params.search) {
    const term = params.search.toLowerCase();
    filtered = filtered.filter(
      (p) =>
        p.fullName.toLowerCase().includes(term) ||
        p.phoneNumber.includes(term) ||
        p.email?.toLowerCase().includes(term) ||
        p.identificationNumber?.includes(term)
    );
  }

  // Gender filter
  if (params.gender) {
    filtered = filtered.filter((p) => p.gender === params.gender);
  }

  // Blood type filter
  if (params.bloodType) {
    filtered = filtered.filter((p) => p.bloodType === params.bloodType);
  }

  // Sort
  if (params.sort) {
    const [field, direction] = params.sort.split(",");
    filtered.sort((a, b) => {
      const aVal = (a as any)[field];
      const bVal = (b as any)[field];
      if (typeof aVal === "string" && typeof bVal === "string") {
        return direction === "desc"
          ? bVal.localeCompare(aVal)
          : aVal.localeCompare(bVal);
      }
      return 0;
    });
  }

  // Pagination
  const page = params.page ?? 0;
  const size = params.size ?? 10;
  const start = page * size;
  const end = start + size;
  const content = filtered.slice(start, end);

  return {
    content,
    page,
    size,
    totalElements: filtered.length,
    totalPages: Math.ceil(filtered.length / size),
  };
};

// GET /api/patients/:id - Get patient by ID
export const getPatient = async (id: string): Promise<Patient> => {
  if (!USE_MOCK) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await axiosInstance.get<{ data: Patient }>(
      `/patients/${id}`
    );
    return response.data.data; // Extract from ApiResponse wrapper
  }

  await delay(200);
  const patient = patientData.find((p) => p.id === id);
  if (!patient) {
    throw {
      response: {
        status: 404,
        data: { error: { code: "PATIENT_NOT_FOUND" } },
      },
    };
  }
  return patient;
};

// GET /api/patients/me - Get current user's patient profile
export const getMyProfile = async (): Promise<Patient> => {
  if (!USE_MOCK) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await axiosInstance.get<{ data: Patient }>("/patients/me");
    return response.data.data; // Extract from ApiResponse wrapper
  }

  await delay(200);
  // Return first patient as mock "my profile"
  return patientData[0];
};

// POST /api/patients - Create new patient
export const createPatient = async (
  data: CreatePatientRequest
): Promise<Patient> => {
  if (!USE_MOCK) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await axiosInstance.post<{ data: Patient }>(
      "/patients",
      data
    );
    return response.data.data; // Extract from ApiResponse wrapper
  }

  await delay(300);

  // Check for duplicate phone
  if (patientData.some((p) => p.phoneNumber === data.phoneNumber)) {
    throw {
      response: {
        status: 409,
        data: {
          error: {
            code: "DUPLICATE_PHONE",
            message: "Phone number already exists",
          },
        },
      },
    };
  }

  // Check for duplicate email
  if (data.email && patientData.some((p) => p.email === data.email)) {
    throw {
      response: {
        status: 409,
        data: {
          error: { code: "DUPLICATE_EMAIL", message: "Email already exists" },
        },
      },
    };
  }

  const newPatient: Patient = {
    id: `p${String(patientData.length + 1).padStart(3, "0")}`,
    accountId: data.accountId || null,
    fullName: data.fullName,
    email: data.email || null,
    dateOfBirth: data.dateOfBirth || null,
    gender: data.gender || null,
    phoneNumber: data.phoneNumber,
    address: data.address || null,
    identificationNumber: data.identificationNumber || null,
    healthInsuranceNumber: data.healthInsuranceNumber || null,
    bloodType: data.bloodType || null,
    allergies: data.allergies || null,
    relativeFullName: data.relativeFullName || null,
    relativePhoneNumber: data.relativePhoneNumber || null,
    relativeRelationship: data.relativeRelationship || null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  patientData.push(newPatient);
  savePatientData(patientData);
  return newPatient;
};

// PUT /api/patients/:id - Update patient
export const updatePatient = async (
  id: string,
  data: UpdatePatientRequest
): Promise<Patient> => {
  if (!USE_MOCK) {
    try {
      const response = await axiosInstance.put<{ data: Patient }>(
        `/patients/${id}`,
        data
      );
      return response.data.data;
    } catch (error: any) {
      console.error("[PatientService] Update failed:", error);
      if (error.response) {
        console.error(
          "[PatientService] Response status:",
          error.response.status
        );
        console.error(
          "[PatientService] Response data:",
          JSON.stringify(error.response.data, null, 2)
        );
      }
      throw error;
    }
  }

  await delay(300);

  const index = patientData.findIndex((p) => p.id === id);
  if (index === -1) {
    throw {
      response: {
        status: 404,
        data: { error: { code: "PATIENT_NOT_FOUND" } },
      },
    };
  }

  // Check for duplicate phone (excluding current patient)
  if (
    data.phoneNumber &&
    patientData.some((p) => p.phoneNumber === data.phoneNumber && p.id !== id)
  ) {
    throw {
      response: {
        status: 409,
        data: {
          error: {
            code: "DUPLICATE_PHONE",
            message: "Phone number already exists",
          },
        },
      },
    };
  }

  const updated: Patient = {
    ...patientData[index],
    ...data,
    updatedAt: new Date().toISOString(),
  } as Patient;

  patientData[index] = updated;
  savePatientData(patientData);
  return updated;
};

// PATCH /api/patients/me - Update own profile (patient self-service)
export const updateMyProfile = async (
  data: UpdateMyProfileRequest
): Promise<Patient> => {
  if (!USE_MOCK) {
    const response = await axiosInstance.patch<{ data: Patient }>(
      "/patients/me",
      data
    );
    return response.data.data; // Extract from ApiResponse wrapper
  }

  await delay(300);
  // Update first patient as mock "my profile"
  const updated: Patient = {
    ...patientData[0],
    ...data,
    updatedAt: new Date().toISOString(),
  };
  patientData[0] = updated;
  savePatientData(patientData);
  return updated;
};

// DELETE /api/patients/:id - Soft delete patient
export const deletePatient = async (
  id: string
): Promise<DeletePatientResponse> => {
  if (!USE_MOCK) {
    const response = await axiosInstance.delete<DeletePatientResponse>(
      `/patients/${id}`
    );
    return response.data;
  }

  await delay(300);

  const index = patientData.findIndex((p) => p.id === id);
  if (index === -1) {
    throw {
      response: {
        status: 404,
        data: { error: { code: "PATIENT_NOT_FOUND" } },
      },
    };
  }

  // Simulate check for future appointments (randomly fail 20% of time)
  if (Math.random() < 0.2) {
    throw {
      response: {
        status: 409,
        data: {
          error: {
            code: "HAS_FUTURE_APPOINTMENTS",
            message: "Cannot delete patient with future appointments",
            details: [
              {
                field: "appointments",
                message: "Patient has 3 scheduled appointments",
              },
            ],
          },
        },
      },
    };
  }

  const deleted = patientData[index];
  patientData = patientData.filter((p) => p.id !== id);
  savePatientData(patientData);

  return {
    id: deleted.id,
    deletedAt: new Date().toISOString(),
    deletedBy: "admin001",
  };
};

// Utility functions for form transformations
export const apiToFormValues = (patient: Patient): PatientFormValues => {
  return {
    fullName: patient.fullName,
    email: patient.email || "",
    phoneNumber: patient.phoneNumber,
    dateOfBirth: patient.dateOfBirth,
    gender: patient.gender,
    address: patient.address || "",
    identificationNumber: patient.identificationNumber || "",
    healthInsuranceNumber: patient.healthInsuranceNumber || "",
    bloodType: patient.bloodType,
    allergies: patient.allergies ? patient.allergies.split(", ") : [],
    relativeFullName: patient.relativeFullName || "",
    relativePhoneNumber: patient.relativePhoneNumber || "",
    relativeRelationship: patient.relativeRelationship,
    accountId: patient.accountId,
  };
};

export const formValuesToRequest = (
  values: PatientFormValues
): CreatePatientRequest => {
  return {
    fullName: values.fullName.trim(),
    email: values.email?.trim() || undefined,
    phoneNumber: values.phoneNumber.trim(),
    dateOfBirth: values.dateOfBirth || undefined,
    gender: values.gender || undefined,
    address: values.address?.trim() || undefined,
    identificationNumber: values.identificationNumber?.trim() || undefined,
    healthInsuranceNumber: values.healthInsuranceNumber?.trim() || undefined,
    bloodType: values.bloodType || undefined,
    allergies:
      values.allergies.length > 0 ? values.allergies.join(", ") : undefined,
    relativeFullName: values.relativeFullName?.trim() || undefined,
    relativePhoneNumber: values.relativePhoneNumber?.trim() || undefined,
    relativeRelationship: values.relativeRelationship || undefined,
    accountId: values.accountId || undefined,
  };
};

// Calculate age from date of birth
export const calculateAge = (dateOfBirth: string | null): number => {
  if (!dateOfBirth) return 0; // Return 0 or handle as appropriate
  const dob = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  return age;
};

// POST /api/patients/:id/profile-image - Upload profile image
export const uploadProfileImage = async (
  patientId: string,
  file: File
): Promise<Patient> => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await axiosInstance.post<{ data: Patient }>(
    `/patients/${patientId}/profile-image`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );
  return response.data.data;
};

// DELETE /api/patients/:id/profile-image - Delete profile image
export const deleteProfileImage = async (
  patientId: string
): Promise<Patient> => {
  const response = await axiosInstance.delete<{ data: Patient }>(
    `/patients/${patientId}/profile-image`
  );
  return response.data.data;
};

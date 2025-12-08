import api from "@/config/axios";
import {
  Patient,
  PatientListParams,
  PatientListResponse,
  CreatePatientRequest,
  UpdatePatientRequest,
  UpdateMyProfileRequest,
  DeletePatientResponse,
} from "@/interfaces/patient";
import { USE_MOCK } from "@/lib/mocks/toggle";

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Mock data
const mockPatients: Patient[] = [
  {
    id: "p001",
    accountId: "acc001",
    fullName: "Nguyen Van An",
    email: "nguyenvanan@gmail.com",
    dateOfBirth: "1990-05-15",
    gender: "MALE",
    phoneNumber: "0901234567",
    address: "123 Le Loi, District 1, Ho Chi Minh City",
    identificationNumber: "079090001234",
    healthInsuranceNumber: "HC123456789",
    bloodType: "O+",
    allergies: "Penicillin, Peanuts",
    relativeFullName: "Nguyen Thi Binh",
    relativePhoneNumber: "0907654321",
    relativeRelationship: "SPOUSE",
    createdAt: "2025-01-15T10:00:00Z",
    updatedAt: "2025-01-15T10:00:00Z",
  },
  {
    id: "p002",
    accountId: null,
    fullName: "Tran Thi Mai",
    email: "tranthimai@gmail.com",
    dateOfBirth: "1985-08-20",
    gender: "FEMALE",
    phoneNumber: "0912345678",
    address: "456 Nguyen Hue, District 1, Ho Chi Minh City",
    identificationNumber: "079085002345",
    healthInsuranceNumber: "HC234567890",
    bloodType: "A+",
    allergies: null,
    relativeFullName: "Tran Van Cuong",
    relativePhoneNumber: "0918765432",
    relativeRelationship: "PARENT",
    createdAt: "2025-02-10T14:30:00Z",
    updatedAt: "2025-02-10T14:30:00Z",
  },
  {
    id: "p003",
    accountId: "acc003",
    fullName: "Le Hoang Phuc",
    email: "lehoangphuc@gmail.com",
    dateOfBirth: "1978-12-01",
    gender: "MALE",
    phoneNumber: "0923456789",
    address: "789 Hai Ba Trung, District 3, Ho Chi Minh City",
    identificationNumber: "079078003456",
    healthInsuranceNumber: null,
    bloodType: "B-",
    allergies: "Aspirin, Shellfish, Latex",
    relativeFullName: null,
    relativePhoneNumber: null,
    relativeRelationship: null,
    createdAt: "2025-03-05T09:15:00Z",
    updatedAt: "2025-03-05T09:15:00Z",
  },
  {
    id: "p004",
    accountId: null,
    fullName: "Pham Minh Duc",
    email: null,
    dateOfBirth: "1995-03-25",
    gender: "MALE",
    phoneNumber: "0934567890",
    address: "321 Vo Van Tan, District 3, Ho Chi Minh City",
    identificationNumber: "079095004567",
    healthInsuranceNumber: "HC345678901",
    bloodType: "AB+",
    allergies: null,
    relativeFullName: "Pham Thi Lan",
    relativePhoneNumber: "0929876543",
    relativeRelationship: "PARENT",
    createdAt: "2025-04-20T11:45:00Z",
    updatedAt: "2025-04-20T11:45:00Z",
  },
  {
    id: "p005",
    accountId: "acc005",
    fullName: "Vo Thi Hong",
    email: "vothihong@gmail.com",
    dateOfBirth: "2000-07-10",
    gender: "FEMALE",
    phoneNumber: "0945678901",
    address: "654 Cach Mang Thang 8, District 10, Ho Chi Minh City",
    identificationNumber: "079000005678",
    healthInsuranceNumber: "HC456789012",
    bloodType: "O-",
    allergies: "Ibuprofen",
    relativeFullName: "Vo Van Hai",
    relativePhoneNumber: "0930987654",
    relativeRelationship: "SIBLING",
    createdAt: "2025-05-12T16:20:00Z",
    updatedAt: "2025-05-12T16:20:00Z",
  },
  {
    id: "p006",
    accountId: null,
    fullName: "Hoang Duc Thang",
    email: "hoangducthang@gmail.com",
    dateOfBirth: "1988-11-30",
    gender: "MALE",
    phoneNumber: "0956789012",
    address: "987 Ly Thuong Kiet, District Tan Binh, Ho Chi Minh City",
    identificationNumber: "079088006789",
    healthInsuranceNumber: "HC567890123",
    bloodType: "A-",
    allergies: null,
    relativeFullName: "Hoang Thi Thuy",
    relativePhoneNumber: "0941098765",
    relativeRelationship: "SPOUSE",
    createdAt: "2025-06-08T08:30:00Z",
    updatedAt: "2025-06-08T08:30:00Z",
  },
  {
    id: "p007",
    accountId: "acc007",
    fullName: "Dang Van Khanh",
    email: "dangvankhanh@gmail.com",
    dateOfBirth: "1992-04-18",
    gender: "MALE",
    phoneNumber: "0967890123",
    address: "147 Phan Xich Long, Phu Nhuan District, Ho Chi Minh City",
    identificationNumber: "079092007890",
    healthInsuranceNumber: null,
    bloodType: "B+",
    allergies: "Sulfa drugs, Eggs",
    relativeFullName: "Dang Thi Ngoc",
    relativePhoneNumber: "0952109876",
    relativeRelationship: "PARENT",
    createdAt: "2025-07-22T13:00:00Z",
    updatedAt: "2025-07-22T13:00:00Z",
  },
  {
    id: "p008",
    accountId: null,
    fullName: "Bui Thi Thao",
    email: "buithithao@gmail.com",
    dateOfBirth: "1983-09-05",
    gender: "FEMALE",
    phoneNumber: "0978901234",
    address: "258 Nguyen Van Cu, District 5, Ho Chi Minh City",
    identificationNumber: "079083008901",
    healthInsuranceNumber: "HC678901234",
    bloodType: "AB-",
    allergies: null,
    relativeFullName: null,
    relativePhoneNumber: null,
    relativeRelationship: null,
    createdAt: "2025-08-14T10:45:00Z",
    updatedAt: "2025-08-14T10:45:00Z",
  },
  {
    id: "p009",
    accountId: "acc009",
    fullName: "Ngo Quang Huy",
    email: "ngoquanghuy@gmail.com",
    dateOfBirth: "1975-02-28",
    gender: "MALE",
    phoneNumber: "0989012345",
    address: "369 Dien Bien Phu, Binh Thanh District, Ho Chi Minh City",
    identificationNumber: "079075009012",
    healthInsuranceNumber: "HC789012345",
    bloodType: "O+",
    allergies: "Contrast dye, Bee stings",
    relativeFullName: "Ngo Thi Huong",
    relativePhoneNumber: "0963210987",
    relativeRelationship: "SPOUSE",
    createdAt: "2025-09-30T15:30:00Z",
    updatedAt: "2025-09-30T15:30:00Z",
  },
  {
    id: "p010",
    accountId: null,
    fullName: "Ly Thi Kim",
    email: null,
    dateOfBirth: "1998-06-12",
    gender: "FEMALE",
    phoneNumber: "0990123456",
    address: "480 Ba Thang Hai, District 10, Ho Chi Minh City",
    identificationNumber: "079098010123",
    healthInsuranceNumber: "HC890123456",
    bloodType: "A+",
    allergies: "Milk",
    relativeFullName: "Ly Van Toan",
    relativePhoneNumber: "0974321098",
    relativeRelationship: "PARENT",
    createdAt: "2025-10-18T12:15:00Z",
    updatedAt: "2025-10-18T12:15:00Z",
  },
];

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
  if (USE_MOCK) {
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
        const aVal = (a as Record<string, unknown>)[field];
        const bVal = (b as Record<string, unknown>)[field];
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
  }

  const response = await api.get("/patients", { params });
  return response.data;
};

// GET /api/patients/:id - Get patient by ID
export const getPatient = async (id: string): Promise<Patient> => {
  if (USE_MOCK) {
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
  }

  const response = await api.get(`/patients/${id}`);
  return response.data;
};

// GET /api/patients/me - Get current user's patient profile
export const getMyProfile = async (): Promise<Patient> => {
  if (USE_MOCK) {
    await delay(200);
    // Return first patient as mock "my profile"
    return patientData[0];
  }

  const response = await api.get("/patients/me");
  return response.data;
};

// POST /api/patients - Create new patient
export const createPatient = async (
  data: CreatePatientRequest
): Promise<Patient> => {
  if (USE_MOCK) {
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
  }

  const response = await api.post("/patients", data);
  return response.data;
};

// PUT /api/patients/:id - Update patient
export const updatePatient = async (
  id: string,
  data: UpdatePatientRequest
): Promise<Patient> => {
  if (USE_MOCK) {
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
  }

  const response = await api.put(`/patients/${id}`, data);
  return response.data;
};

// PUT /api/patients/me - Update own profile (patient self-service)
export const updateMyProfile = async (
  data: UpdateMyProfileRequest
): Promise<Patient> => {
  if (USE_MOCK) {
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
  }

  const response = await api.put("/patients/me", data);
  return response.data;
};

// DELETE /api/patients/:id - Soft delete patient
export const deletePatient = async (
  id: string
): Promise<DeletePatientResponse> => {
  if (USE_MOCK) {
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
  }

  const response = await api.delete(`/patients/${id}`);
  return response.data;
};

// Utility functions for form transformations
export const apiToFormValues = (
  patient: Patient
): PatientFormValues => {
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
export const calculateAge = (dateOfBirth: string): number => {
  const dob = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  return age;
};

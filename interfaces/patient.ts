// Patient entity - matches backend API
export interface Patient {
  id: string;
  accountId: string | null;
  fullName: string;
  email: string | null;
  dateOfBirth: string | null;
  gender: Gender | null;
  phoneNumber: string;
  address: string | null;
  identificationNumber: string | null;
  healthInsuranceNumber: string | null;
  bloodType: BloodType | null;
  allergies: string | null; // Comma-separated
  profileImageUrl?: string | null;
  relativeFullName: string | null;
  relativePhoneNumber: string | null;
  relativeRelationship: RelationshipType | null;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  deletedBy?: string | null;
}

// Blood types
export type BloodType = "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-";

// Relationship types for emergency contact
export type RelationshipType =
  | "SPOUSE"
  | "PARENT"
  | "CHILD"
  | "SIBLING"
  | "FRIEND"
  | "OTHER";

// Gender type
export type Gender = "MALE" | "FEMALE" | "OTHER";

// List params for API
export interface PatientListParams {
  page?: number;
  size?: number;
  sort?: string;
  search?: string;
  gender?: Gender;
  bloodType?: BloodType;
}

// Paginated response
export interface PatientListResponse {
  content: Patient[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

// Create patient request
export interface CreatePatientRequest {
  accountId?: string;
  fullName: string;
  email?: string;
  phoneNumber: string;
  dateOfBirth?: string;
  gender?: Gender;
  address?: string;
  identificationNumber?: string;
  healthInsuranceNumber?: string;
  bloodType?: BloodType;
  allergies?: string; // Comma-separated values (e.g., "Penicillin, Aspirin") - backend expects string
  relativeFullName?: string;
  relativePhoneNumber?: string;
  relativeRelationship?: RelationshipType;
}

// Update patient request (partial)
export interface UpdatePatientRequest {
  accountId?: string | null;
  fullName?: string;
  email?: string | null;
  phoneNumber?: string;
  dateOfBirth?: string | null;
  gender?: Gender | null;
  address?: string | null;
  identificationNumber?: string | null;
  healthInsuranceNumber?: string | null;
  bloodType?: BloodType | null;
  allergies?: string | null;
  relativeFullName?: string | null;
  relativePhoneNumber?: string | null;
  relativeRelationship?: RelationshipType | null;
}

// Update my profile request (limited fields for patient self-service)
export interface UpdateMyProfileRequest {
  phoneNumber?: string;
  address?: string;
  allergies?: string;
  relativeFullName?: string;
  relativePhoneNumber?: string;
  relativeRelationship?: RelationshipType;
}

// Form values (used in UI)
export interface PatientFormValues {
  fullName: string;
  email: string;
  phoneNumber: string;
  dateOfBirth: string | null;
  gender: Gender | null;
  address: string;
  identificationNumber: string;
  healthInsuranceNumber: string;
  bloodType: BloodType | null;
  allergies: string[]; // Array in UI, joined for API
  relativeFullName: string;
  relativePhoneNumber: string;
  relativeRelationship: RelationshipType | null;
  accountId: string | null;
}

// Delete response
export interface DeletePatientResponse {
  id: string;
  deletedAt: string;
  deletedBy: string;
}

// Timeline event for patient history
export interface PatientTimelineEvent {
  id: string;
  type: "APPOINTMENT" | "EXAM" | "INVOICE";
  date: string;
  title: string;
  summary: string;
  status?: string;
  detailUrl: string;
}

// Patient history params
export interface PatientHistoryParams {
  patientId: string;
  startDate?: string;
  endDate?: string;
  eventType?: "APPOINTMENT" | "EXAM" | "INVOICE" | "ALL";
}

// ============ Summary Types (from API) ============

export interface AppointmentSummary {
  id: string;
  appointmentTime: string;
}

export interface PatientSummary {
  id: string;
  fullName: string;
  dateOfBirth?: string;
  gender?: string;
  phoneNumber?: string;
}

export interface DoctorSummary {
  id: string;
  fullName: string;
  specialization?: string;
  phoneNumber?: string;
}

export interface MedicineSummary {
  id: string;
  name: string;
}

// ============ Vitals ============

export interface Vitals {
  temperature?: number;
  bloodPressureSystolic?: number;
  bloodPressureDiastolic?: number;
  heartRate?: number;
  weight?: number;
  height?: number;
}

// ============ Medical Exam ============

export interface MedicalExam {
  id: string;
  appointment: AppointmentSummary;
  patient: PatientSummary;
  doctor: DoctorSummary;
  status?: ExamStatus;
  diagnosis?: string;
  symptoms?: string;
  treatment?: string;
  vitals: Vitals;
  notes?: string;
  examDate: string;
  createdAt: string;
  updatedAt: string;
  updatedBy?: string;
  hasPrescription?: boolean;
  prescription?: Prescription;
  cancelReason?: string;
  followUpDate?: string;
}

export interface MedicalExamListItem {
  id: string;
  appointment: AppointmentSummary;
  patient: PatientSummary;
  doctor: DoctorSummary;
  status?: ExamStatus;
  diagnosis?: string;
  examDate: string;
  hasPrescription?: boolean;
  prescription?: Prescription;
}

export interface MedicalExamCreateRequest {
  appointmentId: string;
  status?: ExamStatus;
  diagnosis?: string;
  symptoms?: string;
  treatment?: string;
  temperature?: number;
  bloodPressureSystolic?: number;
  bloodPressureDiastolic?: number;
  heartRate?: number;
  weight?: number;
  height?: number;
  notes?: string;
  hasPrescription?: boolean; // Indicates if prescription will be created
  followUpDate?: string;
}

export interface MedicalExamUpdateRequest {
  status?: ExamStatus;
  diagnosis?: string;
  symptoms?: string;
  treatment?: string;
  temperature?: number;
  bloodPressureSystolic?: number;
  bloodPressureDiastolic?: number;
  heartRate?: number;
  weight?: number;
  height?: number;
  notes?: string;
  followUpDate?: string;
}

export interface MedicalExamListParams {
  patientId?: string;
  doctorId?: string;
  startDate?: string;
  endDate?: string;
  status?: ExamStatus;
  search?: string; // Added search parameter
  page?: number;
  size?: number;
  sort?: string;
}

// ============ Prescription ============

export interface PrescriptionItem {
  id: string;
  medicine: MedicineSummary;
  quantity: number;
  unitPrice: number;
  dosage: string;
  durationDays?: number;
  instructions?: string;
}

export interface Prescription {
  id: string;
  medicalExam: { id: string };
  patient: PatientSummary;
  doctor: DoctorSummary;
  status: PrescriptionStatus;
  prescribedAt: string;
  notes?: string;
  items: PrescriptionItem[];
  itemCount?: number;
  // Nested dispense info (when status=DISPENSED)
  dispense?: {
    dispensedAt?: string;
    dispensedBy?: string;
  };
  // Nested cancellation info (when status=CANCELLED)
  cancellation?: {
    cancelledAt?: string;
    cancelledBy?: string;
    reason?: string;
  };
  createdAt: string;
  createdBy?: string;
}

export interface PrescriptionListItem {
  id: string;
  medicalExam: { id: string };
  doctor: DoctorSummary;
  prescribedAt: string;
  itemCount: number;
}

export interface PrescriptionItemRequest {
  medicineId: string;
  quantity: number;
  dosage: string;
  durationDays?: number;
  instructions?: string;
}

export interface PrescriptionCreateRequest {
  notes?: string;
  items: PrescriptionItemRequest[];
}

export type ExamStatus = "PENDING" | "IN_PROGRESS" | "FINALIZED" | "CANCELLED";

export type PrescriptionStatus = "ACTIVE" | "DISPENSED" | "CANCELLED";

// ============ Paginated Response ============

export interface PaginatedResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

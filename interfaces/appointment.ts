// Appointment Types - Based on backend AppointmentStatus enum

export type AppointmentStatus =
  | "PENDING"       // Chờ xác nhận
  | "CONFIRMED"     // Đã xác nhận
  | "SCHEDULED"     // Đã lên lịch
  | "IN_PROGRESS"   // Đang khám (walk-in queue)
  | "COMPLETED"
  | "CANCELLED"
  | "NO_SHOW";
export type AppointmentType = "CONSULTATION" | "FOLLOW_UP" | "EMERGENCY" | "WALK_IN";

export interface PatientSummary {
  id: string;
  fullName: string;
  phoneNumber?: string;
}

export interface DoctorSummary {
  id: string;
  fullName: string;
  department?: string;
  specialization?: string;
  phoneNumber?: string;
}

export interface Appointment {
  id: string;
  patient: PatientSummary;
  doctor: DoctorSummary;
  appointmentTime: string; // ISO 8601
  status: AppointmentStatus;
  type: AppointmentType;
  reason: string;
  notes?: string;
  cancelledAt?: string;
  cancelReason?: string;
  medicalExamId?: string;
  queueNumber?: number;     // Queue position for walk-ins
  priority?: number;        // Priority level (lower = higher priority)
  priorityReason?: string;  // EMERGENCY, ELDERLY, PREGNANT, etc.
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface AppointmentCreateRequest {
  patientId: string;
  doctorId: string;
  appointmentTime: string; // ISO 8601: "2025-12-05T09:00:00"
  type: AppointmentType;
  reason: string;
  notes?: string;
}

export interface AppointmentUpdateRequest {
  patientId?: string;
  doctorId?: string;
  appointmentTime?: string;
  type?: AppointmentType;
  reason?: string;
  notes?: string;
}

export interface AppointmentCancelRequest {
  cancelReason: string;
}

export interface AppointmentListParams {
  patientId?: string;
  doctorId?: string;
  status?: AppointmentStatus;
  startDate?: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
  search?: string;
  page?: number; // 0-based
  size?: number;
  sort?: string; // e.g., "appointmentTime,desc"
}

export interface PaginatedResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

// Time slot for booking
export interface TimeSlot {
  time: string; // "09:00"
  available: boolean;
  current?: boolean; // true if this is current appointment (edit mode)
}

// For select options
export interface PatientOption {
  value: string; // patient.id
  label: string; // patient.fullName
  subLabel?: string; // patient.phoneNumber
}

export interface DoctorOption {
  value: string; // employee.id
  label: string; // employee.fullName
  subLabel?: string; // department.name + specialization
  departmentId?: string;
}

// Walk-in registration request - matches backend WalkInRequest DTO
export interface WalkInRequest {
  patientId: string;
  doctorId: string;
  reason?: string;
  priorityReason?: string;  // EMERGENCY, ELDERLY, PREGNANT, DISABILITY, etc.
}

// ==================== Stats Response Interfaces ====================

export interface AppointmentStatsResponse {
  startDate: string;
  endDate: string;
  totalAppointments: number;
  appointmentsByStatus: Record<string, number>;
  appointmentsByType: Record<string, number>;
  appointmentsByDepartment: DepartmentStats[];
  appointmentsByDoctor: DoctorStats[];
  dailyTrend: DailyCount[];
  averagePerDay: number;
  generatedAt: string;
}

export interface DepartmentStats {
  departmentName: string;
  count: number;
  percentage: number;
}

export interface DoctorStats {
  doctorId: string;
  doctorName: string;
  departmentName: string;
  count: number;
}

export interface DailyCount {
  date: string;
  count: number;
}

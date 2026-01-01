import api from "@/config/axios";

// ============ Types ============

export type PriorityReason = "ELDERLY" | "PREGNANT" | "DISABILITY" | "EMERGENCY" | null;

export interface WalkInRequest {
  patientId: string;
  doctorId: string;
  reason?: string;
  priorityReason?: PriorityReason;
}

export interface QueueItem {
  id: string;
  patient?: {
    id: string;
    fullName: string;
  };
  doctor?: {
    id: string;
    fullName: string;
    department?: string;
  };
  // Snapshot fields from backend (use as fallback when patient/doctor objects are empty)
  patientName?: string;
  doctorName?: string;
  doctorDepartment?: string;
  queueNumber: number;
  priority: number;
  priorityReason?: string;
  status: "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  appointmentTime: string;
  reason?: string;
  type: "WALK_IN" | "SCHEDULED" | "FOLLOW_UP" | "EMERGENCY";
  createdAt: string;
}

// ============ Queue Service ============

/**
 * Register a walk-in patient.
 * Creates an immediate appointment with queue number.
 */
export async function registerWalkIn(request: WalkInRequest) {
  const response = await api.post("/appointments/walk-in", request);
  return response.data.data;
}

/**
 * Get today's queue for a specific doctor.
 * Returns appointments ordered by priority and queue number.
 */
export async function getDoctorQueue(doctorId: string): Promise<QueueItem[]> {
  const response = await api.get(`/appointments/queue/doctor/${doctorId}`);
  return response.data.data || [];
}

/**
 * Get all queues for today across all doctors.
 * Used by receptionist to see entire waiting room.
 */
export async function getAllQueues(): Promise<QueueItem[]> {
  const response = await api.get("/appointments/queue/all");
  return response.data.data || [];
}

/**
 * Get next patient in queue for a doctor.
 */
export async function getNextInQueue(doctorId: string): Promise<QueueItem | null> {
  const response = await api.get(`/appointments/queue/next/${doctorId}`);
  return response.data.data || null;
}

/**
 * Call next patient (mark as IN_PROGRESS).
 */
export async function callNextPatient(doctorId: string): Promise<QueueItem | null> {
  const response = await api.patch(`/appointments/queue/call-next/${doctorId}`);
  return response.data.data || null;
}

/**
 * Complete an appointment.
 */
export async function completeAppointment(appointmentId: string) {
  const response = await api.patch(`/appointments/${appointmentId}/complete`);
  return response.data.data;
}

/**
 * Cancel an appointment.
 */
export async function cancelAppointment(appointmentId: string, cancelReason: string) {
  const response = await api.patch(`/appointments/${appointmentId}/cancel`, {
    cancelReason,
  });
  return response.data.data;
}

// Priority helpers
export function getPriorityLabel(priority: number): string {
  if (priority <= 10) return "Cấp cứu";
  if (priority <= 50) return "Ưu tiên";
  return "Bình thường";
}

export function getPriorityColor(priority: number): string {
  if (priority <= 10) return "bg-red-100 text-red-800";
  if (priority <= 70) return "bg-yellow-100 text-yellow-800";
  return "bg-gray-100 text-gray-800";
}

export function getPriorityReasonLabel(reason?: string): string {
  if (!reason) return "";
  const labels: Record<string, string> = {
    EMERGENCY: "Cấp cứu",
    ELDERLY: "Người cao tuổi",
    PREGNANT: "Thai phụ",
    DISABILITY: "Người khuyết tật",
  };
  return labels[reason] || reason;
}

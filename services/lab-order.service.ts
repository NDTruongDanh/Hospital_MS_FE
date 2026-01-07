import api from "@/config/axios";

// ============ Types ============

export type LabOrderStatus = "ORDERED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
export type OrderPriority = "NORMAL" | "URGENT";

export interface LabOrderRequest {
  medicalExamId: string;
  labTestIds: string[];
  priority?: OrderPriority;
  notes?: string;
  patientId?: string;
  patientName?: string;
  orderingDoctorId?: string;
  orderingDoctorName?: string;
}

export interface LabOrderUpdateRequest {
  status?: LabOrderStatus;
  priority?: OrderPriority;
  notes?: string;
}

export interface LabOrderResponse {
  id: string;
  orderNumber: string;
  medicalExamId: string;
  patientId: string;
  patientName: string;
  orderingDoctorId: string;
  orderingDoctorName: string;
  orderDate: string;
  status: LabOrderStatus;
  priority: OrderPriority;
  notes?: string;
  results: LabTestResultInOrder[];
  totalTests: number;
  completedTests: number;
  pendingTests: number;
  createdAt: string;
  updatedAt: string;
}

export interface LabTestResultInOrder {
  id: string;
  labTestId: string;
  labTestCode: string;
  labTestName: string;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "CANCELLED";
  resultValue?: string;
  isAbnormal: boolean;
  interpretation?: string;
  notes?: string;
  performedBy?: string;
  performedAt?: string;
  completedAt?: string;
  images?: Array<{
    id: string;
    fileName: string;
    downloadUrl?: string;
    thumbnailUrl?: string;
    imageType?: string;
    description?: string;
  }>;
}

// ============ Lab Order Service ============

/**
 * Get all lab orders with pagination
 */
export async function getLabOrders(params?: {
  page?: number;
  size?: number;
}): Promise<{ content: LabOrderResponse[]; totalElements: number; totalPages: number }> {
  const response = await api.get("/exams/lab-orders/all", { params });
  return response.data.data || { content: [], totalElements: 0, totalPages: 0 };
}

/**
 * Get lab order by ID
 */
export async function getLabOrder(id: string): Promise<LabOrderResponse> {
  const response = await api.get(`/exams/lab-orders/${id}`);
  return response.data.data;
}

/**
 * Get lab orders for a medical exam
 */
export async function getLabOrdersByExam(examId: string): Promise<LabOrderResponse[]> {
  const response = await api.get(`/exams/lab-orders/exam/${examId}`);
  return response.data.data || [];
}

/**
 * Get lab orders for a patient
 */
export async function getLabOrdersByPatient(patientId: string): Promise<LabOrderResponse[]> {
  const response = await api.get(`/exams/lab-orders/patient/${patientId}`);
  return response.data.data || [];
}

/**
 * Get lab orders created by a specific doctor
 */
export async function getLabOrdersByDoctor(doctorId: string): Promise<LabOrderResponse[]> {
  const response = await api.get(`/exams/lab-orders/doctor/${doctorId}`);
  return response.data.data || [];
}

/**
 * Create a new lab order with multiple tests
 */
export async function createLabOrder(request: LabOrderRequest): Promise<LabOrderResponse> {
  const response = await api.post("/exams/lab-orders", request);
  return response.data.data;
}

/**
 * Update lab order status/priority
 */
export async function updateLabOrder(
  id: string,
  request: LabOrderUpdateRequest
): Promise<LabOrderResponse> {
  const response = await api.put(`/exams/lab-orders/${id}`, request);
  return response.data.data;
}

/**
 * Cancel a lab order
 */
export async function cancelLabOrder(id: string): Promise<void> {
  await api.delete(`/exams/lab-orders/${id}`);
}

// ============ Helper Functions ============

export function getOrderStatusLabel(status: LabOrderStatus): string {
  const labels: Record<LabOrderStatus, string> = {
    ORDERED: "Đã yêu cầu",
    IN_PROGRESS: "Đang thực hiện",
    COMPLETED: "Hoàn thành",
    CANCELLED: "Đã hủy",
  };
  return labels[status];
}

export function getOrderStatusColor(status: LabOrderStatus): string {
  const colors: Record<LabOrderStatus, string> = {
    ORDERED: "bg-blue-100 text-blue-800",
    IN_PROGRESS: "bg-yellow-100 text-yellow-800",
    COMPLETED: "bg-green-100 text-green-800",
    CANCELLED: "bg-red-100 text-red-800",
  };
  return colors[status];
}

export function getPriorityLabel(priority: OrderPriority): string {
  const labels: Record<OrderPriority, string> = {
    NORMAL: "Bình thường",
    URGENT: "Khẩn cấp",
  };
  return labels[priority];
}

export function getPriorityColorOrder(priority: OrderPriority): string {
  const colors: Record<OrderPriority, string> = {
    NORMAL: "bg-gray-100 text-gray-800",
    URGENT: "bg-orange-100 text-orange-800",
  };
  return colors[priority];
}

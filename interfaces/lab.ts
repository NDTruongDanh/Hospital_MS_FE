/**
 * Lab Test and Lab Result Interfaces
 * Comprehensive type definitions for lab tests, results, orders, and diagnostic images
 */

// ==================== Enums & Status Types ====================

export type LabTestCategory = "LAB" | "IMAGING" | "PATHOLOGY";

export type ResultStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "CANCELLED";

export type LabOrderStatus = "ORDERED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";

export type OrderPriority = "ROUTINE" | "NORMAL" | "URGENT" | "STAT";

export type ImageType = 
  | "XRAY" 
  | "CT_SCAN" 
  | "MRI" 
  | "ULTRASOUND" 
  | "ENDOSCOPY" 
  | "PATHOLOGY_SLIDE" 
  | "PHOTO";

// ==================== Lab Test Types ====================

export interface LabTest {
  id: string;
  code: string;
  name: string;
  category: LabTestCategory;
  description?: string;
  price: number;
  unit?: string;
  normalRange?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LabTestCreateRequest {
  code: string;
  name: string;
  category: LabTestCategory;
  description?: string;
  price: number;
  unit?: string;
  normalRange?: string;
  isActive?: boolean;
}

// ==================== Diagnostic Image Types ====================

export interface DiagnosticImage {
  id: string;
  labTestResultId: string;
  fileName: string;
  storagePath: string;
  contentType: string;
  fileSize: number;
  thumbnailPath?: string;
  imageType: ImageType;
  description?: string;
  sequenceNumber: number;
  uploadedBy?: string;
  createdAt: string;
  downloadUrl?: string;
  thumbnailUrl?: string;
}

// ==================== Lab Test Result Types ====================

export interface LabTestResult {
  id: string;
  medicalExamId: string;
  labTestId: string;
  patientId: string;
  patientName: string;
  labTestCode: string;
  labTestName: string;
  labTestCategory: LabTestCategory;
  resultValue?: string;
  status: ResultStatus;
  isAbnormal: boolean;
  interpretation?: string;
  notes?: string;
  performedBy?: string;
  interpretedBy?: string;
  performedAt?: string;
  completedAt?: string;
  images: DiagnosticImage[];
  createdAt: string;
  updatedAt: string;
}

export interface LabTestResultCreateRequest {
  medicalExamId: string;
  labTestId: string;
  resultValue?: string;
  isAbnormal?: boolean;
  interpretation?: string;
  notes?: string;
  performedBy?: string;
}

export interface LabTestResultUpdateRequest {
  resultValue?: string;
  status?: ResultStatus;
  isAbnormal?: boolean;
  interpretation?: string;
  notes?: string;
  performedBy?: string;
  interpretedBy?: string;
}

// ==================== Lab Order Types ====================

/**
 * Lab Order - Groups multiple lab test results together
 */
export interface LabOrder {
  id: string;
  orderNumber: string;
  medicalExamId: string;
  
  // Patient info
  patientId: string;
  patientName: string;
  
  // Doctor info
  orderingDoctorId?: string;
  orderingDoctorName?: string;
  
  orderDate: string;
  status: LabOrderStatus;
  priority: OrderPriority;
  notes?: string;
  
  // Test results
  results: LabTestResult[];
  
  // Summary info
  totalTests: number;
  completedTests: number;
  pendingTests: number;
  
  // Audit
  createdAt: string;
  updatedAt: string;
}

/**
 * Create a new lab order with multiple tests
 */
export interface LabOrderCreateRequest {
  medicalExamId: string;
  labTestIds: string[]; // List of LabTest IDs to order
  priority?: OrderPriority;
  notes?: string;
  
  // Optional - can be provided or fetched from exam
  patientId?: string;
  patientName?: string;
  orderingDoctorId?: string;
  orderingDoctorName?: string;
}

/**
 * Update lab order status or priority
 */
export interface LabOrderUpdateRequest {
  status?: LabOrderStatus;
  priority?: OrderPriority;
  notes?: string;
}

/**
 * Lab Test Service
 * Handles API calls for lab tests and lab test results
 */

import axiosInstance from "@/config/axios";

const BASE_URL_LAB_TESTS = "/exams/lab-tests";
const BASE_URL_LAB_RESULTS = "/exams/lab-results";

// ============ Types ============

export type LabTestCategory = "LAB" | "IMAGING" | "PATHOLOGY";
export type ResultStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "CANCELLED";
export type ImageType =
  | "XRAY"
  | "CT_SCAN"
  | "MRI"
  | "ULTRASOUND"
  | "ENDOSCOPY"
  | "PATHOLOGY_SLIDE"
  | "PHOTO";

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

// ============ Lab Tests API ============

export const labTestService = {
  /**
   * Get all lab tests (paginated)
   */
  async getAll(params?: { page?: number; size?: number; filter?: string }) {
    const response = await axiosInstance.get(`${BASE_URL_LAB_TESTS}/all`, {
      params,
    });
    return response.data.data;
  },

  /**
   * Get active lab tests (for dropdowns)
   */
  async getActive(): Promise<LabTest[]> {
    const response = await axiosInstance.get(`${BASE_URL_LAB_TESTS}/active`);
    return response.data.data;
  },

  /**
   * Get lab tests by category
   */
  async getByCategory(category: LabTestCategory): Promise<LabTest[]> {
    const response = await axiosInstance.get(
      `${BASE_URL_LAB_TESTS}/category/${category}`
    );
    return response.data.data;
  },

  /**
   * Get lab test by ID
   */
  async getById(id: string): Promise<LabTest> {
    const response = await axiosInstance.get(`${BASE_URL_LAB_TESTS}/${id}`);
    return response.data.data;
  },

  /**
   * Create new lab test (ADMIN only)
   */
  async create(data: LabTestCreateRequest): Promise<LabTest> {
    const response = await axiosInstance.post(BASE_URL_LAB_TESTS, data);
    return response.data.data;
  },

  /**
   * Update lab test (ADMIN only)
   */
  async update(
    id: string,
    data: Partial<LabTestCreateRequest>
  ): Promise<LabTest> {
    const response = await axiosInstance.put(
      `${BASE_URL_LAB_TESTS}/${id}`,
      data
    );
    return response.data.data;
  },

  /**
   * Delete/deactivate lab test (ADMIN only)
   */
  async delete(id: string): Promise<void> {
    await axiosInstance.delete(`${BASE_URL_LAB_TESTS}/${id}`);
  },
};

// ============ Lab Results API ============

export const labResultService = {
  /**
   * Get all lab results (paginated)
   */
  async getAll(params?: { page?: number; size?: number }) {
    const response = await axiosInstance.get(`${BASE_URL_LAB_RESULTS}/all`, {
      params,
    });
    return response.data.data;
  },

  /**
   * Get lab result by ID
   */
  async getById(id: string): Promise<LabTestResult> {
    const response = await axiosInstance.get(`${BASE_URL_LAB_RESULTS}/${id}`);
    return response.data.data;
  },

  /**
   * Get results for a medical exam
   */
  async getByExam(examId: string): Promise<LabTestResult[]> {
    const response = await axiosInstance.get(
      `${BASE_URL_LAB_RESULTS}/exam/${examId}`
    );
    return response.data.data;
  },

  /**
   * Get results for a patient
   */
  async getByPatient(patientId: string): Promise<LabTestResult[]> {
    const response = await axiosInstance.get(
      `${BASE_URL_LAB_RESULTS}/patient/${patientId}`
    );
    return response.data.data;
  },

  /**
   * Order a new lab test
   */
  async create(data: LabTestResultCreateRequest): Promise<LabTestResult> {
    const response = await axiosInstance.post(BASE_URL_LAB_RESULTS, data);
    return response.data.data;
  },

  /**
   * Update lab result
   */
  async update(
    id: string,
    data: LabTestResultUpdateRequest
  ): Promise<LabTestResult> {
    const response = await axiosInstance.put(
      `${BASE_URL_LAB_RESULTS}/${id}`,
      data
    );
    return response.data.data;
  },

  /**
   * Upload images for a lab result
   */
  async uploadImages(
    resultId: string,
    files: File[],
    imageType: ImageType = "PHOTO",
    description?: string
  ): Promise<DiagnosticImage[]> {
    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));
    formData.append("imageType", imageType);
    if (description) {
      formData.append("description", description);
    }

    const response = await axiosInstance.post(
      `${BASE_URL_LAB_RESULTS}/${resultId}/images`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data.data;
  },

  /**
   * Get images for a lab result
   */
  async getImages(resultId: string): Promise<DiagnosticImage[]> {
    const response = await axiosInstance.get(
      `${BASE_URL_LAB_RESULTS}/${resultId}/images`
    );
    return response.data.data;
  },

  /**
   * Delete an image
   */
  async deleteImage(imageId: string): Promise<void> {
    await axiosInstance.delete(`${BASE_URL_LAB_RESULTS}/images/${imageId}`);
  },
};

export default { labTestService, labResultService };

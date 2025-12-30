/**
 * Lab Test Service
 * Handles API calls for lab tests, lab test results, and lab orders
 */

import axiosInstance from "@/config/axios";
import type {
  LabTest,
  LabTestCreateRequest,
  LabTestCategory,
  DiagnosticImage,
  LabTestResult,
  LabTestResultCreateRequest,
  LabTestResultUpdateRequest,
  ImageType,
  LabOrder,
  LabOrderCreateRequest,
  LabOrderUpdateRequest,
} from "@/interfaces/lab";

const BASE_URL_LAB_TESTS = "/exams/lab-tests";
const BASE_URL_LAB_RESULTS = "/exams/lab-results";
const BASE_URL_LAB_ORDERS = "/exams/lab-orders";

// ============ Lab Tests API ============

export const labTestService = {
  /**
   * Get all lab tests (paginated)
   */
  async getAll(params?: { page?: number; size?: number; filter?: string }) {
    const response = await axiosInstance.get(`${BASE_URL_LAB_TESTS}/all`, { params });
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
    const response = await axiosInstance.get(`${BASE_URL_LAB_TESTS}/category/${category}`);
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
   * Get lab test by code
   */
  async getByCode(code: string): Promise<LabTest> {
    const response = await axiosInstance.get(`${BASE_URL_LAB_TESTS}/code/${code}`);
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
  async update(id: string, data: Partial<LabTestCreateRequest>): Promise<LabTest> {
    const response = await axiosInstance.put(`${BASE_URL_LAB_TESTS}/${id}`, data);
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
    const response = await axiosInstance.get(`${BASE_URL_LAB_RESULTS}/all`, { params });
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
    const response = await axiosInstance.get(`${BASE_URL_LAB_RESULTS}/exam/${examId}`);
    return response.data.data;
  },

  /**
   * Get results for a patient
   */
  async getByPatient(patientId: string): Promise<LabTestResult[]> {
    const response = await axiosInstance.get(`${BASE_URL_LAB_RESULTS}/patient/${patientId}`);
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
  async update(id: string, data: LabTestResultUpdateRequest): Promise<LabTestResult> {
    const response = await axiosInstance.put(`${BASE_URL_LAB_RESULTS}/${id}`, data);
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
    const response = await axiosInstance.get(`${BASE_URL_LAB_RESULTS}/${resultId}/images`);
    return response.data.data;
  },

  /**
   * Delete an image
   */
  async deleteImage(imageId: string): Promise<void> {
    await axiosInstance.delete(`${BASE_URL_LAB_RESULTS}/images/${imageId}`);
  },

  /**
   * Download an image (proxy through API Gateway)
   */
  async downloadImage(imageId: string): Promise<Blob> {
    const response = await axiosInstance.get(
      `${BASE_URL_LAB_RESULTS}/images/${imageId}/download`,
      {
        responseType: "blob",
      }
    );
    return response.data;
  },
};

// ============ Lab Orders API ============

export const labOrderService = {
  /**
   * Get all lab orders (paginated)
   */
  async getAll(params?: { page?: number; size?: number }) {
    const response = await axiosInstance.get(`${BASE_URL_LAB_ORDERS}/all`, { params });
    return response.data.data;
  },

  /**
   * Get lab order by ID
   */
  async getById(id: string): Promise<LabOrder> {
    const response = await axiosInstance.get(`${BASE_URL_LAB_ORDERS}/${id}`);
    return response.data.data;
  },

  /**
   * Get orders for a medical exam
   */
  async getByExam(examId: string): Promise<LabOrder[]> {
    const response = await axiosInstance.get(`${BASE_URL_LAB_ORDERS}/exam/${examId}`);
    return response.data.data;
  },

  /**
   * Get orders for a patient
   */
  async getByPatient(patientId: string): Promise<LabOrder[]> {
    const response = await axiosInstance.get(`${BASE_URL_LAB_ORDERS}/patient/${patientId}`);
    return response.data.data;
  },

  /**
   * Create a new lab order with multiple tests
   */
  async create(data: LabOrderCreateRequest): Promise<LabOrder> {
    const response = await axiosInstance.post(BASE_URL_LAB_ORDERS, data);
    return response.data.data;
  },

  /**
   * Update lab order status/priority
   */
  async update(id: string, data: LabOrderUpdateRequest): Promise<LabOrder> {
    const response = await axiosInstance.put(`${BASE_URL_LAB_ORDERS}/${id}`, data);
    return response.data.data;
  },

  /**
   * Cancel a lab order
   */
  async cancel(id: string): Promise<void> {
    await axiosInstance.delete(`${BASE_URL_LAB_ORDERS}/${id}`);
  },

  /**
   * Auto-group existing ungrouped results into orders
   * Useful for migrating existing data
   */
  async autoGroup(): Promise<number> {
    const response = await axiosInstance.post(`${BASE_URL_LAB_ORDERS}/auto-group`);
    return response.data.data; // Returns count of orders created
  },
};

export default { labTestService, labResultService, labOrderService };

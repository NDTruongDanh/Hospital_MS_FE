import {
  Invoice,
  Payment,
  GenerateInvoiceRequest,
  PaymentInitRequest,
  PaymentInitResponse,
  PaymentsByInvoiceResponse,
} from "@/interfaces/billing";
import api from "@/config/axios";

// ==================== Invoice APIs ====================

// Generate invoice (internal - triggered by prescription creation)
export const generateInvoice = async (data: GenerateInvoiceRequest) =>
  api.post<{ code: number; data: Invoice }>(`/invoices/generate`, data);

// Get invoice by ID
export const getInvoiceById = async (id: string) =>
  api.get<{ code: number; data: Invoice }>(`/invoices/${id}`);

// Get invoice by appointment
export const getInvoiceByAppointment = async (appointmentId: string) =>
  api.get<{ code: number; data: Invoice }>(
    `/invoices/by-appointment/${appointmentId}`
  );

// Get invoice by medical exam
export const getInvoiceByExam = async (examId: string) =>
  api.get<{ code: number; data: Invoice }>(`/invoices/by-exam/${examId}`);

export type InvoiceListParams = {
  patientId?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  size?: number;
  sort?: string;
  search?: string;
};

// Page response type from BE
export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

// List invoices (admin)
export const getInvoiceList = async (params?: InvoiceListParams) =>
  api.get<{ code: number; data: PageResponse<Invoice> }>(`/invoices/all`, { params });

// Get patient invoices (by patient ID - staff use)
export const getPatientInvoices = async (
  patientId: string,
  params?: { status?: string; page?: number; size?: number }
) => api.get(`/invoices/by-patient/${patientId}`, { params });

// Get my invoices (patient self-service - uses JWT)
export const getMyInvoices = async (status?: string) => 
  api.get<{ code: number; data: Invoice[] }>(`/invoices/my`, { 
    params: status ? { status } : undefined 
  });

// Cancel invoice
export const cancelInvoice = async (
  id: string,
  data: { cancelReason: string }
) => api.post<{ code: number; data: Invoice }>(`/invoices/${id}/cancel`, data);

// ==================== Payment APIs ====================

// Initialize VNPay payment - returns redirect URL
export const initPayment = async (data: PaymentInitRequest) =>
  api.post<{ code: number; data: PaymentInitResponse }>(`/payments/init`, data);

// Record cash payment
export const createCashPayment = async (
  invoiceId: string,
  amount?: number,
  notes?: string
) => {
  const params = new URLSearchParams();
  if (amount) params.append("amount", amount.toString());
  if (notes) params.append("notes", notes);
  return api.post<{ code: number; data: Payment }>(
    `/payments/${invoiceId}/cash?${params.toString()}`
  );
};

// Get payment by ID
export const getPaymentById = async (id: string) =>
  api.get<{ code: number; data: Payment }>(`/payments/${id}`);

// Get payments by invoice (with summary)
export const getPaymentsByInvoice = async (invoiceId: string) =>
  api.get<{ code: number; data: PaymentsByInvoiceResponse }>(
    `/payments/by-invoice/${invoiceId}`
  );

// Verify VNPay return (call from FE to verify payment after redirect)
export const verifyVNPayReturn = async (params: Record<string, string>) => {
  const searchParams = new URLSearchParams(params);
  return api.get<{ code: number; data: Payment }>(
    `/payments/vnpay-return?${searchParams.toString()}`
  );
};

// ==================== Summary APIs (for dashboard) ====================

export interface InvoiceSummary {
  totalInvoices: number;
  totalAmount: number;
  unpaidCount: number;
  unpaidAmount: number;
  overdueCount: number;
  overdueAmount: number;
  collectedThisMonth: number;
}

export interface PaymentSummaryCards {
  todayAmount: number;
  todayCount: number;
  thisWeekAmount: number;
  thisWeekCount: number;
  cashAmount: number;
  cashPercentage: number;
  cardAmount: number;
  cardPercentage: number;
}

// Note: These endpoints may not be implemented in BE yet
export const getInvoiceSummary = async (): Promise<InvoiceSummary> => {
  const response = await api.get<{ data: InvoiceSummary }>(
    "/invoices/summary"
  );
  return response.data.data;
};

export const getPaymentSummaryCards =
  async (): Promise<PaymentSummaryCards> => {
    const response = await api.get<{ data: PaymentSummaryCards }>(
      "/payments/summary-cards"
    );
    return response.data.data;
  };

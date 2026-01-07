// Revenue Report Types
export interface RevenueReportParams {
  startDate: string;
  endDate: string;
  departmentId?: string;
  paymentMethod?: string;
}

export interface InvoiceCount {
  total: number;
  paid: number;
  unpaid: number;
  overdue: number;
}

export interface RevenueByPaymentMethod {
  method: string;
  amount: number;
  percentage?: number;
}

export interface RevenueReport {
  totalRevenue: number;
  paidRevenue: number;
  unpaidRevenue: number;
  invoiceCount: InvoiceCount;
  collectionRate: number;
  revenueByPaymentMethod: RevenueByPaymentMethod[];
  generatedAt: string;
  cached: boolean;
  cacheExpiresAt?: string;
}

// Appointment Statistics Types
export interface AppointmentStatsParams {
  startDate: string;
  endDate: string;
  departmentId?: string;
  doctorId?: string;
}

export interface AppointmentsByStatus {
  status: string;
  count: number;
  percentage?: number;
}

export interface AppointmentsByType {
  type: string;
  count: number;
}

export interface AppointmentsByDepartment {
  departmentId: string;
  departmentName: string;
  count: number;
}

export interface DailyTrend {
  date: string;
  count: number;
}

export interface AppointmentStats {
  totalAppointments: number;
  completedCount?: number;
  cancelledCount?: number;
  noShowCount?: number;
  completionRate?: number;
  noShowRate?: number;
  appointmentsByStatus: AppointmentsByStatus[];
  appointmentsByType: AppointmentsByType[];
  appointmentsByDepartment: AppointmentsByDepartment[];
  dailyTrend: DailyTrend[];
  generatedAt: string;
  cached: boolean;
}

// Doctor Performance Types
export interface DoctorPerformanceParams {
  startDate: string;
  endDate: string;
  departmentId?: string;
  sortBy?: "completionRate" | "patientsSeen" | "totalRevenue";
}

export interface DoctorStatistics {
  appointmentsCompleted: number;
  appointmentsTotal: number;
  completionRate: number;
  totalRevenue: number;
  patientsSeen: number;
  prescriptionsWritten: number;
  avgConsultationTime: number;
}

export interface DoctorPerformanceItem {
  doctorId: string;
  doctorName: string;
  departmentId: string;
  departmentName: string;
  specialization?: string;
  statistics: DoctorStatistics;
}

export interface DoctorPerformance {
  doctors: DoctorPerformanceItem[];
  summary?: {
    totalDoctors: number;
    avgCompletionRate: number;
    totalPatientsSeen: number;
    totalRevenue: number;
  };
  generatedAt: string;
  cached: boolean;
}

// Patient Activity Types
export interface PatientActivityParams {
  startDate: string;
  endDate: string;
  status?: string;
}

export interface PatientsByGender {
  gender: string;
  count: number;
  percentage?: number;
}

export interface PatientsByBloodType {
  bloodType: string;
  count: number;
  percentage?: number;
}

export interface TopDiagnosis {
  diagnosis: string;
  icdCode: string;
  count: number;
  percentage?: number;
}

export interface RegistrationTrend {
  date: string;
  newPatients: number;
  visits?: number;
}

export interface PatientActivity {
  totalPatients: number;
  newPatients: number;
  activePatients: number;
  returningPatients?: number;
  patientsByGender: PatientsByGender[];
  patientsByBloodType: PatientsByBloodType[];
  topDiagnoses: TopDiagnosis[];
  registrationTrend?: RegistrationTrend[];
  generatedAt: string;
  cached: boolean;
}

// Dashboard Summary Types
export interface DashboardSummary {
  revenue: {
    total: number;
    trend: number;
  };
  appointments: {
    total: number;
    trend: number;
  };
  doctors: {
    active: number;
    avgCompletion: number;
  };
  patients: {
    total: number;
    newThisMonth: number;
    trend: number;
  };
}

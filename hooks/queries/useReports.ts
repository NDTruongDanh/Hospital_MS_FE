import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { reportsService } from "@/services/reports.service";
import {
  RevenueReport,
  RevenueReportParams,
  AppointmentStats,
  AppointmentStatsParams,
  DoctorPerformance,
  DoctorPerformanceParams,
  PatientActivity,
  PatientActivityParams,
} from "@/interfaces/reports";

// Query keys
export const reportKeys = {
  all: ["reports"] as const,
  revenue: (params: RevenueReportParams) =>
    ["reports", "revenue", params] as const,
  appointments: (params: AppointmentStatsParams) =>
    ["reports", "appointments", params] as const,
  doctorPerformance: (params: DoctorPerformanceParams) =>
    ["reports", "doctors", "performance", params] as const,
  patientActivity: (params: PatientActivityParams) =>
    ["reports", "patients", "activity", params] as const,
};

// Stale time: 12 hours (matches backend cache TTL)
const STALE_TIME = 12 * 60 * 60 * 1000;

// Revenue Report Hook
export function useRevenueReport(params: RevenueReportParams) {
  return useQuery<RevenueReport>({
    queryKey: reportKeys.revenue(params),
    queryFn: () => reportsService.getRevenueReport(params),
    enabled: !!params.startDate && !!params.endDate,
    staleTime: STALE_TIME,
  });
}

// Appointment Statistics Hook
export function useAppointmentStats(params: AppointmentStatsParams) {
  return useQuery<AppointmentStats>({
    queryKey: reportKeys.appointments(params),
    queryFn: () => reportsService.getAppointmentStats(params),
    enabled: !!params.startDate && !!params.endDate,
    staleTime: STALE_TIME,
  });
}

// Doctor Performance Hook
export function useDoctorPerformance(params: DoctorPerformanceParams) {
  return useQuery<DoctorPerformance>({
    queryKey: reportKeys.doctorPerformance(params),
    queryFn: () => reportsService.getDoctorPerformance(params),
    enabled: !!params.startDate && !!params.endDate,
    staleTime: STALE_TIME,
  });
}

// Patient Activity Hook
export function usePatientActivity(params: PatientActivityParams) {
  return useQuery<PatientActivity>({
    queryKey: reportKeys.patientActivity(params),
    queryFn: () => reportsService.getPatientActivity(params),
    // Backend /reports/patients doesn't require date params, always enabled
    enabled: true,
    staleTime: STALE_TIME,
  });
}

// Clear Cache Mutation
export function useClearReportCache() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => reportsService.clearCache(),
    onSuccess: () => {
      // Invalidate all report queries
      queryClient.invalidateQueries({ queryKey: reportKeys.all });
    },
  });
}

// Dashboard - parallel queries hook
export function useDashboardReports(startDate: string, endDate: string) {
  const params = { startDate, endDate };

  const revenueQuery = useRevenueReport(params);
  const appointmentsQuery = useAppointmentStats(params);
  const doctorsQuery = useDoctorPerformance(params);
  const patientsQuery = usePatientActivity(params);

  return {
    revenue: revenueQuery,
    appointments: appointmentsQuery,
    doctors: doctorsQuery,
    patients: patientsQuery,
    isLoading:
      revenueQuery.isLoading ||
      appointmentsQuery.isLoading ||
      doctorsQuery.isLoading ||
      patientsQuery.isLoading,
    isError:
      revenueQuery.isError ||
      appointmentsQuery.isError ||
      doctorsQuery.isError ||
      patientsQuery.isError,
  };
}

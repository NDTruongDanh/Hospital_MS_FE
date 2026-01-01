/**
 * UI Mappings and Constants
 *
 * Centralized configuration for status badges, colors, and UI patterns
 * across the application. This ensures consistency and makes it easy to
 * update UI patterns globally.
 */

import {
  Clock,
  Check,
  X,
  AlertTriangle,
  Circle,
  DollarSign,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

// ============================================================================
// APPOINTMENT STATUS
// ============================================================================

export const APPOINTMENT_STATUS = {
  SCHEDULED: "SCHEDULED",
  IN_PROGRESS: "IN_PROGRESS",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
  NO_SHOW: "NO_SHOW",
} as const;

export type AppointmentStatus = keyof typeof APPOINTMENT_STATUS;

export interface StatusConfig {
  variant:
    | "success"
    | "warning"
    | "info"
    | "destructive"
    | "gray"
    | "purple"
    | "cyan"
    | "orange"
    | "amber"
    | "emerald";
  label: string;
  icon?: LucideIcon;
}

export const APPOINTMENT_STATUS_CONFIG: Record<
  AppointmentStatus,
  StatusConfig
> = {
  SCHEDULED: {
    variant: "info",
    label: "Đã lên lịch",
    icon: Clock,
  },
  IN_PROGRESS: {
    variant: "purple",
    label: "Đang khám",
    icon: Clock,
  },
  COMPLETED: {
    variant: "success",
    label: "Hoàn thành",
    icon: Check,
  },
  CANCELLED: {
    variant: "destructive",
    label: "Đã hủy",
    icon: X,
  },
  NO_SHOW: {
    variant: "warning",
    label: "Không đến",
    icon: AlertTriangle,
  },
};

// ============================================================================
// INVOICE/BILLING STATUS
// ============================================================================

export const INVOICE_STATUS = {
  UNPAID: "UNPAID",
  PARTIALLY_PAID: "PARTIALLY_PAID",
  PAID: "PAID",
  OVERDUE: "OVERDUE",
  CANCELLED: "CANCELLED",
} as const;

export type InvoiceStatus = keyof typeof INVOICE_STATUS;

export const INVOICE_STATUS_CONFIG: Record<InvoiceStatus, StatusConfig> = {
  UNPAID: {
    variant: "destructive",
    label: "Chưa thanh toán",
    icon: Circle,
  },
  PARTIALLY_PAID: {
    variant: "warning",
    label: "Thanh toán một phần",
    icon: Circle,
  },
  PAID: {
    variant: "success",
    label: "Đã thanh toán",
    icon: Check,
  },
  OVERDUE: {
    variant: "orange",
    label: "Quá hạn",
    icon: AlertTriangle,
  },
  CANCELLED: {
    variant: "gray",
    label: "Đã hủy",
    icon: X,
  },
};

// ============================================================================
// CHARGE TYPE
// ============================================================================

export const CHARGE_TYPE = {
  CONSULTATION: "CONSULTATION",
  MEDICINE: "MEDICINE",
  TEST: "TEST",
  OTHER: "OTHER",
} as const;

export type ChargeType = keyof typeof CHARGE_TYPE;

export const CHARGE_TYPE_CONFIG: Record<ChargeType, StatusConfig> = {
  CONSULTATION: {
    variant: "purple",
    label: "Khám bệnh",
  },
  MEDICINE: {
    variant: "info",
    label: "Thuốc",
  },
  TEST: {
    variant: "cyan",
    label: "Xét nghiệm",
  },
  OTHER: {
    variant: "gray",
    label: "Khác",
  },
};

// ============================================================================
// PAYMENT METHOD
// ============================================================================

export const PAYMENT_METHOD = {
  CASH: "CASH",
  CREDIT_CARD: "CREDIT_CARD",
  BANK_TRANSFER: "BANK_TRANSFER",
  INSURANCE: "INSURANCE",
} as const;

export type PaymentMethod = keyof typeof PAYMENT_METHOD;

export const PAYMENT_METHOD_CONFIG: Record<PaymentMethod, StatusConfig> = {
  CASH: {
    variant: "success",
    label: "Tiền mặt",
    icon: DollarSign,
  },
  CREDIT_CARD: {
    variant: "info",
    label: "Thẻ tín dụng",
  },
  BANK_TRANSFER: {
    variant: "purple",
    label: "Chuyển khoản",
  },
  INSURANCE: {
    variant: "cyan",
    label: "Bảo hiểm",
  },
};

// ============================================================================
// USER ROLES
// ============================================================================

export const USER_ROLE = {
  ADMIN: "ADMIN",
  DOCTOR: "DOCTOR",
  NURSE: "NURSE",
  RECEPTIONIST: "RECEPTIONIST",
  PATIENT: "PATIENT",
} as const;

export type UserRole = keyof typeof USER_ROLE;

export const USER_ROLE_CONFIG: Record<UserRole, StatusConfig> = {
  ADMIN: {
    variant: "purple",
    label: "Quản trị viên",
  },
  DOCTOR: {
    variant: "info",
    label: "Bác sĩ",
  },
  NURSE: {
    variant: "success",
    label: "Y tá",
  },
  RECEPTIONIST: {
    variant: "amber",
    label: "Lễ tân",
  },
  PATIENT: {
    variant: "gray",
    label: "Bệnh nhân",
  },
};

// ============================================================================
// SCHEDULE STATUS
// ============================================================================

export const SCHEDULE_STATUS = {
  AVAILABLE: "AVAILABLE",
  BOOKED: "BOOKED",
  CANCELLED: "CANCELLED",
} as const;

export type ScheduleStatus = keyof typeof SCHEDULE_STATUS;

export const SCHEDULE_STATUS_CONFIG: Record<ScheduleStatus, StatusConfig> = {
  AVAILABLE: {
    variant: "emerald",
    label: "Còn trống",
  },
  BOOKED: {
    variant: "info",
    label: "Đã đặt",
  },
  CANCELLED: {
    variant: "destructive",
    label: "Đã hủy",
  },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get appointment status badge configuration
 * @param status - The appointment status
 * @returns Status configuration object
 */
export function getAppointmentStatusConfig(status: string): StatusConfig {
  return (
    APPOINTMENT_STATUS_CONFIG[status as AppointmentStatus] ||
    APPOINTMENT_STATUS_CONFIG.SCHEDULED
  );
}

/**
 * Get invoice status badge configuration
 * @param status - The invoice status
 * @returns Status configuration object
 */
export function getInvoiceStatusConfig(status: string): StatusConfig {
  return (
    INVOICE_STATUS_CONFIG[status as InvoiceStatus] ||
    INVOICE_STATUS_CONFIG.UNPAID
  );
}

/**
 * Get charge type badge configuration
 * @param type - The charge type
 * @returns Status configuration object
 */
export function getChargeTypeConfig(type: string): StatusConfig {
  return CHARGE_TYPE_CONFIG[type as ChargeType] || CHARGE_TYPE_CONFIG.OTHER;
}

/**
 * Get payment method badge configuration
 * @param method - The payment method
 * @returns Status configuration object
 */
export function getPaymentMethodConfig(method: string): StatusConfig {
  return (
    PAYMENT_METHOD_CONFIG[method as PaymentMethod] || PAYMENT_METHOD_CONFIG.CASH
  );
}

/**
 * Get user role badge configuration
 * @param role - The user role
 * @returns Status configuration object
 */
export function getUserRoleConfig(role: string): StatusConfig {
  return USER_ROLE_CONFIG[role as UserRole] || USER_ROLE_CONFIG.PATIENT;
}

/**
 * Get schedule status badge configuration
 * @param status - The schedule status
 * @returns Status configuration object
 */
export function getScheduleStatusConfig(status: string): StatusConfig {
  return (
    SCHEDULE_STATUS_CONFIG[status as ScheduleStatus] ||
    SCHEDULE_STATUS_CONFIG.AVAILABLE
  );
}

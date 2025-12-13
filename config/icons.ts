import {
  Activity,
  AlertCircle,
  BarChart3,
  Briefcase,
  Calendar,
  CalendarClock,
  CheckCircle,
  CheckCircle2,
  Clock,
  CreditCard,
  LayoutDashboard,
  Pill,
  TrendingDown,
  TrendingUp,
  Users,
  UserPlus,
  User,
  XCircle,
} from "lucide-react";

// Centralized Lucide icon mapping to keep visual language consistent
export const NAV_ICONS = {
  dashboard: LayoutDashboard,
  appointments: CalendarClock,
  exams: Activity,
  patients: Users,
  medicines: Pill,
  hr: Briefcase,
  billing: CreditCard,
  reports: BarChart3,
  profile: User,
};

export const ACTION_ICONS = {
  registerPatient: UserPlus,
  newAppointment: Calendar,
  startExam: Activity,
  addMedicine: Pill,
};

export const STATUS_ICONS = {
  appointments: {
    confirmed: CheckCircle2,
    waiting: Clock,
    inProgress: Activity,
    emergency: AlertCircle,
    completed: CheckCircle,
    cancelled: XCircle,
    noShow: AlertCircle,
  },
};

export const TREND_ICONS = {
  up: TrendingUp,
  down: TrendingDown,
};

"use client";

import { Badge } from "@/components/ui/badge";
import { AppointmentType } from "@/interfaces/appointment";
import { Stethoscope, RefreshCcw, Siren, User, CalendarCheck } from "lucide-react";

const typeConfig: Record<
  string,
  { label: string; className: string; icon: React.ReactNode }
> = {
  CONSULTATION: {
    label: "Consultation",
    className: "bg-purple-100 text-purple-800",
    icon: <Stethoscope className="h-3 w-3" />,
  },
  FOLLOW_UP: {
    label: "Follow-up",
    className: "bg-cyan-100 text-cyan-800",
    icon: <RefreshCcw className="h-3 w-3" />,
  },
  EMERGENCY: {
    label: "Emergency",
    className: "bg-orange-100 text-orange-800",
    icon: <Siren className="h-3 w-3" />,
  },
  WALK_IN: {
    label: "Walk-in",
    className: "bg-green-100 text-green-800",
    icon: <User className="h-3 w-3" />,
  },
  SCHEDULED: {
    label: "Scheduled",
    className: "bg-blue-100 text-blue-800",
    icon: <CalendarCheck className="h-3 w-3" />,
  },
};

const defaultConfig = {
  label: "Unknown",
  className: "bg-gray-100 text-gray-800",
  icon: <Stethoscope className="h-3 w-3" />,
};

interface AppointmentTypeBadgeProps {
  type: AppointmentType | string;
}

export function AppointmentTypeBadge({ type }: AppointmentTypeBadgeProps) {
  const config = typeConfig[type] || defaultConfig;

  return (
    <Badge variant="outline" className={`gap-1 ${config.className}`}>
      {config.icon}
      {config.label}
    </Badge>
  );
}

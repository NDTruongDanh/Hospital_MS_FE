"use client";

import { Badge } from "@/components/ui/badge";
import { useMyEmployeeProfile } from "@/hooks/queries/useHr";
import { Skeleton } from "@/components/ui/skeleton";
import { DetailPageHeader } from "@/components/ui/detail-page-header";
import { StatsSummaryBar } from "@/components/ui/stats-summary-bar";
import { InfoItem, InfoGrid } from "@/components/ui/info-item";
import { Card, CardContent } from "@/components/ui/card";
import {
  User,
  Briefcase,
  Phone,
  MapPin,
  Building2,
  Award,
  Stethoscope,
  AlertCircle,
} from "lucide-react";

export default function MyProfilePage() {
  const { data: employee, isLoading, error } = useMyEmployeeProfile();

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-20 w-full rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </div>
    );
  }

  if (error || !employee) {
    return (
      <div className="container mx-auto py-6">
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="flex items-center gap-3 pt-6">
            <AlertCircle className="h-5 w-5 text-amber-600" />
            <div>
              <p className="font-medium text-amber-800">Profile Not Found</p>
              <p className="text-sm text-amber-700">
                Your account is not linked to an employee record. Please contact an administrator.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    const normalized = status?.toLowerCase();
    if (normalized === "active") return "emerald";
    if (normalized === "inactive") return "slate";
    if (normalized === "on leave") return "amber";
    return "slate";
  };

  const getRoleBadge = (role: string) => {
    const roleLabels: Record<string, { label: string; color: string }> = {
      DOCTOR: { label: "Doctor", color: "bg-violet-100 text-violet-700 border-violet-200" },
      NURSE: { label: "Nurse", color: "bg-pink-100 text-pink-700 border-pink-200" },
      RECEPTIONIST: { label: "Receptionist", color: "bg-sky-100 text-sky-700 border-sky-200" },
      ADMIN: { label: "Admin", color: "bg-amber-100 text-amber-700 border-amber-200" },
    };
    const config = roleLabels[role] || { label: role, color: "bg-slate-100 text-slate-600" };
    return (
      <Badge variant="outline" className={config.color}>
        {config.label}
      </Badge>
    );
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <DetailPageHeader
        title={employee.fullName}
        backHref="/doctor/appointments"
        theme="violet"
        avatar={{
          initials: employee.fullName.charAt(0).toUpperCase(),
          src: employee.profileImageUrl || undefined,
          alt: employee.fullName,
        }}
        metaItems={[
          { icon: <Phone className="h-4 w-4" />, text: employee.phoneNumber || "No phone" },
        ]}
        statusBadge={getRoleBadge(employee.role)}
      />

      {/* Stats Summary */}
      <StatsSummaryBar
        stats={[
          {
            label: "Department",
            value: employee.departmentName || "N/A",
            icon: <Building2 className="h-5 w-5" />,
            color: "violet",
          },
          {
            label: "Role",
            value: employee.role.replace(/_/g, " "),
            icon: <Briefcase className="h-5 w-5" />,
            color: "sky",
          },
          {
            label: "Status",
            value: employee.status.replace(/_/g, " "),
            icon: <User className="h-5 w-5" />,
            color: getStatusColor(employee.status) as any,
          },
          {
            label: "Specialization",
            value: employee.specialization || "N/A",
            icon: <Stethoscope className="h-5 w-5" />,
            color: "teal",
          },
        ]}
      />

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Personal Information */}
        <div className="detail-section-card">
          <div className="detail-section-card-header">
            <User className="h-4 w-4" />
            <h3>Personal Information</h3>
          </div>
          <div className="detail-section-card-content">
            <InfoGrid columns={1}>
              <InfoItem
                icon={<User className="h-4 w-4" />}
                label="Full Name"
                value={employee.fullName}
                color="violet"
              />
              <InfoItem
                icon={<Phone className="h-4 w-4" />}
                label="Phone"
                value={employee.phoneNumber}
                color="teal"
              />
              <InfoItem
                icon={<MapPin className="h-4 w-4" />}
                label="Address"
                value={employee.address}
                color="rose"
              />
            </InfoGrid>
          </div>
        </div>

        {/* Professional Information */}
        <div className="detail-section-card">
          <div className="detail-section-card-header">
            <Briefcase className="h-4 w-4" />
            <h3>Professional Information</h3>
          </div>
          <div className="detail-section-card-content">
            <InfoGrid columns={1}>
              <InfoItem
                icon={<Building2 className="h-4 w-4" />}
                label="Department"
                value={employee.departmentName}
                color="violet"
              />
              <InfoItem
                icon={<Stethoscope className="h-4 w-4" />}
                label="Specialization"
                value={employee.specialization}
                color="teal"
              />
              <InfoItem
                icon={<Award className="h-4 w-4" />}
                label="License Number"
                value={employee.licenseNumber}
                color="amber"
              />
              <InfoItem
                icon={<Briefcase className="h-4 w-4" />}
                label="Status"
                value={
                  <Badge
                    variant="outline"
                    className={
                      employee.status?.toLowerCase() === "active"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : employee.status?.toLowerCase() === "inactive"
                        ? "bg-slate-50 text-slate-600 border-slate-200"
                        : "bg-amber-50 text-amber-700 border-amber-200"
                    }
                  >
                    {employee.status}
                  </Badge>
                }
                color="slate"
              />
            </InfoGrid>
          </div>
        </div>
      </div>
    </div>
  );
}

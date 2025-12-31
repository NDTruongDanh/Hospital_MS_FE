"use client";

import { 
  User,
  Mail,
  Shield,
  Building2,
  BadgeCheck,
  AlertCircle,
  Edit,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

const ROLE_DISPLAY: Record<string, { label: string; color: string; bgColor: string }> = {
  ADMIN: { label: "Quản trị viên", color: "text-violet-700", bgColor: "bg-violet-100" },
  DOCTOR: { label: "Bác sĩ", color: "text-sky-700", bgColor: "bg-sky-100" },
  NURSE: { label: "Y tá", color: "text-green-700", bgColor: "bg-green-100" },
  RECEPTIONIST: { label: "Lễ tân", color: "text-amber-700", bgColor: "bg-amber-100" },
  PATIENT: { label: "Bệnh nhân", color: "text-rose-700", bgColor: "bg-rose-100" },
  UNKNOWN: { label: "Không xác định", color: "text-gray-700", bgColor: "bg-gray-100" },
};

function InfoItem({ icon: Icon, label, value }: { icon: typeof User; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 p-4 rounded-lg hover:bg-gray-50 transition-colors">
      <div className="p-2 rounded-lg bg-sky-50">
        <Icon className="h-5 w-5 text-sky-600" />
      </div>
      <div className="flex-1">
        <p className="text-xs font-medium text-[hsl(var(--muted-foreground))]">{label}</p>
        <p className="font-semibold text-gray-900 text-lg">{value}</p>
      </div>
    </div>
  );
}

export default function AdminProfilePage() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-[hsl(var(--primary))]" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-400" />
        <h2 className="text-xl font-semibold mb-2 text-red-600">Chưa đăng nhập</h2>
        <p className="text-[hsl(var(--muted-foreground))]">Vui lòng đăng nhập để xem hồ sơ.</p>
        <Link href="/login" className="btn-primary mt-4 inline-block">
          Đăng nhập
        </Link>
      </div>
    );
  }

  const roleConfig = ROLE_DISPLAY[user.role] || ROLE_DISPLAY.UNKNOWN;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="relative rounded-xl bg-gradient-to-r from-sky-500 to-indigo-500 p-8 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-white" />
          <div className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full bg-white" />
        </div>

        <div className="relative flex items-center justify-between gap-6 flex-wrap">
          <div className="flex items-center gap-5">
            <div className="h-24 w-24 rounded-full bg-white/20 flex items-center justify-center text-4xl font-bold border-4 border-white/30">
              {user.fullName?.charAt(0) || user.email.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{user.fullName || "Người dùng"}</h1>
              <p className="text-white/80 text-base mt-1">{user.email}</p>
              <div className="mt-2">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${roleConfig.bgColor} ${roleConfig.color}`}>
                  <BadgeCheck className="h-4 w-4 mr-1.5" />
                  {roleConfig.label}
                </span>
              </div>
            </div>
          </div>

          {/* <Link
            href="/admin/profile/edit"
            className="inline-flex items-center px-4 py-2 rounded-lg bg-white text-sky-600 hover:bg-white/90 transition-colors font-medium"
          >
            <Edit className="mr-2 h-4 w-4" />
            Chỉnh sửa
          </Link> */}
        </div>
      </div>

      {/* Account Info */}
      <div className="card-base">
        <div className="p-4 bg-gray-50 border-b flex items-center gap-2">
          <User className="h-5 w-5 text-sky-500" />
          <h3 className="font-semibold">Thông tin tài khoản</h3>
        </div>
        <div className="p-2">
          <InfoItem icon={User} label="Họ tên" value={user.fullName || "Chưa cập nhật"} />
          <InfoItem icon={Mail} label="Email" value={user.email} />
          <InfoItem icon={Shield} label="Vai trò" value={roleConfig.label} />
          {user.department && (
            <InfoItem icon={Building2} label="Khoa/Phòng" value={user.department} />
          )}
        </div>
      </div>

      {/* ID Info */}
      <div className="card-base">
        <div className="p-4 bg-gray-50 border-b flex items-center gap-2">
          <BadgeCheck className="h-5 w-5 text-violet-500" />
          <h3 className="font-semibold">Mã định danh</h3>
        </div>
        <div className="p-4 space-y-4">
          {user.accountId && (
            <div className="flex justify-between items-center">
              <span className="text-[hsl(var(--muted-foreground))]">Account ID</span>
              <code className="px-3 py-1 rounded bg-gray-100 text-sm font-mono">{user.accountId}</code>
            </div>
          )}
          {user.employeeId && (
            <div className="flex justify-between items-center">
              <span className="text-[hsl(var(--muted-foreground))]">Employee ID</span>
              <code className="px-3 py-1 rounded bg-gray-100 text-sm font-mono">{user.employeeId}</code>
            </div>
          )}
          {user.patientId && (
            <div className="flex justify-between items-center">
              <span className="text-[hsl(var(--muted-foreground))]">Patient ID</span>
              <code className="px-3 py-1 rounded bg-gray-100 text-sm font-mono">{user.patientId}</code>
            </div>
          )}
        </div>
      </div>

      {/* Note */}
      <div className="p-4 rounded-lg bg-amber-50 border border-amber-200 text-amber-800">
        <p className="text-sm">
          <strong>Lưu ý:</strong> Để thay đổi thông tin tài khoản, vui lòng liên hệ quản trị viên hệ thống.
        </p>
      </div>
    </div>
  );
}

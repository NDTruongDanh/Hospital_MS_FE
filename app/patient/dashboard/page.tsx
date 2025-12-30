"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  Calendar, 
  Clock,
  FileText,
  Receipt,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Stethoscope,
} from "lucide-react";
import { StatCard } from "@/components/dashboard";
import { appointmentService, Appointment } from "@/services/appointment.service";
import { useAuth } from "@/contexts/AuthContext";

interface DashboardStats {
  upcomingAppointments: number;
  completedVisits: number;
  pendingInvoices: number;
}

export default function PatientDashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    upcomingAppointments: 0,
    completedVisits: 0,
    pendingInvoices: 0,
  });
  const [loading, setLoading] = useState(true);
  const [nextAppointment, setNextAppointment] = useState<Appointment | null>(null);
  const [recentAppointments, setRecentAppointments] = useState<Appointment[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await appointmentService.list({});
      
      const now = new Date().toISOString();
      const upcoming = response.content.filter(apt => 
        apt.status === "PENDING" || apt.status === "CONFIRMED" && apt.appointmentTime > now
      );
      const completed = response.content.filter(apt => apt.status === "COMPLETED");

      setStats({
        upcomingAppointments: upcoming.length,
        completedVisits: completed.length,
        pendingInvoices: 1, // Mock
      });

      if (upcoming.length > 0) {
        setNextAppointment(upcoming[0]);
      }

      setRecentAppointments(response.content.slice(0, 3));
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (isoDate: string) => {
    return new Date(isoDate).toLocaleDateString("vi-VN", {
      weekday: "long",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatTime = (isoDate: string) => {
    return new Date(isoDate).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
  };

  const quickActions = [
    { 
      icon: Calendar, 
      label: "Đặt lịch hẹn", 
      href: "/patient/appointments/new",
      description: "Đặt lịch khám mới" 
    },
    { 
      icon: FileText, 
      label: "Hồ sơ y tế", 
      href: "/patient/medical-history",
      description: "Xem lịch sử khám bệnh" 
    },
    { 
      icon: Receipt, 
      label: "Hóa đơn", 
      href: "/patient/invoices",
      description: "Thanh toán hóa đơn" 
    },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="stat-card">
              <div className="skeleton h-4 w-24 mb-4" />
              <div className="skeleton h-8 w-16" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-display">Xin chào, {user?.fullName || "Bạn"}</h1>
        <p className="text-[hsl(var(--muted-foreground))] mt-1">
          Chào mừng bạn quay trở lại. Dưới đây là tổng quan sức khỏe của bạn.
        </p>
      </div>

      {/* Next Appointment Alert */}
      {nextAppointment && (
        <div className="card-base bg-gradient-to-r from-[hsl(var(--primary-light))] to-[hsl(var(--background))] border-l-4 border-l-[hsl(var(--primary))]">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-[hsl(var(--primary))] text-white flex items-center justify-center">
                <Calendar className="w-7 h-7" />
              </div>
              <div>
                <p className="text-label">Lịch hẹn sắp tới</p>
                <p className="text-xl font-bold">{formatDate(nextAppointment.appointmentTime)}</p>
                <div className="flex items-center gap-4 mt-1 text-sm text-[hsl(var(--muted-foreground))]">
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {formatTime(nextAppointment.appointmentTime)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Stethoscope className="w-4 h-4" />
                    BS. {nextAppointment.doctor.fullName}
                  </span>
                </div>
              </div>
            </div>
            <Link href="/patient/appointments" className="btn-primary">
              Xem chi tiết
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="Lịch hẹn sắp tới"
          value={stats.upcomingAppointments}
          icon={<Calendar className="w-5 h-5" />}
          trend={{ value: "Đã đặt", direction: "neutral" }}
        />
        <StatCard
          title="Lần khám hoàn thành"
          value={stats.completedVisits}
          icon={<CheckCircle className="w-5 h-5" />}
          trend={{ value: "Tổng", direction: "neutral" }}
        />
        <StatCard
          title="Hóa đơn chờ thanh toán"
          value={stats.pendingInvoices}
          icon={<Receipt className="w-5 h-5" />}
          trend={{ 
            value: stats.pendingInvoices > 0 ? "Cần thanh toán" : "Hoàn tất", 
            direction: stats.pendingInvoices > 0 ? "up" : "neutral" 
          }}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="card-base">
          <h3 className="text-section mb-4">Thao tác nhanh</h3>
          <div className="space-y-3">
            {quickActions.map((action, i) => (
              <Link
                key={i}
                href={action.href}
                className="flex items-center gap-4 p-4 rounded-xl border border-[hsl(var(--border))] hover:border-[hsl(var(--primary))] hover:bg-[hsl(var(--primary-light))] transition-colors group"
              >
                <div className="w-10 h-10 rounded-xl bg-[hsl(var(--primary-light))] flex items-center justify-center text-[hsl(var(--primary))] group-hover:bg-[hsl(var(--primary))] group-hover:text-white transition-colors">
                  <action.icon className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">{action.label}</p>
                  <p className="text-small">{action.description}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-[hsl(var(--muted-foreground))] group-hover:text-[hsl(var(--primary))]" />
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Appointments */}
        <div className="lg:col-span-2 card-base">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-section">Lịch sử khám gần đây</h3>
            <Link
              href="/patient/medical-history"
              className="text-sm text-[hsl(var(--primary))] hover:underline flex items-center gap-1"
            >
              Xem tất cả
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {recentAppointments.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 mx-auto text-[hsl(var(--muted-foreground))] opacity-50" />
              <p className="text-[hsl(var(--muted-foreground))] mt-2">
                Bạn chưa có lịch sử khám bệnh
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentAppointments.map((apt) => (
                <div
                  key={apt.id}
                  className="flex items-center gap-4 p-4 rounded-xl border border-[hsl(var(--border))]"
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    apt.status === "COMPLETED" ? "bg-green-100 text-green-600" :
                    apt.status === "PENDING" || apt.status === "CONFIRMED" ? "bg-blue-100 text-blue-600" :
                    "bg-gray-100 text-gray-600"
                  }`}>
                    {apt.status === "COMPLETED" ? <CheckCircle className="w-5 h-5" /> :
                     apt.status === "PENDING" || apt.status === "CONFIRMED" ? <Clock className="w-5 h-5" /> :
                     <AlertCircle className="w-5 h-5" />}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">BS. {apt.doctor.fullName}</p>
                    <p className="text-small">{apt.reason || "Khám tổng quát"}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatDate(apt.appointmentTime).split(",")[1]}</p>
                    <p className="text-small">
                      {apt.status === "COMPLETED" ? "Hoàn thành" :
                       apt.status === "PENDING" ? "Chờ xác nhận" :
                       apt.status === "CONFIRMED" ? "Đã xác nhận" :
                       apt.status === "CANCELLED" ? "Đã hủy" : apt.status}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

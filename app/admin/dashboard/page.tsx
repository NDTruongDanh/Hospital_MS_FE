"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  Users, 
  Calendar, 
  CreditCard, 
  Stethoscope,
  ArrowRight,
  Clock,
  UserPlus,
  FileText,
  Loader2,
} from "lucide-react";
import { StatCard } from "@/components/dashboard";
import { RevenueChart, DonutChart } from "@/components/dashboard";
import { toast } from "sonner";
import { reportsService } from "@/services/reports.service";
import { appointmentService, Appointment } from "@/services/appointment.service";
import { hrService } from "@/services/hr.service";

interface DashboardStats {
  patients: { total: number; newThisMonth: number };
  appointments: { total: number; today: number; completed: number; byType: { type: string; count: number }[] };
  revenue: { total: number; thisMonth: number; growth: number };
  employees: { total: number; doctors: number };
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    patients: { total: 0, newThisMonth: 0 },
    appointments: { total: 0, today: 0, completed: 0, byType: [] },
    revenue: { total: 0, thisMonth: 0, growth: 0 },
    employees: { total: 0, doctors: 0 },
  });
  const [recentAppointments, setRecentAppointments] = useState<Appointment[]>([]);
  const [revenueChartData, setRevenueChartData] = useState<{ date: string; revenue: number }[]>([]);
  const [chartFilter, setChartFilter] = useState("This Week");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, [chartFilter]); // Re-fetch when filter changes

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      const today = new Date();
      
      // Calculate date ranges based on filter
      const getDateRange = () => {
        let startDate: Date;
        let endDate = today;

        switch (chartFilter) {
          case "Last Week":
            startDate = new Date(today);
            startDate.setDate(today.getDate() - 14);
            endDate = new Date(today);
            endDate.setDate(today.getDate() - 7);
            break;
          case "This Month":
            startDate = new Date(today.getFullYear(), today.getMonth(), 1);
            break;
          case "Last Month":
            startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
            endDate = new Date(today.getFullYear(), today.getMonth(), 0);
            break;
          case "This Week":
          default:
            startDate = new Date(today);
            startDate.setDate(today.getDate() - 7);
            break;
        }

        return { startDate, endDate };
      };

      const { startDate, endDate } = getDateRange();
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const startOfYear = new Date(today.getFullYear(), 0, 1);
      
      // Fetch all data in parallel
      const [
        revenueReport,
        appointmentStats,
        patientStats,
        employeesRes,
        todayAppointments,
      ] = await Promise.allSettled([
        reportsService.getRevenueReport({
          startDate: startOfMonth.toISOString().split("T")[0],
          endDate: today.toISOString().split("T")[0],
        }),
        reportsService.getAppointmentStats({
          startDate: startDate.toISOString().split("T")[0],
          endDate: endDate.toISOString().split("T")[0],
        }),
        reportsService.getPatientActivity({
          startDate: startOfMonth.toISOString().split("T")[0],
          endDate: today.toISOString().split("T")[0],
        }),
        hrService.getEmployees({ size: 1000 }),
        appointmentService.list({ size: 10 }),
      ]);

      // Extract revenue data
      const revenue = revenueReport.status === "fulfilled" ? revenueReport.value : null;
      
      // Extract appointment stats
      const appts = appointmentStats.status === "fulfilled" ? appointmentStats.value : null;
      
      // Extract patient data
      const patients = patientStats.status === "fulfilled" ? patientStats.value : null;
      
      // Extract employee data
      const employees = employeesRes.status === "fulfilled" ? employeesRes.value : null;
      const allEmployees = employees?.content || [];
      const doctors = allEmployees.filter((e: any) => e.role === "DOCTOR");
      
      // Extract recent appointments
      const apptList = todayAppointments.status === "fulfilled" ? todayAppointments.value : null;
      
      // Count today's appointments
      const todayStr = today.toISOString().split("T")[0];
      const todayAppts = (apptList?.content || []).filter((a: Appointment) => 
        a.appointmentTime.startsWith(todayStr)
      );
      const completedToday = todayAppts.filter((a: Appointment) => a.status === "COMPLETED").length;

      setStats({
        patients: {
          total: patients?.totalPatients || 0,
          newThisMonth: patients?.newPatients || 0,
        },
        appointments: {
          total: appts?.totalAppointments || 0,
          today: todayAppts.length,
          completed: completedToday,
          byType: appts?.appointmentsByType || [],
        },
        revenue: {
          total: revenue?.totalRevenue || 0,
          thisMonth: revenue?.paidRevenue || 0,
          growth: revenue?.collectionRate || 0,
        },
        employees: {
          total: allEmployees.length,
          doctors: doctors.length,
        },
      });

      // Use appointment daily trend for chart (revenue API doesn't return daily data)
      if (appts && appts.dailyTrend && Array.isArray(appts.dailyTrend)) {
        // Filter based on selected range
        const filteredTrend = appts.dailyTrend.filter((item: any) => {
          const itemDate = new Date(item.date);
          return itemDate >= startDate && itemDate <= endDate;
        });
        
        const chartData = filteredTrend.slice(-7).map((item: any) => ({
          date: new Date(item.date).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" }),
          revenue: item.count, // Using appointment count as metric
        }));
        setRevenueChartData(chartData);
      }

      // Set recent appointments (today's or latest)
      setRecentAppointments((apptList?.content || []).slice(0, 5));
      
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
      toast.error("Không thể tải dữ liệu dashboard");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      notation: "compact",
    }).format(value);
  };

  const formatTime = (isoDate: string) => {
    return new Date(isoDate).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
  };

  const quickActions = [
    { icon: UserPlus, label: "Thêm bệnh nhân", href: "/receptionist/patients", color: "teal" },
    { icon: Calendar, label: "Đặt lịch hẹn", href: "/receptionist/appointments/new", color: "blue" },
    { icon: FileText, label: "Xem báo cáo", href: "/admin/reports/revenue", color: "orange" },
    { icon: Stethoscope, label: "Quản lý BS", href: "/admin/employees", color: "green" },
  ];

  const STATUS_CONFIG: Record<string, { label: string; class: string }> = {
    PENDING: { label: "Chờ xác nhận", class: "badge-warning" },
    CONFIRMED: { label: "Đã xác nhận", class: "badge-info" },
    IN_PROGRESS: { label: "Đang khám", class: "badge-warning" },
    COMPLETED: { label: "Hoàn thành", class: "badge-success" },
    CANCELLED: { label: "Đã hủy", class: "badge-danger" },
    NO_SHOW: { label: "Vắng mặt", class: "badge-secondary" },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-[hsl(var(--primary))]" />
      </div>
    );
  }

  // Prepare donut chart data from real appointment types
  const donutData = stats.appointments.byType.length > 0 
    ? stats.appointments.byType.map((t, i) => ({
        label: t.type === "CONSULTATION" ? "Khám mới" : t.type === "FOLLOW_UP" ? "Tái khám" : t.type,
        value: t.count,
        color: `hsl(173, 58%, ${35 + i * 15}%)`,
      }))
    : [{ label: "Chưa có dữ liệu", value: 1, color: "hsl(173, 58%, 75%)" }];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-display">Xin chào! 👋</h1>
          <p className="text-[hsl(var(--muted-foreground))] mt-1">
            Đây là tổng quan hoạt động bệnh viện hôm nay
          </p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Tổng bệnh nhân"
          value={stats.patients.total.toLocaleString()}
          icon={<Users className="w-5 h-5" />}
          trend={{ value: `+${stats.patients.newThisMonth} tháng này`, direction: "up" }}
        />
        <StatCard
          title="Lịch hẹn hôm nay"
          value={stats.appointments.today}
          icon={<Calendar className="w-5 h-5" />}
          trend={{ value: `${stats.appointments.completed} hoàn thành`, direction: "neutral" }}
        />
        <StatCard
          title="Doanh thu tháng"
          value={formatCurrency(stats.revenue.thisMonth)}
          icon={<CreditCard className="w-5 h-5" />}
          trend={{ value: `${stats.revenue.growth.toFixed(0)}% tỷ lệ thu`, direction: stats.revenue.growth >= 80 ? "up" : "neutral" }}
        />
        <StatCard
          title="Nhân viên"
          value={stats.employees.total}
          icon={<Stethoscope className="w-5 h-5" />}
          trend={{ value: `${stats.employees.doctors} bác sĩ`, direction: "neutral" }}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <div className="lg:col-span-2">
          <RevenueChart 
            data={revenueChartData} 
            height={280}
            onFilterChange={setChartFilter}
            currentFilter={chartFilter}
          />
        </div>

        {/* Appointment Distribution */}
        <DonutChart
          title="Phân bố lịch hẹn"
          data={donutData}
          centerLabel="Tổng"
          centerValue={stats.appointments.total.toString()}
        />
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="card-base">
          <h3 className="text-section mb-4">Thao tác nhanh</h3>
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map((action, i) => (
              <Link
                key={i}
                href={action.href}
                className="flex items-center gap-3 p-3 rounded-xl border border-[hsl(var(--border))] hover:border-[hsl(var(--primary))] hover:bg-[hsl(var(--primary-light))] transition-colors group"
              >
                <div className="w-10 h-10 rounded-lg bg-[hsl(var(--primary-light))] flex items-center justify-center text-[hsl(var(--primary))] group-hover:bg-[hsl(var(--primary))] group-hover:text-white transition-colors">
                  <action.icon className="w-5 h-5" />
                </div>
                <span className="text-sm font-medium">{action.label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Appointments */}
        <div className="lg:col-span-2 card-base">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-section">Lịch hẹn gần đây</h3>
            <Link
              href="/receptionist/appointments"
              className="text-sm text-[hsl(var(--primary))] hover:underline flex items-center gap-1"
            >
              Xem tất cả
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            {recentAppointments.length === 0 ? (
              <p className="text-center text-[hsl(var(--muted-foreground))] py-8">
                Không có lịch hẹn nào
              </p>
            ) : (
              <table className="table-base">
                <thead>
                  <tr>
                    <th>Bệnh nhân</th>
                    <th>Bác sĩ</th>
                    <th>Giờ</th>
                    <th>Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {recentAppointments.map((apt) => {
                    const statusCfg = STATUS_CONFIG[apt.status] || STATUS_CONFIG.PENDING;
                    return (
                      <tr key={apt.id}>
                        <td className="font-medium">{apt.patient?.fullName || "-"}</td>
                        <td>BS. {apt.doctor?.fullName || "-"}</td>
                        <td>
                          <div className="flex items-center gap-1 text-[hsl(var(--muted-foreground))]">
                            <Clock className="w-4 h-4" />
                            {formatTime(apt.appointmentTime)}
                          </div>
                        </td>
                        <td>
                          <span className={`badge ${statusCfg.class}`}>
                            {statusCfg.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

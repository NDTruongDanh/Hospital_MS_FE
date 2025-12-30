"use client";

import { ReactNode, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { Toaster } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useMemo } from "react";
import {
  Home,
  Calendar,
  Users,
  FileText,
  Building2,
  CreditCard,
  BarChart3,
  Settings,
  TestTube,
  Pill,
  UserCircle,
  LogOut,
  Bell,
  Search,
  ChevronDown,
  Stethoscope,
  ClipboardList,
  Package,
  X,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useEffect } from "react";
import axiosInstance from "@/config/axios";

const navItems = [
  { title: "Dashboard", href: "/admin/dashboard", icon: Home },
  { title: "Lịch hẹn", href: "/admin/appointments", icon: Calendar },
  { title: "Tiếp nhận BN", href: "/admin/walk-in", icon: UserCircle },
  { title: "Bệnh nhân", href: "/admin/patients", icon: Users },
  { title: "Nhân viên", href: "/admin/employees", icon: Stethoscope },
  { title: "Khoa", href: "/admin/departments", icon: Building2 },
  { title: "Lịch làm việc", href: "/admin/schedules", icon: ClipboardList },
  { title: "Thuốc", href: "/admin/medicines", icon: Pill },
  { title: "Danh mục thuốc", href: "/admin/medicine-categories", icon: Package },
  { title: "Phát thuốc", href: "/admin/pharmacy", icon: Pill },
  { title: "Xét nghiệm", href: "/admin/lab-tests", icon: TestTube },
  { title: "Thanh toán", href: "/admin/billing", icon: CreditCard },
  { title: "Báo cáo", href: "/admin/reports", icon: BarChart3 },
  { title: "Tài khoản", href: "/admin/accounts", icon: Settings },
];

interface SearchResult {
  type: "patient" | "appointment" | "employee";
  id: string;
  title: string;
  subtitle: string;
  href: string;
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const queryClient = useMemo(() => new QueryClient(), []);
  
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Global search function
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    // Don't search if not authenticated
    if (!user) {
      return;
    }

    const searchTimeout = setTimeout(async () => {
      try {
        setSearching(true);
        const results: SearchResult[] = [];

        // Search patients
        try {
          const patientsRes = await axiosInstance.get("/patients/all", {
            params: { search: searchQuery, size: 5 },
          });
          const patients = patientsRes.data.data?.content || [];
          patients.forEach((p: any) => {
            results.push({
              type: "patient",
              id: p.id,
              title: p.fullName,
              subtitle: p.phoneNumber || p.email,
              href: `/receptionist/patients`,
            });
          });
        } catch (e) {
          console.error("Patient search failed:", e);
        }

        // Search appointments
        try {
          const apptsRes = await axiosInstance.get("/appointments/all", {
            params: { size: 5 },
          });
          const appointments = (apptsRes.data.data?.content || []).filter((a: any) =>
            a.patient?.fullName?.toLowerCase().includes(searchQuery.toLowerCase())
          );
          appointments.slice(0, 5).forEach((a: any) => {
            results.push({
              type: "appointment",
              id: a.id,
              title: `Appointment - ${a.patient?.fullName}`,
              subtitle: new Date(a.appointmentTime).toLocaleString("vi-VN"),
              href: `/receptionist/appointments`,
            });
          });
        } catch (e) {
          console.error("Appointment search failed:", e);
        }

        // Search employees
        try {
          const employeesRes = await axiosInstance.get("/hr/employees/all", {
            params: { search: searchQuery, size: 5 },
          });
          const employees = employeesRes.data.data?.content || [];
          employees.forEach((e: any) => {
            results.push({
              type: "employee",
              id: e.id,
              title: e.fullName,
              subtitle: e.role + (e.departmentName ? ` - ${e.departmentName}` : ""),
              href: `/admin/employees`,
            });
          });
        } catch (e) {
          console.error("Employee search failed:", e);
        }

        setSearchResults(results);
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => clearTimeout(searchTimeout);
  }, [searchQuery, user]);

  // Fetch notifications (only when authenticated)
  useEffect(() => {
    // Don't fetch if not authenticated
    if (!user) {
      return;
    }

    const fetchNotifications = async () => {
      try {
        const today = new Date().toISOString().split("T")[0];
        const res = await axiosInstance.get("/appointments/all", {
          params: { size: 10 },
        });
        const todayAppts = (res.data.data?.content || [])
          .filter((a: any) => a.appointmentTime.startsWith(today) && (a.status === "PENDING" || a.status === "CONFIRMED"))
          .slice(0, 5);
        
        const notifs = todayAppts.map((a: any) => ({
          id: a.id,
          type: "appointment",
          title: "Lịch hẹn mới",
          message: `${a.patient?.fullName} - ${new Date(a.appointmentTime).toLocaleTimeString("vi-VN")}`,
          time: a.appointmentTime,
          read: false,
        }));
        
        setNotifications(notifs);
        setUnreadCount(notifs.length);
      } catch (error) {
        console.error("Failed to fetch notifications:", error);
      }
    };

    fetchNotifications();
    // Refresh every 5 minutes
    const interval = setInterval(fetchNotifications, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [user]);

  const handleSearchResultClick = (result: SearchResult) => {
    router.push(result.href);
    setSearchOpen(false);
    setSearchQuery("");
  };

  const getResultIcon = (type: string) => {
    switch (type) {
      case "patient": return <Users className="w-4 h-4" />;
      case "appointment": return <Calendar className="w-4 h-4" />;
      case "employee": return <Stethoscope className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-[hsl(var(--background))]">
        {/* Sidebar */}
        <aside className="sidebar">
          {/* Logo */}
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[hsl(173,58%,35%)] to-[hsl(173,58%,28%)] flex items-center justify-center text-white font-bold text-sm shadow-lg mb-4">
            HMS
          </div>

          {/* Navigation */}
          <nav className="flex flex-col items-center gap-1 flex-1 overflow-y-auto py-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
              const Icon = item.icon;
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "sidebar-icon",
                    isActive && "active"
                  )}
                  title={item.title}
                >
                  <Icon className="w-5 h-5" />
                </Link>
              );
            })}
          </nav>

          {/* Bottom Actions */}
          <div className="flex flex-col items-center gap-1 mt-auto pt-4 border-t border-white/10">
            <Link
              href="/admin/profile"
              className={cn(
                "sidebar-icon",
                pathname.includes("/profile") && "active"
              )}
              title="Profile"
            >
              <UserCircle className="w-5 h-5" />
            </Link>
            <button
              onClick={logout}
              className="sidebar-icon hover:bg-red-500/10 hover:text-red-500"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <div className="content-area">
          {/* Top Navigation */}
          <header className="topnav">
            <div className="flex items-center gap-6">
              <h1 className="text-title">
                {navItems.find((item) => pathname.startsWith(item.href))?.title || "Admin"}
              </h1>
            </div>

            <div className="flex items-center gap-4">
              {/* Search */}
              <button
                onClick={() => setSearchOpen(true)}
                className="search-input hidden md:flex cursor-pointer"
              >
                <Search className="w-4 h-4 text-[hsl(var(--muted-foreground))]" />
                <span className="text-[hsl(var(--muted-foreground))]">Search...</span>
              </button>

              {/* Notifications */}
              <DropdownMenu open={notificationsOpen} onOpenChange={setNotificationsOpen}>
                <DropdownMenuTrigger asChild>
                  <button className="btn-icon relative">
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="notification-badge">{unreadCount}</span>
                    )}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80">
                  <div className="p-3 border-b border-[hsl(var(--border))]">
                    <h3 className="font-semibold">Thông báo</h3>
                    <p className="text-xs text-[hsl(var(--muted-foreground))]">
                      {unreadCount} thông báo mới
                    </p>
                  </div>
                  <div className="max-h-[400px] overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-sm text-[hsl(var(--muted-foreground))]">
                        Không có thông báo mới
                      </div>
                    ) : (
                      notifications.map((notif) => (
                        <DropdownMenuItem
                          key={notif.id}
                          className="p-3 cursor-pointer hover:bg-[hsl(var(--secondary))]"
                        >
                          <div className="flex gap-3">
                            <div className="w-2 h-2 rounded-full bg-[hsl(var(--primary))] mt-2" />
                            <div className="flex-1">
                              <p className="font-medium text-sm">{notif.title}</p>
                              <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
                                {notif.message}
                              </p>
                              <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
                                {new Date(notif.time).toLocaleTimeString("vi-VN")}
                              </p>
                            </div>
                          </div>
                        </DropdownMenuItem>
                      ))
                    )}
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-center text-sm text-[hsl(var(--primary))] cursor-pointer">
                    Xem tất cả
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* User Profile */}
              <button className="flex items-center gap-3 py-2 px-3 rounded-full hover:bg-[hsl(var(--secondary))] transition-colors">
                <div className="avatar">
                  {user?.fullName?.charAt(0) || user?.email?.charAt(0) || "A"}
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium text-[hsl(var(--foreground))]">
                    {user?.fullName || user?.email || "Admin"}
                  </p>
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">
                    Administrator
                  </p>
                </div>
                <ChevronDown className="w-4 h-4 text-[hsl(var(--muted-foreground))] hidden md:block" />
              </button>
            </div>
          </header>

          {/* Page Content */}
          <main className="py-6 animate-fadeIn">
            {children}
          </main>
        </div>
      </div>

      {/* Search Dialog */}
      <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Tìm kiếm</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="search-input w-full">
              <Search className="w-4 h-4 text-[hsl(var(--muted-foreground))]" />
              <input
                type="text"
                placeholder="Tìm bệnh nhân, lịch hẹn, nhân viên..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
                className="flex-1 bg-transparent border-none outline-none"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")}>
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="max-h-[400px] overflow-y-auto space-y-1">
              {searching ? (
                <div className="text-center py-8 text-sm text-[hsl(var(--muted-foreground))]">
                  Đang tìm kiếm...
                </div>
              ) : searchResults.length === 0 && searchQuery ? (
                <div className="text-center py-8 text-sm text-[hsl(var(--muted-foreground))]">
                  Không tìm thấy kết quả
                </div>
              ) : searchResults.length === 0 ? (
                <div className="text-center py-8 text-sm text-[hsl(var(--muted-foreground))]">
                  Nhập từ khóa để tìm kiếm
                </div>
              ) : (
                searchResults.map((result) => (
                  <button
                    key={`${result.type}-${result.id}`}
                    onClick={() => handleSearchResultClick(result)}
                    className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-[hsl(var(--secondary))] transition-colors text-left"
                  >
                    <div className="w-10 h-10 rounded-lg bg-[hsl(var(--primary-light))] flex items-center justify-center text-[hsl(var(--primary))]">
                      {getResultIcon(result.type)}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{result.title}</p>
                      <p className="text-xs text-[hsl(var(--muted-foreground))]">
                        {result.subtitle}
                      </p>
                    </div>
                    <span className="text-xs px-2 py-1 rounded bg-[hsl(var(--secondary))] text-[hsl(var(--muted-foreground))]">
                      {result.type === "patient" ? "Bệnh nhân" : result.type === "appointment" ? "Lịch hẹn" : "Nhân viên"}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Toaster position="top-right" />
    </QueryClientProvider>
  );
}

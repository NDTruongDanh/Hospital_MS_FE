"use client";

import { ReactNode, useMemo } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { Toaster } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Home,
  Calendar,
  FileText,
  Receipt,
  UserCircle,
  LogOut,
  Bell,
  Heart,
  ChevronDown,
} from "lucide-react";

const navItems = [
  { title: "Tổng quan", href: "/patient/dashboard", icon: Home },
  { title: "Lịch hẹn", href: "/patient/appointments", icon: Calendar },
  { title: "Hồ sơ y tế", href: "/patient/medical-history", icon: FileText },
  { title: "Hóa đơn", href: "/patient/billing", icon: Receipt },
];

export default function PatientLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const queryClient = useMemo(() => new QueryClient(), []);

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-[hsl(var(--background))]">
        {/* Sidebar */}
        <aside className="sidebar">
          {/* Logo */}
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[hsl(173,58%,35%)] to-[hsl(173,58%,28%)] flex items-center justify-center text-white font-bold text-sm shadow-lg mb-4">
            <Heart className="w-6 h-6" />
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
              href="/patient/profile"
              className={cn(
                "sidebar-icon",
                pathname.includes("/profile") && "active"
              )}
              title="Hồ sơ"
            >
              <UserCircle className="w-5 h-5" />
            </Link>
            <button
              onClick={logout}
              className="sidebar-icon hover:bg-red-500/10 hover:text-red-500"
              title="Đăng xuất"
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
                {navItems.find((item) => pathname.startsWith(item.href))?.title || "Bệnh nhân"}
              </h1>
            </div>

            <div className="flex items-center gap-4">
              {/* Notifications */}
              <button className="btn-icon relative">
                <Bell className="w-5 h-5" />
                <span className="notification-badge">2</span>
              </button>

              {/* User Profile */}
              <button className="flex items-center gap-3 py-2 px-3 rounded-full hover:bg-[hsl(var(--secondary))] transition-colors">
                <div className="avatar">
                  {user?.fullName?.charAt(0) || user?.email?.charAt(0) || "P"}
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium text-[hsl(var(--foreground))]">
                    {user?.fullName || user?.email || "Bệnh nhân"}
                  </p>
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">
                    Patient
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
      <Toaster position="top-right" />
    </QueryClientProvider>
  );
}

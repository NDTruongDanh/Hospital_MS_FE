"use client";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { NAV_ICONS } from "@/config/icons";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  SidebarRail,
} from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useMemo } from "react";

import { useAuth } from "@/contexts/AuthContext";
import {
  CalendarDays,
  FileText,
  CalendarClock,
  LogOut,
  User,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  {
    title: "My Appointments",
    href: "/doctor/appointments",
    icon: CalendarDays,
  },
  { title: "My Exams", href: "/doctor/exams", icon: FileText },
  { title: "My Schedule", href: "/doctor/schedules", icon: CalendarClock },
  { title: "Patients", href: "/doctor/patients", icon: Users },
];

function buildBreadcrumbs(pathname: string) {
  const segments = pathname.split("/").filter(Boolean);
  let path = "";
  return segments.map((segment, index) => {
    path += "/" + segment;
    const name = segment
      .replace(/-/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());

    return {
      name,
      href: path,
      isLast: index === segments.length - 1,
    };
  });
}

export default function DoctorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const breadcrumbs = buildBreadcrumbs(pathname);
  const queryClient = useMemo(() => new QueryClient(), []);
  const { user, logout } = useAuth();

  return (
    <QueryClientProvider client={queryClient}>
      <SidebarProvider>
        <div className="bg-muted/40 text-foreground flex min-h-screen w-screen">
          <Sidebar
            className="border-r border-slate-200 bg-white"
            collapsible="icon"
          >
            <SidebarHeader className="gap-2 px-4 py-4 border-b border-slate-200">
              <div className="bg-blue-600 text-white grid h-10 w-10 place-items-center rounded-lg text-sm font-semibold">
                HMS
              </div>
              <div className="leading-tight">
                <p className="text-sm font-semibold text-slate-900">
                  Doctor Portal
                </p>
                <p className="text-xs text-slate-600">
                  {user?.department || "HMS"}
                </p>
              </div>
            </SidebarHeader>
            <SidebarContent>
              <SidebarGroup>
                <SidebarGroupLabel className="text-slate-600">
                  Navigation
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {navItems.map((item) => {
                      const Icon = item.icon;
                      const isActive = pathname.startsWith(item.href);
                      return (
                        <SidebarMenuItem key={item.title}>
                          <SidebarMenuButton
                            asChild
                            isActive={isActive}
                            className={cn(
                              "h-10 rounded-lg px-4 py-3 font-medium transition-colors",
                              isActive
                                ? "bg-blue-50 text-blue-700 border-l-4 border-blue-600"
                                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                            )}
                          >
                            <Link href={item.href}>
                              <Icon className="size-4" />
                              <span>{item.title}</span>
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      );
                    })}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>
            <SidebarFooter className="px-4 pb-4 border-t border-slate-200">
              <div className="space-y-2">
                <div className="flex items-center justify-between rounded-lg bg-slate-50 border border-slate-200 px-3 py-2">
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      {user?.fullName || user?.email}
                    </p>
                    <p className="text-xs text-slate-600">Doctor</p>
                  </div>
                </div>
                <Button
                  onClick={logout}
                  variant="outline"
                  size="sm"
                  className="w-full border-slate-200 text-slate-700 hover:bg-slate-100"
                >
                  <LogOut className="size-4 mr-2" />
                  Logout
                </Button>
              </div>
            </SidebarFooter>
            <SidebarRail />
          </Sidebar>

          <div className="flex-1 min-w-0 w-full">
            <header className="sticky top-0 z-20 w-full border-b bg-background/80 backdrop-blur">
              <div className="flex h-14 w-full items-center gap-3 px-3 sm:px-5">
                <SidebarTrigger className="md:hidden" />
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Breadcrumb>
                    <BreadcrumbList>
                      {breadcrumbs.map((item) => (
                        <React.Fragment key={item.href}>
                          <BreadcrumbItem>
                            {item.isLast ? (
                              <span className="text-foreground font-medium">
                                {item.name}
                              </span>
                            ) : (
                              <span>{item.name}</span>
                            )}
                          </BreadcrumbItem>
                          {!item.isLast && <BreadcrumbSeparator />}
                        </React.Fragment>
                      ))}
                    </BreadcrumbList>
                  </Breadcrumb>
                </div>
              </div>
            </header>

            <main className="w-full max-w-full py-8">
              <div className="page-shell">
                <div className="space-y-6">{children}</div>
              </div>
            </main>
          </div>
        </div>
        <Toaster />
      </SidebarProvider>
    </QueryClientProvider>
  );
}

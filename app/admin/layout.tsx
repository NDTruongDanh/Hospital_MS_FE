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
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

import { useAuth } from "@/contexts/AuthContext";
import { LogOut, Bell, Search } from "lucide-react";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { cn } from "@/lib/utils";

const navigationGroups = [
  {
    label: "Overview",
    items: [
      {
        title: "Dashboard",
        href: "/admin",
        icon: NAV_ICONS.dashboard,
        roles: ["ADMIN", "DOCTOR", "NURSE"],
      },
    ],
  },
  {
    label: "Patient Management",
    items: [
      {
        title: "Queue",
        href: "/admin/queue",
        icon: NAV_ICONS.appointments,
        roles: ["ADMIN", "DOCTOR", "NURSE", "RECEPTIONIST"],
      },
      {
        title: "Patient reception",
        href: "/admin/walk-in",
        icon: NAV_ICONS.patients,
        roles: ["ADMIN", "RECEPTIONIST"],
      },
      {
        title: "Appointments",
        href: "/admin/appointments",
        icon: NAV_ICONS.appointments,
        roles: ["ADMIN", "NURSE", "RECEPTIONIST"],
      },
      {
        title: "Patients",
        href: "/admin/patients",
        icon: NAV_ICONS.patients,
        roles: ["ADMIN", "DOCTOR", "NURSE", "RECEPTIONIST"],
      },
    ],
  },
  {
    label: "Clinical Services",
    items: [
      {
        title: "Examinations",
        href: "/admin/exams",
        icon: NAV_ICONS.exams,
        roles: ["ADMIN", "DOCTOR", "NURSE"],
      },
    ],
  },
  {
    label: "Laboratory",
    items: [
      {
        title: "Lab Tests",
        href: "/admin/lab-tests",
        icon: NAV_ICONS.labTests,
        roles: ["ADMIN"],
      },
      {
        title: "Lab Results",
        href: "/admin/lab-results",
        icon: NAV_ICONS.labResults,
        roles: ["ADMIN", "DOCTOR", "NURSE"],
      },
      {
        title: "Lab orders",
        href: "/admin/lab-orders",
        icon: NAV_ICONS.labTests,
        roles: ["ADMIN", "DOCTOR", "NURSE"],
      },
    ],
  },
  {
    label: "Pharmacy",
    items: [
      {
        title: "Medicines",
        href: "/admin/medicines",
        icon: NAV_ICONS.medicines,
        roles: ["ADMIN"],
      },
    ],
  },
  {
    label: "Administrative",
    items: [
      {
        title: "HR Management",
        href: "/admin/hr",
        icon: NAV_ICONS.hr,
        roles: ["ADMIN"],
      },
      {
        title: "Accounts",
        href: "/admin/accounts",
        icon: NAV_ICONS.accounts,
        roles: ["ADMIN"],
      },
      {
        title: "Billing",
        href: "/admin/billing",
        icon: NAV_ICONS.billing,
        roles: ["ADMIN", "RECEPTIONIST"],
      },
      {
        title: "Reports",
        href: "/admin/reports",
        icon: NAV_ICONS.reports,
        roles: ["ADMIN", "DOCTOR"],
      },
    ],
  },
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

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const breadcrumbs = buildBreadcrumbs(pathname);
  const { user, logout } = useAuth();

  // Filter navigation groups and items based on user role
  const filteredGroups = navigationGroups
    .map((group) => ({
      ...group,
      items: group.items.filter(
        (item) => user && item.roles.includes(user.role)
      ),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <RoleGuard allowedRoles={["ADMIN", "DOCTOR", "NURSE", "RECEPTIONIST"]}>
      <SidebarProvider>
        <div className="bg-slate-50 text-foreground flex min-h-screen w-screen">
          <Sidebar className="border-r-0" collapsible="offcanvas">
            {/* Sidebar with gradient background */}
            <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900" />

            <SidebarHeader className="relative z-10 gap-3 px-4 py-5 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-br from-sky-400 to-teal-500 text-white grid h-10 w-10 place-items-center rounded-xl text-sm font-bold shadow-lg shadow-sky-500/20">
                  HMS
                </div>
                <div className="leading-tight group-data-[collapsible=icon]:hidden">
                  <p className="text-sm font-semibold text-white">
                    Health Management
                  </p>
                  <p className="text-xs text-slate-400">Hospital System</p>
                </div>
              </div>
            </SidebarHeader>

            <SidebarContent className="relative z-10">
              {filteredGroups.map((group, groupIndex) => (
                <SidebarGroup key={group.label}>
                  <SidebarGroupLabel className="text-slate-400 text-xs uppercase tracking-wider px-4 mb-2">
                    {group.label}
                  </SidebarGroupLabel>
                  <SidebarGroupContent>
                    <SidebarMenu className="px-2 space-y-1">
                      {group.items.map((item) => {
                        const Icon = item.icon;
                        // Fix active logic: exact match for Dashboard, startsWith for others
                        const isActive =
                          item.href === "/admin"
                            ? pathname === "/admin"
                            : pathname.startsWith(item.href);
                        return (
                          <SidebarMenuItem key={item.title}>
                            <SidebarMenuButton
                              asChild
                              isActive={isActive}
                              className={cn(
                                "h-10 rounded-lg px-3 py-2.5 font-medium transition-all duration-200",
                                isActive
                                  ? "bg-gradient-to-r from-sky-500/20 to-teal-500/10 text-white border-l-2 border-sky-400 shadow-sm"
                                  : "text-slate-300 hover:bg-white/5 hover:text-white"
                              )}
                            >
                              <Link href={item.href}>
                                <Icon
                                  className={cn(
                                    "size-4 transition-colors",
                                    isActive ? "text-sky-400" : "text-slate-400"
                                  )}
                                />
                                <span>{item.title}</span>
                              </Link>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        );
                      })}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </SidebarGroup>
              ))}
            </SidebarContent>

            <SidebarFooter className="relative z-10 px-3 pb-4 border-t border-white/10 pt-4">
              <div className="space-y-3">
                {/* User profile card */}
                <div className="flex items-center gap-3 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 px-3 py-2.5 group-data-[collapsible=icon]:justify-center">
                  <div className="h-9 w-9 rounded-full bg-gradient-to-br from-sky-400 to-teal-500 flex items-center justify-center text-white font-semibold text-sm shadow-md">
                    {(user?.fullName || user?.email || "U")
                      .charAt(0)
                      .toUpperCase()}
                  </div>
                  <div className="group-data-[collapsible=icon]:hidden">
                    <p className="text-sm font-medium text-white truncate max-w-[120px]">
                      {user?.fullName || user?.email}
                    </p>
                    <p className="text-xs text-slate-400">{user?.role}</p>
                  </div>
                </div>

                {/* Logout button */}
                <Button
                  onClick={logout}
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-slate-300 hover:text-white hover:bg-white/10 group-data-[collapsible=icon]:justify-center"
                >
                  <LogOut className="size-4 mr-2 group-data-[collapsible=icon]:mr-0" />
                  <span className="group-data-[collapsible=icon]:hidden">
                    Logout
                  </span>
                </Button>
              </div>
            </SidebarFooter>
          </Sidebar>

          <div className="flex-1 min-w-0 w-full">
            {/* Enhanced header */}
            <header className="sticky top-0 z-20 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md">
              <div className="flex h-16 w-full items-center justify-between gap-4 px-4 sm:px-6">
                <div className="flex items-center gap-3">
                  <SidebarTrigger className="md:hidden text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg p-2" />
                  <div className="hidden sm:flex items-center gap-2 text-sm">
                    <Breadcrumb>
                      <BreadcrumbList>
                        {breadcrumbs.map((item) => (
                          <React.Fragment key={item.href}>
                            <BreadcrumbItem>
                              {item.isLast ? (
                                <span className="text-slate-900 font-medium">
                                  {item.name}
                                </span>
                              ) : (
                                <span className="text-slate-500 hover:text-slate-700 transition-colors">
                                  {item.name}
                                </span>
                              )}
                            </BreadcrumbItem>
                            {!item.isLast && (
                              <BreadcrumbSeparator className="text-slate-300" />
                            )}
                          </React.Fragment>
                        ))}
                      </BreadcrumbList>
                    </Breadcrumb>
                  </div>
                </div>

                {/* Header actions */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                  >
                    <Search className="size-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-slate-500 hover:text-slate-900 hover:bg-slate-100 relative"
                  >
                    <Bell className="size-5" />
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-sky-500 rounded-full" />
                  </Button>
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
    </RoleGuard>
  );
}

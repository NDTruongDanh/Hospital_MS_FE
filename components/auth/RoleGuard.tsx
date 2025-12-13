"use client";

import { Loading } from "@/components/ui/loading";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

type RoleGuardProps = {
  children: React.ReactNode;
  allowedRoles: string[];
  redirectTo?: string;
};

export function RoleGuard({
  children,
  allowedRoles,
  redirectTo,
}: RoleGuardProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const hasRedirected = useRef(false);

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      // Not logged in, redirect to login
      if (!hasRedirected.current) {
        hasRedirected.current = true;
        router.push("/login");
      }
      return;
    }

    if (!allowedRoles.includes(user.role)) {
      // Not authorized for this role
      if (hasRedirected.current) return; // Prevent redirect loop

      let targetUrl = redirectTo;
      if (!targetUrl) {
        // Redirect to default dashboard based on role
        if (user.role === "PATIENT") {
          targetUrl = "/patient/appointments";
        } else if (user.role === "RECEPTIONIST") {
          targetUrl = "/admin/patients";
        } else {
          targetUrl = "/admin";
        }
      }

      // Only redirect if not already at target
      if (pathname !== targetUrl && !pathname.startsWith(targetUrl)) {
        hasRedirected.current = true;
        router.push(targetUrl);
      }
    }
  }, [user, isLoading, allowedRoles, redirectTo, router, pathname]);

  // Show loading or nothing while checking auth
  if (isLoading || !user || !allowedRoles.includes(user.role)) {
    return <Loading fullScreen />;
  }

  return <>{children}</>;
}

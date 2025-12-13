"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { redirect } from "next/navigation";

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const queryClient = useMemo(() => new QueryClient(), []);
  const { role } = useAuth();

  // Redirect to appropriate role-based layout
  if (role === "DOCTOR") {
    redirect("/doctor/appointments");
  } else if (role === "ADMIN") {
    redirect("/admin/profile");
  }

  // Only PATIENT role uses this layout
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto py-8">{children}</div>
      </div>
    </QueryClientProvider>
  );
}

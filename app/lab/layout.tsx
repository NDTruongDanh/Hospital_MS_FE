"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function LabLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  useEffect(() => {
    // Check if user is lab technician
    const userData = localStorage.getItem("user");
    if (!userData) {
      router.push("/login");
      return;
    }

    try {
      const user = JSON.parse(userData);
      // Allow ADMIN and lab-related roles (adjust as needed)
      const allowedRoles = ["ADMIN", "LAB_TECHNICIAN", "DOCTOR", "NURSE"];
      
      if (!allowedRoles.includes(user.userType)) {
        router.push("/unauthorized");
      }
    } catch (error) {
      router.push("/login");
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-[hsl(var(--background))]">
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}

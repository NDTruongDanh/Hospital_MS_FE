"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";

export type UserRole =
  | "ADMIN"
  | "DOCTOR"
  | "PATIENT"
  | "RECEPTIONIST"
  | "NURSE"
  | "UNKNOWN";

type User = {
  email: string;
  role: string;
  fullName?: string;
  employeeId?: string;
  patientId?: string;
  department?: string;
};

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  hasRole: (roles: string | string[]) => boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Load user from cookies on mount
  useEffect(() => {
    const email = Cookies.get("userEmail");
    const role = Cookies.get("userRole");
    const fullName = Cookies.get("userFullName");
    const employeeId = Cookies.get("userEmployeeId");
    const patientId = Cookies.get("userPatientId");
    const department = Cookies.get("userDepartment");

    if (email && role) {
      setUser({
        email,
        role,
        fullName,
        employeeId,
        patientId,
        department,
      });
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    // Import dynamically to avoid circular dependency
    const { mockAuthService } = await import("@/services/auth.mock.service");
    const { MOCK_USERS } = await import("@/services/auth.mock.service");

    const response = await mockAuthService.login({ email, password });

    // Find full user details
    const userDetails = MOCK_USERS.find((u) => u.email === email);
    console.log("[AuthContext] Login - email:", email);
    console.log("[AuthContext] Login - userDetails found:", userDetails);
    console.log("[AuthContext] Login - response.role:", response.role);

    // Store in cookies
    Cookies.set("accessToken", response.accessToken, { expires: 7 });
    Cookies.set("refreshToken", response.refreshToken, { expires: 30 });
    Cookies.set("userEmail", response.email, { expires: 7 });
    Cookies.set("userRole", response.role, { expires: 7 });

    // Sync to localStorage for compatibility
    localStorage.setItem("accessToken", response.accessToken);
    localStorage.setItem("userEmail", response.email);
    localStorage.setItem("userRole", response.role);

    // Store doctorId in localStorage for doctor-specific pages
    if (response.role === "DOCTOR" && userDetails?.employeeId) {
      console.log(
        "[AuthContext] Storing employeeId in localStorage:",
        userDetails.employeeId
      );
      localStorage.setItem("userEmployeeId", userDetails.employeeId);
    } else {
      localStorage.removeItem("userEmployeeId");
    }

    if (userDetails) {
      if (userDetails.fullName) {
        Cookies.set("userFullName", userDetails.fullName, { expires: 7 });
      }
      if (userDetails.employeeId) {
        console.log(
          "[AuthContext] Setting employeeId cookie:",
          userDetails.employeeId
        );
        Cookies.set("userEmployeeId", userDetails.employeeId, { expires: 7 });
      }
      if (userDetails.patientId) {
        Cookies.set("userPatientId", userDetails.patientId, { expires: 7 });
      }
      if (userDetails.department) {
        Cookies.set("userDepartment", userDetails.department, { expires: 7 });
      }
    }

    // Set user state
    setUser({
      email: response.email,
      role: response.role,
      fullName: userDetails?.fullName,
      employeeId: userDetails?.employeeId,
      patientId: userDetails?.patientId,
      department: userDetails?.department,
    });

    // Redirect based on role
    if (response.role === "PATIENT") {
      router.push("/patient/appointments");
    } else if (response.role === "RECEPTIONIST") {
      router.push("/admin/patients");
    } else if (response.role === "DOCTOR") {
      // Add specific redirection for DOCTOR
      router.push("/doctor/appointments");
    } else {
      router.push("/admin"); // Fallback for other admin-like roles, if any
    }
  };

  const logout = () => {
    // Clear cookies
    Cookies.remove("accessToken");
    Cookies.remove("refreshToken");
    Cookies.remove("userEmail");
    Cookies.remove("userRole");
    Cookies.remove("userFullName");
    Cookies.remove("userEmployeeId");
    Cookies.remove("userPatientId");
    Cookies.remove("userDepartment");

    // Clear relevant local storage
    localStorage.removeItem("userEmployeeId");
    localStorage.removeItem("accessToken");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userRole");

    // Clear state
    setUser(null);

    // Redirect to login
    router.push("/login");
  };

  const hasRole = (roles: string | string[]) => {
    if (!user) return false;
    const roleArray = Array.isArray(roles) ? roles : [roles];
    return roleArray.includes(user.role);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

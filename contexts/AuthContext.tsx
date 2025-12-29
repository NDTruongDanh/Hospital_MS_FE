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
  accountId?: string;
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
  refreshUserProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Load user from cookies on mount
  useEffect(() => {
    console.log("[AuthContext] Initializing - reading cookies...");
    const email = Cookies.get("userEmail");
    const role = Cookies.get("userRole");
    const fullName = Cookies.get("userFullName");
    const employeeId = Cookies.get("userEmployeeId");
    const patientId = Cookies.get("userPatientId");
    const department = Cookies.get("userDepartment");
    const accountId = Cookies.get("userAccountId");

    console.log("[AuthContext] Cookies found:", { email, role, fullName });

    if (email && role) {
      console.log("[AuthContext] Setting user from cookies");
      setUser({
        accountId,
        email,
        role,
        fullName,
        employeeId,
        patientId,
        department,
      });
    } else {
      console.log("[AuthContext] No valid cookies found, user stays null");
    }
    setIsLoading(false);
    console.log("[AuthContext] isLoading set to false");
  }, []);

  const login = async (email: string, password: string) => {
    // Check USE_MOCK to decide which service to use
    // Dynamic imports to avoid issues regardless of mode
    const { USE_MOCK } = await import("@/lib/mocks/toggle");
    
    if (USE_MOCK) {
      // Import dynamically to avoid circular dependency
      const { mockAuthService } = await import("@/services/auth.mock.service");
      const { MOCK_USERS } = await import("@/services/auth.mock.service");

      const response = await mockAuthService.login({ email, password });

      // Find full user details
      const userDetails = MOCK_USERS.find((u) => u.email === email);
      console.log("[AuthContext] Mock Login - email:", email);
      
      // Store in cookies
      Cookies.set("accessToken", response.accessToken, { expires: 7 });
      Cookies.set("refreshToken", response.refreshToken, { expires: 30 });
      Cookies.set("userEmail", response.email, { expires: 7 });
      Cookies.set("userRole", response.role, { expires: 7 });

      // Sync to localStorage
      localStorage.setItem("accessToken", response.accessToken);
      localStorage.setItem("userEmail", response.email);
      localStorage.setItem("userRole", response.role);

      // Handle extra details (Mock only for now)
      if (userDetails) {
        if (userDetails.fullName) Cookies.set("userFullName", userDetails.fullName, { expires: 7 });
        if (userDetails.employeeId) Cookies.set("userEmployeeId", userDetails.employeeId, { expires: 7 });
        if (userDetails.patientId) Cookies.set("userPatientId", userDetails.patientId, { expires: 7 });
        if (userDetails.department) Cookies.set("userDepartment", userDetails.department, { expires: 7 });
        
        // LocalStorage for Doctor
        if (response.role === "DOCTOR" && userDetails.employeeId) {
          localStorage.setItem("userEmployeeId", userDetails.employeeId);
        } else {
          localStorage.removeItem("userEmployeeId");
        }
      }

      setUser({
        email: response.email,
        role: response.role,
        fullName: userDetails?.fullName,
        employeeId: userDetails?.employeeId,
        patientId: userDetails?.patientId,
        department: userDetails?.department,
      });

      handleRedirect(response.role);
    } else {
      // Real Backend Login
      const { authService } = await import("@/services/auth.service");
      console.log("[AuthContext] Real Login - using authService");
      
      const response = await authService.login({ email, password });
      
      // Store tokens
      Cookies.set("accessToken", response.accessToken, { expires: 7 });
      Cookies.set("refreshToken", response.refreshToken, { expires: 30 });
      Cookies.set("userEmail", response.email, { expires: 7 });
      Cookies.set("userRole", response.role, { expires: 7 });
      Cookies.set("userAccountId", response.accountId, { expires: 7 });

      localStorage.setItem("accessToken", response.accessToken);
      localStorage.setItem("userEmail", response.email);
      localStorage.setItem("userRole", response.role);
      localStorage.setItem("userAccountId", response.accountId);

      // Store IDs if present in response
      if (response.employeeId) {
        Cookies.set("userEmployeeId", response.employeeId, { expires: 7 });
        if (response.role === "DOCTOR") localStorage.setItem("userEmployeeId", response.employeeId);
      }
      if (response.patientId) {
        Cookies.set("userPatientId", response.patientId, { expires: 7 });
      }
      
      // Note: Real login might not return fullName/dep immediately. 
      // We rely on subsequent /me or profile fetches, or set defaults.
      // We will set fullName to email as fallback until profile loaded
      const fullName = response.email; 
      Cookies.set("userFullName", fullName, { expires: 7 });

      setUser({
        accountId: response.accountId,
        email: response.email,
        role: response.role,
        fullName: fullName, 
        employeeId: response.employeeId,
        patientId: response.patientId,
      });

      handleRedirect(response.role);
    }
  };

  const handleRedirect = (role: string) => {
    if (role === "PATIENT") {
      router.push("/patient/appointments");
    } else if (role === "RECEPTIONIST") {
      router.push("/receptionist/appointments");
    } else if (role === "DOCTOR") {
      router.push("/doctor/appointments");
    } else if (role === "NURSE") {
      router.push("/nurse/exams");
    } else if (role === "ADMIN") {
      router.push("/admin/dashboard");
    } else {
      // Fallback for unknown roles
      router.push("/admin/dashboard");
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

  // Fetch fresh user profile from backend using /auth/me
  const refreshUserProfile = async () => {
    const { USE_MOCK } = await import("@/lib/mocks/toggle");
    
    if (USE_MOCK) {
      // In mock mode, user data is already complete from login
      console.log("[AuthContext] Mock mode - refreshUserProfile skipped");
      return;
    }
    
    try {
      const { authService } = await import("@/services/auth.service");
      const account = await authService.getMe();
      
      // Update user state with fresh data
      setUser(prev => ({
        ...prev,
        accountId: account.id,
        email: account.email,
        role: account.role,
      }));
      
      // Update cookies
      Cookies.set("userEmail", account.email, { expires: 7 });
      Cookies.set("userRole", account.role, { expires: 7 });
      Cookies.set("userAccountId", account.id, { expires: 7 });
      
      console.log("[AuthContext] User profile refreshed:", account);
    } catch (error) {
      console.error("[AuthContext] Failed to refresh user profile:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, hasRole, refreshUserProfile }}>
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

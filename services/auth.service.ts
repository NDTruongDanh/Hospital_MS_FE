import axiosInstance from "@/config/axios";
import { PaginatedResponse } from "@/interfaces/pagination";

export type LoginRequest = {
  email: string;
  password: string;
};

// Backend response structure
type BackendLoginResponse = {
  accessToken: string;
  refreshToken: string;
  account: {
    id: string;
    email: string;
    role: string;
    emailVerified: boolean;
  };
};

export type LoginResponse = {
  accessToken: string;
  refreshToken: string;
  accountId: string;
  email: string;
  role: string;
  employeeId?: string;
  patientId?: string;
};

export interface Account {
  id: string;
  email: string;
  role: string;
  emailVerified?: boolean;
}

export interface AccountCreateRequest {
  email: string;
  password: string;
  role: "ADMIN" | "PATIENT" | "DOCTOR" | "NURSE" | "RECEPTIONIST";
}

export interface AccountUpdateRequest {
  email?: string;
  password?: string;
  role?: "ADMIN" | "PATIENT" | "DOCTOR" | "NURSE" | "RECEPTIONIST";
}

export const authService = {
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    console.log("[authService] Attempting login with:", credentials.email);
    console.log("[authService] Password length:", credentials.password?.length);
    
    const response = await axiosInstance.post<{ data: BackendLoginResponse }>(
      "/auth/login",
      credentials,
    );
    const { accessToken, refreshToken, account } = response.data.data;
    
    console.log("[authService] Login response account:", account);
    
    return {
      accessToken,
      refreshToken,
      accountId: account?.id || "",
      email: account?.email || credentials.email,
      role: account?.role || "UNKNOWN",
      // employeeId and patientId would need to be fetched from HR/Patient service
      // or added to AccountResponse in backend
    };
  },

  logout: async (refreshToken: string): Promise<void> => {
    await axiosInstance.post("/auth/logout", { refreshToken });
  },

  register: async (credentials: LoginRequest): Promise<LoginResponse> => {
    const response = await axiosInstance.post<{ data: BackendLoginResponse }>(
      "/auth/register",
      credentials,
    );
    const { accessToken, refreshToken, account } = response.data.data;
    return {
      accessToken,
      refreshToken,
      accountId: account?.id || "",
      email: account?.email || credentials.email,
      role: account?.role || "PATIENT",
    };
  },

  // Refresh token to get new access token
  refreshToken: async (refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> => {
    const response = await axiosInstance.post<{ data: { accessToken: string; refreshToken: string } }>(
      "/auth/refresh",
      { refreshToken },
    );
    return response.data.data;
  },

  // Get current authenticated user info
  getMe: async (): Promise<Account> => {
    const response = await axiosInstance.get<{ data: Account }>(
      "/auth/me",
    );
    return response.data.data;
  },

  // Account management (Admin only)
  getAccounts: async (
    search?: string, 
    roleFilter?: string | string[],
    excludeRoles?: string[]
  ): Promise<PaginatedResponse<Account>> => {
    // Build RSQL filter
    const filters: string[] = [];
    if (search) {
      filters.push(`email=like='${search}'`);
    }
    // Single role filter
    if (roleFilter && typeof roleFilter === 'string') {
      filters.push(`role==${roleFilter}`);
    }
    // Multiple roles filter (include any of these roles)
    if (roleFilter && Array.isArray(roleFilter) && roleFilter.length > 0) {
      filters.push(`role=in=(${roleFilter.join(',')})`);
    }
    // Exclude certain roles
    if (excludeRoles && excludeRoles.length > 0) {
      filters.push(`role=out=(${excludeRoles.join(',')})`);
    }
    const filter = filters.length > 0 ? filters.join(";") : undefined;

    const response = await axiosInstance.get<{ data: PaginatedResponse<Account> }>(
      "/auth/accounts/all",  // Fixed: GenericController exposes list at /all
      {
        params: { filter },
      },
    );
    return response.data.data;
  },

  getAccount: async (id: string): Promise<Account> => {
    const response = await axiosInstance.get<{ data: Account }>(
      `/auth/accounts/${id}`,
    );
    return response.data.data;
  },

  createAccount: async (data: AccountCreateRequest): Promise<Account> => {
    const response = await axiosInstance.post<{ data: Account }>(
      "/auth/accounts",
      data,
    );
    return response.data.data;
  },

  updateAccount: async (id: string, data: AccountUpdateRequest): Promise<Account> => {
    const response = await axiosInstance.put<{ data: Account }>(
      `/auth/accounts/${id}`,
      data,
    );
    return response.data.data;
  },

  deleteAccount: async (id: string): Promise<void> => {
    await axiosInstance.delete(`/auth/accounts/${id}`);
  },
};


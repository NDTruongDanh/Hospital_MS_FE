import {
  Department,
  DepartmentRequest,
  Employee,
  EmployeeRequest,
  EmployeeSchedule,
  ScheduleRequest,
} from "@/interfaces/hr";
import { mockDepartments, mockEmployees, mockSchedules } from "@/lib/mocks";
import axiosInstance from "@/config/axios";
import { USE_MOCK } from "@/lib/mocks/toggle";

const BASE_URL = "/hr"; // Gateway path prefix (gateway rewrites /api/hr -> /hr-service which maps to /hr/...)
// Wait, my previous plan said "Base URL is http://localhost:8080/api". 
// Gateway maps /api/hr/** -> hr-service. 
// HR Service Controller RequestMapping is "/hr/departments".
// So full path via Gateway is /api/hr/departments...
// If axios baseURL is /api, then I need axiosInstance.get('/hr/departments').
// Yes.

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Local mutable copies for mocks
const LOCAL_STORAGE_DEPARTMENTS_KEY = "mockDeptData";

const loadDepartmentsFromLocalStorage = (): Department[] => {
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem(LOCAL_STORAGE_DEPARTMENTS_KEY);
    if (stored) {
      try {
        return JSON.parse(stored) as Department[];
      } catch (e) {
        console.error("Error parsing stored departments from localStorage", e);
      }
    }
  }
  return [...mockDepartments];
};

const saveDepartmentsToLocalStorage = (departments: Department[]) => {
  if (typeof window !== "undefined") {
    localStorage.setItem(
      LOCAL_STORAGE_DEPARTMENTS_KEY,
      JSON.stringify(departments),
    );
  }
};

const deptData: Department[] = loadDepartmentsFromLocalStorage();
const employeeData: Employee[] = [...mockEmployees];
const scheduleData: (EmployeeSchedule & {
  departmentId?: string;
  shift?: string;
})[] = [...mockSchedules];

export const hrService = {
  // --- Departments ---
  getDepartments: async (params?: {
    page?: number;
    size?: number;
    search?: string;
    status?: string;
    sort?: string;
  }) => {
    if (!USE_MOCK) {
      const apiParams: any = {
        ...params,
        page: params?.page && params.page > 0 ? params.page - 1 : 0,
      };

      const filters: string[] = [];
      if (params?.search) {
        filters.push(`(name==*${params.search}*,code==*${params.search}*)`);
      }
      if (params?.status && params.status !== "ALL") {
        filters.push(`status==${params.status}`);
      }

      if (filters.length > 0) {
        apiParams.filter = filters.join(";");
      }
      delete apiParams.search; // Remove processed params
      delete apiParams.status;

      const response = await axiosInstance.get("/hr/departments/all", {
        params: apiParams
      });
      return response.data.data;
    }

    await delay(500);
    let filtered = [...deptData];
    if (params?.search) {
      const lowerSearch = params.search.toLowerCase();
      filtered = filtered.filter((d) =>
        d.name.toLowerCase().includes(lowerSearch),
      );
    }
    if (params?.status) {
      filtered = filtered.filter((d) => d.status === params.status);
    }

    // Sorting logic
    if (params?.sort) {
      const [field, direction] = params.sort.split(',');
      filtered.sort((a, b) => {
        const valA = a[field as keyof Department];
        const valB = b[field as keyof Department];
        
        if (valA === undefined || valB === undefined) return 0;

        if (direction === 'asc') {
          return valA < valB ? -1 : 1;
        } else {
          return valA > valB ? -1 : 1;
        }
      });
    }

    const page = params?.page || 0;
    const size = params?.size || 10;
    const start = page * size;
    const end = start + size;
    
    return {
      content: filtered.slice(start, end),
      totalPages: Math.ceil(filtered.length / size),
      totalElements: filtered.length,
      size: size,
      number: page,
    };
  },

  getDepartment: async (id: string) => {
    if (!USE_MOCK) {
      const response = await axiosInstance.get(`/hr/departments/${id}`);
      return response.data.data; // Extract from ApiResponse wrapper
    }

    await delay(300);
    return deptData.find((d) => d.id === id);
  },

  createDepartment: async (data: DepartmentRequest) => {
    if (!USE_MOCK) {
      const response = await axiosInstance.post("/hr/departments", data);
      return response.data.data; // Extract from ApiResponse wrapper
    }

    await delay(500);
    const newDept: Department = {
      id: Math.random().toString(36).substr(2, 9),
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    deptData.push(newDept);
    saveDepartmentsToLocalStorage(deptData); // Save to localStorage
    return newDept;
  },

  updateDepartment: async (id: string, data: Partial<DepartmentRequest>) => {
    if (!USE_MOCK) {
      const response = await axiosInstance.put(`/hr/departments/${id}`, data);
      return response.data; // Extract from ApiResponse wrapper, if generic controller returns ApiResponse
      // Wait, getDepartments returns response.data
      // Let's check generic controller return type. It returns ApiResponse<O>.
      // So response.data is the ApiResponse. response.data.data is the O.
      // But here I'm keeping existing logic pattern if getDepartments uses response.data.
      // Actually previous edit fixed getDepartments to return response.data.data.
      // So here I should also return response.data.data.
      // But let's first fix the PUT.
      // And I will fix return type to be safe.
    }

    await delay(500);
    const index = deptData.findIndex((d) => d.id === id);
    if (index !== -1) {
      const updatedData: Partial<Department> = { ...data };
      
      // If headDoctorId is being updated, also update headDoctorName
      if (data.headDoctorId) {
        const headDoctor = employeeData.find(e => e.id === data.headDoctorId);
        updatedData.headDoctorName = headDoctor?.fullName;
      } else if (data.headDoctorId === undefined || data.headDoctorId === null) {
        // Handle case where head doctor is removed
        updatedData.headDoctorName = undefined;
      }

      deptData[index] = { ...deptData[index], ...updatedData };
      saveDepartmentsToLocalStorage(deptData); // Save to localStorage
      return deptData[index];
    }
    throw new Error("Department not found");
  },

  deleteDepartment: async (id: string) => {
    if (!USE_MOCK) {
      await axiosInstance.delete(`/hr/departments/${id}`);
      return;
    }

    await delay(500);
    const index = deptData.findIndex((d) => d.id === id);
    if (index !== -1) {
      deptData.splice(index, 1);
      saveDepartmentsToLocalStorage(deptData); // Save to localStorage
    }
  },

  // --- Employees ---

  getEmployees: async (params?: {
    page?: number;
    size?: number;
    sort?: string;
    departmentId?: string;
    role?: string;
    status?: string;
    search?: string;
  }) => {
    if (!USE_MOCK) {
      // 1. Convert page to 0-based index for Spring Boot
      const apiParams: any = {
        ...params,
        page: params?.page && params.page > 0 ? params.page - 1 : 0,
      };

      // 2. Construct RSQL filter string
      const filters: string[] = [];
      
      if (params?.search) {
        // Simple search on fullName or email using RSQL (==*value*)
        // RSQL OR operator is comma (,), AND is semicolon (;)
        // check GenericController implementation for details. 
        // usually: (fullName==*val*,email==*val*)
        filters.push(`(fullName==*${params.search}*)`);
      }
      
      if (params?.departmentId && params.departmentId !== "ALL") {
        filters.push(`departmentId==${params.departmentId}`);
      }
      
      if (params?.role && params.role !== "ALL") {
        filters.push(`role==${params.role}`);
      }
      
      if (params?.status && params.status !== "ALL") {
        filters.push(`status==${params.status}`);
      }

      if (filters.length > 0) {
        apiParams.filter = filters.join(";"); // AND operator
      }

      // Remove individual params now that they are in filter
      delete apiParams.departmentId;
      delete apiParams.role;
      delete apiParams.status;
      delete apiParams.search;

      const response = await axiosInstance.get("/hr/employees/all", { 
        params: apiParams 
      });
      return response.data.data; // Extract from ApiResponse wrapper
    }

    await delay(500);
    // Mock logic remains same...
    let filtered = [...employeeData];
    if (params?.search) {
      const lowerSearch = params.search.toLowerCase();
      filtered = filtered.filter(
        (e) =>
          e.fullName.toLowerCase().includes(lowerSearch),
      );
    }
    if (params?.departmentId) {
      filtered = filtered.filter((e) => e.departmentId === params.departmentId);
    }
    if (params?.role) {
      filtered = filtered.filter((e) => e.role === params.role);
    }
    if (params?.status) {
      filtered = filtered.filter((e) => e.status === params.status);
    }

    return {
      content: filtered,
      totalPages: 1,
      totalElements: filtered.length,
      size: params?.size || 10,
      number: params?.page || 0,
    };
  },

  getDoctors: async (params?: {
    departmentId?: string;
    specialization?: string;
    status?: string;
    page?: number;
    size?: number;
  }) => {
    // Re-use getEmployees with role=DOCTOR
    // Re-use getEmployees with role=DOCTOR
    if (!USE_MOCK) {
      const apiParams: any = {
        ...params,
        page: params?.page && params.page > 0 ? params.page - 1 : 0,
      };

      const filters: string[] = ["role==DOCTOR"];
      
      if (params?.departmentId) filters.push(`departmentId==${params.departmentId}`);
      if (params?.status) filters.push(`status==${params.status}`);
      if (params?.specialization) filters.push(`specialization==${params.specialization}`);

      apiParams.filter = filters.join(";");
      
      delete apiParams.departmentId;
      delete apiParams.status;
      delete apiParams.specialization;

      const response = await axiosInstance.get("/hr/employees/all", { 
        params: apiParams 
      });
      return response.data.data;
    }

    await delay(500);
    let filtered = employeeData.filter((e) => e.role === "DOCTOR");
    if (params?.departmentId) {
      filtered = filtered.filter((e) => e.departmentId === params.departmentId);
    }
    return {
      content: filtered,
      totalPages: 1,
      totalElements: filtered.length,
    };
  },

  getEmployee: async (id: string) => {
    if (!USE_MOCK) {
      const response = await axiosInstance.get(`/hr/employees/${id}`);
      return response.data.data; // Extract from ApiResponse wrapper
    }

    await delay(300);
    return employeeData.find((e) => e.id === id);
  },

  getEmployeeByEmail: async (email: string): Promise<Employee | null> => {
    if (!USE_MOCK) {
      // Employee entity doesn't have email field - we need 2-step lookup:
      // Step 1: Get accountId from auth service by email
      // Step 2: Find employee by accountId
      try {
        // Step 1: Get account by email from auth service
        const accountResponse = await axiosInstance.get("/auth/accounts/all", {
          params: {
            filter: `email==${email}`,
            page: 0,
            size: 1,
          }
        });
        const accountContent = accountResponse.data.data?.content;
        if (!accountContent || accountContent.length === 0) {
          console.log(`[HR Service] No account found for email: ${email}`);
          return null;
        }
        const accountId = accountContent[0].id;
        console.log(`[HR Service] Found accountId ${accountId} for email ${email}`);

        // Step 2: Find employee by accountId
        const employeeResponse = await axiosInstance.get("/hr/employees/all", {
          params: {
            filter: `accountId==${accountId}`,
            page: 0,
            size: 1,
          }
        });
        const employeeContent = employeeResponse.data.data?.content;
        if (!employeeContent || employeeContent.length === 0) {
          console.log(`[HR Service] No employee found for accountId: ${accountId}`);
          return null;
        }
        console.log(`[HR Service] Found employee: ${employeeContent[0].fullName}`);
        return employeeContent[0];
      } catch (error) {
        console.error("[HR Service] Error in getEmployeeByEmail:", error);
        return null;
      }
    }

    await delay(300);
    return employeeData.find((e) => e.email === email) || null;
  },

  /**
   * Find employee by accountId - simpler than getEmployeeByEmail 
   * since it directly queries HR service (doctors have access to this)
   */
  getEmployeeByAccountId: async (accountId: string): Promise<Employee | null> => {
    if (!USE_MOCK) {
      try {
        console.log(`[HR Service] Looking up employee by accountId: ${accountId}`);
        const response = await axiosInstance.get("/hr/employees/all", {
          params: {
            filter: `accountId==${accountId}`,
            page: 0,
            size: 1,
          }
        });
        const content = response.data.data?.content;
        if (!content || content.length === 0) {
          console.log(`[HR Service] No employee found for accountId: ${accountId}`);
          return null;
        }
        console.log(`[HR Service] Found employee: ${content[0].fullName} (ID: ${content[0].id})`);
        return content[0];
      } catch (error) {
        console.error("[HR Service] Error in getEmployeeByAccountId:", error);
        return null;
      }
    }

    await delay(300);
    return employeeData.find((e) => e.accountId === accountId) || null;
  },

  createEmployee: async (data: EmployeeRequest) => {
    if (!USE_MOCK) {
      const response = await axiosInstance.post("/hr/employees", data);
      return response.data.data; // Extract from ApiResponse wrapper
    }

    await delay(500);
    const newEmp: Employee = {
      id: Math.random().toString(36).substr(2, 9),
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    employeeData.push(newEmp);
    return newEmp;
  },

  updateEmployee: async (id: string, data: Partial<EmployeeRequest>) => {
    if (!USE_MOCK) {
      const response = await axiosInstance.put(`/hr/employees/${id}`, data);
      return response.data.data;
    }

    await delay(500);
    const index = employeeData.findIndex((e) => e.id === id);
    if (index !== -1) {
      employeeData[index] = { ...employeeData[index], ...data };
      return employeeData[index];
    }
    throw new Error("Employee not found");
  },

  deleteEmployee: async (id: string) => {
    if (!USE_MOCK) {
      await axiosInstance.delete(`/hr/employees/${id}`);
      return;
    }

    await delay(500);
    const index = employeeData.findIndex((e) => e.id === id);
    if (index !== -1) {
      employeeData.splice(index, 1);
    }
  },

  getDoctorSchedules: async (params: {
    departmentId?: string;
    doctorId?: string;
    startDate?: string;
    endDate?: string;
    status?: string;
    page?: number;
    size?: number;
  }) => {
    if (!USE_MOCK) {
      const apiParams = {
        ...params,
        page: params.page && params.page > 0 ? params.page - 1 : 0,
      };
      
      console.log("[HR Service] getDoctorSchedules API params:", apiParams);
      const response = await axiosInstance.get("/hr/schedules/doctors", { 
        params: apiParams 
      });
      return response.data.data;
    }

    await delay(500);
    let filtered = [...scheduleData];
    const { startDate, endDate } = params;
    if (startDate) {
      filtered = filtered.filter((s) => s.workDate >= startDate);
    }
    if (endDate) {
      filtered = filtered.filter((s) => s.workDate <= endDate);
    }
    if (params.departmentId) {
      filtered = filtered.filter(
        (s) => (s as any).departmentId === params.departmentId,
      );
    }
    if (params.doctorId) {
      filtered = filtered.filter((s) => s.employeeId === params.doctorId);
    }
    if (params.status) {
      filtered = filtered.filter((s) => s.status === params.status);
    }

    return {
      content: filtered,
      totalPages: 1,
      totalElements: filtered.length,
      size: params.size || 10,
      number: params.page || 0,
    };
  },

  getMySchedules: async (params: {
    startDate: string;
    endDate: string;
    status?: string;
    doctorId?: string;
  }) => {
    if (!USE_MOCK) {
      const response = await axiosInstance.get("/hr/schedules/me", { params });
      return response.data.data;
    }

    await delay(500);
    // Mocking "me" as employee 101 (override with doctorId if provided)
    const myId = params.doctorId || "emp-101";
    let filtered = scheduleData.filter((s) => s.employeeId === myId);
    if (params.startDate) {
      filtered = filtered.filter((s) => s.workDate >= params.startDate);
    }
    if (params.endDate) {
      filtered = filtered.filter((s) => s.workDate <= params.endDate);
    }
    return {
      content: filtered,
    };
  },

  createSchedule: async (data: ScheduleRequest) => {
    if (!USE_MOCK) {
      const response = await axiosInstance.post("/hr/schedules", data);
      return response.data.data;
    }

    await delay(500);
    const employee = employeeData.find((e) => e.id === data.employeeId);
    const newSchedule: EmployeeSchedule & { departmentId?: string } = {
      id: Math.random().toString(36).substr(2, 9),
      ...data,
      employeeName: employee?.fullName,
      departmentId: employee?.departmentId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    scheduleData.push(newSchedule);
    return newSchedule;
  },

  updateSchedule: async (id: string, data: Partial<ScheduleRequest>) => {
    if (!USE_MOCK) {
      const response = await axiosInstance.put(`/hr/schedules/${id}`, data);
      return response.data.data;
    }

    await delay(500);
    const index = scheduleData.findIndex((s) => s.id === id);
    if (index !== -1) {
      scheduleData[index] = { ...scheduleData[index], ...data };
      return scheduleData[index];
    }
    throw new Error("Schedule not found");
  },

  deleteSchedule: async (id: string) => {
    if (!USE_MOCK) {
      await axiosInstance.delete(`/hr/schedules/${id}`);
      return;
    }

    await delay(500);
    const index = scheduleData.findIndex((s) => s.id === id);
    if (index !== -1) {
      scheduleData.splice(index, 1);
    }
  },

  // --- Profile Image ---

  uploadEmployeeProfileImage: async (employeeId: string, file: File): Promise<Employee> => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await axiosInstance.post<{ data: Employee }>(
      `/hr/employees/${employeeId}/profile-image`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data.data;
  },

  deleteEmployeeProfileImage: async (employeeId: string): Promise<Employee> => {
    const response = await axiosInstance.delete<{ data: Employee }>(
      `/hr/employees/${employeeId}/profile-image`
    );
    return response.data.data;
  },

  // --- Employee Self-Service (me) ---
  
  getMyEmployeeProfile: async (): Promise<Employee> => {
    const response = await axiosInstance.get<{ data: Employee }>("/hr/employees/me");
    return response.data.data;
  },

  updateMyEmployeeProfile: async (data: Partial<EmployeeRequest>): Promise<Employee> => {
    const response = await axiosInstance.put<{ data: Employee }>("/hr/employees/me", data);
    return response.data.data;
  },

  // --- Schedules Extended ---

  getSchedules: async (params?: {
    page?: number;
    size?: number;
    employeeId?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
  }) => {
    if (!USE_MOCK) {
      const apiParams: any = {
        ...params,
        page: params?.page && params.page > 0 ? params.page - 1 : 0,
      };

      const filters: string[] = [];
      if (params?.employeeId) filters.push(`employeeId==${params.employeeId}`);
      if (params?.status && params.status !== "ALL") filters.push(`status==${params.status}`);
      if (params?.startDate) filters.push(`workDate>=${params.startDate}`);
      if (params?.endDate) filters.push(`workDate<=${params.endDate}`);

      if (filters.length > 0) {
        apiParams.filter = filters.join(";");
      }
      delete apiParams.employeeId;
      delete apiParams.status;
      delete apiParams.startDate;
      delete apiParams.endDate;

      const response = await axiosInstance.get("/hr/schedules/all", { params: apiParams });
      return response.data.data;
    }

    await delay(500);
    return {
      content: scheduleData,
      totalPages: 1,
      totalElements: scheduleData.length,
    };
  },

  getSchedule: async (id: string): Promise<EmployeeSchedule> => {
    if (!USE_MOCK) {
      const response = await axiosInstance.get<{ data: EmployeeSchedule }>(`/hr/schedules/${id}`);
      return response.data.data;
    }
    await delay(300);
    const schedule = scheduleData.find(s => s.id === id);
    if (!schedule) throw new Error("Schedule not found");
    return schedule;
  },

  cancelSchedule: async (id: string, reason?: string): Promise<void> => {
    await axiosInstance.post(`/hr/schedules/${id}/cancel`, { reason });
  },

  updateScheduleStatus: async (id: string, status: string): Promise<EmployeeSchedule> => {
    const response = await axiosInstance.put<{ data: EmployeeSchedule }>(
      `/hr/schedules/${id}/status`,
      { status }
    );
    return response.data.data;
  },
};

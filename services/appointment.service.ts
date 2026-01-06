import axiosInstance from "@/config/axios";
import {
  Appointment,
  AppointmentCreateRequest,
  AppointmentUpdateRequest,
  AppointmentCancelRequest,
  AppointmentListParams,
  PaginatedResponse,
  TimeSlot,
} from "@/interfaces/appointment";

// Export for mock usage
export type AppointmentResponse = Appointment;
import { USE_MOCK } from "@/lib/mocks/toggle";
import { mockSchedules, mockPatients, mockEmployees } from "@/lib/mocks";
import { subDays, addDays, set } from "date-fns";

const BASE_URL = "/appointments";
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const today = new Date();
const drNewTest = mockEmployees.find((e) => e.id === "emp-new-doctor-001")!;
const drJohnSmith = mockEmployees.find((e) => e.id === "emp-101")!;
const patient1 = mockPatients.find((p) => p.id === "p001")!;
const patient2 = mockPatients.find((p) => p.id === "p002")!;
const patient3 = mockPatients.find((p) => p.id === "p003")!;
const patient4 = mockPatients.find((p) => p.id === "p004")!;

const initialMockAppointments: Appointment[] = [
  // === Appointments for Dr. New Test (emp-new-doctor-001) ===
  {
    id: "appt-nt-001",
    patient: { id: patient1.id, fullName: patient1.fullName },
    doctor: {
      id: drNewTest.id,
      fullName: drNewTest.fullName,
      department: drNewTest.departmentName,
    },
    appointmentTime: set(addDays(today, 5), {
      hours: 10,
      minutes: 0,
      seconds: 0,
      milliseconds: 0,
    }).toISOString(),
    status: "SCHEDULED",
    type: "CONSULTATION",
    reason: "Annual check-up.",
    notes: "Patient is generally healthy. Discuss preventive care.",
    createdAt: subDays(today, 2).toISOString(),
    updatedAt: subDays(today, 2).toISOString(),
  },
  {
    id: "appt-nt-002",
    patient: { id: patient2.id, fullName: patient2.fullName },
    doctor: {
      id: drNewTest.id,
      fullName: drNewTest.fullName,
      department: drNewTest.departmentName,
    },
    appointmentTime: set(subDays(today, 14), {
      hours: 14,
      minutes: 30,
      seconds: 0,
      milliseconds: 0,
    }).toISOString(),
    status: "COMPLETED",
    type: "FOLLOW_UP",
    reason: "Follow-up on blood pressure medication.",
    notes:
      "Patient's blood pressure is now stable. Continue current medication. Next check-up in 6 months.",
    createdAt: subDays(today, 20).toISOString(),
    updatedAt: subDays(today, 14).toISOString(),
  },
  {
    id: "appt-nt-003",
    patient: { id: patient3.id, fullName: patient3.fullName },
    doctor: {
      id: drNewTest.id,
      fullName: drNewTest.fullName,
      department: drNewTest.departmentName,
    },
    appointmentTime: set(subDays(today, 3), {
      hours: 11,
      minutes: 0,
      seconds: 0,
      milliseconds: 0,
    }).toISOString(),
    status: "CANCELLED",
    type: "CONSULTATION",
    reason: "Flu-like symptoms.",
    cancelReason: "Patient cancelled due to conflicting schedule.",
    cancelledAt: subDays(today, 4).toISOString(),
    createdAt: subDays(today, 10).toISOString(),
    updatedAt: subDays(today, 4).toISOString(),
  },
  {
    id: "appt-nt-004",
    patient: { id: patient4.id, fullName: patient4.fullName },
    doctor: {
      id: drNewTest.id,
      fullName: drNewTest.fullName,
      department: drNewTest.departmentName,
    },
    appointmentTime: set(today, {
      hours: 15,
      minutes: 0,
      seconds: 0,
      milliseconds: 0,
    }).toISOString(),
    status: "SCHEDULED",
    type: "EMERGENCY",
    reason: "Minor injury, requires stitches.",
    createdAt: today.toISOString(),
    updatedAt: today.toISOString(),
  },
  {
    id: "appt-nt-005",
    patient: { id: patient1.id, fullName: patient1.fullName },
    doctor: {
      id: drNewTest.id,
      fullName: drNewTest.fullName,
      department: drNewTest.departmentName,
    },
    appointmentTime: set(addDays(today, 25), {
      hours: 9,
      minutes: 30,
      seconds: 0,
      milliseconds: 0,
    }).toISOString(),
    status: "SCHEDULED",
    type: "CONSULTATION",
    reason: "Discuss lab results.",
    notes: "",
    createdAt: subDays(today, 1).toISOString(),
    updatedAt: subDays(today, 1).toISOString(),
  },

  // === Appointments for other doctors (to test filtering) ===
  {
    id: "appt-js-001",
    patient: { id: patient4.id, fullName: patient4.fullName },
    doctor: {
      id: drJohnSmith.id,
      fullName: drJohnSmith.fullName,
      department: drJohnSmith.departmentName,
    },
    appointmentTime: set(addDays(today, 2), {
      hours: 11,
      minutes: 30,
      seconds: 0,
      milliseconds: 0,
    }).toISOString(),
    status: "SCHEDULED",
    type: "CONSULTATION",
    reason: "Heart palpitations.",
    createdAt: subDays(today, 1).toISOString(),
    updatedAt: subDays(today, 1).toISOString(),
  },
  {
    id: "appt-js-002",
    patient: { id: patient2.id, fullName: patient2.fullName },
    doctor: {
      id: drJohnSmith.id,
      fullName: drJohnSmith.fullName,
      department: drJohnSmith.departmentName,
    },
    appointmentTime: set(subDays(today, 30), {
      hours: 10,
      minutes: 0,
      seconds: 0,
      milliseconds: 0,
    }).toISOString(),
    status: "COMPLETED",
    type: "CONSULTATION",
    reason: "Initial consultation for chest pain.",
    notes: "ECG normal. Prescribed stress test.",
    createdAt: subDays(today, 35).toISOString(),
    updatedAt: subDays(today, 30).toISOString(),
  },
];

// --- localStorage persistence for mock data ---
const getMockAppointments = (): Appointment[] => {
  if (typeof window === "undefined") return initialMockAppointments;
  const stored = localStorage.getItem("mock_appointments");
  console.log("DEBUG: Reading from localStorage. Found data:", !!stored);
  if (stored) {
    const data = JSON.parse(stored);
    console.log(`DEBUG: Parsed ${data.length} appointments from localStorage.`);
    return data;
  } else {
    console.log(
      "DEBUG: No data in localStorage, initializing with default mock data.",
    );
    localStorage.setItem(
      "mock_appointments",
      JSON.stringify(initialMockAppointments),
    );
    return initialMockAppointments;
  }
};

const saveMockAppointments = (appointments: Appointment[]) => {
  if (typeof window !== "undefined") {
    console.log(
      `DEBUG: Saving ${appointments.length} appointments to localStorage.`,
    );
    localStorage.setItem("mock_appointments", JSON.stringify(appointments));
  }
};
// ---------------------------------------------

// Generate time slots based on doctor's schedule (30-min intervals)
const generateTimeSlotsWithSchedule = (
  date: string, // ADDED: date parameter
  startTime: string, // "07:00"
  endTime: string, // "12:00"
  bookedTimes: string[],
  currentTime?: string,
): TimeSlot[] => {
  const slots: TimeSlot[] = [];
  const [startHour, startMin] = startTime.split(":").map(Number);
  const [endHour, endMin] = endTime.split(":").map(Number);

  let currentHour = startHour;
  let currentMin = startMin;

  while (
    currentHour < endHour ||
    (currentHour === endHour && currentMin < endMin)
  ) {
    const time = `${currentHour.toString().padStart(2, "0")}:${currentMin
      .toString()
      .padStart(2, "0")}`;
    slots.push({
      time,
      available: !bookedTimes.includes(time),
      current: time === currentTime,
    });

    // Increment by 30 minutes
    currentMin += 30;
    if (currentMin >= 60) {
      currentMin = 0;
      currentHour += 1;
    }
  }

  return slots;
};

export const appointmentService = {
  // List appointments with filters and pagination
  list: async (
    params: AppointmentListParams,
  ): Promise<PaginatedResponse<Appointment>> => {
    if (!USE_MOCK) {
      // Build RSQL filter for backend
      const filters: string[] = [];
      
      if (params.doctorId) {
        filters.push(`doctorId==${params.doctorId}`);
      }
      if (params.patientId) {
        filters.push(`patientId==${params.patientId}`);
      }
      if (params.status) {
        filters.push(`status==${params.status}`);
      }
      // Date range filter - use ISO 8601 format with Z suffix for Instant fields
      if (params.startDate) {
        filters.push(`appointmentTime=ge=${params.startDate}T00:00:00Z`);
      }
      if (params.endDate) {
        filters.push(`appointmentTime=le=${params.endDate}T23:59:59Z`);
      }

      // Add search filter - for patients searching by doctor name, for others by patient name
      if (params.search) {
        // If patientId is set, user is a patient searching by doctor name
        // Otherwise, admin/staff searching by patient name
        const searchField = params.patientId ? "doctorName" : "patientName";
        filters.push(`${searchField}==*${params.search}*`);
      }

      const apiParams: Record<string, any> = {
        page: params.page,
        size: params.size,
        sort: params.sort,
      };

      if (filters.length > 0) {
        apiParams.filter = filters.join(";");
      }

      console.log("[AppointmentService] API params:", apiParams);
      const response = await axiosInstance.get(`${BASE_URL}/all`, { params: apiParams });
      return response.data.data; // Extract from ApiResponse wrapper
    }

    await delay(300);
    const mockAppointments = getMockAppointments();
    let filtered = [...mockAppointments];

    // Filter by search (patient name)
    if (params.search) {
      const term = params.search.toLowerCase();
      filtered = filtered.filter(
        (a) =>
          a.patient.fullName.toLowerCase().includes(term) ||
          a.doctor.fullName.toLowerCase().includes(term),
      );
    }

    // Filter by patientId
    if (params.patientId) {
      filtered = filtered.filter((a) => a.patient.id === params.patientId);
    }

    // Filter by doctorId
    if (params.doctorId) {
      filtered = filtered.filter((a) => a.doctor.id === params.doctorId);
    }

    // Filter by status
    if (params.status) {
      filtered = filtered.filter((a) => a.status === params.status);
    }

    // Filter by date range
    if (params.startDate) {
      filtered = filtered.filter((a) => a.appointmentTime >= params.startDate!);
    }
    if (params.endDate) {
      filtered = filtered.filter(
        (a) => a.appointmentTime <= params.endDate! + "T23:59:59",
      );
    }

    // Sort
    const sortField = params.sort?.split(",")[0] || "appointmentTime";
    const sortDir = params.sort?.split(",")[1] || "desc";

    filtered.sort((a, b) => {
      let aVal: any, bVal: any;

      if (sortField.includes(".")) {
        const [obj, prop] = sortField.split(".");
        aVal = (a as any)[obj][prop];
        bVal = (b as any)[obj][prop];
      } else {
        aVal = (a as any)[sortField];
        bVal = (b as any)[sortField];
      }

      if (aVal < bVal) return sortDir === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDir === "asc" ? 1 : -1;
      return 0;
    });

    // Pagination
    const page = params.page || 0;
    const size = params.size || 10;
    const start = page * size;
    const end = start + size;
    const content = filtered.slice(start, end);

    return {
      content,
      page,
      size,
      totalElements: filtered.length,
      totalPages: Math.max(1, Math.ceil(filtered.length / size)),
      last: end >= filtered.length,
    };
  },

  // Get appointment by ID
  getById: async (id: string): Promise<Appointment | null> => {
    if (!USE_MOCK) {
      const response = await axiosInstance.get(`${BASE_URL}/${id}`);
      return response.data.data; // Extract from ApiResponse wrapper
    }

    await delay(200);
    const mockAppointments = getMockAppointments();
    return mockAppointments.find((a) => a.id === id) || null;
  },

  // Create new appointment
  create: async (data: AppointmentCreateRequest): Promise<Appointment> => {
    if (!USE_MOCK) {
      console.log("[DEBUG] Creating appointment with payload:", JSON.stringify(data, null, 2));
      try {
        const response = await axiosInstance.post(BASE_URL, data);
        return response.data.data;
      } catch (error: any) {
        console.error("[DEBUG] Create Appointment Error:", JSON.stringify(error.response?.data, null, 2));
        throw error;
      }
    }

    await delay(300);
    const mockAppointments = getMockAppointments();

    // Validate appointment time is not in the past
    if (new Date(data.appointmentTime) < new Date()) {
      throw { response: { data: { error: { code: "PAST_APPOINTMENT" } } } };
    }

    // Extract date and time from appointmentTime
    const [appointmentDate, appointmentTime] = data.appointmentTime.split("T");
    const timeOnly = appointmentTime.substring(0, 5); // "HH:mm"

    // Check if doctor has schedule on this date
    const doctorSchedule = mockSchedules.find(
      (s: any) =>
        s.employeeId === data.doctorId && s.workDate === appointmentDate,
    );

    if (!doctorSchedule) {
      throw {
        response: { data: { error: { code: "DOCTOR_NOT_AVAILABLE" } } },
      };
    }

    // Check if appointment time is within schedule hours
    if (
      timeOnly < doctorSchedule.startTime ||
      timeOnly >= doctorSchedule.endTime
    ) {
      throw {
        response: { data: { error: { code: "DOCTOR_NOT_AVAILABLE" } } },
      };
    }

    // Check if time slot is already taken
    const isSlotTaken = mockAppointments.some(
      (a) =>
        a.doctor.id === data.doctorId &&
        a.status !== "CANCELLED" &&
        a.appointmentTime === data.appointmentTime,
    );

    if (isSlotTaken) {
      throw {
        response: { data: { error: { code: "TIME_SLOT_TAKEN" } } },
      };
    }

    // Fetch actual patient and doctor data
    const { getPatients } = await import("./patient.service");
    const { hrService } = await import("./hr.service");

    let patientName = `Patient ${data.patientId}`;
    let patientPhone = "";
    let doctorName = `Doctor ${data.doctorId}`;
    let doctorDept = "General";
    let doctorSpec = "General";

    try {
      const patientsResult = await getPatients({ page: 0, size: 100 });
      const patient = patientsResult.content.find(
        (p) => p.id === data.patientId,
      );
      if (patient) {
        patientName = patient.fullName;
        patientPhone = patient.phoneNumber || "";
      } else {
        throw {
          response: { data: { error: { code: "PATIENT_NOT_FOUND" } } },
        };
      }
    } catch (e: any) {
      if (e?.response?.data?.error?.code === "PATIENT_NOT_FOUND") throw e;
      console.warn("Failed to fetch patient data for new appointment");
    }

    try {
      const doctorsResult = await hrService.getEmployees({
        page: 0,
        size: 100,
        role: "DOCTOR",
      });
      const doctor = doctorsResult.content.find(
        (d: any) => d.id === data.doctorId,
      );
      if (doctor) {
        doctorName = doctor.fullName;
        doctorDept = doctor.departmentName ?? "General";
        doctorSpec = doctor.specialization || "General";
      } else {
        throw {
          response: { data: { error: { code: "EMPLOYEE_NOT_FOUND" } } },
        };
      }
    } catch (e: any) {
      if (e?.response?.data?.error?.code === "EMPLOYEE_NOT_FOUND") throw e;
      console.warn("Failed to fetch doctor data for new appointment");
    }

    const newAppointment: Appointment = {
      id: `apt-${Date.now()}`,
      patient: {
        id: data.patientId,
        fullName: patientName,
        phoneNumber: patientPhone,
      },
      doctor: {
        id: data.doctorId,
        fullName: doctorName,
        department: doctorDept,
        specialization: doctorSpec,
      },
      appointmentTime: data.appointmentTime,
      status: "SCHEDULED",
      type: data.type,
      reason: data.reason,
      notes: data.notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updatedAppointments = [newAppointment, ...mockAppointments];
    saveMockAppointments(updatedAppointments);
    return newAppointment;
  },

  // Update appointment (reschedule)
  update: async (
    id: string,
    data: AppointmentUpdateRequest,
  ): Promise<Appointment> => {
    if (!USE_MOCK) {
      console.log("[DEBUG] Updating appointment", id, "with payload:", JSON.stringify(data, null, 2));
      try {
        const response = await axiosInstance.put(`${BASE_URL}/${id}`, data);
        return response.data.data;
      } catch (error: any) {
        console.error("[DEBUG] Update Appointment Error:", JSON.stringify(error.response?.data, null, 2));
        throw error;
      }
    }

    await delay(300);
    const mockAppointments = getMockAppointments();
    const index = mockAppointments.findIndex((a) => a.id === id);
    if (index === -1) {
      throw {
        response: { data: { error: { code: "APPOINTMENT_NOT_FOUND" } } },
      };
    }

    const appointment = mockAppointments[index];
    if (appointment.status !== "SCHEDULED") {
      throw {
        response: { data: { error: { code: "APPOINTMENT_NOT_MODIFIABLE" } } },
      };
    }

    // If changing appointment time, validate doctor availability
    if (
      data.appointmentTime &&
      data.appointmentTime !== appointment.appointmentTime
    ) {
      const [appointmentDate, appointmentTime] =
        data.appointmentTime.split("T");
      const timeOnly = appointmentTime.substring(0, 5); // "HH:mm"

      // Check if doctor has schedule on new date
      const doctorSchedule = mockSchedules.find(
        (s: any) =>
          s.employeeId === appointment.doctor.id &&
          s.workDate === appointmentDate,
      );

      if (!doctorSchedule) {
        throw {
          response: { data: { error: { code: "DOCTOR_NOT_AVAILABLE" } } },
        };
      }

      // Check if new time is within schedule hours
      if (
        timeOnly < doctorSchedule.startTime ||
        timeOnly >= doctorSchedule.endTime
      ) {
        throw {
          response: { data: { error: { code: "DOCTOR_NOT_AVAILABLE" } } },
        };
      }

      // Check if new time slot is already taken (excluding current appointment)
      const isSlotTaken = mockAppointments.some(
        (a) =>
          a.id !== id &&
          a.doctor.id === appointment.doctor.id &&
          a.status !== "CANCELLED" &&
          a.appointmentTime === data.appointmentTime,
      );

      if (isSlotTaken) {
        throw {
          response: { data: { error: { code: "TIME_SLOT_TAKEN" } } },
        };
      }
    }

    mockAppointments[index] = {
      ...appointment,
      ...data,
      updatedAt: new Date().toISOString(),
    };

    saveMockAppointments(mockAppointments);
    return mockAppointments[index];
  },

  // Cancel appointment
  cancel: async (
    id: string,
    data: AppointmentCancelRequest,
    currentUserId?: string, // For permission check
    currentUserRole?: string,
  ): Promise<Appointment> => {
    if (!USE_MOCK) {
      const response = await axiosInstance.patch(
        `${BASE_URL}/${id}/cancel`,
        data,
      );
      return response.data.data;
    }

    await delay(300);
    const mockAppointments = getMockAppointments();
    const index = mockAppointments.findIndex((a) => a.id === id);
    if (index === -1) {
      throw {
        response: { data: { error: { code: "APPOINTMENT_NOT_FOUND" } } },
      };
    }

    const appointment = mockAppointments[index];

    // Permission check: PATIENT can only cancel own appointments
    if (
      currentUserRole === "PATIENT" &&
      appointment.patient.id !== currentUserId
    ) {
      throw {
        response: { data: { error: { code: "FORBIDDEN" } } },
      };
    }

    if (appointment.status === "CANCELLED") {
      throw { response: { data: { error: { code: "ALREADY_CANCELLED" } } } };
    }
    if (appointment.status !== "SCHEDULED") {
      throw {
        response: { data: { error: { code: "APPOINTMENT_NOT_CANCELLABLE" } } },
      };
    }

    mockAppointments[index] = {
      ...appointment,
      status: "CANCELLED",
      cancelledAt: new Date().toISOString(),
      cancelReason: data.cancelReason,
      updatedAt: new Date().toISOString(),
    };

    saveMockAppointments(mockAppointments);
    return mockAppointments[index];
  },

  // Complete appointment (doctor only)
  complete: async (
    id: string,
    currentUserId?: string, // For permission check - should be doctor's employee ID
    currentUserRole?: string,
  ): Promise<Appointment> => {
    if (!USE_MOCK) {
      const response = await axiosInstance.patch(`${BASE_URL}/${id}/complete`);
      return response.data;
    }

    await delay(300);
    const mockAppointments = getMockAppointments();
    const index = mockAppointments.findIndex((a) => a.id === id);
    if (index === -1) {
      throw {
        response: { data: { error: { code: "APPOINTMENT_NOT_FOUND" } } },
      };
    }

    const appointment = mockAppointments[index];

    // Permission check: Only assigned doctor can complete
    if (
      currentUserRole === "DOCTOR" &&
      appointment.doctor.id !== currentUserId
    ) {
      throw {
        response: { data: { error: { code: "FORBIDDEN" } } },
      };
    }

    if (appointment.status === "COMPLETED") {
      throw { response: { data: { error: { code: "ALREADY_COMPLETED" } } } };
    }
    if (appointment.status === "CANCELLED") {
      throw {
        response: { data: { error: { code: "APPOINTMENT_CANCELLED" } } },
      };
    }
    if (appointment.status === "NO_SHOW") {
      throw {
        response: { data: { error: { code: "APPOINTMENT_NO_SHOW" } } },
      };
    }

    mockAppointments[index] = {
      ...appointment,
      status: "COMPLETED",
      updatedAt: new Date().toISOString(),
    };

    saveMockAppointments(mockAppointments);
    return mockAppointments[index];
  },

  // Get available time slots for a doctor on a specific date
  getTimeSlots: async (
    doctorId: string,
    date: string,
    excludeAppointmentId?: string,
  ): Promise<TimeSlot[]> => {
    if (!USE_MOCK) {
      try {
        const response = await axiosInstance.get(`${BASE_URL}/slots`, {
          params: { doctorId, date },
        });
        return response.data.data;
      } catch (error: any) {
        console.error("❌ [AppointmentService] Error fetching time slots:", error.message);
        throw error;
      }
    }

    await delay(200);
    const mockAppointments = getMockAppointments();

    // Mock mode - using local data
    const doctorSchedule = mockSchedules.find(
      (s: any) => s.employeeId === doctorId && s.workDate === date,
    );

    if (!doctorSchedule) {
      console.log("DEBUG No doctorSchedule found for:", { doctorId, date });
      // Log some sample schedules for the doctor to see if any exist
      const doctorSpecificSchedules = mockSchedules.filter(
        (s: any) => s.employeeId === doctorId,
      );
      if (doctorSpecificSchedules.length > 0) {
        console.log(
          "DEBUG Found doctor-specific schedules (first 5):",
          doctorSpecificSchedules.slice(0, 5),
        );
      } else {
        console.log("DEBUG No schedules found for this doctor ID at all.");
      }
      return [];
    }
    console.log("DEBUG Found doctorSchedule:", doctorSchedule);

    // Get booked times for this doctor on this date
    const bookedTimes = mockAppointments
      .filter((a) => {
        if (a.doctor.id !== doctorId) return false;
        if (a.status === "CANCELLED") return false;
        if (excludeAppointmentId && a.id === excludeAppointmentId) return false;
        const aptDate = a.appointmentTime.split("T")[0];
        return aptDate === date;
      })
      .map((a) => {
        const time = a.appointmentTime.split("T")[1];
        return time.substring(0, 5); // "HH:mm"
      });

    // Current time if editing
    let currentTime: string | undefined;
    if (excludeAppointmentId) {
      const current = mockAppointments.find(
        (a) => a.id === excludeAppointmentId,
      );
      if (current) {
        const aptDate = current.appointmentTime.split("T")[0];
        if (aptDate === date) {
          currentTime = current.appointmentTime.split("T")[1].substring(0, 5);
        }
      }
    }

    // Generate slots only within doctor's schedule hours
    return generateTimeSlotsWithSchedule(
      date, // ADDED: date parameter
      doctorSchedule.startTime,
      doctorSchedule.endTime,
      bookedTimes,
      currentTime,
    );
  },
};

// Re-export types
export type { Appointment, AppointmentCreateRequest, AppointmentListParams };
export type AppointmentStatus =
  import("@/interfaces/appointment").AppointmentStatus;
export type AppointmentType =
  import("@/interfaces/appointment").AppointmentType;

// Legacy function exports for existing code compatibility
export const listAppointments = appointmentService.list;
export const createAppointment = (data: AppointmentCreateRequest) =>
  appointmentService.create(data);
export const updateAppointment = (id: string, data: AppointmentUpdateRequest) =>
  appointmentService.update(id, data);

export default appointmentService;

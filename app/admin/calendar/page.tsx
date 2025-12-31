"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CalendarView } from "@/components/calendar";
import { EventType, CalendarEvent, EVENT_COLORS } from "@/interfaces/calendar";
import { appointmentService } from "@/services/appointment.service";
import { getInvoiceList } from "@/services/billing.service";
import { labResultService } from "@/services/lab.service";
import { hrService } from "@/services/hr.service";
import { Appointment } from "@/interfaces/appointment";
import { Invoice } from "@/interfaces/billing";
import { LabTestResult } from "@/interfaces/lab";
import { EmployeeSchedule } from "@/interfaces/hr";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Calendar, DollarSign, FileText, Clock, ClipboardList } from "lucide-react";

export default function AdminCalendarPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<EventType>("appointment");
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  // Fetch data based on active tab
  useEffect(() => {
    fetchEvents();
  }, [activeTab]);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      let newEvents: CalendarEvent[] = [];

      if (activeTab === "appointment") {
        const response = await appointmentService.list({});
        const appointments: Appointment[] = response.content || [];
        newEvents = appointments.map((apt) => ({
          id: apt.id,
          type: "appointment" as EventType,
          date: new Date(apt.appointmentTime),
          time: apt.appointmentTime?.slice(11, 16) || apt.appointmentTime?.slice(0, 5),
          title: apt.patient?.fullName || "Bệnh nhân",
          subtitle: apt.doctor?.fullName || apt.reason || "",
          status: apt.status,
          color: EVENT_COLORS.appointment.bg,
        }));
      } else if (activeTab === "schedule") {
        // Fetch schedules and employees in parallel
        const [scheduleResponse, employeeResponse] = await Promise.all([
          hrService.getSchedules({}),
          hrService.getEmployees({ size: 1000 }), // Get all employees for name mapping
        ]);
        const schedules: EmployeeSchedule[] = scheduleResponse.content || [];
        const employees = employeeResponse.content || [];
        
        // Create employee ID to name map
        const employeeMap = new Map(
          employees.map((emp: { id: string; fullName: string }) => [emp.id, emp.fullName])
        );
        
        newEvents = schedules.map((sch) => {
          const empName = sch.employeeName || employeeMap.get(sch.employeeId) || "Nhân viên";
          return {
            id: sch.id,
            type: "schedule" as EventType,
            date: new Date(sch.workDate),
            time: sch.startTime?.slice(0, 5),
            endTime: sch.endTime?.slice(0, 5),
            title: empName as string,
            subtitle: `${sch.startTime?.slice(0, 5)} - ${sch.endTime?.slice(0, 5)}`,
            status: sch.status,
            color: EVENT_COLORS.schedule.bg,
          };
        });
      } else if (activeTab === "billing") {
        const response = await getInvoiceList({});
        const invoices: Invoice[] = response.data?.data?.content || [];
        newEvents = invoices.map((inv) => ({
          id: inv.id,
          type: "billing" as EventType,
          date: new Date(inv.createdAt || inv.invoiceDate),
          title: `#${inv.invoiceNumber || inv.id.slice(0, 8)}`,
          subtitle: `${(inv.totalAmount || 0).toLocaleString("vi-VN")}đ`,
          status: inv.status,
          color: EVENT_COLORS.billing.bg,
        }));
      } else if (activeTab === "lab") {
        const response = await labResultService.getAll({});
        const results: LabTestResult[] = response.content || [];
        newEvents = results.map((lab) => ({
          id: lab.id,
          type: "lab" as EventType,
          date: new Date(lab.createdAt || lab.performedAt || new Date()),
          title: lab.labTestId ? `Xét nghiệm #${lab.labTestId.slice(0, 8)}` : "Xét nghiệm",
          subtitle: lab.patientId || "",
          status: lab.status,
          color: EVENT_COLORS.lab.bg,
        }));
      }

      setEvents(newEvents);
    } catch (error) {
      console.error("Failed to fetch events:", error);
      toast.error("Không thể tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
  };

  const handleDateClick = (date: Date) => {
    console.log("Date clicked:", date);
  };

  const handleAddClick = (date?: Date) => {
    switch (activeTab) {
      case "appointment":
        router.push(`/admin/appointments`);
        break;
      case "schedule":
        router.push(`/admin/schedules`);
        break;
      case "billing":
        router.push(`/admin/billing`);
        break;
      case "lab":
        router.push(`/admin/lab-results`);
        break;
    }
  };

  const handleViewDetail = () => {
    if (!selectedEvent) return;
    switch (selectedEvent.type) {
      case "appointment":
        router.push(`/admin/appointments/${selectedEvent.id}`);
        break;
      case "schedule":
        router.push(`/admin/schedules`);
        break;
      case "billing":
        router.push(`/admin/billing/${selectedEvent.id}`);
        break;
      case "lab":
        router.push(`/admin/lab-results/${selectedEvent.id}`);
        break;
    }
  };

  const getEventIcon = () => {
    switch (selectedEvent?.type) {
      case "appointment": return Calendar;
      case "schedule": return ClipboardList;
      case "billing": return DollarSign;
      case "lab": return FileText;
      default: return Calendar;
    }
  };

  const getEventLabel = () => {
    switch (activeTab) {
      case "appointment": return "lịch hẹn";
      case "schedule": return "lịch làm việc";
      case "billing": return "hóa đơn";
      case "lab": return "xét nghiệm";
      default: return "";
    }
  };

  const EventIcon = getEventIcon();

  return (
    <div className="p-6">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Lịch tổng hợp</h1>
        <p className="text-gray-500">Quản lý lịch hẹn, hóa đơn và xét nghiệm</p>
      </div>

      {/* Calendar */}
      <CalendarView
        activeTab={activeTab}
        onTabChange={setActiveTab}
        events={events}
        loading={loading}
        onEventClick={handleEventClick}
        onDateClick={handleDateClick}
        onAddClick={handleAddClick}
      />

      {/* Event Detail Modal */}
      <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <EventIcon className="w-5 h-5" />
              Chi tiết {activeTab === "appointment" ? "lịch hẹn" : activeTab === "billing" ? "hóa đơn" : "xét nghiệm"}
            </DialogTitle>
          </DialogHeader>

          {selectedEvent && (
            <div className="space-y-4">
              {/* Title */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {selectedEvent.title}
                </h3>
                {selectedEvent.subtitle && (
                  <p className="text-gray-500">{selectedEvent.subtitle}</p>
                )}
              </div>

              {/* Details */}
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-3 text-gray-600">
                  <Clock className="w-4 h-4" />
                  <span>
                    {selectedEvent.date.toLocaleDateString("vi-VN", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                    {selectedEvent.time && ` lúc ${selectedEvent.time}`}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-gray-500">Trạng thái:</span>
                  <span className={`badge badge-${
                    selectedEvent.status === "COMPLETED" || selectedEvent.status === "PAID" ? "success" :
                    selectedEvent.status === "CANCELLED" ? "danger" :
                    selectedEvent.status === "SCHEDULED" || selectedEvent.status === "PENDING" ? "warning" :
                    "info"
                  }`}>
                    {selectedEvent.status}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={handleViewDetail}
                  className="btn-primary flex-1"
                >
                  Xem chi tiết
                </button>
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="btn-secondary"
                >
                  Đóng
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import {
  addDays,
  endOfMonth,
  endOfWeek,
  format,
  startOfMonth,
  startOfWeek,
  differenceInCalendarDays,
  isToday,
} from "date-fns";
import { CalendarDays, ChevronLeft, ChevronRight, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import ScheduleForm from "./_components/ScheduleForm";
import { ScheduleStatusBadge } from "../_components/schedule-status-badge";
import {
  useDoctorSchedules,
  useCreateSchedule,
  useUpdateSchedule,
  useDeleteSchedule,
  useDepartments,
  useEmployees,
} from "@/hooks/queries/useHr";
import type {
  ScheduleRequest,
  ScheduleStatus,
  EmployeeSchedule,
} from "@/interfaces/hr";
import { cn } from "@/lib/utils";
import { Spinner } from "@/components/ui/spinner";

const shiftPresets = [
  {
    key: "MORNING" as const,
    label: "Morning Shift",
    time: "07:00 - 12:00",
    bg: "bg-amber-50",
  },
  {
    key: "AFTERNOON" as const,
    label: "Afternoon Shift",
    time: "13:00 - 18:00",
    bg: "bg-sky-50",
  },
  {
    key: "EVENING" as const,
    label: "Evening Shift",
    time: "18:00 - 23:00",
    bg: "bg-purple-50",
  },
];

const inferShift = (start: string): "MORNING" | "AFTERNOON" | "EVENING" => {
  const hour = parseInt(start.split(":")[0] || "0", 10);
  if (hour < 12) return "MORNING";
  if (hour < 18) return "AFTERNOON";
  return "EVENING";
};

export default function SchedulesPage() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [activeDept, setActiveDept] = useState<string>("ALL");
  const [activeEmployee, setActiveEmployee] = useState<string>("ALL");
  const [viewMode, setViewMode] = useState<"week" | "month">("week");

  const weekStart = useMemo(
    () => startOfWeek(date || new Date(), { weekStartsOn: 1 }),
    [date]
  );
  const weekEnd = useMemo(
    () => endOfWeek(weekStart, { weekStartsOn: 1 }),
    [weekStart]
  );
  const weekDays = useMemo(
    () => Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i)),
    [weekStart]
  );
  const monthStart = useMemo(() => startOfMonth(date || new Date()), [date]);
  const monthEnd = useMemo(() => endOfMonth(monthStart), [monthStart]);
  const monthDays = useMemo(() => {
    const total = differenceInCalendarDays(monthEnd, monthStart) + 1;
    return Array.from({ length: total }).map((_, i) => addDays(monthStart, i));
  }, [monthEnd, monthStart]);

  // Fetch data from API
  const { data: departmentsData } = useDepartments({ size: 100 });
  const { data: employeesData } = useEmployees({ size: 100 });

  const startDate =
    viewMode === "month"
      ? format(monthStart, "yyyy-MM-dd")
      : format(weekStart, "yyyy-MM-dd");
  const endDate =
    viewMode === "month"
      ? format(monthEnd, "yyyy-MM-dd")
      : format(weekEnd, "yyyy-MM-dd");

  const {
    data: schedulesData,
    isLoading,
    error,
  } = useDoctorSchedules({
    startDate,
    endDate,
    departmentId: activeDept !== "ALL" ? activeDept : undefined,
    doctorId: activeEmployee !== "ALL" ? activeEmployee : undefined,
  });

  const createSchedule = useCreateSchedule();
  const updateSchedule = useUpdateSchedule();
  const deleteSchedule = useDeleteSchedule();

  const schedules = schedulesData?.content ?? [];
  const departments = departmentsData?.content ?? [];
  const employees = employeesData?.content ?? [];

  const filtered = useMemo(() => {
    return schedules.map((item) => ({
      ...item,
      shift: inferShift(item.startTime),
    }));
  }, [schedules]);

  const handleCreate = (data: ScheduleRequest) => {
    createSchedule.mutate(data, {
      onSuccess: () => {
        setIsCreateOpen(false);
      },
      onError: (error) => {
        console.error("Failed to create schedule:", error);
        alert(
          "Failed to create schedule. Employee may already have a schedule for this date."
        );
      },
    });
  };

  const handleDelete = () => {
    if (!deleteId) return;
    deleteSchedule.mutate(deleteId, {
      onSuccess: () => {
        setDeleteId(null);
      },
      onError: (error) => {
        console.error("Failed to delete schedule:", error);
        alert("Failed to delete schedule.");
      },
    });
  };

  const editInitial = useMemo(() => {
    if (!editId) return undefined;
    const item = schedules.find((s) => s.id === editId);
    if (!item) return undefined;
    return {
      employeeId: item.employeeId,
      workDate: item.workDate,
      startTime: item.startTime,
      endTime: item.endTime,
      status: item.status,
      notes: "",
    } as Partial<ScheduleRequest>;
  }, [editId, schedules]);

  const handleUpdate = (data: ScheduleRequest) => {
    if (!editId) return;
    updateSchedule.mutate(
      { id: editId, ...data },
      {
        onSuccess: () => {
          setEditId(null);
        },
        onError: (error) => {
          console.error("Failed to update schedule:", error);
          alert("Failed to update schedule.");
        },
      }
    );
  };

  if (error) {
    return (
      <div className="w-full space-y-6">
        <div className="flex items-center justify-center py-10">
          <p className="text-destructive">
            Error loading schedules. Please try again.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      <Card className="shadow-sm">
        <CardHeader className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <CardTitle className="text-2xl">Work Schedules</CardTitle>
            <p className="text-muted-foreground">
              Manage doctor and staff work schedules.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="rounded-full"
              onClick={() =>
                setDate(
                  addDays(date || new Date(), viewMode === "week" ? -7 : -30)
                )
              }
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="rounded-full"
              onClick={() => setDate(new Date())}
            >
              Today
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="rounded-full"
              onClick={() =>
                setDate(
                  addDays(date || new Date(), viewMode === "week" ? 7 : 30)
                )
              }
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2 rounded-full border px-4 py-2 text-sm text-muted-foreground">
              <CalendarDays className="h-4 w-4" />
              <span>
                {viewMode === "week"
                  ? `${format(weekStart, "MMM dd")} - ${format(
                      weekEnd,
                      "MMM dd, yyyy"
                    )}`
                  : format(monthStart, "MMMM yyyy")}
              </span>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <Button
                variant={viewMode === "week" ? "default" : "outline"}
                onClick={() => setViewMode("week")}
                className="rounded-full"
              >
                Week
              </Button>
              <Button
                variant={viewMode === "month" ? "default" : "outline"}
                onClick={() => setViewMode("month")}
                className="rounded-full"
              >
                Month
              </Button>
              <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogTrigger asChild>
                  <Button className="rounded-lg">
                    <Plus className="mr-2 h-4 w-4" /> Create Schedule
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Create Schedule</DialogTitle>
                  </DialogHeader>
                  <ScheduleForm
                    onSubmit={handleCreate}
                    isLoading={createSchedule.isPending}
                    onCancel={() => setIsCreateOpen(false)}
                    initialData={{
                      workDate: format(date || weekStart, "yyyy-MM-dd"),
                    }}
                  />
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm text-muted-foreground">Filter by:</span>
            <Select value={activeDept} onValueChange={(v) => setActiveDept(v)}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Departments</SelectItem>
                {departments.map((dept) => (
                  <SelectItem key={dept.id} value={dept.id}>
                    {dept.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={activeEmployee}
              onValueChange={(v) => setActiveEmployee(v)}
            >
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Employee" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Employees</SelectItem>
                {employees.map((emp) => (
                  <SelectItem key={emp.id} value={emp.id}>
                    {emp.fullName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-10">
              <Spinner className="text-muted-foreground" />
            </div>
          ) : viewMode === "week" ? (
            <div className="overflow-auto">
              <div className="min-w-[900px] rounded-xl border bg-white shadow-sm">
                <div className="grid grid-cols-[140px_repeat(7,minmax(120px,1fr))] border-b bg-slate-50 text-sm font-medium">
                  <div className="px-4 py-3 text-slate-500">Shift</div>
                  {weekDays.map((day) => (
                    <div
                      key={day.toISOString()}
                      className={cn("px-4 py-3 text-center", {
                        "bg-blue-50 text-blue-700": isToday(day),
                      })}
                    >
                      <div className="font-semibold">{format(day, "eee")}</div>
                      <div className="text-xs text-muted-foreground">
                        {format(day, "dd/MM")}
                      </div>
                    </div>
                  ))}
                </div>

                {shiftPresets.map((shift) => (
                  <div
                    key={shift.key}
                    className="grid grid-cols-[140px_repeat(7,minmax(120px,1fr))] border-b last:border-0"
                  >
                    <div
                      className={`flex flex-col gap-1 border-r px-4 py-4 text-sm ${shift.bg}`}
                    >
                      <span className="font-semibold text-slate-700">
                        {shift.label}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {shift.time}
                      </span>
                    </div>

                    {weekDays.map((day) => {
                      const dateStr = format(day, "yyyy-MM-dd");
                      const dayItems = filtered.filter(
                        (s) => s.workDate === dateStr && s.shift === shift.key
                      );
                      return (
                        <div
                          key={`${shift.key}-${dateStr}`}
                          className="border-r px-2 py-3 hover:bg-slate-50 cursor-pointer"
                          onClick={() => {
                            setDate(day);
                            setIsCreateOpen(true);
                          }}
                        >
                          {dayItems.length === 0 ? (
                            <div className="flex h-16 items-center justify-center text-muted-foreground">
                              +
                            </div>
                          ) : (
                            <div
                              className="flex flex-col gap-2"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {dayItems.map((item) => (
                                <div
                                  key={item.id}
                                  className="rounded-lg border bg-slate-50 px-3 py-2 text-sm shadow-sm"
                                >
                                  <div className="flex items-center justify-between gap-2">
                                    <div>
                                      <div className="font-semibold text-slate-800">
                                        {item.employeeName}
                                      </div>
                                      <div className="text-xs text-muted-foreground">
                                        {item.startTime} - {item.endTime}
                                      </div>
                                    </div>
                                    <ScheduleStatusBadge
                                      status={item.status}
                                      size="sm"
                                    />
                                  </div>
                                  <div className="mt-1 flex gap-2 text-xs text-primary">
                                    <button onClick={() => setEditId(item.id)}>
                                      Edit
                                    </button>
                                    <button
                                      className="text-destructive"
                                      onClick={() => setDeleteId(item.id)}
                                    >
                                      Delete
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {monthDays.map((day) => {
                const dateStr = format(day, "yyyy-MM-dd");
                const dayItems = filtered.filter((s) => s.workDate === dateStr);
                return (
                  <div
                    key={dateStr}
                    className="rounded-lg border bg-white p-4 shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-semibold text-slate-800">
                        {format(day, "dd-MM-yyyy")}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setDate(day);
                          setIsCreateOpen(true);
                        }}
                      >
                        Add Schedule
                      </Button>
                    </div>
                    {dayItems.length ? (
                      <div className="mt-2 grid gap-2 md:grid-cols-2">
                        {dayItems.map((item) => (
                          <div
                            key={item.id}
                            className="rounded-md border bg-slate-50 px-3 py-2 text-sm"
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-semibold">
                                  {item.employeeName}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {item.startTime} - {item.endTime}
                                </div>
                              </div>
                              <ScheduleStatusBadge
                                status={item.status}
                                size="sm"
                              />
                            </div>
                            <div className="mt-1 flex gap-2 text-xs text-primary">
                              <button onClick={() => setEditId(item.id)}>
                                Edit
                              </button>
                              <button
                                className="text-destructive"
                                onClick={() => setDeleteId(item.id)}
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-2 text-sm text-muted-foreground">
                        No schedules for this day.
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Drawer open={!!editId} onOpenChange={(open) => !open && setEditId(null)}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Edit Schedule</DrawerTitle>
            <DrawerDescription>Update slot details.</DrawerDescription>
          </DrawerHeader>
          <div className="px-4 pb-6">
            <ScheduleForm
              onSubmit={handleUpdate}
              isLoading={updateSchedule.isPending}
              onCancel={() => setEditId(null)}
              initialData={editInitial}
            />
          </div>
        </DrawerContent>
      </Drawer>

      <AlertDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Schedule</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this schedule? This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteSchedule.isPending}
            >
              {deleteSchedule.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

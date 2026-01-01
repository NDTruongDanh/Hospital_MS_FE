"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { CalendarClock, FileText, Stethoscope, Wallet } from "lucide-react";
import appointmentService from "@/services/appointment.service";
import { getMedicalExams } from "@/services/medical-exam.service";
import { getPatientInvoices } from "@/services/billing.service";

type TimelineEvent = {
  id: string;
  type: "APPOINTMENT" | "EXAM" | "INVOICE";
  date: string;
  title: string;
  summary: string;
  status?: string;
  url: string;
};

export default function PatientHistoryPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const patientId = params.id;

  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<"ALL" | TimelineEvent["type"]>(
    "ALL",
  );
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    let mounted = true;
    const fetchData = async () => {
      setLoading(true);
      try {
        const [apptRes, examRes, invoiceRes] = await Promise.all([
          appointmentService.list({
            patientId,
            page: 0,
            size: 50,
            sort: "appointmentTime,desc",
          }),
          getMedicalExams({
            patientId,
            page: 0,
            size: 50,
            sort: "examDate,desc",
          }),
          getPatientInvoices(patientId),
        ]);

        const apptContent = apptRes?.content || [];
        const examContent = examRes?.data?.content || [];
        const invoiceContent = (invoiceRes?.data?.data as any[]) || [];

        const mapped: TimelineEvent[] = [
          ...apptContent.map((a: any) => ({
            id: a.id,
            type: "APPOINTMENT" as const,
            date: a.appointmentTime || a.date,
            title: `Cuộc hẹn với ${a.doctor?.fullName || "bác sĩ"}`,
            summary: a.reason || a.type || "Lịch khám",
            status: a.status,
            url: `/admin/appointments/${a.id}`,
          })),
          ...examContent.map((e: any) => ({
            id: e.id,
            type: "EXAM" as const,
            date: e.examDate,
            title: `Khám bệnh #${e.id}`,
            summary: e.diagnosis || "Khám lâm sàng",
            status: e.status,
            url: `/admin/exams/${e.id}`,
          })),
          ...invoiceContent.map((inv: any) => ({
            id: inv.id,
            type: "INVOICE" as const,
            date: inv.issuedAt || inv.createdAt,
            title: `Hóa đơn #${inv.invoiceNumber || inv.id}`,
            summary: inv.status,
            status: inv.status,
            url: `/admin/billing/${inv.id}`,
          })),
        ].filter((e) => e.date);

        if (mounted) setEvents(mapped);
      } catch (err) {
        console.error(err);
        if (mounted) setEvents([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchData();
    return () => {
      mounted = false;
    };
  }, [patientId]);

  const filtered = useMemo(() => {
    return events
      .filter((e) => (typeFilter === "ALL" ? true : e.type === typeFilter))
      .filter((e) => {
        if (startDate && new Date(e.date) < new Date(startDate)) return false;
        if (endDate && new Date(e.date) > new Date(endDate)) return false;
        return true;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [events, typeFilter, startDate, endDate]);

  const iconFor = (type: TimelineEvent["type"]) => {
    switch (type) {
      case "APPOINTMENT":
        return <CalendarClock className="h-4 w-4 text-blue-600" />;
      case "EXAM":
        return <Stethoscope className="h-4 w-4 text-emerald-600" />;
      case "INVOICE":
        return <Wallet className="h-4 w-4 text-amber-600" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <div className="page-shell space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Lịch sử bệnh nhân</h1>
          <p className="text-muted-foreground">
            Dòng thời gian cuộc hẹn, khám và hóa đơn.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => router.push(`/admin/patients/${patientId}`)}
        >
          Quay lại hồ sơ
        </Button>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Bộ lọc</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Select
            value={typeFilter}
            onValueChange={(v) => setTypeFilter(v as any)}
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Loại sự kiện" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tất cả</SelectItem>
              <SelectItem value="APPOINTMENT">Cuộc hẹn</SelectItem>
              <SelectItem value="EXAM">Khám bệnh</SelectItem>
              <SelectItem value="INVOICE">Hóa đơn</SelectItem>
            </SelectContent>
          </Select>
          <InputDate
            label="Từ ngày"
            value={startDate}
            onChange={setStartDate}
          />
          <InputDate label="Đến ngày" value={endDate} onChange={setEndDate} />
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Dòng thời gian</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <p className="text-muted-foreground text-sm">Đang tải...</p>
          ) : filtered.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              Không có sự kiện trong khoảng thời gian này.
            </div>
          ) : (
            <div className="space-y-4">
              {filtered.map((e) => (
                <div
                  key={`${e.type}-${e.id}`}
                  className="border rounded-lg p-4 flex flex-col gap-2 hover:bg-muted/40 transition"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      {iconFor(e.type)}
                      <p className="text-sm font-medium">{e.title}</p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {new Date(e.date).toLocaleString("vi-VN")}
                    </p>
                  </div>
                  <p className="text-sm text-muted-foreground">{e.summary}</p>
                  {e.status && (
                    <p className="text-xs text-muted-foreground">
                      Trạng thái:{" "}
                      <span className="font-medium text-foreground">
                        {e.status}
                      </span>
                    </p>
                  )}
                  <Separator />
                  <div className="flex justify-end">
                    <Button variant="outline" size="sm" asChild>
                      <a href={e.url}>Xem chi tiết</a>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function InputDate({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <input
        type="date"
        className="h-10 rounded-md border px-3 text-sm"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

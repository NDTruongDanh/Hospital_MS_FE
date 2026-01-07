"use client";

import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  UserCheck,
  Construction,
  Clock,
  Sparkles,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function DoctorPerformancePage() {
  const router = useRouter();
  const { user } = useAuth();
  const role = user?.role || "ADMIN";

  useEffect(() => {
    if (role && role !== "ADMIN") {
      router.replace("/doctor/reports/appointments");
    }
  }, [role, router]);

  return (
    <div className="space-y-6">
      {/* Gradient Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-violet-600 via-purple-500 to-fuchsia-500 p-6 text-white shadow-xl">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
        <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-white/5" />
        <div className="absolute right-20 top-10 h-20 w-20 rounded-full bg-white/5" />

        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              onClick={() => router.back()}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="rounded-xl bg-white/20 p-3 backdrop-blur-sm">
              <UserCheck className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                Hiệu suất bác sĩ
                <Badge className="bg-amber-400 text-amber-900 border-0 text-xs">
                  <Clock className="h-3 w-3 mr-1" />
                  Đang phát triển
                </Badge>
              </h1>
              <p className="mt-1 text-violet-100">
                Phân tích hiệu suất làm việc của bác sĩ
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Coming Soon Card */}
      <Card className="border-2 border-dashed border-violet-200 bg-gradient-to-br from-violet-50 to-white">
        <CardContent className="py-16">
          <div className="flex flex-col items-center justify-center text-center space-y-6">
            <div className="relative">
              <div className="p-6 rounded-full bg-violet-100">
                <Construction className="h-16 w-16 text-violet-600" />
              </div>
              <div className="absolute -top-2 -right-2 p-2 rounded-full bg-amber-100">
                <Sparkles className="h-5 w-5 text-amber-600" />
              </div>
            </div>

            <div className="space-y-2 max-w-md">
              <h2 className="text-2xl font-bold text-slate-800">
                Tính năng đang được phát triển
              </h2>
              <p className="text-muted-foreground">
                Báo cáo hiệu suất bác sĩ hiện chưa được hỗ trợ bởi backend. 
                Chúng tôi đang làm việc để hoàn thiện tính năng này.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 pt-4">
              <Button 
                variant="outline"
                onClick={() => router.push("/admin/reports")}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Quay lại Dashboard
              </Button>
              <Button 
                className="bg-gradient-to-r from-violet-600 to-purple-600 text-white"
                onClick={() => router.push("/admin/reports/appointments")}
              >
                Xem báo cáo lịch hẹn
              </Button>
            </div>

            <p className="text-xs text-muted-foreground pt-4">
              💡 Khi backend hỗ trợ, trang này sẽ hiển thị:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-xl w-full">
              <div className="p-3 rounded-lg bg-white border shadow-sm">
                <p className="font-medium text-sm text-slate-700">Tỷ lệ hoàn thành</p>
                <p className="text-xs text-muted-foreground">Completion rate của bác sĩ</p>
              </div>
              <div className="p-3 rounded-lg bg-white border shadow-sm">
                <p className="font-medium text-sm text-slate-700">Số bệnh nhân</p>
                <p className="text-xs text-muted-foreground">Đã khám trong kỳ</p>
              </div>
              <div className="p-3 rounded-lg bg-white border shadow-sm">
                <p className="font-medium text-sm text-slate-700">Doanh thu</p>
                <p className="text-xs text-muted-foreground">Theo từng bác sĩ</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

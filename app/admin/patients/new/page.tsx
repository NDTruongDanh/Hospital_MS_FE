"use client";

import { useRouter } from "next/navigation";
import { useCreatePatient } from "@/hooks/queries/usePatient";
import { PatientForm, PatientFormValues } from "../_components";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  UserPlus, 
  Sparkles, 
  CheckCircle, 
  Info,
  Heart,
  Phone,
  Shield,
  Clock,
} from "lucide-react";
import Link from "next/link";

export default function NewPatientPage() {
  const router = useRouter();
  const { mutate: createPatient, isPending } = useCreatePatient();

  const handleSubmit = (data: PatientFormValues) => {
    createPatient(
      {
        fullName: data.fullName,
        email: data.email || undefined,
        phoneNumber: data.phoneNumber,
        dateOfBirth: data.dateOfBirth || undefined,
        gender: data.gender,
        address: data.address || undefined,
        identificationNumber: data.identificationNumber || undefined,
        healthInsuranceNumber: data.healthInsuranceNumber || undefined,
        bloodType: data.bloodType,
        allergies:
          data.allergies && data.allergies.length
            ? data.allergies.join(", ")
            : undefined,
        relativeFullName: data.relativeFullName || undefined,
        relativePhoneNumber: data.relativePhoneNumber || undefined,
        relativeRelationship: data.relativeRelationship,
        accountId: data.accountId || undefined,
      },
      {
        onSuccess: (created) => {
          const id = (created as any)?.id;
          router.push(id ? `/admin/patients/${id}` : "/admin/patients");
        },
      },
    );
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <div className="space-y-6">
      {/* Enhanced Gradient Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-sky-600 via-cyan-500 to-teal-500 p-6 text-white shadow-xl">
        {/* Background decorations */}
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
        <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-white/5" />
        <div className="absolute top-1/2 right-1/4 h-20 w-20 rounded-full bg-white/5" />

        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              asChild
              className="text-white hover:bg-white/10 rounded-xl"
            >
              <Link href="/admin/patients">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div className="rounded-xl bg-white/20 p-3 backdrop-blur-sm">
              <UserPlus className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                Đăng ký Bệnh nhân mới
                <Badge className="bg-white/20 text-white border-0 animate-pulse">
                  <Sparkles className="h-3 w-3 mr-1" />
                  Mới
                </Badge>
              </h1>
              <p className="mt-1 text-cyan-100">
                Tạo hồ sơ bệnh nhân mới trong hệ thống quản lý
              </p>
            </div>
          </div>

          <div className="hidden lg:flex items-center gap-6 text-cyan-100">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span className="text-sm">~3 phút</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form - Main content */}
        <div className="lg:col-span-2">
          <PatientForm
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isLoading={isPending}
          />
        </div>

        {/* Sidebar - Tips and Info */}
        <div className="space-y-4">
          {/* Required Fields Card */}
          <Card className="border-2 border-sky-200 bg-gradient-to-br from-sky-50 to-white shadow-sm">
            <CardContent className="pt-5">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-sky-100">
                  <Info className="h-4 w-4 text-sky-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800 mb-2">Thông tin bắt buộc</h3>
                  <ul className="space-y-2 text-sm text-slate-600">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-emerald-500" />
                      Họ và tên
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-emerald-500" />
                      Ngày sinh
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-emerald-500" />
                      Giới tính
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-emerald-500" />
                      Số điện thoại
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Health Info Card */}
          <Card className="border-2 border-rose-200 bg-gradient-to-br from-rose-50 to-white shadow-sm">
            <CardContent className="pt-5">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-rose-100">
                  <Heart className="h-4 w-4 text-rose-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800 mb-2">Thông tin sức khỏe</h3>
                  <p className="text-sm text-slate-600">
                    Nhóm máu và thông tin dị ứng giúp đảm bảo an toàn khi điều trị.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Emergency Contact Card */}
          <Card className="border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-white shadow-sm">
            <CardContent className="pt-5">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-emerald-100">
                  <Phone className="h-4 w-4 text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800 mb-2">Người liên hệ</h3>
                  <p className="text-sm text-slate-600">
                    Thêm người thân để liên hệ trong trường hợp khẩn cấp.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Insurance Card */}
          <Card className="border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-white shadow-sm">
            <CardContent className="pt-5">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-amber-100">
                  <Shield className="h-4 w-4 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800 mb-2">Bảo hiểm y tế</h3>
                  <p className="text-sm text-slate-600">
                    Số BHYT giúp xử lý thanh toán nhanh hơn và được hưởng quyền lợi bảo hiểm.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

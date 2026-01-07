"use client";

import { useParams, useRouter } from "next/navigation";
import { useMedicine, useUpdateMedicine } from "@/hooks/queries/useMedicine";
import { MedicineForm, MedicineFormValues } from "../../_components";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Pill, ArrowLeft, Edit, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export default function EditMedicinePage() {
  const params = useParams();
  const router = useRouter();
  const medicineId = params.id as string;

  const { data: medicine, isLoading, error } = useMedicine(medicineId);
  const { mutate: updateMedicine, isPending } = useUpdateMedicine(medicineId);

  const handleSubmit = (data: MedicineFormValues) => {
    updateMedicine(
      {
        name: data.name,
        activeIngredient: data.activeIngredient || null,
        unit: data.unit,
        description: data.description || null,
        quantity: data.quantity,
        packaging: data.packaging || null,
        purchasePrice: data.purchasePrice,
        sellingPrice: data.sellingPrice,
        expiresAt: data.expiresAt,
        categoryId: data.categoryId || null,
      },
      {
        onSuccess: () => {
          toast.success("Đã cập nhật thuốc thành công!");
          router.push(`/admin/medicines/${medicineId}`);
        },
        onError: () => {
          toast.error("Không thể cập nhật. Vui lòng thử lại.");
        },
      },
    );
  };

  const handleCancel = () => {
    router.back();
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-40 w-full rounded-2xl" />
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  if (error || !medicine) {
    return (
      <div className="space-y-6">
        <Card className="border-2 border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 mx-auto mb-3 text-red-400" />
              <h2 className="text-xl font-semibold text-red-800">Không tìm thấy thuốc</h2>
              <p className="text-red-600 mt-1">Thuốc bạn đang tìm không tồn tại hoặc đã bị xóa.</p>
              <Button
                className="mt-4"
                onClick={() => router.push("/admin/medicines")}
              >
                Quay lại danh sách
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Gradient Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-cyan-600 via-teal-500 to-emerald-500 p-6 text-white shadow-xl">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
        <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-white/5" />

        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="rounded-xl bg-white/20 p-3 backdrop-blur-sm">
              <Pill className="h-7 w-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight">{medicine.name}</h1>
                <Badge className="bg-white/20 text-white border-0 text-xs">
                  <Edit className="h-3 w-3 mr-1" />
                  Chỉnh sửa
                </Badge>
              </div>
              <p className="mt-1 text-teal-100">
                {medicine.categoryName || "Chưa phân loại"} • {medicine.unit}
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Quay lại
          </Button>
        </div>
      </div>

      {/* Form Card */}
      <Card className="border-2 border-slate-200 shadow-sm overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-cyan-500 to-emerald-500" />
        <CardContent className="pt-6">
          <MedicineForm
            initialData={medicine}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isLoading={isPending}
          />
        </CardContent>
      </Card>
    </div>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useCreateMedicine } from "@/hooks/queries/useMedicine";
import { MedicineForm, MedicineFormValues } from "../_components";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pill, ArrowLeft, Sparkles } from "lucide-react";
import { toast } from "sonner";

export default function NewMedicinePage() {
  const router = useRouter();
  const { mutate: createMedicine, isPending } = useCreateMedicine();

  const handleSubmit = (data: MedicineFormValues) => {
    createMedicine(
      {
        name: data.name,
        activeIngredient: data.activeIngredient || undefined,
        unit: data.unit,
        description: data.description || undefined,
        quantity: data.quantity,
        packaging: data.packaging || undefined,
        purchasePrice: data.purchasePrice,
        sellingPrice: data.sellingPrice,
        expiresAt: data.expiresAt,
        categoryId: data.categoryId || undefined,
      },
      {
        onSuccess: () => {
          toast.success("Đã thêm thuốc mới thành công!");
          router.push("/admin/medicines");
        },
        onError: () => {
          toast.error("Không thể thêm thuốc. Vui lòng thử lại.");
        },
      },
    );
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <div className="space-y-6">
      {/* Gradient Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-teal-600 via-cyan-500 to-emerald-500 p-6 text-white shadow-xl">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
        <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-white/5" />

        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="rounded-xl bg-white/20 p-3 backdrop-blur-sm">
              <Pill className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                Thêm thuốc mới
                <Badge className="bg-white/20 text-white border-0 text-xs">
                  <Sparkles className="h-3 w-3 mr-1" />
                  New
                </Badge>
              </h1>
              <p className="mt-1 text-teal-100">
                Thêm thuốc mới vào kho dược phẩm
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
        <div className="h-1 bg-gradient-to-r from-teal-500 to-emerald-500" />
        <CardContent className="pt-6">
          <MedicineForm
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isLoading={isPending}
          />
        </CardContent>
      </Card>
    </div>
  );
}

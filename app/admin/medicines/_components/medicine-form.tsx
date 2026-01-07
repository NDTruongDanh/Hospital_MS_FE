"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import MyDatePicker from "@/app/admin/_components/MyDatePicker";
import { Medicine } from "@/interfaces/medicine";
import { Category } from "@/interfaces/category";
import { medicineFormSchema, MedicineFormValues } from "@/lib/schemas/medicine";
import { useCategories } from "@/hooks/queries/useCategory";
import {
  Package2,
  DollarSign,
  Pill,
  Beaker,
  Box,
  Tag,
  Calendar,
  Loader2,
} from "lucide-react";

export { medicineFormSchema, type MedicineFormValues };

interface MedicineFormProps {
  initialData?: Medicine | null;
  onSubmit: (data: MedicineFormValues) => void;
  onCancel: () => void;
  isLoading?: boolean;
  isSubmitting?: boolean;
}

const unitOptions = [
  { value: "tablet", label: "Viên nén" },
  { value: "capsule", label: "Viên nang" },
  { value: "bottle", label: "Chai" },
  { value: "tube", label: "Tuýp" },
  { value: "box", label: "Hộp" },
  { value: "pack", label: "Gói" },
  { value: "vial", label: "Lọ tiêm" },
  { value: "ampule", label: "Ống tiêm" },
];

export function MedicineForm({
  initialData,
  onSubmit,
  isSubmitting,
  onCancel,
  isLoading,
}: MedicineFormProps) {
  const { data: categoriesData } = useCategories();
  const categories = categoriesData?.content || [];
  const form = useForm<MedicineFormValues>({
    resolver: zodResolver(medicineFormSchema),
    defaultValues: {
      name: initialData?.name ?? "",
      activeIngredient: initialData?.activeIngredient ?? "",
      unit: initialData?.unit ?? "",
      description: initialData?.description ?? "",
      quantity: String(initialData?.quantity ?? 0),
      packaging: initialData?.packaging ?? "",
      purchasePrice: String(initialData?.purchasePrice ?? 0),
      sellingPrice: String(initialData?.sellingPrice ?? 0),
      expiresAt: initialData?.expiresAt ?? "",
      categoryId: initialData?.categoryId ?? "",
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Information */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
            <Pill className="h-5 w-5 text-teal-600" />
            <h3 className="font-semibold text-slate-800">Thông tin cơ bản</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1">
                    <Pill className="h-4 w-4 text-teal-500" />
                    Tên thuốc <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ví dụ: Paracetamol 500mg"
                      className="h-11 border-2"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="activeIngredient"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1">
                    <Beaker className="h-4 w-4 text-sky-500" />
                    Hoạt chất
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ví dụ: Paracetamol"
                      className="h-11 border-2"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Mô tả</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Mô tả công dụng, chỉ định, chống chỉ định..."
                    className="min-h-[80px] border-2"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="unit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1">
                    <Box className="h-4 w-4 text-violet-500" />
                    Đơn vị <span className="text-red-500">*</span>
                  </FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-11 border-2">
                        <SelectValue placeholder="Chọn đơn vị" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {unitOptions.map((u) => (
                        <SelectItem key={u.value} value={u.value}>
                          {u.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1">
                    <Package2 className="h-4 w-4 text-emerald-500" />
                    Số lượng <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      className="h-11 border-2"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="packaging"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quy cách đóng gói</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ví dụ: Hộp 10 vỉ x 10 viên"
                      className="h-11 border-2"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="categoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1">
                    <Tag className="h-4 w-4 text-amber-500" />
                    Danh mục
                  </FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-11 border-2">
                        <SelectValue placeholder="Chọn danh mục" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories?.map((cat: Category) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="expiresAt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1">
                    <Calendar className="h-4 w-4 text-rose-500" />
                    Hạn sử dụng <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <MyDatePicker
                      value={field.value ? new Date(field.value) : undefined}
                      onChange={(date) =>
                        field.onChange(date?.toISOString())
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Pricing */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
            <DollarSign className="h-5 w-5 text-emerald-600" />
            <h3 className="font-semibold text-slate-800">Thông tin giá</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="purchasePrice"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1">
                    <DollarSign className="h-4 w-4 text-blue-500" />
                    Giá nhập <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      className="h-11 border-2"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription className="text-xs">
                    Đơn vị: VND
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="sellingPrice"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1">
                    <DollarSign className="h-4 w-4 text-emerald-500" />
                    Giá bán <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      className="h-11 border-2"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription className="text-xs">
                    Đơn vị: VND
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
          <Button type="button" variant="outline" onClick={onCancel} className="px-6">
            Hủy
          </Button>
          <Button
            type="submit"
            disabled={isLoading}
            className="px-6 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {initialData ? "Cập nhật" : "Tạo mới"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

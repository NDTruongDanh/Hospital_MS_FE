"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
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
import { Textarea } from "@/components/ui/textarea";
import { Category, CategoryRequest } from "@/interfaces/category";
import { Tag, FileText, Loader2 } from "lucide-react";

const formSchema = z.object({
  name: z.string().trim().min(1, "Tên danh mục là bắt buộc"),
  description: z.string().optional(),
});

type CategoryFormValues = z.infer<typeof formSchema>;

interface CategoryFormProps {
  initialData?: Category;
  onSubmit: (data: CategoryRequest) => void;
  onCancel: () => void;
  isLoading: boolean;
}

export function CategoryForm({
  initialData,
  onSubmit,
  onCancel,
  isLoading,
}: CategoryFormProps) {
  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialData?.name || "",
      description: initialData?.description || "",
    },
  });

  const handleSubmit = (values: CategoryFormValues) => {
    onSubmit(values);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-1">
                <Tag className="h-4 w-4 text-amber-500" />
                Tên danh mục <span className="text-red-500">*</span>
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="Ví dụ: Kháng sinh, Giảm đau..."
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
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-1">
                <FileText className="h-4 w-4 text-slate-500" />
                Mô tả
              </FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Mô tả ngắn gọn về danh mục..."
                  className="resize-none border-2"
                  rows={3}
                  {...field}
                />
              </FormControl>
              <FormDescription className="text-xs">
                Tùy chọn - Mô tả giúp phân loại thuốc dễ dàng hơn
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
          <Button type="button" variant="outline" onClick={onCancel} className="px-6">
            Hủy
          </Button>
          <Button
            type="submit"
            disabled={isLoading}
            className="px-6 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {initialData ? "Cập nhật" : "Tạo mới"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

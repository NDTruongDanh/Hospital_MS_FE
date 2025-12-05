"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TagInput } from "@/components/ui/tag-input";
import { Separator } from "@/components/ui/separator";
import { useMyProfile, useUpdateMyProfile } from "@/hooks/queries/usePatient";
import { RelationshipType } from "@/interfaces/patient";

const editSchema = z.object({
  phoneNumber: z
    .string()
    .regex(/^0[0-9]{9}$/, "Số điện thoại phải có 10 chữ số và bắt đầu bằng 0"),
  address: z.string().max(255, "Tối đa 255 ký tự").optional().or(z.literal("")),
  allergies: z.array(z.string()).optional(),
  relativeFullName: z.string().max(100, "Tối đa 100 ký tự").optional().or(z.literal("")),
  relativePhoneNumber: z
    .string()
    .regex(/^0[0-9]{9}$/, "Số điện thoại phải có 10 chữ số và bắt đầu bằng 0")
    .optional()
    .or(z.literal("")),
  relativeRelationship: z
    .enum(["SPOUSE", "PARENT", "CHILD", "SIBLING", "FRIEND", "OTHER"] as const)
    .optional()
    .or(z.literal("")),
});

type EditFormValues = z.infer<typeof editSchema>;

export default function EditProfilePage() {
  const { data: profile, isLoading, error } = useMyProfile();
  const updateProfile = useUpdateMyProfile();

  const form = useForm<EditFormValues>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      phoneNumber: "",
      address: "",
      allergies: [],
      relativeFullName: "",
      relativePhoneNumber: "",
      relativeRelationship: "" as RelationshipType | "",
    },
  });

  useEffect(() => {
    if (!profile) return;
    form.reset({
      phoneNumber: profile.phoneNumber || "",
      address: profile.address || "",
      allergies: profile.allergies
        ? profile.allergies.split(",").map((s) => s.trim()).filter(Boolean)
        : [],
      relativeFullName: profile.relativeFullName || "",
      relativePhoneNumber: profile.relativePhoneNumber || "",
      relativeRelationship: (profile.relativeRelationship as RelationshipType | "") || "",
    });
  }, [profile, form]);

  const onSubmit = async (values: EditFormValues) => {
    const allergiesString =
      values.allergies && values.allergies.length > 0 ? values.allergies.join(", ") : undefined;
    await updateProfile.mutateAsync({
      phoneNumber: values.phoneNumber,
      address: values.address || undefined,
      allergies: allergiesString,
      relativeFullName: values.relativeFullName || undefined,
      relativePhoneNumber: values.relativePhoneNumber || undefined,
      relativeRelationship: values.relativeRelationship || undefined,
    });
  };

  const readonlyBlock = useMemo(
    () => [
      { label: "Họ tên", value: profile?.fullName || "—" },
      { label: "Email", value: profile?.email || "—" },
      {
        label: "Ngày sinh",
        value: profile?.dateOfBirth
          ? new Date(profile.dateOfBirth).toLocaleDateString("vi-VN")
          : "—",
      },
      { label: "Giới tính", value: profile?.gender || "—" },
      { label: "Nhóm máu", value: profile?.bloodType || "—" },
    ],
    [profile],
  );

  if (isLoading) {
    return <p className="p-6 text-muted-foreground">Đang tải hồ sơ...</p>;
  }

  if (error || !profile) {
    return (
      <div className="page-shell py-10 space-y-3 text-center">
        <p className="text-lg font-semibold text-destructive">Không tải được hồ sơ</p>
        <Button variant="outline" asChild>
          <Link href="/profile">Quay lại</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="page-shell space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Chỉnh sửa hồ sơ</h1>
          <p className="text-muted-foreground">Một số trường chỉ có thể được cập nhật bởi nhân viên.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/profile">Hủy</Link>
          </Button>
          <Button onClick={form.handleSubmit(onSubmit)} disabled={updateProfile.isPending}>
            {updateProfile.isPending ? "Đang lưu..." : "Lưu thay đổi"}
          </Button>
        </div>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Thông tin không chỉnh sửa</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          {readonlyBlock.map((item) => (
            <div key={item.label} className="space-y-1">
              <p className="text-sm text-muted-foreground">{item.label}</p>
              <p className="font-medium">{item.value}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Thông tin liên hệ</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">Số điện thoại</label>
            <Input {...form.register("phoneNumber")} />
            {form.formState.errors.phoneNumber && (
              <p className="text-sm text-destructive">{form.formState.errors.phoneNumber.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Địa chỉ</label>
            <Textarea rows={3} {...form.register("address")} />
            {form.formState.errors.address && (
              <p className="text-sm text-destructive">{form.formState.errors.address.message}</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Thông tin sức khỏe</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <label className="text-sm font-medium">Dị ứng</label>
          <TagInput
            value={form.watch("allergies") || []}
            onChange={(tags) => form.setValue("allergies", tags, { shouldValidate: true })}
            placeholder="Thêm dị ứng và nhấn Enter"
            suggestions={["Penicillin", "Peanut", "Seafood", "Dust", "NSAIDs"]}
          />
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Liên hệ khẩn cấp</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">Tên</label>
            <Input {...form.register("relativeFullName")} />
            {form.formState.errors.relativeFullName && (
              <p className="text-sm text-destructive">{form.formState.errors.relativeFullName.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Số điện thoại</label>
            <Input {...form.register("relativePhoneNumber")} />
            {form.formState.errors.relativePhoneNumber && (
              <p className="text-sm text-destructive">{form.formState.errors.relativePhoneNumber.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Quan hệ</label>
            <Select
              value={form.watch("relativeRelationship") || ""}
              onValueChange={(v) => form.setValue("relativeRelationship", v as RelationshipType)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Chọn quan hệ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Chưa chọn</SelectItem>
                <SelectItem value="SPOUSE">Vợ/Chồng</SelectItem>
                <SelectItem value="PARENT">Cha/Mẹ</SelectItem>
                <SelectItem value="CHILD">Con</SelectItem>
                <SelectItem value="SIBLING">Anh/Chị/Em</SelectItem>
                <SelectItem value="FRIEND">Bạn bè</SelectItem>
                <SelectItem value="OTHER">Khác</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Separator />
      <div className="flex gap-2 justify-end">
        <Button variant="outline" asChild>
          <Link href="/profile">Hủy</Link>
        </Button>
        <Button onClick={form.handleSubmit(onSubmit)} disabled={updateProfile.isPending}>
          {updateProfile.isPending ? "Đang lưu..." : "Lưu thay đổi"}
        </Button>
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useMyProfile } from "@/hooks/queries/usePatient";

const formatDate = (value?: string | null) =>
  value ? new Date(value).toLocaleDateString("vi-VN") : "Không có";

const calcAge = (dob?: string | null) => {
  if (!dob) return null;
  const d = new Date(dob);
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
  return age;
};

export default function MyProfilePage() {
  const { data: profile, isLoading, error } = useMyProfile();

  const age = useMemo(() => calcAge(profile?.dateOfBirth), [profile?.dateOfBirth]);

  if (isLoading) {
    return <p className="p-6 text-muted-foreground">Đang tải hồ sơ...</p>;
  }

  if (error || !profile) {
    return (
      <div className="page-shell py-10 space-y-3 text-center">
        <p className="text-lg font-semibold text-destructive">Không tải được hồ sơ</p>
        <p className="text-sm text-muted-foreground">Vui lòng thử lại sau.</p>
      </div>
    );
  }

  const allergies = profile.allergies ? profile.allergies.split(",").map((s) => s.trim()).filter(Boolean) : [];

  return (
    <div className="page-shell space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Hồ sơ của tôi</h1>
          <p className="text-muted-foreground">Thông tin cá nhân và liên hệ khẩn cấp.</p>
        </div>
        <Button asChild>
          <Link href="/profile/edit">Chỉnh sửa</Link>
        </Button>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Thông tin cá nhân</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <InfoRow label="Họ tên" value={profile.fullName} />
          <InfoRow label="Email" value={profile.email || "Không có"} />
          <InfoRow label="Số điện thoại" value={profile.phoneNumber} />
          <InfoRow label="Ngày sinh" value={`${formatDate(profile.dateOfBirth)}${age ? ` (${age} tuổi)` : ""}`} />
          <InfoRow label="Giới tính" value={profile.gender || "Không có"} />
          <InfoRow label="Địa chỉ" value={profile.address || "Không có"} />
          <InfoRow label="Số BHYT" value={profile.healthInsuranceNumber || "Không có"} />
          <InfoRow label="CMND/CCCD" value={profile.identificationNumber || "Không có"} />
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Thông tin sức khỏe</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Nhóm máu:</span>
            <Badge variant="secondary">{profile.bloodType || "Không có"}</Badge>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Dị ứng</p>
            {allergies.length ? (
              <div className="flex flex-wrap gap-2">
                {allergies.map((a) => (
                  <Badge key={a} variant="outline" className="rounded-full">
                    {a}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Chưa ghi nhận</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Liên hệ khẩn cấp</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <InfoRow label="Tên" value={profile.relativeFullName || "Không có"} />
          <InfoRow label="Số điện thoại" value={profile.relativePhoneNumber || "Không có"} />
          <InfoRow label="Quan hệ" value={profile.relativeRelationship || "Không có"} />
        </CardContent>
      </Card>

      <Separator />
      <div className="flex justify-end">
        <Button asChild variant="outline">
          <Link href="/profile/edit">Chỉnh sửa hồ sơ</Link>
        </Button>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}

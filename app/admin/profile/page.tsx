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

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}

export default function AdminProfilePage() {
  const { data: profile, isLoading, error } = useMyProfile();

  const age = useMemo(
    () => calcAge(profile?.dateOfBirth),
    [profile?.dateOfBirth]
  );

  if (isLoading) {
    return <p className="p-6 text-muted-foreground">Đang tải hồ sơ...</p>;
  }

  if (error || !profile) {
    return (
      <div className="page-shell py-10 space-y-3 text-center">
        <p className="text-lg font-semibold text-destructive">
          Không tải được hồ sơ
        </p>
        <p className="text-sm text-muted-foreground">Vui lòng thử lại sau.</p>
      </div>
    );
  }

  const allergies = profile.allergies
    ? profile.allergies
        .split(",")
        .map((s: string) => s.trim())
        .filter(Boolean)
    : [];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Hồ sơ của tôi</h1>
          <p className="text-muted-foreground">
            Thông tin cá nhân và liên hệ khẩn cấp.
          </p>
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
          <InfoRow
            label="Ngày sinh"
            value={`${formatDate(profile.dateOfBirth)}${age ? ` (${age} tuổi)` : ""}`}
          />
          <InfoRow label="Giới tính" value={profile.gender || "Không có"} />
          <InfoRow label="Địa chỉ" value={profile.address || "Không có"} />
          <InfoRow
            label="Căn cước công dân"
            value={profile.identificationNumber || "Không có"}
          />
          <InfoRow
            label="Bảo hiểm y tế"
            value={profile.healthInsuranceNumber || "Không có"}
          />
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Thông tin y tế</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <InfoRow label="Nhóm máu" value={profile.bloodType || "Không có"} />
          <Separator />
          <div>
            <p className="text-sm text-muted-foreground mb-2">Dị ứng</p>
            {allergies.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {allergies.map((allergen: string, idx: number) => (
                  <Badge key={idx} variant="secondary">
                    {allergen}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="font-medium">Không có</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Liên hệ khẩn cấp</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <InfoRow
            label="Người liên hệ"
            value={profile.relativeFullName || "Không có"}
          />
          <InfoRow
            label="Số điện thoại"
            value={profile.relativePhoneNumber || "Không có"}
          />
        </CardContent>
      </Card>
    </div>
  );
}

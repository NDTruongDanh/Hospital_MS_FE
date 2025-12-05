"use client";

import { Badge } from "@/components/ui/badge";
import { Gender } from "@/interfaces/patient";

export function GenderBadge({ gender }: { gender: Gender | null | undefined }) {
  if (!gender) return <Badge variant="outline">N/A</Badge>;
  const map: Record<Gender, { label: string; className: string }> = {
    MALE: { label: "Nam", className: "bg-blue-100 text-blue-700" },
    FEMALE: { label: "Nữ", className: "bg-pink-100 text-pink-700" },
    OTHER: { label: "Khác", className: "bg-slate-100 text-slate-700" },
  };
  const cfg = map[gender];
  return (
    <Badge variant="secondary" className={`rounded-full px-3 py-1 text-xs font-medium ${cfg.className}`}>
      {cfg.label}
    </Badge>
  );
}

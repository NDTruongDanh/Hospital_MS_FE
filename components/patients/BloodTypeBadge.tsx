"use client";

import { Badge } from "@/components/ui/badge";
import { BloodType } from "@/interfaces/patient";

export function BloodTypeBadge({ bloodType, size = "md" }: { bloodType?: BloodType | null; size?: "sm" | "md" | "lg" }) {
  if (!bloodType) return <Badge variant="outline">N/A</Badge>;
  const sizeClass = size === "sm" ? "text-xs px-2 py-0.5" : size === "lg" ? "text-base px-4 py-2" : "text-sm px-3 py-1";
  return (
    <Badge variant="destructive" className={`bg-red-100 text-red-700 rounded-full ${sizeClass}`}>
      {bloodType}
    </Badge>
  );
}

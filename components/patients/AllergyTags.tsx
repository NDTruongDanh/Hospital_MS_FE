"use client";

import { Badge } from "@/components/ui/badge";

export function AllergyTags({ allergies }: { allergies?: string | string[] | null }) {
  const tags =
    typeof allergies === "string"
      ? allergies
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : allergies || [];

  if (!tags.length) return <p className="text-sm text-muted-foreground">Không có</p>;

  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((a) => (
        <Badge key={a} variant="outline" className="rounded-full">
          {a}
        </Badge>
      ))}
    </div>
  );
}

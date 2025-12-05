"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export function PatientAvatar({
  name,
  size = "md",
  className,
}: {
  name: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const sizeClass = {
    sm: "h-8 w-8 text-sm",
    md: "h-12 w-12 text-base",
    lg: "h-16 w-16 text-lg",
    xl: "h-20 w-20 text-xl",
  }[size];

  return (
    <Avatar className={cn(sizeClass, className)}>
      <AvatarFallback className="bg-primary/10 text-primary">{initials}</AvatarFallback>
    </Avatar>
  );
}

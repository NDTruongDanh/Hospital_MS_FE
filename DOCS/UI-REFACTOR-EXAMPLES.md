# Ví Dụ Refactor UI - Shadcn UI Standardization

Tài liệu này cung cấp các ví dụ cụ thể về cách refactor code để đạt được UI đồng nhất với shadcn UI.

---

## 1. Status Badge Refactoring

### ❌ TRƯỚC: Hardcoded Colors

```tsx
// components/billing/PaymentStatusBadge.tsx
const statusConfig = {
  PENDING: {
    label: "Pending",
    className: "bg-blue-100 text-blue-800 border-blue-200",
  },
  COMPLETED: {
    label: "Completed",
    className: "bg-green-100 text-green-800 border-green-200",
  },
  FAILED: {
    label: "Failed",
    className: "bg-red-100 text-red-800 border-red-200",
  },
};

export function PaymentStatusBadge({ status }: Props) {
  const config = statusConfig[status];
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full border", config.className)}>
      {config.label}
    </span>
  );
}
```

### ✅ SAU: Dùng StatusBadge Component

```tsx
// components/billing/PaymentStatusBadge.tsx
import { StatusBadge } from "@/components/ui/status-badge";
import { Clock, CheckCircle, XCircle, RotateCcw } from "lucide-react";

const statusConfig: Record<
  PaymentStatus,
  { label: string; variant: "info" | "success" | "destructive" | "gray"; icon: React.ReactNode }
> = {
  PENDING: {
    label: "Pending",
    variant: "info",
    icon: <Clock className="h-3 w-3" />,
  },
  COMPLETED: {
    label: "Completed",
    variant: "success",
    icon: <CheckCircle className="h-3 w-3" />,
  },
  FAILED: {
    label: "Failed",
    variant: "destructive",
    icon: <XCircle className="h-3 w-3" />,
  },
  REFUNDED: {
    label: "Refunded",
    variant: "gray",
    icon: <RotateCcw className="h-3 w-3" />,
  },
};

export function PaymentStatusBadge({ status, size = "md" }: Props) {
  const config = statusConfig[status];
  return (
    <StatusBadge variant={config.variant} size={size} icon={config.icon}>
      {config.label}
    </StatusBadge>
  );
}
```

---

### ❌ TRƯỚC: Badge với className override

```tsx
// components/patients/BloodTypeBadge.tsx
export function BloodTypeBadge({ bloodType }: Props) {
  return (
    <Badge
      variant="destructive"
      className={`bg-red-100 text-red-700 rounded-full ${sizeClass}`}
    >
      {bloodType}
    </Badge>
  );
}
```

### ✅ SAU: Dùng Badge variant hoặc StatusBadge

```tsx
// Option 1: Dùng Badge với variant phù hợp (nếu không phải status)
export function BloodTypeBadge({ bloodType, size = "md" }: Props) {
  if (!bloodType) return <Badge variant="outline">N/A</Badge>;
  
  return (
    <Badge variant="destructive" className="rounded-full">
      {bloodType}
    </Badge>
  );
}

// Option 2: Dùng StatusBadge nếu muốn consistent với status badges khác
export function BloodTypeBadge({ bloodType, size = "md" }: Props) {
  if (!bloodType) return <StatusBadge variant="outline">N/A</StatusBadge>;
  
  return (
    <StatusBadge variant="destructive" size={size}>
      {bloodType}
    </StatusBadge>
  );
}
```

---

### ❌ TRƯỚC: GenderBadge với hardcoded colors

```tsx
// components/patients/GenderBadge.tsx
const map: Record<Gender, { label: string; className: string }> = {
  MALE: { label: "Nam", className: "bg-blue-100 text-blue-700" },
  FEMALE: { label: "Nữ", className: "bg-pink-100 text-pink-700" },
  OTHER: { label: "Khác", className: "bg-slate-100 text-slate-700" },
};

export function GenderBadge({ gender }: Props) {
  const cfg = map[gender];
  return (
    <Badge variant="secondary" className={`rounded-full ${cfg.className}`}>
      {cfg.label}
    </Badge>
  );
}
```

### ✅ SAU: Dùng StatusBadge variants

```tsx
// components/patients/GenderBadge.tsx
import { StatusBadge } from "@/components/ui/status-badge";
import { User, Users } from "lucide-react";

const genderConfig: Record<
  Gender,
  { label: string; variant: "info" | "pink" | "gray"; icon: React.ReactNode }
> = {
  MALE: {
    label: "Nam",
    variant: "info",
    icon: <User className="h-3 w-3" />,
  },
  FEMALE: {
    label: "Nữ",
    variant: "pink",
    icon: <Users className="h-3 w-3" />,
  },
  OTHER: {
    label: "Khác",
    variant: "gray",
    icon: null,
  },
};

export function GenderBadge({ gender }: Props) {
  if (!gender) return <StatusBadge variant="outline">N/A</StatusBadge>;
  
  const config = genderConfig[gender];
  return (
    <StatusBadge variant={config.variant} icon={config.icon}>
      {config.label}
    </StatusBadge>
  );
}
```

---

## 2. Button Variants Refactoring

### ❌ TRƯỚC: Hardcoded colors trong button.tsx

```tsx
// components/ui/button.tsx
const buttonVariants = cva(
  "...",
  {
    variants: {
      variant: {
        // ...
        view: "bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800 dark:hover:bg-blue-900",
        edit: "bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800 dark:hover:bg-amber-900",
        danger: "bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 dark:bg-red-950 dark:text-red-300 dark:border-red-800 dark:hover:bg-red-900",
      },
    },
  }
);
```

### ✅ SAU: Dùng design tokens với opacity

```tsx
// components/ui/button.tsx
const buttonVariants = cva(
  "...",
  {
    variants: {
      variant: {
        // ...
        view: "bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 dark:bg-primary/20 dark:text-primary dark:border-primary/30",
        edit: "bg-amber-500/10 text-amber-700 border-amber-500/20 hover:bg-amber-500/20 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/30",
        danger: "bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/20 dark:bg-destructive/20 dark:text-destructive-foreground dark:border-destructive/30",
      },
    },
  }
);
```

**Hoặc tốt hơn:** Tạo semantic variants dựa trên design system:

```tsx
// components/ui/button.tsx
const buttonVariants = cva(
  "...",
  {
    variants: {
      variant: {
        // ...
        // Thay vì view/edit/danger, dùng:
        // - "outline" với className override cho specific use cases
        // - Hoặc tạo variants mới dựa trên design tokens
      },
    },
  }
);

// Usage:
<Button variant="outline" className="border-primary text-primary hover:bg-primary/10">
  View
</Button>
```

---

## 3. Employee Status Badge Refactoring

### ❌ TRƯỚC

```tsx
// app/admin/hr/_components/employee-status-badge.tsx
const statusConfig: Record<EmployeeStatus, { label: string; className: string; icon: React.ElementType }> = {
  ACTIVE: {
    label: "Active",
    className: "bg-green-100 text-green-800 hover:bg-green-100",
    icon: CheckCircle,
  },
  ON_LEAVE: {
    label: "On Leave",
    className: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100",
    icon: Clock,
  },
  RESIGNED: {
    label: "Resigned",
    className: "bg-gray-100 text-gray-800 hover:bg-gray-100",
    icon: UserX,
  },
};

export function EmployeeStatusBadge({ status, showIcon = true }: Props) {
  const config = statusConfig[status];
  const Icon = config.icon;
  
  return (
    <Badge variant="outline" className={cn("border-0 font-medium text-xs", config.className)}>
      {showIcon && <Icon className="mr-1 h-3 w-3" />}
      {config.label}
    </Badge>
  );
}
```

### ✅ SAU

```tsx
// app/admin/hr/_components/employee-status-badge.tsx
import { StatusBadge } from "@/components/ui/status-badge";
import { CheckCircle, Clock, UserX } from "lucide-react";

const statusConfig: Record<
  EmployeeStatus,
  { label: string; variant: "success" | "warning" | "gray"; icon: React.ReactNode }
> = {
  ACTIVE: {
    label: "Active",
    variant: "success",
    icon: <CheckCircle className="h-3 w-3" />,
  },
  ON_LEAVE: {
    label: "On Leave",
    variant: "warning",
    icon: <Clock className="h-3 w-3" />,
  },
  RESIGNED: {
    label: "Resigned",
    variant: "gray",
    icon: <UserX className="h-3 w-3" />,
  },
};

export function EmployeeStatusBadge({ status, showIcon = true, size = "default" }: Props) {
  const config = statusConfig[status];
  
  return (
    <StatusBadge variant={config.variant} size={size} icon={showIcon ? config.icon : undefined}>
      {config.label}
    </StatusBadge>
  );
}
```

---

## 4. Appointment Status Badge Refactoring

### ❌ TRƯỚC

```tsx
// app/admin/appointments/_components/appointment-status-badge.tsx
const statusConfig: Record<AppointmentStatus, { label: string; className: string; icon: React.ReactNode }> = {
  SCHEDULED: {
    label: "Scheduled",
    className: "bg-blue-100 text-blue-800 border-blue-200",
    icon: <STATUS_ICONS.appointments.waiting className="h-3 w-3" />,
  },
  COMPLETED: {
    label: "Completed",
    className: "bg-green-100 text-green-800 border-green-200",
    icon: <STATUS_ICONS.appointments.completed className="h-3 w-3" />,
  },
  CANCELLED: {
    label: "Cancelled",
    className: "bg-red-100 text-red-800 border-red-200",
    icon: <STATUS_ICONS.appointments.cancelled className="h-3 w-3" />,
  },
  NO_SHOW: {
    label: "No Show",
    className: "bg-gray-100 text-gray-800 border-gray-200",
    icon: <STATUS_ICONS.appointments.noShow className="h-3 w-3" />,
  },
};

export function AppointmentStatusBadge({ status }: Props) {
  const config = statusConfig[status];
  return (
    <Badge variant="outline" className={`gap-1 ${config.className}`}>
      {config.icon}
      {config.label}
    </Badge>
  );
}
```

### ✅ SAU

```tsx
// app/admin/appointments/_components/appointment-status-badge.tsx
import { StatusBadge } from "@/components/ui/status-badge";
import { STATUS_ICONS } from "@/config/icons";

const statusConfig: Record<
  AppointmentStatus,
  { label: string; variant: "info" | "success" | "destructive" | "gray"; icon: React.ReactNode }
> = {
  SCHEDULED: {
    label: "Scheduled",
    variant: "info",
    icon: <STATUS_ICONS.appointments.waiting className="h-3 w-3" />,
  },
  COMPLETED: {
    label: "Completed",
    variant: "success",
    icon: <STATUS_ICONS.appointments.completed className="h-3 w-3" />,
  },
  CANCELLED: {
    label: "Cancelled",
    variant: "destructive",
    icon: <STATUS_ICONS.appointments.cancelled className="h-3 w-3" />,
  },
  NO_SHOW: {
    label: "No Show",
    variant: "gray",
    icon: <STATUS_ICONS.appointments.noShow className="h-3 w-3" />,
  },
};

export function AppointmentStatusBadge({ status, size = "default" }: Props) {
  const config = statusConfig[status];
  return (
    <StatusBadge variant={config.variant} size={size} icon={config.icon}>
      {config.label}
    </StatusBadge>
  );
}
```

---

## 5. Invoice Status Badge Refactoring

### ❌ TRƯỚC

```tsx
// app/admin/billing/_components/invoice-status-badge.tsx
const statusConfig: Record<InvoiceStatus, { label: string; className: string; icon: React.ElementType }> = {
  UNPAID: {
    label: "Unpaid",
    className: "bg-red-100 text-red-800 hover:bg-red-100",
    icon: Circle,
  },
  PARTIALLY_PAID: {
    label: "Partially Paid",
    className: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100",
    icon: CircleDashed,
  },
  PAID: {
    label: "Paid",
    className: "bg-green-100 text-green-800 hover:bg-green-100",
    icon: CheckCircle,
  },
  OVERDUE: {
    label: "Overdue",
    className: "bg-orange-100 text-orange-800 hover:bg-orange-100",
    icon: AlertCircle,
  },
  CANCELLED: {
    label: "Cancelled",
    className: "bg-gray-100 text-gray-800 hover:bg-gray-100",
    icon: XCircle,
  },
};

export function InvoiceStatusBadge({ status, showIcon = true, size = "md" }: Props) {
  const config = statusConfig[status];
  const Icon = config.icon;
  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-2.5 py-0.5",
    lg: "text-base px-4 py-1",
  };

  return (
    <Badge variant="outline" className={cn("border-0 font-medium", config.className, sizeClasses[size])}>
      {showIcon && <Icon className="mr-1 h-3 w-3" />}
      {config.label}
    </Badge>
  );
}
```

### ✅ SAU

```tsx
// app/admin/billing/_components/invoice-status-badge.tsx
import { StatusBadge } from "@/components/ui/status-badge";
import { Circle, CircleDashed, CheckCircle, AlertCircle, XCircle } from "lucide-react";

const statusConfig: Record<
  InvoiceStatus,
  { label: string; variant: "destructive" | "warning" | "success" | "orange" | "gray"; icon: React.ReactNode }
> = {
  UNPAID: {
    label: "Unpaid",
    variant: "destructive",
    icon: <Circle className="h-3 w-3" />,
  },
  PARTIALLY_PAID: {
    label: "Partially Paid",
    variant: "warning",
    icon: <CircleDashed className="h-3 w-3" />,
  },
  PAID: {
    label: "Paid",
    variant: "success",
    icon: <CheckCircle className="h-3 w-3" />,
  },
  OVERDUE: {
    label: "Overdue",
    variant: "orange",
    icon: <AlertCircle className="h-3 w-3" />,
  },
  CANCELLED: {
    label: "Cancelled",
    variant: "gray",
    icon: <XCircle className="h-3 w-3" />,
  },
};

export function InvoiceStatusBadge({ status, showIcon = true, size = "default" }: Props) {
  const config = statusConfig[status];
  return (
    <StatusBadge variant={config.variant} size={size} icon={showIcon ? config.icon : undefined}>
      {config.label}
    </StatusBadge>
  );
}
```

---

## 6. Mapping Guide: Status → StatusBadge Variant

Sử dụng mapping này để chọn variant phù hợp:

| Status Type | Variant | Màu |
|------------|---------|-----|
| Pending, Waiting, Scheduled | `info` | Blue |
| Completed, Paid, Active, Success | `success` | Green |
| Cancelled, Failed, Unpaid, Error | `destructive` | Red |
| On Leave, Partially Paid, Warning | `warning` | Yellow |
| Overdue | `orange` | Orange |
| Refunded, Resigned, No Show, Cancelled (neutral) | `gray` | Gray |
| Custom colors (nếu cần) | `purple`, `pink`, `cyan`, `emerald`, `amber` | Tương ứng |

---

## 7. Best Practices

### ✅ DO

- ✅ Luôn dùng `StatusBadge` cho status displays
- ✅ Dùng design tokens thay vì hardcoded colors
- ✅ Sử dụng icons từ `lucide-react` hoặc `@/config/icons`
- ✅ Giữ size prop nhất quán: `"sm" | "default" | "lg"`
- ✅ Sử dụng `cn()` utility để merge classes khi cần

### ❌ DON'T

- ❌ Không hardcode colors như `bg-blue-100`, `text-red-800`
- ❌ Không tạo custom badge components khi đã có `StatusBadge`
- ❌ Không override `StatusBadge` với className trừ khi thực sự cần
- ❌ Không dùng `Badge` cho status displays (dùng `StatusBadge`)

---

## 8. Testing Checklist

Sau khi refactor, kiểm tra:

- [ ] Visual appearance giống với design
- [ ] Dark mode hoạt động đúng
- [ ] Icons hiển thị đúng
- [ ] Size variants hoạt động
- [ ] Responsive trên mobile
- [ ] Accessibility (contrast, screen readers)

---

## 9. Migration Strategy

1. **Bước 1:** Refactor một component làm mẫu (ví dụ: `PaymentStatusBadge`)
2. **Bước 2:** Test kỹ, đảm bảo visual không thay đổi
3. **Bước 3:** Refactor các components tương tự
4. **Bước 4:** Update tất cả usages
5. **Bước 5:** Remove old code và cleanup

---

## 10. Resources

- **StatusBadge Component:** `components/ui/status-badge.tsx`
- **Design Guidelines:** `DOCS/design_guidelines.md`
- **Shadcn UI Docs:** https://ui.shadcn.com/docs/components/badge
- **Lucide Icons:** https://lucide.dev/icons/



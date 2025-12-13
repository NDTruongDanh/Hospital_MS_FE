# Hướng Dẫn Đồng Nhất UI với Shadcn UI & Tailwind CSS

## 📋 Tổng Quan

Dự án HMS_FE hiện tại đã được setup khá tốt với **shadcn UI** và **Tailwind CSS**. Tài liệu này cung cấp hướng dẫn để đồng nhất UI toàn bộ code base.

## ✅ Hiện Trạng

### Đã Có

- ✅ **Shadcn UI** đã được cài đặt và cấu hình (components.json)
- ✅ **Tailwind CSS v4** với cấu hình tùy chỉnh
- ✅ 50+ components shadcn UI trong `components/ui/`
- ✅ Design tokens và CSS variables trong `app/globals.css`
- ✅ Các utility classes đã được định nghĩa

### Cần Cải Thiện

- ❌ Một số components vẫn dùng hardcoded colors (ví dụ: `bg-blue-100`, `text-blue-800`)
- ❌ Chưa sử dụng variant system nhất quán
- ❌ Một số inline styles vẫn còn
- ❌ Loading spinner custom chưa dùng shadcn components

---

## 🎯 Kế Hoạch Đồng Nhất UI

### Phase 1: Audit & Documentation (1-2 ngày)

#### 1.1. Rà Soát Toàn Bộ Components

```bash
# Tìm các hardcoded colors
grep -r "bg-blue-\|bg-red-\|bg-green-\|bg-yellow-\|bg-purple-\|bg-orange-\|bg-pink-" app/ components/ --include="*.tsx"

# Tìm inline styles
grep -r "style={{" app/ components/ --include="*.tsx"

# Tìm className không dùng cn() utility
grep -r 'className="[^"]*\b(bg-\|text-\|border-)' app/ components/ --include="*.tsx" | grep -v "cn("
```

#### 1.2. Tạo Danh Sách Components Cần Refactor

Tạo file `DOCS/UI-REFACTORING-CHECKLIST.md` để track progress.

---

### Phase 2: Thiết Lập Design System (2-3 ngày)

#### 2.1. Tạo Status Badge Component Chuẩn

Hiện tại có nhiều status badges với hardcoded colors. Cần tạo component chuẩn:

**Tạo file: `components/ui/status-badge.tsx`**

```tsx
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const statusBadgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground",
        outline: "text-foreground",
        success:
          "border-transparent bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
        warning:
          "border-transparent bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
        info: "border-transparent bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
        purple:
          "border-transparent bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
        cyan: "border-transparent bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-300",
        orange:
          "border-transparent bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
      },
      size: {
        default: "px-2.5 py-0.5 text-xs",
        sm: "px-2 py-0.5 text-[10px]",
        lg: "px-3 py-1 text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface StatusBadgeProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof statusBadgeVariants> {
  icon?: React.ReactNode;
}

function StatusBadge({
  className,
  variant,
  size,
  icon,
  children,
  ...props
}: StatusBadgeProps) {
  return (
    <div
      className={cn(statusBadgeVariants({ variant, size }), className)}
      {...props}
    >
      {icon && <span className="mr-1">{icon}</span>}
      {children}
    </div>
  );
}

export { StatusBadge, statusBadgeVariants };
```

#### 2.2. Tạo Mapping Constants

**Tạo file: `lib/constants/ui-mappings.ts`**

```typescript
import { StatusBadge } from "@/components/ui/status-badge";
import { Clock, Check, X, AlertTriangle } from "lucide-react";

// Appointment Status Mappings
export const APPOINTMENT_STATUS_CONFIG = {
  SCHEDULED: {
    variant: "info" as const,
    label: "Đã lên lịch",
    icon: Clock,
  },
  COMPLETED: {
    variant: "success" as const,
    label: "Hoàn thành",
    icon: Check,
  },
  CANCELLED: {
    variant: "destructive" as const,
    label: "Đã hủy",
    icon: X,
  },
  NO_SHOW: {
    variant: "warning" as const,
    label: "Không đến",
    icon: AlertTriangle,
  },
} as const;

// Invoice Status Mappings
export const INVOICE_STATUS_CONFIG = {
  UNPAID: {
    variant: "destructive" as const,
    label: "Chưa thanh toán",
  },
  PARTIALLY_PAID: {
    variant: "warning" as const,
    label: "Thanh toán một phần",
  },
  PAID: {
    variant: "success" as const,
    label: "Đã thanh toán",
  },
  OVERDUE: {
    variant: "orange" as const,
    label: "Quá hạn",
  },
  CANCELLED: {
    variant: "secondary" as const,
    label: "Đã hủy",
  },
} as const;

// Helper function
export function getAppointmentStatusBadgeProps(
  status: keyof typeof APPOINTMENT_STATUS_CONFIG
) {
  return (
    APPOINTMENT_STATUS_CONFIG[status] || APPOINTMENT_STATUS_CONFIG.SCHEDULED
  );
}

export function getInvoiceStatusBadgeProps(
  status: keyof typeof INVOICE_STATUS_CONFIG
) {
  return INVOICE_STATUS_CONFIG[status] || INVOICE_STATUS_CONFIG.UNPAID;
}
```

#### 2.3. Tạo Spinner Component

**Tạo file: `components/ui/spinner.tsx`**

```tsx
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const spinnerVariants = cva(
  "animate-spin rounded-full border-2 border-current border-t-transparent",
  {
    variants: {
      size: {
        sm: "h-4 w-4",
        default: "h-6 w-6",
        lg: "h-8 w-8",
        xl: "h-12 w-12",
      },
      variant: {
        default: "text-primary",
        secondary: "text-secondary",
        destructive: "text-destructive",
        muted: "text-muted-foreground",
      },
    },
    defaultVariants: {
      size: "default",
      variant: "default",
    },
  }
);

export interface SpinnerProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof spinnerVariants> {}

function Spinner({ className, size, variant, ...props }: SpinnerProps) {
  return (
    <div
      role="status"
      aria-label="loading"
      className={cn(spinnerVariants({ size, variant }), className)}
      {...props}
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
}

export { Spinner, spinnerVariants };
```

#### 2.4. Tạo Loading Component

**Tạo file: `components/ui/loading.tsx`**

```tsx
import * as React from "react";
import { Spinner } from "./spinner";
import { cn } from "@/lib/utils";

export interface LoadingProps extends React.HTMLAttributes<HTMLDivElement> {
  text?: string;
  fullScreen?: boolean;
}

function Loading({
  text = "Loading...",
  fullScreen = false,
  className,
  ...props
}: LoadingProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2",
        fullScreen && "min-h-screen",
        className
      )}
      {...props}
    >
      <Spinner size="xl" />
      {text && <p className="text-sm text-muted-foreground">{text}</p>}
    </div>
  );
}

export { Loading };
```

---

### Phase 3: Refactor Components (5-7 ngày)

#### 3.1. Ưu Tiên Refactor

**Độ ưu tiên cao:**

1. Authentication components (RoleGuard, login form)
2. Shared components (badges, status indicators)
3. Common UI patterns (loading states, empty states)

**Độ ưu tiên trung bình:** 4. Feature-specific components (appointments, billing) 5. Layout components

**Độ ưu tiên thấp:** 6. Landing page components 7. Demo/test components

#### 3.2. Ví Dụ Refactoring

**TRƯỚC:**

```tsx
// components/auth/RoleGuard.tsx
<div className="flex items-center justify-center min-h-screen">
  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600"></div>
</div>
```

**SAU:**

```tsx
import { Loading } from "@/components/ui/loading";

<Loading fullScreen />;
```

---

**TRƯỚC:**

```tsx
// Hardcoded status badge
<span className="bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded-full text-xs">
  Đã lên lịch
</span>
```

**SAU:**

```tsx
import { StatusBadge } from "@/components/ui/status-badge";
import { getAppointmentStatusBadgeProps } from "@/lib/constants/ui-mappings";

const {
  variant,
  label,
  icon: Icon,
} = getAppointmentStatusBadgeProps("SCHEDULED");
<StatusBadge variant={variant} icon={Icon && <Icon className="h-3 w-3" />}>
  {label}
</StatusBadge>;
```

#### 3.3. Refactor Landing Page Components

**File: `components/landing/FeatureCard.tsx`**

**TRƯỚC:**

```tsx
<div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-700">
  {icon}
</div>
<h3 className="text-lg font-semibold text-slate-900">{title}</h3>
<p className="mt-2 text-sm text-slate-600">{description}</p>
```

**SAU:**

```tsx
import { cn } from "@/lib/utils";

<div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
  {icon}
</div>
<h3 className="text-lg font-semibold text-foreground">{title}</h3>
<p className="mt-2 text-sm text-muted-foreground">{description}</p>
```

---

### Phase 4: Tailwind Config Optimization (1-2 ngày)

#### 4.1. Xem Lại CSS Variables

File `app/globals.css` đã có design tokens tốt, nhưng cần thêm:

```css
@theme inline {
  /* Status colors - thêm vào existing theme */
  --color-success: #22c55e;
  --color-success-foreground: #ffffff;
  --color-warning: #f59e0b;
  --color-warning-foreground: #ffffff;
  --color-info: #3b82f6;
  --color-info-foreground: #ffffff;
}
```

#### 4.2. Thêm Utility Classes

```css
@layer utilities {
  /* Status badge utilities */
  .status-success {
    @apply bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300;
  }

  .status-warning {
    @apply bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300;
  }

  .status-error {
    @apply bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300;
  }

  .status-info {
    @apply bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300;
  }
}
```

---

### Phase 5: Testing & Documentation (2-3 ngày)

#### 5.1. Test Coverage

- ✅ Test tất cả variant của StatusBadge
- ✅ Test Spinner component
- ✅ Test Loading states
- ✅ Visual regression testing

#### 5.2. Storybook/Documentation

Tạo file `DOCS/COMPONENT-LIBRARY.md` với:

- Component API documentation
- Usage examples
- Variant showcase
- Do's and Don'ts

---

## 📝 Best Practices

### 1. Luôn Dùng Design Tokens

❌ **Tránh:**

```tsx
<div className="bg-blue-500 text-white">
```

✅ **Nên:**

```tsx
<div className="bg-primary text-primary-foreground">
```

### 2. Sử Dụng Variant System

❌ **Tránh:**

```tsx
<button className="px-4 py-2 bg-blue-500 text-white rounded-md">
```

✅ **Nên:**

```tsx
import { Button } from "@/components/ui/button";
<Button variant="default">Click me</Button>;
```

### 3. Tránh Hardcoded Colors

❌ **Tránh:**

```tsx
className = "border-blue-200 bg-blue-50";
```

✅ **Nên:**

```tsx
className = "border-primary/20 bg-primary/5";
```

hoặc dùng variants:

```tsx
<StatusBadge variant="info">Status</StatusBadge>
```

### 4. Sử Dụng cn() Utility

❌ **Tránh:**

```tsx
className={`base-class ${isActive ? 'active' : ''} ${className}`}
```

✅ **Nên:**

```tsx
import { cn } from "@/lib/utils";
className={cn("base-class", isActive && "active", className)}
```

### 5. Semantic Color Usage

```tsx
// Semantic colors
bg - background; // Page background
bg - card; // Card background
bg - primary; // Primary actions
bg - secondary; // Secondary actions
bg - muted; // Muted backgrounds
bg - accent; // Accent highlights
bg - destructive; // Error/delete actions

// Text colors
text - foreground; // Primary text
text - muted - foreground; // Secondary text
text - primary - foreground; // Text on primary bg
```

---

## 🔧 Commands & Scripts

### Tìm & Thay Thế

```bash
# Tìm hardcoded colors
npm run audit:colors

# Tìm inline styles
npm run audit:styles

# Format code
npm run format

# Lint
npm run lint
```

### Scripts Tự Động (Thêm vào package.json)

```json
{
  "scripts": {
    "audit:colors": "grep -r 'bg-blue-\\|bg-red-\\|bg-green-\\|bg-yellow-' app/ components/ --include='*.tsx' || true",
    "audit:styles": "grep -r 'style={{' app/ components/ --include='*.tsx' || true"
  }
}
```

---

## 📊 Checklist Refactoring

### Components cần refactor ngay:

- [ ] `components/auth/RoleGuard.tsx` - Loading spinner
- [ ] `components/landing/FeatureCard.tsx` - Hardcoded colors
- [ ] `app/(auth)/login/_components/test-accounts.tsx` - Status badges
- [ ] `app/admin/billing/_components/invoice-status-badge.tsx` - Status badges
- [ ] `app/doctor/schedules/page.tsx` - Status colors
- [ ] `app/doctor/exams/page.tsx` - Status badges

### Files mới cần tạo:

- [ ] `components/ui/status-badge.tsx`
- [ ] `components/ui/spinner.tsx`
- [ ] `components/ui/loading.tsx`
- [ ] `lib/constants/ui-mappings.ts`
- [ ] `DOCS/UI-REFACTORING-CHECKLIST.md`
- [ ] `DOCS/COMPONENT-LIBRARY.md`

---

## 🎨 Color Palette Reference

Dựa trên `app/globals.css`:

```css
/* Primary */
--primary: #2563eb (blue-600) --primary-foreground: #f8fbff /* Backgrounds */
  --background: #f8fafc (slate-50) --card: #ffffff --muted: #e5e7eb (gray-200)
  /* Text */ --foreground: dark gray --muted-foreground: #475569 (slate-600)
  /* Semantic */ --destructive: #ef4444 (red-500)
  --destructive-foreground: #ffffff;
```

---

## 🚀 Timeline Dự Kiến

| Phase     | Thời gian      | Mô tả                          |
| --------- | -------------- | ------------------------------ |
| Phase 1   | 1-2 ngày       | Audit & Documentation          |
| Phase 2   | 2-3 ngày       | Setup Design System Components |
| Phase 3   | 5-7 ngày       | Refactor Components            |
| Phase 4   | 1-2 ngày       | Tailwind Optimization          |
| Phase 5   | 2-3 ngày       | Testing & Documentation        |
| **Total** | **11-17 ngày** |                                |

---

## 💡 Tips

1. **Làm từng bước nhỏ**: Refactor theo từng component/feature, không làm hết một lúc
2. **Test sau mỗi thay đổi**: Đảm bảo UI không bị break
3. **Commit thường xuyên**: Mỗi component refactor là 1 commit
4. **Document changes**: Ghi chú những thay đổi quan trọng
5. **Code review**: Review kỹ trước khi merge

---

## 📚 Resources

- [Shadcn UI Docs](https://ui.shadcn.com)
- [Tailwind CSS Docs](https://tailwindcss.com)
- [CVA (Class Variance Authority)](https://cva.style)
- [Radix UI Primitives](https://www.radix-ui.com)

---

## ✅ Kết Luận

Code base của bạn đã có **nền tảng rất tốt** với shadcn UI và Tailwind CSS. Việc đồng nhất UI chủ yếu là:

1. **Tạo các component chuẩn** (StatusBadge, Spinner, Loading)
2. **Refactor hardcoded colors** thành design tokens
3. **Sử dụng variant system** nhất quán
4. **Loại bỏ inline styles**

Ưu tiên refactor các **shared components** trước, sau đó lan rộng ra toàn bộ codebase.

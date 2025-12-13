# Component Library Documentation

## 📚 Table of Contents

1. [StatusBadge](#statusbadge)
2. [Spinner](#spinner)
3. [Loading](#loading)
4. [UI Mappings](#ui-mappings)
5. [Migration Guide](#migration-guide)

---

## StatusBadge

A versatile badge component for displaying status information with consistent styling.

### Import

```tsx
import { StatusBadge } from "@/components/ui/status-badge";
```

### Basic Usage

```tsx
<StatusBadge variant="success">Completed</StatusBadge>
```

### With Icon

```tsx
import { Check } from "lucide-react";

<StatusBadge variant="success" icon={<Check className="h-3 w-3" />}>
  Completed
</StatusBadge>;
```

### Props

| Prop      | Type                                                                                                                                                                       | Default     | Description                 |
| --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- | --------------------------- |
| variant   | `"default" \| "secondary" \| "destructive" \| "outline" \| "success" \| "warning" \| "info" \| "purple" \| "cyan" \| "orange" \| "pink" \| "amber" \| "emerald" \| "gray"` | `"default"` | Visual style variant        |
| size      | `"default" \| "sm" \| "lg"`                                                                                                                                                | `"default"` | Size of the badge           |
| icon      | `ReactNode`                                                                                                                                                                | `undefined` | Icon to display before text |
| className | `string`                                                                                                                                                                   | `undefined` | Additional CSS classes      |

### Variants

```tsx
<StatusBadge variant="default">Default</StatusBadge>
<StatusBadge variant="success">Success</StatusBadge>
<StatusBadge variant="warning">Warning</StatusBadge>
<StatusBadge variant="info">Info</StatusBadge>
<StatusBadge variant="destructive">Error</StatusBadge>
<StatusBadge variant="purple">Purple</StatusBadge>
<StatusBadge variant="cyan">Cyan</StatusBadge>
<StatusBadge variant="orange">Orange</StatusBadge>
<StatusBadge variant="gray">Gray</StatusBadge>
```

### Sizes

```tsx
<StatusBadge size="sm">Small</StatusBadge>
<StatusBadge size="default">Default</StatusBadge>
<StatusBadge size="lg">Large</StatusBadge>
```

### Real-World Example

```tsx
import { StatusBadge } from "@/components/ui/status-badge";
import { getAppointmentStatusConfig } from "@/lib/constants/ui-mappings";

function AppointmentStatus({ status }: { status: string }) {
  const { variant, label, icon: Icon } = getAppointmentStatusConfig(status);

  return (
    <StatusBadge variant={variant} icon={Icon && <Icon className="h-3 w-3" />}>
      {label}
    </StatusBadge>
  );
}
```

---

## Spinner

A loading spinner with various sizes and color variants.

### Import

```tsx
import { Spinner } from "@/components/ui/spinner";
```

### Basic Usage

```tsx
<Spinner />
```

### Props

| Prop      | Type                                                              | Default        | Description            |
| --------- | ----------------------------------------------------------------- | -------------- | ---------------------- |
| size      | `"xs" \| "sm" \| "default" \| "lg" \| "xl"`                       | `"default"`    | Size of the spinner    |
| variant   | `"default" \| "secondary" \| "destructive" \| "muted" \| "white"` | `"default"`    | Color variant          |
| label     | `string`                                                          | `"Loading..."` | Screen reader text     |
| className | `string`                                                          | `undefined`    | Additional CSS classes |

### Sizes

```tsx
<Spinner size="xs" />
<Spinner size="sm" />
<Spinner size="default" />
<Spinner size="lg" />
<Spinner size="xl" />
```

### Variants

```tsx
<Spinner variant="default" />
<Spinner variant="secondary" />
<Spinner variant="destructive" />
<Spinner variant="muted" />
<Spinner variant="white" />
```

### In Button

```tsx
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

<Button disabled>
  <Spinner size="sm" variant="white" className="mr-2" />
  Loading...
</Button>;
```

---

## Loading

A loading state component with a spinner and optional text.

### Import

```tsx
import { Loading } from "@/components/ui/loading";
```

### Basic Usage

```tsx
<Loading />
```

### Full Screen

```tsx
<Loading fullScreen text="Loading data..." />
```

### Custom Size and Text

```tsx
<Loading text="Processing..." size="sm" />
```

### Props

| Prop       | Type                                                              | Default        | Description                |
| ---------- | ----------------------------------------------------------------- | -------------- | -------------------------- |
| text       | `string`                                                          | `"Loading..."` | Text to display            |
| fullScreen | `boolean`                                                         | `false`        | Take up full screen height |
| size       | `"xs" \| "sm" \| "default" \| "lg" \| "xl"`                       | `"xl"`         | Spinner size               |
| variant    | `"default" \| "secondary" \| "destructive" \| "muted" \| "white"` | `"default"`    | Spinner variant            |
| className  | `string`                                                          | `undefined`    | Additional CSS classes     |

### Use Cases

**Loading State in Page:**

```tsx
function MyPage() {
  const { data, isLoading } = useQuery("data");

  if (isLoading) {
    return <Loading text="Loading data..." />;
  }

  return <div>{/* content */}</div>;
}
```

**Full Screen Loading:**

```tsx
function RoleGuard({ children }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <Loading fullScreen />;
  }

  return <>{children}</>;
}
```

---

## UI Mappings

Centralized configuration for status badges and UI patterns.

### Import

```tsx
import {
  getAppointmentStatusConfig,
  getInvoiceStatusConfig,
  getChargeTypeConfig,
  getPaymentMethodConfig,
  getUserRoleConfig,
  getScheduleStatusConfig,
} from "@/lib/constants/ui-mappings";
```

### Appointment Status

```tsx
import { StatusBadge } from "@/components/ui/status-badge";
import { getAppointmentStatusConfig } from "@/lib/constants/ui-mappings";

function AppointmentStatusBadge({ status }: { status: string }) {
  const config = getAppointmentStatusConfig(status);
  const Icon = config.icon;

  return (
    <StatusBadge variant={config.variant}>
      {Icon && <Icon className="h-3 w-3 mr-1" />}
      {config.label}
    </StatusBadge>
  );
}

// Usage
<AppointmentStatusBadge status="SCHEDULED" />
<AppointmentStatusBadge status="COMPLETED" />
<AppointmentStatusBadge status="CANCELLED" />
<AppointmentStatusBadge status="NO_SHOW" />
```

### Invoice Status

```tsx
const config = getInvoiceStatusConfig("PAID");
// { variant: "success", label: "Đã thanh toán", icon: Check }

<StatusBadge variant={config.variant}>{config.label}</StatusBadge>;
```

### User Role

```tsx
const config = getUserRoleConfig("DOCTOR");
// { variant: "info", label: "Bác sĩ" }

<StatusBadge variant={config.variant}>{config.label}</StatusBadge>;
```

### Available Mappings

- `APPOINTMENT_STATUS_CONFIG` - Appointment statuses (SCHEDULED, COMPLETED, CANCELLED, NO_SHOW)
- `INVOICE_STATUS_CONFIG` - Invoice statuses (UNPAID, PARTIALLY_PAID, PAID, OVERDUE, CANCELLED)
- `CHARGE_TYPE_CONFIG` - Charge types (CONSULTATION, MEDICINE, TEST, OTHER)
- `PAYMENT_METHOD_CONFIG` - Payment methods (CASH, CREDIT_CARD, BANK_TRANSFER, INSURANCE)
- `USER_ROLE_CONFIG` - User roles (ADMIN, DOCTOR, NURSE, RECEPTIONIST, PATIENT)
- `SCHEDULE_STATUS_CONFIG` - Schedule statuses (AVAILABLE, BOOKED, CANCELLED)

---

## Migration Guide

### Replacing Hardcoded Colors

#### ❌ Before

```tsx
<span className="bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded-full text-xs">
  Đã lên lịch
</span>
```

#### ✅ After

```tsx
import { StatusBadge } from "@/components/ui/status-badge";

<StatusBadge variant="info">Đã lên lịch</StatusBadge>;
```

### Replacing Custom Spinners

#### ❌ Before

```tsx
<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600"></div>
```

#### ✅ After

```tsx
import { Spinner } from "@/components/ui/spinner";

<Spinner size="xl" />;
```

### Replacing Loading States

#### ❌ Before

```tsx
{
  isLoading && (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600"></div>
    </div>
  );
}
```

#### ✅ After

```tsx
import { Loading } from "@/components/ui/loading";

{
  isLoading && <Loading fullScreen />;
}
```

### Using UI Mappings

#### ❌ Before

```tsx
const statusColors = {
  SCHEDULED: "bg-blue-100 text-blue-800",
  COMPLETED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
};

<span className={`px-2.5 py-0.5 rounded-full ${statusColors[status]}`}>
  {status}
</span>;
```

#### ✅ After

```tsx
import { StatusBadge } from "@/components/ui/status-badge";
import { getAppointmentStatusConfig } from "@/lib/constants/ui-mappings";

const { variant, label, icon: Icon } = getAppointmentStatusConfig(status);

<StatusBadge variant={variant} icon={Icon && <Icon className="h-3 w-3" />}>
  {label}
</StatusBadge>;
```

---

## Best Practices

### ✅ Do's

1. **Use StatusBadge for all status indicators**

   ```tsx
   <StatusBadge variant="success">Active</StatusBadge>
   ```

2. **Use UI mappings for consistent styling**

   ```tsx
   const config = getAppointmentStatusConfig(status);
   <StatusBadge variant={config.variant}>{config.label}</StatusBadge>;
   ```

3. **Use Loading component for loading states**

   ```tsx
   {
     isLoading && <Loading text="Loading data..." />;
   }
   ```

4. **Use design tokens**

   ```tsx
   className = "bg-primary text-primary-foreground";
   ```

5. **Use cn() utility for className composition**
   ```tsx
   className={cn("base-class", isActive && "active-class", className)}
   ```

### ❌ Don'ts

1. **Don't use hardcoded colors**

   ```tsx
   // Bad
   className="bg-blue-100 text-blue-800"

   // Good
   <StatusBadge variant="info">Info</StatusBadge>
   ```

2. **Don't create custom spinners**

   ```tsx
   // Bad
   <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-500" />

   // Good
   <Spinner size="default" />
   ```

3. **Don't duplicate status configurations**

   ```tsx
   // Bad
   const colors = { PAID: "bg-green-100" };

   // Good
   import { getInvoiceStatusConfig } from "@/lib/constants/ui-mappings";
   const { variant } = getInvoiceStatusConfig("PAID");
   ```

4. **Don't use inline styles**

   ```tsx
   // Bad
   <div style={{ backgroundColor: "#f0f0f0" }}>

   // Good
   <div className="bg-muted">
   ```

---

## Quick Reference

### Common Patterns

**Status Badge with Icon:**

```tsx
<StatusBadge variant="success" icon={<Check className="h-3 w-3" />}>
  Completed
</StatusBadge>
```

**Conditional Status:**

```tsx
<StatusBadge variant={isPaid ? "success" : "warning"}>
  {isPaid ? "Paid" : "Pending"}
</StatusBadge>
```

**Loading Button:**

```tsx
<Button disabled={isLoading}>
  {isLoading && <Spinner size="sm" variant="white" className="mr-2" />}
  Submit
</Button>
```

**Page Loading:**

```tsx
if (isLoading) return <Loading text="Loading..." />;
```

**Full Screen Loading:**

```tsx
if (isLoading) return <Loading fullScreen />;
```

---

## Color Palette Reference

### Variants Map

| Variant     | Color        | Use Case                  |
| ----------- | ------------ | ------------------------- |
| default     | Primary blue | Default actions           |
| success     | Green        | Success states, completed |
| warning     | Yellow       | Warnings, pending         |
| info        | Blue         | Information, scheduled    |
| destructive | Red          | Errors, cancelled         |
| purple      | Purple       | Special categories        |
| cyan        | Cyan         | Alternative info          |
| orange      | Orange       | Alerts, overdue           |
| gray        | Gray         | Inactive, disabled        |
| amber       | Amber        | Medium priority           |
| emerald     | Emerald      | Available states          |

---

## Accessibility

All components follow accessibility best practices:

- ✅ Proper ARIA labels
- ✅ Screen reader support
- ✅ Keyboard navigation
- ✅ Color contrast compliance
- ✅ Focus indicators

### Example

```tsx
<Spinner label="Loading user data" />
// Screen readers will announce: "Loading user data"
```

---

## Support

For questions or issues:

1. Check this documentation
2. Review component source code
3. Check shadcn UI documentation: https://ui.shadcn.com
4. Contact development team

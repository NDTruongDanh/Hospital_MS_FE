# Quick Start: Refactoring Examples

Đây là các ví dụ thực tế để bắt đầu refactoring code base của bạn.

## 🚀 Bắt Đầu Nhanh

### Bước 1: Import các components mới

Các component sau đã sẵn sàng sử dụng:

- `components/ui/status-badge.tsx` ✅
- `components/ui/spinner.tsx` ✅
- `components/ui/loading.tsx` ✅
- `lib/constants/ui-mappings.ts` ✅

### Bước 2: Refactor Component Đầu Tiên

## Example 1: RoleGuard Loading State

### Trước khi refactor:

```tsx
// components/auth/RoleGuard.tsx (lines 62-65)
if (isLoading || !user || !allowedRoles.includes(user.role)) {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600"></div>
    </div>
  );
}
```

### Sau khi refactor:

```tsx
import { Loading } from "@/components/ui/loading";

if (isLoading || !user || !allowedRoles.includes(user.role)) {
  return <Loading fullScreen />;
}
```

**Lợi ích:**

- ✅ Ngắn gọn hơn (1 dòng thay vì 5 dòng)
- ✅ Sử dụng component chuẩn
- ✅ Dễ maintain
- ✅ Có accessibility support

---

## Example 2: Test Accounts Role Badges

### Trước khi refactor:

```tsx
// app/(auth)/login/_components/test-accounts.tsx
const roleColors = {
  ADMIN: "bg-purple-100 text-purple-700 border-purple-200",
  DOCTOR: "bg-blue-100 text-blue-700 border-blue-200",
  NURSE: "bg-green-100 text-green-700 border-green-200",
  RECEPTIONIST: "bg-amber-100 text-amber-700 border-amber-200",
  PATIENT: "bg-pink-100 text-pink-700 border-pink-200",
};

<span className={`px-2 py-1 rounded text-xs border ${roleColors[user.role]}`}>
  {user.role}
</span>;
```

### Sau khi refactor:

```tsx
import { StatusBadge } from "@/components/ui/status-badge";
import { getUserRoleConfig } from "@/lib/constants/ui-mappings";

const { variant, label } = getUserRoleConfig(user.role);

<StatusBadge variant={variant}>{label}</StatusBadge>;
```

**Lợi ích:**

- ✅ Không cần hardcode colors
- ✅ Tự động dark mode support
- ✅ Nhãn tiếng Việt từ centralized config
- ✅ Dễ thay đổi toàn bộ hệ thống

---

## Example 3: Appointment Status Badge

### Trước khi refactor:

```tsx
// app/admin/appointments/page.tsx
const statusColors = {
  SCHEDULED: "bg-blue-100 text-blue-800 border-blue-200",
  COMPLETED: "bg-green-100 text-green-800 border-green-200",
  CANCELLED: "bg-red-100 text-red-800 border-red-200",
  NO_SHOW: "bg-gray-100 text-gray-800 border-gray-200",
};

<Badge className={statusColors[appointment.status]}>
  {appointment.status}
</Badge>;
```

### Sau khi refactor:

```tsx
import { StatusBadge } from "@/components/ui/status-badge";
import { getAppointmentStatusConfig } from "@/lib/constants/ui-mappings";

const {
  variant,
  label,
  icon: Icon,
} = getAppointmentStatusConfig(appointment.status);

<StatusBadge variant={variant} icon={Icon && <Icon className="h-3 w-3" />}>
  {label}
</StatusBadge>;
```

**Lợi ích:**

- ✅ Icon tự động
- ✅ Nhãn tiếng Việt
- ✅ Consistent styling
- ✅ Centralized configuration

---

## Example 4: Invoice Status Badge

### Trước khi refactor:

```tsx
// app/admin/billing/_components/invoice-status-badge.tsx
const statusConfig = {
  UNPAID: {
    className: "bg-red-100 text-red-800 hover:bg-red-100",
    label: "Chưa thanh toán",
  },
  PAID: {
    className: "bg-green-100 text-green-800 hover:bg-green-100",
    label: "Đã thanh toán",
  },
  // ...
};

<Badge className={statusConfig[status].className}>
  {statusConfig[status].label}
</Badge>;
```

### Sau khi refactor:

```tsx
import { StatusBadge } from "@/components/ui/status-badge";
import { getInvoiceStatusConfig } from "@/lib/constants/ui-mappings";

const { variant, label } = getInvoiceStatusConfig(status);

<StatusBadge variant={variant}>{label}</StatusBadge>;
```

**Lợi ích:**

- ✅ Đơn giản hóa code
- ✅ Xóa duplicate config
- ✅ Sử dụng central config

---

## Example 5: Doctor Schedule Status

### Trước khi refactor:

```tsx
// app/doctor/schedules/page.tsx
const statusStyles = {
  AVAILABLE: "bg-emerald-100 text-emerald-700",
  BOOKED: "bg-blue-100 text-blue-700",
  CANCELLED: "bg-red-100 text-red-700",
};

<span className={`px-2 py-1 rounded-full text-xs ${statusStyles[status]}`}>
  {status}
</span>;
```

### Sau khi refactor:

```tsx
import { StatusBadge } from "@/components/ui/status-badge";
import { getScheduleStatusConfig } from "@/lib/constants/ui-mappings";

const { variant, label } = getScheduleStatusConfig(status);

<StatusBadge variant={variant}>{label}</StatusBadge>;
```

---

## Example 6: Loading Button

### Trước khi refactor:

```tsx
<Button disabled={isLoading}>
  {isLoading && (
    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
  )}
  Submit
</Button>
```

### Sau khi refactor:

```tsx
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

<Button disabled={isLoading}>
  {isLoading && <Spinner size="sm" variant="white" className="mr-2" />}
  Submit
</Button>;
```

---

## Example 7: Page Loading State

### Trước khi refactor:

```tsx
function AppointmentsPage() {
  const { data, isLoading } = useQuery("appointments");

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return <div>{/* content */}</div>;
}
```

### Sau khi refactor:

```tsx
import { Loading } from "@/components/ui/loading";

function AppointmentsPage() {
  const { data, isLoading } = useQuery("appointments");

  if (isLoading) {
    return <Loading text="Đang tải lịch hẹn..." />;
  }

  return <div>{/* content */}</div>;
}
```

---

## Example 8: Feature Card Colors

### Trước khi refactor:

```tsx
// components/landing/FeatureCard.tsx
<div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-700">
  {icon}
</div>
<h3 className="text-lg font-semibold text-slate-900">{title}</h3>
<p className="mt-2 text-sm text-slate-600">{description}</p>
```

### Sau khi refactor:

```tsx
<div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
  {icon}
</div>
<h3 className="text-lg font-semibold text-foreground">{title}</h3>
<p className="mt-2 text-sm text-muted-foreground">{description}</p>
```

**Lợi ích:**

- ✅ Sử dụng design tokens
- ✅ Dark mode support
- ✅ Theme consistency

---

## Example 9: Conditional Status Badge

### Trước khi refactor:

```tsx
{
  exam.isCompleted ? (
    <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs">
      Hoàn thành
    </span>
  ) : (
    <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded text-xs">
      Đang khám
    </span>
  );
}
```

### Sau khi refactor:

```tsx
import { StatusBadge } from "@/components/ui/status-badge";

<StatusBadge variant={exam.isCompleted ? "success" : "warning"}>
  {exam.isCompleted ? "Hoàn thành" : "Đang khám"}
</StatusBadge>;
```

---

## Example 10: Create Reusable Status Component

### Tạo component mới:

```tsx
// components/appointment/AppointmentStatusBadge.tsx
import { StatusBadge } from "@/components/ui/status-badge";
import { getAppointmentStatusConfig } from "@/lib/constants/ui-mappings";

interface AppointmentStatusBadgeProps {
  status: string;
  showIcon?: boolean;
}

export function AppointmentStatusBadge({
  status,
  showIcon = true,
}: AppointmentStatusBadgeProps) {
  const { variant, label, icon: Icon } = getAppointmentStatusConfig(status);

  return (
    <StatusBadge variant={variant}>
      {showIcon && Icon && <Icon className="h-3 w-3 mr-1" />}
      {label}
    </StatusBadge>
  );
}
```

### Sử dụng:

```tsx
import { AppointmentStatusBadge } from "@/components/appointment/AppointmentStatusBadge";

<AppointmentStatusBadge status="SCHEDULED" />
<AppointmentStatusBadge status="COMPLETED" showIcon={false} />
```

---

## 📝 Checklist Refactoring

Khi refactor một component, hãy làm theo checklist này:

### Trước khi refactor:

- [ ] Đọc và hiểu code hiện tại
- [ ] Xác định pattern cần refactor (status badge, spinner, loading, colors)
- [ ] Check xem có component/mapping nào phù hợp không

### Trong khi refactor:

- [ ] Import components mới
- [ ] Thay thế code cũ với code mới
- [ ] Kiểm tra props và variants
- [ ] Test visual trong dev mode

### Sau khi refactor:

- [ ] Test functionality
- [ ] Check accessibility
- [ ] Commit changes với message rõ ràng
- [ ] Update checklist

---

## 🎯 Thứ Tự Ưu Tiên Refactor

### 1️⃣ Quick Wins (Làm trước - 1-2 ngày)

- [ ] RoleGuard loading spinner
- [ ] Test accounts badges
- [ ] Page loading states
- [ ] Button loading states

### 2️⃣ Status Badges (3-4 ngày)

- [ ] Appointment status badges
- [ ] Invoice status badges
- [ ] Schedule status badges
- [ ] Exam status badges

### 3️⃣ Design Tokens (2-3 ngày)

- [ ] Landing page colors
- [ ] Layout colors
- [ ] Text colors
- [ ] Background colors

### 4️⃣ Polish (1-2 ngày)

- [ ] Remove unused code
- [ ] Update documentation
- [ ] Test coverage
- [ ] Final review

---

## 🛠️ Tools & Commands

### Tìm Components Cần Refactor

```bash
# Tìm custom spinners
grep -r "animate-spin" app/ components/ --include="*.tsx"

# Tìm hardcoded status colors
grep -r "bg-blue-100\|bg-green-100\|bg-red-100" app/ components/ --include="*.tsx"

# Tìm inline styles
grep -r "style={{" app/ components/ --include="*.tsx"

# Đếm số lượng
grep -r "bg-blue-100" app/ components/ --include="*.tsx" | wc -l
```

### Regex Find & Replace (VSCode)

**Find:** `className="([^"]*)(bg-blue-100 text-blue-800)([^"]*)"`
**Replace:** Check manually và dùng StatusBadge

---

## 💡 Tips

1. **Làm từng bước nhỏ**: Refactor 1 component/file mỗi lần
2. **Test ngay**: Kiểm tra UI sau mỗi thay đổi
3. **Commit thường xuyên**: Mỗi component là 1 commit
4. **Tái sử dụng**: Tạo wrapper components cho patterns lặp lại
5. **Document**: Ghi chú những thay đổi quan trọng

---

## 📚 Next Steps

1. Đọc [UI-STANDARDIZATION-GUIDE.md](./UI-STANDARDIZATION-GUIDE.md)
2. Đọc [COMPONENT-LIBRARY.md](./COMPONENT-LIBRARY.md)
3. Check [UI-REFACTORING-CHECKLIST.md](./UI-REFACTORING-CHECKLIST.md)
4. Bắt đầu với Quick Wins
5. Test và iterate

---

## ❓ FAQ

**Q: Có cần refactor tất cả cùng lúc không?**
A: Không! Làm từng phần, test kỹ, commit thường xuyên.

**Q: Component nào ưu tiên trước?**
A: Loading states và status badges vì chúng được dùng nhiều nhất.

**Q: Có break existing functionality không?**
A: Không, nếu làm đúng. Luôn test sau mỗi thay đổi.

**Q: Dark mode có work không?**
A: Có! Tất cả components đã support dark mode.

**Q: Có thể customize variants không?**
A: Có! Check statusBadgeVariants trong component source code.

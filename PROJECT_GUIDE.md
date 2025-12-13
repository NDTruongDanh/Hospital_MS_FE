# Hospital Management System (HMS) - Frontend Project Guide

> **Hướng dẫn toàn diện để hiểu, thiết lập và phát triển ứng dụng HMS Frontend**

---

## 📋 Mục Lục

1. [Tổng Quan Dự Án](#tổng-quan-dự-án)
2. [Tech Stack](#tech-stack)
3. [Bắt Đầu](#bắt-đầu)
4. [Cấu Trúc Dự Án](#cấu-trúc-dự-án)
5. [Kiến Trúc Ứng Dụng](#kiến-trúc-ứng-dụng)
6. [Các Tính Năng & Module](#các-tính-năng--module)
7. [Xác Thực & Phân Quyền](#xác-thực--phân-quyền)
8. [Quy Trình Phát Triển](#quy-trình-phát-triển)
9. [Tích Hợp API](#tích-hợp-api)
10. [Testing](#testing)
11. [Triển Khai](#triển-khai)
12. [Xử Lý Sự Cố](#xử-lý-sự-cố)
13. [Tài Nguyên Bổ Sung](#tài-nguyên-bổ-sung)

---

## 🎯 Tổng Quan Dự Án

**HMS (Hospital Management System)** là một ứng dụng web toàn diện để quản lý hoạt động bệnh viện, được xây dựng bằng các công nghệ web hiện đại. Frontend cung cấp quyền truy cập dựa trên vai trò cho các module khác nhau cho nhiều loại người dùng bao gồm quản trị viên, bác sĩ, y tá, lễ tân và bệnh nhân.

### Khả Năng Cốt Lõi

- **Quản Lý Bệnh Nhân** - Đăng ký, hồ sơ, lịch sử y tế
- **Lịch Hẹn** - Đặt lịch, đổi lịch, hủy lịch
- **Khám Bệnh** - Tạo hồ sơ khám, kê đơn thuốc
- **Thanh Toán & Hóa Đơn** - Xử lý thanh toán, quản lý hóa đơn
- **Nhân Sự** - Quản lý nhân viên, phòng ban, lịch làm việc
- **Kho Thuốc** - Quản lý tồn kho, danh mục
- **Báo Cáo & Phân Tích** - Báo cáo thống kê và dashboard

### Người Dùng Mục Tiêu

| Role             | Mức Truy Cập     | Chức Năng Chính                                      |
| ---------------- | ---------------- | ---------------------------------------------------- |
| **ADMIN**        | Toàn Bộ Hệ Thống | Tất cả chức năng quản lý, báo cáo, cấu hình hệ thống |
| **DOCTOR**       | Hoạt Động Y Tế   | Lịch hẹn, khám bệnh, kê đơn, hồ sơ bệnh nhân         |
| **NURSE**        | Hỗ Trợ Lâm Sàng  | Xem lịch hẹn, hồ sơ y tế (chỉ đọc)                   |
| **RECEPTIONIST** | Lễ Tân           | Đăng ký bệnh nhân, đặt lịch hẹn                      |
| **PATIENT**      | Tự Phục Vụ       | Xem lịch hẹn của mình, hồ sơ y tế, thanh toán        |

### Mục Đích Sử Dụng

Hệ thống được thiết kế để:

1. **Quản lý thông tin bệnh nhân** - Lưu trữ và quản lý thông tin cá nhân, lịch sử y tế
2. **Điều phối lịch hẹn** - Quản lý lịch khám bệnh giữa bệnh nhân và bác sĩ
3. **Xử lý khám bệnh** - Tạo hồ sơ khám, chẩn đoán, kê đơn thuốc
4. **Quản lý thanh toán** - Xử lý hóa đơn và thanh toán
5. **Quản lý nhân sự** - Quản lý nhân viên, phòng ban, lịch làm việc
6. **Báo cáo và phân tích** - Tạo báo cáo thống kê và phân tích hiệu suất

---

## 🛠 Tech Stack

### Framework & Ngôn Ngữ Cốt Lõi

- **Next.js 16.0.5** - Framework React với App Router
  - Hỗ trợ Server-Side Rendering (SSR) và Static Site Generation (SSG)
  - Routing tự động dựa trên cấu trúc thư mục
  - Tối ưu hóa hiệu suất tự động

- **React 19.2.0** - Thư viện UI
  - Component-based architecture
  - Hooks cho state management
  - Virtual DOM cho hiệu suất tốt

- **TypeScript 5** - JavaScript với kiểu dữ liệu
  - Type safety tại compile time
  - IntelliSense tốt hơn
  - Giảm lỗi runtime

### UI & Styling

- **Tailwind CSS 4** - Framework CSS utility-first
  - Styling nhanh với utility classes
  - Responsive design dễ dàng
  - Customizable theme

- **shadcn/ui** - Thư viện component dựa trên Radix UI
  - Components có thể tùy chỉnh
  - Accessible by default
  - Copy-paste components (không phải npm package)

- **Radix UI** - Component primitives có thể truy cập
  - Unstyled, accessible components
  - Keyboard navigation
  - Screen reader support

- **Lucide React** - Thư viện icon
  - Icons đẹp, nhất quán
  - Tree-shakeable
  - Customizable size và color

- **next-themes** - Hỗ trợ dark mode
  - Chuyển đổi theme dễ dàng
  - Lưu preference của người dùng

### Quản Lý State & Data Fetching

- **TanStack Query (React Query) 5.90.11** - Quản lý server state
  - Tự động caching và refetching
  - Optimistic updates
  - Background synchronization
  - Error handling tự động

- **React Hook Form 7.67.0** - Quản lý form state
  - Performance tốt (ít re-render)
  - Validation tích hợp
  - Dễ tích hợp với Zod

- **Zod 4.1.13** - Schema validation
  - Type-safe validation
  - Runtime type checking
  - Tự động generate TypeScript types

### HTTP Client & API

- **Axios 1.13.2** - HTTP client với interceptors
  - Request/response interceptors
  - Automatic JSON parsing
  - Error handling tốt hơn fetch

- **MSW (Mock Service Worker) 2.2.14** - Mock API cho development
  - Intercept network requests
  - Mock responses
  - Test với real HTTP behavior

### Thư Viện Bổ Sung

- **date-fns 4.1.0** - Thao tác ngày tháng
  - Format dates
  - Calculate differences
  - Timezone support

- **recharts 2.15.2** - Thư viện biểu đồ cho báo cáo
  - Responsive charts
  - Nhiều loại chart (line, bar, pie, etc.)
  - Customizable

- **xlsx 0.18.5** - Xử lý file Excel
  - Export data to Excel
  - Import Excel files
  - Format cells

- **sonner 2.0.7** - Toast notifications
  - Beautiful toast messages
  - Multiple positions
  - Promise-based API

### Công Cụ Phát Triển

- **Playwright 1.57.0** - End-to-end testing
  - Cross-browser testing
  - Auto-waiting
  - Screenshot và video

- **ESLint 9** - Code linting
  - Find bugs
  - Enforce code style
  - Next.js specific rules

- **Prettier 3.7.4** - Code formatting
  - Consistent code style
  - Auto-format on save
  - Configurable rules

### Package Manager

- **pnpm** - Package manager nhanh và tiết kiệm dung lượng
  - Faster than npm/yarn
  - Disk space efficient
  - Strict dependency resolution

---

## 🚀 Bắt Đầu

### Yêu Cầu Hệ Thống

Trước khi bắt đầu, đảm bảo bạn đã cài đặt:

- **Node.js** 18+ (khuyến nghị: 20+)
  - Kiểm tra: `node --version`
  - Tải về: [nodejs.org](https://nodejs.org/)

- **pnpm** (hoặc npm/yarn)
  - Cài đặt pnpm: `npm install -g pnpm`
  - Kiểm tra: `pnpm --version`

- **Git**
  - Kiểm tra: `git --version`
  - Tải về: [git-scm.com](https://git-scm.com/)

- **Code Editor** (khuyến nghị: VS Code)
  - Extensions: ESLint, Prettier, TypeScript

### Cài Đặt Chi Tiết

#### Bước 1: Clone Repository

```bash
# Clone repository từ Git
git clone <repository-url>

# Di chuyển vào thư mục dự án
cd HMS_FE

# Kiểm tra branch hiện tại
git branch
```

#### Bước 2: Cài Đặt Dependencies

```bash
# Sử dụng pnpm (khuyến nghị)
pnpm install

# Hoặc sử dụng npm
npm install

# Hoặc sử dụng yarn
yarn install
```

**Lưu ý:** Quá trình này có thể mất vài phút tùy thuộc vào tốc độ internet.

#### Bước 3: Thiết Lập Environment Variables

Tạo file `.env.local` trong thư mục gốc:

```env
# Backend API Base URL
NEXT_PUBLIC_BE_BASE_URL=http://localhost:8080

# Các biến môi trường khác (nếu cần)
# NEXT_PUBLIC_API_KEY=your-api-key
```

**Giải thích:**

- `NEXT_PUBLIC_*` - Biến môi trường có thể truy cập từ client-side
- File `.env.local` - Không được commit vào Git (đã có trong .gitignore)

#### Bước 4: Khởi Động Development Server

```bash
# Sử dụng pnpm
pnpm dev

# Hoặc npm
npm run dev

# Hoặc yarn
yarn dev
```

**Kết quả mong đợi:**

```
▲ Next.js 16.0.5
- Local:        http://localhost:3000
- Ready in 2.3s
```

#### Bước 5: Mở Trình Duyệt

1. Mở trình duyệt (Chrome, Firefox, Edge, etc.)
2. Truy cập: [http://localhost:3000](http://localhost:3000)
3. Bạn sẽ thấy trang landing page

### Các Scripts Có Sẵn

```bash
# Development
pnpm dev          # Khởi động development server (port 3000)
                  # Hot reload tự động khi code thay đổi

# Production
pnpm build        # Tạo production build
                  # Tối ưu hóa code, minify, tree-shaking
pnpm start        # Khởi động production server
                  # Chạy sau khi build

# Code Quality
pnpm lint         # Chạy ESLint để kiểm tra lỗi code
pnpm format       # Format code với Prettier
                  # Tự động sửa format issues
```

### Chế Độ Mock (Mock Mode)

Dự án hỗ trợ mock data để phát triển mà không cần backend.

#### Cách Bật/Tắt Mock Mode

1. **Mở file:** `lib/mocks/toggle.ts`

2. **Thay đổi giá trị:**

   ```typescript
   // Bật mock mode (sử dụng mock data)
   export const USE_MOCK = true;

   // Tắt mock mode (sử dụng real API)
   export const USE_MOCK = false;
   ```

3. **Lưu file và reload trang**

#### Sử Dụng Test Accounts

Khi mock mode được bật, bạn có thể sử dụng test accounts:

- Xem danh sách đầy đủ: [DOCS/TEST_ACCOUNTS.md](./DOCS/TEST_ACCOUNTS.md)

**Ví dụ:**

- **Admin**: `admin@hms.com` / `admin123`
- **Doctor**: `doctor@hms.com` / `doctor123`
- **Patient**: `patient@hms.com` / `patient123`

#### Cách Test với Mock Data

1. Đảm bảo `USE_MOCK = true`
2. Khởi động dev server: `pnpm dev`
3. Truy cập `/login`
4. Sử dụng test account để đăng nhập
5. Dữ liệu sẽ được load từ mock service

**Lưu ý:** Mọi thay đổi trên mock data sẽ **mất khi reload trang** (không persist).

---

## 📁 Cấu Trúc Dự Án

### Tổng Quan Cấu Trúc

```
HMS_FE/
├── app/                          # Next.js App Router (Routes & Pages)
│   ├── (auth)/                   # Route group cho authentication
│   │   ├── login/                # Trang đăng nhập
│   │   │   ├── page.tsx          # Component chính
│   │   │   └── _components/      # Components riêng của route
│   │   ├── signup/               # Trang đăng ký
│   │   └── password-reset/        # Reset mật khẩu
│   │
│   ├── admin/                    # Admin dashboard
│   │   ├── layout.tsx            # Layout cho admin routes
│   │   ├── page.tsx              # Dashboard chính
│   │   ├── appointments/         # Module lịch hẹn
│   │   │   ├── page.tsx          # Danh sách appointments
│   │   │   ├── new/              # Tạo appointment mới
│   │   │   │   └── page.tsx
│   │   │   ├── [id]/             # Dynamic route (chi tiết)
│   │   │   │   ├── page.tsx      # Xem chi tiết
│   │   │   │   └── edit/         # Sửa appointment
│   │   │   │       └── page.tsx
│   │   │   └── _components/      # Components riêng
│   │   │       ├── columns.tsx   # Table columns
│   │   │       └── ...
│   │   ├── billing/              # Module thanh toán
│   │   ├── exams/                # Module khám bệnh
│   │   ├── hr/                   # Module nhân sự
│   │   │   ├── employees/        # Quản lý nhân viên
│   │   │   ├── departments/      # Quản lý phòng ban
│   │   │   └── schedules/        # Quản lý lịch làm việc
│   │   ├── medicines/            # Module thuốc
│   │   ├── patients/             # Module bệnh nhân
│   │   └── reports/              # Module báo cáo
│   │
│   ├── doctor/                   # Doctor portal
│   │   ├── layout.tsx            # Layout cho doctor
│   │   ├── appointments/         # Lịch hẹn của doctor
│   │   ├── exams/                # Khám bệnh
│   │   └── patients/             # Bệnh nhân được gán
│   │
│   ├── nurse/                    # Nurse portal
│   ├── patient/                  # Patient portal
│   ├── profile/                  # User profile
│   ├── layout.tsx                # Root layout (toàn bộ app)
│   ├── page.tsx                  # Landing page (/)
│   ├── globals.css               # Global styles
│   ├── error.tsx                 # Error boundary
│   └── global-error.tsx          # Global error handler
│
├── components/                   # Reusable React components
│   ├── ui/                       # shadcn/ui components
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── table.tsx
│   │   └── ...
│   └── ...                       # Custom components
│
├── contexts/                     # React Contexts
│   └── AuthContext.tsx           # Authentication context
│                                 # Quản lý user session, login/logout
│
├── hooks/                        # Custom React Hooks
│   ├── queries/                  # React Query hooks
│   │   ├── useAppointment.ts     # Hooks cho appointments
│   │   ├── useBilling.ts          # Hooks cho billing
│   │   ├── useHr.ts              # Hooks cho HR
│   │   ├── useMedicalExam.ts     # Hooks cho medical exams
│   │   ├── usePatient.ts         # Hooks cho patients
│   │   └── useReports.ts         # Hooks cho reports
│   ├── useDebounce.ts            # Debounce hook
│   └── use-mobile.ts             # Mobile detection hook
│
├── interfaces/                   # TypeScript Type Definitions
│   ├── appointment.ts            # Types cho appointments
│   ├── billing.ts               # Types cho billing
│   ├── patient.ts               # Types cho patients
│   ├── employee.ts              # Types cho employees
│   └── ...                      # Các types khác
│
├── services/                     # API Service Layer
│   ├── appointment.service.ts   # API calls cho appointments
│   ├── auth.service.ts          # Real auth API
│   ├── auth.mock.service.ts     # Mock auth API
│   ├── billing.service.ts       # API calls cho billing
│   ├── patient.service.ts       # API calls cho patients
│   └── ...                      # Các services khác
│
├── lib/                          # Utilities & Configurations
│   ├── constants/                # App constants
│   │   ├── roles.ts              # Role definitions
│   │   └── status.ts             # Status constants
│   ├── mocks/                    # Mock data
│   │   ├── data/                 # Mock data files
│   │   ├── index.ts              # Mock data exports
│   │   └── toggle.ts             # Mock mode toggle
│   ├── schemas/                  # Zod Validation Schemas
│   │   ├── patient.schema.ts     # Patient validation
│   │   └── ...
│   └── utils/                    # Helper Functions
│       ├── error.ts              # Error handling utils
│       └── export.ts             # Export utilities
│
├── config/                       # Configuration Files
│   ├── axios.ts                  # Axios instance config
│   │                            # Base URL, interceptors
│   └── icons.ts                  # Icon mappings
│
├── middleware.ts                 # Next.js Middleware
│                                # Route protection, redirects
│
├── DOCS/                         # Project Documentation
│   ├── fe-specs/                 # Feature Specifications
│   │   ├── fe-spec-patient-service.md
│   │   ├── fe-spec-appointment-service.md
│   │   └── ROLE-PERMISSIONS-MATRIX.md
│   ├── UI-refactor-guide/        # UI Standardization
│   ├── vibe-code-guide/          # Coding Guidelines
│   └── ...
│
├── tests/                        # E2E Tests (Playwright)
│   ├── e2e-appointments.spec.ts
│   └── ...
│
├── public/                       # Static Assets
│   ├── mockServiceWorker.js      # MSW worker
│   └── ...
│
├── package.json                  # Dependencies & Scripts
├── tsconfig.json                 # TypeScript Configuration
├── next.config.ts                # Next.js Configuration
├── tailwind.config.ts            # Tailwind CSS Configuration
└── .env.local                    # Environment Variables (không commit)
```

### Giải Thích Chi Tiết Các Thư Mục

#### `app/` - Next.js App Router

**Mục đích:** Chứa tất cả routes và pages của ứng dụng.

**Quy tắc:**

- Mỗi thư mục con = một route
- `page.tsx` = component hiển thị tại route đó
- `layout.tsx` = layout wrapper cho route và các route con
- `_components/` = components riêng của route (không tạo route)
- `[id]` = dynamic route (ví dụ: `/patients/123`)

**Ví dụ:**

```
app/admin/patients/
├── page.tsx              → Route: /admin/patients
├── new/
│   └── page.tsx          → Route: /admin/patients/new
├── [id]/
│   ├── page.tsx          → Route: /admin/patients/:id
│   └── edit/
│       └── page.tsx      → Route: /admin/patients/:id/edit
└── _components/          → Không tạo route, chỉ chứa components
    └── PatientForm.tsx
```

#### `components/` - Reusable Components

**Mục đích:** Chứa các React components có thể tái sử dụng.

**Cấu trúc:**

- `ui/` - shadcn/ui components (Button, Input, Table, etc.)
- Components khác - Custom components dùng chung

**Ví dụ sử dụng:**

```typescript
// Import component
import { Button } from "@/components/ui/button";
import { PatientCard } from "@/components/patient-card";

// Sử dụng
<Button>Click me</Button>
<PatientCard patient={patient} />
```

#### `services/` - API Service Layer

**Mục đích:** Tách biệt logic gọi API khỏi components.

**Quy tắc:**

- Mỗi service file = một domain (patients, appointments, etc.)
- Export các functions để gọi API
- Sử dụng axios instance từ `config/axios.ts`

**Ví dụ:**

```typescript
// services/patient.service.ts
import axiosInstance from "@/config/axios";

export const patientService = {
  // GET all patients
  getAll: () => axiosInstance.get("/api/patients"),

  // GET patient by ID
  getById: (id: string) => axiosInstance.get(`/api/patients/${id}`),

  // POST create patient
  create: (data: Patient) => axiosInstance.post("/api/patients", data),

  // PUT update patient
  update: (id: string, data: Patient) =>
    axiosInstance.put(`/api/patients/${id}`, data),

  // DELETE patient
  delete: (id: string) => axiosInstance.delete(`/api/patients/${id}`),
};
```

#### `hooks/queries/` - React Query Hooks

**Mục đích:** Tạo custom hooks sử dụng React Query để fetch data.

**Quy tắc:**

- Mỗi file = một domain
- Export `useQuery` hooks cho GET requests
- Export `useMutation` hooks cho POST/PUT/DELETE

**Ví dụ:**

```typescript
// hooks/queries/usePatient.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { patientService } from "@/services/patient.service";

// Hook để lấy danh sách patients
export function usePatients() {
  return useQuery({
    queryKey: ["patients"],
    queryFn: () => patientService.getAll(),
  });
}

// Hook để tạo patient mới
export function useCreatePatient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Patient) => patientService.create(data),
    onSuccess: () => {
      // Invalidate và refetch danh sách
      queryClient.invalidateQueries({ queryKey: ["patients"] });
    },
  });
}
```

#### `interfaces/` - TypeScript Types

**Mục đích:** Định nghĩa types/interfaces cho TypeScript.

**Quy tắc:**

- Mỗi file = một domain
- Export interfaces/types
- Match với backend data models

**Ví dụ:**

```typescript
// interfaces/patient.ts
export interface Patient {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: "MALE" | "FEMALE" | "OTHER";
  address?: string;
  bloodType?: string;
  allergies?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface PatientFormData {
  fullName: string;
  email: string;
  phone: string;
  // ...
}
```

---

## 🏗 Kiến Trúc Ứng Dụng

### Luồng Ứng Dụng Tổng Quan

```
┌─────────────────┐
│   User Browser  │
└────────┬────────┘
         │
         ▼
┌─────────────────────────┐
│  Next.js Middleware     │ ◄─── Route Protection
│  (middleware.ts)        │      Check authentication
└────────┬────────────────┘      Check roles
         │
         ▼
┌─────────────────────────┐
│  Page Component         │ ◄─── app/*/page.tsx
│  (app/admin/patients/   │      Main UI component
│   page.tsx)             │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│  React Query Hook       │ ◄─── hooks/queries/usePatient.ts
│  (usePatients)          │      Data fetching logic
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│  Service Layer          │ ◄─── services/patient.service.ts
│  (patientService.getAll) │      API call functions
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│  Axios Instance         │ ◄─── config/axios.ts
│  (axiosInstance)        │      HTTP client config
└────────┬────────────────┘      Interceptors, base URL
         │
         ▼
┌─────────────────────────┐
│  Backend API            │ ◄─── Microservices
│  (REST API)             │      patient-service:8082
└─────────────────────────┘
```

### Quản Lý State

Ứng dụng sử dụng 3 loại state:

#### 1. Server State (React Query)

**Mục đích:** Quản lý data từ server (API).

**Đặc điểm:**

- Tự động caching
- Tự động refetch khi cần
- Background synchronization
- Optimistic updates
- Error handling tự động

**Ví dụ:**

```typescript
// Component sử dụng React Query
function PatientList() {
  // useQuery tự động fetch, cache, và refetch
  const { data, isLoading, error } = usePatients();

  if (isLoading) return <Loading />;
  if (error) return <Error message={error.message} />;

  return <PatientTable patients={data} />;
}
```

#### 2. Client State (React Hooks)

**Mục đích:** Quản lý UI state, form state.

**Đặc điểm:**

- Local component state
- Không persist
- Re-render khi thay đổi

**Ví dụ:**

```typescript
// UI state
const [isOpen, setIsOpen] = useState(false);
const [searchTerm, setSearchTerm] = useState("");

// Form state (React Hook Form)
const form = useForm<PatientFormData>({
  resolver: zodResolver(patientSchema),
});
```

#### 3. Global State (React Context)

**Mục đích:** Quản lý state toàn cục (authentication).

**Đặc điểm:**

- Accessible từ mọi component
- Persist trong session
- Shared state

**Ví dụ:**

```typescript
// Sử dụng AuthContext
const { user, login, logout, hasRole } = useAuth();

// Check role
if (hasRole("ADMIN")) {
  // Show admin features
}
```

### Luồng Xác Thực (Authentication Flow)

```
┌──────────────┐
│ User clicks  │
│ "Login"      │
└──────┬───────┘
       │
       ▼
┌─────────────────────────┐
│ Login Form Component    │
│ - Email                 │
│ - Password              │
└──────┬──────────────────┘
       │ User submits
       ▼
┌─────────────────────────┐
│ AuthContext.login()      │ ◄─── contexts/AuthContext.tsx
└──────┬──────────────────┘
       │
       ▼
┌─────────────────────────┐
│ authService.login()      │ ◄─── services/auth.service.ts
│ POST /api/auth/login     │      hoặc auth.mock.service.ts
└──────┬──────────────────┘
       │
       ▼
┌─────────────────────────┐
│ Backend validates       │
│ Returns:                │
│ - accessToken           │
│ - refreshToken          │
│ - user info (role, etc.)│
└──────┬──────────────────┘
       │
       ▼
┌─────────────────────────┐
│ Store in:               │
│ - Cookies               │
│ - localStorage          │
│ - AuthContext state     │
└──────┬──────────────────┘
       │
       ▼
┌─────────────────────────┐
│ Redirect based on role: │
│ - ADMIN → /admin        │
│ - DOCTOR → /doctor      │
│ - PATIENT → /patient    │
└─────────────────────────┘
```

### Pattern Fetching Data

#### Bước 1: Định Nghĩa Service Function

```typescript
// services/patient.service.ts
import axiosInstance from "@/config/axios";
import { Patient, PatientFormData } from "@/interfaces/patient";

export const patientService = {
  // GET: Lấy danh sách patients
  getAll: async (): Promise<Patient[]> => {
    const response = await axiosInstance.get("/api/patients");
    return response.data.data; // Backend trả về { data: [...] }
  },

  // GET: Lấy patient theo ID
  getById: async (id: string): Promise<Patient> => {
    const response = await axiosInstance.get(`/api/patients/${id}`);
    return response.data.data;
  },

  // POST: Tạo patient mới
  create: async (data: PatientFormData): Promise<Patient> => {
    const response = await axiosInstance.post("/api/patients", data);
    return response.data.data;
  },

  // PUT: Cập nhật patient
  update: async (
    id: string,
    data: Partial<PatientFormData>
  ): Promise<Patient> => {
    const response = await axiosInstance.put(`/api/patients/${id}`, data);
    return response.data.data;
  },

  // DELETE: Xóa patient
  delete: async (id: string): Promise<void> => {
    await axiosInstance.delete(`/api/patients/${id}`);
  },
};
```

#### Bước 2: Tạo React Query Hook

```typescript
// hooks/queries/usePatient.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { patientService } from "@/services/patient.service";
import { Patient, PatientFormData } from "@/interfaces/patient";
import { toast } from "sonner";

// Hook để lấy danh sách patients
export function usePatients() {
  return useQuery({
    queryKey: ["patients"], // Cache key
    queryFn: () => patientService.getAll(), // Function để fetch
    staleTime: 5 * 60 * 1000, // Data fresh trong 5 phút
  });
}

// Hook để lấy patient theo ID
export function usePatient(id: string) {
  return useQuery({
    queryKey: ["patients", id],
    queryFn: () => patientService.getById(id),
    enabled: !!id, // Chỉ fetch khi có id
  });
}

// Hook để tạo patient mới
export function useCreatePatient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: PatientFormData) => patientService.create(data),
    onSuccess: () => {
      // Invalidate cache để refetch danh sách
      queryClient.invalidateQueries({ queryKey: ["patients"] });
      toast.success("Patient created successfully");
    },
    onError: (error) => {
      toast.error("Failed to create patient");
      console.error(error);
    },
  });
}

// Hook để cập nhật patient
export function useUpdatePatient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<PatientFormData>;
    }) => patientService.update(id, data),
    onSuccess: (_, variables) => {
      // Invalidate cả danh sách và chi tiết
      queryClient.invalidateQueries({ queryKey: ["patients"] });
      queryClient.invalidateQueries({ queryKey: ["patients", variables.id] });
      toast.success("Patient updated successfully");
    },
  });
}

// Hook để xóa patient
export function useDeletePatient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => patientService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patients"] });
      toast.success("Patient deleted successfully");
    },
  });
}
```

#### Bước 3: Sử Dụng Trong Component

```typescript
// app/admin/patients/page.tsx
"use client";

import { usePatients, useDeletePatient } from "@/hooks/queries/usePatient";
import { Button } from "@/components/ui/button";
import { PatientTable } from "./_components/PatientTable";

export default function PatientsPage() {
  // Fetch danh sách patients
  const { data: patients, isLoading, error } = usePatients();

  // Mutation để xóa patient
  const deletePatient = useDeletePatient();

  // Handler xóa
  const handleDelete = async (id: string) => {
    if (confirm("Are you sure?")) {
      await deletePatient.mutateAsync(id);
    }
  };

  // Loading state
  if (isLoading) {
    return <div>Loading...</div>;
  }

  // Error state
  if (error) {
    return <div>Error: {error.message}</div>;
  }

  // Render
  return (
    <div>
      <h1>Patients</h1>
      <PatientTable
        patients={patients}
        onDelete={handleDelete}
      />
    </div>
  );
}
```

---

## 🎨 Các Tính Năng & Module

### 1. Quản Lý Bệnh Nhân (`/admin/patients`)

**Quyền Truy Cập:** ADMIN, DOCTOR, NURSE, RECEPTIONIST

**Chức Năng:**

- **Đăng ký bệnh nhân**
  - Walk-in registration (lễ tân đăng ký)
  - Self-registration (bệnh nhân tự đăng ký)
  - Validation thông tin

- **Quản lý hồ sơ**
  - Xem danh sách bệnh nhân
  - Xem chi tiết bệnh nhân
  - Cập nhật thông tin
  - Soft delete (không xóa vĩnh viễn)

- **Tìm kiếm & Lọc**
  - Tìm theo tên, email, phone
  - Lọc theo giới tính, nhóm máu
  - Pagination

- **Thông tin y tế**
  - Nhóm máu
  - Dị ứng
  - Tiền sử bệnh

- **Liên hệ khẩn cấp**
  - Thêm/sửa/xóa người liên hệ

**Components Chính:**

- `PatientListPage` - Trang danh sách với filters
- `PatientForm` - Form tạo/sửa bệnh nhân
- `PatientDetailView` - Xem chi tiết bệnh nhân
- `PatientCard` - Card hiển thị thông tin bệnh nhân

**Routes:**

```
/admin/patients          → Danh sách bệnh nhân
/admin/patients/new      → Tạo bệnh nhân mới
/admin/patients/[id]     → Chi tiết bệnh nhân
/admin/patients/[id]/edit → Sửa thông tin bệnh nhân
/admin/patients/[id]/history → Lịch sử khám bệnh
```

### 2. Quản Lý Lịch Hẹn (`/admin/appointments`)

**Quyền Truy Cập:** ADMIN, DOCTOR, NURSE, RECEPTIONIST

**Chức Năng:**

- **Tạo lịch hẹn**
  - Chọn bệnh nhân
  - Chọn bác sĩ
  - Chọn thời gian
  - Chọn loại khám (consultation, follow-up, etc.)

- **Xem danh sách**
  - Lọc theo bác sĩ, bệnh nhân, trạng thái, ngày
  - Sắp xếp
  - Pagination

- **Quản lý lịch hẹn**
  - Xem chi tiết
  - Đổi lịch (reschedule)
  - Hủy lịch (cancel)
  - Đánh dấu hoàn thành

- **Trạng thái**
  - SCHEDULED - Đã đặt lịch
  - CONFIRMED - Đã xác nhận
  - IN_PROGRESS - Đang khám
  - COMPLETED - Hoàn thành
  - CANCELLED - Đã hủy

**Components Chính:**

- `AppointmentListPage` - Danh sách với filters
- `AppointmentForm` - Form tạo/sửa
- `AppointmentDetailView` - Chi tiết lịch hẹn
- `AppointmentStatusBadge` - Badge hiển thị trạng thái

**Routes:**

```
/admin/appointments           → Danh sách
/admin/appointments/new       → Tạo mới
/admin/appointments/[id]      → Chi tiết
/admin/appointments/[id]/edit → Sửa
```

### 3. Khám Bệnh (`/admin/exams`)

**Quyền Truy Cập:** ADMIN, DOCTOR, NURSE

**Chức Năng:**

- **Tạo hồ sơ khám**
  - Liên kết với appointment
  - Chẩn đoán
  - Ghi chú
  - Kết quả xét nghiệm

- **Kê đơn thuốc**
  - Chọn thuốc
  - Liều lượng
  - Hướng dẫn sử dụng
  - Số ngày dùng

- **Xem lịch sử**
  - Danh sách các lần khám
  - Lọc theo bệnh nhân, bác sĩ, ngày

**Components Chính:**

- `MedicalExamListPage` - Danh sách
- `MedicalExamForm` - Form tạo/sửa
- `PrescriptionForm` - Form kê đơn
- `PrescriptionDetailView` - Chi tiết đơn thuốc

### 4. Thanh Toán & Hóa Đơn (`/admin/billing`)

**Quyền Truy Cập:** ADMIN

**Chức Năng:**

- **Tạo hóa đơn**
  - Liên kết với appointment/exam
  - Thêm các khoản phí
  - Tính tổng tiền

- **Xử lý thanh toán**
  - Nhận thanh toán
  - Cập nhật trạng thái
  - In hóa đơn

- **Quản lý hóa đơn**
  - Xem danh sách
  - Lọc theo trạng thái, ngày
  - Xem chi tiết

**Trạng thái hóa đơn:**

- PENDING - Chờ thanh toán
- PAID - Đã thanh toán
- CANCELLED - Đã hủy

### 5. Nhân Sự (`/admin/hr`)

**Quyền Truy Cập:** ADMIN

**Chức Năng:**

- **Quản lý nhân viên**
  - Thêm/sửa/xóa nhân viên
  - Phân công phòng ban
  - Gán vai trò (DOCTOR, NURSE, etc.)

- **Quản lý phòng ban**
  - Tạo/sửa phòng ban
  - Gán nhân viên

- **Lịch làm việc**
  - Tạo lịch cho nhân viên
  - Quản lý ca làm việc
  - Chấm công

**Routes:**

```
/admin/hr/employees     → Danh sách nhân viên
/admin/hr/departments   → Danh sách phòng ban
/admin/hr/schedules     → Lịch làm việc
```

### 6. Kho Thuốc (`/admin/medicines`)

**Quyền Truy Cập:** ADMIN

**Chức Năng:**

- **Quản lý thuốc**
  - Thêm/sửa/xóa thuốc
  - Quản lý tồn kho
  - Cập nhật giá

- **Quản lý danh mục**
  - Tạo danh mục thuốc
  - Phân loại

- **Tìm kiếm**
  - Tìm theo tên, danh mục
  - Lọc theo trạng thái tồn kho

### 7. Báo Cáo & Phân Tích (`/admin/reports`)

**Quyền Truy Cập:** ADMIN, DOCTOR

**Chức Năng:**

- **Thống kê lịch hẹn**
  - Số lượng theo ngày/tuần/tháng
  - Theo bác sĩ
  - Theo trạng thái

- **Báo cáo doanh thu**
  - Doanh thu theo thời gian
  - Theo dịch vụ
  - Biểu đồ

- **Hoạt động bệnh nhân**
  - Số lượt khám
  - Bệnh nhân mới
  - Tỷ lệ quay lại

- **Hiệu suất bác sĩ**
  - Số ca khám
  - Đánh giá
  - Thống kê

**Components:**

- Chart components (Recharts)
- Date range picker
- Metric cards

### 8. Doctor Portal (`/doctor`)

**Quyền Truy Cập:** DOCTOR

**Chức Năng:**

- **Lịch hẹn của tôi**
  - Xem appointments được gán
  - Cập nhật trạng thái
  - Xem chi tiết

- **Khám bệnh**
  - Tạo medical exam
  - Kê đơn thuốc
  - Xem lịch sử

- **Bệnh nhân**
  - Xem bệnh nhân được gán
  - Xem hồ sơ

**Routes:**

```
/doctor/appointments  → Lịch hẹn
/doctor/exams         → Khám bệnh
/doctor/patients      → Bệnh nhân
/doctor/schedules     → Lịch làm việc
```

### 9. Patient Portal (`/patient`)

**Quyền Truy Cập:** PATIENT

**Chức Năng:**

- **Lịch hẹn của tôi**
  - Xem danh sách
  - Đặt lịch mới
  - Hủy lịch

- **Hồ sơ y tế**
  - Xem medical records
  - Xem đơn thuốc
  - Tải xuống

- **Thanh toán**
  - Xem hóa đơn
  - Thanh toán online
  - Lịch sử thanh toán

**Routes:**

```
/patient/appointments    → Lịch hẹn
/patient/medical-records → Hồ sơ y tế
/patient/prescriptions   → Đơn thuốc
/patient/billing         → Thanh toán
```

---

## 🔐 Xác Thực & Phân Quyền

### Xác Thực (Authentication)

Xác thực được xử lý qua:

#### 1. AuthContext

**File:** `contexts/AuthContext.tsx`

**Chức năng:**

- Quản lý user session state
- Cung cấp `login()`, `logout()`, `hasRole()`
- Lưu user info trong cookies và localStorage

**Cách sử dụng:**

```typescript
import { useAuth } from "@/contexts/AuthContext";

function MyComponent() {
  const { user, isLoading, login, logout, hasRole } = useAuth();

  // Check if user is logged in
  if (isLoading) return <Loading />;
  if (!user) return <LoginPrompt />;

  // Check role
  if (hasRole("ADMIN")) {
    // Show admin features
  }

  // Logout
  const handleLogout = () => {
    logout();
  };
}
```

#### 2. Auth Service

**Files:**

- `services/auth.service.ts` - Real API
- `services/auth.mock.service.ts` - Mock API (development)

**Chức năng:**

- Xử lý login/logout API calls
- Trả về access tokens và user information

**Ví dụ:**

```typescript
// Login
const response = await authService.login({
  email: "admin@hms.com",
  password: "admin123",
});

// Response:
// {
//   accessToken: "jwt-token...",
//   refreshToken: "refresh-token...",
//   email: "admin@hms.com",
//   role: "ADMIN",
// }
```

### Phân Quyền (Authorization)

Role-based access control (RBAC) được triển khai ở nhiều cấp:

#### 1. Route Protection

**File:** `middleware.ts`

**Chức năng:**

- Bảo vệ routes dựa trên user roles
- Redirect nếu không có quyền

**Hiện tại:** Middleware đã được disable, sử dụng client-side guards.

#### 2. Component-Level Guards

**Cách sử dụng:**

```typescript
import { useAuth } from "@/contexts/AuthContext";

function AdminOnlyComponent() {
  const { hasRole } = useAuth();

  // Check role trước khi render
  if (!hasRole("ADMIN")) {
    return <div>Access Denied</div>;
  }

  return <AdminContent />;
}
```

**Hoặc sử dụng RoleGuard component:**

```typescript
<RoleGuard allowedRoles={["ADMIN", "DOCTOR"]}>
  <ProtectedContent />
</RoleGuard>
```

#### 3. API-Level Protection

- Backend validate tokens và roles
- Frontend gửi tokens qua Axios interceptors

**Axios interceptor tự động thêm token:**

```typescript
// config/axios.ts
axiosInstance.interceptors.request.use((config) => {
  const token = Cookies.get("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

### User Roles & Permissions

| Role             | Routes                                                                | Key Permissions                               |
| ---------------- | --------------------------------------------------------------------- | --------------------------------------------- |
| **ADMIN**        | `/admin/*`                                                            | Full system access                            |
| **DOCTOR**       | `/doctor/*`, `/admin/appointments`, `/admin/exams`, `/admin/patients` | Own appointments, create exams, view patients |
| **NURSE**        | `/nurse/*`, `/admin/appointments`, `/admin/exams` (read-only)         | View appointments, read medical records       |
| **RECEPTIONIST** | `/admin/appointments`, `/admin/patients`                              | Book appointments, register patients          |
| **PATIENT**      | `/patient/*`, `/profile`                                              | Own data only                                 |

**Chi tiết permissions:** [DOCS/fe-specs/ROLE-PERMISSIONS-MATRIX.md](./DOCS/fe-specs/ROLE-PERMISSIONS-MATRIX.md)

---

## 💻 Quy Trình Phát Triển

### Tổ Chức Code

#### 1. Feature-Based Structure

Mỗi feature có cấu trúc riêng:

```
app/admin/patients/
├── page.tsx              # Main page
├── _components/          # Feature-specific components
│   ├── PatientForm.tsx
│   ├── PatientTable.tsx
│   └── PatientFilters.tsx
├── new/
│   └── page.tsx          # Create page
└── [id]/
    ├── page.tsx          # Detail page
    └── edit/
        └── page.tsx      # Edit page
```

#### 2. Component Guidelines

**Quy tắc:**

- Sử dụng functional components với TypeScript
- Extract reusable logic vào custom hooks
- Giữ components nhỏ và tập trung
- Sử dụng shadcn/ui components để nhất quán

**Ví dụ component tốt:**

```typescript
// components/patient-card.tsx
import { Patient } from "@/interfaces/patient";
import { Card } from "@/components/ui/card";

interface PatientCardProps {
  patient: Patient;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export function PatientCard({ patient, onEdit, onDelete }: PatientCardProps) {
  return (
    <Card>
      <h3>{patient.fullName}</h3>
      <p>{patient.email}</p>
      <p>{patient.phone}</p>
      {onEdit && <Button onClick={() => onEdit(patient.id)}>Edit</Button>}
      {onDelete && <Button onClick={() => onDelete(patient.id)}>Delete</Button>}
    </Card>
  );
}
```

#### 3. Naming Conventions

- **Components:** PascalCase (e.g., `PatientForm.tsx`)
- **Hooks:** camelCase với prefix `use` (e.g., `usePatient.ts`)
- **Services:** camelCase với suffix `.service.ts`
- **Interfaces:** PascalCase (e.g., `Patient.ts`)
- **Constants:** UPPER_SNAKE_CASE (e.g., `MAX_PATIENTS`)

### Thêm Tính Năng Mới

#### Bước 1: Tạo Service Function

```typescript
// services/feature.service.ts
import axiosInstance from "@/config/axios";
import { Feature } from "@/interfaces/feature";

export const featureService = {
  getAll: async (): Promise<Feature[]> => {
    const response = await axiosInstance.get("/api/features");
    return response.data.data;
  },

  getById: async (id: string): Promise<Feature> => {
    const response = await axiosInstance.get(`/api/features/${id}`);
    return response.data.data;
  },

  create: async (data: FeatureFormData): Promise<Feature> => {
    const response = await axiosInstance.post("/api/features", data);
    return response.data.data;
  },

  update: async (
    id: string,
    data: Partial<FeatureFormData>
  ): Promise<Feature> => {
    const response = await axiosInstance.put(`/api/features/${id}`, data);
    return response.data.data;
  },

  delete: async (id: string): Promise<void> => {
    await axiosInstance.delete(`/api/features/${id}`);
  },
};
```

#### Bước 2: Tạo Interface

```typescript
// interfaces/feature.ts
export interface Feature {
  id: string;
  name: string;
  description?: string;
  status: "ACTIVE" | "INACTIVE";
  createdAt: string;
  updatedAt: string;
}

export interface FeatureFormData {
  name: string;
  description?: string;
  status: "ACTIVE" | "INACTIVE";
}
```

#### Bước 3: Tạo React Query Hook

```typescript
// hooks/queries/useFeature.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { featureService } from "@/services/feature.service";
import { Feature, FeatureFormData } from "@/interfaces/feature";
import { toast } from "sonner";

export function useFeatures() {
  return useQuery({
    queryKey: ["features"],
    queryFn: () => featureService.getAll(),
  });
}

export function useFeature(id: string) {
  return useQuery({
    queryKey: ["features", id],
    queryFn: () => featureService.getById(id),
    enabled: !!id,
  });
}

export function useCreateFeature() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: FeatureFormData) => featureService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["features"] });
      toast.success("Feature created successfully");
    },
  });
}

export function useUpdateFeature() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<FeatureFormData>;
    }) => featureService.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["features"] });
      queryClient.invalidateQueries({ queryKey: ["features", variables.id] });
      toast.success("Feature updated successfully");
    },
  });
}

export function useDeleteFeature() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => featureService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["features"] });
      toast.success("Feature deleted successfully");
    },
  });
}
```

#### Bước 4: Tạo Zod Schema (Validation)

```typescript
// lib/schemas/feature.schema.ts
import { z } from "zod";

export const featureSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  description: z.string().optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]),
});

export type FeatureFormData = z.infer<typeof featureSchema>;
```

#### Bước 5: Tạo Page Component

```typescript
// app/admin/features/page.tsx
"use client";

import { useFeatures, useDeleteFeature } from "@/hooks/queries/useFeature";
import { Button } from "@/components/ui/button";
import { FeatureTable } from "./_components/FeatureTable";
import Link from "next/link";

export default function FeaturesPage() {
  const { data: features, isLoading, error } = useFeatures();
  const deleteFeature = useDeleteFeature();

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure?")) {
      await deleteFeature.mutateAsync(id);
    }
  };

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Features</h1>
        <Link href="/admin/features/new">
          <Button>Create New</Button>
        </Link>
      </div>

      <FeatureTable
        features={features}
        onDelete={handleDelete}
      />
    </div>
  );
}
```

#### Bước 6: Tạo Form Component

```typescript
// app/admin/features/new/page.tsx
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { featureSchema, FeatureFormData } from "@/lib/schemas/feature.schema";
import { useCreateFeature } from "@/hooks/queries/useFeature";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";

export default function NewFeaturePage() {
  const router = useRouter();
  const createFeature = useCreateFeature();

  const form = useForm<FeatureFormData>({
    resolver: zodResolver(featureSchema),
    defaultValues: {
      status: "ACTIVE",
    },
  });

  const onSubmit = async (data: FeatureFormData) => {
    try {
      await createFeature.mutateAsync(data);
      router.push("/admin/features");
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <Input {...form.register("name")} placeholder="Name" />
      {form.formState.errors.name && (
        <p>{form.formState.errors.name.message}</p>
      )}

      <Input {...form.register("description")} placeholder="Description" />

      <Button type="submit" disabled={createFeature.isPending}>
        {createFeature.isPending ? "Creating..." : "Create"}
      </Button>
    </form>
  );
}
```

### Code Standards

**Xem chi tiết:** [DOCS/vibe-code-guide/AI-CODING-STANDARDS.md](./DOCS/vibe-code-guide/AI-CODING-STANDARDS.md)

**Điểm chính:**

- ✅ Sử dụng TypeScript nghiêm ngặt
- ✅ Tuân theo React best practices
- ✅ Sử dụng React Query cho tất cả server state
- ✅ Validate forms với Zod schemas
- ✅ Xử lý errors một cách graceful
- ✅ Sử dụng date formatting nhất quán
- ✅ Component nhỏ, tập trung
- ✅ Tách biệt concerns (service, hook, component)

---

## 🔌 Tích Hợp API

### Backend Services

Ứng dụng tích hợp với nhiều microservices:

| Service                  | Port | Base Path            | Purpose              |
| ------------------------ | ---- | -------------------- | -------------------- |
| **auth-service**         | 8081 | `/api/auth`          | Authentication       |
| **patient-service**      | 8082 | `/api/patients`      | Patient management   |
| **appointment-service**  | 8085 | `/api/appointments`  | Appointment booking  |
| **medical-exam-service** | 8083 | `/api/medical-exams` | Medical examinations |
| **billing-service**      | 8084 | `/api/billing`       | Billing & invoicing  |
| **hr-service**           | 8086 | `/api/hr`            | Human resources      |
| **reports-service**      | 8087 | `/api/reports`       | Reports & analytics  |

### Cấu Hình Axios

**File:** `config/axios.ts`

```typescript
import axios from "axios";
import Cookies from "js-cookie";

const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BE_BASE_URL, // Từ .env.local
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // Gửi cookies tự động
});

// Request interceptor: Thêm token vào header
axiosInstance.interceptors.request.use(
  (config) => {
    const token = Cookies.get("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor: Xử lý errors
axiosInstance.interceptors.response.use(
  (response) => {
    // Trả về response.data.data (backend wrap trong { data: {...} })
    return response;
  },
  (error) => {
    // Xử lý lỗi 401 (unauthorized) - redirect to login
    if (error.response?.status === 401) {
      // Clear auth và redirect
      Cookies.remove("accessToken");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
```

### API Contract

**Xem chi tiết:** [DOCS/api-contracts-complete.md](./DOCS/api-contracts-complete.md)

**Format Response:**

```typescript
// Success Response
{
  data: {
    // Actual data
  },
  message: "Success",
}

// Error Response
{
  error: {
    code: "ERROR_CODE",
    message: "Error message",
  },
}
```

### Mock Mode

Khi `USE_MOCK = true`, MSW (Mock Service Worker) intercept API calls và trả về mock data.

**Cách hoạt động:**

1. MSW worker chạy trong browser
2. Intercept tất cả network requests
3. Trả về mock responses từ handlers
4. Cho phép development mà không cần backend

**File mock handlers:** `mocks/handlers/`

---

## 🧪 Testing

### End-to-End Testing

Dự án sử dụng **Playwright** cho E2E testing.

**Cài đặt:**

```bash
# Playwright đã được cài trong devDependencies
# Chỉ cần chạy:
npx playwright install
```

**Chạy tests:**

```bash
# Chạy tất cả tests
npx playwright test

# Chạy test cụ thể
npx playwright test tests/e2e-appointments.spec.ts

# Chạy với UI mode (dễ debug)
npx playwright test --ui

# Chạy với headed browser (xem browser)
npx playwright test --headed
```

**Vị trí test files:** `tests/`

**Ví dụ test:**

```typescript
// tests/e2e-patients.spec.ts
import { test, expect } from "@playwright/test";

test("should create a new patient", async ({ page }) => {
  // Login
  await page.goto("/login");
  await page.fill('input[name="email"]', "admin@hms.com");
  await page.fill('input[name="password"]', "admin123");
  await page.click('button[type="submit"]');

  // Navigate to patients
  await page.goto("/admin/patients");

  // Click create button
  await page.click('text="Create New"');

  // Fill form
  await page.fill('input[name="fullName"]', "Test Patient");
  await page.fill('input[name="email"]', "test@example.com");

  // Submit
  await page.click('button[type="submit"]');

  // Verify
  await expect(page.locator('text="Test Patient"')).toBeVisible();
});
```

### Test Accounts

**Xem chi tiết:** [DOCS/TEST_ACCOUNTS.md](./DOCS/TEST_ACCOUNTS.md)

**Danh sách nhanh:**

- **Admin**: `admin@hms.com` / `admin123`
- **Doctor**: `doctor@hms.com` / `doctor123`
- **Nurse**: `nurse@hms.com` / `nurse123`
- **Receptionist**: `receptionist@hms.com` / `receptionist123`
- **Patient**: `patient@hms.com` / `patient123`

### Testing Guidelines

1. **Test user flows, không phải implementation details**
2. **Test role-based access** - Đảm bảo mỗi role chỉ truy cập đúng routes
3. **Test form validations** - Kiểm tra validation errors
4. **Test error handling** - Xử lý lỗi đúng cách
5. **Sử dụng test accounts** từ `TEST_ACCOUNTS.md`

---

## 🚢 Triển Khai

### Build cho Production

```bash
# Tạo production build
pnpm build

# Kết quả:
# - .next/ directory chứa optimized code
# - Static files được tối ưu
# - Code được minified và tree-shaken
```

**Build process:**

1. TypeScript compilation
2. Next.js optimization
3. Code minification
4. Asset optimization
5. Static generation (nếu có)

### Environment Variables

Thiết lập trong production environment:

```env
NEXT_PUBLIC_BE_BASE_URL=https://api.yourdomain.com
```

**Lưu ý:**

- `NEXT_PUBLIC_*` variables được embed vào client-side code
- Không đặt sensitive data trong `NEXT_PUBLIC_*` variables
- Sử dụng server-side variables cho secrets

### Deployment Platforms

#### Vercel (Khuyến nghị cho Next.js)

1. **Kết nối repository:**
   - Vào [vercel.com](https://vercel.com)
   - Import Git repository
   - Vercel tự động detect Next.js

2. **Cấu hình:**
   - Set environment variables
   - Build command: `pnpm build`
   - Output directory: `.next`

3. **Deploy:**
   - Tự động deploy khi push to main branch
   - Preview deployments cho pull requests

#### Netlify

1. **Kết nối repository**
2. **Build settings:**
   - Build command: `pnpm build`
   - Publish directory: `.next`

#### Docker

**Tạo Dockerfile:**

```dockerfile
FROM node:20-alpine AS base

# Install dependencies
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN corepack enable pnpm && pnpm install --frozen-lockfile

# Build
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN corepack enable pnpm && pnpm build

# Production
FROM base AS runner
WORKDIR /app
ENV NODE_ENV production

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
ENV PORT 3000

CMD ["node", "server.js"]
```

**Build và run:**

```bash
docker build -t hms-fe .
docker run -p 3000:3000 hms-fe
```

---

## 🔧 Xử Lý Sự Cố

### Các Vấn Đề Thường Gặp

#### 1. Port 3000 Đã Được Sử Dụng

**Lỗi:**

```
Error: listen EADDRINUSE: address already in use :::3000
```

**Giải pháp:**

```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Mac/Linux
lsof -ti:3000 | xargs kill -9

# Hoặc đổi port
PORT=3001 pnpm dev
```

#### 2. Module Not Found Errors

**Lỗi:**

```
Module not found: Can't resolve '@/components/ui/button'
```

**Giải pháp:**

```bash
# Xóa cache và reinstall
rm -rf node_modules .next
pnpm install

# Kiểm tra tsconfig.json paths
# Đảm bảo có:
# "paths": {
#   "@/*": ["./*"]
# }
```

#### 3. TypeScript Errors

**Lỗi:**

```
Type 'X' is not assignable to type 'Y'
```

**Giải pháp:**

```bash
# Restart TypeScript server trong VS Code
# Ctrl+Shift+P → "TypeScript: Restart TS Server"

# Hoặc check tsconfig.json
# Đảm bảo strict mode phù hợp
```

#### 4. Mock Data Không Hoạt Động

**Triệu chứng:**

- API calls không trả về mock data
- Console errors về MSW

**Giải pháp:**

1. **Kiểm tra mock toggle:**

   ```typescript
   // lib/mocks/toggle.ts
   export const USE_MOCK = true; // Phải là true
   ```

2. **Kiểm tra MSW worker:**
   - Đảm bảo `public/mockServiceWorker.js` tồn tại
   - Nếu không, chạy: `npx msw init public/`

3. **Kiểm tra browser console:**
   - Xem có errors không
   - MSW nên log: "[MSW] Mocking enabled"

4. **Reload trang:**
   - Hard refresh: Ctrl+Shift+R (Windows) hoặc Cmd+Shift+R (Mac)

#### 5. Authentication Issues

**Triệu chứng:**

- Không thể login
- Redirect loop
- Token không được lưu

**Giải pháp:**

1. **Clear cookies và localStorage:**

   ```javascript
   // Browser console
   document.cookie.split(";").forEach((c) => {
     document.cookie = c
       .replace(/^ +/, "")
       .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
   });
   localStorage.clear();
   ```

2. **Kiểm tra AuthContext:**
   - Đảm bảo `AuthProvider` wrap app trong `layout.tsx`
   - Check cookies được set đúng

3. **Kiểm tra token:**
   ```javascript
   // Browser console
   console.log(Cookies.get("accessToken"));
   console.log(localStorage.getItem("accessToken"));
   ```

#### 6. Build Errors

**Lỗi:**

```
Error: Cannot find module 'X'
```

**Giải pháp:**

```bash
# Đảm bảo tất cả dependencies được install
pnpm install

# Check package.json
# Đảm bảo dependency tồn tại

# Clear .next và rebuild
rm -rf .next
pnpm build
```

#### 7. Styling Issues

**Triệu chứng:**

- Tailwind classes không hoạt động
- Styles không apply

**Giải pháp:**

1. **Kiểm tra tailwind.config.ts:**

   ```typescript
   content: [
     "./app/**/*.{js,ts,jsx,tsx}",
     "./components/**/*.{js,ts,jsx,tsx}",
   ],
   ```

2. **Kiểm tra globals.css:**
   - Đảm bảo import Tailwind directives:

   ```css
   @tailwind base;
   @tailwind components;
   @tailwind utilities;
   ```

3. **Restart dev server**

### Tìm Kiếm Trợ Giúp

1. **Kiểm tra documentation:**
   - [DOCS/](./DOCS/) - Tài liệu chi tiết
   - [CONTRIBUTING.md](./DOCS/CONTRIBUTING.md) - Hướng dẫn đóng góp

2. **Review code examples:**
   - Xem các module tương tự
   - Check existing implementations

3. **Check feature specifications:**
   - [DOCS/fe-specs/](./DOCS/fe-specs/) - Specs chi tiết

4. **Consult team:**
   - Hỏi team members
   - Check existing issues

---

## 📚 Tài Nguyên Bổ Sung

### Tài Liệu Dự Án

- **[DOCS/README.md](./DOCS/README.md)** - Mục lục tài liệu
- **[DOCS/CONTRIBUTING.md](./DOCS/CONTRIBUTING.md)** - Hướng dẫn đóng góp
- **[DOCS/fe-specs/](./DOCS/fe-specs/)** - Specifications tính năng
- **[DOCS/TEST_ACCOUNTS.md](./DOCS/TEST_ACCOUNTS.md)** - Test accounts

### Tài Nguyên Bên Ngoài

- [Next.js Documentation](https://nextjs.org/docs) - Tài liệu Next.js
- [React Query Documentation](https://tanstack.com/query/latest) - React Query docs
- [shadcn/ui Documentation](https://ui.shadcn.com) - Component library
- [Tailwind CSS Documentation](https://tailwindcss.com/docs) - Tailwind docs
- [TypeScript Documentation](https://www.typescriptlang.org/docs) - TypeScript docs

### Development Guides

- **[DOCS/vibe-code-guide/AI-QUICK-START.md](./DOCS/vibe-code-guide/AI-QUICK-START.md)** - Quick start
- **[DOCS/vibe-code-guide/AI-CODING-STANDARDS.md](./DOCS/vibe-code-guide/AI-CODING-STANDARDS.md)** - Coding standards
- **[DOCS/UI-refactor-guide/](./DOCS/UI-refactor-guide/)** - UI standardization

---

## 📝 Quick Reference

### Files Quan Trọng

| File                       | Mục Đích                  |
| -------------------------- | ------------------------- |
| `app/layout.tsx`           | Root layout với providers |
| `contexts/AuthContext.tsx` | Authentication state      |
| `config/axios.ts`          | HTTP client configuration |
| `middleware.ts`            | Route protection          |
| `lib/mocks/toggle.ts`      | Mock mode toggle          |

### Commands Thường Dùng

```bash
pnpm dev          # Start dev server
pnpm build        # Build for production
pnpm start        # Start production server
pnpm lint         # Run linter
pnpm format       # Format code
```

### Test Accounts

- **Admin**: `admin@hms.com` / `admin123`
- **Doctor**: `doctor@hms.com` / `doctor123`
- **Patient**: `patient@hms.com` / `patient123`

**Xem đầy đủ:** [DOCS/TEST_ACCOUNTS.md](./DOCS/TEST_ACCOUNTS.md)

---

## 🎓 Lộ Trình Học Tập

### Cho Developers Mới

#### Tuần 1: Setup & Cơ Bản

1. **Setup môi trường:**
   - Cài Node.js, pnpm
   - Clone repository
   - Install dependencies
   - Chạy dev server

2. **Đọc tài liệu:**
   - Đọc PROJECT_GUIDE.md này
   - Xem cấu trúc dự án
   - Hiểu tech stack

3. **Khám phá codebase:**
   - Xem các routes
   - Xem components
   - Xem services

4. **Chạy ứng dụng:**
   - Login với test accounts
   - Khám phá các tính năng
   - Xem code tương ứng

#### Tuần 2: Hiểu Tính Năng

1. **Nghiên cứu một module:**
   - Chọn module (ví dụ: Patient Management)
   - Xem service layer
   - Xem React Query hooks
   - Xem components

2. **Hiểu data flow:**
   - Service → Hook → Component
   - API calls
   - State management

3. **Review specifications:**
   - Đọc feature spec
   - So sánh với implementation

#### Tuần 3: Thực Hành

1. **Fix bugs nhỏ:**
   - Tìm bugs trong issues
   - Fix và test
   - Submit PR

2. **Thêm tính năng nhỏ:**
   - Thêm field mới
   - Cải thiện UI
   - Follow coding standards

3. **Code review:**
   - Review code của người khác
   - Học từ feedback

#### Tuần 4: Nâng Cao

1. **Authentication flow:**
   - Hiểu cách login/logout hoạt động
   - Role-based access
   - Token management

2. **API integration:**
   - Hiểu cách gọi API
   - Error handling
   - Mock vs Real API

3. **Advanced patterns:**
   - Optimistic updates
   - Cache management
   - Performance optimization

---

## 📞 Hỗ Trợ

Để được hỗ trợ:

1. **Kiểm tra tài liệu** trong `DOCS/`
2. **Review code examples** trong codebase
3. **Check feature specifications**
4. **Consult với development team**

---

**Cập Nhật Lần Cuối:** Tháng 12, 2024  
**Phiên Bản:** 2.0  
**Được Duy Trì Bởi:** HMS Development Team

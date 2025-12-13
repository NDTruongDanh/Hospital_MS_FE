# Phân Tích Luồng Hoạt Động Doctor - So Sánh với FE Specs

**Ngày phân tích:** December 2024  
**Mục đích:** Kiểm tra xem implementation của doctor flow đã đúng và đủ theo các fe-specs chưa  
**Phạm vi:** Toàn bộ doctor workflow, cross-role interactions, API contract compliance, data model compliance  
**Tài liệu tham khảo:**

- `DOCS/fe-specs/fe-spec-appointment-service.md`
- `DOCS/fe-specs/fe-spec-medical-exam-service.md`
- `DOCS/fe-specs/fe-spec-patient-service.md`
- `DOCS/fe-specs/fe-spec-reports-service.md`
- `DOCS/fe-specs/fe-spec-hr-service.md`
- `DOCS/fe-specs/ROLE-PERMISSIONS-MATRIX.md`
- `DOCS/api-contracts-complete.md`
- `DOCS/data-models-complete.md`

---

## 📖 Cách Sử Dụng Tài Liệu Này

Tài liệu này là **nguồn sự thật (source of truth)** cho:

- ✅ Verification của doctor workflow
- ✅ Code reviews
- ✅ Bug fixes
- ✅ Feature additions
- ✅ Onboarding developers mới

**Cấu trúc:**

1. **Tổng quan** - Quick summary
2. **Chi tiết từng tính năng** - Implementation status
3. **Cross-role interactions** - Tương tác với roles khác
4. **API compliance** - Tuân thủ API contracts
5. **Data model compliance** - Tuân thủ data models
6. **Vấn đề và giải pháp** - Issues và fixes
7. **Migration guide** - Hướng dẫn sửa lỗi

---

## 📋 Tổng Quan

Sau khi đọc kỹ tất cả các fe-specs và kiểm tra code implementation, đây là báo cáo chi tiết về tình trạng luồng hoạt động của doctor.

---

## ✅ Các Tính Năng Đã Implement Đúng

### 1. Appointment Management ✅

#### 1.1 View Own Appointments

- **Route:** `/doctor/appointments` ✅
- **Component:** `AppointmentListShared` với `role="DOCTOR"` ✅
- **Auto-filter:** Sử dụng `user?.employeeId` từ AuthContext ✅
- **Spec yêu cầu:** View own appointments only ✅
- **Status:** **ĐÚNG**

#### 1.2 View Appointment Detail

- **Route:** `/doctor/appointments/[id]` ✅
- **Component:** `AppointmentDetailView` ✅
- **Access control:** Check `user?.employeeId === appointment.doctor.id` ✅
- **Spec yêu cầu:** View own appointments only ✅
- **Status:** **ĐÚNG**

#### 1.3 Edit Appointment (Reschedule)

- **Route:** `/doctor/appointments/[id]/edit` ✅
- **Spec yêu cầu:** Doctor có thể reschedule appointments ✅
- **Status:** **ĐÚNG**

#### 1.4 Cancel Appointment

- **Function:** `useCancelAppointment` ✅
- **UI:** Button trong `AppointmentDetailView` ✅
- **Spec yêu cầu:** Doctor có thể cancel appointments ✅
- **Status:** **ĐÚNG**

#### 1.5 Complete Appointment ⚠️

- **Function:** `useCompleteAppointment` ✅
- **UI:** Button "Mark as Completed" trong `AppointmentDetailView` ✅
- **Permission check:** Chỉ assigned doctor mới thấy button ✅
- **Redirect:** Sau khi complete, redirect đến create exam ✅
- **Spec yêu cầu:**
  - Complete appointment ✅
  - Prompt to create medical exam ✅
- **Status:** **ĐÚNG** (có redirect đến create exam)

### 2. Medical Exam Management ⚠️

#### 2.1 View Own Exams

- **Route:** `/doctor/exams` ✅
- **Component:** `DoctorExamsPage` ✅
- **Issue:** ❌ Sử dụng `localStorage.getItem("doctorId")` với fallback `"emp-101"` thay vì `user?.employeeId`
- **Spec yêu cầu:** Auto-filtered to logged-in doctor's exams
- **Status:** **CẦN SỬA** - Nên dùng `user?.employeeId` từ AuthContext

#### 2.2 Create Medical Exam

- **Route:** `/doctor/exams/new` ✅
- **Route từ appointment:** `/doctor/appointments/[id]/exam` ✅
- **Component:** `MedicalExamForm` ✅
- **Appointment pre-fill:** Có fetch appointment từ `appointmentId` query param ✅
- **Prescription prompt:** Có dialog "Add Prescription?" sau khi tạo ✅
- **Issue:** ❌ Redirect sau khi tạo exam đi đến `/admin/exams/${id}` thay vì `/doctor/exams/${id}`
- **Spec yêu cầu:**
  - Create exam from completed appointment ✅
  - Prompt to add prescription ✅
  - Redirect to exam detail ✅
- **Status:** **CẦN SỬA** - Redirect route không đúng

#### 2.3 View Exam Detail

- **Route:** `/doctor/exams/[id]` ✅
- **Component:** `DoctorMedicalExamDetailPage` ✅
- **Permission check:** Check `medicalExam.doctor?.id === user?.employeeId` ✅
- **Edit button:** Hiển thị nếu creator và < 24h ✅
- **Add prescription button:** Hiển thị nếu creator và chưa có prescription ✅
- **Spec yêu cầu:** View own exams only ✅
- **Status:** **ĐÚNG**

#### 2.4 Edit Exam (Within 24 Hours)

- **Route:** `/doctor/exams/[id]/edit` ✅
- **Component:** `EditDoctorMedicalExamPage` ✅
- **Permission check:** Check creator và status PENDING ✅
- **24-hour check:** Có check nhưng dựa vào status PENDING thay vì tính toán 24h từ examDate
- **Issue:** ❌ **TODO comment** - Update mutation chưa được implement (dòng 97-98)
- **Spec yêu cầu:**
  - Edit within 24 hours ✅ (check status)
  - Update exam ✅ (chưa implement)
- **Status:** **CHƯA HOÀN THÀNH** - Cần implement update mutation

#### 2.5 Create Prescription

- **Route:** `/doctor/exams/[id]/prescription` ✅
- **Component:** `PrescriptionForm` ✅
- **Permission check:** Check creator ✅
- **Duplicate check:** Check nếu đã có prescription ✅
- **Spec yêu cầu:** Create prescription for exam ✅
- **Status:** **ĐÚNG**

### 3. Patient Management ⚠️

#### 3.1 View Patients

- **Route:** `/doctor/patients` ✅
- **Component:** `DoctorPatientsPage` ✅
- **Issue:** ❌ Hiển thị **TẤT CẢ** patients thay vì chỉ patients có appointments với doctor
- **Code:** Có TODO comment (dòng 96-97) về việc filter by doctorId
- **Spec yêu cầu:**
  - ROLE-PERMISSIONS-MATRIX: "View all patients (for medical context)" ✅
  - fe-spec-patient-service: Không có filter đặc biệt cho doctor
- **Status:** **ĐÚNG** (theo spec, doctor có thể xem tất cả patients)

#### 3.2 View Patient Detail

- **Route:** `/doctor/patients/[id]` ✅
- **Spec yêu cầu:** View patient detail ✅
- **Status:** **ĐÚNG**

#### 3.3 View Patient History

- **Route:** `/doctor/patients/[id]/history` ✅
- **Spec yêu cầu:** View patient history ✅
- **Status:** **ĐÚNG**

### 4. Reports ⚠️

#### 4.1 View Own Appointment Statistics

- **Route:** `/doctor/reports/appointments` ✅
- **Component:** `DoctorAppointmentReportsPage` ✅
- **Issue:** ❌ Sử dụng `localStorage.getItem("doctorId")` với fallback `"emp-101"` thay vì `user?.employeeId`
- **Spec yêu cầu:**
  - View own appointment stats only ✅
  - Auto-filter by doctorId ✅
- **Status:** **CẦN SỬA** - Nên dùng `user?.employeeId`

### 5. Schedules ⚠️

#### 5.1 View Own Schedules

- **Route:** `/doctor/schedules` ✅
- **Component:** `MySchedulesPage` ✅
- **Issue:** ❌ Sử dụng `localStorage.getItem("doctorId")` thay vì `user?.employeeId`
- **Spec yêu cầu:** View own schedules only ✅
- **Status:** **CẦN SỬA** - Nên dùng `user?.employeeId`

---

## ❌ Các Vấn Đề Tìm Thấy

### Vấn Đề 1: Sử Dụng localStorage Thay Vì AuthContext

**Mức độ:** 🔴 **QUAN TRỌNG**

**Files bị ảnh hưởng:**

1. `app/doctor/exams/page.tsx` (dòng 39-42)
2. `app/doctor/reports/appointments/page.tsx` (dòng 125-129)
3. `app/doctor/schedules/page.tsx` (dòng 84-88)

**Vấn đề:**

```typescript
// ❌ SAI - Sử dụng localStorage với fallback hardcode
const [doctorId, setDoctorId] = useState<string | null>(() => {
  const stored =
    typeof window !== "undefined" ? localStorage.getItem("doctorId") : null;
  return stored || "emp-101"; // Hardcode fallback
});
```

**Nên sửa thành:**

```typescript
// ✅ ĐÚNG - Sử dụng AuthContext
const { user } = useAuth();
const doctorId = user?.employeeId; // Tự động từ AuthContext
```

**Lý do:**

- localStorage có thể không sync với AuthContext
- Hardcode fallback "emp-101" không đúng với user đang login
- AuthContext là source of truth cho user info

---

### Vấn Đề 2: Route Redirect Không Đúng

**Mức độ:** 🟡 **TRUNG BÌNH**

**Files bị ảnh hưởng:**

1. **`app/doctor/exams/new/page.tsx`** (dòng 39)

   ```typescript
   // ❌ SAI
   router.push(`/admin/exams/${createdExam.id}`);

   // ✅ ĐÚNG
   router.push(`/doctor/exams/${createdExam.id}`);
   ```

2. **`app/doctor/appointments/[id]/exam/page.tsx`** (dòng 39)

   ```typescript
   // ❌ SAI
   router.push(`/admin/exams/${createdExam.id}`);

   // ✅ ĐÚNG
   router.push(`/doctor/exams/${createdExam.id}`);
   ```

3. **`app/doctor/exams/page.tsx`** (dòng 199)

   ```typescript
   // ❌ SAI
   <Link href={`/admin/exams/${exam.id}`}>Xem</Link>

   // ✅ ĐÚNG
   <Link href={`/doctor/exams/${exam.id}`}>Xem</Link>
   ```

**Lý do:**

- Doctor nên ở trong doctor portal (`/doctor/*`)
- Redirect đến `/admin/*` sẽ làm doctor rời khỏi doctor context
- Spec yêu cầu doctor routes riêng biệt

---

### Vấn Đề 3: Edit Exam Mutation Chưa Implement

**Mức độ:** 🟡 **TRUNG BÌNH**

**File:** `app/doctor/exams/[id]/edit/page.tsx` (dòng 97-98)

**Vấn đề:**

```typescript
// ❌ TODO - Chưa implement
// TODO: Implement updateMedicalExam mutation
toast.error("Update functionality not implemented yet");
```

**Spec yêu cầu:**

- Doctor có thể edit exam trong 24 giờ ✅ (check có)
- Update exam mutation ✅ (chưa implement)

**Cần làm:**

1. Implement `useUpdateMedicalExam` hook
2. Implement `update` function trong `medical-exam.service.ts`
3. Connect với form submit handler

---

### Vấn Đề 4: Exam List Link Đến Admin Route

**Mức độ:** 🟡 **TRUNG BÌNH**

**File:** `app/doctor/exams/page.tsx` (dòng 199)

**Vấn đề:**

```typescript
<Link href={`/admin/exams/${exam.id}`}>Xem</Link>
```

**Nên sửa thành:**

```typescript
<Link href={`/doctor/exams/${exam.id}`}>Xem</Link>
```

---

### Vấn Đề 5: 24-Hour Edit Window Check

**Mức độ:** 🟢 **NHỎ**

**File:** `app/doctor/exams/[id]/edit/page.tsx` (dòng 26-30)

**Hiện tại:**

```typescript
const isEditable =
  medicalExam &&
  user &&
  medicalExam.doctor?.id === user.employeeId &&
  medicalExam.status === "PENDING"; // Dựa vào status
```

**Spec yêu cầu:**

- Check 24 hours từ examDate
- Show countdown timer

**Hiện tại chỉ check status PENDING, không check thời gian 24h thực tế.**

**Nên bổ sung:**

```typescript
const examDate = new Date(medicalExam.examDate);
const now = new Date();
const hoursSinceExam = (now.getTime() - examDate.getTime()) / (1000 * 60 * 60);
const isEditable = isCreator && hoursSinceExam < 24;
```

---

## 📊 Bảng So Sánh Chi Tiết

### Appointment Service

| Tính Năng               | Spec Yêu Cầu      | Implementation               | Status  |
| ----------------------- | ----------------- | ---------------------------- | ------- |
| View own appointments   | ✅ Own only       | ✅ Auto-filter by employeeId | ✅ ĐÚNG |
| Create appointment      | ✅                | ✅                           | ✅ ĐÚNG |
| Update appointment      | ✅                | ✅                           | ✅ ĐÚNG |
| Cancel appointment      | ✅                | ✅                           | ✅ ĐÚNG |
| Complete appointment    | ✅ Assigned only  | ✅ Permission check          | ✅ ĐÚNG |
| Redirect to create exam | ✅ After complete | ✅                           | ✅ ĐÚNG |

### Medical Exam Service

| Tính Năng           | Spec Yêu Cầu                  | Implementation                      | Status             |
| ------------------- | ----------------------------- | ----------------------------------- | ------------------ |
| View own exams      | ✅ Auto-filter                | ⚠️ localStorage fallback            | ⚠️ CẦN SỬA         |
| Create exam         | ✅ From completed appointment | ✅                                  | ✅ ĐÚNG            |
| View exam detail    | ✅ Own only                   | ✅ Permission check                 | ✅ ĐÚNG            |
| Edit exam (< 24h)   | ✅ Within 24h                 | ⚠️ Check status only, mutation TODO | ⚠️ CHƯA HOÀN THÀNH |
| Create prescription | ✅                            | ✅                                  | ✅ ĐÚNG            |
| Redirect routes     | ✅ Doctor routes              | ❌ Redirect to /admin/\*            | ❌ CẦN SỬA         |

### Patient Service

| Tính Năng            | Spec Yêu Cầu                 | Implementation | Status  |
| -------------------- | ---------------------------- | -------------- | ------- |
| View patients        | ✅ All (for medical context) | ✅             | ✅ ĐÚNG |
| View patient detail  | ✅                           | ✅             | ✅ ĐÚNG |
| View patient history | ✅                           | ✅             | ✅ ĐÚNG |

### Reports Service

| Tính Năng                  | Spec Yêu Cầu   | Implementation           | Status     |
| -------------------------- | -------------- | ------------------------ | ---------- |
| View own appointment stats | ✅ Auto-filter | ⚠️ localStorage fallback | ⚠️ CẦN SỬA |

### HR Service (Schedules)

| Tính Năng          | Spec Yêu Cầu | Implementation           | Status     |
| ------------------ | ------------ | ------------------------ | ---------- |
| View own schedules | ✅ Own only  | ⚠️ localStorage fallback | ⚠️ CẦN SỬA |

---

## 🔧 Các Sửa Đổi Cần Thiết

### Priority 1: Sửa localStorage → AuthContext

**Files cần sửa:**

1. **`app/doctor/exams/page.tsx`**

   ```typescript
   // Thay đổi từ:
   const [doctorId, setDoctorId] = useState<string | null>(() => {
     const stored =
       typeof window !== "undefined" ? localStorage.getItem("doctorId") : null;
     return stored || "emp-101";
   });

   // Thành:
   const { user } = useAuth();
   const doctorId = user?.employeeId;

   // Và update query:
   const { data, isLoading } = useMedicalExamList({
     doctorId: doctorId || undefined, // Thay vì doctorId || undefined
     // ...
   });
   ```

2. **`app/doctor/reports/appointments/page.tsx`**

   ```typescript
   // Tương tự, thay localStorage bằng user?.employeeId
   const { user } = useAuth();
   const doctorId = user?.employeeId;
   ```

3. **`app/doctor/schedules/page.tsx`**
   ```typescript
   // Tương tự
   const { user } = useAuth();
   const doctorId = user?.employeeId;
   ```

### Priority 2: Sửa Route Redirects

1. **`app/doctor/exams/new/page.tsx`** (dòng 39)

   ```typescript
   // Thay:
   router.push(`/admin/exams/${createdExam.id}`);
   // Thành:
   router.push(`/doctor/exams/${createdExam.id}`);
   ```

2. **`app/doctor/appointments/[id]/exam/page.tsx`** (dòng 39)

   ```typescript
   // Thay:
   router.push(`/admin/exams/${createdExam.id}`);
   // Thành:
   router.push(`/doctor/exams/${createdExam.id}`);
   ```

3. **`app/doctor/exams/page.tsx`** (dòng 199)
   ```typescript
   // Thay:
   <Link href={`/admin/exams/${exam.id}`}>Xem</Link>
   // Thành:
   <Link href={`/doctor/exams/${exam.id}`}>Xem</Link>
   ```

### Priority 3: Implement Update Exam Mutation

1. **`services/medical-exam.service.ts`**
   - Thêm `update` function nếu chưa có

2. **`hooks/queries/useMedicalExam.ts`**
   - Thêm `useUpdateMedicalExam` hook

3. **`app/doctor/exams/[id]/edit/page.tsx`**
   - Remove TODO comment
   - Implement update mutation call

### Priority 4: Cải Thiện 24-Hour Check

**`app/doctor/exams/[id]/edit/page.tsx`**

```typescript
// Thêm tính toán 24h thực tế
const examDate = new Date(medicalExam.examDate);
const now = new Date();
const hoursSinceExam = (now.getTime() - examDate.getTime()) / (1000 * 60 * 60);
const isEditable =
  isCreator && hoursSinceExam < 24 && medicalExam.status === "PENDING";
```

---

## ✅ Checklist Hoàn Thành

### Appointment Flow

- [x] View own appointments (auto-filtered)
- [x] View appointment detail
- [x] Edit/reschedule appointment
- [x] Cancel appointment
- [x] Complete appointment (assigned only)
- [x] Redirect to create exam after complete
- [x] Permission checks đúng

### Medical Exam Flow

- [x] View own exams list
- [x] Create exam from completed appointment
- [x] View exam detail
- [x] Permission checks (creator only)
- [x] Create prescription
- [ ] **Edit exam mutation** (TODO)
- [ ] **24-hour time check** (chỉ check status)
- [ ] **Route redirects** (đang redirect đến /admin/\*)

### Patient Flow

- [x] View patients (all - đúng theo spec)
- [x] View patient detail
- [x] View patient history

### Reports Flow

- [x] View own appointment statistics
- [ ] **doctorId source** (đang dùng localStorage)

### Schedules Flow

- [x] View own schedules
- [ ] **doctorId source** (đang dùng localStorage)

---

## 📝 Tóm Tắt

### Điểm Mạnh ✅

1. **Appointment flow hoàn chỉnh** - Tất cả chức năng đã implement đúng
2. **Permission checks tốt** - Có check creator, assigned doctor
3. **UI/UX đúng spec** - Có prompts, dialogs, redirects
4. **Medical exam creation flow** - Đầy đủ từ appointment → exam → prescription

### Điểm Yếu ⚠️

1. **localStorage usage** - 3 files đang dùng localStorage thay vì AuthContext
2. **Route redirects** - 3 chỗ redirect đến `/admin/*` thay vì `/doctor/*`
3. **Update mutation** - Chưa implement (có TODO)
4. **24-hour check** - Chỉ check status, chưa tính toán thời gian thực

### Đánh Giá Tổng Thể

**Mức độ hoàn thành:** ~85%

- **Appointment Service:** 100% ✅
- **Medical Exam Service:** 80% ⚠️ (thiếu update mutation, route issues)
- **Patient Service:** 100% ✅
- **Reports Service:** 90% ⚠️ (localStorage issue)
- **Schedules:** 90% ⚠️ (localStorage issue)

---

## 🎯 Khuyến Nghị

### Immediate Actions (Ưu tiên cao)

1. ✅ Sửa tất cả localStorage → AuthContext (3 files)
2. ✅ Sửa route redirects (3 files)
3. ✅ Sửa exam list link (1 file)

### Short-term (Ưu tiên trung bình)

4. ⚠️ Implement update exam mutation
5. ⚠️ Cải thiện 24-hour check với tính toán thời gian thực

### Nice to Have

6. 💡 Thêm countdown timer cho edit window
7. 💡 Thêm validation messages rõ ràng hơn

---

---

## 🔄 Phân Tích Tương Tác Giữa Doctor và Các Role Khác

### 1. Doctor ↔ Admin

#### 1.1 Appointments

**Spec yêu cầu:**

- **Admin:** View all appointments ✅
- **Doctor:** View own appointments only ✅

**Implementation:**

- `AppointmentListShared` component được dùng chung
- Admin: `role="ADMIN"` → không filter by doctorId ✅
- Doctor: `role="DOCTOR"` → auto-filter by `user?.employeeId` ✅
- **Status:** ✅ **ĐÚNG**

**Cross-access:**

- Admin có thể xem appointment detail của doctor qua `/admin/appointments/{id}` ✅
- Doctor chỉ xem own appointments qua `/doctor/appointments/{id}` với permission check ✅
- **Status:** ✅ **ĐÚNG**

#### 1.2 Medical Exams

**Spec yêu cầu:**

- **Admin:** View all exams ✅
- **Doctor:** View own exams only ✅

**Implementation:**

- Admin: `/admin/exams` → xem tất cả exams ✅
- Doctor: `/doctor/exams` → filter by doctorId (nhưng đang dùng localStorage) ⚠️
- Admin có thể xem exam detail của doctor qua `/admin/exams/{id}` ✅
- Doctor chỉ xem own exams qua `/doctor/exams/{id}` với permission check ✅
- **Status:** ⚠️ **CẦN SỬA** - localStorage issue

#### 1.3 Shared Components

**Components được share:**

- `AppointmentDetailView` - Dùng chung cho admin và doctor ✅
- `MedicalExamDetailView` - Dùng chung cho admin, doctor, nurse ✅
- `AppointmentListShared` - Dùng chung với role prop ✅

**Permission checks trong shared components:**

- `AppointmentDetailView`: Check `user?.role === "DOCTOR" && user?.employeeId === appointment.doctor.id` cho complete button ✅
- `MedicalExamDetailView`: Check `userRole === "DOCTOR"` cho edit/prescription buttons ✅
- **Status:** ✅ **ĐÚNG**

### 2. Doctor ↔ Nurse

#### 2.1 Appointments

**Spec yêu cầu:**

- **Nurse:** View all appointments ✅
- **Doctor:** View own appointments only ✅

**Implementation:**

- Nurse: `/admin/appointments` với `role="NURSE"` → xem tất cả ✅
- Doctor: `/doctor/appointments` với `role="DOCTOR"` → auto-filter own ✅
- Nurse có thể edit/cancel appointments ✅
- Doctor có thể edit/cancel own appointments ✅
- **Status:** ✅ **ĐÚNG**

#### 2.2 Medical Exams

**Spec yêu cầu:**

- **Nurse:** View exams (read-only) ✅
- **Doctor:** View own exams, create/edit ✅

**Implementation:**

- Nurse: `/admin/exams` → xem tất cả exams (read-only) ✅
- Doctor: `/doctor/exams` → xem own exams ✅
- Nurse không thể create/edit exams ✅
- Doctor có thể create/edit own exams ✅
- **Status:** ✅ **ĐÚNG**

### 3. Doctor ↔ Receptionist

#### 3.1 Appointments

**Spec yêu cầu:**

- **Receptionist:** Create appointments for any patient/doctor ✅
- **Doctor:** Create appointments ✅

**Implementation:**

- Receptionist: `/admin/appointments/new` → có thể chọn bất kỳ doctor ✅
- Doctor: `/admin/appointments/new` hoặc `/doctor/appointments/new` (nếu có) ✅
- Receptionist có thể cancel appointments ✅
- Doctor có thể cancel own appointments ✅
- **Status:** ✅ **ĐÚNG**

**Cross-interaction:**

- Receptionist tạo appointment cho doctor → Doctor thấy trong own appointments ✅
- Doctor tạo appointment → Receptionist thấy trong admin list ✅
- **Status:** ✅ **ĐÚNG**

#### 3.2 Medical Exams

**Spec yêu cầu:**

- **Receptionist:** ❌ No access to medical exams
- **Doctor:** Full access to own exams ✅

**Implementation:**

- Receptionist không có route đến exams ✅
- Doctor có full access ✅
- **Status:** ✅ **ĐÚNG**

### 4. Doctor ↔ Patient

#### 4.1 Appointments

**Spec yêu cầu:**

- **Patient:** Book own appointments, view own appointments ✅
- **Doctor:** View own appointments, complete assigned appointments ✅

**Implementation:**

- Patient: `/patient/appointments/new` → book với doctor ✅
- Doctor: `/doctor/appointments` → xem appointments được assign ✅
- Patient có thể cancel own appointments ✅
- Doctor có thể complete assigned appointments ✅
- **Status:** ✅ **ĐÚNG**

**Cross-interaction:**

- Patient book appointment với doctor → Doctor thấy trong own appointments ✅
- Doctor complete appointment → Patient thấy status COMPLETED ✅
- **Status:** ✅ **ĐÚNG**

#### 4.2 Medical Exams

**Spec yêu cầu:**

- **Patient:** View own medical exams (read-only) ✅
- **Doctor:** Create exams for assigned appointments ✅

**Implementation:**

- Patient: `/patient/medical-records` → xem own exams ✅
- Doctor: `/doctor/exams/new` → tạo exam từ completed appointment ✅
- Patient xem exam detail (read-only) ✅
- Doctor tạo exam → Patient có thể xem sau ✅
- **Status:** ✅ **ĐÚNG**

**Flow:**

1. Patient books appointment ✅
2. Doctor completes appointment ✅
3. Doctor creates exam ✅
4. Patient views exam in medical records ✅

- **Status:** ✅ **ĐÚNG**

### 5. Cross-Role Data Access Analysis

#### 5.1 Appointment Access Patterns

| Scenario                                    | Admin                | Doctor             | Nurse                | Receptionist         | Patient            |
| ------------------------------------------- | -------------------- | ------------------ | -------------------- | -------------------- | ------------------ |
| Admin creates appointment for Doctor        | ✅ See in admin list | ✅ See in own list | ✅ See in admin list | ✅ See in admin list | ✅ See if own      |
| Receptionist creates appointment for Doctor | ✅ See in admin list | ✅ See in own list | ✅ See in admin list | ✅ See in admin list | ✅ See if own      |
| Doctor creates appointment                  | ✅ See in admin list | ✅ See in own list | ✅ See in admin list | ✅ See in admin list | ✅ See if own      |
| Patient books appointment with Doctor       | ✅ See in admin list | ✅ See in own list | ✅ See in admin list | ✅ See in admin list | ✅ See in own list |

**Status:** ✅ **ĐÚNG** - Tất cả cross-role access đều đúng

#### 5.2 Medical Exam Access Patterns

| Scenario                  | Admin                | Doctor (Creator)         | Doctor (Other) | Nurse                | Patient            |
| ------------------------- | -------------------- | ------------------------ | -------------- | -------------------- | ------------------ |
| Doctor creates exam       | ✅ See in admin list | ✅ See in own list       | ❌ Not see     | ✅ See in admin list | ✅ See if own      |
| Admin views doctor's exam | ✅ Can view          | ✅ Can view (if creator) | ❌ Cannot view | ✅ Can view          | ✅ Can view if own |

**Status:** ✅ **ĐÚNG** - Permission checks đúng

#### 5.3 Potential Issues

**Issue 1: Admin có thể access doctor routes không?**

- Admin có thể truy cập `/admin/appointments/{id}` của doctor appointment ✅
- Admin không nên truy cập `/doctor/*` routes (có RoleGuard) ✅
- **Status:** ✅ **ĐÚNG**

**Issue 2: Doctor có thể access admin routes không?**

- Spec cho phép: Doctor có thể access `/admin/appointments`, `/admin/exams`, `/admin/patients` ✅
- Implementation: `app/admin/layout.tsx` có RoleGuard cho `["ADMIN", "DOCTOR", "NURSE", "RECEPTIONIST"]` ✅
- **Status:** ✅ **ĐÚNG**

**Issue 3: Shared components có check permissions đúng không?**

- `AppointmentDetailView`: Check role và employeeId cho complete button ✅
- `MedicalExamDetailView`: Check role cho edit/prescription buttons ✅
- **Status:** ✅ **ĐÚNG**

---

## 🎯 Tổng Kết Tương Tác Cross-Role

### ✅ Điểm Mạnh

1. **Auto-filtering đúng:**
   - Doctor appointments tự động filter by employeeId ✅
   - Patient appointments tự động filter by patientId ✅
   - Admin/Nurse xem tất cả ✅

2. **Permission checks tốt:**
   - Complete appointment: Chỉ assigned doctor ✅
   - Edit exam: Chỉ creator doctor ✅
   - Create prescription: Chỉ creator doctor ✅

3. **Shared components hoạt động đúng:**
   - `AppointmentListShared` với role prop ✅
   - `AppointmentDetailView` với permission checks ✅
   - `MedicalExamDetailView` với role-based actions ✅

4. **Cross-role data flow:**
   - Receptionist tạo appointment → Doctor thấy ✅
   - Doctor complete appointment → Patient thấy status ✅
   - Doctor tạo exam → Patient xem được ✅

### ⚠️ Vấn Đề Tìm Thấy

1. **localStorage usage** (đã nêu ở trên)
2. **Route redirects** (đã nêu ở trên)
3. **Update mutation** (đã nêu ở trên)

### 🔍 Không Có Vấn Đề Về Cross-Role Access

- ✅ Admin và Doctor có thể xem cùng appointments (với filters khác nhau)
- ✅ Doctor chỉ xem own data khi ở doctor routes
- ✅ Permission checks ngăn unauthorized access
- ✅ Shared components hoạt động đúng với mọi role

---

---

## 🔍 Kiểm Tra Tuân Thủ API Contracts & Data Models

### 1. Complete Appointment API

**API Contract (`api-contracts-complete.md`):**

- Endpoint: `PATCH /api/appointments/{id}/complete`
- Access: DOCTOR only
- Request: **No body required**
- Backend tự động lấy doctorId từ `X-User-ID` header (từ API Gateway)

**Implementation:**

- ✅ Service function: `complete(id, currentUserId?, currentUserRole?)`
- ✅ Pass `currentUserId` và `currentUserRole` - **Chỉ dùng cho mock mode**
- ✅ Real API: Không cần pass, backend lấy từ header
- ✅ Permission check trong mock mode đúng
- **Status:** ✅ **ĐÚNG** - Không vi phạm API contract

### 2. List Medical Exams API

**API Contract (`api-contracts-complete.md` dòng 2489-2496):**

- Endpoint: `GET /api/exams`
- Query param: `doctorId` (string, optional): Filter by doctor
- **Backend behavior:**
  - Nếu user role = DOCTOR, backend tự động filter by `X-User-ID` header
  - Query param `doctorId` là optional và chỉ để filter thêm (cho ADMIN)

**Implementation:**

- ⚠️ Frontend pass `doctorId` từ localStorage với fallback hardcode
- ⚠️ Nếu localStorage có giá trị sai hoặc fallback "emp-101" không đúng với user đang login → có thể filter sai
- **Vấn đề:** localStorage có thể không sync với user đang login
- **Status:** ⚠️ **CẦN SỬA** - Nên dùng `user?.employeeId` từ AuthContext

**Lý do quan trọng:**

- Backend sẽ validate `doctorId` query param với `X-User-ID` header
- Nếu không match → có thể trả về empty list hoặc error
- localStorage có thể stale hoặc không đúng với user hiện tại

### 3. List Appointments API

**API Contract (`api-contracts-complete.md` dòng 2105):**

- Endpoint: `GET /api/appointments`
- Query param: `doctorId` (string, optional): Filter by doctor
- **Backend behavior:**
  - Nếu user role = DOCTOR, backend tự động filter by `X-User-ID` header
  - Query param `doctorId` là optional

**Implementation:**

- ✅ `AppointmentListShared` component tự động set `effectiveDoctorId = user?.employeeId` khi role = "DOCTOR"
- ✅ Không dùng localStorage
- **Status:** ✅ **ĐÚNG**

### 4. List Schedules API

**API Contract (`api-contracts-complete.md` dòng 1806-1874):**

- Endpoint: `GET /api/hr/schedules/doctors`
- Query param: `employeeId` (string, required): Employee ID
- **Backend behavior:** Filter by employeeId

**Implementation:**

- ⚠️ Frontend pass `doctorId` từ localStorage
- ⚠️ API contract yêu cầu `employeeId`, frontend đang pass `doctorId`
- **Status:** ⚠️ **CẦN KIỂM TRA** - Cần verify parameter name

### 5. Reports API

**API Contract (`api-contracts-complete.md` dòng 3252):**

- Endpoint: `GET /api/reports/appointments`
- Query param: `doctorId` (string, optional): Filter by doctor (DOCTOR can only see own)
- **Backend behavior:**
  - Nếu user role = DOCTOR, backend tự động filter by `X-User-ID` header
  - Query param `doctorId` là optional

**Implementation:**

- ⚠️ Frontend pass `doctorId` từ localStorage
- **Status:** ⚠️ **CẦN SỬA** - Nên dùng `user?.employeeId`

### 6. Data Model Compliance

**MedicalExam Entity (`data-models-complete.md` dòng 1051):**

- Field: `doctorId` (denormalized from appointment)
- **Purpose:** Query performance, filtering

**Implementation:**

- ✅ Service functions sử dụng `doctorId` đúng
- ✅ Filter logic đúng
- **Status:** ✅ **ĐÚNG**

**Appointment Entity (`data-models-complete.md` dòng 913):**

- Field: `doctorId` (FK to employees.id where role=DOCTOR)
- **Purpose:** Link appointment to doctor

**Implementation:**

- ✅ Service functions sử dụng `doctorId` đúng
- ✅ Permission checks dựa trên `appointment.doctor.id`
- **Status:** ✅ **ĐÚNG**

---

## ⚠️ Vấn Đề Về API Contract Compliance

### Vấn Đề: localStorage doctorId Có Thể Không Đúng Với User Đang Login

**Mức độ:** 🔴 **QUAN TRỌNG**

**Nguyên nhân:**

1. Backend tự động filter dựa trên `X-User-ID` header từ API Gateway
2. Frontend pass `doctorId` trong query param chỉ là optional filter
3. Nếu frontend pass `doctorId` sai (từ localStorage với fallback hardcode) → có thể:
   - Backend validate và trả về empty list (nếu doctorId không match với X-User-ID)
   - Hoặc backend ignore query param và dùng header (tùy implementation)

**Impact:**

- User login với doctorId = "emp-102" nhưng localStorage có "emp-101" → có thể filter sai
- Hardcode fallback "emp-101" → luôn filter cho doctor cố định, không đúng với user đang login

**Solution:**

- Luôn dùng `user?.employeeId` từ AuthContext
- Không dùng localStorage cho doctorId
- Backend sẽ tự động filter đúng dựa trên header

---

## ✅ Kết Luận Về API Contract & Data Model Compliance

### Tuân Thủ ✅

1. **Complete Appointment API** - Đúng contract (no body, backend lấy từ header)
2. **Create Medical Exam API** - Đúng contract (appointmentId required, must be COMPLETED)
3. **Data Models** - Đúng structure (doctorId, employeeId fields)
4. **Permission Checks** - Đúng logic (check assigned doctor, creator)

### Cần Cải Thiện ⚠️

1. **doctorId source** - localStorage thay vì AuthContext (3 files)
2. **Query params** - Có thể pass sai doctorId từ localStorage

### Không Vi Phạm

- ✅ Không vi phạm API contract structure
- ✅ Không vi phạm data model schema
- ✅ Không vi phạm validation rules
- ✅ Không vi phạm error handling

---

**Kết luận:** Luồng hoạt động của doctor đã được implement khá đầy đủ và đúng theo spec, bao gồm cả tương tác với các role khác. Implementation **tuân thủ API contracts và data models**, nhưng có vấn đề về **source of truth cho doctorId** (localStorage vs AuthContext) có thể dẫn đến filter không đúng.

Các vấn đề chính:

1. **Source of truth cho doctorId** (localStorage vs AuthContext) - 3 files - 🔴 QUAN TRỌNG
2. **Route consistency** (admin vs doctor routes) - 3 files - 🟡 TRUNG BÌNH
3. **Update exam functionality** (chưa hoàn thành) - 1 file - 🟡 TRUNG BÌNH

Sau khi sửa các vấn đề trên, doctor flow sẽ hoàn toàn đúng và đủ theo spec, tuân thủ API contracts và data models, và tương tác với các role khác cũng đã được implement đúng.

---

## 📝 Migration Guide - Hướng Dẫn Sửa Lỗi Chi Tiết

### Fix 1: Thay localStorage bằng AuthContext

#### File 1: `app/doctor/exams/page.tsx`

**Before (❌ SAI):**

```typescript
export default function DoctorExamsPage() {
  const [doctorId, setDoctorId] = useState<string | null>(() => {
    const stored =
      typeof window !== "undefined" ? localStorage.getItem("doctorId") : null;
    return stored || "emp-101"; // ❌ Hardcode fallback
  });

  const { data, isLoading } = useMedicalExamList({
    doctorId: doctorId || undefined,
    // ...
  });
}
```

**After (✅ ĐÚNG):**

```typescript
import { useAuth } from "@/contexts/AuthContext";

export default function DoctorExamsPage() {
  const { user } = useAuth();
  const doctorId = user?.employeeId; // ✅ Từ AuthContext

  const { data, isLoading } = useMedicalExamList({
    doctorId: doctorId || undefined, // ✅ Tự động sync với user đang login
    // ...
  });
}
```

**Verification Steps:**

1. Login với doctor account (employeeId = "emp-102")
2. Navigate to `/doctor/exams`
3. Check network tab: `GET /api/exams?doctorId=emp-102` (không phải "emp-101")
4. Verify list chỉ hiển thị exams của doctor đang login

---

#### File 2: `app/doctor/reports/appointments/page.tsx`

**Before (❌ SAI):**

```typescript
const [doctorId, setDoctorId] = useState<string | undefined>(() => {
  const stored =
    typeof window !== "undefined" ? localStorage.getItem("doctorId") : null;
  return stored || "emp-101"; // ❌ Hardcode fallback
});

const { data, isLoading, refetch } = useAppointmentStats({
  startDate: startDate ? format(startDate, "yyyy-MM-dd") : "",
  endDate: endDate ? format(endDate, "yyyy-MM-dd") : "",
  doctorId, // ❌ Có thể sai
});
```

**After (✅ ĐÚNG):**

```typescript
import { useAuth } from "@/contexts/AuthContext";

export default function DoctorAppointmentReportsPage() {
  const { user } = useAuth();
  const doctorId = user?.employeeId; // ✅ Từ AuthContext

  const { data, isLoading, refetch } = useAppointmentStats({
    startDate: startDate ? format(startDate, "yyyy-MM-dd") : "",
    endDate: endDate ? format(endDate, "yyyy-MM-dd") : "",
    doctorId: doctorId || undefined, // ✅ Đúng với user đang login
  });
}
```

**Verification Steps:**

1. Login với doctor account
2. Navigate to `/doctor/reports/appointments`
3. Check network tab: `GET /api/reports/appointments?doctorId={correctId}`
4. Verify stats chỉ hiển thị appointments của doctor đang login

---

#### File 3: `app/doctor/schedules/page.tsx`

**Before (❌ SAI):**

```typescript
const [doctorId, setDoctorId] = useState<string | undefined>(() => {
  const stored =
    typeof window !== "undefined" ? localStorage.getItem("doctorId") : null;
  return stored || undefined;
});

const { data, isLoading, refetch } = useDoctorSchedules({
  startDate: dateRange ? format(dateRange.from, "yyyy-MM-dd") : undefined,
  endDate: dateRange ? format(dateRange.to, "yyyy-MM-dd") : undefined,
  status: status === "ALL" ? undefined : status,
  doctorId, // ❌ Có thể undefined hoặc sai
});
```

**After (✅ ĐÚNG):**

```typescript
import { useAuth } from "@/contexts/AuthContext";

export default function MySchedulesPage() {
  const { user } = useAuth();
  const doctorId = user?.employeeId; // ✅ Từ AuthContext

  const { data, isLoading, refetch } = useDoctorSchedules({
    startDate: dateRange ? format(dateRange.from, "yyyy-MM-dd") : undefined,
    endDate: dateRange ? format(dateRange.to, "yyyy-MM-dd") : undefined,
    status: status === "ALL" ? undefined : status,
    doctorId: doctorId || undefined, // ✅ Đúng với user đang login
    enabled: !!dateRange,
  });
}
```

**Verification Steps:**

1. Login với doctor account
2. Navigate to `/doctor/schedules`
3. Check network tab: `GET /api/hr/schedules/doctors?employeeId={correctId}`
4. Verify schedules chỉ hiển thị của doctor đang login

---

### Fix 2: Sửa Route Redirects

#### File 1: `app/doctor/exams/new/page.tsx`

**Before (❌ SAI):**

```typescript
const handleSubmit = async (
  data: MedicalExamFormValues,
  status: "PENDING" | "FINALIZED"
) => {
  try {
    const result = await createExamMutation.mutateAsync({
      ...data,
      status,
    });

    const examId = result.data.data.id;
    toast.success("Medical exam created successfully");

    setCreatedExamId(examId);
    setShowPrescriptionPrompt(true);
  } catch (error) {
    // Error handling
  }
};

const handleViewExam = () => {
  if (createdExamId) {
    router.push(`/admin/exams/${createdExamId}`); // ❌ SAI - redirect đến admin route
  }
};
```

**After (✅ ĐÚNG):**

```typescript
const handleViewExam = () => {
  if (createdExamId) {
    router.push(`/doctor/exams/${createdExamId}`); // ✅ ĐÚNG - giữ trong doctor portal
  }
};
```

**Verification Steps:**

1. Complete an appointment as doctor
2. Create medical exam
3. Click "Later" trong prescription prompt
4. Verify redirect đến `/doctor/exams/{id}` (không phải `/admin/exams/{id}`)
5. Verify vẫn ở trong doctor layout (sidebar hiển thị "Doctor Portal")

---

#### File 2: `app/doctor/appointments/[id]/exam/page.tsx`

**Before (❌ SAI):**

```typescript
const handleSubmit = (
  data: MedicalExamFormValues,
  status: "PENDING" | "FINALIZED"
) => {
  createMutation.mutate(
    { ...data, status },
    {
      onSuccess: (createdExam) => {
        // ❌ SAI - redirect đến admin route
        router.push(`/admin/exams/${createdExam.id}`);
      },
    }
  );
};
```

**After (✅ ĐÚNG):**

```typescript
const handleSubmit = (
  data: MedicalExamFormValues,
  status: "PENDING" | "FINALIZED"
) => {
  createMutation.mutate(
    { ...data, status },
    {
      onSuccess: (createdExam) => {
        // ✅ ĐÚNG - redirect đến doctor route
        router.push(`/doctor/exams/${createdExam.id}`);
      },
    }
  );
};
```

**Verification Steps:**

1. Complete an appointment as doctor
2. Click "Create Medical Exam" từ appointment detail
3. Fill form and submit
4. Verify redirect đến `/doctor/exams/{id}`

---

#### File 3: `app/doctor/exams/page.tsx`

**Before (❌ SAI):**

```typescript
<TableCell className="text-right">
  <Button
    variant="ghost"
    size="sm"
    className="rounded-full"
    asChild
  >
    <Link href={`/admin/exams/${exam.id}`}>Xem</Link> {/* ❌ SAI */}
  </Button>
</TableCell>
```

**After (✅ ĐÚNG):**

```typescript
<TableCell className="text-right">
  <Button
    variant="ghost"
    size="sm"
    className="rounded-full"
    asChild
  >
    <Link href={`/doctor/exams/${exam.id}`}>Xem</Link> {/* ✅ ĐÚNG */}
  </Button>
</TableCell>
```

**Verification Steps:**

1. Navigate to `/doctor/exams`
2. Click "Xem" button trên bất kỳ exam nào
3. Verify navigate đến `/doctor/exams/{id}` (không phải `/admin/exams/{id}`)

---

### Fix 3: Implement Update Exam Mutation

#### Step 1: Add Update Function to Service

**File: `services/medical-exam.service.ts`**

```typescript
// Thêm vào medical-exam.service.ts
update: async (
  id: string,
  data: MedicalExamUpdateRequest
): Promise<MedicalExam> => {
  if (!USE_MOCK) {
    const response = await axiosInstance.patch(`${BASE_URL}/${id}`, data);
    return response.data.data;
  }

  // Mock implementation
  await delay(300);
  const exams = getMedicalExams();
  const index = exams.findIndex((e) => e.id === id);
  if (index === -1) {
    throw {
      response: { data: { error: { code: "EXAM_NOT_FOUND" } } },
    };
  }

  const updatedExam = {
    ...exams[index],
    ...data,
    updatedAt: new Date().toISOString(),
  };

  // Save updated exam
  return updatedExam;
},
```

#### Step 2: Add Update Hook

**File: `hooks/queries/useMedicalExam.ts`**

```typescript
// Thêm vào useMedicalExam.ts
export const useUpdateMedicalExam = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: MedicalExamUpdateRequest;
    }) => medicalExamService.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["medical-exams", "list"] });
      queryClient.invalidateQueries({
        queryKey: ["medical-exams", "detail", id],
      });
      toast.success("Medical exam updated successfully");
    },
    onError: (error: any) => {
      const errorCode = error.response?.data?.error?.code;
      const errorMessage = getMedicalExamErrorMessage(errorCode);
      toast.error(errorMessage);
    },
  });
};
```

#### Step 3: Update Edit Page

**File: `app/doctor/exams/[id]/edit/page.tsx`**

**Before (❌ TODO):**

```typescript
const handleSubmit = async (
  data: MedicalExamFormValues,
  status: "PENDING" | "FINALIZED"
) => {
  try {
    // TODO: Implement updateMedicalExam mutation
    toast.error("Update functionality not implemented yet");
  } catch (error) {
    toast.error("Failed to update medical exam");
  }
};
```

**After (✅ ĐÚNG):**

```typescript
import { useUpdateMedicalExam } from "@/hooks/queries/useMedicalExam";

export default function EditDoctorMedicalExamPage({ params }) {
  const { id } = use(params);
  const router = useRouter();
  const { user } = useAuth();
  const { data: medicalExam, isLoading } = useMedicalExam(id);
  const updateMutation = useUpdateMedicalExam(); // ✅ Sử dụng hook

  const handleSubmit = async (
    data: MedicalExamFormValues,
    status: "PENDING" | "FINALIZED"
  ) => {
    try {
      await updateMutation.mutateAsync({
        id,
        data: {
          ...data,
          status,
        },
      });
      toast.success("Medical exam updated successfully");
      router.push(`/doctor/exams/${id}`);
    } catch (error) {
      // Error handling is done in the mutation
    }
  };

  return (
    <MedicalExamForm
      defaultValues={medicalExam}
      onSubmit={(data) => handleSubmit(data, "FINALIZED")}
      onSubmitWithStatus={handleSubmit}
      isSubmitting={updateMutation.isPending} // ✅ Sử dụng mutation state
      userRole="DOCTOR"
      currentExamStatus={medicalExam?.status}
    />
  );
}
```

**Verification Steps:**

1. Create a medical exam
2. Navigate to exam detail
3. Click "Edit Exam" (nếu < 24h)
4. Modify fields and submit
5. Verify exam được update
6. Verify redirect về exam detail với data mới

---

### Fix 4: Cải Thiện 24-Hour Check

**File: `app/doctor/exams/[id]/edit/page.tsx`**

**Before (⚠️ Chỉ check status):**

```typescript
const isEditable =
  medicalExam &&
  user &&
  medicalExam.doctor?.id === user.employeeId &&
  medicalExam.status === "PENDING"; // ⚠️ Chỉ check status, không check thời gian
```

**After (✅ Check cả thời gian):**

```typescript
// Calculate 24-hour window
const examDate = new Date(medicalExam.examDate);
const now = new Date();
const hoursSinceExam = (now.getTime() - examDate.getTime()) / (1000 * 60 * 60);

const isCreator = medicalExam.doctor?.id === user.employeeId;
const isWithin24Hours = hoursSinceExam < 24;
const isPending = medicalExam.status === "PENDING";

const isEditable = isCreator && isWithin24Hours && isPending;

// Optional: Show countdown timer
const remainingHours = Math.max(0, 24 - hoursSinceExam);
const remainingMinutes = Math.floor((remainingHours % 1) * 60);
```

**UI Enhancement (Optional):**

```typescript
{isEditable && (
  <div className="text-sm text-amber-600">
    ⏱️ {Math.floor(remainingHours)}h {remainingMinutes}m remaining to edit
  </div>
)}
```

**Verification Steps:**

1. Create exam
2. Wait 25 hours (hoặc mock time)
3. Navigate to exam detail
4. Verify "Edit" button không hiển thị
5. Create exam mới (< 24h)
6. Verify "Edit" button hiển thị với countdown

---

## 🧪 Test Cases để Verify Fixes

### Test Case 1: localStorage → AuthContext Fix

**Setup:**

1. Login với doctor account (employeeId = "emp-102")
2. Clear localStorage: `localStorage.removeItem("doctorId")`

**Test Steps:**

1. Navigate to `/doctor/exams`
2. Check network request: `GET /api/exams?doctorId=emp-102`
3. Verify list chỉ hiển thị exams của "emp-102"
4. Logout và login với doctor khác (employeeId = "emp-103")
5. Navigate to `/doctor/exams` again
6. Verify list tự động update với exams của "emp-103" (không cần clear localStorage)

**Expected Result:**

- ✅ List tự động filter theo doctor đang login
- ✅ Không cần localStorage
- ✅ Sync với AuthContext

---

### Test Case 2: Route Redirect Fix

**Setup:**

1. Login với doctor account
2. Complete an appointment

**Test Steps:**

1. Click "Create Medical Exam" từ appointment detail
2. Fill form and submit
3. Click "Later" trong prescription prompt
4. Verify URL: `/doctor/exams/{id}` (không phải `/admin/exams/{id}`)
5. Verify sidebar vẫn hiển thị "Doctor Portal"
6. Verify breadcrumb: Doctor > Exams > Exam Detail

**Expected Result:**

- ✅ Luôn ở trong `/doctor/*` routes
- ✅ Không redirect đến `/admin/*`
- ✅ Context được preserve

---

### Test Case 3: Update Exam Mutation

**Setup:**

1. Create exam (< 24h old)
2. Navigate to exam detail

**Test Steps:**

1. Click "Edit Exam"
2. Modify diagnosis, symptoms, treatment
3. Submit form
4. Verify network request: `PATCH /api/exams/{id}`
5. Verify success toast
6. Verify redirect về exam detail
7. Verify exam data được update

**Expected Result:**

- ✅ Exam được update thành công
- ✅ UI update với data mới
- ✅ Cache được invalidate

---

## 📚 Code Examples - Best Practices

### Example 1: Doctor Auto-Filter Pattern

```typescript
// ✅ ĐÚNG - Sử dụng AuthContext
import { useAuth } from "@/contexts/AuthContext";

function DoctorExamsPage() {
  const { user } = useAuth();
  const doctorId = user?.employeeId; // Source of truth

  const { data } = useMedicalExamList({
    doctorId: doctorId || undefined,
    // Backend sẽ validate với X-User-ID header
  });
}
```

### Example 2: Permission Check Pattern

```typescript
// ✅ ĐÚNG - Check cả role và ID
const canComplete =
  isScheduled &&
  user?.role === "DOCTOR" &&
  user?.employeeId === appointment.doctor.id;

// ✅ ĐÚNG - Check creator
const isCreator = medicalExam.doctor?.id === user?.employeeId;
const canEdit = isCreator && hoursSinceExam < 24;
```

### Example 3: Route Consistency Pattern

```typescript
// ✅ ĐÚNG - Giữ context
const basePath = role === "DOCTOR" ? "/doctor" : "/admin";
router.push(`${basePath}/exams/${examId}`);

// ❌ SAI - Mất context
router.push(`/admin/exams/${examId}`); // Nếu đang ở doctor portal
```

---

## 🔍 Verification Checklist

Sau khi apply tất cả fixes, verify các điểm sau:

### localStorage Fixes

- [ ] `/doctor/exams` - Dùng `user?.employeeId`
- [ ] `/doctor/reports/appointments` - Dùng `user?.employeeId`
- [ ] `/doctor/schedules` - Dùng `user?.employeeId`
- [ ] Test với multiple doctor accounts - List tự động update

### Route Redirect Fixes

- [ ] Create exam → Redirect đến `/doctor/exams/{id}`
- [ ] Create exam from appointment → Redirect đến `/doctor/exams/{id}`
- [ ] Exam list link → Navigate đến `/doctor/exams/{id}`
- [ ] Verify breadcrumb và sidebar context

### Update Mutation

- [ ] Update function trong service
- [ ] Update hook trong queries
- [ ] Edit page sử dụng mutation
- [ ] Success toast và redirect
- [ ] Cache invalidation

### 24-Hour Check

- [ ] Tính toán thời gian thực
- [ ] Edit button chỉ hiển thị < 24h
- [ ] Countdown timer (optional)

---

## 📊 Summary Table - Quick Reference

| Issue              | Files Affected | Priority  | Status             | Fix Complexity         |
| ------------------ | -------------- | --------- | ------------------ | ---------------------- |
| localStorage usage | 3 files        | 🔴 High   | ⚠️ Needs fix       | Easy (1-2 lines each)  |
| Route redirects    | 3 files        | 🟡 Medium | ⚠️ Needs fix       | Easy (1 line each)     |
| Update mutation    | 1 file         | 🟡 Medium | ❌ Not implemented | Medium (3 files)       |
| 24-hour check      | 1 file         | 🟢 Low    | ⚠️ Partial         | Easy (add calculation) |

**Total Effort Estimate:** ~2-3 hours

---

**Tài liệu này là nguồn sự thật cho tất cả công việc liên quan đến doctor workflow.**

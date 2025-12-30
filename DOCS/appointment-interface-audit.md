# 📊 Appointment Interface Usage Audit

## Interfaces trong `appointment.ts`

### ✅ Đang được sử dụng đầy đủ

| Interface | Sử dụng trong |
|-----------|---------------|
| `Appointment` | List page, Detail page, Queue pages |
| `AppointmentStatus` | List filters, Status badges |
| `AppointmentType` | Create/Edit forms |
| `AppointmentCreateRequest` | New appointment pages |
| `AppointmentCancelRequest` | Cancel dialogs |
| `AppointmentListParams` | List page filters |
| `PaginatedResponse<T>` | All list pages |
| `TimeSlot` | Time slot selection |
| `WalkInRequest` | Walk-in registration |

### ⚠️ Chưa được sử dụng trong UI

| Interface | Mô tả | Cần UI |
|-----------|-------|--------|
| `AppointmentUpdateRequest` | Cập nhật cuộc hẹn | ❌ Chưa có trang Edit |
| `PatientOption` | Select bệnh nhân | ⚠️ Đang dùng Patient trực tiếp |
| `DoctorOption` | Select bác sĩ | ⚠️ Đang dùng interface riêng |
| `AppointmentStatsResponse` | Thống kê | ❌ Chưa có trang Reports |
| `DepartmentStats` | Stats theo khoa | ❌ Chưa có UI |
| `DoctorStats` | Stats theo bác sĩ | ❌ Chưa có UI |
| `DailyCount` | Trend theo ngày | ❌ Chưa có UI |

---

## Các fields trong `Appointment` interface

| Field | Hiển thị trong List | Hiển thị trong Detail |
|-------|--------------------|-----------------------|
| `id` | ❌ | ✅ (partial) |
| `patient` | ✅ | ✅ |
| `doctor` | ✅ | ✅ |
| `appointmentTime` | ✅ | ✅ |
| `status` | ✅ | ✅ |
| `type` | ❌ | ✅ |
| `reason` | ✅ | ✅ |
| `notes` | ❌ | ✅ |
| `cancelledAt` | ❌ | ❌ |
| `cancelReason` | ❌ | ✅ |
| `medicalExamId` | ❌ | ❌ |
| `queueNumber` | ❌ | ✅ |
| `priority` | ❌ | ❌ |
| `priorityReason` | ❌ | ❌ |
| `createdAt` | ❌ | ✅ |
| `updatedAt` | ❌ | ✅ |
| `createdBy` | ❌ | ✅ |
| `updatedBy` | ❌ | ✅ |

---

## 🔴 Thiếu sót cần bổ sung

### 1. Trang Edit Appointment (HIGH)
- **Vấn đề**: Không có trang `/admin/appointments/[id]/edit`
- **Cần thêm**: Form edit với `AppointmentUpdateRequest`

### 2. Hiển thị Loại khám trong List (MEDIUM)
- **Vấn đề**: List page không hiển thị cột "Loại khám"
- **Cần thêm**: Thêm cột type với badge

### 3. Trang Reports với Stats (LOW)
- **Vấn đề**: `AppointmentStatsResponse` chưa được dùng
- **Đề xuất**: Tích hợp vào `/admin/reports/appointments`

### 4. Hiển thị Priority trong Queue (MEDIUM)
- **Vấn đề**: Queue page không hiển thị priority/priorityReason
- **Cần thêm**: Badge ưu tiên (Emergency, Elderly, etc.)

---

## 📝 Đề xuất hành động

| # | Hành động | Độ ưu tiên |
|---|-----------|------------|
| 1 | Thêm cột "Loại khám" vào List page | ⭐⭐⭐ |
| 2 | Tạo trang Edit appointment | ⭐⭐ |
| 3 | Hiển thị priority badge trong queue | ⭐⭐ |
| 4 | Tích hợp Stats vào Reports | ⭐ |

# Implementation Plan: Bổ Sung Màn Hình Appointment

## Phân Tích Thiếu Sót

### Màn Hình Còn Thiếu

| Route | Screen Name | Status | Priority |
|-------|-------------|--------|----------|
| `/doctor/appointments` | Doctor Appointments List | ❌ Missing | P0 |
| `/doctor/appointments/{id}` | Doctor Appointment Detail | ❌ Missing | P0 |
| `/patient/appointments/{id}` | Patient Appointment Detail | ❌ Missing | P1 |

### Tính Năng Còn Thiếu Trên Các Trang Hiện Có

#### `/admin/appointments` - Appointment List
- [ ] **Doctor Filter**: Dropdown lọc theo bác sĩ
- [ ] **Patient Search**: Tìm kiếm theo tên bệnh nhân
- [ ] **Pagination**: Phân trang (10, 20, 50 items)
- [ ] **Sort**: Sắp xếp theo cột

#### `/patient/appointments` - Patient Appointments
- [ ] **Filter by status**: Tabs (All, Upcoming, Past, Cancelled)
- [ ] **Card View**: Hiển thị dạng card thay vì table
- [ ] **Quick Cancel Action**: Nút hủy nhanh trên card

---

## Proposed Changes

### 1. Tạo `/doctor/appointments` (Doctor Appointments Page)

#### [NEW] [page.tsx](file:///d:/1_Hoc_Tap/1_1_Dai_Hoc/Tai_lieu_ki_1_nam_3/CongNghePhanMemChuyenSau/HMS-total/QuanLyBenhVien/app/doctor/appointments/page.tsx)

Tính năng:
- Hiển thị lịch hẹn của bác sĩ đang đăng nhập
- View tabs: Today / This Week / Calendar
- Filter by status
- Statistics: Total, Pending, Completed, Cancelled
- Actions: Start Visit, View, Cancel

---

### 2. Tạo `/doctor/appointments/[id]` (Doctor Appointment Detail)

#### [NEW] [page.tsx](file:///d:/1_Hoc_Tap/1_1_Dai_Hoc/Tai_lieu_ki_1_nam_3/CongNghePhanMemChuyenSau/HMS-total/QuanLyBenhVien/app/doctor/appointments/[id]/page.tsx)

Tính năng:
- Xem chi tiết lịch hẹn
- Actions: Complete, Cancel, Create Medical Exam
- Link đến medical exam nếu đã có

---

### 3. Tạo `/patient/appointments/[id]` (Patient Appointment Detail)

#### [NEW] [page.tsx](file:///d:/1_Hoc_Tap/1_1_Dai_Hoc/Tai_lieu_ki_1_nam_3/CongNghePhanMemChuyenSau/HMS-total/QuanLyBenhVien/app/patient/appointments/[id]/page.tsx)

Tính năng:
- Xem chi tiết lịch hẹn của mình
- Action: Cancel (nếu SCHEDULED)

---

### 4. Cập Nhật `/admin/appointments` (Admin List)

#### [MODIFY] [page.tsx](file:///d:/1_Hoc_Tap/1_1_Dai_Hoc/Tai_lieu_ki_1_nam_3/CongNghePhanMemChuyenSau/HMS-total/QuanLyBenhVien/app/admin/appointments/page.tsx)

Thêm:
- Doctor filter dropdown
- Patient search input
- Pagination controls
- Sort by columns

---

### 5. Cập Nhật `/patient/appointments` (Patient List)

#### [MODIFY] [page.tsx](file:///d:/1_Hoc_Tap/1_1_Dai_Hoc/Tai_lieu_ki_1_nam_3/CongNghePhanMemChuyenSau/HMS-total/QuanLyBenhVien/app/patient/appointments/page.tsx)

Thêm:
- Status filter tabs
- Card view layout
- Quick cancel action

---

## Verification Plan

### Manual Testing
- [ ] Kiểm tra tất cả routes hoạt động
- [ ] Kiểm tra filters và search
- [ ] Kiểm tra actions (cancel, complete)
- [ ] Kiểm tra role-based access

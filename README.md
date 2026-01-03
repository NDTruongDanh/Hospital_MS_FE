# Hospital Management System (HMS) - Frontend

Hệ thống Quản lý Bệnh viện - Ứng dụng web toàn diện được xây dựng với Next.js, React và TypeScript.

## 📖 Mục lục

- [Tổng quan hệ thống](#-tổng-quan-hệ-thống)
- [Cài đặt và Khởi chạy](#-cài-đặt-và-khởi-chạy)
- [Kịch bản Thuyết trình Chi tiết](#-kịch-bản-thuyết-trình-chi-tiết)
- [Hướng dẫn sử dụng theo vai trò](#-hướng-dẫn-sử-dụng-theo-vai-trò)
- [Kịch bản User Acceptance Testing](#-kịch-bản-user-acceptance-testing-uat)
- [Tài liệu kỹ thuật](#-tài-liệu-kỹ-thuật)

---

## 🎯 Tổng quan hệ thống

**HMS (Hospital Management System)** là ứng dụng quản lý bệnh viện đa vai trò với các module:

| Module         | Mô tả                                   | Màn hình                                  |
| -------------- | --------------------------------------- | ----------------------------------------- |
| **Xác thực**   | Đăng nhập, đăng ký, quên mật khẩu       | `/login`, `/signup`, `/password-reset`    |
| **Bệnh nhân**  | Quản lý hồ sơ bệnh nhân                 | `/admin/patients`                         |
| **Lịch hẹn**   | Đặt, sửa, hủy lịch khám                 | `/admin/appointments`                     |
| **Tiếp nhận**  | Walk-in registration                    | `/admin/walk-in`                          |
| **Hàng đợi**   | Quản lý queue khám bệnh                 | `/admin/queue`, `/doctor/queue`           |
| **Khám bệnh**  | Khám, chẩn đoán, vital signs            | `/admin/exams`, `/doctor/exams`           |
| **Kê đơn**     | Tạo và quản lý đơn thuốc                | `/admin/exams/[id]/prescription`          |
| **Thanh toán** | Hóa đơn, payments, VNPay                | `/admin/billing`                          |
| **Nhân sự**    | Nhân viên, phòng ban, lịch làm việc     | `/admin/hr`                               |
| **Kho thuốc**  | Thuốc, danh mục, cảnh báo hết hàng      | `/admin/medicines`                        |
| **Xét nghiệm** | Lab orders, lab results                 | `/admin/lab-orders`, `/admin/lab-results` |
| **Báo cáo**    | Thống kê doanh thu, lịch hẹn, hiệu suất | `/admin/reports`                          |

### Vai trò và Quyền hạn

| Vai trò          | Quyền hạn                                     | Portal                |
| ---------------- | --------------------------------------------- | --------------------- |
| **ADMIN**        | Toàn quyền hệ thống, quản lý nhân sự, báo cáo | `/admin/*`            |
| **DOCTOR**       | Khám bệnh, kê đơn, xem lịch hẹn của mình      | `/doctor/*`           |
| **NURSE**        | Điền vital signs, xem lịch hẹn, hỗ trợ khám   | `/nurse/*`            |
| **RECEPTIONIST** | Tiếp nhận bệnh nhân, đặt lịch, thanh toán     | `/admin/*` (giới hạn) |
| **PATIENT**      | Tự đặt lịch, xem hồ sơ, thanh toán online     | `/patient/*`          |

---

## 🚀 Cài đặt và Khởi chạy

### Yêu cầu

- Node.js 18+ (khuyến nghị: 20+)
- pnpm, npm hoặc yarn
- Backend services đang chạy (port 8080) HOẶC sử dụng MSW Mock Mode

### Cài đặt

```bash
# Cài dependencies
pnpm install

# Khởi chạy development server với MSW (Mock Service Worker)
pnpm dev
# Ứng dụng sẽ tự động sử dụng mock data nếu backend không khả dụng

# Build production
pnpm build

# Chạy production
pnpm start

# Chạy E2E tests với Playwright
pnpm test:e2e
```

Truy cập: [http://localhost:3000](http://localhost:3000)

### Environment Variables

Tạo file `.env.local` trong thư mục gốc với các biến sau:

```env
# API Configuration
NEXT_PUBLIC_BE_BASE_URL=http://localhost:8080/api

# Mock Mode (1 = enable mock data, 0 = use real backend)
NEXT_PUBLIC_USE_MOCK=1

# Application Settings
NEXT_PUBLIC_APP_NAME=Hospital Management System
NEXT_PUBLIC_APP_VERSION=1.0.0
```

**Lưu ý quan trọng:**

- File `.env.local` **KHÔNG được commit** vào git (đã có trong `.gitignore`)
- Với development: Đặt `NEXT_PUBLIC_USE_MOCK=1` để dùng mock data
- Với production/real backend: Đặt `NEXT_PUBLIC_USE_MOCK=0`
- VNPay credentials chỉ cần khi test payment thực tế

### Mock Service Worker (MSW)

Dự án sử dụng MSW để mock API responses trong development mode:

- **Tự động kích hoạt**: MSW tự động chạy khi backend không khả dụng
- **Mock handlers**: Xem [`mocks/handlers/`](mocks/handlers/) để biết chi tiết
- **Browser worker**: [`public/mockServiceWorker.js`](public/mockServiceWorker.js)
- **Lợi ích**: Phát triển frontend độc lập, không cần backend luôn chạy

### Tài liệu chi tiết

📚 Xem thêm tài liệu trong thư mục [`DOCS/`](DOCS/):

- [`api-contracts-complete.md`](DOCS/api-contracts-complete.md) - API contracts đầy đủ
- [`data-models-complete.md`](DOCS/data-models-complete.md) - Data models và schemas
- [`TEST_ACCOUNTS.md`](DOCS/TEST_ACCOUNTS.md) - Tài khoản test chi tiết
- [`CONTRIBUTING.md`](DOCS/CONTRIBUTING.md) - Hướng dẫn đóng góp
- [`design_guidelines.md`](DOCS/design_guidelines.md) - Nguyên tắc thiết kế UI/UX

### Tài khoản test

| Vai trò   | Email                | Password         |
| --------- | -------------------- | ---------------- |
| Admin     | admin@hms.com        | Admin@123        |
| Bác sĩ    | doctor@hms.com       | Doctor@123       |
| Y tá      | nurse@hms.com        | Nurse@123        |
| Lễ tân    | receptionist@hms.com | Receptionist@123 |
| Bệnh nhân | patient@hms.com      | Patient@123      |

---

## 🎤 Kịch bản Thuyết trình Chi tiết

> **Kịch bản toàn diện** - Demo tất cả chức năng của hệ thống

---

### PHẦN A: XÁC THỰC VÀ PHÂN QUYỀN

#### A1. Trang Đăng nhập (`/login`)

**Demo**:

1. Truy cập `http://localhost:3000`
2. Redirect tự động đến `/login`
3. Giới thiệu giao diện đăng nhập:
   - Logo HMS
   - Form đăng nhập với validation
   - Link "Quên mật khẩu"
   - Link "Đăng ký tài khoản"

**Tính năng**:

- ✅ Validation email format
- ✅ Ẩn/hiện mật khẩu
- ✅ Remember me
- ✅ Thông báo lỗi chi tiết

#### A2. Trang Đăng ký (`/signup`)

**Demo**:

1. Bấm "Đăng ký tài khoản mới"
2. Điền thông tin:
   - Họ tên, Email, Mật khẩu
   - SĐT, Ngày sinh, Giới tính
   - Địa chỉ
3. Submit form

**Tính năng**:

- ✅ Validation realtime
- ✅ Password strength indicator
- ✅ Xác nhận mật khẩu match
- ✅ Tự động tạo hồ sơ bệnh nhân

#### A3. Quên mật khẩu (`/password-reset`)

**Demo**:

1. Từ login, bấm "Quên mật khẩu"
2. Nhập email
3. Nhận link reset (giả lập)
4. Tạo mật khẩu mới

---

### PHẦN B: ADMIN DASHBOARD VÀ TỔNG QUAN

#### B1. Dashboard Admin (`/admin`)

**Đăng nhập**: `admin@hms.com`

**Demo các thành phần**:

1. **Statistics Cards** (4 thẻ):
   - Tổng số bệnh nhân (real-time từ API)
   - Lịch hẹn hôm nay
   - Thuốc sắp hết hàng
   - Doanh thu hôm nay

2. **Quick Actions** (4 nút):
   - Đăng ký bệnh nhân mới
   - Tạo lịch hẹn
   - Bắt đầu khám
   - Thêm thuốc

3. **Today's Appointments**:
   - Danh sách 5 lịch hẹn gần nhất
   - Hiển thị giờ, tên BN, bác sĩ, trạng thái
   - Link "View all"

4. **Low Stock Alert**:
   - Thuốc có số lượng < 50
   - Progress bar màu (đỏ/xanh)
   - Nút "Restock Inventory"

5. **Footer Stats**:
   - Tổng bệnh nhân
   - Lịch hẹn hôm nay
   - Loại thuốc
   - Doanh thu hôm nay

---

### PHẦN C: QUẢN LÝ BỆNH NHÂN

#### C1. Danh sách Bệnh nhân (`/admin/patients`)

**Demo**:

1. Xem danh sách với pagination
2. Tìm kiếm theo tên/SĐT
3. Filter theo trạng thái verified
4. Sort theo các cột

**Tính năng bảng**:

- ✅ Pagination (10/20/50 rows)
- ✅ Tìm kiếm toàn cục
- ✅ Filter dropdown
- ✅ Sort columns
- ✅ Row actions (View, Edit, Delete)

#### C2. Thêm Bệnh nhân (`/admin/patients/new`)

**Demo**:

1. Bấm "Add Patient"
2. Điền form thông tin:
   - Thông tin cá nhân: Họ tên, SĐT, Email
   - Ngày sinh, Giới tính, CCCD
   - Địa chỉ, Nhóm máu
   - Liên hệ khẩn cấp
3. Submit

**Validation**:

- ✅ SĐT format Việt Nam
- ✅ Email unique
- ✅ Ngày sinh không tương lai

#### C3. Chi tiết Bệnh nhân (`/admin/patients/[id]`)

**Demo**:

1. Bấm vào tên bệnh nhân
2. Xem thông tin chi tiết:
   - Thông tin cá nhân
   - Thông tin y tế (nhóm máu, dị ứng)
   - Liên hệ khẩn cấp
3. Các tab:
   - Overview
   - Lịch sử khám
   - Lịch hẹn

#### C4. Lịch sử Khám bệnh (`/admin/patients/[id]/history`)

**Demo**:

1. Xem danh sách các lần khám
2. Mỗi lần khám hiển thị:
   - Ngày khám
   - Bác sĩ
   - Chẩn đoán
   - Đơn thuốc

---

### PHẦN D: QUẢN LÝ LỊCH HẸN

#### D1. Danh sách Lịch hẹn (`/admin/appointments`)

**Demo**:

1. Xem danh sách với filters:
   - Theo ngày (date picker)
   - Theo trạng thái (SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED)
   - Theo bác sĩ
2. Sort theo thời gian
3. Actions: View, Edit, Cancel

**Status badges**:

- 🔵 SCHEDULED - Đã lên lịch
- 🟡 IN_PROGRESS - Đang khám
- 🟢 COMPLETED - Hoàn thành
- 🔴 CANCELLED - Đã hủy
- 🟠 NO_SHOW - Không đến

#### D2. Tạo Lịch hẹn (`/admin/appointments/new`)

**Demo**:

1. Tìm và chọn bệnh nhân (search dropdown)
2. Chọn bác sĩ (search dropdown)
3. Chọn ngày khám (date picker)
4. Chọn khung giờ (time slots grid)
5. Chọn loại khám (CONSULTATION, FOLLOW_UP, EMERGENCY)
6. Nhập lý do khám
7. Submit

**Time Slots**:

- ✅ Hiển thị grid khung giờ
- ✅ Khung giờ đã đặt = disabled
- ✅ Khung giờ quá khứ = disabled
- ✅ Visual feedback khi chọn

#### D3. Sửa Lịch hẹn (`/admin/appointments/[id]/edit`)

**Demo**:

1. Bấm Edit từ danh sách
2. Thay đổi khung giờ
3. Thay đổi bác sĩ
4. Save

**Lưu ý**:

- Không sửa được lịch COMPLETED/CANCELLED
- Highlight khung giờ hiện tại

#### D4. Hủy Lịch hẹn

**Demo**:

1. Bấm Cancel từ dropdown
2. Nhập lý do hủy
3. Confirm
4. Lịch hẹn chuyển CANCELLED

---

### PHẦN E: TIẾP NHẬN VÀ HÀNG ĐỢI

#### E1. Walk-in Registration (`/admin/walk-in`)

**Demo cho vai trò RECEPTIONIST**:

1. Đăng nhập receptionist
2. Bệnh nhân mới:
   - Nhập thông tin cá nhân
   - Chọn bác sĩ
   - Chọn giờ khám
   - Tạo lịch hẹn ngay
3. Bệnh nhân đã có:
   - Tìm kiếm theo tên/SĐT
   - Chọn từ danh sách
   - Tạo lịch hẹn

**Tính năng**:

- ✅ Auto-complete bệnh nhân
- ✅ Tạo BN mới inline
- ✅ Chọn giờ còn trống

#### E2. Hàng đợi khám (`/admin/queue` hoặc `/doctor/queue`)

**Demo**:

1. Xem danh sách bệnh nhân chờ khám
2. Sắp xếp theo giờ hẹn
3. Trạng thái:
   - Chờ vital signs
   - Đã có vital signs - sẵn sàng khám
   - Đang khám
4. Actions:
   - Điền Vital Signs (Nurse)
   - Bắt đầu khám (Doctor)

---

### PHẦN F: KHÁM BỆNH VÀ KÊ ĐƠN

#### F1. Điền Vital Signs (Nurse) (`/nurse/appointments`)

**Demo với vai trò NURSE**:

1. Đăng nhập nurse@hms.com
2. Vào Lịch hẹn hoặc Hàng đợi
3. Tìm lịch hẹn SCHEDULED
4. Bấm dropdown ⋮ → "Điền Vital Signs"
5. Dialog mở ra:
   - Huyết áp (systolic/diastolic)
   - Nhịp tim (bpm)
   - Nhiệt độ (°C)
   - Cân nặng (kg)
   - Chiều cao (cm)
   - SpO2 (%)
   - Ghi chú
6. Lưu

**Tính năng**:

- ✅ Validation giá trị hợp lệ
- ✅ Hiển thị đơn vị đo
- ✅ Tự động tạo Medical Exam nếu chưa có

#### F2. Danh sách Khám bệnh (`/admin/exams` hoặc `/doctor/exams`)

**Demo**:

1. Xem danh sách các ca khám
2. Filter theo trạng thái:
   - IN_PROGRESS - Đang khám
   - COMPLETED - Hoàn thành
3. Filter theo ngày
4. Tìm kiếm theo tên BN

#### F3. Thực hiện Khám bệnh (`/doctor/exams/[id]/edit`)

**Demo với vai trò DOCTOR**:

1. Đăng nhập doctor@hms.com
2. Vào Hàng đợi → Bắt đầu khám
3. Màn hình khám bệnh:
   - **Bên trái**: Form nhập
     - Triệu chứng (symptoms)
     - Chẩn đoán (diagnosis)
     - Ghi chú (notes)
   - **Bên phải**: Thông tin BN
     - Thông tin cá nhân
     - Vital signs (nếu đã điền)
     - Lịch sử khám gần đây
4. Lưu

#### F4. Kê Đơn thuốc (`/doctor/exams/[id]/prescription`)

**Demo**:

1. Từ màn hình khám → Tab "Đơn thuốc"
2. Hoặc bấm "Kê đơn thuốc"
3. Form:
   - Tìm kiếm thuốc (auto-complete)
   - Số lượng
   - Liều dùng (dosage)
   - Thời gian dùng (duration)
   - Ghi chú
4. Bấm "Thêm vào đơn"
5. Xem danh sách thuốc đã thêm
6. Lưu đơn thuốc

**Tính năng**:

- ✅ Tìm kiếm thuốc theo tên
- ✅ Hiển thị giá thuốc
- ✅ Tính tổng tiền đơn
- ✅ Xóa/sửa thuốc trong đơn

#### F5. Xem Đơn thuốc (`/doctor/exams/[id]/prescription/view`)

**Demo**:

1. Xem đơn thuốc đã kê
2. Thông tin:
   - Tên bệnh nhân
   - Ngày kê đơn
   - Bác sĩ kê
   - Danh sách thuốc
   - Tổng tiền
3. In đơn thuốc (PDF)

#### F6. Hoàn thành Khám

**Demo**:

1. Sau khi đã nhập chẩn đoán và kê đơn
2. Bấm "Hoàn thành khám"
3. Lịch hẹn chuyển COMPLETED
4. Hóa đơn tự động tạo

---

### PHẦN G: THANH TOÁN VÀ HÓA ĐƠN

#### G1. Danh sách Hóa đơn (`/admin/billing`)

**Demo**:

1. Xem danh sách hóa đơn
2. Filter theo trạng thái:
   - UNPAID - Chưa thanh toán
   - PARTIALLY_PAID - Thanh toán một phần
   - PAID - Đã thanh toán
   - OVERDUE - Quá hạn
   - CANCELLED - Đã hủy
3. Filter theo ngày
4. Tìm kiếm theo mã hóa đơn/tên BN

**Thông tin hiển thị**:

- Mã hóa đơn
- Tên bệnh nhân
- Ngày tạo
- Tổng tiền
- Đã thanh toán
- Còn nợ
- Trạng thái

#### G2. Chi tiết Hóa đơn (`/admin/billing/[id]`)

**Demo**:

1. Bấm vào mã hóa đơn
2. Xem chi tiết:
   - Thông tin bệnh nhân
   - Ngày hóa đơn
   - Items (phí khám, thuốc, xét nghiệm...)
   - Tổng cộng
   - Đã thanh toán
   - Còn lại
3. Lịch sử thanh toán (nếu có)

#### G3. Thanh toán Hóa đơn (`/admin/billing/[id]/payment`)

**Demo**:

1. Bấm "Thanh toán" từ danh sách
2. Chọn phương thức:
   - **Tiền mặt**: Xác nhận số tiền → Done
   - **VNPay**: Redirect đến VNPay → Quay lại
3. Hóa đơn cập nhật trạng thái

#### G4. Lịch sử Thanh toán (`/admin/billing/payments`)

**Demo**:

1. Vào menu Billing → Payments
2. Xem danh sách tất cả payments:
   - Payment ID
   - Mã hóa đơn
   - Tên bệnh nhân
   - Số tiền
   - Phương thức (Cash/VNPay)
   - Ngày thanh toán
   - Trạng thái
3. Filter theo phương thức
4. Filter theo ngày

**Summary Cards**:

- Doanh thu hôm nay
- Doanh thu tuần này
- Tiền mặt (%)
- Thẻ/Online (%)

---

### PHẦN H: QUẢN LÝ NHÂN SỰ

#### H1. Tổng quan HR (`/admin/hr`)

**Demo**:

1. Card tổng quan:
   - Tổng nhân viên
   - Tổng phòng ban
   - Lịch làm việc hôm nay

#### H2. Quản lý Phòng ban (`/admin/hr/departments`)

**Demo**:

1. Danh sách phòng ban
2. Thông tin: Tên, Mô tả, Số nhân viên
3. CRUD operations:
   - Thêm phòng ban mới
   - Sửa thông tin
   - Xem chi tiết (nhân viên thuộc phòng)
   - Xóa (nếu không có nhân viên)

#### H3. Quản lý Nhân viên (`/admin/hr/employees`)

**Demo**:

1. Danh sách nhân viên với filter:
   - Theo phòng ban
   - Theo vai trò (Doctor, Nurse, Receptionist)
   - Theo trạng thái (Active/Inactive)
2. Thông tin hiển thị:
   - Họ tên, Email, SĐT
   - Phòng ban
   - Chức vụ
   - Chuyên môn (cho Doctor)

#### H4. Thêm Nhân viên (`/admin/hr/employees/new`)

**Demo**:

1. Điền thông tin cá nhân
2. Chọn phòng ban
3. Chọn vai trò
4. Nhập chuyên môn (nếu là Doctor)
5. Submit

#### H5. Chi tiết Nhân viên (`/admin/hr/employees/[id]`)

**Demo**:

1. Thông tin cá nhân đầy đủ
2. Thông tin công việc
3. Lịch làm việc
4. Lịch hẹn (nếu là Doctor)

#### H6. Lịch làm việc (`/admin/hr/schedules`)

**Demo**:

1. Xem lịch làm việc theo tuần/tháng
2. Filter theo nhân viên/phòng ban
3. Hiển thị dạng calendar hoặc list

---

### PHẦN I: QUẢN LÝ KHO THUỐC

#### I1. Danh sách Thuốc (`/admin/medicines`)

**Demo**:

1. Xem danh sách thuốc với:
   - Tìm kiếm theo tên
   - Filter theo danh mục
   - Sort theo tên/giá/số lượng
2. Thông tin hiển thị:
   - Tên thuốc
   - Hoạt chất
   - Đơn vị
   - Số lượng tồn
   - Giá nhập/bán
   - Hạn sử dụng
   - Danh mục

**Cảnh báo**:

- 🔴 Số lượng < 50: cảnh báo hết hàng
- 🟡 Sắp hết hạn: cảnh báo expiry

#### I2. Thêm Thuốc (`/admin/medicines/new`)

**Demo**:

1. Điền thông tin:
   - Tên thuốc
   - Hoạt chất
   - Đơn vị (viên, hộp, chai...)
   - Mô tả
   - Số lượng nhập
   - Giá nhập, Giá bán
   - Hạn sử dụng
   - Danh mục
2. Submit

#### I3. Chi tiết Thuốc (`/admin/medicines/[id]`)

**Demo**:

1. Thông tin đầy đủ
2. Lịch sử nhập/xuất
3. Biểu đồ tồn kho

#### I4. Sửa Thuốc (`/admin/medicines/[id]/edit`)

**Demo**:

1. Cập nhật thông tin
2. Cập nhật số lượng (nhập thêm)
3. Cập nhật giá

#### I5. Quản lý Danh mục (trong `/admin/medicines`)

**Demo**:

1. Tab Danh mục
2. CRUD danh mục thuốc
3. Assign thuốc vào danh mục

---

### PHẦN J: XÉT NGHIỆM (Lab)

#### J1. Lab Tests (`/admin/lab-tests`)

**Demo**:

1. Danh sách các loại xét nghiệm
2. Thông tin: Tên, Mô tả, Giá
3. CRUD operations

#### J2. Lab Orders (`/admin/lab-orders`)

**Demo**:

1. Danh sách yêu cầu xét nghiệm
2. Trạng thái:
   - PENDING - Chờ xử lý
   - IN_PROGRESS - Đang thực hiện
   - COMPLETED - Hoàn thành
3. Actions:
   - Xem chi tiết
   - Cập nhật trạng thái
   - Nhập kết quả

#### J3. Chi tiết Lab Order (`/admin/lab-orders/[id]`)

**Demo**:

1. Thông tin yêu cầu:
   - Bệnh nhân
   - Bác sĩ yêu cầu
   - Loại xét nghiệm
   - Ngày yêu cầu
2. Kết quả (nếu có)

#### J4. Lab Results (`/admin/lab-results`)

**Demo**:

1. Danh sách kết quả xét nghiệm
2. Filter theo ngày, trạng thái
3. Xem/In kết quả

---

### PHẦN K: BÁO CÁO VÀ THỐNG KÊ

#### K1. Dashboard Báo cáo (`/admin/reports`)

**Demo**:

1. Overview cards:
   - Tổng doanh thu
   - Tổng lịch hẹn
   - Bệnh nhân mới
   - Doanh thu trung bình/ngày
2. Biểu đồ:
   - Revenue trend
   - Appointment distribution
   - Top doctors

#### K2. Báo cáo Doanh thu (`/admin/reports/revenue`)

**Demo**:

1. Filter theo khoảng thời gian
2. Biểu đồ doanh thu theo ngày/tuần/tháng
3. Breakdown theo:
   - Phương thức thanh toán
   - Loại dịch vụ
4. Export CSV

**Số liệu**:

- Tổng doanh thu
- Số hóa đơn
- Trung bình/hóa đơn
- So sánh với kỳ trước

#### K3. Báo cáo Lịch hẹn (`/admin/reports/appointments`)

**Demo**:

1. Filter theo khoảng thời gian
2. Filter theo phòng ban/bác sĩ
3. Biểu đồ:
   - Số lượng theo ngày
   - Phân bố theo trạng thái
   - Phân bố theo loại khám
4. Export CSV

**Số liệu**:

- Tổng lịch hẹn
- Hoàn thành / Hủy / No-show
- Tỷ lệ hoàn thành

#### K4. Hiệu suất Bác sĩ (`/admin/reports/doctors/performance`)

**Demo**:

1. Filter theo khoảng thời gian
2. Filter theo phòng ban
3. Bảng hiệu suất:
   - Tên bác sĩ
   - Số lượng khám
   - Doanh thu
   - Tỷ lệ hoàn thành
4. Export CSV

#### K5. Hoạt động Bệnh nhân (`/admin/reports/patients/activity`)

**Demo**:

1. Filter theo khoảng thời gian
2. Biểu đồ:
   - Bệnh nhân mới theo ngày
   - Phân bố theo giới tính
   - Phân bố theo nhóm máu
   - Độ tuổi
3. Export CSV

---

### PHẦN L: PORTAL BÁC SĨ

> **Lưu ý**: Doctor portal không có trang dashboard riêng, truy cập `/doctor` sẽ redirect đến trang chính.

#### L1. Lịch hẹn Doctor (`/doctor/appointments`)

**Demo với vai trò DOCTOR**:

1. Xem lịch hẹn của mình
2. Filter theo ngày
3. Actions: Xem, Bắt đầu khám, Tạo lịch mới

#### L2. Hàng đợi Doctor (`/doctor/queue`)

**Demo**:

1. Danh sách BN chờ khám (của mình)
2. Bắt đầu khám
3. Xem vital signs

#### L3. Khám bệnh Doctor (`/doctor/exams`)

**Demo**:

1. Danh sách ca khám của mình
2. Khám bệnh, kê đơn
3. Hoàn thành khám
4. Xem chi tiết ca khám (`/doctor/exams/[id]`)
5. Chỉnh sửa khám (`/doctor/exams/[id]/edit`)
6. Kê đơn thuốc (`/doctor/exams/[id]/prescription`)
7. Xem đơn thuốc (`/doctor/exams/[id]/prescription/view`)

#### L4. Bệnh nhân Doctor (`/doctor/patients`)

**Demo**:

1. Xem danh sách BN đã khám
2. Xem chi tiết bệnh nhân (`/doctor/patients/[id]`)
3. Xem lịch sử khám (`/doctor/patients/[id]/history`)
4. Chỉnh sửa thông tin (`/doctor/patients/[id]/edit`)

#### L5. Xét nghiệm Doctor

**L5.1. Lab Orders (`/doctor/lab-orders/[id]`)**

**Demo**:

1. Xem chi tiết yêu cầu xét nghiệm
2. Theo dõi trạng thái xử lý

**L5.2. Lab Results (`/doctor/lab-results`)**

**Demo**:

1. Xem danh sách kết quả xét nghiệm
2. Xem chi tiết kết quả (`/doctor/lab-results/[id]`)
3. Phân tích và đánh giá kết quả

#### L6. Lịch làm việc (`/doctor/schedules`)

**Demo**:

1. Xem lịch làm việc của mình
2. Theo tuần/tháng
3. Lịch trình chi tiết

#### L7. Báo cáo Doctor (`/doctor/reports/appointments`)

**Demo**:

1. Thống kê lịch hẹn của mình
2. Biểu đồ, số liệu
3. Hiệu suất cá nhân

#### L8. Hồ sơ Doctor (`/doctor/profile`)

**Demo**:

1. Xem thông tin cá nhân
2. Cập nhật thông tin
3. Đổi mật khẩu

---

### PHẦN M: PORTAL Y TÁ

> **Lưu ý**: Nurse portal không có trang dashboard riêng, chỉ có 2 trang chức năng chính.

#### M1. Lịch hẹn Nurse (`/nurse/appointments`)

**Demo với vai trò NURSE**:

1. Xem lịch hẹn hôm nay
2. Điền Vital Signs cho bệnh nhân
3. Xem thông tin BN
4. Cập nhật trạng thái

#### M2. Lab Orders Nurse (`/nurse/lab-orders`)

**Demo**:

1. Xem yêu cầu xét nghiệm
2. Cập nhật trạng thái xử lý
3. Nhập kết quả xét nghiệm
4. Ghi chú kết quả

---

### PHẦN N: PORTAL BỆNH NHÂN

> **Lưu ý**: Patient portal không có dashboard riêng, truy cập `/patient` sẽ tự động redirect đến `/patient/appointments`.

#### N1. Lịch hẹn của tôi (`/patient/appointments`)

**Demo với vai trò PATIENT**:

1. Xem danh sách lịch hẹn (quá khứ + tương lai)
2. Filter theo trạng thái
3. Tìm kiếm theo ngày

#### N2. Đặt lịch Online (`/patient/appointments/new`)

**Demo**:

1. Chọn phòng khám/chuyên khoa
2. Chọn bác sĩ (với thông tin chi tiết)
3. Chọn ngày
4. Chọn khung giờ (grid visual)
5. Nhập lý do khám
6. Xác nhận đặt lịch

#### N3. Chi tiết Lịch hẹn (`/patient/appointments/[id]`)

**Demo**:

1. Thông tin lịch hẹn
2. Thông tin bác sĩ
3. Hủy lịch (nếu còn cho phép)

#### N4. Xem ca khám từ lịch hẹn (`/patient/appointments/[id]/exam`)

**Demo**:

1. Xem thông tin ca khám liên kết với lịch hẹn
2. Kết quả khám bệnh
3. Chẩn đoán và điều trị

#### N5. Hồ sơ Y tế (`/patient/medical-records`)

**Demo**:

1. Danh sách các lần khám
2. Thông tin: Ngày, Bác sĩ, Chẩn đoán

#### N6. Chi tiết Khám bệnh (`/patient/medical-records/[id]`)

**Demo**:

1. Thông tin khám:
   - Triệu chứng
   - Chẩn đoán
   - Ghi chú
2. Vital signs
3. Link đến đơn thuốc

#### N7. Đơn thuốc từ Hồ sơ (`/patient/medical-records/[id]/prescription`)

**Demo**:

1. Xem đơn thuốc của ca khám cụ thể
2. Danh sách thuốc đã kê
3. Liều dùng và hướng dẫn

#### N7a. Xem chi tiết Đơn thuốc (`/patient/medical-records/[id]/prescription/view`)

**Demo**:

1. Xem đầy đủ thông tin đơn thuốc
2. In đơn thuốc PDF
3. Thông tin bác sĩ kê đơn
4. Thông tin bệnh nhân

#### N8. Danh sách Đơn thuốc (`/patient/prescriptions`)

**Demo**:

1. Xem tất cả đơn thuốc đã được kê
2. Tìm kiếm theo ngày
3. Filter theo bác sĩ

#### N9. Chi tiết Đơn thuốc (`/patient/prescriptions/[id]`)

**Demo**:

1. Xem chi tiết đơn thuốc cụ thể
2. In đơn thuốc
3. Thông tin thuốc và liều dùng chi tiết

#### N10. Thanh toán (`/patient/billing`)

**Demo**:

1. Danh sách hóa đơn của tôi
2. Filter theo trạng thái thanh toán
3. Xem tổng quan chi phí
4. Lịch sử thanh toán

#### N11. Chi tiết Hóa đơn (`/patient/billing/[id]`)

**Demo**:

1. Xem chi tiết hóa đơn
2. Danh mục chi phí (khám, thuốc, xét nghiệm)
3. Lịch sử các lần thanh toán
4. Số tiền còn nợ

#### N12. Thanh toán Hóa đơn (`/patient/billing/[id]/pay`)

**Demo**:

1. Chọn phương thức thanh toán
2. Nhập số tiền thanh toán
3. Thanh toán VNPay online
4. Xác nhận và nhận biên lai

#### N13. Kết quả Xét nghiệm (`/patient/lab-results`)

**Demo**:

1. Xem danh sách kết quả xét nghiệm
2. Filter theo ngày và loại xét nghiệm
3. Trạng thái kết quả (Pending/Completed)
4. Tìm kiếm theo tên xét nghiệm

#### N14. Chi tiết Kết quả Xét nghiệm (`/patient/lab-results/[id]`)

**Demo**:

1. Xem chi tiết kết quả đầy đủ
2. Chỉ số và đơn vị đo
3. Tải PDF kết quả
4. Ghi chú và nhận xét của bác sĩ
5. So sánh với chỉ số bình thường

#### N15. Hồ sơ cá nhân (`/patient/profile`)

**Demo**:

1. Xem thông tin cá nhân
2. Thông tin y tế (nhóm máu, dị ứng, tiền sử bệnh)
3. Liên hệ khẩn cấp
4. Ảnh đại diện

#### N16. Cập nhật Hồ sơ (`/patient/profile/edit`)

**Demo**:

1. Chỉnh sửa thông tin cá nhân
2. Cập nhật thông tin y tế
3. Đổi mật khẩu
4. Cập nhật ảnh đại diện
5. Cập nhật liên hệ khẩn cấp

---

### PHẦN O: QUẢN LÝ TÀI KHOẢN

#### O1. Danh sách Tài khoản (`/admin/accounts`)

**Demo với vai trò ADMIN**:

1. Danh sách tất cả accounts
2. Filter theo role
3. Filter theo trạng thái
4. Actions: Enable/Disable, Reset password

#### O2. Hồ sơ cá nhân theo vai trò

**Các routes profile**:

- `/admin/profile` - Hồ sơ Admin
- `/doctor/profile` - Hồ sơ Doctor
- `/patient/profile` - Hồ sơ Patient
- `/profile` - Route chung (có thể redirect theo role)

**Demo**:

1. Xem thông tin cá nhân
2. Cập nhật avatar
3. Đổi mật khẩu
4. Cập nhật thông tin liên hệ

---

### PHẦN P: TÍNH NĂNG KỸ THUẬT

#### P1. Responsive Design

**Demo**:

1. Thu nhỏ trình duyệt
2. Mobile view:
   - Sidebar collapse
   - Table scroll horizontal
   - Cards stack

#### P2. Real-time Data

**Demo**:

1. Dashboard auto-refresh
2. TanStack Query caching
3. Optimistic updates

#### P3. Form Validation

**Demo**:

1. Validation realtime
2. Error messages
3. Required fields

#### P4. Notifications

**Demo**:

1. Toast notifications (success/error)
2. Sonner library

#### P5. Theme và UI

**Demo**:

1. Shadcn/ui components
2. Consistent design
3. Animations

---

## 📚 Hướng dẫn sử dụng theo vai trò

### 👨‍⚕️ BÁC SĨ (DOCTOR)

| Chức năng         | Màn hình                          | Mô tả                  |
| ----------------- | --------------------------------- | ---------------------- |
| Xem lịch hẹn      | `/doctor/appointments`            | Lịch hẹn của mình      |
| Xem hàng đợi      | `/doctor/queue`                   | Danh sách BN chờ khám  |
| Bắt đầu khám      | Từ queue                          | Tạo Medical Exam       |
| Xem vital signs   | Trong khám                        | Y tá đã điền sẵn       |
| Nhập chẩn đoán    | `/doctor/exams/[id]/edit`         | Triệu chứng, chẩn đoán |
| Kê đơn thuốc      | `/doctor/exams/[id]/prescription` | Thêm thuốc vào đơn     |
| Hoàn thành khám   | Trong khám                        | Chuyển COMPLETED       |
| Xem Lab Orders    | `/doctor/lab-orders/[id]`         | Yêu cầu xét nghiệm     |
| Xem Lab Results   | `/doctor/lab-results`             | Kết quả xét nghiệm     |
| Xem lịch làm việc | `/doctor/schedules`               | Lịch tuần/tháng        |
| Xem báo cáo       | `/doctor/reports/appointments`    | Thống kê cá nhân       |
| Quản lý bệnh nhân | `/doctor/patients`                | BN đã khám             |
| Hồ sơ cá nhân     | `/doctor/profile`                 | Thông tin cá nhân      |

### 👩‍⚕️ Y TÁ (NURSE)

| Chức năng        | Màn hình              | Mô tả                           |
| ---------------- | --------------------- | ------------------------------- |
| Xem lịch hẹn     | `/nurse/appointments` | Lịch hẹn hôm nay                |
| Điền Vital Signs | Dialog từ lịch hẹn    | Huyết áp, nhịp tim, nhiệt độ... |
| Xem lab orders   | `/nurse/lab-orders`   | Yêu cầu xét nghiệm              |

### 💁‍♀️ LỄ TÂN (RECEPTIONIST)

| Chức năng        | Màn hình              | Mô tả                  |
| ---------------- | --------------------- | ---------------------- |
| Tiếp nhận BN     | `/admin/walk-in`      | Đăng ký + tạo lịch hẹn |
| Quản lý lịch hẹn | `/admin/appointments` | Xem, tạo, sửa, hủy     |
| Thanh toán       | `/admin/billing`      | Thu tiền, VNPay        |
| Quản lý BN       | `/admin/patients`     | Xem, sửa thông tin     |

### 🧑‍🤝‍🧑 BỆNH NHÂN (PATIENT)

| Chức năng         | Màn hình                    | Mô tả              |
| ----------------- | --------------------------- | ------------------ |
| Đăng ký           | `/signup`                   | Tạo tài khoản mới  |
| Đặt lịch online   | `/patient/appointments/new` | Chọn BS, giờ, đặt  |
| Xem lịch hẹn      | `/patient/appointments`     | Lịch sử + sắp tới  |
| Hủy lịch          | Chi tiết lịch hẹn           | Nhập lý do         |
| Xem hồ sơ y tế    | `/patient/medical-records`  | Lịch sử khám       |
| Xem đơn thuốc     | `/patient/prescriptions`    | Đơn thuốc đã kê    |
| Thanh toán online | `/patient/billing`          | Thanh toán hóa đơn |
| Xem kết quả XN    | `/patient/lab-results`      | Kết quả xét nghiệm |
| Cập nhật profile  | `/patient/profile/edit`     | Thông tin cá nhân  |

---

## ✅ Kịch bản User Acceptance Testing (UAT)

> **Mục tiêu**: Đạt độ phủ kiểm thử > 90% các chức năng

### Checklist UAT theo Module

| #        | Module         | Test Cases     | Chi tiết                               |
| -------- | -------------- | -------------- | -------------------------------------- |
| 1        | Xác thực       | 6              | Login, Signup, Reset password, Session |
| 2        | Quản lý BN     | 8              | CRUD, Search, Filter, History          |
| 3        | Lịch hẹn       | 10             | CRUD, Time slots, Status, Conflicts    |
| 4        | Tiếp nhận      | 4              | Walk-in, Queue, Check-in               |
| 5        | Khám bệnh      | 10             | Vital signs, Exam, Diagnosis, Complete |
| 6        | Kê đơn         | 6              | Add drug, Edit, Delete, Save, View     |
| 7        | Thanh toán     | 8              | Invoice, Cash, VNPay, History          |
| 8        | Nhân sự        | 10             | Departments, Employees, Schedules      |
| 9        | Kho thuốc      | 8              | CRUD, Categories, Stock alerts         |
| 10       | Xét nghiệm     | 6              | Orders, Results, Status                |
| 11       | Báo cáo        | 8              | Revenue, Appointments, Performance     |
| 12       | Portal Doctor  | 8              | Queue, Exam, Prescription              |
| 13       | Portal Nurse   | 4              | Vital signs, Lab orders                |
| 14       | Portal Patient | 10             | Booking, Records, Payment              |
| 15       | Tài khoản      | 4              | Profile, Password, Accounts            |
| **Tổng** |                | **~110 cases** | **>90% coverage**                      |

### Chi tiết Test Cases

_(Xem phần UAT chi tiết ở phần dưới của README gốc)_

---

## 🛠 Tài liệu kỹ thuật

### Tech Stack

| Công nghệ                 | Mục đích                      |
| ------------------------- | ----------------------------- |
| Next.js 16                | Framework React, App Router   |
| TypeScript                | Type-safe JavaScript          |
| Tailwind CSS 4            | Utility-first CSS             |
| shadcn/ui                 | Component library             |
| TanStack Query            | Server state management       |
| React Hook Form + Zod     | Form handling + validation    |
| Axios                     | HTTP client                   |
| date-fns                  | Date utilities                |
| Sonner                    | Toast notifications           |
| Recharts                  | Charts and data visualization |
| xlsx                      | Excel export functionality    |
| MSW (Mock Service Worker) | API mocking for development   |
| Playwright                | End-to-end testing            |

### Cấu trúc thư mục

```
QuanLyBenhVien/
├── app/                         # Next.js App Router (Pages)
│   ├── (auth)/                  # Auth pages group
│   │   ├── login/               # Login page
│   │   ├── signup/              # Registration page
│   │   └── password-reset/      # Password reset page
│   ├── admin/                   # Admin portal (~48 screens)
│   │   ├── page.tsx             # Admin dashboard
│   │   ├── patients/            # Patient management
│   │   ├── appointments/        # Appointment management
│   │   ├── billing/             # Billing & invoices
│   │   ├── exams/               # Medical examinations
│   │   ├── hr/                  # Human resources (employees, departments)
│   │   ├── medicines/           # Medicine inventory
│   │   ├── lab-tests/           # Lab test types
│   │   ├── lab-orders/          # Lab orders management
│   │   ├── lab-results/         # Lab results
│   │   ├── queue/               # Patient queue
│   │   ├── walk-in/             # Walk-in registration
│   │   ├── reports/             # Reports & analytics
│   │   ├── accounts/            # User accounts management
│   │   └── profile/             # Admin profile
│   ├── doctor/                  # Doctor portal (~22 screens)
│   │   ├── appointments/        # Doctor's appointments
│   │   ├── queue/               # Doctor's patient queue
│   │   ├── exams/               # Medical examinations
│   │   ├── patients/            # Doctor's patients
│   │   ├── lab-orders/          # Lab orders
│   │   ├── lab-results/         # Lab results
│   │   ├── schedules/           # Work schedules
│   │   ├── reports/             # Doctor's reports
│   │   └── profile/             # Doctor profile
│   ├── nurse/                   # Nurse portal (2 screens)
│   │   ├── appointments/        # Nurse appointments (vital signs)
│   │   └── lab-orders/          # Lab orders processing
│   ├── patient/                 # Patient portal (~17 screens)
│   │   ├── appointments/        # Book & manage appointments
│   │   ├── medical-records/     # Medical history
│   │   ├── prescriptions/       # Prescriptions
│   │   ├── billing/             # Patient billing
│   │   ├── lab-results/         # Lab results
│   │   └── profile/             # Patient profile
│   ├── profile/                 # Shared profile route
│   ├── payment/                 # Payment callback (VNPay)
│   ├── demo/                    # Demo UI components
│   ├── layout.tsx               # Root layout
│   ├── page.tsx                 # Landing page
│   └── globals.css              # Global styles
├── components/                  # Reusable React components
│   ├── ui/                      # shadcn/ui base components
│   ├── appointment/             # Appointment-related components
│   ├── billing/                 # Billing components
│   ├── hr/                      # HR components
│   ├── lab/                     # Lab components
│   ├── medical-exam/            # Medical exam components
│   ├── nurse/                   # Nurse-specific components
│   ├── patients/                # Patient components
│   ├── reports/                 # Report components
│   ├── shared/                  # Shared components (Header, Sidebar, etc.)
│   ├── auth/                    # Auth components
│   └── landing/                 # Landing page components
├── hooks/                       # Custom React hooks
│   ├── queries/                 # TanStack Query hooks
│   ├── use-mobile.ts            # Mobile detection hook
│   └── useDebounce.ts           # Debounce hook
├── services/                    # API service layer
│   ├── auth.service.ts          # Authentication API
│   ├── patient.service.ts       # Patient API
│   ├── appointment.service.ts   # Appointment API
│   ├── billing.service.ts       # Billing API
│   ├── medical-exam.service.ts  # Medical exam API
│   ├── employee.service.ts      # Employee API
│   ├── medicine.service.ts      # Medicine API
│   ├── lab.service.ts           # Lab API
│   ├── lab-order.service.ts     # Lab order API
│   ├── queue.service.ts         # Queue API
│   ├── reports.service.ts       # Reports API
│   ├── hr.service.ts            # HR API
│   └── category.service.ts      # Category API
├── interfaces/                  # TypeScript type definitions
│   ├── patient.ts               # Patient types
│   ├── appointment.ts           # Appointment types
│   ├── billing.ts               # Billing types
│   ├── medical-exam.ts          # Medical exam types
│   ├── employee.ts              # Employee types
│   ├── medicine.ts              # Medicine types
│   ├── hr.ts                    # HR types
│   ├── reports.ts               # Reports types
│   ├── category.ts              # Category types
│   └── pagination.ts            # Pagination types
├── lib/                         # Utility libraries
│   ├── utils.ts                 # General utilities
│   ├── table-utils.tsx          # Table utilities
│   ├── constants/               # Constants
│   ├── schemas/                 # Zod validation schemas
│   ├── utils/                   # Specific utilities
│   └── mocks/                   # Mock data generators
├── contexts/                    # React Context providers
│   └── AuthContext.tsx          # Authentication context
├── config/                      # Configuration files
│   ├── axios.ts                 # Axios configuration
│   └── icons.ts                 # Icon mappings
├── mocks/                       # MSW mock setup
│   ├── browser.ts               # Browser MSW setup
│   └── handlers/                # API mock handlers
├── public/                      # Static assets
│   └── mockServiceWorker.js     # MSW service worker
├── tests/                       # Test files
│   └── e2e/                     # Playwright E2E tests
├── DOCS/                        # Documentation
│   ├── api-contracts-complete.md
│   ├── data-models-complete.md
│   ├── TEST_ACCOUNTS.md
│   ├── CONTRIBUTING.md
│   ├── design_guidelines.md
│   └── fe-specs/                # Frontend specifications
├── next.config.ts               # Next.js configuration
├── tailwind.config.ts           # Tailwind configuration
├── tsconfig.json                # TypeScript configuration
├── package.json                 # Dependencies
└── README.md                    # This file
```

### Tổng số màn hình

| Portal         | Số màn hình     | Mô tả                            |
| -------------- | --------------- | -------------------------------- |
| Admin          | ~48 screens     | Quản lý toàn hệ thống            |
| Doctor         | ~22 screens     | Khám bệnh, kê đơn, xem bệnh nhân |
| Nurse          | 2 screens       | Vital signs, lab orders          |
| Patient        | ~17 screens     | Đặt lịch, xem hồ sơ, thanh toán  |
| Auth           | 3 screens       | Login, signup, password reset    |
| Profile (root) | 1 screen        | Shared profile route             |
| **Tổng**       | **~93 screens** | **Toàn bộ ứng dụng**             |

### Backend Integration

**API Gateway**: `http://localhost:8080`

**Microservices Architecture**:

- **Auth Service** (8081): `/api/auth/**` - Authentication & Authorization
- **Patient Service** (8082): `/api/patients/**` - Patient management
- **Medicine Service** (8083): `/api/medicines/**` - Medicine inventory
- **HR Service** (8084): `/api/hr/**` - Human Resources
- **Appointment Service** (8085): `/api/appointments/**` - Appointments
- **Medical Exam Service** (8086): `/api/exams/**` - Medical examinations
- **Billing Service** (8087): `/api/billing/**` - Billing & payments
- **Lab Service** (8088): `/api/lab/**` - Lab tests & results

**Authentication**:

- JWT Bearer tokens via API Gateway
- Headers injected: `X-User-ID`, `X-User-Role`, `X-User-Email`
- Token storage: HTTP-only cookies + localStorage

**API Documentation**: Xem [`DOCS/api-contracts-complete.md`](DOCS/api-contracts-complete.md)

### Development Mode

**With Backend** (Production-like):

```bash
# Backend running on port 8080
pnpm dev
# Frontend will use real API
```

**Without Backend** (Mock Mode):

```bash
# No backend required
pnpm dev
# MSW automatically activates and serves mock data
# Check browser console for "[MSW] Mocking enabled"
```

**Testing**:

```bash
# Run E2E tests
pnpm test:e2e

# Run E2E with UI
npx playwright test --ui

# Generate test report
npx playwright show-report
```

---

## 💡 Đề xuất phát triển

### Tính năng mới

1. **Real-time notifications** - WebSocket cho thông báo
2. **Mobile App** - React Native cho bệnh nhân
3. **Nhắc nhở SMS/Email** - Tự động nhắc lịch hẹn
4. **Telemedicine** - Khám từ xa qua video
5. **Multi-branch** - Hỗ trợ nhiều chi nhánh

### Cải tiến

1. **Dark mode** - Chế độ tối
2. **Multi-language** - Đa ngôn ngữ
3. **PWA** - Progressive Web App
4. **Offline mode** - Làm việc offline
5. **Export PDF** - Xuất báo cáo PDF

### Bảo mật

1. **2FA** - Xác thực 2 bước
2. **Audit log** - Ghi log mọi thao tác
3. **Data encryption** - Mã hóa dữ liệu

---

## 📞 Liên hệ & Hỗ trợ

- **API Contracts**: [`DOCS/api-contracts-complete.md`](DOCS/api-contracts-complete.md)
- **Data Models**: [`DOCS/data-models-complete.md`](DOCS/data-models-complete.md)
- **Test Accounts**: [`DOCS/TEST_ACCOUNTS.md`](DOCS/TEST_ACCOUNTS.md)

## 📝 License

This project is part of academic coursework for Software Engineering course.

---

_Cập nhật lần cuối: 03/01/2026_  
_Phiên bản: 1.0.0_  
_Next.js 16.0.5 | React 19.2.0 | TypeScript 5.x_

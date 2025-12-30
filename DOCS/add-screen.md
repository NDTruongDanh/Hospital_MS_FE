Dựa trên 
lab.ts
, tôi sẽ phân tích và đề xuất UI còn thiếu:

📊 Phân tích Interface Lab.ts
1. LabTest (Danh mục xét nghiệm)
typescript
- code, name, category, description
- price, unit, normalRange
- isActive (active/inactive)
Dùng cho: Admin quản lý catalog xét nghiệm

2. LabOrder (Đơn chỉ định xét nghiệm)
typescript
- orderNumber, medicalExamId
- patientId/Name, orderingDoctorId/Name
- orderDate, status, priority, notes
- results[] (danh sách xét nghiệm)
- totalTests, completedTests, pendingTests
Dùng cho: Bác sĩ chỉ định, Lab nhận đơn

3. LabTestResult (Kết quả xét nghiệm)
typescript
- labTestCode/Name, category
- resultValue, isAbnormal, interpretation
- status, performedBy, interpretedBy
- performedAt, completedAt
- images[] (hình ảnh chẩn đoán)
Dùng cho: Lab nhập kết quả, Bác sĩ/BN xem

4. DiagnosticImage (Hình ảnh chẩn đoán)
typescript
- fileName, storagePath, contentType, fileSize
- imageType (XRAY, CT_SCAN, MRI, etc.)
- thumbnailPath, downloadUrl
- description, uploadedBy
Dùng cho: Upload/view X-quang, CT, MRI

🎯 Đề xuất UI cần tạo
ADMIN ROLE
1. /admin/lab-tests - Quản lý danh mục xét nghiệm
Mục đích: CRUD LabTest

✅ Tạo mới xét nghiệm
✅ Sửa thông tin (giá, đơn vị, chỉ số bình thường)
✅ Active/Deactive
✅ Lọc theo category (LAB/IMAGING/PATHOLOGY)
✅ Tìm theo code/name
DOCTOR ROLE
2. /doctor/medical-exam/[id] - Chi tiết phiếu khám
Tab mới: "Chỉ định XN"

✅ Chọn nhiều xét nghiệm (checkbox)
✅ Phân loại theo category
✅ Set priority (NORMAL/URGENT)
✅ Ghi chú
✅ Tạo LabOrder với nhiều tests
3. /doctor/lab-orders - Danh sách đơn XN đã chỉ định
✅ Xem orders đã tạo
✅ Filter: status, priority, date
✅ Xem kết quả (khi có)
LAB TECHNICIAN ROLE
4. /lab/orders - Danh sách đơn xét nghiệm
Mục đích: Quản lý orders

✅ Danh sách orders: ORDERED, IN_PROGRESS, COMPLETED
✅ Priority badge (URGENT = đỏ)
✅ Tổng kết: X/Y tests completed
✅ Click → Chi tiết đơn
5. /lab/orders/[orderId] - Chi tiết đơn xét nghiệm
Mục đích: Nhập kết quả từng test

✅ Thông tin patient, doctor, orderDate
✅ Danh sách tests trong order
✅ Nhập kết quả cho từng test:
   - resultValue
   - isAbnormal checkbox
   - interpretation (text area)
   - Upload images (XRAY, CT_SCAN, etc.)
   - performedBy, status
✅ Auto update order status khi all tests COMPLETED
6. /lab/imaging - Upload hình ảnh chẩn đoán
Đặc biệt cho IMAGING category

✅ Upload multiple images
✅ Chọn imageType (XRAY, CT_SCAN, MRI, ULTRASOUND)
✅ Add description
✅ Preview thumbnail
✅ Viewer với zoom/pan
PATIENT ROLE
7. /patient/lab-results - Kết quả xét nghiệm của tôi
✅ Danh sách orders (group by date)
✅ Status badge
✅ Click → Chi tiết kết quả
8. /patient/lab-results/[orderId] - Chi tiết kết quả
✅ Thông tin đơn (ngày, bác sĩ)
✅ Danh sách kết quả:
   - Test name
   - Result value
   - Normal range (so sánh)
   - isAbnormal highlight (đỏ)
   - Interpretation
✅ View/Download images
✅ Download PDF report
RECEPTIONIST ROLE
9. Tab "Xét nghiệm" trong /receptionist/patients/[id]
✅ Lịch sử orders của BN
✅ Kết quả mới nhất
✅ Quick view abnormal results
📋 Tổng kết đề xuất
Role	Pages	Priority
Admin	Lab Tests Management	🔴 HIGH
Doctor	Order Lab Tests (in Exam page)	🔴 HIGH
Lab Tech	Order Queue + Result Entry	🔴 HIGH
Lab Tech	Imaging Upload/Viewer	🟡 MEDIUM
Patient	My Lab Results	🟢 LOW
Receptionist	Patient Lab History Tab	🟢 LOW
🎨 Component reusables cần tạo
LabTestSelector - Multi-select xét nghiệm với category tabs
LabResultForm - Form nhập kết quả (value, abnormal, notes)
ImageUploader - Upload images với type selector
DiagnosticImageViewer - Xem ảnh X-quang/CT với zoom
LabOrderCard - Card hiển thị order với progress
LabResultTable - Bảng kết quả với highlight abnormal
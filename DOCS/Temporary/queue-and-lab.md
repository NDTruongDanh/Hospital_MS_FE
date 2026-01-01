# Implementation Plan: Complete Queue & Lab Order System

## Overview
Implement complete frontend workflows utilizing ALL backend capabilities for:
1. **Patient Queue System** - Full walk-in flow from reception to completion
2. **Lab Order System** - Order → Perform → Complete cycle
3. **Lab Test Results** - Grouped display with status tracking

---

## Backend API Summary

### Appointment Service (Queue)
| Endpoint | Method | Description | Roles |
|----------|--------|-------------|-------|
| `/appointments/walk-in` | POST | Register walk-in patient | RECEPTIONIST, ADMIN |
| `/appointments/queue/doctor/{doctorId}` | GET | Get doctor's queue today | DOCTOR, NURSE, RECEPTIONIST, ADMIN |
| `/appointments/queue/next/{doctorId}` | GET | Get next patient in queue | DOCTOR, NURSE |
| `/appointments/queue/call-next/{doctorId}` | PATCH | Call next patient (→ IN_PROGRESS) | DOCTOR |
| `/appointments/{id}/complete` | PATCH | Complete appointment | DOCTOR |
| `/appointments/{id}/cancel` | PATCH | Cancel appointment | ALL |

### Medical Exam Service (Lab)
| Endpoint | Method | Description | Roles |
|----------|--------|-------------|-------|
| `/exams/lab-tests/all` | GET | List all lab test types | ALL |
| `/exams/lab-tests/active` | GET | Active tests for dropdown | ALL |
| `/exams/lab-tests/category/{cat}` | GET | Tests by category | ALL |
| `/exams/lab-orders/all` | GET | List all lab orders | DOCTOR, NURSE, ADMIN |
| `/exams/lab-orders/{id}` | GET | Get order with results | ALL |
| `/exams/lab-orders/exam/{examId}` | GET | Orders for a medical exam | DOCTOR, NURSE |
| `/exams/lab-orders/patient/{patientId}` | GET | Orders for a patient | DOCTOR, PATIENT |
| `/exams/lab-orders` | POST | Create order (multi-test) | DOCTOR |
| `/exams/lab-orders/{id}` | PUT | Update order status | DOCTOR, NURSE |
| `/exams/lab-results/{id}` | PUT | Update test result | DOCTOR, NURSE, LAB_TECH |
| `/exams/lab-results/{id}/images` | POST | Upload diagnostic images | DOCTOR, NURSE |

---

## Complete Workflows

### 1. PATIENT QUEUE FLOW

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ RECEPTIONIST│───▶│   WAITING   │───▶│   DOCTOR    │───▶│  COMPLETED  │
│ Walk-in Reg │    │   QUEUE     │    │   EXAM      │    │             │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
     ▼                   ▼                   ▼                  ▼
 POST /walk-in     GET /queue/doctor   PATCH /call-next   PATCH /complete
                                       POST /exams
```

#### Step 1: Reception Registration (RECEPTIONIST)
**Page**: `/admin/walk-in` (existing) or `/admin/queue/register`
**API**: `POST /appointments/walk-in`
```json
{
  "patientId": "patient-uuid",
  "doctorId": "doctor-uuid", 
  "reason": "Đau đầu, sốt",
  "priorityReason": "ELDERLY" // Optional: ELDERLY, PREGNANT, DISABILITY
}
```
**Result**: Creates appointment with:
- `status: SCHEDULED`
- `queueNumber: auto-generated (1, 2, 3...)`
- `type: WALK_IN`
- `priority: calculated (10-100)`

#### Step 2: Queue Display (DOCTOR/NURSE)
**Page**: `/admin/queue` or `/doctor/queue`
**API**: `GET /appointments/queue/doctor/{doctorId}`
**Display**:
- Queue number (STT)
- Patient name
- Priority badge (🔴 Emergency / 🟡 Priority / ⚪ Normal)
- Wait time (calculated from appointmentTime)
- Status (Chờ / Đang khám)

**Sorting**: By priority ASC, then queueNumber ASC

#### Step 3: Call Patient (DOCTOR)
**Page**: `/admin/queue` or `/doctor/queue`
**API**: `PATCH /appointments/queue/call-next/{doctorId}`
**Action**: 
- Changes next patient status to `IN_PROGRESS`
- Button: "Gọi bệnh nhân tiếp"
- Shows called patient info prominently

#### Step 4: Start Exam (DOCTOR)
**Action**: Click "Bắt đầu khám" → Navigate to `/doctor/exams/create?appointmentId={id}`
**API**: `POST /exams` (create medical exam)

#### Step 5: Complete (DOCTOR)
**API**: `PATCH /appointments/{id}/complete`
**Result**: `status → COMPLETED`, removed from queue

---

### 2. LAB ORDER FLOW

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   DOCTOR    │───▶│ NURSE/LAB   │───▶│  LAB TECH   │───▶│   DOCTOR    │
│ Order Tests │    │ Collect     │    │ Run Tests   │    │ Review      │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
     ▼                   ▼                   ▼                  ▼
 POST /lab-orders   PUT status=      PUT result=         View in exam
                    SAMPLE_COLLECTED  COMPLETED          detail page
```

#### Step 1: Doctor Orders Tests
**Page**: Medical exam detail → "Order Lab Tests" button
**API**: `POST /exams/lab-orders`
```json
{
  "medicalExamId": "exam-uuid",
  "labTestIds": ["test-1-uuid", "test-2-uuid", "test-3-uuid"],
  "priority": "NORMAL", // NORMAL, URGENT, STAT
  "notes": "Kiểm tra chức năng gan"
}
```
**Result**: Creates LabOrder with:
- `orderNumber: XN-20241231-001`
- `status: ORDERED`
- Multiple [LabTestResult](file:///d:/1_Hoc_Tap/1_1_Dai_Hoc/Tai_lieu_ki_1_nam_3/CongNghePhanMemChuyenSau/HMS-total/HMS_Backend/medical-exam-service/src/main/java/com/hms/medical_exam_service/controllers/LabTestResultController.java#34-141) records (one per test)

#### Step 2: Nurse/Lab Tech Performs Tests
**Page**: `/admin/lab-orders` (Lab Orders Queue)
**Actions**:
1. View pending orders
2. Update individual test status:
   - `PENDING` → `PROCESSING` (bắt đầu xét nghiệm)
   - `PROCESSING` → `COMPLETED` (hoàn thành)
3. Enter result values
4. Upload diagnostic images (X-ray, ultrasound, etc.)

**API**: `PUT /exams/lab-results/{id}`
```json
{
  "status": "COMPLETED",
  "resultValue": "15.5 g/dL",
  "isAbnormal": false,
  "interpretation": "Bình thường",
  "notes": "Không có bất thường"
}
```

**API**: `POST /exams/lab-results/{id}/images`
- Upload X-ray, CT scan, MRI images

#### Step 3: Doctor Reviews Results
**Page**: Medical exam detail → Lab Results section
**Display**:
- Grouped by LabOrder (Phiếu xét nghiệm)
- Progress: 2/3 completed
- Results with normal/abnormal flags
- Diagnostic images

---

### 3. LAB RESULTS GROUPED DISPLAY

```
┌────────────────────────────────────────────────────┐
│ Phiếu xét nghiệm: XN-20241231-001                  │
│ ┌────────────────────────────────────────────────┐ │
│ │ ✅ Công thức máu (HC-01)       15.5 g/dL      │ │
│ │ ✅ Đường huyết (BC-01)         95 mg/dL       │ │
│ │ ⏳ Chức năng gan (LIV-01)      Đang xử lý     │ │
│ └────────────────────────────────────────────────┘ │
│ Tiến độ: 2/3 hoàn thành                           │
└────────────────────────────────────────────────────┘
```

---

## Files to Create/Modify

### Services & Hooks
```
services/
  queue.service.ts           # Walk-in, queue APIs
  lab-order.service.ts       # Lab order CRUD APIs

hooks/queries/
  useQueue.ts               # React Query hooks for queue
  useLabOrder.ts            # React Query hooks for lab orders
```

### Interfaces
```
interfaces/
  queue.ts                  # WalkInRequest, QueueItem
  lab-order.ts              # LabOrder, LabOrderRequest, etc.
```

### Pages
```
app/admin/
  queue/
    page.tsx               # Queue dashboard (Receptionist view)
    register/page.tsx      # Walk-in registration form
  lab-orders/
    page.tsx               # Lab orders list (filterable)
    [id]/page.tsx          # Lab order detail

app/doctor/
  queue/
    page.tsx               # Doctor's personal queue
  
app/nurse/
  lab-orders/
    page.tsx               # Lab work queue for nurses
```

### Component Modifications
```
components/
  queue/
    QueueCard.tsx          # Single queue item
    QueueList.tsx          # Queue list with refresh
    WalkInForm.tsx         # Walk-in registration form
    
  lab/
    LabOrderCard.tsx       # Order card with progress
    LabResultEntry.tsx     # Form to enter result
    OrderLabTestDialog.tsx # MODIFY: Use LabOrder API
    LabResultsSection.tsx  # MODIFY: Group by order
```

---

## Priority & Effort

| Feature | Priority | Effort | Dependencies |
|---------|----------|--------|--------------|
| Queue Register (Receptionist) | HIGH | 2h | None |
| Queue Display (Doctor) | HIGH | 3h | Queue Register |
| Lab Order Creation | HIGH | 2h | None |
| Lab Result Entry (Nurse) | HIGH | 4h | Lab Order |
| Grouped Results Display | MEDIUM | 3h | Lab Order |
| Lab Orders List Page | MEDIUM | 2h | Lab Order |

---

## Verification Plan

### End-to-End Test Scenario
1. **Reception**: Register walk-in patient → Verify queue number assigned
2. **Doctor Queue**: See patient in queue sorted correctly
3. **Doctor Call**: Call next → Status changes to IN_PROGRESS
4. **Create Exam**: Start exam from queue
5. **Order Labs**: Create lab order with 3 tests
6. **Nurse Work**: Update test results, upload images
7. **Doctor Review**: See completed results in exam detail
8. **Patient View**: Patient sees their lab results (read-only)
9. **Complete**: Mark appointment complete → Removed from queue

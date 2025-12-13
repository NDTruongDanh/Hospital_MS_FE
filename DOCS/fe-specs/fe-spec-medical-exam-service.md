# Medical Exam Service - Frontend Specification

**Project:** Hospital Management System  
**Service:** Medical Exam Service (Examination Records & Prescriptions)  
**Version:** 1.0  
**Last Updated:** December 4, 2025  
**Target Users:** ADMIN, DOCTOR (primary), NURSE (view), PATIENT (own records only)

---

## 1. Overview & Screen Inventory

### 1.1 Service Scope

The Medical Exam Service manages medical examination records created after completed appointments. It provides:

- Medical exam creation (diagnosis, symptoms, treatment, vitals)
- Medical exam viewing and listing with filters
- Medical exam updates (within 24-hour window)
- Prescription creation (medicines, dosage, instructions)
- Prescription viewing (immutable after creation)
- Patient medical history access

### 1.2 Related Backend

| Item          | Value                                                  |
| ------------- | ------------------------------------------------------ |
| **Service**   | medical-exam-service                                   |
| **Port**      | 8086                                                   |
| **Base Path** | `/api/exams`                                           |
| **Database**  | `medical_exam_db`                                      |
| **Tables**    | `medical_exams`, `prescriptions`, `prescription_items` |

### 1.3 Cross-Service Dependencies

| Service                 | Purpose                  | Endpoints Used                                                         |
| ----------------------- | ------------------------ | ---------------------------------------------------------------------- |
| **Appointment Service** | Completed appointments   | `GET /api/appointments/{id}`, `GET /api/appointments?status=COMPLETED` |
| **Patient Service**     | Patient details          | `GET /api/patients/{id}`                                               |
| **Medicine Service**    | Medicine catalog & stock | `GET /api/medicines`, `PATCH /api/medicines/{id}/stock`                |
| **Billing Service**     | Invoice generation       | Auto-triggered on prescription creation                                |

### 1.4 Screen Inventory

| Route                             | Screen Name          | Component                   | Access               | Priority |
| --------------------------------- | -------------------- | --------------------------- | -------------------- | -------- |
| `/admin/exams`                    | Medical Exams List   | `MedicalExamListPage`       | ADMIN, NURSE         | P0       |
| `/admin/exams/{id}`               | Exam Detail          | `MedicalExamDetailPage`     | ADMIN, DOCTOR, NURSE | P0       |
| `/doctor/exams`                   | My Exams (Doctor)    | `DoctorExamListPage`        | DOCTOR               | P0       |
| `/doctor/exams/new`               | Create Exam          | `MedicalExamFormPage`       | DOCTOR               | P0       |
| `/doctor/exams/{id}`              | Exam Detail (Doctor) | `MedicalExamDetailPage`     | DOCTOR               | P0       |
| `/doctor/exams/{id}/edit`         | Edit Exam            | `MedicalExamFormPage`       | DOCTOR               | P1       |
| `/doctor/exams/{id}/prescription` | Create Prescription  | `PrescriptionFormPage`      | DOCTOR               | P0       |
| `/patient/medical-records`        | My Medical Records   | `PatientMedicalRecordsPage` | PATIENT              | P0       |
| `/patient/medical-records/{id}`   | Record Detail        | `MedicalExamDetailPage`     | PATIENT              | P1       |
| `/patient/prescriptions`          | My Prescriptions     | `PatientPrescriptionsPage`  | PATIENT              | P1       |
| `/patient/prescriptions/{id}`     | Prescription Detail  | `PrescriptionDetailPage`    | PATIENT              | P1       |

### 1.5 Screen Hierarchy Diagram

```
/admin
└── /exams
    ├── (list view with DataTable - all exams)
    └── /{id} (detail view - read only)

/doctor
└── /exams
    ├── (list view - doctor's own exams)
    ├── /new (form - create exam from completed appointment)
    ├── /{id} (detail view with edit/prescription actions)
    ├── /{id}/edit (form - edit within 24 hours)
    └── /{id}/prescription (form - create prescription)

/patient
├── /medical-records
│   ├── (list view - patient's own exams)
│   └── /{id} (detail view - read only)
└── /prescriptions
    ├── (list view - patient's own prescriptions)
    └── /{id} (detail view - read only)
```

---

## 2. User Flows & Acceptance Criteria

### 2.1 Flow: Create Medical Exam (Doctor)

```
┌─────────────────────────────────────────────────────────────┐
│ Doctor completes appointment (marks as COMPLETED)           │
│                          ↓                                  │
│ System prompts: "Create Medical Exam Record?"               │
│                          ↓                                  │
│ Doctor clicks "Create Exam"                                 │
│     → Navigate to /doctor/exams/new?appointmentId={id}      │
│                          ↓                                  │
│ System fetches appointment details and displays:            │
│   - Patient info (read-only, from appointment)              │
│   - Doctor info (read-only, from appointment)               │
│   - Appointment details (read-only, from appointment)       │
│   - NO appointment selector shown                           │
│                          ↓                                  │
│ Doctor enters clinical data:                                │
│   - Diagnosis (primary medical condition)                   │
│   - Symptoms (patient-reported)                             │
│   - Treatment plan                                          │
│   - Vitals (temperature, BP, heart rate, weight, height)    │
│   - Notes (additional observations)                         │
│                          ↓                                  │
│ Doctor clicks "Save Exam"                                   │
│         ↓                              ↓                    │
│   [Validation Pass]            [Validation Fail]            │
│         ↓                              ↓                    │
│   POST /api/exams               Show field errors           │
│         ↓                                                   │
│   ┌─────────┐    ┌──────────────┐                          │
│   │ Success │    │    Error     │                          │
│   └────┬────┘    └──────┬───────┘                          │
│        ↓                ↓                                   │
│   Toast "Created"   Toast error message                     │
│        ↓            Stay on form                            │
│   Prompt: "Add Prescription?"                               │
│         ↓                    ↓                              │
│   [Add Prescription]    [Later]                             │
│         ↓                    ↓                              │
│   /doctor/exams/      /doctor/exams/{id}                    │
│   {id}/prescription   (detail page)                         │
└─────────────────────────────────────────────────────────────┘
```

**Acceptance Criteria:**

- [ ] Can only create exam for COMPLETED appointments
- [ ] When `appointmentId` exists in URL query, auto-fetch and display appointment details
- [ ] Appointment selector is hidden (not shown)
- [ ] Patient and Doctor info displayed as read-only (cannot change)
- [ ] Appointment details (date, time, reason) shown in read-only section
- [ ] Form focuses on clinical data entry (Diagnosis, Symptoms, Treatment, Vitals, Notes)
- [ ] Vitals section with proper input types and ranges:
  - Temperature: 30.0 - 45.0 °C (decimal input)
  - Blood Pressure Systolic: 50 - 250 mmHg (integer)
  - Blood Pressure Diastolic: 30 - 150 mmHg (integer)
  - Heart Rate: 30 - 200 bpm (integer)
  - Weight: > 0 kg (decimal)
  - Height: > 0 cm (decimal)
- [ ] All text fields have max length validation (2000 chars for diagnosis, symptoms, treatment, notes)
- [ ] Error 400 APPOINTMENT_NOT_COMPLETED: Show "Appointment must be completed first"
- [ ] Error 409 EXAM_EXISTS: Show "Medical exam already exists for this appointment"
- [ ] Error 404 APPOINTMENT_NOT_FOUND: Show "Appointment not found"
- [ ] Success: Toast "Medical exam created successfully"
- [ ] After creation, show dialog: "Add Prescription?" with options "Add Prescription" or "Later"

---

### 2.2 Flow: View Medical Exam Detail

```
┌─────────────────────────────────────────────────────────────┐
│ User navigates to exam detail page                          │
│                          ↓                                  │
│ System fetches exam (GET /api/exams/{id})                   │
│         ↓                              ↓                    │
│   [Found]                        [Not Found]                │
│      ↓                                ↓                     │
│   Display detail                 Show 404 page              │
│      ↓                                                      │
│   Show sections:                                            │
│   - Patient & Doctor info                                   │
│   - Appointment info                                        │
│   - Diagnosis, Symptoms, Treatment                          │
│   - Vitals panel                                            │
│   - Notes                                                   │
│   - Prescription (if exists, with link)                     │
│      ↓                                                      │
│   Show actions based on role & time:                        │
│   - DOCTOR (creator, < 24h): Edit, Add Prescription         │
│   - DOCTOR (creator, > 24h): Add Prescription only          │
│   - ADMIN: View only                                        │
│   - PATIENT: View only                                      │
└─────────────────────────────────────────────────────────────┘
```

**Acceptance Criteria:**

- [ ] Display all exam data in organized sections
- [ ] Vitals displayed in visual cards/grid with icons
- [ ] Show "Edit" button only for creator doctor within 24 hours
- [ ] Show "Add Prescription" button if no prescription exists (doctor only)
- [ ] Show prescription summary if exists, with "View Full Prescription" link
- [ ] Error 403 FORBIDDEN: Redirect to 403 page (patients can only view own)
- [ ] Error 404 EXAM_NOT_FOUND: Show 404 page
- [ ] Back button navigates to appropriate list

---

### 2.3 Flow: Edit Medical Exam (Within 24 Hours)

```
┌─────────────────────────────────────────────────────────────┐
│ Doctor clicks "Edit" on exam detail                         │
│                          ↓                                  │
│ Check: Is exam < 24 hours old?                              │
│         ↓                              ↓                    │
│   [Yes]                          [No]                       │
│      ↓                              ↓                       │
│   Navigate to edit form      Show message: "Cannot edit     │
│      ↓                       exam after 24 hours"           │
│   Pre-fill form with existing data                          │
│      ↓                                                      │
│   Doctor modifies fields                                    │
│      ↓                                                      │
│   Doctor clicks "Save Changes"                              │
│         ↓                              ↓                    │
│   PATCH /api/exams/{id}         [Error]                     │
│         ↓                          ↓                        │
│   [Success]                    Show error                   │
│      ↓                                                      │
│   Toast "Updated"                                           │
│   Navigate to detail                                        │
└─────────────────────────────────────────────────────────────┘
```

**Acceptance Criteria:**

- [ ] "Edit" button only visible within 24-hour window
- [ ] Countdown timer showing remaining edit time
- [ ] Patient, Doctor, Appointment fields are read-only
- [ ] All other fields editable with same validation as create
- [ ] Error 400 EXAM_NOT_MODIFIABLE: Show "Cannot modify exam after 24 hours"
- [ ] Error 403 FORBIDDEN: Show "Only the doctor who created this exam can edit it"
- [ ] Success: Toast "Medical exam updated successfully"

---

### 2.4 Flow: Create Prescription

```
┌─────────────────────────────────────────────────────────────┐
│ Doctor clicks "Add Prescription" on exam detail             │
│                          ↓                                  │
│ Navigate to /doctor/exams/{id}/prescription                 │
│                          ↓                                  │
│ System shows prescription form with:                        │
│   - Exam info (read-only)                                   │
│   - Medicine search/add interface                           │
│   - Prescription notes field                                │
│                          ↓                                  │
│ Doctor adds medicines:                                      │
│   1. Search medicine by name                                │
│   2. Select medicine from dropdown                          │
│   3. Enter: Quantity, Dosage, Duration, Instructions        │
│   4. Repeat for more medicines                              │
│                          ↓                                  │
│ Doctor clicks "Create Prescription"                         │
│         ↓                              ↓                    │
│   POST /api/exams/{examId}/prescriptions                    │
│         ↓                              ↓                    │
│   [Success]                      [Error]                    │
│      ↓                              ↓                       │
│   Toast "Created"            Show error message             │
│   Navigate to exam detail                                   │
│   (Invoice auto-generated)                                  │
└─────────────────────────────────────────────────────────────┘
```

**Acceptance Criteria:**

- [ ] Can only create prescription for exams without existing prescription
- [ ] Medicine search with autocomplete (name, active ingredient)
- [ ] Show medicine stock availability when selecting
- [ ] Warn if quantity exceeds available stock
- [ ] Prescription item fields:
  - Medicine (required, searchable select)
  - Quantity (required, positive integer, <= available stock)
  - Dosage (required, text, e.g., "1 tablet twice daily")
  - Duration Days (optional, positive integer)
  - Instructions (optional, text)
- [ ] Can add multiple medicines (dynamic form)
- [ ] Can remove medicines before submission
- [ ] Error 400 INSUFFICIENT_STOCK: Show "Not enough stock for {medicine name}"
- [ ] Error 404 MEDICINE_NOT_FOUND: Show "Medicine not found"
- [ ] Error 409 PRESCRIPTION_EXISTS: Show "Prescription already exists for this exam"
- [ ] Success: Toast "Prescription created successfully", invoice auto-generated
- [ ] Prescription is IMMUTABLE after creation (no edit functionality)

---

### 2.5 Flow: View Prescription Detail

```
┌─────────────────────────────────────────────────────────────┐
│ User clicks "View Prescription" on exam detail              │
│                          ↓                                  │
│ System fetches prescription (GET /api/exams/{examId}/prescription)
│         ↓                              ↓                    │
│   [Found]                        [Not Found]                │
│      ↓                                ↓                     │
│   Display prescription           Show "No prescription"     │
│      ↓                                                      │
│   Show:                                                     │
│   - Prescription header (ID, date, doctor)                  │
│   - Medicine items table:                                   │
│     * Medicine name                                         │
│     * Quantity                                              │
│     * Dosage                                                │
│     * Duration                                              │
│     * Instructions                                          │
│     * Unit price (snapshot)                                 │
│   - Total cost summary                                      │
│   - General notes                                           │
│   - Print/Download button                                   │
└─────────────────────────────────────────────────────────────┘
```

**Acceptance Criteria:**

- [ ] Display all prescription items in table format
- [ ] Show unit price snapshot (price at prescription time)
- [ ] Calculate and display total cost
- [ ] Show prescription notes
- [ ] Print-friendly view option
- [ ] No edit functionality (prescriptions are immutable)
- [ ] Patients can only view their own prescriptions
- [ ] Error 403 FORBIDDEN: Redirect to 403 page

---

### 2.6 Flow: View Patient Medical History

```
┌─────────────────────────────────────────────────────────────┐
│ Patient navigates to /patient/medical-records               │
│                          ↓                                  │
│ System loads patient's medical exams                        │
│ (GET /api/exams with auto-filtered patientId)               │
│                          ↓                                  │
│ Display exam cards (sorted by date descending):             │
│   - Exam date                                               │
│   - Doctor name                                             │
│   - Diagnosis summary                                       │
│   - Has prescription indicator                              │
│                          ↓                                  │
│ Patient can filter by date range                            │
│                          ↓                                  │
│ Patient clicks card → Navigate to detail                    │
└─────────────────────────────────────────────────────────────┘
```

**Acceptance Criteria:**

- [ ] Auto-filtered to logged-in patient (cannot see others' records)
- [ ] Card view with key information
- [ ] Date range filter (start date, end date)
- [ ] Sorted by exam date descending (newest first)
- [ ] Prescription indicator icon on cards with prescriptions
- [ ] Empty state: "No medical records found"
- [ ] Click card navigates to read-only detail view

---

### 2.7 Flow: Doctor Views Own Exams

```
┌─────────────────────────────────────────────────────────────┐
│ Doctor navigates to /doctor/exams                           │
│                          ↓                                  │
│ System loads doctor's medical exams                         │
│ (GET /api/exams with auto-filtered doctorId)                │
│                          ↓                                  │
│ Display exam list with:                                     │
│   - Patient name                                            │
│   - Diagnosis                                               │
│   - Exam date                                               │
│   - Has prescription indicator                              │
│   - Edit window status (if < 24h)                           │
│                          ↓                                  │
│ Doctor can filter by date range, patient name               │
│                          ↓                                  │
│ Doctor clicks row → Navigate to detail                      │
│ Doctor clicks "Create New" → Shows completed appointments   │
└─────────────────────────────────────────────────────────────┘
```

**Acceptance Criteria:**

- [ ] Auto-filtered to logged-in doctor's exams
- [ ] Table displays: Patient, Diagnosis, Exam Date, Prescription Status, Actions
- [ ] Show "Editable" badge for exams < 24 hours old
- [ ] Date range filter
- [ ] Search by patient name
- [ ] "Create New Exam" button → shows appointment selector modal
- [ ] Appointment selector shows only COMPLETED appointments without exams

---

### 2.8 Flow: Admin Views All Exams

```
┌─────────────────────────────────────────────────────────────┐
│ Admin navigates to /admin/exams                             │
│                          ↓                                  │
│ System loads all medical exams with pagination              │
│                          ↓                                  │
│ Display exam list with filters:                             │
│   - Patient filter (search)                                 │
│   - Doctor filter (dropdown)                                │
│   - Date range filter                                       │
│                          ↓                                  │
│ Admin clicks row → Navigate to read-only detail             │
└─────────────────────────────────────────────────────────────┘
```

**Acceptance Criteria:**

- [ ] Admin sees all exams (no doctor filter applied)
- [ ] Advanced filters: Patient, Doctor, Date range
- [ ] Pagination: 10, 20, 50 items per page
- [ ] Sort by: Exam Date (default desc), Patient Name, Doctor Name
- [ ] Admin cannot create or edit exams (view only)
- [ ] Can export exam list (CSV) for reporting

---

## 3. Screen Specifications

### 3.1 Medical Exam List Page (Admin)

**Route:** `/admin/exams`  
**Component:** `MedicalExamListPage`  
**Access:** ADMIN, NURSE

#### Layout Structure

```
┌─────────────────────────────────────────────────────────────────────┐
│ Header: "Medical Examinations"                                      │
├─────────────────────────────────────────────────────────────────────┤
│ Filters Row:                                                        │
│ [Search Patient...] [Doctor ▼] [Start Date] [End Date] [Export CSV] │
├─────────────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────────────┐ │
│ │ Patient      │ Doctor       │ Diagnosis     │ Date     │ Rx    │ │
│ ├──────────────┼──────────────┼───────────────┼──────────┼───────┤ │
│ │ Nguyen Van A │ Dr. Hung     │ Hypertension  │ Dec 5    │ 💊    │ │
│ │ Tran Thi B   │ Dr. Mai      │ Common Cold   │ Dec 5    │ -     │ │
│ │ Le Van C     │ Dr. Hung     │ Diabetes T2   │ Dec 4    │ 💊    │ │
│ └─────────────────────────────────────────────────────────────────┘ │
│ Showing 1-10 of 50                              [< 1 2 3 4 5 >]     │
└─────────────────────────────────────────────────────────────────────┘
```

#### Filter Components

| Filter         | Type        | Options                        | Default |
| -------------- | ----------- | ------------------------------ | ------- |
| Search Patient | Text Input  | Patient name search            | Empty   |
| Doctor         | Select      | List of doctors who have exams | All     |
| Start Date     | Date Picker | Any date                       | Empty   |
| End Date       | Date Picker | Any date                       | Empty   |

#### Table Columns

| Column       | Field                      | Sortable           | Width |
| ------------ | -------------------------- | ------------------ | ----- |
| Patient      | `patient.fullName`         | Yes                | 20%   |
| Doctor       | `doctor.fullName`          | Yes                | 20%   |
| Diagnosis    | `diagnosis` (truncated)    | Yes                | 25%   |
| Exam Date    | `examDate`                 | Yes (default desc) | 15%   |
| Prescription | Has prescription indicator | No                 | 10%   |
| Actions      | View button                | No                 | 10%   |

---

### 3.2 Medical Exam Form Page (Create/Edit)

**Route:** `/doctor/exams/new` or `/doctor/exams/{id}/edit`  
**Component:** `MedicalExamFormPage`  
**Access:** DOCTOR (creator for edit)

#### Layout Structure

```
┌─────────────────────────────────────────────────────────────────────┐
│ Header: "Create Medical Exam" / "Edit Medical Exam"                 │
│ (Edit mode: "⏱️ 23h 45m remaining to edit")                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Appointment Information (Auto-loaded from URL)                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ ┌───────────────────────────────────────────────────────┐   │   │
│  │ │ 👤 Patient Information                                │   │   │
│  │ │ Name:     Nguyen Van A                                │   │   │
│  │ │ DOB:      January 15, 1985 (39 years old)             │   │   │
│  │ │ Gender:   Male                                        │   │   │
│  │ └───────────────────────────────────────────────────────┘   │   │
│  │                                                              │   │
│  │ ┌───────────────────────────────────────────────────────┐   │   │
│  │ │ 👨‍⚕️ Doctor Information                                │   │   │
│  │ │ Name:     Dr. Nguyen Van Hung                         │   │   │
│  │ │ Specialty: Cardiology                                 │   │   │
│  │ └───────────────────────────────────────────────────────┘   │   │
│  │                                                              │   │
│  │ ┌───────────────────────────────────────────────────────┐   │   │
│  │ │ 📅 Appointment Details                                │   │   │
│  │ │ Date & Time: December 5, 2025 at 09:00 AM             │   │   │
│  │ │ Type:        Consultation                             │   │   │
│  │ │ Reason:      Chest pain                               │   │   │
│  │ │ Status:      COMPLETED                                │   │   │
│  │ └───────────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────┘   │
│  Note: Appointment data is fetched automatically from URL          │
│        parameter (appointmentId) and displayed as read-only         │
│                                                                     │
│  Clinical Findings                                                  │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ Diagnosis*      [Primary diagnosis / medical condition...  ] │   │
│  │                                                              │   │
│  │ Symptoms        [Patient-reported symptoms...              ] │   │
│  │                                                              │   │
│  │ Treatment       [Treatment plan / recommendations...       ] │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  Vital Signs                                                        │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐            │   │
│  │ │ 🌡️ Temp     │ │ ❤️ HR       │ │ 📊 BP       │            │   │
│  │ │ [36.8] °C   │ │ [78] bpm    │ │ [145]/[95]  │            │   │
│  │ └─────────────┘ └─────────────┘ └─────────────┘            │   │
│  │ ┌─────────────┐ ┌─────────────┐                            │   │
│  │ │ ⚖️ Weight   │ │ 📏 Height   │                            │   │
│  │ │ [75.5] kg   │ │ [175] cm    │                            │   │
│  │ └─────────────┘ └─────────────┘                            │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  Additional Notes                                                   │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ Notes           [Doctor's additional observations...       ] │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│                              [Cancel]  [Save Medical Exam]          │
└─────────────────────────────────────────────────────────────────────┘
```

#### Form Fields

| Field                    | Type      | Required | Validation                                                  | Edit Mode |
| ------------------------ | --------- | -------- | ----------------------------------------------------------- | --------- |
| `appointmentId`          | URL Param | Yes      | Auto-loaded from query string, displayed as read-only cards | Read-only |
| `diagnosis`              | Textarea  | No       | Max 2000 chars                                              | Editable  |
| `symptoms`               | Textarea  | No       | Max 2000 chars                                              | Editable  |
| `treatment`              | Textarea  | No       | Max 2000 chars                                              | Editable  |
| `temperature`            | Number    | No       | 30.0 - 45.0 (°C)                                            | Editable  |
| `bloodPressureSystolic`  | Number    | No       | 50 - 250 (mmHg)                                             | Editable  |
| `bloodPressureDiastolic` | Number    | No       | 30 - 150 (mmHg)                                             | Editable  |
| `heartRate`              | Number    | No       | 30 - 200 (bpm)                                              | Editable  |
| `weight`                 | Number    | No       | > 0 (kg)                                                    | Editable  |
| `height`                 | Number    | No       | > 0 (cm)                                                    | Editable  |
| `notes`                  | Textarea  | No       | Max 2000 chars                                              | Editable  |

#### Vital Signs Validation Ranges

| Vital        | Min  | Max  | Unit | Input Type         |
| ------------ | ---- | ---- | ---- | ------------------ |
| Temperature  | 30.0 | 45.0 | °C   | Decimal (1 place)  |
| BP Systolic  | 50   | 250  | mmHg | Integer            |
| BP Diastolic | 30   | 150  | mmHg | Integer            |
| Heart Rate   | 30   | 200  | bpm  | Integer            |
| Weight       | 0.1  | 500  | kg   | Decimal (2 places) |
| Height       | 1    | 300  | cm   | Decimal (1 place)  |

---

### 3.3 Medical Exam Detail Page

**Route:** `/admin/exams/{id}` or `/doctor/exams/{id}` or `/patient/medical-records/{id}`  
**Component:** `MedicalExamDetailPage`  
**Access:** ADMIN, DOCTOR, NURSE (all), PATIENT (own only)

#### Layout Structure

```
┌─────────────────────────────────────────────────────────────────────┐
│ [← Back]                                              [Edit] [Print]│
│                                      (Edit: doctor only, < 24h)     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────────────────────┐  ┌───────────────────────────┐│
│  │ Medical Exam #EXAM001           │  │ ⏱️ Editable: 18h 30m left ││
│  │ December 5, 2025                │  │ (or "Read-only")          ││
│  └─────────────────────────────────┘  └───────────────────────────┘│
│                                                                     │
│  Patient Information                                                │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ Name:        Nguyen Van A                                    │   │
│  │ DOB:         January 15, 1985 (39 years old)                 │   │
│  │ Gender:      Male                                            │   │
│  │ [View Patient Profile →]                                     │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  Appointment Information                                            │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ Date & Time: December 5, 2025 at 09:00 AM                    │   │
│  │ Type:        Consultation                                    │   │
│  │ Reason:      Chest pain                                      │   │
│  │ [View Appointment →]                                         │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  Clinical Findings                                                  │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ Diagnosis                                                    │   │
│  │ ─────────────────────────────────────────────────────────── │   │
│  │ Hypertension Stage 1                                         │   │
│  │                                                              │   │
│  │ Symptoms                                                     │   │
│  │ ─────────────────────────────────────────────────────────── │   │
│  │ Headache, dizziness, occasional chest discomfort             │   │
│  │                                                              │   │
│  │ Treatment Plan                                               │   │
│  │ ─────────────────────────────────────────────────────────── │   │
│  │ Lifestyle changes, medication, follow-up in 2 weeks          │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  Vital Signs                                                        │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐        │   │
│  │  │ 🌡️ Temp │  │ ❤️ HR   │  │ 📊 BP   │  │ ⚖️ Wt   │        │   │
│  │  │ 36.8°C  │  │ 78 bpm  │  │ 145/95  │  │ 75.5kg  │        │   │
│  │  │ Normal  │  │ Normal  │  │ High    │  │         │        │   │
│  │  └─────────┘  └─────────┘  └─────────┘  └─────────┘        │   │
│  │  ┌─────────┐                                                │   │
│  │  │ 📏 Ht   │                                                │   │
│  │  │ 175 cm  │                                                │   │
│  │  └─────────┘                                                │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  Doctor's Notes                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ Patient shows elevated blood pressure. Recommended lifestyle │   │
│  │ modifications and prescribed medication. Schedule follow-up  │   │
│  │ appointment in 2 weeks to monitor progress.                  │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  Prescription                                                       │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ 💊 Prescription #RX001 created on Dec 5, 2025                │   │
│  │    2 medicines prescribed                                    │   │
│  │    [View Prescription →]                                     │   │
│  │                                                              │   │
│  │ (OR if no prescription)                                      │   │
│  │ No prescription created yet.                                 │   │
│  │ [+ Add Prescription] (doctor only)                           │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  Audit Information                                                  │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ Created: Dec 5, 2025 10:30 AM by Dr. Nguyen Van Hung         │   │
│  │ Updated: Dec 5, 2025 11:00 AM by Dr. Nguyen Van Hung         │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

#### Vital Signs Status Indicators

| Vital        | Normal Range  | High                            | Low                    |
| ------------ | ------------- | ------------------------------- | ---------------------- |
| Temperature  | 36.0 - 37.5°C | > 37.5°C (Fever)                | < 36.0°C (Hypothermia) |
| Heart Rate   | 60 - 100 bpm  | > 100 bpm (Tachycardia)         | < 60 bpm (Bradycardia) |
| BP Systolic  | < 120 mmHg    | 120-139 (Elevated), ≥140 (High) | < 90 (Low)             |
| BP Diastolic | < 80 mmHg     | 80-89 (Elevated), ≥90 (High)    | < 60 (Low)             |

#### Conditional Actions by Role

| Role                    | Actions Available                       |
| ----------------------- | --------------------------------------- |
| DOCTOR (creator, < 24h) | Edit, Add Prescription (if none), Print |
| DOCTOR (creator, > 24h) | Add Prescription (if none), Print       |
| DOCTOR (non-creator)    | View only, Print                        |
| ADMIN                   | View only, Print                        |
| NURSE                   | View only, Print                        |
| PATIENT (own)           | View only, Print                        |

---

### 3.4 Prescription Form Page

**Route:** `/doctor/exams/{examId}/prescription`  
**Component:** `PrescriptionFormPage`  
**Access:** DOCTOR only

#### Layout Structure

```
┌─────────────────────────────────────────────────────────────────────┐
│ Header: "Create Prescription"                                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Exam Information (Read-only)                                       │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ Patient:     Nguyen Van A                                    │   │
│  │ Diagnosis:   Hypertension Stage 1                            │   │
│  │ Exam Date:   December 5, 2025                                │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  Prescription Items                                                 │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ Medicine 1                                            [🗑️]   │   │
│  │ ┌─────────────────────────────────────────────────────────┐ │   │
│  │ │ Medicine*     [Search medicine...                   ▼]  │ │   │
│  │ │               Selected: Amoxicillin 500mg               │ │   │
│  │ │               Stock: 500 units | Price: 8,000 VND/unit  │ │   │
│  │ │                                                         │ │   │
│  │ │ Quantity*     [20]         Dosage*  [1 cap twice daily] │ │   │
│  │ │ Duration      [10] days    Instructions [Take with food]│ │   │
│  │ └─────────────────────────────────────────────────────────┘ │   │
│  │                                                              │   │
│  │ Medicine 2                                            [🗑️]   │   │
│  │ ┌─────────────────────────────────────────────────────────┐ │   │
│  │ │ Medicine*     [Paracetamol 500mg                    ▼]  │ │   │
│  │ │               Stock: 1000 units | Price: 1,500 VND/unit │ │   │
│  │ │                                                         │ │   │
│  │ │ Quantity*     [10]         Dosage*  [1 tab as needed]   │ │   │
│  │ │ Duration      [5] days     Instructions [Max 4/day]     │ │   │
│  │ └─────────────────────────────────────────────────────────┘ │   │
│  │                                                              │   │
│  │                              [+ Add Another Medicine]        │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  Prescription Notes                                                 │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ Notes         [General usage instructions, warnings...    ]  │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  Cost Summary                                                       │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ Amoxicillin 500mg    20 x 8,000 =      160,000 VND          │   │
│  │ Paracetamol 500mg    10 x 1,500 =       15,000 VND          │   │
│  │ ───────────────────────────────────────────────────         │   │
│  │ Total:                                  175,000 VND          │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ⚠️ Note: Prescription cannot be modified after creation.          │
│                                                                     │
│                              [Cancel]  [Create Prescription]        │
└─────────────────────────────────────────────────────────────────────┘
```

#### Prescription Item Fields

| Field          | Type              | Required | Validation              |
| -------------- | ----------------- | -------- | ----------------------- |
| `medicineId`   | Searchable Select | Yes      | Must exist, have stock  |
| `quantity`     | Number            | Yes      | > 0, <= available stock |
| `dosage`       | Text              | Yes      | Max 255 chars           |
| `durationDays` | Number            | No       | > 0                     |
| `instructions` | Text              | No       | Max 500 chars           |

#### Dynamic Form Behavior

- Minimum 1 medicine item required
- Can add unlimited medicine items
- Real-time stock validation on quantity change
- Auto-calculate line total (quantity × unitPrice)
- Auto-calculate prescription total
- Warning if quantity > 50% of available stock
- Error if quantity > available stock

---

### 3.5 Prescription Detail Page

**Route:** `/doctor/exams/{examId}/prescription/view` or `/patient/prescriptions/{id}`  
**Component:** `PrescriptionDetailPage`  
**Access:** ADMIN, DOCTOR, NURSE, PATIENT (own)

#### Layout Structure

```
┌─────────────────────────────────────────────────────────────────────┐
│ [← Back]                                                    [Print] │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    💊 PRESCRIPTION                           │   │
│  │                       #RX001                                 │   │
│  │                                                              │   │
│  │  Patient:    Nguyen Van A                                    │   │
│  │  Doctor:     Dr. Nguyen Van Hung                             │   │
│  │  Date:       December 5, 2025                                │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  Prescribed Medicines                                               │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ # │ Medicine          │ Qty │ Dosage         │ Duration     │   │
│  │───┼───────────────────┼─────┼────────────────┼──────────────│   │
│  │ 1 │ Amoxicillin 500mg │ 20  │ 1 cap 2x/day   │ 10 days      │   │
│  │   │                   │     │ Take with food │              │   │
│  │───┼───────────────────┼─────┼────────────────┼──────────────│   │
│  │ 2 │ Paracetamol 500mg │ 10  │ 1 tab as needed│ 5 days       │   │
│  │   │                   │     │ Max 4 tabs/day │              │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  General Notes                                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ Take medications as prescribed. Avoid alcohol during         │   │
│  │ treatment. Return for follow-up if symptoms persist.         │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  Cost Summary (Staff view only)                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ Amoxicillin 500mg     20 × ₫8,000  =      ₫160,000          │   │
│  │ Paracetamol 500mg     10 × ₫1,500  =       ₫15,000          │   │
│  │ ─────────────────────────────────────────────────           │   │
│  │ Subtotal:                                  ₫175,000          │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  Audit Information                                                  │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ Prescribed: Dec 5, 2025 10:45 AM by Dr. Nguyen Van Hung      │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

---

### 3.6 Patient Medical Records Page

**Route:** `/patient/medical-records`  
**Component:** `PatientMedicalRecordsPage`  
**Access:** PATIENT only

#### Layout Structure

```
┌─────────────────────────────────────────────────────────────────────┐
│ My Medical Records                                                  │
├─────────────────────────────────────────────────────────────────────┤
│ Filter: [Start Date] [End Date]                      [Apply Filter] │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ 📋 December 5, 2025                               💊         │   │
│  │ Dr. Nguyen Van Hung - Cardiology                             │   │
│  │ Diagnosis: Hypertension Stage 1                              │   │
│  │                                                 [View →]     │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ 📋 November 20, 2025                                        │   │
│  │ Dr. Tran Thi Mai - General Medicine                          │   │
│  │ Diagnosis: Common Cold                                       │   │
│  │                                                 [View →]     │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ 📋 October 10, 2025                              💊         │   │
│  │ Dr. Nguyen Van Hung - Cardiology                             │   │
│  │ Diagnosis: Routine Checkup                                   │   │
│  │                                                 [View →]     │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│ Showing 1-10 of 15 records                          [< 1 2 >]       │
└─────────────────────────────────────────────────────────────────────┘
```

---

### 3.7 Doctor Exams Page

**Route:** `/doctor/exams`  
**Component:** `DoctorExamListPage`  
**Access:** DOCTOR only

#### Layout Structure

```
┌─────────────────────────────────────────────────────────────────────┐
│ My Medical Exams                                  [+ Create New Exam]│
├─────────────────────────────────────────────────────────────────────┤
│ Filters:                                                            │
│ [Search Patient...] [Start Date] [End Date]                         │
├─────────────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────────────┐ │
│ │ Patient      │ Diagnosis      │ Date     │ Rx  │ Status │ Act. │ │
│ ├──────────────┼────────────────┼──────────┼─────┼────────┼──────┤ │
│ │ Nguyen Van A │ Hypertension   │ Dec 5    │ 💊  │ ✏️     │ [👁️] │ │
│ │ Tran Thi B   │ Common Cold    │ Dec 5    │ -   │ ✏️     │ [👁️] │ │
│ │ Le Van C     │ Diabetes T2    │ Dec 3    │ 💊  │ 🔒     │ [👁️] │ │
│ └─────────────────────────────────────────────────────────────────┘ │
│                                                                     │
│ Legend: ✏️ = Editable (< 24h), 🔒 = Locked, 💊 = Has Prescription   │
│                                                                     │
│ Showing 1-10 of 25                                  [< 1 2 3 >]     │
└─────────────────────────────────────────────────────────────────────┘
```

#### Status Column Meanings

| Icon | Meaning                                    |
| ---- | ------------------------------------------ |
| ✏️   | Exam created < 24 hours ago, can be edited |
| 🔒   | Exam created > 24 hours ago, read-only     |
| 💊   | Prescription has been created              |
| -    | No prescription yet                        |

---

## 4. API Integration

### 4.1 API Service File

**File:** `services/medical-exam.service.ts`

```typescript
import api from "@/config/axios";

const BASE_URL = "/api/exams";

// ============ Medical Exam Types ============

export interface MedicalExamCreateRequest {
  appointmentId: string;
  diagnosis?: string;
  symptoms?: string;
  treatment?: string;
  temperature?: number;
  bloodPressureSystolic?: number;
  bloodPressureDiastolic?: number;
  heartRate?: number;
  weight?: number;
  height?: number;
  notes?: string;
}

export interface MedicalExamUpdateRequest {
  diagnosis?: string;
  symptoms?: string;
  treatment?: string;
  temperature?: number;
  bloodPressureSystolic?: number;
  bloodPressureDiastolic?: number;
  heartRate?: number;
  weight?: number;
  height?: number;
  notes?: string;
}

export interface Vitals {
  temperature?: number;
  bloodPressureSystolic?: number;
  bloodPressureDiastolic?: number;
  heartRate?: number;
  weight?: number;
  height?: number;
}

export interface AppointmentSummary {
  id: string;
  appointmentTime: string;
}

export interface PatientSummary {
  id: string;
  fullName: string;
}

export interface DoctorSummary {
  id: string;
  fullName: string;
}

export interface MedicalExam {
  id: string;
  appointment: AppointmentSummary;
  patient: PatientSummary;
  doctor: DoctorSummary;
  diagnosis?: string;
  symptoms?: string;
  treatment?: string;
  vitals: Vitals;
  notes?: string;
  examDate: string;
  createdAt: string;
  updatedAt: string;
  updatedBy?: string;
}

export interface MedicalExamListItem {
  id: string;
  appointment: AppointmentSummary;
  patient: PatientSummary;
  doctor: DoctorSummary;
  diagnosis?: string;
  examDate: string;
}

export interface MedicalExamListParams {
  patientId?: string;
  doctorId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  size?: number;
  sort?: string;
}

// ============ Prescription Types ============

export interface PrescriptionItemRequest {
  medicineId: string;
  quantity: number;
  dosage: string;
  durationDays?: number;
  instructions?: string;
}

export interface PrescriptionCreateRequest {
  notes?: string;
  items: PrescriptionItemRequest[];
}

export interface MedicineSummary {
  id: string;
  name: string;
}

export interface PrescriptionItem {
  id: string;
  medicine: MedicineSummary;
  quantity: number;
  unitPrice: number;
  dosage: string;
  durationDays?: number;
  instructions?: string;
}

export interface Prescription {
  id: string;
  medicalExam: { id: string };
  patient: PatientSummary;
  doctor: DoctorSummary;
  prescribedAt: string;
  notes?: string;
  items: PrescriptionItem[];
  createdAt: string;
  updatedAt: string;
}

export interface PrescriptionListItem {
  id: string;
  medicalExam: { id: string };
  doctor: DoctorSummary;
  prescribedAt: string;
  itemCount: number;
}

export interface PaginatedResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

// ============ Medical Exam Service ============

const medicalExamService = {
  // Create medical exam
  create: (data: MedicalExamCreateRequest) =>
    api.post<{ status: string; data: MedicalExam }>(BASE_URL, data),

  // Get exam by ID
  getById: (id: string) =>
    api.get<{ status: string; data: MedicalExam }>(`${BASE_URL}/${id}`),

  // Get exam by appointment ID
  getByAppointment: (appointmentId: string) =>
    api.get<{ status: string; data: MedicalExam }>(
      `${BASE_URL}/by-appointment/${appointmentId}`
    ),

  // List exams with filters
  getList: (params: MedicalExamListParams) =>
    api.get<{ status: string; data: PaginatedResponse<MedicalExamListItem> }>(
      BASE_URL,
      { params }
    ),

  // Update exam (within 24 hours)
  update: (id: string, data: MedicalExamUpdateRequest) =>
    api.patch<{ status: string; data: MedicalExam }>(`${BASE_URL}/${id}`, data),

  // Create prescription for exam
  createPrescription: (examId: string, data: PrescriptionCreateRequest) =>
    api.post<{ status: string; data: Prescription }>(
      `${BASE_URL}/${examId}/prescriptions`,
      data
    ),

  // Get prescription by exam ID
  getPrescriptionByExam: (examId: string) =>
    api.get<{ status: string; data: Prescription }>(
      `${BASE_URL}/${examId}/prescription`
    ),

  // Get prescription by ID
  getPrescriptionById: (prescriptionId: string) =>
    api.get<{ status: string; data: Prescription }>(
      `${BASE_URL}/prescriptions/${prescriptionId}`
    ),

  // Get prescriptions by patient
  getPrescriptionsByPatient: (
    patientId: string,
    params?: { page?: number; size?: number }
  ) =>
    api.get<{ status: string; data: PaginatedResponse<PrescriptionListItem> }>(
      `${BASE_URL}/prescriptions/by-patient/${patientId}`,
      { params }
    ),
};

export default medicalExamService;
```

### 4.2 React Query Hooks

**File:** `hooks/queries/useMedicalExam.ts`

```typescript
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import medicalExamService, {
  MedicalExamCreateRequest,
  MedicalExamUpdateRequest,
  MedicalExamListParams,
  PrescriptionCreateRequest,
} from "@/services/medical-exam.service";
import { toast } from "sonner";

// Query Keys
export const medicalExamKeys = {
  all: ["medicalExams"] as const,
  lists: () => [...medicalExamKeys.all, "list"] as const,
  list: (params: MedicalExamListParams) =>
    [...medicalExamKeys.lists(), params] as const,
  details: () => [...medicalExamKeys.all, "detail"] as const,
  detail: (id: string) => [...medicalExamKeys.details(), id] as const,
  byAppointment: (appointmentId: string) =>
    [...medicalExamKeys.all, "appointment", appointmentId] as const,
  prescriptions: () => ["prescriptions"] as const,
  prescription: (examId: string) =>
    [...medicalExamKeys.prescriptions(), "exam", examId] as const,
  prescriptionById: (id: string) =>
    [...medicalExamKeys.prescriptions(), "detail", id] as const,
  prescriptionsByPatient: (patientId: string) =>
    [...medicalExamKeys.prescriptions(), "patient", patientId] as const,
};

// Get exam list
export const useMedicalExamList = (params: MedicalExamListParams) => {
  return useQuery({
    queryKey: medicalExamKeys.list(params),
    queryFn: () => medicalExamService.getList(params),
    select: (response) => response.data.data,
  });
};

// Get exam by ID
export const useMedicalExam = (id: string) => {
  return useQuery({
    queryKey: medicalExamKeys.detail(id),
    queryFn: () => medicalExamService.getById(id),
    select: (response) => response.data.data,
    enabled: !!id,
  });
};

// Get exam by appointment ID
export const useMedicalExamByAppointment = (appointmentId: string) => {
  return useQuery({
    queryKey: medicalExamKeys.byAppointment(appointmentId),
    queryFn: () => medicalExamService.getByAppointment(appointmentId),
    select: (response) => response.data.data,
    enabled: !!appointmentId,
    retry: false, // Don't retry on 404
  });
};

// Create exam
export const useCreateMedicalExam = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: MedicalExamCreateRequest) =>
      medicalExamService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: medicalExamKeys.lists() });
      toast.success("Medical exam created successfully");
    },
    onError: (error: any) => {
      const message = getMedicalExamErrorMessage(
        error.response?.data?.error?.code
      );
      toast.error(message);
    },
  });
};

// Update exam
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
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: medicalExamKeys.detail(variables.id),
      });
      queryClient.invalidateQueries({ queryKey: medicalExamKeys.lists() });
      toast.success("Medical exam updated successfully");
    },
    onError: (error: any) => {
      const message = getMedicalExamErrorMessage(
        error.response?.data?.error?.code
      );
      toast.error(message);
    },
  });
};

// Get prescription by exam
export const usePrescriptionByExam = (examId: string) => {
  return useQuery({
    queryKey: medicalExamKeys.prescription(examId),
    queryFn: () => medicalExamService.getPrescriptionByExam(examId),
    select: (response) => response.data.data,
    enabled: !!examId,
    retry: false,
  });
};

// Get prescription by ID
export const usePrescription = (id: string) => {
  return useQuery({
    queryKey: medicalExamKeys.prescriptionById(id),
    queryFn: () => medicalExamService.getPrescriptionById(id),
    select: (response) => response.data.data,
    enabled: !!id,
  });
};

// Get prescriptions by patient
export const usePrescriptionsByPatient = (
  patientId: string,
  params?: { page?: number; size?: number }
) => {
  return useQuery({
    queryKey: medicalExamKeys.prescriptionsByPatient(patientId),
    queryFn: () =>
      medicalExamService.getPrescriptionsByPatient(patientId, params),
    select: (response) => response.data.data,
    enabled: !!patientId,
  });
};

// Create prescription
export const useCreatePrescription = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      examId,
      data,
    }: {
      examId: string;
      data: PrescriptionCreateRequest;
    }) => medicalExamService.createPrescription(examId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: medicalExamKeys.prescription(variables.examId),
      });
      queryClient.invalidateQueries({
        queryKey: medicalExamKeys.detail(variables.examId),
      });
      toast.success(
        "Prescription created successfully. Invoice has been generated."
      );
    },
    onError: (error: any) => {
      const message = getPrescriptionErrorMessage(
        error.response?.data?.error?.code
      );
      toast.error(message);
    },
  });
};

// Error message mappings
function getMedicalExamErrorMessage(errorCode: string): string {
  const errorMessages: Record<string, string> = {
    VALIDATION_ERROR: "Please check the form for errors",
    APPOINTMENT_NOT_FOUND: "Appointment not found",
    APPOINTMENT_NOT_COMPLETED:
      "Appointment must be completed before creating an exam",
    EXAM_EXISTS: "A medical exam already exists for this appointment",
    EXAM_NOT_FOUND: "Medical exam not found",
    EXAM_NOT_MODIFIABLE: "Cannot modify exam after 24 hours",
    FORBIDDEN: "You do not have permission to perform this action",
    UNAUTHORIZED: "Please log in to continue",
  };
  return (
    errorMessages[errorCode] ||
    "An unexpected error occurred. Please try again."
  );
}

function getPrescriptionErrorMessage(errorCode: string): string {
  const errorMessages: Record<string, string> = {
    VALIDATION_ERROR: "Please check the prescription for errors",
    EXAM_NOT_FOUND: "Medical exam not found",
    MEDICINE_NOT_FOUND: "One or more medicines not found",
    INSUFFICIENT_STOCK: "Insufficient stock for one or more medicines",
    PRESCRIPTION_EXISTS: "A prescription already exists for this exam",
    PRESCRIPTION_NOT_FOUND: "Prescription not found",
    FORBIDDEN: "You do not have permission to create this prescription",
    UNAUTHORIZED: "Please log in to continue",
  };
  return (
    errorMessages[errorCode] ||
    "An unexpected error occurred. Please try again."
  );
}
```

### 4.3 API Endpoints Reference

#### 4.3.1 Create Medical Exam

**Endpoint:** `POST /api/exams`  
**Access:** ADMIN, DOCTOR

**Request:**

```json
{
  "appointmentId": "apt001",
  "diagnosis": "Hypertension Stage 1",
  "symptoms": "Headache, dizziness",
  "treatment": "Lifestyle changes, medication",
  "temperature": 36.8,
  "bloodPressureSystolic": 145,
  "bloodPressureDiastolic": 95,
  "heartRate": 78,
  "weight": 75.5,
  "height": 175.0,
  "notes": "Follow-up in 2 weeks"
}
```

**Success Response:** `201 Created`

```json
{
  "status": "success",
  "data": {
    "id": "exam001",
    "appointment": {
      "id": "apt001",
      "appointmentTime": "2025-12-05T09:00:00"
    },
    "patient": {
      "id": "p001",
      "fullName": "Nguyen Van A"
    },
    "doctor": {
      "id": "emp001",
      "fullName": "Dr. Nguyen Van Hung"
    },
    "diagnosis": "Hypertension Stage 1",
    "symptoms": "Headache, dizziness",
    "treatment": "Lifestyle changes, medication",
    "vitals": {
      "temperature": 36.8,
      "bloodPressureSystolic": 145,
      "bloodPressureDiastolic": 95,
      "heartRate": 78,
      "weight": 75.5,
      "height": 175.0
    },
    "notes": "Follow-up in 2 weeks",
    "examDate": "2025-12-05T10:30:00Z",
    "createdAt": "2025-12-05T10:30:00Z"
  }
}
```

**Error Responses:**

| Status | Code                      | Message                                          | UI Action         |
| ------ | ------------------------- | ------------------------------------------------ | ----------------- |
| 400    | VALIDATION_ERROR          | Field validation failed                          | Show field errors |
| 400    | APPOINTMENT_NOT_COMPLETED | Appointment must be completed first              | Show toast error  |
| 403    | FORBIDDEN                 | Only assigned doctor can create exam             | Show toast error  |
| 404    | APPOINTMENT_NOT_FOUND     | Appointment ID doesn't exist                     | Show toast error  |
| 409    | EXAM_EXISTS               | Medical exam already exists for this appointment | Show toast error  |

**Validation Error Details:**

- `appointmentId is required`
- `temperature must be between 30.0 and 45.0 (Celsius)`
- `bloodPressureSystolic must be between 50 and 250 (mmHg)`
- `bloodPressureDiastolic must be between 30 and 150 (mmHg)`
- `heartRate must be between 30 and 200 (bpm)`
- `weight must be positive (> 0, in kg)`
- `height must be positive (> 0, in cm)`

---

#### 4.3.2 Get Medical Exam by ID

**Endpoint:** `GET /api/exams/{id}`  
**Access:** ADMIN, DOCTOR, NURSE, PATIENT (own)

**Success Response:** `200 OK`

```json
{
  "status": "success",
  "data": {
    "id": "exam001",
    "appointment": {
      "id": "apt001",
      "appointmentTime": "2025-12-05T09:00:00"
    },
    "patient": {
      "id": "p001",
      "fullName": "Nguyen Van A"
    },
    "doctor": {
      "id": "emp001",
      "fullName": "Dr. Nguyen Van Hung"
    },
    "diagnosis": "Hypertension Stage 1",
    "symptoms": "Headache, dizziness",
    "treatment": "Lifestyle changes, medication",
    "vitals": {
      "temperature": 36.8,
      "bloodPressureSystolic": 145,
      "bloodPressureDiastolic": 95,
      "heartRate": 78,
      "weight": 75.5,
      "height": 175.0
    },
    "notes": "Follow-up in 2 weeks",
    "examDate": "2025-12-05T10:30:00Z",
    "createdAt": "2025-12-05T10:30:00Z",
    "updatedAt": "2025-12-05T10:30:00Z"
  }
}
```

**Error Responses:**

| Status | Code           | Message                               | UI Action         |
| ------ | -------------- | ------------------------------------- | ----------------- |
| 401    | UNAUTHORIZED   | Missing or invalid access token       | Redirect to login |
| 403    | FORBIDDEN      | User not authorized to view this exam | Show 403 page     |
| 404    | EXAM_NOT_FOUND | Medical exam doesn't exist            | Show 404 page     |

---

#### 4.3.3 Get Medical Exam by Appointment

**Endpoint:** `GET /api/exams/by-appointment/{appointmentId}`  
**Access:** ADMIN, DOCTOR, NURSE, PATIENT (own)

**Success Response:** `200 OK` - Same as Get by ID

**Error Responses:**

| Status | Code                  | Message                               | UI Action              |
| ------ | --------------------- | ------------------------------------- | ---------------------- |
| 401    | UNAUTHORIZED          | Missing or invalid access token       | Redirect to login      |
| 403    | FORBIDDEN             | User not authorized to view this exam | Show 403 page          |
| 404    | APPOINTMENT_NOT_FOUND | Appointment doesn't exist             | Show 404 page          |
| 404    | EXAM_NOT_FOUND        | No exam found for this appointment    | Return null (expected) |

---

#### 4.3.4 List Medical Exams

**Endpoint:** `GET /api/exams`  
**Access:** ADMIN, DOCTOR, NURSE (all), PATIENT (own)

**Query Parameters:**
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| patientId | string | No | - | Filter by patient (ignored for PATIENT role) |
| doctorId | string | No | - | Filter by doctor |
| startDate | date | No | - | Filter from date (YYYY-MM-DD) |
| endDate | date | No | - | Filter until date (YYYY-MM-DD) |
| page | integer | No | 0 | Page number (0-indexed) |
| size | integer | No | 20 | Page size (max: 100) |
| sort | string | No | examDate,desc | Sort field and direction |

**Success Response:** `200 OK`

```json
{
  "status": "success",
  "data": {
    "content": [
      {
        "id": "exam001",
        "appointment": {
          "id": "apt001",
          "appointmentTime": "2025-12-05T09:00:00"
        },
        "patient": {
          "id": "p001",
          "fullName": "Nguyen Van A"
        },
        "doctor": {
          "id": "emp001",
          "fullName": "Dr. Nguyen Van Hung"
        },
        "diagnosis": "Hypertension Stage 1",
        "examDate": "2025-12-05T10:30:00Z"
      }
    ],
    "page": 0,
    "size": 20,
    "totalElements": 1,
    "totalPages": 1,
    "last": true
  }
}
```

**Error Responses:**

| Status | Code             | Message                         | UI Action         |
| ------ | ---------------- | ------------------------------- | ----------------- |
| 401    | UNAUTHORIZED     | Missing or invalid access token | Redirect to login |
| 400    | VALIDATION_ERROR | Invalid query parameters        | Show toast error  |

**Validation Error Details:**

- `page must be >= 0`
- `size must be between 1 and 100`
- `startDate must be valid ISO 8601 date`
- `endDate must be valid ISO 8601 date`
- `startDate cannot be after endDate`
- `sort field must be one of [examDate, createdAt, diagnosis]`

---

#### 4.3.5 Update Medical Exam

**Endpoint:** `PATCH /api/exams/{id}`  
**Access:** ADMIN, DOCTOR (creator only, within 24 hours)

**Request:** (All fields optional)

```json
{
  "diagnosis": "Hypertension Stage 2",
  "symptoms": "Headache, dizziness, fatigue",
  "treatment": "Medication adjustment, lifestyle changes",
  "temperature": 37.0,
  "bloodPressureSystolic": 150,
  "bloodPressureDiastolic": 100,
  "heartRate": 82,
  "weight": 76.0,
  "height": 175.0,
  "notes": "Increased medication dosage"
}
```

**Success Response:** `200 OK` - Returns updated exam

**Error Responses:**

| Status | Code                | Message                                            | UI Action                      |
| ------ | ------------------- | -------------------------------------------------- | ------------------------------ |
| 401    | UNAUTHORIZED        | Missing or invalid access token                    | Redirect to login              |
| 400    | VALIDATION_ERROR    | Field validation failed                            | Show field errors              |
| 400    | EXAM_NOT_MODIFIABLE | Cannot modify exam after 24 hours                  | Show toast error, disable form |
| 403    | FORBIDDEN           | Only the doctor who created the exam can update it | Show toast error               |
| 404    | EXAM_NOT_FOUND      | Medical exam doesn't exist                         | Show 404 page                  |

**Validation Error Details:**

- Same as Create Medical Exam validation
- `notes exceeds maximum length (2000 characters)`
- `diagnosis exceeds maximum length (2000 characters)`
- `symptoms exceeds maximum length (2000 characters)`
- `treatment exceeds maximum length (2000 characters)`

---

#### 4.3.6 Create Prescription

**Endpoint:** `POST /api/exams/{examId}/prescriptions`  
**Access:** ADMIN, DOCTOR (creator of exam)

**Request:**

```json
{
  "notes": "Take with food, avoid alcohol",
  "items": [
    {
      "medicineId": "med001",
      "quantity": 20,
      "dosage": "1 capsule twice daily",
      "durationDays": 10,
      "instructions": "Take with food"
    },
    {
      "medicineId": "med002",
      "quantity": 10,
      "dosage": "1 tablet as needed",
      "durationDays": 5,
      "instructions": "Maximum 4 tablets per day"
    }
  ]
}
```

**Success Response:** `201 Created`

```json
{
  "status": "success",
  "data": {
    "id": "rx001",
    "medicalExam": { "id": "exam001" },
    "patient": {
      "id": "p001",
      "fullName": "Nguyen Van A"
    },
    "doctor": {
      "id": "emp001",
      "fullName": "Dr. Nguyen Van Hung"
    },
    "prescribedAt": "2025-12-05T10:30:00Z",
    "notes": "Take with food, avoid alcohol",
    "items": [
      {
        "id": "rxi001",
        "medicine": {
          "id": "med001",
          "name": "Amoxicillin 500mg"
        },
        "quantity": 20,
        "unitPrice": 8000,
        "dosage": "1 capsule twice daily",
        "durationDays": 10,
        "instructions": "Take with food"
      }
    ],
    "createdAt": "2025-12-05T10:30:00Z"
  }
}
```

**Side Effects:**

- Decrements medicine stock in medicine-service
- Triggers billing service to auto-generate invoice

**Error Responses:**

| Status | Code                | Message                                   | UI Action                        |
| ------ | ------------------- | ----------------------------------------- | -------------------------------- |
| 401    | UNAUTHORIZED        | Missing or invalid access token           | Redirect to login                |
| 400    | VALIDATION_ERROR    | Field validation failed                   | Show field errors                |
| 400    | INSUFFICIENT_STOCK  | Not enough medicine in stock              | Show toast error, highlight item |
| 403    | FORBIDDEN           | Only exam creator can create prescription | Show toast error                 |
| 404    | EXAM_NOT_FOUND      | Medical exam doesn't exist                | Show 404 page                    |
| 404    | MEDICINE_NOT_FOUND  | Medicine ID doesn't exist                 | Show toast error, highlight item |
| 409    | PRESCRIPTION_EXISTS | Prescription already exists for this exam | Show toast error                 |

**Validation Error Details:**

- `items array is required and cannot be empty`
- `items[].medicineId is required`
- `items[].quantity is required`
- `items[].quantity must be positive (> 0)`
- `items[].dosage is required`
- `items[].durationDays must be positive (> 0)`

---

#### 4.3.7 Get Prescription by Exam

**Endpoint:** `GET /api/exams/{examId}/prescription`  
**Access:** ADMIN, DOCTOR, NURSE, PATIENT (own)

**Success Response:** `200 OK` - Returns Prescription object

**Error Responses:**

| Status | Code                   | Message                                       | UI Action                      |
| ------ | ---------------------- | --------------------------------------------- | ------------------------------ |
| 401    | UNAUTHORIZED           | Missing or invalid access token               | Redirect to login              |
| 403    | FORBIDDEN              | User not authorized to view this prescription | Show 403 page                  |
| 404    | EXAM_NOT_FOUND         | Medical exam doesn't exist                    | Show 404 page                  |
| 404    | PRESCRIPTION_NOT_FOUND | No prescription for this exam                 | Show "No prescription" message |

---

#### 4.3.8 Get Prescription by ID

**Endpoint:** `GET /api/exams/prescriptions/{id}`  
**Access:** ADMIN, DOCTOR, NURSE, PATIENT (own)

**Success Response:** `200 OK` - Returns Prescription object

**Error Responses:**

| Status | Code                   | Message                                       | UI Action         |
| ------ | ---------------------- | --------------------------------------------- | ----------------- |
| 401    | UNAUTHORIZED           | Missing or invalid access token               | Redirect to login |
| 403    | FORBIDDEN              | User not authorized to view this prescription | Show 403 page     |
| 404    | PRESCRIPTION_NOT_FOUND | Prescription doesn't exist                    | Show 404 page     |

---

#### 4.3.9 Get Prescriptions by Patient

**Endpoint:** `GET /api/exams/prescriptions/by-patient/{patientId}`  
**Access:** ADMIN, DOCTOR, NURSE, PATIENT (own)

**Query Parameters:**
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| page | integer | No | 0 | Page number |
| size | integer | No | 20 | Page size (max: 100) |

**Success Response:** `200 OK`

```json
{
  "status": "success",
  "data": {
    "content": [
      {
        "id": "rx001",
        "medicalExam": { "id": "exam001" },
        "doctor": {
          "id": "emp001",
          "fullName": "Dr. Nguyen Van Hung"
        },
        "prescribedAt": "2025-12-05T10:30:00Z",
        "itemCount": 2
      }
    ],
    "page": 0,
    "size": 20,
    "totalElements": 1,
    "totalPages": 1,
    "last": true
  }
}
```

**Error Responses:**

| Status | Code              | Message                                                  | UI Action         |
| ------ | ----------------- | -------------------------------------------------------- | ----------------- |
| 401    | UNAUTHORIZED      | Missing or invalid access token                          | Redirect to login |
| 403    | FORBIDDEN         | User not authorized to view this patient's prescriptions | Show 403 page     |
| 404    | PATIENT_NOT_FOUND | Patient doesn't exist                                    | Show 404 page     |

---

## 5. Shared Components

### 5.1 Component Registry

| Component               | Purpose                                      | Used In           |
| ----------------------- | -------------------------------------------- | ----------------- |
| `VitalsPanel`           | Display vital signs with status indicators   | Exam Detail       |
| `VitalsForm`            | Input form for vital signs                   | Exam Form         |
| `PrescriptionItemRow`   | Single medicine item in prescription form    | Prescription Form |
| `MedicineSearchSelect`  | Searchable medicine dropdown with stock info | Prescription Form |
| `ExamStatusBadge`       | Show edit window status (editable/locked)    | Exam List, Detail |
| `PrescriptionIndicator` | Show if exam has prescription                | Exam List         |
| `EditCountdown`         | Timer showing remaining edit time            | Exam Detail, Form |
| `ClinicalFindingsCard`  | Display diagnosis, symptoms, treatment       | Exam Detail       |
| `ExamCard`              | Card layout for patient view                 | Patient Records   |

### 5.2 VitalsPanel Component

```typescript
// components/medical-exam/VitalsPanel.tsx

interface Vitals {
  temperature?: number;
  bloodPressureSystolic?: number;
  bloodPressureDiastolic?: number;
  heartRate?: number;
  weight?: number;
  height?: number;
}

interface Props {
  vitals: Vitals;
  showStatus?: boolean; // Show normal/high/low indicators
}

const vitalRanges = {
  temperature: { min: 36.0, max: 37.5, unit: '°C', label: 'Temperature', icon: '🌡️' },
  heartRate: { min: 60, max: 100, unit: 'bpm', label: 'Heart Rate', icon: '❤️' },
  bloodPressureSystolic: { min: 90, max: 120, unit: 'mmHg', label: 'BP Systolic', icon: '📊' },
  bloodPressureDiastolic: { min: 60, max: 80, unit: 'mmHg', label: 'BP Diastolic', icon: '📊' },
  weight: { unit: 'kg', label: 'Weight', icon: '⚖️' },
  height: { unit: 'cm', label: 'Height', icon: '📏' },
};

function getVitalStatus(vital: string, value: number): 'normal' | 'high' | 'low' | 'unknown' {
  const range = vitalRanges[vital as keyof typeof vitalRanges];
  if (!range || !('min' in range)) return 'unknown';
  if (value < range.min) return 'low';
  if (value > range.max) return 'high';
  return 'normal';
}

export function VitalsPanel({ vitals, showStatus = true }: Props) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {Object.entries(vitals).map(([key, value]) => {
        if (value === null || value === undefined) return null;
        const config = vitalRanges[key as keyof typeof vitalRanges];
        const status = showStatus ? getVitalStatus(key, value) : 'unknown';

        return (
          <div
            key={key}
            className={`p-4 rounded-lg border ${
              status === 'high' ? 'border-red-300 bg-red-50' :
              status === 'low' ? 'border-blue-300 bg-blue-50' :
              'border-gray-200 bg-gray-50'
            }`}
          >
            <div className="text-2xl mb-1">{config.icon}</div>
            <div className="text-sm text-gray-500">{config.label}</div>
            <div className="text-xl font-semibold">
              {key === 'bloodPressureSystolic' && vitals.bloodPressureDiastolic
                ? `${value}/${vitals.bloodPressureDiastolic}`
                : value
              }
              <span className="text-sm font-normal ml-1">{config.unit}</span>
            </div>
            {showStatus && status !== 'unknown' && (
              <div className={`text-xs mt-1 ${
                status === 'high' ? 'text-red-600' :
                status === 'low' ? 'text-blue-600' :
                'text-green-600'
              }`}>
                {status === 'normal' ? 'Normal' : status === 'high' ? 'High' : 'Low'}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
```

### 5.3 VitalsForm Component

```typescript
// components/medical-exam/VitalsForm.tsx

interface Props {
  control: Control<any>;
  errors: FieldErrors;
}

const vitalFields = [
  { name: 'temperature', label: 'Temperature', unit: '°C', min: 30, max: 45, step: 0.1, icon: '🌡️' },
  { name: 'bloodPressureSystolic', label: 'BP Systolic', unit: 'mmHg', min: 50, max: 250, step: 1, icon: '📊' },
  { name: 'bloodPressureDiastolic', label: 'BP Diastolic', unit: 'mmHg', min: 30, max: 150, step: 1, icon: '📊' },
  { name: 'heartRate', label: 'Heart Rate', unit: 'bpm', min: 30, max: 200, step: 1, icon: '❤️' },
  { name: 'weight', label: 'Weight', unit: 'kg', min: 0.1, max: 500, step: 0.1, icon: '⚖️' },
  { name: 'height', label: 'Height', unit: 'cm', min: 1, max: 300, step: 0.1, icon: '📏' },
];

export function VitalsForm({ control, errors }: Props) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {vitalFields.map((field) => (
        <Controller
          key={field.name}
          name={field.name}
          control={control}
          render={({ field: { onChange, value } }) => (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {field.icon} {field.label}
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={value ?? ''}
                  onChange={(e) => onChange(e.target.value ? parseFloat(e.target.value) : null)}
                  min={field.min}
                  max={field.max}
                  step={field.step}
                  className="w-full px-3 py-2 border rounded-md pr-12"
                  placeholder={`${field.min}-${field.max}`}
                />
                <span className="absolute right-3 top-2 text-gray-400">{field.unit}</span>
              </div>
              {errors[field.name] && (
                <p className="text-red-500 text-xs mt-1">{errors[field.name]?.message as string}</p>
              )}
            </div>
          )}
        />
      ))}
    </div>
  );
}
```

### 5.4 MedicineSearchSelect Component

```typescript
// components/medical-exam/MedicineSearchSelect.tsx

interface MedicineOption {
  id: string;
  name: string;
  activeIngredient?: string;
  sellingPrice: number;
  quantity: number; // Available stock
  unit: string;
}

interface Props {
  value: string | null;
  onChange: (medicineId: string, medicine: MedicineOption | null) => void;
  disabled?: boolean;
  error?: string;
  excludeIds?: string[]; // Already selected medicines
}

export function MedicineSearchSelect({ value, onChange, disabled, error, excludeIds = [] }: Props) {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);

  const { data: medicines, isLoading } = useQuery({
    queryKey: ['medicines', 'search', debouncedSearch],
    queryFn: () => fetch(`/api/medicines?search=${debouncedSearch}&size=20`).then(r => r.json()),
    enabled: debouncedSearch.length > 0,
  });

  const options = medicines?.data?.content
    ?.filter((m: MedicineOption) => !excludeIds.includes(m.id))
    ?.map((m: MedicineOption) => ({
      value: m.id,
      label: m.name,
      subLabel: m.activeIngredient,
      price: m.sellingPrice,
      stock: m.quantity,
      unit: m.unit,
      medicine: m,
    }));

  return (
    <div>
      <Combobox
        value={value}
        onChange={(id) => {
          const selected = options?.find((o: any) => o.value === id);
          onChange(id, selected?.medicine || null);
        }}
        disabled={disabled}
      >
        <Combobox.Input
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search medicine by name..."
          className="w-full border rounded-md px-3 py-2"
        />
        <Combobox.Options className="absolute bg-white border rounded-md shadow-lg mt-1 max-h-60 overflow-auto">
          {isLoading && <div className="px-3 py-2 text-gray-500">Loading...</div>}
          {options?.map((option: any) => (
            <Combobox.Option
              key={option.value}
              value={option.value}
              className={({ active }) =>
                `px-3 py-2 cursor-pointer ${active ? 'bg-blue-50' : ''}`
              }
            >
              <div className="font-medium">{option.label}</div>
              <div className="text-sm text-gray-500">
                {option.subLabel && <span>{option.subLabel} • </span>}
                Price: {option.price.toLocaleString()}₫ • Stock: {option.stock} {option.unit}
              </div>
              {option.stock < 10 && (
                <div className="text-xs text-orange-500">⚠️ Low stock</div>
              )}
            </Combobox.Option>
          ))}
        </Combobox.Options>
      </Combobox>
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}
```

### 5.5 PrescriptionItemRow Component

```typescript
// components/medical-exam/PrescriptionItemRow.tsx

interface Props {
  index: number;
  control: Control<any>;
  errors: FieldErrors;
  onRemove: () => void;
  selectedMedicineIds: string[];
  canRemove: boolean;
}

export function PrescriptionItemRow({ index, control, errors, onRemove, selectedMedicineIds, canRemove }: Props) {
  const [selectedMedicine, setSelectedMedicine] = useState<MedicineOption | null>(null);

  const itemErrors = errors.items?.[index] as Record<string, { message?: string }> | undefined;

  return (
    <div className="border rounded-lg p-4 mb-4">
      <div className="flex justify-between items-start mb-4">
        <h4 className="font-medium">Medicine {index + 1}</h4>
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="text-red-500 hover:text-red-700"
          >
            🗑️ Remove
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Medicine Select */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium mb-1">Medicine *</label>
          <Controller
            name={`items.${index}.medicineId`}
            control={control}
            render={({ field }) => (
              <MedicineSearchSelect
                value={field.value}
                onChange={(id, medicine) => {
                  field.onChange(id);
                  setSelectedMedicine(medicine);
                }}
                error={itemErrors?.medicineId?.message}
                excludeIds={selectedMedicineIds.filter((_, i) => i !== index)}
              />
            )}
          />
          {selectedMedicine && (
            <div className="mt-2 text-sm text-gray-600">
              Stock: {selectedMedicine.quantity} {selectedMedicine.unit} |
              Price: {selectedMedicine.sellingPrice.toLocaleString()}₫/{selectedMedicine.unit}
            </div>
          )}
        </div>

        {/* Quantity */}
        <div>
          <label className="block text-sm font-medium mb-1">Quantity *</label>
          <Controller
            name={`items.${index}.quantity`}
            control={control}
            render={({ field }) => (
              <input
                type="number"
                {...field}
                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                min={1}
                max={selectedMedicine?.quantity || 9999}
                className="w-full border rounded-md px-3 py-2"
              />
            )}
          />
          {itemErrors?.quantity?.message && (
            <p className="text-red-500 text-xs mt-1">{itemErrors.quantity.message}</p>
          )}
        </div>

        {/* Dosage */}
        <div>
          <label className="block text-sm font-medium mb-1">Dosage *</label>
          <Controller
            name={`items.${index}.dosage`}
            control={control}
            render={({ field }) => (
              <input
                type="text"
                {...field}
                placeholder="e.g., 1 tablet twice daily"
                className="w-full border rounded-md px-3 py-2"
              />
            )}
          />
          {itemErrors?.dosage?.message && (
            <p className="text-red-500 text-xs mt-1">{itemErrors.dosage.message}</p>
          )}
        </div>

        {/* Duration */}
        <div>
          <label className="block text-sm font-medium mb-1">Duration (days)</label>
          <Controller
            name={`items.${index}.durationDays`}
            control={control}
            render={({ field }) => (
              <input
                type="number"
                {...field}
                onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)}
                min={1}
                className="w-full border rounded-md px-3 py-2"
              />
            )}
          />
        </div>

        {/* Instructions */}
        <div>
          <label className="block text-sm font-medium mb-1">Instructions</label>
          <Controller
            name={`items.${index}.instructions`}
            control={control}
            render={({ field }) => (
              <input
                type="text"
                {...field}
                placeholder="e.g., Take with food"
                className="w-full border rounded-md px-3 py-2"
              />
            )}
          />
        </div>
      </div>

      {/* Line Total */}
      {selectedMedicine && (
        <div className="mt-4 text-right text-sm">
          <span className="text-gray-500">Line Total: </span>
          <span className="font-medium">
            {(selectedMedicine.sellingPrice * (control._formValues.items?.[index]?.quantity || 0)).toLocaleString()}₫
          </span>
        </div>
      )}
    </div>
  );
}
```

### 5.6 EditCountdown Component

```typescript
// components/medical-exam/EditCountdown.tsx

interface Props {
  createdAt: string; // ISO datetime
  editWindowHours?: number; // Default 24
}

export function EditCountdown({ createdAt, editWindowHours = 24 }: Props) {
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [isEditable, setIsEditable] = useState(true);

  useEffect(() => {
    const calculateRemaining = () => {
      const created = new Date(createdAt);
      const deadline = new Date(created.getTime() + editWindowHours * 60 * 60 * 1000);
      const now = new Date();
      const diff = deadline.getTime() - now.getTime();

      if (diff <= 0) {
        setIsEditable(false);
        setTimeRemaining('Expired');
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      setTimeRemaining(`${hours}h ${minutes}m remaining`);
      setIsEditable(true);
    };

    calculateRemaining();
    const interval = setInterval(calculateRemaining, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [createdAt, editWindowHours]);

  return (
    <div className={`flex items-center gap-2 text-sm ${
      isEditable ? 'text-green-600' : 'text-gray-500'
    }`}>
      {isEditable ? (
        <>
          <span>⏱️</span>
          <span>Editable: {timeRemaining}</span>
        </>
      ) : (
        <>
          <span>🔒</span>
          <span>Read-only (edit window closed)</span>
        </>
      )}
    </div>
  );
}
```

### 5.7 ExamCard Component (Patient View)

```typescript
// components/medical-exam/ExamCard.tsx

interface Props {
  exam: {
    id: string;
    examDate: string;
    doctor: { fullName: string };
    diagnosis?: string;
    hasPrescription: boolean;
  };
  onClick: () => void;
}

export function ExamCard({ exam, onClick }: Props) {
  return (
    <div
      onClick={onClick}
      className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
    >
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-2 text-gray-500 text-sm">
            <span>📋</span>
            <span>{new Date(exam.examDate).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}</span>
          </div>
          <div className="font-medium mt-1">{exam.doctor.fullName}</div>
          {exam.diagnosis && (
            <div className="text-gray-600 text-sm mt-1">
              Diagnosis: {exam.diagnosis}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {exam.hasPrescription && (
            <span title="Has Prescription" className="text-xl">💊</span>
          )}
          <span className="text-gray-400">→</span>
        </div>
      </div>
    </div>
  );
}
```

---

## 6. Error Handling & Validation

### 6.1 API Error Response Format

All API errors follow this standard format:

```typescript
interface ApiErrorResponse {
  status: "error";
  error: {
    code: string;
    message: string;
    details?: Array<{
      field: string;
      message: string;
    }>;
  };
}
```

### 6.2 Complete Error Code Reference

#### 6.2.1 Authentication & Authorization Errors

| HTTP Status | Error Code   | Description                        | UI Handling                                                    |
| ----------- | ------------ | ---------------------------------- | -------------------------------------------------------------- |
| 401         | UNAUTHORIZED | Missing or invalid access token    | Redirect to `/login`, clear auth state                         |
| 403         | FORBIDDEN    | User role not authorized           | Show toast "You don't have permission to perform this action"  |
| 403         | FORBIDDEN    | Patients can only view own records | Show toast "You can only view your own medical records"        |
| 403         | FORBIDDEN    | Only creator doctor can update     | Show toast "Only the doctor who created this exam can edit it" |

#### 6.2.2 Medical Exam Validation Errors (400 VALIDATION_ERROR)

**Create/Update Exam Validation:**

| Field                  | Validation Rule   | Error Message                                              |
| ---------------------- | ----------------- | ---------------------------------------------------------- |
| appointmentId          | Required (create) | "appointmentId is required"                                |
| temperature            | Range 30.0-45.0   | "temperature must be between 30.0 and 45.0 (Celsius)"      |
| bloodPressureSystolic  | Range 50-250      | "bloodPressureSystolic must be between 50 and 250 (mmHg)"  |
| bloodPressureDiastolic | Range 30-150      | "bloodPressureDiastolic must be between 30 and 150 (mmHg)" |
| heartRate              | Range 30-200      | "heartRate must be between 30 and 200 (bpm)"               |
| weight                 | Positive          | "weight must be positive (> 0, in kg)"                     |
| height                 | Positive          | "height must be positive (> 0, in cm)"                     |
| diagnosis              | Max length        | "diagnosis exceeds maximum length (2000 characters)"       |
| symptoms               | Max length        | "symptoms exceeds maximum length (2000 characters)"        |
| treatment              | Max length        | "treatment exceeds maximum length (2000 characters)"       |
| notes                  | Max length        | "notes exceeds maximum length (2000 characters)"           |

**List Query Parameters Validation:**

| Parameter         | Validation Rule | Error Message                                                |
| ----------------- | --------------- | ------------------------------------------------------------ |
| page              | Non-negative    | "page must be >= 0"                                          |
| size              | Range 1-100     | "size must be between 1 and 100"                             |
| startDate         | Valid date      | "startDate must be valid ISO 8601 date"                      |
| endDate           | Valid date      | "endDate must be valid ISO 8601 date"                        |
| startDate/endDate | Date range      | "startDate cannot be after endDate"                          |
| sort              | Valid field     | "sort field must be one of [examDate, createdAt, diagnosis]" |

#### 6.2.3 Prescription Validation Errors (400 VALIDATION_ERROR)

| Field                | Validation Rule     | Error Message                                 |
| -------------------- | ------------------- | --------------------------------------------- |
| items                | Required, non-empty | "items array is required and cannot be empty" |
| items[].medicineId   | Required            | "items[].medicineId is required"              |
| items[].quantity     | Required            | "items[].quantity is required"                |
| items[].quantity     | Positive            | "items[].quantity must be positive (> 0)"     |
| items[].dosage       | Required            | "items[].dosage is required"                  |
| items[].durationDays | Positive            | "items[].durationDays must be positive (> 0)" |

#### 6.2.4 Business Logic Errors (400)

| Error Code                | Description               | When Triggered                            | UI Handling                                                                         |
| ------------------------- | ------------------------- | ----------------------------------------- | ----------------------------------------------------------------------------------- |
| APPOINTMENT_NOT_COMPLETED | Appointment not completed | Create exam for non-completed appointment | Show toast "Appointment must be completed before creating an exam"                  |
| EXAM_NOT_MODIFIABLE       | Edit window closed        | Update exam after 24 hours                | Show toast "Cannot modify exam after 24 hours", disable edit button                 |
| INSUFFICIENT_STOCK        | Not enough medicine       | Prescription quantity > stock             | Show toast "Insufficient stock for {medicine}. Available: {stock}", highlight field |

#### 6.2.5 Resource Not Found Errors (404)

| Error Code             | Description                | When Triggered                       | UI Handling                                      |
| ---------------------- | -------------------------- | ------------------------------------ | ------------------------------------------------ |
| EXAM_NOT_FOUND         | Exam doesn't exist         | Get/Update exam with invalid ID      | Show 404 page                                    |
| APPOINTMENT_NOT_FOUND  | Appointment doesn't exist  | Create exam with invalid appointment | Show toast "Appointment not found"               |
| MEDICINE_NOT_FOUND     | Medicine doesn't exist     | Prescription with invalid medicine   | Show toast "Medicine not found", highlight field |
| PRESCRIPTION_NOT_FOUND | Prescription doesn't exist | Get prescription with invalid ID     | Show 404 page or "No prescription" message       |
| PATIENT_NOT_FOUND      | Patient doesn't exist      | Get prescriptions by invalid patient | Show 404 page                                    |

#### 6.2.6 Conflict Errors (409)

| Error Code          | Description                 | When Triggered                      | UI Handling                                                     |
| ------------------- | --------------------------- | ----------------------------------- | --------------------------------------------------------------- |
| EXAM_EXISTS         | Exam already exists         | Create second exam for appointment  | Show toast "A medical exam already exists for this appointment" |
| PRESCRIPTION_EXISTS | Prescription already exists | Create second prescription for exam | Show toast "A prescription already exists for this exam"        |

### 6.3 Client-Side Validation

#### 6.3.1 Form Validation Schema (Zod)

```typescript
import { z } from "zod";

// Medical Exam Schema
export const medicalExamSchema = z.object({
  appointmentId: z.string().min(1, "Please select an appointment"),
  diagnosis: z
    .string()
    .max(2000, "Diagnosis cannot exceed 2000 characters")
    .optional(),
  symptoms: z
    .string()
    .max(2000, "Symptoms cannot exceed 2000 characters")
    .optional(),
  treatment: z
    .string()
    .max(2000, "Treatment cannot exceed 2000 characters")
    .optional(),
  temperature: z
    .number()
    .min(30, "Temperature must be at least 30°C")
    .max(45, "Temperature cannot exceed 45°C")
    .optional()
    .nullable(),
  bloodPressureSystolic: z
    .number()
    .int("BP Systolic must be a whole number")
    .min(50, "BP Systolic must be at least 50")
    .max(250, "BP Systolic cannot exceed 250")
    .optional()
    .nullable(),
  bloodPressureDiastolic: z
    .number()
    .int("BP Diastolic must be a whole number")
    .min(30, "BP Diastolic must be at least 30")
    .max(150, "BP Diastolic cannot exceed 150")
    .optional()
    .nullable(),
  heartRate: z
    .number()
    .int("Heart rate must be a whole number")
    .min(30, "Heart rate must be at least 30")
    .max(200, "Heart rate cannot exceed 200")
    .optional()
    .nullable(),
  weight: z.number().positive("Weight must be positive").optional().nullable(),
  height: z.number().positive("Height must be positive").optional().nullable(),
  notes: z.string().max(2000, "Notes cannot exceed 2000 characters").optional(),
});

// Prescription Item Schema
export const prescriptionItemSchema = z.object({
  medicineId: z.string().min(1, "Please select a medicine"),
  quantity: z
    .number()
    .int("Quantity must be a whole number")
    .positive("Quantity must be at least 1"),
  dosage: z
    .string()
    .min(1, "Dosage is required")
    .max(255, "Dosage cannot exceed 255 characters"),
  durationDays: z
    .number()
    .int("Duration must be a whole number")
    .positive("Duration must be at least 1 day")
    .optional()
    .nullable(),
  instructions: z
    .string()
    .max(500, "Instructions cannot exceed 500 characters")
    .optional(),
});

// Prescription Schema
export const prescriptionSchema = z.object({
  notes: z.string().max(2000, "Notes cannot exceed 2000 characters").optional(),
  items: z
    .array(prescriptionItemSchema)
    .min(1, "At least one medicine is required"),
});

// Type exports
export type MedicalExamInput = z.infer<typeof medicalExamSchema>;
export type PrescriptionItemInput = z.infer<typeof prescriptionItemSchema>;
export type PrescriptionInput = z.infer<typeof prescriptionSchema>;
```

### 6.4 Loading States

| State               | UI Behavior                                                          |
| ------------------- | -------------------------------------------------------------------- |
| Initial Load        | Show skeleton loader for list/cards                                  |
| Exam Form Submit    | Disable submit button, show spinner, text "Saving..."                |
| Prescription Submit | Disable submit button, show spinner, text "Creating Prescription..." |
| Medicine Search     | Show loading indicator in dropdown                                   |
| Refetching          | Show subtle loading indicator (not full skeleton)                    |

### 6.5 Empty States

| Scenario                   | Message                                          | Action                                                          |
| -------------------------- | ------------------------------------------------ | --------------------------------------------------------------- |
| No exams (admin)           | "No medical exams found"                         | "Adjust filters to see more results"                            |
| No exams (doctor)          | "You haven't created any medical exams yet"      | "Complete an appointment to create an exam"                     |
| No records (patient)       | "No medical records found"                       | "Your medical records will appear here after your appointments" |
| No prescription            | "No prescription has been created for this exam" | "Add Prescription" button (doctor only)                         |
| Medicine search no results | "No medicines found matching your search"        | "Try a different search term"                                   |

---

## Appendix A: TypeScript Interfaces

```typescript
// interfaces/medical-exam.ts

export interface Vitals {
  temperature?: number;
  bloodPressureSystolic?: number;
  bloodPressureDiastolic?: number;
  heartRate?: number;
  weight?: number;
  height?: number;
}

export interface AppointmentSummary {
  id: string;
  appointmentTime: string;
}

export interface PatientSummary {
  id: string;
  fullName: string;
}

export interface DoctorSummary {
  id: string;
  fullName: string;
}

export interface MedicalExam {
  id: string;
  appointment: AppointmentSummary;
  patient: PatientSummary;
  doctor: DoctorSummary;
  diagnosis?: string;
  symptoms?: string;
  treatment?: string;
  vitals: Vitals;
  notes?: string;
  examDate: string;
  createdAt: string;
  updatedAt: string;
  updatedBy?: string;
}

export interface MedicalExamListItem {
  id: string;
  appointment: AppointmentSummary;
  patient: PatientSummary;
  doctor: DoctorSummary;
  diagnosis?: string;
  examDate: string;
}

export interface MedicineSummary {
  id: string;
  name: string;
}

export interface PrescriptionItem {
  id: string;
  medicine: MedicineSummary;
  quantity: number;
  unitPrice: number;
  dosage: string;
  durationDays?: number;
  instructions?: string;
}

export interface Prescription {
  id: string;
  medicalExam: { id: string };
  patient: PatientSummary;
  doctor: DoctorSummary;
  prescribedAt: string;
  notes?: string;
  items: PrescriptionItem[];
  createdAt: string;
  updatedAt: string;
}

export interface PrescriptionListItem {
  id: string;
  medicalExam: { id: string };
  doctor: DoctorSummary;
  prescribedAt: string;
  itemCount: number;
}

// Request types
export interface MedicalExamCreateRequest {
  appointmentId: string;
  diagnosis?: string;
  symptoms?: string;
  treatment?: string;
  temperature?: number;
  bloodPressureSystolic?: number;
  bloodPressureDiastolic?: number;
  heartRate?: number;
  weight?: number;
  height?: number;
  notes?: string;
}

export interface MedicalExamUpdateRequest {
  diagnosis?: string;
  symptoms?: string;
  treatment?: string;
  temperature?: number;
  bloodPressureSystolic?: number;
  bloodPressureDiastolic?: number;
  heartRate?: number;
  weight?: number;
  height?: number;
  notes?: string;
}

export interface PrescriptionItemRequest {
  medicineId: string;
  quantity: number;
  dosage: string;
  durationDays?: number;
  instructions?: string;
}

export interface PrescriptionCreateRequest {
  notes?: string;
  items: PrescriptionItemRequest[];
}

export interface MedicalExamListParams {
  patientId?: string;
  doctorId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  size?: number;
  sort?: string;
}
```

---

## Appendix B: Implementation Checklist

### B.1 Pages to Implement

- [ ] `/admin/exams` - MedicalExamListPage
- [ ] `/admin/exams/{id}` - MedicalExamDetailPage (admin context)
- [ ] `/doctor/exams` - DoctorExamListPage
- [ ] `/doctor/exams/new` - MedicalExamFormPage (create mode)
- [ ] `/doctor/exams/{id}` - MedicalExamDetailPage (doctor context)
- [ ] `/doctor/exams/{id}/edit` - MedicalExamFormPage (edit mode)
- [ ] `/doctor/exams/{id}/prescription` - PrescriptionFormPage
- [ ] `/patient/medical-records` - PatientMedicalRecordsPage
- [ ] `/patient/medical-records/{id}` - MedicalExamDetailPage (patient context)
- [ ] `/patient/prescriptions` - PatientPrescriptionsPage
- [ ] `/patient/prescriptions/{id}` - PrescriptionDetailPage

### B.2 Components to Build

- [ ] VitalsPanel
- [ ] VitalsForm
- [ ] MedicineSearchSelect
- [ ] PrescriptionItemRow
- [ ] EditCountdown
- [ ] ExamCard
- [ ] ClinicalFindingsCard
- [ ] ExamStatusBadge
- [ ] PrescriptionIndicator

### B.3 Services & Hooks

- [ ] medical-exam.service.ts
- [ ] useMedicalExam.ts (React Query hooks)

### B.4 API Integration Checklist

**Medical Exam APIs:**

- [ ] POST /api/exams (create)
- [ ] GET /api/exams/{id} (get by ID)
- [ ] GET /api/exams/by-appointment/{appointmentId} (get by appointment)
- [ ] GET /api/exams (list with filters)
- [ ] PATCH /api/exams/{id} (update within 24h)

**Prescription APIs:**

- [ ] POST /api/exams/{examId}/prescriptions (create)
- [ ] GET /api/exams/{examId}/prescription (get by exam)
- [ ] GET /api/exams/prescriptions/{id} (get by ID)
- [ ] GET /api/exams/prescriptions/by-patient/{patientId} (get by patient)

### B.5 Cross-Service Integration

- [ ] GET /api/appointments?status=COMPLETED (completed appointments without exams)
- [ ] GET /api/medicines (medicine search for prescription)
- [ ] Medicine stock validation before prescription creation

### B.6 Testing Scenarios

**Happy Path:**

- [ ] Create medical exam from completed appointment
- [ ] View exam detail with all sections
- [ ] Edit exam within 24-hour window
- [ ] Create prescription with multiple medicines
- [ ] View prescription detail
- [ ] Patient views own medical records

**Error Scenarios:**

- [ ] Cannot create exam for non-completed appointment
- [ ] Cannot create duplicate exam for same appointment
- [ ] Cannot edit exam after 24 hours
- [ ] Cannot create prescription with insufficient stock
- [ ] Cannot create duplicate prescription
- [ ] Validation errors displayed correctly

**Edge Cases:**

- [ ] Edit countdown timer updates correctly
- [ ] Stock warning when quantity near limit
- [ ] Price snapshot preserved in prescription
- [ ] Patient cannot view others' records
- [ ] Only creator doctor can edit exam

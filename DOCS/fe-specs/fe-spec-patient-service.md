# Patient Service - Frontend Specification

**Project:** Hospital Management System  
**Service:** Patient Service (Patient Management)  
**Version:** 1.2  
**Last Updated:** December 6, 2025  
**Target Users:** ADMIN (full access), DOCTOR/NURSE (read + write), RECEPTIONIST (registration & basic info), PATIENT (own profile)

> **Note:** RECEPTIONIST role has specific permissions: register patients, update basic info, view records. Cannot access medical details or delete patients.

---

## 1. Overview & Screen Inventory

### 1.1 Service Scope

The Patient Service manages patient demographic information, health profiles, and emergency contacts. It provides:

- Patient registration (walk-in and self-registration)
- Patient profile management (view, edit, soft delete)
- Patient search and listing
- Health information management (blood type, allergies)
- Emergency contact management
- Patient history tracking

### 1.2 Related Backend

| Item          | Value           |
| ------------- | --------------- |
| **Service**   | patient-service |
| **Port**      | 8082            |
| **Base Path** | `/api/patients` |
| **Database**  | `patient_db`    |
| **Tables**    | `patients`      |

### 1.3 Cross-Service Relationships

| Relationship  | Target Service       | Description                                           |
| ------------- | -------------------- | ----------------------------------------------------- |
| `accountId`   | auth-service         | Links patient to user account (optional for walk-ins) |
| Referenced by | appointment-service  | `appointments.patientId`                              |
| Referenced by | medical-exam-service | `medical_exams.patientId`, `prescriptions.patientId`  |
| Referenced by | billing-service      | `invoices.patientId`                                  |

### 1.4 Screen Inventory

| Route                         | Screen Name      | Component            | Access                             | Priority |
| ----------------------------- | ---------------- | -------------------- | ---------------------------------- | -------- |
| `/admin/patients`             | Patient List     | `PatientListPage`    | ADMIN, DOCTOR, NURSE, RECEPTIONIST | P0       |
| `/admin/patients/new`         | Register Patient | `PatientFormPage`    | ADMIN, RECEPTIONIST | P0       |
| `/admin/patients/:id`         | Patient Detail   | `PatientDetailPage`  | ADMIN, DOCTOR, NURSE, RECEPTIONIST | P0       |
| `/admin/patients/:id/edit`    | Edit Patient     | `PatientFormPage`    | ADMIN, DOCTOR, NURSE, RECEPTIONIST | P0       |
| `/admin/patients/:id/history` | Patient History  | `PatientHistoryPage` | ADMIN, DOCTOR, NURSE               | P1       |
| `/profile`                    | My Profile       | `MyProfilePage`      | PATIENT                            | P0       |
| `/profile/edit`               | Edit My Profile  | `MyProfileEditPage`  | PATIENT                            | P1       |

### 1.5 Screen Hierarchy Diagram

```
/admin/patients
├── (list view with DataTable)
├── /new (registration form)
├── /:id (detail view)
│   ├── Overview tab
│   ├── Health Info tab
│   ├── Emergency Contact tab
│   └── Quick Actions (Edit, View History, Book Appointment)
├── /:id/edit (edit form - reuses PatientFormPage)
└── /:id/history (medical history timeline)

/profile (Patient self-service)
├── (view own profile)
└── /edit (edit limited fields)
```

---

## 2. User Flows & Acceptance Criteria

### 2.1 Flow: View Patient List

```
┌─────────────────────────────────────────────────────────────┐
│ Staff navigates to /admin/patients                          │
│                          ↓                                  │
│ System loads patient list with pagination                   │
│                          ↓                                  │
│ Staff can:                                                  │
│   - Search by name, phone, email, ID number                 │
│   - Filter by: Blood type, Gender, Status                   │
│   - Sort by: Name, Created date, DOB                        │
│                          ↓                                  │
│ Staff clicks row → Navigate to detail OR                    │
│ Staff clicks "Edit" → Navigate to edit form OR              │
│ Staff clicks "Register Patient" → Navigate to new form      │
└─────────────────────────────────────────────────────────────┘
```

**Acceptance Criteria:**

- [ ] Page loads within 2 seconds
- [ ] Table displays: Name, Phone, Email, Gender, Blood Type, Insurance #, Actions
- [ ] Search filters by name, phone, email, ID number (debounced 300ms)
- [ ] Blood type filter: All, A+, A-, B+, B-, AB+, AB-, O+, O-
- [ ] Gender filter: All, Male, Female, Other
- [ ] Pagination: 10, 20, 50 items per page
- [ ] Sort by: Name (default), Created Date, Date of Birth
- [ ] Empty state shown when no patients match filters
- [ ] Loading skeleton shown while fetching
- [ ] Soft-deleted patients are NOT shown (filtered by backend)

---

### 2.2 Flow: Register New Patient

```
┌─────────────────────────────────────────────────────────────┐
│ Staff (ADMIN/DOCTOR/NURSE/RECEPTIONIST) clicks "Register Patient"        │
│                          ↓                                  │
│ Navigate to /admin/patients/new                             │
│                          ↓                                  │
│ Form sections (collapsible):                                │
│ ┌─────────────────────────────────────────────────────────┐│
│ │ 1. Personal Information                                 ││
│ │    Full Name*, Email, Phone*, Date of Birth, Gender     ││
│ │    Address, ID Number, Insurance Number                 ││
│ ├─────────────────────────────────────────────────────────┤│
│ │ 2. Health Information                                   ││
│ │    Blood Type, Allergies (multi-input)                  ││
│ ├─────────────────────────────────────────────────────────┤│
│ │ 3. Emergency Contact                                    ││
│ │    Contact Name, Phone, Relationship                    ││
│ ├─────────────────────────────────────────────────────────┤│
│ │ 4. Account Linking (Optional)                           ││
│ │    Link to existing account or create new               ││
│ └─────────────────────────────────────────────────────────┘│
│                          ↓                                  │
│ Staff clicks "Register"                                     │
│         ↓                              ↓                    │
│   [Validation Pass]            [Validation Fail]            │
│         ↓                              ↓                    │
│   POST /api/patients           Show field errors            │
│         ↓                                                   │
│   ┌─────────┐    ┌──────────────┐                          │
│   │ Success │    │    Error     │                          │
│   └────┬────┘    └──────┬───────┘                          │
│        ↓                ↓                                   │
│   Toast "Registered"   Toast error message                  │
│   Redirect to detail   Stay on form                         │
└─────────────────────────────────────────────────────────────┘
```

**Acceptance Criteria:**

- [ ] Form validates on blur and on submit
- [ ] Full Name, Phone Number, and Date of Birth are required (red asterisk)
- [ ] Email validation: valid format if provided
- [ ] Phone validation: 10 digits, starts with 0 (Vietnamese format)
- [ ] Date of Birth: Required, cannot be in the future, ISO 8601 format
- [ ] Blood Type: Dropdown with 8 standard types
- [ ] Allergies: Tag input (comma-separated storage)
- [ ] Emergency contact fields are optional but recommended
- [ ] Success: Toast "Patient registered successfully", redirect to detail
- [ ] Error 409: Show "Patient with this phone/email already exists"
- [ ] "Cancel" button returns to list without saving

---

### 2.3 Flow: View Patient Detail

```
┌─────────────────────────────────────────────────────────────┐
│ Staff clicks on patient row or navigates to /:id            │
│                          ↓                                  │
│ GET /api/patients/{id}                                      │
│         ↓                              ↓                    │
│   [Found]                        [Not Found]                │
│      ↓                                ↓                     │
│ Display patient detail           Show 404 page              │
│                                                             │
│ Detail Page Layout:                                         │
│ ┌─────────────────────────────────────────────────────────┐│
│ │ Header: Patient Name, ID, Quick Actions                 ││
│ ├─────────────────────────────────────────────────────────┤│
│ │ Tabs: [Overview] [Health Info] [Emergency] [History]    ││
│ ├─────────────────────────────────────────────────────────┤│
│ │ Tab Content Area                                        ││
│ │ - Overview: Basic info, contact details                 ││
│ │ - Health: Blood type, allergies list                    ││
│ │ - Emergency: Contact person details                     ││
│ │ - History: Link to /history page                        ││
│ └─────────────────────────────────────────────────────────┘│
│                          ↓                                  │
│ Quick Actions:                                              │
│ - Edit Patient → /:id/edit                                  │
│ - Book Appointment → /appointments/new?patientId=:id        │
│ - View History → /:id/history                               │
│ - Delete Patient → Confirmation dialog                      │
└─────────────────────────────────────────────────────────────┘
```

**Acceptance Criteria:**

- [ ] All patient data displayed in organized tabs
- [ ] Age calculated from date of birth
- [ ] Allergies displayed as tags/badges
- [ ] Empty fields show "Not provided" placeholder
- [ ] Quick actions visible based on user role
- [ ] 404 page if patient not found or soft-deleted

---

### 2.4 Flow: Edit Patient

```
┌─────────────────────────────────────────────────────────────┐
│ Staff clicks "Edit" on patient detail or list               │
│                          ↓                                  │
│ Navigate to /admin/patients/:id/edit                        │
│                          ↓                                  │
│ GET /api/patients/{id} to pre-fill form                     │
│                          ↓                                  │
│ Staff modifies fields and clicks "Save"                     │
│                          ↓                                  │
│ PUT /api/patients/{id}                                      │
│ (All fields optional - partial update supported)            │
│         ↓                              ↓                    │
│   [Success]                      [Error]                    │
│      ↓                              ↓                       │
│ Toast "Updated"              Handle error                   │
│ Redirect to detail           Stay on form                   │
└─────────────────────────────────────────────────────────────┘
```

**Acceptance Criteria:**

- [ ] Form pre-fills with existing data
- [ ] Unchanged fields not sent in PUT request (partial update)
- [ ] Success: Toast "Patient updated successfully", redirect to detail
- [ ] 404: Show "Patient not found" error
- [ ] 409: Show conflict error if phone/email already used

---

### 2.5 Flow: Delete Patient (Soft Delete)

```
┌─────────────────────────────────────────────────────────────┐
│ ADMIN clicks "Delete" on patient                            │
│                          ↓                                  │
│ System checks for future appointments                       │
│         ↓                              ↓                    │
│ [Has appointments]            [No appointments]             │
│      ↓                              ↓                       │
│ Show warning:               Show confirmation:              │
│ "Patient has X future       "Delete patient [Name]?"        │
│  appointments. Cancel                                       │
│  them first."                      ↓                        │
│                             DELETE /api/patients/{id}       │
│                                    ↓                        │
│                             Toast "Patient deleted"         │
│                             Redirect to list                │
└─────────────────────────────────────────────────────────────┘
```

**Acceptance Criteria:**

- [ ] Confirmation dialog before delete
- [ ] Soft delete only (sets deletedAt, deletedBy)
- [ ] Success: Toast "Patient deleted", redirect to list
- [ ] Error 409: Show "Cannot delete patient with future appointments"
- [ ] Deleted patients hidden from list but preserved in database

---

### 2.6 Flow: Patient Self-Service (My Profile)

```
┌─────────────────────────────────────────────────────────────┐
│ PATIENT logs in and navigates to /profile                   │
│                          ↓                                  │
│ GET /api/patients/me                                        │
│ (Backend auto-resolves patient by accountId)                │
│                          ↓                                  │
│ Display own profile (read-only view)                        │
│                          ↓                                  │
│ PATIENT clicks "Edit Profile"                               │
│                          ↓                                  │
│ Navigate to /profile/edit                                   │
│                          ↓                                  │
│ Limited editable fields:                                    │
│ - Phone number, Address, Emergency contact                  │
│ (Cannot edit: Name, DOB, ID number - requires staff)        │
│                          ↓                                  │
│ PUT /api/patients/me                                        │
│                          ↓                                  │
│ Toast "Profile updated"                                     │
└─────────────────────────────────────────────────────────────┘
```

**Acceptance Criteria:**

- [ ] Patient can only view/edit own profile
- [ ] Limited fields editable (phone, address, emergency contact, allergies)
- [ ] Core identity fields read-only (name, DOB, ID)
- [ ] Success: Toast "Profile updated successfully"

---

## 3. Screen Specifications

### 3.1 Patient List Page

**Route:** `/admin/patients`  
**Component:** `PatientListPage`

#### 3.1.1 Fields & Data Table Columns

| Column      | Field                   | Type      | Sortable | Filterable  |
| ----------- | ----------------------- | --------- | -------- | ----------- |
| Avatar      | -                       | component | ❌       | ❌          |
| Name        | `fullName`              | string    | ✅       | ✅ (search) |
| Phone       | `phoneNumber`           | string    | ❌       | ✅ (search) |
| Email       | `email`                 | string    | ❌       | ✅ (search) |
| Gender      | `gender`                | badge     | ✅       | ✅ (select) |
| Blood Type  | `bloodType`             | badge     | ❌       | ✅ (select) |
| Insurance # | `healthInsuranceNumber` | string    | ❌       | ❌          |
| Actions     | -                       | buttons   | ❌       | ❌          |

#### 3.1.2 Component Hierarchy

```
PatientListPage
├── PageHeader
│   ├── Title ("Patients")
│   └── Button ("Register Patient") → /admin/patients/new
├── FilterBar
│   ├── SearchInput (name, phone, email, ID)
│   ├── GenderSelect (All, Male, Female, Other)
│   └── BloodTypeSelect (All, A+, A-, B+, B-, AB+, AB-, O+, O-)
├── DataTable
│   ├── TableHeader (sortable columns)
│   ├── TableBody
│   │   └── TableRow (for each patient)
│   │       ├── PatientAvatar
│   │       ├── NameCell (link to detail)
│   │       ├── PhoneCell
│   │       ├── EmailCell
│   │       ├── GenderBadge
│   │       ├── BloodTypeBadge
│   │       ├── InsuranceCell
│   │       └── ActionButtons (View, Edit, Delete)
│   └── TablePagination
├── DeleteConfirmDialog
└── EmptyState (when no data)
```

#### 3.1.3 Local State

```typescript
interface PatientListState {
  // Filter state
  searchQuery: string;
  genderFilter: "ALL" | "MALE" | "FEMALE" | "OTHER";
  bloodTypeFilter: string | "ALL";

  // Pagination state
  page: number;
  pageSize: number;
  sortField: string;
  sortDirection: "asc" | "desc";

  // UI state
  deleteDialogOpen: boolean;
  patientToDelete: Patient | null;
}
```

#### 3.1.4 Role-Based Visibility

| Element         | ADMIN | DOCTOR | NURSE | EMPLOYEE | PATIENT |
| --------------- | ----- | ------ | ----- | -------- | ------- |
| Page Access     | ✅    | ✅     | ✅    | ✅       | ❌      |
| Register Button | ✅    | ✅     | ✅    | ✅       | ❌      |
| Edit Button     | ✅    | ✅     | ✅    | ✅       | ❌      |
| Delete Button   | ✅    | ❌     | ❌    | ❌       | ❌      |
| View Button     | ✅    | ✅     | ✅    | ✅       | ❌      |

---

### 3.2 Patient Form Page (Create/Edit)

**Route:** `/admin/patients/new` or `/admin/patients/:id/edit`  
**Component:** `PatientFormPage`

#### 3.2.1 Form Sections

**Section 1: Personal Information**

| Field                   | Label         | Type     | Required | Validation               |
| ----------------------- | ------------- | -------- | -------- | ------------------------ |
| `fullName`              | Full Name     | text     | ✅       | max 255 chars            |
| `email`                 | Email         | email    | ❌       | valid email format       |
| `phoneNumber`           | Phone Number  | tel      | ✅       | 10 digits, starts with 0 |
| `dateOfBirth`           | Date of Birth | date     | ✅       | ISO 8601, not future     |
| `gender`                | Gender        | select   | ❌       | MALE, FEMALE, OTHER      |
| `address`               | Address       | textarea | ❌       | max 500 chars            |
| `identificationNumber`  | ID Number     | text     | ❌       | max 50 chars             |
| `healthInsuranceNumber` | Insurance #   | text     | ❌       | max 50 chars             |

**Section 2: Health Information**

| Field       | Label      | Type      | Required | Validation       |
| ----------- | ---------- | --------- | -------- | ---------------- |
| `bloodType` | Blood Type | select    | ❌       | 8 standard types |
| `allergies` | Allergies  | tag-input | ❌       | array of strings |

**Section 3: Emergency Contact**

| Field                  | Label         | Type   | Required | Validation                                    |
| ---------------------- | ------------- | ------ | -------- | --------------------------------------------- |
| `relativeFullName`     | Contact Name  | text   | ❌       | max 255 chars                                 |
| `relativePhoneNumber`  | Contact Phone | tel    | ❌       | 10-15 digits                                  |
| `relativeRelationship` | Relationship  | select | ❌       | SPOUSE, PARENT, CHILD, SIBLING, FRIEND, OTHER |

**Section 4: Account Linking (Optional)**

| Field       | Label        | Type              | Required | Validation       |
| ----------- | ------------ | ----------------- | -------- | ---------------- |
| `accountId` | Link Account | searchable-select | ❌       | valid account ID |

#### 3.2.2 Component Hierarchy

```
PatientFormPage
├── PageHeader
│   ├── BackButton → /admin/patients
│   └── Title ("Register Patient" or "Edit Patient")
├── Form
│   ├── CollapsibleSection: "Personal Information"
│   │   ├── FormField (fullName) - TextInput
│   │   ├── FormField (email) - EmailInput
│   │   ├── FormField (phoneNumber) - PhoneInput
│   │   ├── FormField (dateOfBirth) - DatePicker
│   │   ├── FormField (gender) - Select
│   │   ├── FormField (address) - Textarea
│   │   ├── FormField (identificationNumber) - TextInput
│   │   └── FormField (healthInsuranceNumber) - TextInput
│   ├── CollapsibleSection: "Health Information"
│   │   ├── FormField (bloodType) - Select
│   │   └── FormField (allergies) - TagInput
│   ├── CollapsibleSection: "Emergency Contact"
│   │   ├── FormField (relativeFullName) - TextInput
│   │   ├── FormField (relativePhoneNumber) - PhoneInput
│   │   └── FormField (relativeRelationship) - Select
│   ├── CollapsibleSection: "Account Linking"
│   │   └── FormField (accountId) - SearchableSelect
│   └── FormActions
│       ├── CancelButton → /admin/patients
│       └── SubmitButton ("Register" or "Save")
└── UnsavedChangesDialog
```

#### 3.2.3 Form State

```typescript
interface PatientFormState {
  values: {
    fullName: string;
    email: string;
    phoneNumber: string;
    dateOfBirth: string | null;
    gender: "MALE" | "FEMALE" | "OTHER" | null;
    address: string;
    identificationNumber: string;
    healthInsuranceNumber: string;
    bloodType: string | null;
    allergies: string[];
    relativeFullName: string;
    relativePhoneNumber: string;
    relativeRelationship: string | null;
    accountId: string | null;
  };

  errors: Record<string, string>;
  isDirty: boolean;
  isSubmitting: boolean;
  isLoading: boolean; // For edit mode pre-fill
  originalValues: PatientFormState["values"] | null;
}
```

---

### 3.3 Patient Detail Page

**Route:** `/admin/patients/:id`  
**Component:** `PatientDetailPage`

#### 3.3.1 Component Hierarchy

```
PatientDetailPage
├── PageHeader
│   ├── BackButton → /admin/patients
│   ├── PatientAvatar (large)
│   ├── PatientName
│   ├── PatientId
│   └── QuickActions
│       ├── EditButton → /:id/edit (ADMIN, DOCTOR, NURSE)
│       ├── BookAppointmentButton → /appointments/new?patientId=:id
│       ├── ViewHistoryButton → /:id/history
│       └── DeleteButton (ADMIN only)
├── TabNavigation
│   ├── Tab: "Overview"
│   ├── Tab: "Health Info"
│   ├── Tab: "Emergency Contact"
│   └── Tab: "History" (link to /history)
├── TabContent
│   ├── OverviewTab
│   │   ├── InfoSection: "Contact Information"
│   │   │   ├── InfoRow (Email)
│   │   │   ├── InfoRow (Phone)
│   │   │   └── InfoRow (Address)
│   │   ├── InfoSection: "Personal Details"
│   │   │   ├── InfoRow (Date of Birth + Age)
│   │   │   ├── InfoRow (Gender)
│   │   │   ├── InfoRow (ID Number)
│   │   │   └── InfoRow (Insurance Number)
│   │   └── InfoSection: "Account"
│   │       └── InfoRow (Linked Account or "Not linked")
│   ├── HealthInfoTab
│   │   ├── InfoSection: "Blood Type"
│   │   │   └── BloodTypeBadge (large)
│   │   └── InfoSection: "Allergies"
│   │       └── AllergyTags or "No allergies recorded"
│   └── EmergencyContactTab
│       ├── InfoRow (Contact Name)
│       ├── InfoRow (Phone)
│       └── InfoRow (Relationship)
├── DeleteConfirmDialog
└── LoadingSkeleton (while fetching)
```

#### 3.3.2 Tab Content Display

```typescript
// Overview Tab
interface OverviewTabProps {
  patient: Patient;
}

// Calculate age from DOB
function calculateAge(dateOfBirth: string): number {
  const dob = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  return age;
}

// Display format for DOB
// "January 15, 1990 (35 years old)"
```

---

### 3.4 Patient History Page

**Route:** `/admin/patients/:id/history`  
**Component:** `PatientHistoryPage`

#### 3.4.1 Component Hierarchy

```
PatientHistoryPage
├── PageHeader
│   ├── BackButton → /admin/patients/:id
│   ├── PatientInfo (name, avatar)
│   └── DateRangePicker
├── FilterBar
│   ├── EventTypeFilter (All, Appointments, Exams, Invoices)
│   └── DateRangePicker
├── Timeline
│   └── TimelineEvent (for each event)
│       ├── EventIcon (based on type)
│       ├── EventDate
│       ├── EventTitle
│       ├── EventSummary
│       └── ViewDetailLink
└── EmptyState ("No history found")
```

#### 3.4.2 Timeline Event Types

```typescript
interface TimelineEvent {
  id: string;
  type: "APPOINTMENT" | "EXAM" | "INVOICE";
  date: string;
  title: string;
  summary: string;
  status?: string;
  detailUrl: string;
}

// Event type styling
const eventTypeConfig = {
  APPOINTMENT: {
    icon: CalendarIcon,
    color: "blue",
    label: "Appointment",
  },
  EXAM: {
    icon: StethoscopeIcon,
    color: "green",
    label: "Medical Exam",
  },
  INVOICE: {
    icon: ReceiptIcon,
    color: "yellow",
    label: "Invoice",
  },
};
```

---

### 3.5 My Profile Page (Patient Self-Service)

**Route:** `/profile`  
**Component:** `MyProfilePage`

#### 3.5.1 Component Hierarchy

```
MyProfilePage
├── PageHeader
│   ├── Title ("My Profile")
│   └── EditButton → /profile/edit
├── ProfileCard
│   ├── PatientAvatar (xl size)
│   ├── PatientName
│   └── PatientId
├── ProfileSections
│   ├── Section: "Contact Information"
│   │   ├── InfoRow (Email)
│   │   ├── InfoRow (Phone) - editable indicator
│   │   └── InfoRow (Address) - editable indicator
│   ├── Section: "Personal Details"
│   │   ├── InfoRow (Date of Birth)
│   │   ├── InfoRow (Gender)
│   │   └── InfoRow (ID Number)
│   ├── Section: "Health Information"
│   │   ├── BloodTypeBadge
│   │   └── AllergyTags - editable indicator
│   └── Section: "Emergency Contact" - editable indicator
│       ├── InfoRow (Contact Name)
│       ├── InfoRow (Phone)
│       └── InfoRow (Relationship)
└── EditButton (floating)
```

#### 3.5.2 Editable vs Read-Only Fields

| Field                   | Editable by Patient |
| ----------------------- | ------------------- |
| Full Name               | ❌                  |
| Email                   | ❌                  |
| Phone Number            | ✅                  |
| Date of Birth           | ❌                  |
| Gender                  | ❌                  |
| Address                 | ✅                  |
| ID Number               | ❌                  |
| Insurance Number        | ❌                  |
| Blood Type              | ❌                  |
| Allergies               | ✅                  |
| Emergency Contact (all) | ✅                  |

---

### 3.6 Edit My Profile Page (Patient Self-Service)

**Route:** `/profile/edit`  
**Component:** `MyProfileEditPage`

#### 3.6.1 Component Hierarchy

```
MyProfileEditPage
├── PageHeader
│   ├── BackButton → /profile
│   └── Title ("Edit Profile")
├── Form
│   ├── Section: "Contact Information"
│   │   ├── FormField (phoneNumber) - PhoneInput
│   │   └── FormField (address) - Textarea
│   ├── Section: "Health Information"
│   │   └── FormField (allergies) - TagInput
│   ├── Section: "Emergency Contact"
│   │   ├── FormField (relativeFullName) - TextInput
│   │   ├── FormField (relativePhoneNumber) - PhoneInput
│   │   └── FormField (relativeRelationship) - Select
│   └── FormActions
│       ├── CancelButton → /profile
│       └── SaveButton
├── ReadOnlyFieldsNote
│   └── "Some fields can only be updated by hospital staff"
└── UnsavedChangesDialog
```

---

## 4. API Integration & Data Mapping

### 4.1 Patient APIs

#### 4.1.1 List Patients

| Property         | Value                                                   |
| ---------------- | ------------------------------------------------------- |
| **Endpoint**     | `GET /api/patients`                                     |
| **Used By**      | `PatientListPage`                                       |
| **Access**       | ADMIN, DOCTOR, NURSE, RECEPTIONIST (per API contract)   |
| **Query Params** | `page`, `size`, `sort`, `search`, `gender`, `bloodType` |

**Request Example:**

```typescript
const params = {
  page: 0,
  size: 20,
  sort: "fullName,asc",
  search: "nguyen", // Searches name, phone, email, ID
  gender: "MALE", // Optional filter
  bloodType: "O+", // Optional filter
};

// GET /api/patients?page=0&size=20&sort=fullName,asc&search=nguyen&gender=MALE&bloodType=O%2B
```

**Response (200 OK):**

```typescript
{
  status: 'success',
  data: {
    content: [
      {
        id: 'p001',
        accountId: '550e8400-e29b-41d4-a716-446655440002',
        fullName: 'Nguyen Van A',
        email: 'patient1@gmail.com',
        dateOfBirth: '1990-01-15T00:00:00Z',
        gender: 'MALE',
        phoneNumber: '0901234567',
        address: '123 Le Loi, District 1, HCMC',
        identificationNumber: '079090001234',
        healthInsuranceNumber: 'HC123456789',
        bloodType: 'O+',
        allergies: 'Penicillin, Peanuts',
        relativeFullName: 'Nguyen Thi B',
        relativePhoneNumber: '0907654321',
        relativeRelationship: 'SPOUSE',
        createdAt: '2025-12-01T10:00:00Z',
        updatedAt: '2025-12-01T10:00:00Z'
      }
    ],
    page: 0,
    size: 20,
    totalElements: 150,
    totalPages: 8
  }
}
```

**Response Handling:**

```typescript
// Success (200)
// → Update table data + pagination state

// Error (401)
// → Redirect to login

// Error (403)
// → Toast "You don't have permission to view patients"
```

---

#### 4.1.2 Get Patient by ID

| Property     | Value                                                                   |
| ------------ | ----------------------------------------------------------------------- |
| **Endpoint** | `GET /api/patients/{id}`                                                |
| **Used By**  | `PatientDetailPage`, `PatientFormPage` (edit mode)                      |
| **Access**   | ADMIN, DOCTOR, NURSE, RECEPTIONIST (all patients) \| PATIENT (own data) |

**Response (200 OK):**

```typescript
{
  status: 'success',
  data: {
    id: 'p001',
    accountId: '550e8400-e29b-41d4-a716-446655440002',
    fullName: 'Nguyen Van A',
    email: 'patient1@gmail.com',
    dateOfBirth: '1990-01-15T00:00:00Z',
    gender: 'MALE',
    phoneNumber: '0901234567',
    address: '123 Le Loi, District 1, HCMC',
    identificationNumber: '079090001234',
    healthInsuranceNumber: 'HC123456789',
    bloodType: 'O+',
    allergies: 'Penicillin, Peanuts',
    relativeFullName: 'Nguyen Thi B',
    relativePhoneNumber: '0907654321',
    relativeRelationship: 'SPOUSE',
    createdAt: '2025-12-01T10:00:00Z',
    updatedAt: '2025-12-01T10:00:00Z'
  }
}
```

**Response Handling:**

```typescript
// Success (200)
// → Display patient details or pre-fill form

// Error (404)
// → Show 404 page "Patient not found"
```

---

#### 4.1.3 Get My Profile (Patient Self-Service)

| Property     | Value                                                                     |
| ------------ | ------------------------------------------------------------------------- |
| **Endpoint** | `GET /api/patients/me`                                                    |
| **Used By**  | `MyProfilePage`, `MyProfileEditPage`                                      |
| **Access**   | PATIENT (own profile only, auto-resolved by backend via X-User-ID header) |

**Response:** Same structure as Get Patient by ID

**Response Handling:**

```typescript
// Success (200)
// → Display patient's own profile

// Error (403)
// → Show "You don't have permission to view this profile"

// Error (404)
// → Show "Profile not found - contact reception"
// (This happens if PATIENT account not linked to patient record)
```

---

#### 4.1.4 Create Patient

| Property     | Value                              |
| ------------ | ---------------------------------- |
| **Endpoint** | `POST /api/patients`               |
| **Used By**  | `PatientFormPage` (create mode)    |
| **Access**   | ADMIN, DOCTOR, NURSE, RECEPTIONIST |

**Request Body:**

```typescript
interface CreatePatientRequest {
  accountId?: string; // Optional - link to account
  fullName: string; // Required
  email?: string;
  phoneNumber: string; // Required, 10 digits starting with 0
  dateOfBirth: string; // Required, ISO 8601 (YYYY-MM-DD)
  gender?: "MALE" | "FEMALE" | "OTHER";
  address?: string;
  identificationNumber?: string;
  healthInsuranceNumber?: string;
  bloodType?: string;
  allergies?: string; // Comma-separated
  relativeFullName?: string;
  relativePhoneNumber?: string;
  relativeRelationship?: string;
}
```

**UI → Request Mapping:**

```typescript
const requestBody = {
  accountId: form.accountId || undefined,
  fullName: form.fullName.trim(),
  email: form.email?.trim() || undefined,
  phoneNumber: form.phoneNumber.trim(),
  dateOfBirth: form.dateOfBirth ? formatISODate(form.dateOfBirth) : undefined,
  gender: form.gender || undefined,
  address: form.address?.trim() || undefined,
  identificationNumber: form.identificationNumber?.trim() || undefined,
  healthInsuranceNumber: form.healthInsuranceNumber?.trim() || undefined,
  bloodType: form.bloodType || undefined,
  allergies: form.allergies.length > 0 ? form.allergies.join(", ") : undefined,
  relativeFullName: form.relativeFullName?.trim() || undefined,
  relativePhoneNumber: form.relativePhoneNumber?.trim() || undefined,
  relativeRelationship: form.relativeRelationship || undefined,
};
```

**Response Handling:**

```typescript
// Success (201)
// → Toast "Patient registered successfully"
// → Navigate to /admin/patients/{newId}

// Error (400) - Validation
{
  status: 'error',
  error: {
    code: 'VALIDATION_ERROR',
    message: 'Validation failed',
    details: [
      { field: 'fullName', message: 'Full name is required' },
      { field: 'phoneNumber', message: 'Phone number must be 10-15 digits' }
    ]
  }
}
// → Set field errors in form state

// Error (404) - Account not found
// → Set error on accountId field: "Account not found"

// Error (409) - Duplicate phone/email
// → Toast "Patient with this phone/email already exists"
```

---

#### 4.1.5 Update Patient

| Property     | Value                              |
| ------------ | ---------------------------------- |
| **Endpoint** | `PUT /api/patients/{id}`           |
| **Used By**  | `PatientFormPage` (edit mode)      |
| **Access**   | ADMIN, DOCTOR, NURSE, RECEPTIONIST |

> **Note:** API uses PUT method but accepts partial updates (all fields optional).

**Request Body:** Same as Create, all fields optional

**UI → Request Mapping:**

```typescript
// Only send changed fields
const changedFields = getChangedFields(originalValues, currentValues);
const requestBody = changedFields;
```

**Response Handling:**

```typescript
// Success (200)
// → Toast "Patient updated successfully"
// → Navigate to /admin/patients/{id}

// Error (404)
// → Toast "Patient not found"

// Error (409)
// → Toast "Phone/email already in use by another patient"
```

---

#### 4.1.6 Update My Profile (Patient Self-Service)

| Property     | Value                                                |
| ------------ | ---------------------------------------------------- |
| **Endpoint** | `PUT /api/patients/me`                               |
| **Used By**  | `MyProfileEditPage`                                  |
| **Access**   | PATIENT (own profile only, auto-resolved by backend) |

**Allowed Fields (Limited):**

```typescript
interface UpdateMyProfileRequest {
  phoneNumber?: string;
  address?: string;
  allergies?: string;
  relativeFullName?: string;
  relativePhoneNumber?: string;
  relativeRelationship?: string;
}
// Note: fullName, email, dateOfBirth, gender, bloodType NOT allowed
```

**Response Handling:**

```typescript
// Success (200)
// → Toast "Profile updated successfully"
// → Navigate to /profile

// Error (400) - Trying to update restricted fields
// → Toast "Cannot update restricted fields. Contact reception."
```

---

#### 4.1.7 Delete Patient (Soft Delete)

| Property     | Value                                  |
| ------------ | -------------------------------------- |
| **Endpoint** | `DELETE /api/patients/{id}`            |
| **Used By**  | `PatientDetailPage`, `PatientListPage` |
| **Access**   | ADMIN only                             |

**Response (200 OK):**

```typescript
{
  status: 'success',
  data: {
    id: 'p001',
    deletedAt: '2025-12-04T10:00:00Z',
    deletedBy: 'admin001'
  }
}
```

**Response Handling:**

```typescript
// Success (200)
// → Toast "Patient deleted successfully"
// → Navigate to /admin/patients (list)
// → Remove from list if already on list page

// Error (404)
// → Toast "Patient not found"

// Error (409) - Has future appointments
{
  status: 'error',
  error: {
    code: 'HAS_FUTURE_APPOINTMENTS',
    message: 'Cannot delete patient with future appointments',
    details: [
      { field: 'appointments', message: 'Patient has 3 scheduled appointments' }
    ]
  }
}
// → Toast "Cannot delete: Patient has 3 scheduled appointments. Cancel them first."
```

---

### 4.2 React Query Hooks

```typescript
// hooks/queries/usePatients.ts

// List patients
export function usePatients(params: PatientListParams) {
  return useQuery({
    queryKey: ["patients", "list", params],
    queryFn: () => patientService.getPatients(params),
  });
}

// Get patient by ID
export function usePatient(id: string) {
  return useQuery({
    queryKey: ["patients", "detail", id],
    queryFn: () => patientService.getPatient(id),
    enabled: !!id,
  });
}

// Get my profile (patient self-service)
export function useMyProfile() {
  return useQuery({
    queryKey: ["patients", "me"],
    queryFn: () => patientService.getMyProfile(),
  });
}

// Create patient
export function useCreatePatient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreatePatientRequest) =>
      patientService.createPatient(data),
    onSuccess: (newPatient) => {
      queryClient.invalidateQueries({ queryKey: ["patients", "list"] });
      toast.success("Patient registered successfully");
    },
    onError: (error) => {
      handleApiError(error);
    },
  });
}

// Update patient
export function useUpdatePatient(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdatePatientRequest) =>
      patientService.updatePatient(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patients", "detail", id] });
      queryClient.invalidateQueries({ queryKey: ["patients", "list"] });
      toast.success("Patient updated successfully");
    },
    onError: (error) => {
      handleApiError(error);
    },
  });
}

// Update my profile
export function useUpdateMyProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateMyProfileRequest) =>
      patientService.updateMyProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patients", "me"] });
      toast.success("Profile updated successfully");
    },
    onError: (error) => {
      handleApiError(error);
    },
  });
}

// Delete patient
export function useDeletePatient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => patientService.deletePatient(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patients", "list"] });
      toast.success("Patient deleted successfully");
    },
    onError: (error) => {
      handleApiError(error);
    },
  });
}
```

---

### 4.3 Cache Key Patterns

```typescript
const patientQueryKeys = {
  // Base
  all: ["patients"] as const,

  // List with filters
  list: (params: PatientListParams) => ["patients", "list", params] as const,

  // Single patient
  detail: (id: string) => ["patients", "detail", id] as const,

  // My profile (patient self-service)
  me: () => ["patients", "me"] as const,

  // Patient history (cross-service)
  history: (id: string) => ["patients", "history", id] as const,
};

// Invalidation patterns
// After create patient:
queryClient.invalidateQueries({ queryKey: patientQueryKeys.all });

// After update patient:
queryClient.invalidateQueries({ queryKey: ["patients", "detail", id] });
queryClient.invalidateQueries({ queryKey: ["patients", "list"] });

// After delete patient:
queryClient.invalidateQueries({ queryKey: patientQueryKeys.all });
```

---

### 4.4 Cross-Service Data Fetching

```typescript
// Patient history requires data from multiple services
async function fetchPatientHistory(patientId: string, dateRange: DateRange) {
  const [appointments, exams, invoices] = await Promise.all([
    appointmentService.getByPatient(patientId, dateRange),
    medicalExamService.getByPatient(patientId, dateRange),
    billingService.getInvoicesByPatient(patientId, dateRange),
  ]);

  // Merge and sort by date
  const events: TimelineEvent[] = [
    ...appointments.map((apt) => ({
      id: apt.id,
      type: "APPOINTMENT" as const,
      date: apt.appointmentTime,
      title: `${apt.type} - ${apt.doctor.department.name}`,
      summary: `Dr. ${apt.doctor.fullName} - ${apt.status}`,
      status: apt.status,
      detailUrl: `/admin/appointments/${apt.id}`,
    })),
    ...exams.map((exam) => ({
      id: exam.id,
      type: "EXAM" as const,
      date: exam.examDate,
      title: "Medical Examination",
      summary: `Diagnosis: ${exam.diagnosis || "Pending"}`,
      detailUrl: `/admin/medical-exams/${exam.id}`,
    })),
    ...invoices.map((inv) => ({
      id: inv.id,
      type: "INVOICE" as const,
      date: inv.invoiceDate,
      title: `Invoice ${inv.invoiceNumber}`,
      summary: `${formatCurrency(inv.totalAmount)} - ${inv.status}`,
      status: inv.status,
      detailUrl: `/admin/billing/invoices/${inv.id}`,
    })),
  ];

  return events.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
}
```

---

## 5. Shared Components & Global State

### 5.1 Reusable Components

| Component             | Used In             | Props                     | Description                    |
| --------------------- | ------------------- | ------------------------- | ------------------------------ |
| `PatientAvatar`       | List, Detail, Forms | name, size                | Circular avatar with initials  |
| `GenderBadge`         | List, Detail        | gender                    | Colored badge (blue/pink/gray) |
| `BloodTypeBadge`      | List, Detail        | bloodType                 | Colored badge with blood type  |
| `AllergyTags`         | Detail, Forms       | allergies[]               | List of allergy tags           |
| `PatientSearchSelect` | Appointment forms   | onSelect                  | Searchable patient dropdown    |
| `TagInput`            | Patient form        | tags[], onAdd, onRemove   | Multi-value tag input          |
| `PhoneInput`          | Forms               | value, onChange, error    | Phone number with validation   |
| `DeleteConfirmDialog` | List, Detail        | title, message, onConfirm | Confirmation dialog            |

### 5.2 Patient Avatar Component

```typescript
interface PatientAvatarProps {
  name: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

function PatientAvatar({ name, size = "md", className }: PatientAvatarProps) {
  const initials = getInitials(name);
  const backgroundColor = getColorFromName(name);

  const sizeClasses = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-12 h-12 text-base",
    xl: "w-16 h-16 text-lg",
  };

  return (
    <div
      className={cn(
        "rounded-full flex items-center justify-center text-white font-medium",
        sizeClasses[size],
        className
      )}
      style={{ backgroundColor }}
    >
      {initials}
    </div>
  );
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();
}

function getColorFromName(name: string): string {
  const colors = [
    "#3b82f6",
    "#ef4444",
    "#10b981",
    "#f59e0b",
    "#8b5cf6",
    "#ec4899",
    "#06b6d4",
    "#84cc16",
  ];
  const hash = name
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
}
```

### 5.3 Allergy Tag Input

```typescript
interface TagInputProps {
  tags: string[];
  onAdd: (tag: string) => void;
  onRemove: (tag: string) => void;
  placeholder?: string;
  suggestions?: string[]; // Common allergies
}

// Common allergy suggestions
const commonAllergies = [
  "Penicillin",
  "Aspirin",
  "Ibuprofen",
  "Sulfa drugs",
  "Peanuts",
  "Tree nuts",
  "Shellfish",
  "Eggs",
  "Milk",
  "Latex",
  "Bee stings",
  "Contrast dye",
];
```

### 5.4 Patient Search Select

```typescript
// Used in appointment booking, invoice creation
interface PatientSearchSelectProps {
  value: string | null;
  onChange: (patientId: string | null) => void;
  disabled?: boolean;
  error?: string;
}

function PatientSearchSelect({
  value,
  onChange,
  disabled,
  error,
}: PatientSearchSelectProps) {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);

  const { data, isLoading } = usePatients({
    search: debouncedSearch,
    size: 10,
  });

  return (
    <Combobox value={value} onChange={onChange} disabled={disabled}>
      <ComboboxInput
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by name, phone, or email..."
      />
      <ComboboxOptions>
        {isLoading && <div className="p-2">Loading...</div>}
        {data?.content.map((patient) => (
          <ComboboxOption key={patient.id} value={patient.id}>
            <div className="flex items-center gap-2">
              <PatientAvatar name={patient.fullName} size="sm" />
              <div>
                <div className="font-medium">{patient.fullName}</div>
                <div className="text-sm text-gray-500">
                  {patient.phoneNumber}
                </div>
              </div>
            </div>
          </ComboboxOption>
        ))}
      </ComboboxOptions>
    </Combobox>
  );
}
```

### 5.5 Data Transformation Utilities

```typescript
// utils/patient.ts

// Transform API response to form state
export function apiToFormValues(patient: Patient): PatientFormValues {
  return {
    fullName: patient.fullName,
    email: patient.email || "",
    phoneNumber: patient.phoneNumber,
    dateOfBirth: patient.dateOfBirth
      ? formatDateForInput(patient.dateOfBirth)
      : null,
    gender: patient.gender || null,
    address: patient.address || "",
    identificationNumber: patient.identificationNumber || "",
    healthInsuranceNumber: patient.healthInsuranceNumber || "",
    bloodType: patient.bloodType || null,
    allergies: patient.allergies ? patient.allergies.split(", ") : [],
    relativeFullName: patient.relativeFullName || "",
    relativePhoneNumber: patient.relativePhoneNumber || "",
    relativeRelationship: patient.relativeRelationship || null,
    accountId: patient.accountId || null,
  };
}

// Transform form state to API request
export function formValuesToRequest(
  values: PatientFormValues,
): CreatePatientRequest {
  return {
    fullName: values.fullName.trim(),
    email: values.email?.trim() || undefined,
    phoneNumber: values.phoneNumber.trim(),
    dateOfBirth: values.dateOfBirth || undefined,
    gender: values.gender || undefined,
    address: values.address?.trim() || undefined,
    identificationNumber: values.identificationNumber?.trim() || undefined,
    healthInsuranceNumber: values.healthInsuranceNumber?.trim() || undefined,
    bloodType: values.bloodType || undefined,
    allergies:
      values.allergies.length > 0 ? values.allergies.join(", ") : undefined,
    relativeFullName: values.relativeFullName?.trim() || undefined,
    relativePhoneNumber: values.relativePhoneNumber?.trim() || undefined,
    relativeRelationship: values.relativeRelationship || undefined,
    accountId: values.accountId || undefined,
  };
}

// Get only changed fields for PUT request (partial update)
export function getChangedFields(
  original: PatientFormValues,
  current: PatientFormValues,
): Partial<UpdatePatientRequest> {
  const changes: Partial<UpdatePatientRequest> = {};

  for (const key of Object.keys(current) as (keyof PatientFormValues)[]) {
    const originalValue = original[key];
    const currentValue = current[key];

    // Handle arrays (allergies)
    if (Array.isArray(originalValue) && Array.isArray(currentValue)) {
      if (JSON.stringify(originalValue) !== JSON.stringify(currentValue)) {
        changes[key as keyof UpdatePatientRequest] = currentValue.join(
          ", ",
        ) as any;
      }
    } else if (originalValue !== currentValue) {
      changes[key as keyof UpdatePatientRequest] = currentValue as any;
    }
  }

  return changes;
}
```

---

## 6. Error Handling & Edge Cases

### 6.1 Error Code Reference (Patient Service)

| HTTP | Code                      | When                      | UI Response                     |
| ---- | ------------------------- | ------------------------- | ------------------------------- |
| 400  | `VALIDATION_ERROR`        | Invalid form data         | Show field errors               |
| 401  | `UNAUTHORIZED`            | Token expired             | Redirect to login               |
| 403  | `FORBIDDEN`               | No permission             | Toast + redirect                |
| 404  | `PATIENT_NOT_FOUND`       | Invalid patient ID        | Show 404 page                   |
| 404  | `ACCOUNT_NOT_FOUND`       | Invalid accountId in link | Field error "Account not found" |
| 409  | `DUPLICATE_PHONE`         | Phone already exists      | Field error on phone            |
| 409  | `DUPLICATE_EMAIL`         | Email already exists      | Field error on email            |
| 409  | `HAS_FUTURE_APPOINTMENTS` | Delete blocked            | Toast with count                |

### 6.2 Validation Rules

```typescript
const patientValidationSchema = z.object({
  fullName: z
    .string()
    .min(1, "Full name is required")
    .max(255, "Full name must be less than 255 characters"),

  email: z
    .string()
    .email("Please enter a valid email")
    .optional()
    .or(z.literal("")),

  phoneNumber: z
    .string()
    .min(1, "Phone number is required")
    .regex(/^0[0-9]{9}$/, "Phone number must be 10 digits starting with 0"),

  dateOfBirth: z
    .string()
    .min(1, "Date of birth is required")
    .refine(
      (val) => new Date(val) < new Date(),
      "Date of birth cannot be in the future",
    ),

  gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional().nullable(),

  address: z.string().max(500).optional(),

  identificationNumber: z.string().max(50).optional(),

  healthInsuranceNumber: z.string().max(50).optional(),

  bloodType: z
    .enum(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"])
    .optional()
    .nullable(),

  allergies: z.array(z.string()).optional(),

  relativeFullName: z.string().max(255).optional(),

  relativePhoneNumber: z
    .string()
    .regex(/^0[0-9]{9}$/, "Phone number must be 10 digits starting with 0")
    .optional()
    .or(z.literal("")),

  relativeRelationship: z
    .enum(["SPOUSE", "PARENT", "CHILD", "SIBLING", "FRIEND", "OTHER"])
    .optional()
    .nullable(),
});
```

### 6.3 Error Handling Implementation

```typescript
function handlePatientError(
  error: ApiErrorResponse,
  options?: {
    setFieldErrors?: (errors: Record<string, string>) => void;
  },
) {
  const { code, message, details } = error.error;

  switch (code) {
    case "UNAUTHORIZED":
      clearAuthState();
      router.push("/login");
      toast.error("Session expired. Please log in again.");
      break;

    case "FORBIDDEN":
      toast.error("You don't have permission to perform this action");
      router.push("/admin/patients");
      break;

    case "PATIENT_NOT_FOUND":
      toast.error("Patient not found");
      router.push("/admin/patients");
      break;

    case "ACCOUNT_NOT_FOUND":
      if (options?.setFieldErrors) {
        options.setFieldErrors({ accountId: "Account not found" });
      }
      break;

    case "VALIDATION_ERROR":
      if (details && options?.setFieldErrors) {
        const fieldErrors = details.reduce(
          (acc, err) => {
            acc[err.field] = err.message;
            return acc;
          },
          {} as Record<string, string>,
        );
        options.setFieldErrors(fieldErrors);
      } else {
        toast.error(message || "Validation failed");
      }
      break;

    case "DUPLICATE_PHONE":
      if (options?.setFieldErrors) {
        options.setFieldErrors({ phoneNumber: "Phone number already in use" });
      }
      toast.error("A patient with this phone number already exists");
      break;

    case "DUPLICATE_EMAIL":
      if (options?.setFieldErrors) {
        options.setFieldErrors({ email: "Email already in use" });
      }
      toast.error("A patient with this email already exists");
      break;

    case "HAS_FUTURE_APPOINTMENTS":
      const count = details?.[0]?.message.match(/\d+/)?.[0] || "some";
      toast.error(
        `Cannot delete: Patient has ${count} scheduled appointments. Cancel them first.`,
      );
      break;

    default:
      toast.error(message || "Something went wrong");
      console.error("Unhandled patient error:", error);
  }
}
```

### 6.4 Edge Cases

| Scenario                              | Handling                                          |
| ------------------------------------- | ------------------------------------------------- |
| Walk-in patient (no account)          | `accountId` is null, patient can still be created |
| Patient registered but no profile     | Show "Complete your profile" prompt on login      |
| Duplicate phone number                | Show inline error on phone field + toast          |
| Soft-deleted patient accessed         | Show 404 (backend filters deleted)                |
| Patient with future appointments      | Block delete with count of appointments           |
| Empty allergy list                    | Show "No allergies recorded" placeholder          |
| Missing emergency contact             | Show "Not provided" with "Add contact" link       |
| Very long address                     | Truncate in list, full text in detail             |
| Invalid blood type                    | Dropdown prevents invalid selection               |
| Patient editing own restricted fields | Backend rejects, show info message                |

### 6.5 Loading States

```typescript
const loadingStates = {
  // List loading
  listLoading: {
    showSkeleton: true,
    showSpinner: false,
    skeletonRows: 10,
  },

  // Detail loading
  detailLoading: {
    showSkeleton: true,
    showSpinner: false,
  },

  // Form loading (edit mode pre-fill)
  formLoading: {
    showSkeleton: true,
    disableInputs: true,
  },

  // Submit loading
  submitLoading: {
    showSpinner: true,
    disableInputs: true,
    disableButtons: true,
  },

  // Delete loading
  deleteLoading: {
    showSpinner: true,
    disableButton: true,
  },
};
```

### 6.6 Toast Messages

```typescript
const patientToastMessages = {
  success: {
    created: "Patient registered successfully",
    updated: "Patient updated successfully",
    deleted: "Patient deleted successfully",
    profileUpdated: "Profile updated successfully",
  },
  error: {
    notFound: "Patient not found",
    duplicate: "Patient with this phone/email already exists",
    hasAppointments: "Cannot delete patient with scheduled appointments",
    forbidden: "You don't have permission to perform this action",
    validation: "Please check the form for errors",
    network: "Network error. Please try again.",
  },
  warning: {
    unsavedChanges: "You have unsaved changes",
    incompleteProfile: "Some profile fields are missing",
  },
};
```

---

## Appendix A: TypeScript Interfaces

### A.1 API Response Types

```typescript
// Base API response structure
interface ApiResponse<T> {
  status: "success" | "error";
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Array<{
      field: string;
      message: string;
    }>;
  };
}

// Paginated response
interface PaginatedResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

// Delete response
interface DeleteResponse {
  id: string;
  deletedAt: string;
  deletedBy: string;
}
```

### A.2 Patient Entity

```typescript
interface Patient {
  id: string;
  accountId: string | null;
  fullName: string;
  email: string | null;
  dateOfBirth: string | null;
  gender: "MALE" | "FEMALE" | "OTHER" | null;
  phoneNumber: string;
  address: string | null;
  identificationNumber: string | null;
  healthInsuranceNumber: string | null;
  bloodType: "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-" | null;
  allergies: string | null; // Comma-separated
  relativeFullName: string | null;
  relativePhoneNumber: string | null;
  relativeRelationship:
    | "SPOUSE"
    | "PARENT"
    | "CHILD"
    | "SIBLING"
    | "FRIEND"
    | "OTHER"
    | null;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  deletedBy?: string | null;
}
```

### A.3 Request DTOs

```typescript
// Create patient request
interface CreatePatientRequest {
  accountId?: string;
  fullName: string;
  email?: string;
  phoneNumber: string;
  dateOfBirth?: string;
  gender?: "MALE" | "FEMALE" | "OTHER";
  address?: string;
  identificationNumber?: string;
  healthInsuranceNumber?: string;
  bloodType?: string;
  allergies?: string;
  relativeFullName?: string;
  relativePhoneNumber?: string;
  relativeRelationship?: string;
}

// Update patient request (partial)
interface UpdatePatientRequest {
  accountId?: string | null;
  fullName?: string;
  email?: string | null;
  phoneNumber?: string;
  dateOfBirth?: string | null;
  gender?: "MALE" | "FEMALE" | "OTHER" | null;
  address?: string | null;
  identificationNumber?: string | null;
  healthInsuranceNumber?: string | null;
  bloodType?: string | null;
  allergies?: string | null;
  relativeFullName?: string | null;
  relativePhoneNumber?: string | null;
  relativeRelationship?: string | null;
}

// Update my profile request (limited fields)
interface UpdateMyProfileRequest {
  phoneNumber?: string;
  address?: string;
  allergies?: string;
  relativeFullName?: string;
  relativePhoneNumber?: string;
  relativeRelationship?: string;
}

// List patients params
interface PatientListParams {
  page?: number;
  size?: number;
  sort?: string;
  search?: string;
  gender?: "MALE" | "FEMALE" | "OTHER";
  bloodType?: string;
}
```

### A.4 Form Types

```typescript
// Patient form values (used in UI)
interface PatientFormValues {
  fullName: string;
  email: string;
  phoneNumber: string;
  dateOfBirth: string | null;
  gender: "MALE" | "FEMALE" | "OTHER" | null;
  address: string;
  identificationNumber: string;
  healthInsuranceNumber: string;
  bloodType: string | null;
  allergies: string[]; // Array in UI, joined for API
  relativeFullName: string;
  relativePhoneNumber: string;
  relativeRelationship:
    | "SPOUSE"
    | "PARENT"
    | "CHILD"
    | "SIBLING"
    | "FRIEND"
    | "OTHER"
    | null;
  accountId: string | null;
}

// My profile edit form values
interface MyProfileFormValues {
  phoneNumber: string;
  address: string;
  allergies: string[];
  relativeFullName: string;
  relativePhoneNumber: string;
  relativeRelationship:
    | "SPOUSE"
    | "PARENT"
    | "CHILD"
    | "SIBLING"
    | "FRIEND"
    | "OTHER"
    | null;
}
```

### A.5 Timeline Event Types

```typescript
interface TimelineEvent {
  id: string;
  type: "APPOINTMENT" | "EXAM" | "INVOICE";
  date: string;
  title: string;
  summary: string;
  status?: string;
  detailUrl: string;
}

interface PatientHistoryParams {
  patientId: string;
  startDate?: string;
  endDate?: string;
  eventType?: "APPOINTMENT" | "EXAM" | "INVOICE" | "ALL";
}
```

### A.6 Component Props Interfaces

```typescript
// PatientAvatar
interface PatientAvatarProps {
  name: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

// GenderBadge
interface GenderBadgeProps {
  gender: "MALE" | "FEMALE" | "OTHER" | null;
}

// BloodTypeBadge
interface BloodTypeBadgeProps {
  bloodType: string | null;
  size?: "sm" | "md" | "lg";
}

// AllergyTags
interface AllergyTagsProps {
  allergies: string[];
  maxVisible?: number;
  onRemove?: (allergy: string) => void;
}

// PatientSearchSelect
interface PatientSearchSelectProps {
  value: string | null;
  onChange: (patientId: string | null) => void;
  disabled?: boolean;
  error?: string;
  placeholder?: string;
}

// TagInput
interface TagInputProps {
  tags: string[];
  onAdd: (tag: string) => void;
  onRemove: (tag: string) => void;
  placeholder?: string;
  suggestions?: string[];
  maxTags?: number;
}

// DeleteConfirmDialog
interface DeleteConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  message: string;
  patientName?: string;
  onConfirm: () => void;
  isLoading?: boolean;
}
```

### A.7 Page State Interfaces

```typescript
// Patient list page state
interface PatientListState {
  searchQuery: string;
  genderFilter: "ALL" | "MALE" | "FEMALE" | "OTHER";
  bloodTypeFilter: string | "ALL";
  page: number;
  pageSize: number;
  sortField: string;
  sortDirection: "asc" | "desc";
  deleteDialogOpen: boolean;
  patientToDelete: Patient | null;
}

// Patient form state
interface PatientFormState {
  values: PatientFormValues;
  errors: Record<string, string>;
  isDirty: boolean;
  isSubmitting: boolean;
  isLoading: boolean;
  originalValues: PatientFormValues | null;
}

// Patient detail page state
interface PatientDetailState {
  activeTab: "overview" | "health" | "emergency";
  deleteDialogOpen: boolean;
}

// Patient history page state
interface PatientHistoryState {
  eventTypeFilter: "ALL" | "APPOINTMENT" | "EXAM" | "INVOICE";
  dateRange: {
    start: string | null;
    end: string | null;
  };
}
```

---

## Appendix B: Implementation Checklist

### B.1 Components

- [ ] **PatientListPage** (`app/admin/patients/page.tsx`)
  - [ ] Data table with pagination
  - [ ] Search by name/phone/email/ID
  - [ ] Gender filter dropdown
  - [ ] Blood type filter dropdown
  - [ ] Sort by name/date
  - [ ] Row click navigation to detail
  - [ ] Action buttons (View, Edit, Delete)
  - [ ] Delete confirmation dialog
  - [ ] Empty state
  - [ ] Loading skeleton

- [ ] **PatientFormPage** (`app/admin/patients/new/page.tsx`, `app/admin/patients/[id]/edit/page.tsx`)
  - [ ] Collapsible sections
  - [ ] Personal Information section
  - [ ] Health Information section
  - [ ] Emergency Contact section
  - [ ] Account Linking section
  - [ ] Form validation (zod)
  - [ ] Pre-fill for edit mode
  - [ ] Submit handling (create/update)
  - [ ] Unsaved changes dialog
  - [ ] Cancel button

- [ ] **PatientDetailPage** (`app/admin/patients/[id]/page.tsx`)
  - [ ] Header with avatar and actions
  - [ ] Tab navigation
  - [ ] Overview tab content
  - [ ] Health Info tab content
  - [ ] Emergency Contact tab content
  - [ ] Quick action buttons
  - [ ] Delete confirmation
  - [ ] 404 handling
  - [ ] Loading skeleton

- [ ] **PatientHistoryPage** (`app/admin/patients/[id]/history/page.tsx`)
  - [ ] Timeline component
  - [ ] Event type filter
  - [ ] Date range picker
  - [ ] Cross-service data fetching
  - [ ] Event cards with links
  - [ ] Empty state

- [ ] **MyProfilePage** (`app/profile/page.tsx`)
  - [ ] Profile card
  - [ ] Contact information section
  - [ ] Personal details section
  - [ ] Health information section
  - [ ] Emergency contact section
  - [ ] Edit button
  - [ ] Editable field indicators

- [ ] **MyProfileEditPage** (`app/profile/edit/page.tsx`)
  - [ ] Limited editable fields
  - [ ] Read-only field note
  - [ ] Form validation
  - [ ] Submit handling
  - [ ] Cancel button

### B.2 Shared Components

- [ ] **PatientAvatar** (`components/patients/PatientAvatar.tsx`)
  - [ ] Initials generation
  - [ ] Color from name hash
  - [ ] Size variants

- [ ] **GenderBadge** (`components/patients/GenderBadge.tsx`)
  - [ ] Color coding (blue/pink/gray)
  - [ ] Icon support

- [ ] **BloodTypeBadge** (`components/patients/BloodTypeBadge.tsx`)
  - [ ] Color coding by type
  - [ ] Size variants

- [ ] **AllergyTags** (`components/patients/AllergyTags.tsx`)
  - [ ] Tag display
  - [ ] Max visible with "+N more"
  - [ ] Remove capability (if editable)

- [ ] **PatientSearchSelect** (`components/patients/PatientSearchSelect.tsx`)
  - [ ] Debounced search
  - [ ] Patient result display
  - [ ] Selection handling

- [ ] **TagInput** (`components/ui/TagInput.tsx`)
  - [ ] Add tag on Enter
  - [ ] Remove tag
  - [ ] Suggestions dropdown

### B.3 Hooks

- [ ] **usePatients** (`hooks/queries/usePatients.ts`)
  - [ ] List patients query
  - [ ] Get patient by ID query
  - [ ] Get my profile query
  - [ ] Create patient mutation
  - [ ] Update patient mutation
  - [ ] Update my profile mutation
  - [ ] Delete patient mutation

- [ ] **usePatientHistory** (`hooks/queries/usePatientHistory.ts`)
  - [ ] Cross-service data fetching
  - [ ] Event aggregation

### B.4 Services

- [ ] **patientService** (`services/patient.service.ts`)
  - [ ] getPatients (list) - `GET /api/patients`
  - [ ] getPatient (by ID) - `GET /api/patients/{id}`
  - [ ] getMyProfile - `GET /api/patients/me`
  - [ ] createPatient - `POST /api/patients`
  - [ ] updatePatient - `PUT /api/patients/{id}`
  - [ ] updateMyProfile - `PUT /api/patients/me`
  - [ ] deletePatient - `DELETE /api/patients/{id}`

### B.5 Utilities

- [ ] **Patient utils** (`lib/patient-utils.ts`)
  - [ ] apiToFormValues transformer
  - [ ] formValuesToRequest transformer
  - [ ] getChangedFields helper
  - [ ] calculateAge helper
  - [ ] getInitials helper
  - [ ] getColorFromName helper

- [ ] **Validation schemas** (`lib/validations/patient.ts`)
  - [ ] patientValidationSchema (zod)
  - [ ] myProfileValidationSchema (zod)

### B.6 Interfaces

- [ ] **Patient interfaces** (`interfaces/patient.ts`)
  - [ ] Patient entity type
  - [ ] CreatePatientRequest
  - [ ] UpdatePatientRequest
  - [ ] UpdateMyProfileRequest
  - [ ] PatientListParams
  - [ ] PatientFormValues
  - [ ] TimelineEvent

### B.7 Routes & Navigation

- [ ] `/admin/patients` - Patient list
- [ ] `/admin/patients/new` - Register patient
- [ ] `/admin/patients/:id` - Patient detail
- [ ] `/admin/patients/:id/edit` - Edit patient
- [ ] `/admin/patients/:id/history` - Patient history
- [ ] `/profile` - My profile (patient)
- [ ] `/profile/edit` - Edit my profile (patient)

### B.8 Access Control

> **Role Mapping:** RECEPTIONIST in HR service maps to EMPLOYEE role in auth-service

- [ ] ADMIN: Full access to all patient operations (CRUD + delete)
- [ ] DOCTOR: Full access except delete (create, read, update patients)
- [ ] NURSE: Full access except delete (create, read, update patients)
- [ ] EMPLOYEE: Read-only access to patient list and details
- [ ] PATIENT: Own profile view and limited edit (via `/api/patients/{id}` with backend validation)

### B.9 Testing Checklist

- [ ] List patients with various filters
- [ ] Create new patient (all fields)
- [ ] Create walk-in patient (no account)
- [ ] Edit existing patient
- [ ] Delete patient without appointments
- [ ] Delete patient with appointments (should fail)
- [ ] Patient self-service profile view
- [ ] Patient self-service profile edit
- [ ] Patient history timeline
- [ ] Search functionality
- [ ] Pagination
- [ ] Sort functionality
- [ ] Error handling (404, 403, 409)
- [ ] Form validation
- [ ] Unsaved changes warning
- [ ] Role-based button visibility

---

**End of Patient Service Frontend Specification**
Beta
0 / 0
used queries
1

# Billing Service - Implementation Checklist

## Screen Inventory

| Route | Spec | Status | Priority |
|-------|------|--------|----------|
| `/admin/billing` | ✅ | ⚠️ Có nhưng thiếu features | P0 |
| `/admin/billing/{id}` | ✅ | ❌ THIẾU | P0 |
| `/admin/billing/{id}/payment` | ✅ | ❌ THIẾU | P0 |
| `/admin/billing/payments` | ✅ | ❌ THIẾU | P1 |
| `/patient/billing` | ✅ | ❌ THIẾU | P0 |
| `/patient/billing/{id}` | ✅ | ❌ THIẾU | P0 |
| `/patient/billing/{id}/pay` | ✅ | ❌ THIẾU | P1 |

---

## Admin Invoice List (`/admin/billing`) - Missing Features

### Summary Cards
- [ ] **Total Invoices** card (count + sum)
- [ ] **Unpaid** card (UNPAID + PARTIALLY_PAID)
- [ ] **Overdue** card
- [ ] **Collected This Month** card

### Filters
- [ ] **Patient Search** (debounced 300ms)
- [ ] **Status Filter** dropdown
- [ ] **Date Range** (Start + End date)
- [ ] **Pagination** (10/20/50 items)
- [ ] **Sort** by columns

### Table Columns
- [ ] **Due Date** column - THIẾU
- [ ] **Paid** column - THIẾU
- [ ] **Balance** column (Total - Paid) - THIẾU
- [ ] **Status badges** với colors
- [ ] **Quick Action**: "Record Payment" button

### Other
- [ ] Loading skeleton
- [ ] Empty state

---

## Missing Screens (P0 - Critical)

### 1. Invoice Detail (`/admin/billing/{id}`)

**Components Needed:**
- Invoice header (Invoice #, Date, Due Date, Status)
- Patient information section
- Line items table (Type, Description, Qty, Unit Price, Amount)
- Totals section (Subtotal, Discount, Tax 10%, Total)
- Payment summary (Total, Paid, Balance Due)
- Payment history table
- Action buttons:
  - Record Payment (UNPAID/PARTIALLY_PAID)
  - Cancel Invoice (UNPAID only)
  - Print Invoice
  - Link to related appointment/exam
- OVERDUE warning banner
- Audit information

**Item Type Badges:**
- CONSULTATION: Purple 🩺
- MEDICINE: Blue 💊
- TEST: Cyan 🧪
- OTHER: Gray 📋

---

### 2. Payment Form (`/admin/billing/{id}/payment`)

**Components Needed:**
- Invoice summary card
- Payment form:
  - Amount input (pre-filled with balance)
  - "Pay Full Balance" quick button
  - Payment method radio (CASH, CREDIT_CARD, BANK_TRANSFER, INSURANCE)
  - Notes textarea (max 1000 chars)
  - Hidden idempotency key (UUID)
- Validation:
  - Amount > 0
  - Amount <= balance
  - Method required
- Error handling:
  - DUPLICATE_PAYMENT (409)
  - INVOICE_ALREADY_PAID (409)
  - INVOICE_CANCELLED (409)
  - Amount exceeds balance (400)

---

### 3. Payment History (`/admin/billing/payments`)

**Components Needed:**
- Summary cards:
  - Today payments
  - This week payments
  - Cash percentage
  - Card percentage
- Filters:
  - Search by invoice #
  - Payment method filter
  - Date range
- Table columns:
  - Payment ID
  - Invoice #
  - Patient
  - Amount
  - Method (badge)
  - Date
- Click row → Navigate to invoice detail

---

### 4. Patient Invoice List (`/patient/billing`)

**Components Needed:**
- Outstanding balance banner
  - Total unpaid amount
  - "Pay All Now" button
- Status filter tabs: All, Unpaid, Paid
- Card view (NOT table):
  - Invoice #
  - Date + Due date
  - Items summary
  - Total + Balance
  - Status badge
  - Actions: View, Pay Now
- Unpaid invoices shown first
- OVERDUE warning indicator

---

### 5. Patient Invoice Detail (`/patient/billing/{id}`)

**Components Needed:**
- Same as admin detail but:
  - Read-only (no edit/cancel)
  - Patient can only view own invoices (403 check)
  - Actions:
    - Pay Now (UNPAID/PARTIALLY_PAID)
    - Download Receipt (PAID)

---

### 6. Patient Payment Page (`/patient/billing/{id}/pay`)

**Step Wizard (2 steps):**

**Step 1: Review Invoice**
- Invoice summary
- Line items list
- Totals breakdown
- Continue button

**Step 2: Payment Method**
- Amount options:
  - Pay full balance (radio)
  - Pay partial amount (radio + input)
- Payment method cards:
  - Credit Card (online)
  - Bank Transfer (online)
  - Pay at Counter (instructions)
- Idempotency key
- Back, Cancel, Pay Now buttons

---

## Status Badge Colors

| Status | Color | Icon |
|--------|-------|------|
| UNPAID | Red | 🔴 |
| PARTIALLY_PAID | Yellow | 🟡 |
| PAID | Green | 🟢 |
| OVERDUE | Orange | ⚠️ |
| CANCELLED | Gray | ✕ |

---

## Payment Method Icons

| Method | Icon |
|--------|------|
| CASH | 💵 |
| CREDIT_CARD | 💳 |
| BANK_TRANSFER | 🏦 |
| INSURANCE | 🏥 |

---

## Priority Recommendations

### Phase 1 (P0 - Must Have):
1. ✅ **Invoice Detail** (`/admin/billing/{id}`)
2. ✅ **Payment Form** (`/admin/billing/{id}/payment`)
3. ✅ **Patient Invoice List** (`/patient/billing`)
4. ✅ **Patient Invoice Detail** (`/patient/billing/{id}`)

### Phase 2 (P1 - Should Have):
5. **Payment History** (`/admin/billing/payments`)
6. **Patient Payment Wizard** (`/patient/billing/{id}/pay`)
7. **Admin List Enhancements** (summary cards, filters, pagination)

### Phase 3 (Nice to Have):
8. Loading skeletons
9. Print/PDF generation
10. Email receipts

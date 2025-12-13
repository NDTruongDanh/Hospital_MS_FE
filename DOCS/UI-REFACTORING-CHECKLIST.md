# UI Refactoring Checklist

## 📅 Timeline: Dec 13, 2024 - Dec 30, 2024

---

## Phase 1: Setup & Foundation ✅

### Components Created (4/4) ✅

- [x] StatusBadge component
- [x] Spinner component
- [x] Loading component
- [x] UI Mappings constants

### Documentation (6/6) ✅

- [x] UI Standardization Guide
- [x] Component Library Docs
- [x] Quick Start Guide
- [x] Audit Guide
- [x] Checklist (this file)
- [x] README/Index

### Tools (2/2) ✅

- [x] PowerShell audit script
- [x] Demo page for testing

---

## Phase 2: Quick Wins (Week 1)

### Priority 1: Loading States (0/5)

- [ ] `components/auth/RoleGuard.tsx` - Replace custom spinner
- [ ] `app/admin/layout.tsx` - Loading states
- [ ] `app/doctor/layout.tsx` - Loading states
- [ ] `app/patient/layout.tsx` - Loading states
- [ ] `app/profile/layout.tsx` - Loading states

### Priority 2: Test/Auth Components (0/3)

- [ ] `app/(auth)/login/_components/test-accounts.tsx` - Role badges
- [ ] `app/(auth)/login/page.tsx` - Loading states
- [ ] `app/(auth)/signup/page.tsx` - Loading states

### Priority 3: Common Components (0/7)

- [ ] `components/landing/FeatureCard.tsx` - Hardcoded colors
- [ ] `components/reports/EmptyReportState.tsx` - Review
- [ ] `components/reports/RetryButton.tsx` - Review
- [ ] `components/medical-exam/VitalsPanel.tsx` - Colors
- [ ] `components/patients/GenderBadge.tsx` - Use StatusBadge
- [ ] `components/patients/BloodTypeBadge.tsx` - Use StatusBadge
- [ ] `components/patients/AllergyTags.tsx` - Review

**Week 1 Target:** 15/15 components ✅

---

## Phase 3: Appointment Module (Week 2)

### Appointment Components (0/10)

- [ ] `components/appointment/AppointmentColumnsShared.tsx` - Status badges
- [ ] `components/appointment/AppointmentListShared.tsx` - Status badges
- [ ] `components/appointment/AppointmentCard.tsx` - Status badges
- [ ] `components/appointment/AppointmentCalendar.tsx` - Review
- [ ] `components/appointment/CompleteAppointmentModal.tsx` - Loading states
- [ ] `components/appointment/CancelAppointmentModal.tsx` - Loading states
- [ ] `components/appointment/TimeSlotPicker.tsx` - Review
- [ ] `app/admin/appointments/page.tsx` - Status badges & loading
- [ ] `app/doctor/appointments/page.tsx` - Status badges & loading
- [ ] `app/patient/appointments/page.tsx` - Status badges & loading

### Appointment Subpages (0/5)

- [ ] `app/admin/appointments/[id]/page.tsx` - Review
- [ ] `app/admin/appointments/[id]/edit/page.tsx` - Review
- [ ] `app/doctor/appointments/[id]/page.tsx` - Review
- [ ] `app/doctor/appointments/[id]/edit/page.tsx` - Review
- [ ] `app/patient/appointments/[id]/page.tsx` - Review

**Week 2 Target:** 15/15 components ✅

---

## Phase 4: Billing & Admin (Week 2 continued)

### Billing Components (0/8)

- [ ] `app/admin/billing/_components/invoice-status-badge.tsx` - Use StatusBadge
- [ ] `app/admin/billing/page.tsx` - Status badges & loading
- [ ] `app/patient/billing/page.tsx` - Status badges & loading
- [ ] `components/billing/*` - Review all billing components
- [ ] `app/admin/billing/[id]/page.tsx` - Review
- [ ] `app/admin/billing/[id]/edit/page.tsx` - Review
- [ ] `app/admin/billing/[id]/payment/page.tsx` - Review
- [ ] `app/patient/billing/[id]/page.tsx` - Review

### Medical Exam (0/5)

- [ ] `app/doctor/exams/page.tsx` - Status badges
- [ ] `app/doctor/exams/[id]/page.tsx` - Review
- [ ] `components/medical-exam/VitalsForm.tsx` - Review
- [ ] `components/medical-exam/VitalsPanel.tsx` - Colors
- [ ] `components/medical-exam/*` - Review all components

**Week 2 Total Target:** 28/28 components ✅

---

## Phase 5: Doctor & Schedules (Week 3)

### Doctor Schedules (0/5)

- [ ] `app/doctor/schedules/page.tsx` - Status badges & colors
- [ ] `app/doctor/schedules/[id]/page.tsx` - Review
- [ ] `app/doctor/schedules/create/page.tsx` - Review
- [ ] `components/doctor/*` - Review doctor-specific components
- [ ] Doctor schedule status mappings

### HR & Employees (0/8)

- [ ] `app/admin/hr/page.tsx` - Review
- [ ] `app/admin/hr/employees/page.tsx` - Status badges
- [ ] `app/admin/hr/employees/[id]/page.tsx` - Review
- [ ] `app/admin/hr/employees/create/page.tsx` - Review
- [ ] `components/hr/*` - Review all HR components
- [ ] Employee status badges
- [ ] Department badges
- [ ] Position badges

### Patients (0/8)

- [ ] `app/admin/patients/page.tsx` - Loading & status
- [ ] `app/admin/patients/[id]/page.tsx` - Review
- [ ] `app/admin/patients/[id]/edit/page.tsx` - Review
- [ ] `app/admin/patients/create/page.tsx` - Review
- [ ] `app/patient/medical-records/page.tsx` - Review
- [ ] `components/patients/PatientSearchSelect.tsx` - Review
- [ ] `components/patients/PatientAvatar.tsx` - Review
- [ ] Patient status badges

**Week 3 Target:** 21/21 components ✅

---

## Phase 6: Reports & Analytics (Week 3 continued)

### Reports (0/10)

- [ ] `app/admin/reports/page.tsx` - Review
- [ ] `app/admin/reports/revenue/page.tsx` - Charts & loading
- [ ] `app/admin/reports/appointments/page.tsx` - Charts & loading
- [ ] `app/admin/reports/patients/page.tsx` - Charts & loading
- [ ] `app/doctor/reports/page.tsx` - Review
- [ ] `app/doctor/reports/appointments/page.tsx` - Charts & inline styles
- [ ] `app/doctor/reports/patients/page.tsx` - Review
- [ ] `components/reports/*` - Review all report components
- [ ] Remove inline styles from charts
- [ ] Standardize chart colors

**Week 3 Total Target:** 31/31 components ✅

---

## Phase 7: Medicine & Misc (Week 4)

### Medicine (0/5)

- [ ] `app/admin/medicines/page.tsx` - Review
- [ ] `app/admin/medicines/[id]/page.tsx` - Review
- [ ] `app/admin/medicines/create/page.tsx` - Review
- [ ] Medicine category badges
- [ ] Stock status badges

### Prescriptions (0/4)

- [ ] `app/patient/prescriptions/page.tsx` - Review
- [ ] `app/patient/prescriptions/[id]/page.tsx` - Review
- [ ] Prescription status badges
- [ ] Medication dosage badges

### Profile & Settings (0/5)

- [ ] `app/profile/page.tsx` - Review
- [ ] `app/profile/edit/page.tsx` - Review
- [ ] `app/admin/profile/page.tsx` - Review
- [ ] `app/doctor/profile/page.tsx` - Review
- [ ] Profile verification badges

**Week 4 Part 1 Target:** 14/14 components ✅

---

## Phase 8: Cleanup & Polish (Week 4)

### Design Tokens (0/10)

- [ ] Replace all `text-slate-*` with `text-foreground/muted-foreground`
- [ ] Replace all `bg-white` with `bg-card/background`
- [ ] Replace all `border-slate-*` with `border-border`
- [ ] Replace all hardcoded blue colors with `bg-primary`
- [ ] Replace all hardcoded green colors with design tokens
- [ ] Replace all hardcoded red colors with `bg-destructive`
- [ ] Ensure all components support dark mode
- [ ] Review and standardize spacing
- [ ] Review and standardize typography
- [ ] Review and standardize border radius

### Remove Inline Styles (0/5)

- [ ] Find all `style={{` in app/
- [ ] Find all `style={{` in components/
- [ ] Replace with Tailwind classes
- [ ] Remove backgroundColor inline styles
- [ ] Remove color inline styles

### Code Quality (0/8)

- [ ] Remove unused CSS classes
- [ ] Remove duplicate color definitions
- [ ] Consolidate similar components
- [ ] Update prop types
- [ ] Add TypeScript types where missing
- [ ] Review accessibility
- [ ] Add ARIA labels where needed
- [ ] Test keyboard navigation

**Week 4 Part 2 Target:** 23/23 items ✅

---

## Phase 9: Testing & Documentation (Week 4)

### Testing (0/10)

- [ ] Visual regression testing - All pages
- [ ] Test dark mode - All pages
- [ ] Test responsive design - All pages
- [ ] Test loading states - All scenarios
- [ ] Test status badges - All variants
- [ ] Test button states - All variants
- [ ] Test form validation
- [ ] Test error states
- [ ] Cross-browser testing (Chrome, Firefox, Safari)
- [ ] Mobile device testing (iOS, Android)

### Documentation Updates (0/6)

- [ ] Update main README
- [ ] Update component documentation
- [ ] Add migration notes
- [ ] Document breaking changes (if any)
- [ ] Update style guide
- [ ] Create component showcase page

### Code Review (0/5)

- [ ] Self review all changes
- [ ] Team review - Phase 1-3
- [ ] Team review - Phase 4-6
- [ ] Team review - Phase 7-9
- [ ] Final approval

**Week 4 Part 3 Target:** 21/21 items ✅

---

## Final Checklist

### Pre-Deployment (0/8)

- [ ] All tests passing
- [ ] No console errors
- [ ] No console warnings
- [ ] Build succeeds
- [ ] Lighthouse score > 90
- [ ] No accessibility violations
- [ ] All documentation updated
- [ ] Changelog updated

### Deployment (0/5)

- [ ] Deploy to staging
- [ ] QA testing on staging
- [ ] Fix any bugs found
- [ ] Get stakeholder approval
- [ ] Deploy to production

### Post-Deployment (0/4)

- [ ] Monitor error logs
- [ ] Monitor performance metrics
- [ ] Gather user feedback
- [ ] Plan follow-up improvements

---

## Progress Summary

### Overall Progress

- **Phase 1 (Setup):** ✅ 13/13 (100%)
- **Phase 2 (Quick Wins):** ⬜ 0/15 (0%)
- **Phase 3 (Appointments):** ⬜ 0/15 (0%)
- **Phase 4 (Billing):** ⬜ 0/13 (0%)
- **Phase 5 (Doctor/HR):** ⬜ 0/21 (0%)
- **Phase 6 (Reports):** ⬜ 0/10 (0%)
- **Phase 7 (Medicine):** ⬜ 0/14 (0%)
- **Phase 8 (Cleanup):** ⬜ 0/23 (0%)
- **Phase 9 (Testing):** ⬜ 0/21 (0%)
- **Final:** ⬜ 0/17 (0%)

**Total Progress:** 13/162 (8%)

### Time Tracking

| Phase     | Estimated   | Actual  | Status      |
| --------- | ----------- | ------- | ----------- |
| Phase 1   | 2 days      | ✅ Done | Complete    |
| Phase 2   | 3 days      | -       | Not started |
| Phase 3   | 3 days      | -       | Not started |
| Phase 4   | 3 days      | -       | Not started |
| Phase 5   | 3 days      | -       | Not started |
| Phase 6   | 2 days      | -       | Not started |
| Phase 7   | 2 days      | -       | Not started |
| Phase 8   | 3 days      | -       | Not started |
| Phase 9   | 3 days      | -       | Not started |
| **Total** | **24 days** | **0**   | **8%**      |

---

## Notes & Blockers

### Completed

- ✅ 2024-12-13: Initial setup complete, all components and docs created

### In Progress

- ⏳ Waiting to start Phase 2

### Blockers

- None currently

### Important Decisions

- Using shadcn UI components as base
- Centralized UI configurations in ui-mappings.ts
- No breaking changes to public APIs
- Maintain backward compatibility where possible

---

## Quick Actions

### Today's Focus

1. [ ] Run audit script
2. [ ] Refactor RoleGuard
3. [ ] Refactor test accounts
4. [ ] Test changes
5. [ ] Commit work

### This Week's Goals

- [ ] Complete Phase 2 (Quick Wins)
- [ ] Start Phase 3 (Appointments)
- [ ] Update progress daily

### Next Week's Goals

- [ ] Complete Phase 3
- [ ] Complete Phase 4
- [ ] Start Phase 5

---

**Last Updated:** 2024-12-13
**Next Review:** 2024-12-14

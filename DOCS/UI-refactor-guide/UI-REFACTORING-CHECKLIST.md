# UI Refactoring Checklist

## 🎯 Mục Tiêu

Đồng nhất UI toàn bộ code base sử dụng shadcn UI và Tailwind CSS design tokens.

---

## Phase 1: Setup Components Cơ Bản ⏳

### New Components to Create

- [ ] `components/ui/status-badge.tsx` - Component cho status badges với variants
- [ ] `components/ui/spinner.tsx` - Loading spinner với variants
- [ ] `components/ui/loading.tsx` - Full loading state component
- [ ] `lib/constants/ui-mappings.ts` - Constants mapping cho status colors
- [ ] `DOCS/COMPONENT-LIBRARY.md` - Component documentation

---

## Phase 2: Refactor Components 🔄

### Priority 1: Authentication & Core (🔴 High Priority)

- [ ] `components/auth/RoleGuard.tsx` - Replace custom spinner với Loading component
- [ ] `app/(auth)/login/_components/test-accounts.tsx` - Use StatusBadge cho role badges

### Priority 2: Shared Components (🟡 Medium Priority)

#### Appointments

- [ ] `app/admin/appointments/page.tsx` - Status badges
- [ ] `app/doctor/appointments/page.tsx` - Status badges
- [ ] `components/appointment/AppointmentCard.tsx` - Status badges
- [ ] `components/appointment/AppointmentListShared.tsx` - Status badges
- [ ] `components/appointment/AppointmentColumnsShared.tsx` - Status badges

#### Billing

- [ ] `app/admin/billing/_components/invoice-status-badge.tsx` - Convert to StatusBadge
- [ ] `app/admin/billing/page.tsx` - Status badges
- [ ] `app/patient/billing/page.tsx` - Status badges

#### Medical Exams

- [ ] `app/doctor/exams/page.tsx` - Status badges
- [ ] `components/medical-exam/VitalsPanel.tsx` - Color consistency

### Priority 3: Feature Pages (🟢 Lower Priority)

#### Doctor

- [ ] `app/doctor/schedules/page.tsx` - Status badges và colors
- [ ] `app/doctor/reports/appointments/page.tsx` - Inline styles
- [ ] `app/doctor/appointments/[id]/edit/page.tsx` - Form styling

#### Admin

- [ ] `app/admin/layout.tsx` - Sidebar colors
- [ ] `app/admin/patients/page.tsx` - Status badges
- [ ] `app/admin/medicines/page.tsx` - Status badges
- [ ] `app/admin/hr/page.tsx` - Status badges

#### Nurse

- [ ] `app/nurse/appointments/page.tsx` - Status badges

#### Patient

- [ ] `app/patient/appointments/page.tsx` - Status badges
- [ ] `app/patient/medical-records/page.tsx` - Status badges
- [ ] `app/patient/prescriptions/page.tsx` - Status badges

### Priority 4: Landing & Marketing (⚪ Lowest Priority)

- [ ] `components/landing/FeatureCard.tsx` - Replace hardcoded colors
- [ ] `app/page.tsx` - Landing page colors

---

## Phase 3: CSS & Styles Cleanup 🎨

### Global CSS Updates

- [ ] Add status color variables to `app/globals.css`
- [ ] Add utility classes cho common patterns
- [ ] Review và optimize CSS variables

### Remove Hardcoded Colors

- [ ] Search và replace `bg-blue-100 text-blue-800` patterns
- [ ] Search và replace `bg-red-100 text-red-800` patterns
- [ ] Search và replace `bg-green-100 text-green-800` patterns
- [ ] Search và replace `bg-yellow-100 text-yellow-800` patterns
- [ ] Search và replace `bg-purple-100 text-purple-800` patterns
- [ ] Search và replace `bg-orange-100 text-orange-800` patterns
- [ ] Search và replace `bg-gray-100 text-gray-800` patterns

### Remove Inline Styles

- [ ] `app/doctor/reports/appointments/page.tsx` - Remove style prop
- [ ] Search all files for `style={{` và refactor

---

## Phase 4: Testing & Validation ✅

### Component Testing

- [ ] Test StatusBadge all variants
- [ ] Test Spinner all sizes
- [ ] Test Loading component
- [ ] Visual regression testing

### Integration Testing

- [ ] Test appointment status display
- [ ] Test billing status display
- [ ] Test loading states
- [ ] Test dark mode compatibility

### Browser Testing

- [ ] Chrome
- [ ] Firefox
- [ ] Safari
- [ ] Edge

---

## Phase 5: Documentation 📚

### Component Docs

- [ ] StatusBadge API docs
- [ ] Spinner API docs
- [ ] Loading API docs
- [ ] Usage examples

### Migration Guide

- [ ] Hardcoded colors → Design tokens
- [ ] Custom spinners → Spinner component
- [ ] Loading states → Loading component
- [ ] Badge patterns → StatusBadge

---

## 📊 Progress Tracking

### Completion Stats

- **Phase 1 Setup**: 0/5 (0%)
- **Phase 2 Refactor**: 0/35 (0%)
- **Phase 3 Cleanup**: 0/10 (0%)
- **Phase 4 Testing**: 0/8 (0%)
- **Phase 5 Docs**: 0/4 (0%)

**Overall Progress**: 0/62 (0%)

---

## 🔍 Audit Commands

```bash
# Find hardcoded colors
grep -r "bg-blue-\|bg-red-\|bg-green-\|bg-yellow-\|bg-purple-\|bg-orange-\|bg-pink-\|bg-gray-" app/ components/ --include="*.tsx" | wc -l

# Find inline styles
grep -r "style={{" app/ components/ --include="*.tsx" | wc -l

# Find className without cn()
grep -r 'className="[^"]*\b(bg-\|text-\|border-)' app/ components/ --include="*.tsx" | grep -v "cn(" | wc -l
```

---

## 📝 Notes

### Important Files to Watch

1. `app/globals.css` - Design tokens
2. `components.json` - Shadcn config
3. `tailwind.config.ts` - Tailwind config
4. `lib/utils.ts` - Utility functions

### Breaking Changes to Avoid

- Don't change existing component APIs
- Maintain backward compatibility
- Test thoroughly before merging

### Quick Wins (Do These First!)

1. ✅ Create StatusBadge component
2. ✅ Create Spinner component
3. ✅ Create Loading component
4. ✅ Refactor RoleGuard loading state
5. ✅ Create UI mappings constants

---

## 🚀 Next Actions

1. [ ] Review this checklist
2. [ ] Create new components (Phase 1)
3. [ ] Start with Priority 1 refactors
4. [ ] Test và commit incremental changes
5. [ ] Update progress regularly

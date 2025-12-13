# UI Audit Report

Script này giúp audit code base để tìm các pattern cần refactor.

## Run Audit

```bash
# Make executable (Linux/Mac)
chmod +x DOCS/audit-ui.sh

# Run audit
./DOCS/audit-ui.sh
```

## Windows PowerShell

```powershell
# Run from project root
.\DOCS\audit-ui.ps1
```

## Manual Commands

### 1. Find Hardcoded Colors

```bash
# Find blue colors
grep -r "bg-blue-[0-9]" app/ components/ --include="*.tsx" -n

# Find all hardcoded status colors
grep -r "bg-\(blue\|green\|red\|yellow\|purple\|orange\|pink\|gray\|amber\|emerald\|cyan\)-[0-9]" app/ components/ --include="*.tsx" -n

# Count occurrences
grep -r "bg-blue-100" app/ components/ --include="*.tsx" | wc -l
```

### 2. Find Custom Spinners

```bash
# Find animate-spin
grep -r "animate-spin" app/ components/ --include="*.tsx" -n

# Find border-b-2 (common spinner pattern)
grep -r "border-b-2.*border-" app/ components/ --include="*.tsx" -n
```

### 3. Find Inline Styles

```bash
# Find style={{
grep -r "style={{" app/ components/ --include="*.tsx" -n

# Find backgroundColor
grep -r "backgroundColor" app/ components/ --include="*.tsx" -n
```

### 4. Find className Without cn()

```bash
# Find className with colors but no cn()
grep -r 'className="[^"]*bg-[^"]*"' app/ components/ --include="*.tsx" | grep -v "cn("
```

### 5. Find Status Badge Patterns

```bash
# Find Badge usage
grep -r "<Badge" app/ components/ --include="*.tsx" -n

# Find span with rounded-full (common badge pattern)
grep -r '<span className="[^"]*rounded-full[^"]*"' app/ components/ --include="*.tsx" -n
```

## Expected Results

### Files with Most Issues

Priority files to refactor based on patterns found:

1. **Authentication**
   - `components/auth/RoleGuard.tsx` - Custom spinner
   - `app/(auth)/login/_components/test-accounts.tsx` - Hardcoded role colors

2. **Appointments**
   - `app/admin/appointments/page.tsx` - Status badges
   - `app/doctor/appointments/page.tsx` - Status badges
   - `components/appointment/*.tsx` - Various patterns

3. **Billing**
   - `app/admin/billing/_components/invoice-status-badge.tsx` - Status badges
   - `app/admin/billing/page.tsx` - Status badges

4. **Doctor**
   - `app/doctor/schedules/page.tsx` - Status badges
   - `app/doctor/exams/page.tsx` - Status badges
   - `app/doctor/reports/appointments/page.tsx` - Inline styles

5. **Landing**
   - `components/landing/FeatureCard.tsx` - Hardcoded colors

## Sample Output Format

```
=== UI AUDIT REPORT ===
Date: 2024-12-13

1. HARDCODED COLORS
   - bg-blue-100: 45 occurrences
   - bg-green-100: 32 occurrences
   - bg-red-100: 28 occurrences
   - bg-yellow-100: 15 occurrences
   Total: 120 occurrences

2. CUSTOM SPINNERS
   - animate-spin: 8 occurrences

3. INLINE STYLES
   - style={{: 12 occurrences

4. TOTAL ISSUES: 140

FILES NEED ATTENTION:
- components/auth/RoleGuard.tsx (3 issues)
- app/doctor/schedules/page.tsx (15 issues)
...
```

## Track Progress

Update this section as you fix issues:

### Initial Audit (Dec 13, 2024)

- Hardcoded colors: ~120 occurrences
- Custom spinners: ~8 occurrences
- Inline styles: ~12 occurrences
- **Total: ~140 issues**

### After Phase 1 (Target: Dec 15, 2024)

- [ ] Components created: 4/4
- [ ] Quick wins fixed: 0/10
- [ ] Remaining issues: ~140

### After Phase 2 (Target: Dec 20, 2024)

- [ ] Status badges refactored: 0/25
- [ ] Remaining issues: ~100

### Final (Target: Dec 30, 2024)

- [ ] All issues resolved
- [ ] Remaining issues: 0

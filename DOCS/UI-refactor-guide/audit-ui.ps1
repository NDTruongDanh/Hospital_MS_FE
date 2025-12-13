# UI Audit Script for Windows PowerShell

Write-Host "=== HMS_FE UI Audit Report ===" -ForegroundColor Cyan
Write-Host "Date: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Cyan
Write-Host ""

# Function to count patterns
function Count-Pattern {
    param($Pattern, $Path = ".")
    $count = (Select-String -Path "$Path\app\*.tsx","$Path\components\*.tsx" -Pattern $Pattern -Recurse -ErrorAction SilentlyContinue).Count
    return $count
}

# 1. Hardcoded Colors
Write-Host "1. HARDCODED COLORS" -ForegroundColor Yellow
$blueCount = Count-Pattern "bg-blue-[0-9]"
$greenCount = Count-Pattern "bg-green-[0-9]"
$redCount = Count-Pattern "bg-red-[0-9]"
$yellowCount = Count-Pattern "bg-yellow-[0-9]"
$purpleCount = Count-Pattern "bg-purple-[0-9]"
$orangeCount = Count-Pattern "bg-orange-[0-9]"
$grayCount = Count-Pattern "bg-gray-[0-9]"

Write-Host "   - bg-blue-xxx: $blueCount occurrences" -ForegroundColor White
Write-Host "   - bg-green-xxx: $greenCount occurrences" -ForegroundColor White
Write-Host "   - bg-red-xxx: $redCount occurrences" -ForegroundColor White
Write-Host "   - bg-yellow-xxx: $yellowCount occurrences" -ForegroundColor White
Write-Host "   - bg-purple-xxx: $purpleCount occurrences" -ForegroundColor White
Write-Host "   - bg-orange-xxx: $orangeCount occurrences" -ForegroundColor White
Write-Host "   - bg-gray-xxx: $grayCount occurrences" -ForegroundColor White

$totalColors = $blueCount + $greenCount + $redCount + $yellowCount + $purpleCount + $orangeCount + $grayCount
Write-Host "   Total hardcoded colors: $totalColors" -ForegroundColor Green
Write-Host ""

# 2. Custom Spinners
Write-Host "2. CUSTOM SPINNERS" -ForegroundColor Yellow
$spinnerCount = Count-Pattern "animate-spin"
Write-Host "   - animate-spin: $spinnerCount occurrences" -ForegroundColor White
Write-Host ""

# 3. Inline Styles
Write-Host "3. INLINE STYLES" -ForegroundColor Yellow
$inlineStyleCount = Count-Pattern "style=\{\{"
Write-Host "   - style={{: $inlineStyleCount occurrences" -ForegroundColor White
Write-Host ""

# 4. Total Issues
$totalIssues = $totalColors + $spinnerCount + $inlineStyleCount
Write-Host "4. TOTAL ISSUES: $totalIssues" -ForegroundColor Red
Write-Host ""

# 5. Files with most issues
Write-Host "5. TOP FILES NEED ATTENTION" -ForegroundColor Yellow
Write-Host "   Searching for files with most patterns..." -ForegroundColor Gray

# Find files with hardcoded colors
$filesWithIssues = Get-ChildItem -Path "app","components" -Recurse -Include *.tsx -ErrorAction SilentlyContinue | 
    ForEach-Object {
        $file = $_.FullName
        $count = (Select-String -Path $file -Pattern "bg-(blue|green|red|yellow|purple|orange)-[0-9]","animate-spin","style=\{\{" -AllMatches -ErrorAction SilentlyContinue).Matches.Count
        if ($count -gt 0) {
            [PSCustomObject]@{
                File = $_.FullName.Replace($PWD.Path, ".").Replace("\", "/")
                Issues = $count
            }
        }
    } | Sort-Object -Property Issues -Descending | Select-Object -First 10

if ($filesWithIssues) {
    $filesWithIssues | Format-Table -AutoSize
} else {
    Write-Host "   No files with issues found!" -ForegroundColor Green
}

Write-Host ""
Write-Host "=== RECOMMENDATIONS ===" -ForegroundColor Cyan
Write-Host "1. Start with Quick Wins:" -ForegroundColor White
Write-Host "   - Refactor RoleGuard loading spinner" -ForegroundColor Gray
Write-Host "   - Replace test account badges" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Use new components:" -ForegroundColor White
Write-Host "   - StatusBadge for status indicators" -ForegroundColor Gray
Write-Host "   - Spinner for loading states" -ForegroundColor Gray
Write-Host "   - Loading for page loading" -ForegroundColor Gray
Write-Host ""
Write-Host "3. See DOCS/QUICK-START-REFACTORING.md for examples" -ForegroundColor White
Write-Host ""
Write-Host "Audit complete!" -ForegroundColor Green

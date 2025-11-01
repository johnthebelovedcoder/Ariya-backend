# Cleanup redundant documentation files
$filesToRemove = @(
    "EVERYTHING_DELIVERED.md",
    "STRATEGIC_RECOMMENDATIONS.md",
    "IMPLEMENTATION_ROADMAP.md",
    "MASTER_IMPLEMENTATION_PACKAGE.md",
    "QUICK_IMPLEMENTATION_GUIDE.md"
)

foreach ($file in $filesToRemove) {
    if (Test-Path $file) {
        Remove-Item $file -Force
        Write-Host "Removed: $file"
    } else {
        Write-Host "Not found: $file" -ForegroundColor Yellow
    }
}

Write-Host "\nCleanup complete!" -ForegroundColor Green

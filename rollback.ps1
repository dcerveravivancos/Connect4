# Quick rollback script
# Usage: .\rollback.ps1 [number-of-commits-back]

param(
    [int]$CommitsBack = 1
)

Write-Host "🔙 Rolling back $CommitsBack commit(s)..." -ForegroundColor Yellow

# Show recent commits
Write-Host "📋 Recent commits:" -ForegroundColor Cyan
git log --oneline -5

Write-Host ""
$confirm = Read-Host "Are you sure you want to rollback $CommitsBack commit(s)? (y/N)"

if ($confirm -eq 'y' -or $confirm -eq 'Y') {
    # Rollback
    git reset --hard HEAD~$CommitsBack
    
    # Force push (be careful!)
    Write-Host "⬆️ Force pushing rollback to GitHub..." -ForegroundColor Red
    git push --force-with-lease
    
    Write-Host "✅ Rollback completed!" -ForegroundColor Green
} else {
    Write-Host "❌ Rollback cancelled." -ForegroundColor Red
}

# Download and sync script for AI Studio workflow
# Usage: .\download-and-sync.ps1 "path-to-downloaded-files" "commit message"

param(
    [Parameter(Mandatory=$true)]
    [string]$DownloadPath,
    [Parameter(Mandatory=$true)]
    [string]$CommitMessage
)

Write-Host "📥 Starting download and sync process..." -ForegroundColor Green

# Check if download path exists
if (-not (Test-Path $DownloadPath)) {
    Write-Host "❌ Error: Download path '$DownloadPath' not found!" -ForegroundColor Red
    exit 1
}

# Backup current local changes (just in case)
$backupBranch = "backup-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
Write-Host "💾 Creating backup branch: $backupBranch" -ForegroundColor Yellow
git branch $backupBranch

# Copy new files from download location
Write-Host "📋 Copying files from download location..." -ForegroundColor Yellow
Copy-Item -Path "$DownloadPath\*" -Destination "." -Recurse -Force -Exclude ".git"

# Run the sync process
Write-Host "🔄 Running sync process..." -ForegroundColor Green
.\sync-from-ai-studio.ps1 $CommitMessage

Write-Host "✅ Download and sync completed!" -ForegroundColor Green
Write-Host "📦 Backup created in branch: $backupBranch" -ForegroundColor Cyan

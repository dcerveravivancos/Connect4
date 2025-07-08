# Quick sync script for AI Studio -> GitHub workflow
# Usage: .\sync-from-ai-studio.ps1 "Your commit message"

param(
    [Parameter(Mandatory=$true)]
    [string]$CommitMessage
)

Write-Host "🔄 Starting AI Studio -> GitHub sync..." -ForegroundColor Green

# Check if we're in a git repository
if (-not (Test-Path ".git")) {
    Write-Host "❌ Error: Not in a git repository!" -ForegroundColor Red
    exit 1
}

# Add all changes
Write-Host "📁 Adding all changes..." -ForegroundColor Yellow
git add .

# Check if there are changes to commit
$status = git status --porcelain
if (-not $status) {
    Write-Host "✅ No changes to commit. Everything is up to date!" -ForegroundColor Green
    exit 0
}

# Show what will be committed
Write-Host "📝 Changes to be committed:" -ForegroundColor Cyan
git status --short

# Commit changes
Write-Host "💾 Committing changes..." -ForegroundColor Yellow
git commit -m $CommitMessage

# Push to GitHub
Write-Host "⬆️ Pushing to GitHub..." -ForegroundColor Yellow
git push

Write-Host "✅ Sync completed successfully!" -ForegroundColor Green
Write-Host "🌐 View your changes at: https://github.com/dcerveravivancos/Connect4" -ForegroundColor Cyan

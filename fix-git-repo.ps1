# Fix Git repository and push to GitHub
Write-Host "Starting Git repository setup..." -ForegroundColor Green

# Check if we're in a Git repository
if (-not (Test-Path -Path ".git")) {
    Write-Host "Initializing new Git repository..." -ForegroundColor Yellow
    git init
} else {
    Write-Host "Git repository already exists." -ForegroundColor Yellow
}

# Add all files
Write-Host "Adding files to Git..." -ForegroundColor Yellow
git add .

# Check if there are any changes to commit
$status = git status --porcelain
if ($status) {
    Write-Host "Creating commit..." -ForegroundColor Yellow
    git commit -m "Initial commit: Smart Pension blockchain verification system"
} else {
    Write-Host "No changes to commit." -ForegroundColor Yellow
}

# Set up remote
$remotes = git remote
if ($remotes -notcontains "origin") {
    Write-Host "Adding GitHub remote..." -ForegroundColor Yellow
    git remote add origin https://github.com/XTRAGES/smartpension.git
} else {
    Write-Host "Remote 'origin' already exists." -ForegroundColor Yellow
}

# Create main branch if it doesn't exist
$branches = git branch
if ($branches -notmatch "main") {
    Write-Host "Creating main branch..." -ForegroundColor Yellow
    git checkout -b main
} else {
    Write-Host "Switching to main branch..." -ForegroundColor Yellow
    git checkout main
}

# Push to GitHub
Write-Host "Pushing to GitHub..." -ForegroundColor Yellow
git push -u origin main

Write-Host "Done! Check your repository at https://github.com/XTRAGES/smartpension" -ForegroundColor Green
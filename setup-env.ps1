# PowerShell script to create .env file
# Run this script: .\setup-env.ps1

$envContent = @"
# MCP Configuration
# This file contains environment variables for MCP services
# Currently using MOCK implementations - these values are used but APIs are mocked

# Google Calendar Configuration
GOOGLE_CALENDAR_ID=primary
GOOGLE_CALENDAR_ENABLED=true

# Google Docs Configuration
GOOGLE_DOCS_PRE_BOOKINGS_DOC_ID=pre-bookings-doc-id
GOOGLE_DOCS_ENABLED=true

# Gmail Configuration
ADVISOR_EMAIL=advisor@example.com
GMAIL_ENABLED=true

# Google OAuth2 Credentials (for future real API integration)
# Uncomment and fill these when ready to use real Google APIs
# GOOGLE_CLIENT_ID=your-client-id-here
# GOOGLE_CLIENT_SECRET=your-client-secret-here
# GOOGLE_REDIRECT_URI=http://localhost:3000/auth/google/callback
# GOOGLE_REFRESH_TOKEN=your-refresh-token-here

# Server Configuration
PORT=3000
"@

if (Test-Path .env) {
    Write-Host ".env file already exists. Backing up to .env.backup..." -ForegroundColor Yellow
    Copy-Item .env .env.backup
    Write-Host "Backup created: .env.backup" -ForegroundColor Green
}

$envContent | Out-File -FilePath .env -Encoding utf8
Write-Host ".env file created successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Current configuration (MOCK mode):" -ForegroundColor Cyan
Write-Host "  - Calendar: Enabled (mock)" -ForegroundColor White
Write-Host "  - Docs: Enabled (mock)" -ForegroundColor White
Write-Host "  - Gmail: Enabled (mock)" -ForegroundColor White
Write-Host ""
Write-Host "You can now test the MCP services!" -ForegroundColor Green
Write-Host "Run: npx ts-node test-mcp-services.ts" -ForegroundColor Cyan
Write-Host ""
Write-Host "For real Google API setup, see: GOOGLE_API_SETUP_GUIDE.md" -ForegroundColor Yellow


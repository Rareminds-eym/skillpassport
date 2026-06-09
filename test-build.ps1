# Test build script for Windows PowerShell
Write-Host "🔧 Testing Data Import Build..." -ForegroundColor Cyan

# Start the dev server in background and test if it starts successfully
$job = Start-Job -ScriptBlock {
    Set-Location "D:\June_2026\skillpassport"
    npm run pages:dev
}

# Wait for 10 seconds to see if it starts without errors
Start-Sleep -Seconds 10

# Check if job is still running (good sign) or has failed
$jobState = $job.State

if ($jobState -eq "Running") {
    Write-Host "✅ Build successful! Server is running." -ForegroundColor Green
    Write-Host "🌐 Test URL: http://localhost:8788/data-import.html" -ForegroundColor Yellow
    Write-Host "📡 API URL: http://localhost:8788/api/data-import" -ForegroundColor Yellow
    
    # Stop the job
    Stop-Job $job
    Remove-Job $job
    
    Write-Host "✨ Ready to test data import!" -ForegroundColor Green
} else {
    Write-Host "❌ Build failed. Checking error..." -ForegroundColor Red
    
    # Get job results
    $jobResults = Receive-Job $job
    Write-Host "Error details:" -ForegroundColor Red
    $jobResults | ForEach-Object { Write-Host $_ -ForegroundColor Red }
    
    Remove-Job $job
}

Write-Host "`n📋 Next Steps:" -ForegroundColor Cyan
Write-Host "1. If build succeeded: Start with 'npm run pages:dev'" -ForegroundColor White
Write-Host "2. Access: http://localhost:8788/data-import.html" -ForegroundColor White
Write-Host "3. Use CSV files for now (Excel support will be added later)" -ForegroundColor White
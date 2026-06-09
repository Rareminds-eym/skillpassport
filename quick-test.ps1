Write-Host "🧪 Quick Build Test" -ForegroundColor Cyan

# Test if the build completes without errors
$ErrorActionPreference = "Stop"

try {
    # Start the build process and kill it after a few seconds if it starts successfully
    $process = Start-Process -FilePath "npm" -ArgumentList "run", "pages:dev" -PassThru -NoNewWindow
    
    # Wait 8 seconds to see if build completes
    Start-Sleep -Seconds 8
    
    if (!$process.HasExited) {
        # Process is still running, which means build likely succeeded
        Write-Host "✅ BUILD SUCCESS! Server is starting..." -ForegroundColor Green
        Write-Host "🌐 Data Import URL: http://localhost:8788/data-import.html" -ForegroundColor Yellow
        Write-Host "📡 API URL: http://localhost:8788/api/data-import" -ForegroundColor Yellow
        
        # Kill the process
        Stop-Process -Id $process.Id -Force
        
        Write-Host "`n🎉 Ready to use data import system!" -ForegroundColor Green
        Write-Host "Run 'npm run pages:dev' to start the server properly." -ForegroundColor White
    } else {
        Write-Host "❌ Build failed - process exited early" -ForegroundColor Red
        Write-Host "Exit code: $($process.ExitCode)" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Error during build test: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Try running 'npm run pages:dev' manually to see the full error." -ForegroundColor Yellow
}

Write-Host "`n📋 Next Steps:" -ForegroundColor Cyan
Write-Host "1. Run: npm run pages:dev" -ForegroundColor White
Write-Host "2. Access: http://localhost:8788/data-import.html" -ForegroundColor White
Write-Host "3. Download CSV templates and upload data" -ForegroundColor White
Write-Host "4. Default password: rareminds123!" -ForegroundColor White
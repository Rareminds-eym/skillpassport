Get-ChildItem -Path src -Recurse -Include *.ts,*.tsx,*.js,*.jsx | ForEach-Object {
    $content = Get-Content $_.FullName -Raw
    $pattern = "import\(['`""]\.\.\/.*?utils\/pagesUrl['`""]"
    $replacement = "import('@/shared/lib/pagesUrl'"
    
    if ($content -match $pattern) {
        $content = $content -replace $pattern, $replacement
        Set-Content $_.FullName -Value $content -NoNewline
        Write-Host "Fixed: $($_.Name)"
    }
}

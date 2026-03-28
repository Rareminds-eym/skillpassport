$replacements = @{
    'utils/pagesUrl' = '@/shared/lib/pagesUrl'
    'utils/profileToast' = '@/features/student-profile/lib/profileToast'
    'utils/studentType' = '@/entities/student/lib/studentType'
}

Get-ChildItem -Path src -Recurse -Include *.ts,*.tsx,*.js,*.jsx | ForEach-Object {
    $content = Get-Content $_.FullName -Raw
    $modified = $false
    
    foreach ($key in $replacements.Keys) {
        $pattern = "from ['`"]\.\.\/.*?$key['`"]"
        $replacement = "from '$($replacements[$key])'"
        if ($content -match $pattern) {
            $content = $content -replace $pattern, $replacement
            $modified = $true
        }
    }
    
    if ($modified) {
        Set-Content $_.FullName -Value $content -NoNewline
        Write-Host "Fixed: $($_.FullName)"
    }
}

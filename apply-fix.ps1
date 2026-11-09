$ErrorActionPreference = "Stop"
$project = "D:\new webistes invesntions\image tool webisite"
$source = Split-Path -Parent $MyInvocation.MyCommand.Path

$targets = @(
    @{
        From = Join-Path $source "increase-image-file-size-workspace.tsx"
        To = Join-Path $project "components\increase-image-file-size-workspace.tsx"
    },
    @{
        From = Join-Path $source "increase-image-file-size.ts"
        To = Join-Path $project "lib\image\increase-image-file-size.ts"
    }
)

foreach ($item in $targets) {
    if (-not (Test-Path -LiteralPath $item.To)) {
        throw "Expected project file not found: $($item.To)"
    }
    Copy-Item -LiteralPath $item.From -Destination $item.To -Force
    Write-Host "Updated: $($item.To)" -ForegroundColor Green
}

Write-Host "`nNow run: npm run typecheck" -ForegroundColor Cyan

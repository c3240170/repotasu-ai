param(
  [string]$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path,
  [switch]$SkipInstall
)

$ErrorActionPreference = "Stop"

Set-Location $RepoRoot
$reportsDir = Join-Path $RepoRoot "security-reports"
New-Item -ItemType Directory -Force -Path $reportsDir | Out-Null

$stamp = Get-Date -Format "yyyy-MM"

function Invoke-AndSave {
  param(
    [string]$Title,
    [scriptblock]$Command,
    [string]$OutputPath
  )

  "=== $Title $(Get-Date -Format "yyyy-MM-dd HH:mm:ss") ===" | Out-File -FilePath $OutputPath -Encoding utf8
  & $Command 2>&1 | Tee-Object -FilePath $OutputPath -Append
  if ($LASTEXITCODE -ne 0) {
    throw "$Title failed with exit code $LASTEXITCODE"
  }
}

if (-not $SkipInstall) {
  Invoke-AndSave -Title "npm ci" -Command { npm ci } -OutputPath (Join-Path $reportsDir "npm-ci-$stamp.txt")
}

Invoke-AndSave -Title "npm audit" -Command { npm audit --omit=dev --audit-level=high } -OutputPath (Join-Path $reportsDir "npm-audit-$stamp.txt")
Invoke-AndSave -Title "node --check server.js" -Command { node --check server.js } -OutputPath (Join-Path $reportsDir "node-check-$stamp.txt")
Invoke-AndSave -Title "npm run security:check" -Command { npm run security:check } -OutputPath (Join-Path $reportsDir "security-check-$stamp.txt")

Write-Host "Saved reports to:" $reportsDir

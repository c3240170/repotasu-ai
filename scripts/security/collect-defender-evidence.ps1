param(
  [string]$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path,
  [ValidateSet("None", "Quick", "Full")]
  [string]$ScanType = "Quick"
)

$ErrorActionPreference = "Stop"

Set-Location $RepoRoot
$reportsDir = Join-Path $RepoRoot "security-reports"
New-Item -ItemType Directory -Force -Path $reportsDir | Out-Null

$stamp = Get-Date -Format "yyyy-MM"
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
$statusPath = Join-Path $reportsDir "defender-status-$stamp.txt"
$logPath = Join-Path $reportsDir "defender-scan-log.txt"

"=== Defender status ($timestamp) ===" | Out-File -FilePath $statusPath -Encoding utf8
Get-MpComputerStatus |
  Select-Object AMServiceEnabled, AntivirusEnabled, RealTimeProtectionEnabled, AntispywareEnabled, NISEnabled, AntispywareSignatureLastUpdated, AntivirusSignatureLastUpdated |
  Format-List |
  Out-File -FilePath $statusPath -Encoding utf8 -Append

if ($ScanType -ne "None") {
  $mpScanType = if ($ScanType -eq "Quick") { "QuickScan" } else { "FullScan" }
  Update-MpSignature | Out-Null
  Start-MpScan -ScanType $mpScanType
}

"`n=== Defender events ($timestamp) ===" | Out-File -FilePath $logPath -Encoding utf8 -Append
Get-WinEvent -LogName "Microsoft-Windows-Windows Defender/Operational" -MaxEvents 200 |
  Select-Object TimeCreated, Id, LevelDisplayName, Message |
  Out-File -FilePath $logPath -Encoding utf8 -Append

Write-Host "Saved:" $statusPath
Write-Host "Saved:" $logPath

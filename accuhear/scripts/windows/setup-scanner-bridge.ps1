param(
  [Parameter(Mandatory = $true)][string]$RepoPath,
  [Parameter(Mandatory = $true)][string]$AppUrl,
  [Parameter(Mandatory = $true)][string]$ScannerIngestKey,
  [Parameter(Mandatory = $true)][string]$ProfileId,
  [Parameter(Mandatory = $true)][string]$ProfileInsurance,
  [string]$BridgeApiKey = "",
  [string]$Naps2Path = "C:\Program Files\NAPS2\NAPS2.Console.exe",
  [int]$BridgePort = 8765
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path $RepoPath)) {
  throw "RepoPath not found: $RepoPath"
}

if (-not (Test-Path $Naps2Path)) {
  throw "NAPS2.Console.exe not found at: $Naps2Path"
}

$accuhearPath = Join-Path $RepoPath "accuhear"
if (-not (Test-Path $accuhearPath)) {
  throw "Expected accuhear folder at: $accuhearPath"
}

$nodeVersion = & node --version
if (-not $nodeVersion) {
  throw "Node.js is required but not found in PATH."
}

Push-Location $accuhearPath
try {
  npm install
} finally {
  Pop-Location
}

$runnerPath = Join-Path $accuhearPath "run-scanner-bridge.cmd"
$runnerContent = @"
@echo off
set BRIDGE_APP_URL=$AppUrl
set BRIDGE_SCANNER_KEY=$ScannerIngestKey
set BRIDGE_NAPS2_PATH=$Naps2Path
set BRIDGE_PROFILE_ID=$ProfileId
set BRIDGE_PROFILE_INSURANCE=$ProfileInsurance
set BRIDGE_PORT=$BridgePort
set BRIDGE_HOST=127.0.0.1
set BRIDGE_API_KEY=$BridgeApiKey
cd /d $accuhearPath
npm run scanner:bridge:windows
"@

Set-Content -Path $runnerPath -Value $runnerContent -Encoding ASCII

$taskName = "AccuHearScannerBridge"
try {
  schtasks /Delete /TN $taskName /F | Out-Null
} catch {
}

schtasks /Create `
  /TN $taskName `
  /SC ONLOGON `
  /TR "`"$runnerPath`"" `
  /RL HIGHEST `
  /F | Out-Null

Write-Host "Created startup task: $taskName"
Write-Host "Bridge runner: $runnerPath"
Write-Host ""
Write-Host "Starting bridge now..."
Start-Process -FilePath $runnerPath -WindowStyle Minimized
Write-Host "Done."
Write-Host "Health check URL: http://127.0.0.1:$BridgePort/health"

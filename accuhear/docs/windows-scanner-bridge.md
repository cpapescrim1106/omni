# Windows Scanner Bridge (One-Click Scan)

Use this when the front desk is on Windows and scanning hardware is connected to that Windows PC.

## Goal

`Scan ID` and `Scan Insurance` in the app trigger the local Windows scanner directly, then auto-attach to the current patient.

## Requirements

- Windows machine with scanner attached
- NAPS2 installed (includes `NAPS2.Console.exe`)
- Node.js installed on Windows
- This repo available on the Windows machine

## 1) Configure app server

On your app server `.env`:

```bash
# Persist uploaded scans
DOCUMENT_STORAGE_PROVIDER=local
DOCUMENT_STORAGE_LOCAL_ROOT=/home/chris/workspace/dev/work/Omni/accuhear/var/uploads/documents

# Scanner intake shared secret
SCANNER_INGEST_API_KEY=replace-with-long-random-secret

# Frontend points to local Windows bridge from browser
NEXT_PUBLIC_SCANNER_BRIDGE_URL=http://127.0.0.1:8765
# Optional browser->bridge key
NEXT_PUBLIC_SCANNER_BRIDGE_KEY=
```

Restart the app server after changing env.

## 2) Create NAPS2 profiles on Windows

Create at least one scanning profile in NAPS2 (for Epson DS-520 II), for example:

- `AccuHear-ID`
- `AccuHear-Insurance`

Test each in NAPS2 UI first.

## 3) Start bridge on Windows machine

From PowerShell on Windows:

```powershell
cd C:\path\to\Omni\accuhear
$env:BRIDGE_APP_URL="http://<tailscale-or-app-host>:3100"
$env:BRIDGE_SCANNER_KEY="replace-with-long-random-secret"
$env:BRIDGE_NAPS2_PATH="C:\Program Files\NAPS2\NAPS2.Console.exe"
$env:BRIDGE_PROFILE_ID="AccuHear-ID"
$env:BRIDGE_PROFILE_INSURANCE="AccuHear-Insurance"
$env:BRIDGE_PORT="8765"
$env:BRIDGE_HOST="127.0.0.1"
npm run scanner:bridge:windows
```

Automated install/startup option:

```powershell
cd C:\path\to\Omni
powershell -ExecutionPolicy Bypass -File .\accuhear\scripts\windows\setup-scanner-bridge.ps1 `
  -RepoPath "C:\path\to\Omni" `
  -AppUrl "http://<tailscale-or-app-host>:3100" `
  -ScannerIngestKey "replace-with-long-random-secret" `
  -ProfileId "AccuHear-ID" `
  -ProfileInsurance "AccuHear-Insurance"
```

This script:

- installs npm deps in `accuhear`
- writes `accuhear\run-scanner-bridge.cmd`
- creates Windows startup task `AccuHearScannerBridge`
- starts bridge immediately

Optional hardening:

```powershell
$env:BRIDGE_API_KEY="local-bridge-secret"
```

If you set `BRIDGE_API_KEY`, also set `NEXT_PUBLIC_SCANNER_BRIDGE_KEY` in app server `.env`.

## 4) Verify bridge

On Windows:

```powershell
Invoke-RestMethod http://127.0.0.1:8765/health
Invoke-RestMethod http://127.0.0.1:8765/devices
```

## 5) Test in app

Open patient -> `Documents`:

- Click `Scan ID`
- Click `Scan Insurance`

Expected:

- Scanner runs immediately
- Document appears in patient list automatically
- Preview panel shows `Open scanned document`

## Troubleshooting

- `Unable to scan from Windows bridge`: bridge not running or blocked by firewall.
- `Scanner intake failed`: `SCANNER_INGEST_API_KEY` mismatch between app server and bridge.
- No device found: fix NAPS2 profile/device selection first in NAPS2 UI.

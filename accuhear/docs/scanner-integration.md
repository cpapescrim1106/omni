# Epson DS-520 II Scanner Integration

This project now supports direct scanner uploads into patient documents.

If your staff uses a remote Windows PC with scanner hardware connected there, use:

- `accuhear/docs/windows-scanner-bridge.md`

## 1. Server configuration

Set these values in `accuhear/.env`:

```bash
# Persist document files on disk (required for preview/download)
DOCUMENT_STORAGE_PROVIDER=local
DOCUMENT_STORAGE_LOCAL_ROOT=/home/chris/workspace/dev/work/Omni/accuhear/var/uploads/documents

# Shared secret used by scanner workstations
SCANNER_INGEST_API_KEY=replace-with-a-long-random-secret

# Optional: direct local scanner control from Scan ID / Scan Insurance buttons
SCANNER_LOCAL_ENABLED=true
SCANNER_SANE_DEVICE=airscan:w1:Brother ADS-1700W [5CF3705DEED0]
# SCANNER_SANE_SOURCE="ADF Front"
# SCANNER_SANE_MODE=Color
# SCANNER_SANE_RESOLUTION=300
```

Then restart the app server.

## 2. In-app workflow (front desk)

In a patient profile under **Documents**:

- Click `Scan ID` and pick the scanned ID file
- Click `Scan Insurance` and pick the scanned insurance card file

The document is uploaded immediately and attached to that patient.

If `SCANNER_LOCAL_ENABLED=true`, the same buttons trigger a live scan from this machine using `scanimage` (no manual file selection).

## 2.1 Verify scanner visibility on this machine

Run:

```bash
scanimage -L
```

If your Epson DS-520 II is visible, set `SCANNER_SANE_DEVICE` to that exact device string and restart the app.

## 3. Scanner workstation workflow (Tailscale)

Use the CLI uploader from the machine connected to the scanner:

```bash
cd /home/chris/workspace/dev/work/Omni/accuhear
npm run scanner:upload -- \
  --server-url http://<tailscale-hostname>:3100 \
  --scanner-key "$SCANNER_INGEST_API_KEY" \
  --patient-legacy-id 12345 \
  --kind insurance \
  --file "/path/to/scanned-file.pdf" \
  --added-by "Front Desk Scanner"
```

Supported options:

- `--patient-id` or `--patient-legacy-id` (one required)
- `--kind id|insurance` (optional, auto-categorizes)
- `--category <name>` (optional override)
- `--title <text>` (optional override)
- `--added-by <name>` (optional)

Endpoint used: `POST /api/scanner/intake` with header `x-scanner-key`.

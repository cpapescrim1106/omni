#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BASE_URL="${BASE_URL:-https://blueprintoms.atlassian.net/wiki}"
PAGES_INDEX_JSON="${ROOT_DIR}/data/blueprint-scrape/manifests/pages-index.json"
PDF_DIR="${ROOT_DIR}/data/blueprint-scrape/pdfs"
MANIFEST_DIR="${ROOT_DIR}/data/blueprint-scrape/manifests"
ATTEMPTS_JSONL="${MANIFEST_DIR}/pdf-attempts.jsonl"
SUMMARY_JSON="${MANIFEST_DIR}/pdf-summary.json"
COOKIE_JAR="${MANIFEST_DIR}/pdf-cookies.txt"
MIN_PDF_BYTES="${MIN_PDF_BYTES:-1024}"
MISSING_ONLY="${MISSING_ONLY:-0}"

mkdir -p "${PDF_DIR}" "${MANIFEST_DIR}"
: > "${ATTEMPTS_JSONL}"
: > "${COOKIE_JAR}"

if [[ ! -f "${PAGES_INDEX_JSON}" ]]; then
  echo "Missing pages index: ${PAGES_INDEX_JSON}"
  echo "Run scripts/blueprint-scrape-full.sh first."
  exit 1
fi

slugify() {
  local input="$1"
  local slug
  slug="$(printf '%s' "$input" | tr '[:upper:]' '[:lower:]' | sed -E 's/[^a-z0-9]+/-/g; s/^-+//; s/-+$//; s/-+/-/g' | cut -c1-80)"
  if [[ -z "$slug" ]]; then
    slug="page"
  fi
  printf '%s' "$slug"
}

is_valid_pdf() {
  local path="$1"
  if [[ ! -f "${path}" ]]; then
    return 1
  fi

  local size
  size="$(stat -c '%s' "${path}")"
  if [[ "${size}" -lt "${MIN_PDF_BYTES}" ]]; then
    return 1
  fi

  if ! head -c 4 "${path}" 2>/dev/null | grep -q '%PDF'; then
    return 1
  fi

  return 0
}

playwright_ready=1
if ! command -v playwright-cli >/dev/null 2>&1; then
  playwright_ready=0
fi

if [[ "${playwright_ready}" -eq 1 ]]; then
  if ! playwright-cli -s=bp-pdf open about:blank >/dev/null 2>&1; then
    playwright_ready=0
  fi
fi

cleanup() {
  if [[ "${playwright_ready}" -eq 1 ]]; then
    playwright-cli -s=bp-pdf close >/dev/null 2>&1 || true
  fi
}
trap cleanup EXIT

mapfile -t page_ids < <(jq -r '.[].id' "${PAGES_INDEX_JSON}")

if [[ "${MISSING_ONLY}" == "1" ]]; then
  filtered_ids=()
  for id in "${page_ids[@]}"; do
    title="$(jq -r --arg id "${id}" '.[] | select(.id == $id) | .title // "(untitled)"' "${PAGES_INDEX_JSON}")"
    slug="$(slugify "${title}")"
    pdf_path="${PDF_DIR}/${id}-${slug}.pdf"

    if ! is_valid_pdf "${pdf_path}"; then
      filtered_ids+=("${id}")
    fi
  done
  page_ids=("${filtered_ids[@]}")
fi

total_pages="${#page_ids[@]}"

ok_count=0
fail_count=0
method_flyingpdf=0
method_playwright=0

for i in "${!page_ids[@]}"; do
  id="${page_ids[$i]}"
  idx=$((i + 1))

  title="$(jq -r --arg id "${id}" '.[] | select(.id == $id) | .title // "(untitled)"' "${PAGES_INDEX_JSON}")"
  webui_path="$(jq -r --arg id "${id}" '.[] | select(.id == $id) | ._links.webui // empty' "${PAGES_INDEX_JSON}")"
  page_url="${BASE_URL}${webui_path}"
  slug="$(slugify "${title}")"
  pdf_path="${PDF_DIR}/${id}-${slug}.pdf"

  status="failed"
  method="none"
  error=""
  http_code=""

  # Attempt 1: Confluence native pdf export endpoint
  export_url="${BASE_URL}/spaces/flyingpdf/pdfpageexport.action?pageId=${id}"
  tmp_pdf="$(mktemp)"

  curl -sS -L -c "${COOKIE_JAR}" -b "${COOKIE_JAR}" "${page_url}" -o /dev/null || true
  http_code="$(curl -sS -L -w '%{http_code}' -o "${tmp_pdf}" -c "${COOKIE_JAR}" -b "${COOKIE_JAR}" "${export_url}" || echo "000")"

  if [[ "${http_code}" == "200" ]] && is_valid_pdf "${tmp_pdf}"; then
    mv "${tmp_pdf}" "${pdf_path}"
    status="ok"
    method="flyingpdf"
    ok_count=$((ok_count + 1))
    method_flyingpdf=$((method_flyingpdf + 1))
  else
    rm -f "${tmp_pdf}"

    # Attempt 2: Browser print-to-pdf fallback
    if [[ "${playwright_ready}" -eq 1 ]]; then
      tmp_playwright_pdf="${pdf_path}.tmp"
      rm -f "${tmp_playwright_pdf}"
      if playwright-cli -s=bp-pdf goto "${page_url}" >/dev/null 2>&1 && playwright-cli -s=bp-pdf pdf --filename="${tmp_playwright_pdf}" >/dev/null 2>&1; then
        if is_valid_pdf "${tmp_playwright_pdf}"; then
          mv "${tmp_playwright_pdf}" "${pdf_path}"
          status="ok"
          method="playwright"
          ok_count=$((ok_count + 1))
          method_playwright=$((method_playwright + 1))
        else
          rm -f "${tmp_playwright_pdf}" || true
          error="flyingpdf ${http_code}; playwright produced invalid/empty pdf"
        fi
      else
        error="flyingpdf ${http_code}; playwright failed"
        rm -f "${tmp_playwright_pdf}" || true
      fi
    else
      error="flyingpdf ${http_code}; playwright unavailable"
    fi
  fi

  if [[ "${status}" == "failed" ]]; then
    fail_count=$((fail_count + 1))
    rm -f "${pdf_path}" || true
  fi

  file_bytes=0
  if [[ -f "${pdf_path}" ]]; then
    file_bytes="$(stat -c '%s' "${pdf_path}")"
  fi

  jq -cn \
    --arg id "${id}" \
    --arg title "${title}" \
    --arg url "${page_url}" \
    --arg status "${status}" \
    --arg method "${method}" \
    --arg httpCode "${http_code}" \
    --arg error "${error}" \
    --argjson fileBytes "${file_bytes}" \
    '{id:$id,title:$title,url:$url,status:$status,method:$method,httpCode:$httpCode,fileBytes:$fileBytes,error:$error}' >> "${ATTEMPTS_JSONL}"

  echo "[${idx}/${total_pages}] ${status^^} ${id} method=${method}"
done

all_pages_count="$(jq 'length' "${PAGES_INDEX_JSON}")"
valid_pdf_count=0
while IFS=$'\t' read -r id title; do
  slug="$(slugify "${title}")"
  check_path="${PDF_DIR}/${id}-${slug}.pdf"
  if is_valid_pdf "${check_path}"; then
    valid_pdf_count=$((valid_pdf_count + 1))
  fi
done < <(jq -r '.[] | [.id,.title] | @tsv' "${PAGES_INDEX_JSON}")

jq -n \
  --arg generatedAt "$(date -Iseconds)" \
  --arg baseUrl "${BASE_URL}" \
  --argjson runPages "${total_pages}" \
  --argjson okCount "${ok_count}" \
  --argjson failCount "${fail_count}" \
  --argjson flyingpdfCount "${method_flyingpdf}" \
  --argjson playwrightCount "${method_playwright}" \
  --argjson allPages "${all_pages_count}" \
  --argjson validPdfCount "${valid_pdf_count}" \
  --arg missingOnly "${MISSING_ONLY}" \
  '{generatedAt:$generatedAt,baseUrl:$baseUrl,runPages:$runPages,okCount:$okCount,failCount:$failCount,methodBreakdown:{flyingpdf:$flyingpdfCount,playwright:$playwrightCount},coverage:{allPages:$allPages,validPdfCount:$validPdfCount},missingOnly:$missingOnly}' > "${SUMMARY_JSON}"

echo "PDF pass complete. Summary: ${SUMMARY_JSON}"

#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BASE_URL="${BASE_URL:-https://blueprintoms.atlassian.net/wiki}"
ROOT_PAGE_ID="${ROOT_PAGE_ID:-491615}"
PAGE_LIMIT="${PAGE_LIMIT:-200}"

DATA_ROOT="${ROOT_DIR}/data/blueprint-scrape"
RAW_JSON_PAGES_DIR="${DATA_ROOT}/raw-json/pages"
RAW_JSON_ATTACH_DIR="${DATA_ROOT}/raw-json/attachments"
RAW_HTML_DIR="${DATA_ROOT}/raw-html"
RAW_TEXT_DIR="${DATA_ROOT}/raw-text"
MANIFEST_DIR="${DATA_ROOT}/manifests"
DOC_SCRAPE_ROOT="${ROOT_DIR}/docs/blueprint-migration/scrape"
DOC_PAGES_DIR="${DOC_SCRAPE_ROOT}/pages"
DOC_FEATURES_DIR="${DOC_SCRAPE_ROOT}/features"

mkdir -p \
  "${RAW_JSON_PAGES_DIR}" \
  "${RAW_JSON_ATTACH_DIR}" \
  "${RAW_HTML_DIR}" \
  "${RAW_TEXT_DIR}" \
  "${MANIFEST_DIR}" \
  "${DOC_PAGES_DIR}" \
  "${DOC_FEATURES_DIR}"

slugify() {
  local input="$1"
  local slug
  slug="$(printf '%s' "$input" | tr '[:upper:]' '[:lower:]' | sed -E 's/[^a-z0-9]+/-/g; s/^-+//; s/-+$//; s/-+/-/g' | cut -c1-80)"
  if [[ -z "$slug" ]]; then
    slug="page"
  fi
  printf '%s' "$slug"
}

extract_text() {
  perl -CSDA -0777 -pe 's/<(script|style)[^>]*>.*?<\/\1>//gis; s/<br\s*\/?\s*>/\n/gi; s/<\/p>/\n\n/gi; s/<\/li>/\n/gi; s/<li[^>]*>/ - /gi; s/<\/h[1-6]>/\n\n/gi; s/<h[1-6][^>]*>/\n\n/gi; s/<[^>]+>//g; s/&nbsp;/ /g; s/&amp;/&/g; s/&lt;/</g; s/&gt;/>/g; s/&quot;/"/g; s/&#39;/'"'"'/g; s/\r//g; s/\n{3,}/\n\n/g; s/^\s+//; s/\s+$//'
}

extract_headings() {
  perl -CSDA -0777 -ne 'while (/<h[1-6][^>]*>(.*?)<\/h[1-6]>/gis) { my $t = $1; $t =~ s/<[^>]+>//g; $t =~ s/&nbsp;/ /g; $t =~ s/&amp;/&/g; $t =~ s/&lt;/</g; $t =~ s/&gt;/>/g; $t =~ s/&quot;/"/g; $t =~ s/&#39;/'"'"'/g; $t =~ s/^\s+|\s+$//g; next if $t eq q{}; print "$t\n"; }'
}

PAGES_INDEX_JSON="${MANIFEST_DIR}/pages-index.json"
SCRAPE_FAILURES_JSONL="${MANIFEST_DIR}/scrape-failures.jsonl"
FEATURES_JSONL="${DOC_FEATURES_DIR}/page-features.jsonl"

: > "${SCRAPE_FAILURES_JSONL}"
: > "${FEATURES_JSONL}"

all_pages_tmp="$(mktemp)"
trap 'rm -f "${all_pages_tmp}"' EXIT

# Descendants
next_path="/rest/api/content/${ROOT_PAGE_ID}/descendant/page?limit=${PAGE_LIMIT}"
batch=0
while [[ -n "${next_path}" ]]; do
  batch=$((batch + 1))
  batch_file="${MANIFEST_DIR}/descendants-batch-${batch}.json"
  curl -fsS "${BASE_URL}${next_path}" -o "${batch_file}"
  jq -c '.results[]' "${batch_file}" >> "${all_pages_tmp}"
  next_path="$(jq -r '._links.next // empty' "${batch_file}")"
done

# Root page (include the space overview page itself)
root_file="${RAW_JSON_PAGES_DIR}/${ROOT_PAGE_ID}.json"
curl -fsS "${BASE_URL}/rest/api/content/${ROOT_PAGE_ID}?expand=body.storage,version,ancestors,space" -o "${root_file}"
jq -c '{id, type, status, title, _links, space, version, ancestors}' "${root_file}" >> "${all_pages_tmp}"

jq -s 'unique_by(.id) | sort_by(.id | tonumber)' "${all_pages_tmp}" > "${PAGES_INDEX_JSON}"

mapfile -t page_ids < <(jq -r '.[].id' "${PAGES_INDEX_JSON}")
total_pages="${#page_ids[@]}"

echo "Scraping ${total_pages} pages from root ${ROOT_PAGE_ID}..."

success_count=0
failed_count=0
attachment_total=0

for i in "${!page_ids[@]}"; do
  id="${page_ids[$i]}"
  idx=$((i + 1))

  detail_file="${RAW_JSON_PAGES_DIR}/${id}.json"
  if [[ "${id}" != "${ROOT_PAGE_ID}" ]]; then
    if ! curl -fsS "${BASE_URL}/rest/api/content/${id}?expand=body.storage,version,ancestors,space" -o "${detail_file}"; then
      failed_count=$((failed_count + 1))
      jq -cn --arg id "${id}" --arg stage "content" --arg error "fetch failed" '{id:$id,stage:$stage,error:$error}' >> "${SCRAPE_FAILURES_JSONL}"
      echo "[${idx}/${total_pages}] FAIL content ${id}"
      continue
    fi
  fi

  title="$(jq -r '.title // "(untitled)"' "${detail_file}")"
  slug="$(slugify "${title}")"
  webui_path="$(jq -r '._links.webui // empty' "${detail_file}")"
  page_url="${BASE_URL}${webui_path}"

  # Rendered HTML capture
  if [[ -n "${webui_path}" ]]; then
    if ! curl -fsSL "${page_url}" -o "${RAW_HTML_DIR}/${id}.html"; then
      jq -cn --arg id "${id}" --arg stage "html" --arg error "fetch failed" '{id:$id,stage:$stage,error:$error}' >> "${SCRAPE_FAILURES_JSONL}"
    fi
  fi

  # Full text extraction from Confluence storage XHTML
  jq -r '.body.storage.value // ""' "${detail_file}" | extract_text > "${RAW_TEXT_DIR}/${id}.txt"

  # Feature candidates from headings
  feature_txt_file="${DOC_FEATURES_DIR}/${id}.features.txt"
  jq -r '.body.storage.value // ""' "${detail_file}" | extract_headings | awk 'NF' | awk '!seen[$0]++' > "${feature_txt_file}"

  # Fallback if no headings present
  if [[ ! -s "${feature_txt_file}" ]]; then
    printf '%s\n' "${title}" > "${feature_txt_file}"
  fi

  # Attachments inventory with pagination
  attach_tmp="$(mktemp)"
  attach_path="/rest/api/content/${id}/child/attachment?limit=200"
  while [[ -n "${attach_path}" ]]; do
    attach_page_json="$(mktemp)"
    if curl -fsS "${BASE_URL}${attach_path}" -o "${attach_page_json}"; then
      jq -c '.results[]?' "${attach_page_json}" >> "${attach_tmp}"
      attach_path="$(jq -r '._links.next // empty' "${attach_page_json}")"
    else
      jq -cn --arg id "${id}" --arg stage "attachments" --arg error "fetch failed" '{id:$id,stage:$stage,error:$error}' >> "${SCRAPE_FAILURES_JSONL}"
      attach_path=""
    fi
    rm -f "${attach_page_json}"
  done

  if [[ -s "${attach_tmp}" ]]; then
    jq -s '.' "${attach_tmp}" > "${RAW_JSON_ATTACH_DIR}/${id}.attachments.json"
  else
    printf '[]\n' > "${RAW_JSON_ATTACH_DIR}/${id}.attachments.json"
  fi
  page_attachment_count="$(jq 'length' "${RAW_JSON_ATTACH_DIR}/${id}.attachments.json")"
  attachment_total=$((attachment_total + page_attachment_count))
  rm -f "${attach_tmp}"

  # Per-page feature metadata (jsonl)
  features_json="$(jq -Rsc 'split("\n") | map(select(length > 0))' "${feature_txt_file}")"
  jq -cn \
    --arg id "${id}" \
    --arg title "${title}" \
    --arg url "${page_url}" \
    --argjson features "${features_json}" \
    --argjson attachmentCount "${page_attachment_count}" \
    '{id:$id,title:$title,url:$url,features:$features,attachmentCount:$attachmentCount}' >> "${FEATURES_JSONL}"

  # Human-readable page doc
  page_doc_file="${DOC_PAGES_DIR}/${id}-${slug}.md"
  {
    echo "# ${title}"
    echo
    echo "- Page ID: ${id}"
    echo "- URL: ${page_url}"
    echo "- Last updated: $(jq -r '.version.when // "unknown"' "${detail_file}")"
    echo "- Last updated by: $(jq -r '.version.by.displayName // "unknown"' "${detail_file}")"
    echo "- Space: $(jq -r '.space.key // "unknown"' "${detail_file}")"
    echo "- Ancestors: $(jq -r '[.ancestors[]?.title] | join(" > ")' "${detail_file}")"
    echo "- Attachment count: ${page_attachment_count}"
    echo "- Raw JSON: data/blueprint-scrape/raw-json/pages/${id}.json"
    echo "- Raw HTML: data/blueprint-scrape/raw-html/${id}.html"
    echo "- Raw text: data/blueprint-scrape/raw-text/${id}.txt"
    echo "- Attachment manifest: data/blueprint-scrape/raw-json/attachments/${id}.attachments.json"
    echo
    echo "## Inferred features"
    if [[ -s "${feature_txt_file}" ]]; then
      while IFS= read -r f; do
        echo "- ${f}"
      done < "${feature_txt_file}"
    else
      echo "- (none detected)"
    fi
    echo
    echo "## Text excerpt"
    echo '```text'
    head -n 80 "${RAW_TEXT_DIR}/${id}.txt"
    echo '```'
  } > "${page_doc_file}"

  success_count=$((success_count + 1))
  echo "[${idx}/${total_pages}] OK ${id} ${title}"
done

summary_file="${MANIFEST_DIR}/scrape-summary.json"
jq -n \
  --arg generatedAt "$(date -Iseconds)" \
  --arg baseUrl "${BASE_URL}" \
  --arg rootPageId "${ROOT_PAGE_ID}" \
  --argjson pageCount "${total_pages}" \
  --argjson scrapedCount "${success_count}" \
  --argjson failedCount "${failed_count}" \
  --argjson attachmentCount "${attachment_total}" \
  '{generatedAt:$generatedAt,baseUrl:$baseUrl,rootPageId:$rootPageId,pageCount:$pageCount,scrapedCount:$scrapedCount,failedCount:$failedCount,attachmentCount:$attachmentCount}' > "${summary_file}"

# Top-level scrape doc
SCRAPE_README="${DOC_SCRAPE_ROOT}/README.md"
{
  echo "# Blueprint scrape outputs"
  echo
  echo "Generated: $(date -Iseconds)"
  echo
  echo "- Base URL: ${BASE_URL}"
  echo "- Root page id: ${ROOT_PAGE_ID}"
  echo "- Pages discovered: ${total_pages}"
  echo "- Pages scraped: ${success_count}"
  echo "- Pages failed: ${failed_count}"
  echo "- Attachment records: ${attachment_total}"
  echo
  echo "## Output layout"
  echo
  echo '- `docs/blueprint-migration/scrape/pages/`: one page dossier per Confluence page'
  echo '- `docs/blueprint-migration/scrape/features/page-features.jsonl`: inferred feature list per page'
  echo '- `data/blueprint-scrape/raw-json/pages/`: raw Confluence content payloads'
  echo '- `data/blueprint-scrape/raw-json/attachments/`: attachment manifests per page'
  echo '- `data/blueprint-scrape/raw-html/`: rendered page HTML captures'
  echo '- `data/blueprint-scrape/raw-text/`: full text extracted from storage XHTML'
  echo '- `data/blueprint-scrape/manifests/pages-index.json`: all discovered pages'
  echo '- `data/blueprint-scrape/manifests/scrape-summary.json`: scrape summary'
  echo '- `data/blueprint-scrape/manifests/scrape-failures.jsonl`: non-fatal failures'
} > "${SCRAPE_README}"

echo "Scrape complete. Summary: ${summary_file}"

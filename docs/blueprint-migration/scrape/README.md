# Blueprint scrape outputs

Generated: 2026-02-21T14:39:16-05:00

- Base URL: https://blueprintoms.atlassian.net/wiki
- Root page id: 491615
- Pages discovered: 234
- Pages scraped: 234
- Pages failed: 0
- Attachment records: 3082
- PDF coverage: 234 / 234 valid PDFs

## Output layout

- docs/blueprint-migration/scrape/pages/: one page dossier per Confluence page
- docs/blueprint-migration/scrape/features/page-features.jsonl: inferred feature list per page
- data/blueprint-scrape/raw-json/pages/: raw Confluence content payloads
- data/blueprint-scrape/raw-json/attachments/: attachment manifests per page
- data/blueprint-scrape/raw-html/: rendered page HTML captures
- data/blueprint-scrape/raw-text/: full text extracted from storage XHTML
- data/blueprint-scrape/manifests/pages-index.json: all discovered pages
- data/blueprint-scrape/manifests/scrape-summary.json: scrape summary
- data/blueprint-scrape/manifests/scrape-failures.jsonl: non-fatal failures
- data/blueprint-scrape/pdfs/: per-page PDF captures
- data/blueprint-scrape/manifests/pdf-summary.json: PDF run + coverage summary

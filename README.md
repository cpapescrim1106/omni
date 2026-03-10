AccuBase export (clean repo)

Contents:
- accuhear/        Next.js app (Prisma + Postgres)
- data/            CSVs required by scripts/seed.ts (NOT tracked by git)
- reference/       Optional screenshots/reference material
- Brand-Vision-Draft.md

Git hygiene:
- data/ is intentionally ignored in .gitignore.
- Keep data/ out of the repo; transfer CSVs separately or keep them only locally.

Quick start (new machine):
1) Install Node.js (LTS) and Postgres.
2) Create a Postgres database (e.g. accuhear).
3) In accuhear/, copy .env.example to .env and set DATABASE_URL.
4) Install deps and initialize schema:
   npm install
   npx prisma db push
   npm run db:seed
5) Run the app:
   npm run dev

Notes:
- The database is not stored in git; it is created from Prisma schema + seed data.
- If data/ is missing, the seed script will fail (it reads CSVs from ../data).

Blueprint migration docs:
- Feature-parity + clone planning is documented in `docs/blueprint-migration/README.md`.

Scanner integration:
- Scanner ingestion for IDs and insurance cards is documented in `accuhear/docs/scanner-integration.md`.
- Configure scanner secrets/storage in `accuhear/.env` (see `accuhear/.env.example`).
- Windows one-click bridge setup is documented in `accuhear/docs/windows-scanner-bridge.md`.
- Windows auto-setup script: `accuhear/scripts/windows/setup-scanner-bridge.ps1`.

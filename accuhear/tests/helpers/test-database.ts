export const DEFAULT_TEST_DATABASE_URL =
  "postgresql://cpape:cpape@localhost:5433/accuhear_test?schema=public";

export function resolveTestDatabaseUrl(provided = process.env.DATABASE_URL) {
  if (provided && provided.trim()) {
    return provided;
  }
  return DEFAULT_TEST_DATABASE_URL;
}

export function ensureTestDatabaseUrl() {
  const resolved = resolveTestDatabaseUrl();
  process.env.DATABASE_URL = resolved;
  return resolved;
}

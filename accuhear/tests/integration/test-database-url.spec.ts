import { test } from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_TEST_DATABASE_URL, ensureTestDatabaseUrl } from "../helpers/test-database";

function resetDatabaseUrl(previous?: string) {
  if (previous === undefined) {
    delete process.env.DATABASE_URL;
  } else {
    process.env.DATABASE_URL = previous;
  }
}

test("uses default DATABASE_URL when none provided", () => {
  const previous = process.env.DATABASE_URL;
  delete process.env.DATABASE_URL;

  const resolved = ensureTestDatabaseUrl();

  assert.equal(resolved, DEFAULT_TEST_DATABASE_URL);
  assert.equal(process.env.DATABASE_URL, DEFAULT_TEST_DATABASE_URL);

  resetDatabaseUrl(previous);
});

test("playwright webServer uses default DATABASE_URL when none provided", async () => {
  const previous = process.env.DATABASE_URL;
  delete process.env.DATABASE_URL;

  const configUrl = new URL("../../playwright.config.ts", import.meta.url);
  const configModule = await import(`${configUrl.href}?test=${Date.now()}`);
  const config = configModule.default;
  const webServerEnv = config.webServer?.env as Record<string, string> | undefined;

  assert.equal(webServerEnv?.DATABASE_URL, DEFAULT_TEST_DATABASE_URL);

  resetDatabaseUrl(previous);
});

import { before } from "node:test";
import { ensureTestDatabaseUrl } from "./test-database";

ensureTestDatabaseUrl();

before(async () => {
  const { ensurePatientSearchSchema } = await import("../../src/lib/patient-search");
  await ensurePatientSearchSchema();
});

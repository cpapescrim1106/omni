import type { Prisma, PrismaClient } from "@prisma/client";

const CLEANUP_LOCK_ID = 82541059;

function isPostgresDatabaseUrl(url = process.env.DATABASE_URL) {
  return Boolean(url && (url.startsWith("postgres://") || url.startsWith("postgresql://")));
}

type CleanupOptions = {
  maxWaitMs?: number;
  timeoutMs?: number;
};

export async function withTestCleanup<T>(
  prisma: PrismaClient,
  callback: (tx: Prisma.TransactionClient) => Promise<T>,
  options: CleanupOptions = {}
) {
  const transactionOptions =
    options.maxWaitMs || options.timeoutMs
      ? {
          ...(options.maxWaitMs ? { maxWait: options.maxWaitMs } : {}),
          ...(options.timeoutMs ? { timeout: options.timeoutMs } : {}),
        }
      : undefined;

  return prisma.$transaction(
    async (tx) => {
      if (isPostgresDatabaseUrl()) {
        await tx.$executeRawUnsafe(`SELECT pg_advisory_xact_lock(${CLEANUP_LOCK_ID});`);
      }
      return callback(tx);
    },
    transactionOptions
  );
}

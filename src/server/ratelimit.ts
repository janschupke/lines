import { prisma } from "./db";

/**
 * Count queries over the indexed SubmissionAttempt windows. Correct across
 * instances, no extra infrastructure. Swap for Upstash behind the same
 * interface if it ever runs hot.
 */
export async function attemptsInWindow(
  where: { playerId: string } | { ipHash: string },
  windowMs: number,
  outcomes?: string[],
): Promise<number> {
  return prisma.submissionAttempt.count({
    where: {
      ...where,
      ...(outcomes ? { outcome: { in: outcomes } } : {}),
      createdAt: { gte: new Date(Date.now() - windowMs) },
    },
  });
}

export async function recordAttempt(
  outcome: string,
  ipHash: string,
  playerId?: string,
): Promise<void> {
  try {
    await prisma.submissionAttempt.create({
      data: { outcome, ipHash, playerId: playerId ?? null },
    });
  } catch {
    // the audit trail must never take a request down with it
  }
}

export const HOUR = 3600 * 1000;
export const DAY = 24 * HOUR;

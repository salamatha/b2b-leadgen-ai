// db/linkedinSession.ts
import { prisma } from "./prisma.ts";

/** Save/replace Playwright storageState JSON for a user (one row per user_id). */
export async function saveLinkedInSession(userId: string, storageState: any) {
  if (!userId) throw new Error("userId is required");
  if (!storageState) throw new Error("storageState is required");

  await prisma.linkedin_sessions.upsert({
    where: { user_id: userId },
    create: { user_id: userId, storage_state: storageState },
    update: { storage_state: storageState, updated_at: new Date() },
  });
}

/** Get stored Playwright storageState JSON for a user. */
export async function getLinkedInSession(userId: string): Promise<any | null> {
  if (!userId) throw new Error("userId is required");
  const row = await prisma.linkedin_sessions.findUnique({ where: { user_id: userId } });
  return row?.storage_state ?? null;
}

/** Delete a user's stored session. */
export async function deleteLinkedInSession(userId: string) {
  if (!userId) throw new Error("userId is required");
  await prisma.linkedin_sessions.delete({ where: { user_id: userId } }).catch(() => {});
}

/** Back-compat aliases if older code imports these names */
export {
  getLinkedInSession as getUserSession,
  saveLinkedInSession as saveUserSession,
  deleteLinkedInSession as deleteUserSession,
};

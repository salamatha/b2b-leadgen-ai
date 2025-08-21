// db/linkedinSession.ts
import { prisma } from "./prisma.ts";

type Cookie = {
  name: string; value: string; domain: string; path: string;
  expires?: number; httpOnly?: boolean; secure?: boolean;
  sameSite?: "Lax" | "None" | "Strict";
};
type StorageState = { cookies?: Cookie[]; origins?: any[] };

function hasLiAt(state?: StorageState | null) {
  const li = state?.cookies?.find(c => c.name === "li_at");
  return !!(li && li.value && li.domain?.includes("linkedin.com"));
}

export async function getLinkedInSession(userId: string): Promise<StorageState | null> {
  // Your table columns (from your message):
  // id, user_id, created_at, updated_at, storage_state (Json)
  const row = await prisma.linkedin_sessions.findUnique({
    where: { user_id: userId },
    select: { storage_state: true }, // <-- only storage_state exists
  });

  const state = (row?.storage_state as any) ?? null;
  if (!state || !Array.isArray(state.cookies)) return null;
  return hasLiAt(state) ? state : null;
}

export async function saveLinkedInSession(userId: string, state: StorageState) {
  await prisma.linkedin_sessions.upsert({
    where: { user_id: userId },
    update: { storage_state: state, updated_at: new Date() as any },
    create: {
      user_id: userId,
      storage_state: state,
      created_at: new Date() as any,
      updated_at: new Date() as any,
    },
  });
}

export async function deleteLinkedInSession(userId: string) {
  await prisma.linkedin_sessions.delete({ where: { user_id: userId } }).catch(() => {});
}

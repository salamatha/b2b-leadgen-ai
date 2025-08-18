// db/linkedinSession.ts
import { supabase } from "../server/db/supabase.ts";

function cleanUserId(raw: string | null): string {
  return (raw || "").trim();
}

export async function getUserSession(userIdRaw: string): Promise<string | null> {
  const userId = cleanUserId(userIdRaw);
  if (!userId) return null;

  const { data, error } = await supabase
    .from("linkedin_sessions")
    .select("storage_state")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("getUserSession error:", error.message);
    return null;
  }
  return data?.storage_state ? JSON.stringify(data.storage_state) : null;
}

export async function saveUserSession(userIdRaw: string, storageStateJson: string) {
  const userId = cleanUserId(userIdRaw);
  if (!userId) throw new Error("saveUserSession: empty userId");

  const storage = JSON.parse(storageStateJson);

  // Upsert on the unique key (user_id) so we UPDATE instead of INSERT a duplicate
  const { error } = await supabase
    .from("linkedin_sessions")
    .upsert(
      {
        user_id: userId,
        storage_state: storage,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }         // ← IMPORTANT
    )
    .select("user_id")
    .maybeSingle();

  if (error) {
    console.error("saveUserSession error:", error.message);
    throw error;
  }
}

export async function deleteUserSession(userIdRaw: string) {
  const userId = cleanUserId(userIdRaw);
  if (!userId) return;
  const { error } = await supabase.from("linkedin_sessions").delete().eq("user_id", userId);
  if (error) console.error("deleteUserSession error:", error.message);
}

import { supabase } from "../server/db/supabase.ts";

export async function getUserSession(userId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from("linkedin_sessions")
    .select("storage_state")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) { console.error("getUserSession error:", error.message); return null; }
  return data?.storage_state ? JSON.stringify(data.storage_state) : null;
}

export async function saveUserSession(userId: string, storageStateJson: string) {
  const storage = JSON.parse(storageStateJson);
  const { error } = await supabase
    .from("linkedin_sessions")
    .upsert({ user_id: userId, storage_state: storage, updated_at: new Date().toISOString() });
  if (error) console.error("saveUserSession error:", error.message);
}

export async function deleteUserSession(userId: string) {
  const { error } = await supabase.from("linkedin_sessions").delete().eq("user_id", userId);
  if (error) console.error("deleteUserSession error:", error.message);
}



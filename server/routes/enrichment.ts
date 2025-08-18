import express from "express";
import jwt from "jsonwebtoken";
import { supabase } from "../db/supabase.ts";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_change_me";

function requireAuth(req: any, res: any, next: any) {
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!token) return res.status(401).json({ error: "Missing token" });
  try {
    const payload = jwt.verify(token, JWT_SECRET) as any;
    req.user = { id: payload.uid, email: payload.email };
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
}

router.get("/", requireAuth, async (req: any, res) => {
  const { data, error } = await supabase
    .from("enrichment_credentials")
    .select("*")
    .eq("user_id", req.user.id)
    .order("created_at", { ascending: false });
  if (error) return res.status(400).json({ error: error.message });
  res.json({ success: true, data });
});

router.post("/", requireAuth, async (req: any, res) => {
  const { provider, api_key, account_id, active } = req.body as {
    provider: string; api_key?: string; account_id?: string; active?: boolean;
  };
  if (!provider) return res.status(400).json({ error: "provider required" });
  const { error } = await supabase.from("enrichment_credentials").insert({
    user_id: req.user.id, provider, api_key: api_key || null,
    account_id: account_id || null, active: active ?? true
  });
  if (error) return res.status(400).json({ error: error.message });
  res.json({ success: true });
});

router.put("/:id", requireAuth, async (req: any, res) => {
  const { id } = req.params;
  const updates = { ...req.body, updated_at: new Date().toISOString() };
  const { error } = await supabase
    .from("enrichment_credentials")
    .update(updates)
    .eq("id", id)
    .eq("user_id", req.user.id);
  if (error) return res.status(400).json({ error: error.message });
  res.json({ success: true });
});

router.delete("/:id", requireAuth, async (req: any, res) => {
  const { id } = req.params;
  const { error } = await supabase
    .from("enrichment_credentials")
    .delete()
    .eq("id", id)
    .eq("user_id", req.user.id);
  if (error) return res.status(400).json({ error: error.message });
  res.json({ success: true });
});

export default router;

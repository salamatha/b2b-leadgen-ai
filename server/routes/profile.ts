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
    .from("profiles").select("*").eq("user_id", req.user.id).maybeSingle();
  if (error) return res.status(400).json({ error: error.message });
  res.json({ success: true, data });
});

router.post("/", requireAuth, async (req: any, res) => {
  const payload = {
    user_id: req.user.id,
    ...req.body,
    updated_at: new Date().toISOString(),
  };
  const { error } = await supabase.from("profiles").upsert(payload);
  if (error) return res.status(400).json({ error: error.message });
  res.json({ success: true });
});

export default router;

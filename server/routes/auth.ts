// server/routes/auth.ts
import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { supabase } from "../db/supabase.ts";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_change_me";

// helpers
function issueToken(user: { id: string; email: string }) {
  // expires in 7 days
  return jwt.sign({ uid: user.id, email: user.email }, JWT_SECRET, { expiresIn: "7d" });
}

/**
 * POST /auth/signup
 * body: { email, password, full_name? }
 */
router.post("/signup", async (req, res) => {
  try {
    const { email, password, full_name } = req.body as {
      email: string; password: string; full_name?: string;
    };
    if (!email || !password) return res.status(400).json({ error: "email and password required" });

    // check user exists
    const { data: existing } = await supabase
      .from("users").select("id").eq("email", email).maybeSingle();
    if (existing) return res.status(409).json({ error: "User already exists" });

    const password_hash = await bcrypt.hash(password, 10);
    const { data, error } = await supabase
      .from("users")
      .insert([{ email, password_hash, full_name }])
      .select("id,email")
      .maybeSingle();

    if (error || !data) return res.status(400).json({ error: error?.message || "Signup failed" });

    const token = issueToken({ id: data.id, email: data.email });
    return res.json({ token, userId: data.id });
  } catch (e: any) {
    console.error("signup error:", e);
    return res.status(500).json({ error: e.message || "Internal error" });
  }
});

/**
 * POST /auth/login
 * body: { email, password }
 * returns: { token, userId }
 */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body as { email: string; password: string };
    if (!email || !password) return res.status(400).json({ error: "email and password required" });

    const { data: user, error } = await supabase
      .from("users")
      .select("id,email,password_hash")
      .eq("email", email)
      .maybeSingle();

    if (error) return res.status(400).json({ error: error.message });
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: "Invalid credentials" });

    const token = issueToken({ id: user.id, email: user.email });
    return res.json({ token, userId: user.id });
  } catch (e: any) {
    console.error("login error:", e);
    return res.status(500).json({ error: e.message || "Internal error" });
  }
});

export default router;

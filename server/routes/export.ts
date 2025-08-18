// server/routes/export.ts
import express from "express";
import jwt from "jsonwebtoken";
import { supabase } from "../db/supabase.ts";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_change_me";

// Reuse the same simple auth used elsewhere
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

// GET /api/export/leads.csv
// Optional query params:
//   source_type=people|jobs|companies|posts|unknown
//   q=free-text (matches name/title/company/location)
//   from=2025-08-01  (created_at >= from)
//   to=2025-08-17    (created_at <= to)
router.get("/leads.csv", requireAuth, async (req: any, res) => {
  const userId = req.user.id;
  const { source_type, q, from, to } = req.query as {
    source_type?: string;
    q?: string;
    from?: string;
    to?: string;
  };

  // Build query
  let query = supabase.from("leads").select(
    "name, title, company, location, linkedin_url, email, phone, source_type, created_at"
  ).eq("user_id", userId).order("created_at", { ascending: false });

  if (source_type) query = query.eq("source_type", source_type);
  if (from) query = query.gte("created_at", from);
  if (to) query = query.lte("created_at", to);

  // For simple free-text filter, we'll fetch then filter in-memory
  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });

  const rows = Array.isArray(data) ? data : [];
  const filtered = q
    ? rows.filter((r) => {
        const hay = [
          r?.name, r?.title, r?.company, r?.location, r?.linkedin_url, r?.email, r?.phone
        ].join(" ").toLowerCase();
        return hay.includes(String(q).toLowerCase());
      })
    : rows;

  // CSV
  const headers = [
    "name","title","company","location","linkedin_url","email","phone","source_type","created_at"
  ];

  const escapeCell = (val: any) => {
    if (val === null || val === undefined) return "";
    let s = String(val);
    // Normalize newlines and quotes
    s = s.replace(/\r\n/g, "\n").replace(/\r/g, "\n").replace(/"/g, '""');
    // If contains comma, quote or newline, wrap in quotes
    if (/[",\n]/.test(s)) s = `"${s}"`;
    return s;
  };

  const lines = [
    headers.join(","),
    ...filtered.map(r => headers.map(h => escapeCell((r as any)[h])).join(","))
  ];

  const csv = lines.join("\n");

  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", 'attachment; filename="leads.csv"');
  res.send(csv);
});

export default router;

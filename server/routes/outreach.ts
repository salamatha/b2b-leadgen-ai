import express from "express";
import jwt from "jsonwebtoken";
import { supabase } from "../db/supabase.ts";
import nodemailer from "nodemailer";

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

router.post("/send", requireAuth, async (req: any, res) => {
  const userId = req.user.id;
  const { to_email, subject, body, lead_id } = req.body as {
    to_email: string; subject: string; body: string; lead_id?: string;
  };
  if (!to_email || !subject || !body) return res.status(400).json({ error: "Missing fields" });

  const { data: smtp, error } = await supabase
    .from("smtp_credentials").select("*").eq("user_id", userId).maybeSingle();
  if (error) return res.status(400).json({ error: error.message });
  if (!smtp) return res.status(400).json({ error: "SMTP not configured" });

  const transporter = nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.secure,
    auth: { user: smtp.username, pass: smtp.password },
  });

  try {
    await transporter.sendMail({
      from: `${smtp.from_name || "Sales"} <${smtp.from_email}>`,
      to: to_email,
      subject,
      html: body,
    });

    await supabase.from("outreach_messages").insert({
      user_id: userId, lead_id: lead_id || null,
      to_email, subject, body, status: "sent"
    });

    res.json({ success: true });
  } catch (e: any) {
    await supabase.from("outreach_messages").insert({
      user_id: userId, lead_id: lead_id || null,
      to_email, subject, body, status: "failed", error: String(e.message || e)
    });
    res.status(500).json({ error: "Send failed", details: String(e.message || e) });
  }
});

router.post("/bulk", requireAuth, async (req: any, res) => {
  const userId = req.user.id;
  const { lead_ids, subject, html_template } = req.body as {
    lead_ids: string[]; subject: string; html_template: string;
  };
  if (!Array.isArray(lead_ids) || !lead_ids.length) return res.status(400).json({ error: "No leads" });

  const { data: smtp, error } = await supabase
    .from("smtp_credentials").select("*").eq("user_id", userId).maybeSingle();
  if (error || !smtp) return res.status(400).json({ error: error?.message || "SMTP not configured" });

  const { data: leads, error: lerr } = await supabase
    .from("leads").select("id,name,company,email").in("id", lead_ids).eq("user_id", userId);
  if (lerr) return res.status(400).json({ error: lerr.message });

  const transporter = nodemailer.createTransport({
    host: smtp.host, port: smtp.port, secure: smtp.secure,
    auth: { user: smtp.username, pass: smtp.password },
  });

  const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

  let sent = 0, failed = 0;
  for (const lead of leads || []) {
    const to = (lead as any).email;
    if (!to) { failed++; continue; }
    const body = html_template
      .replaceAll("{{name}}", (lead as any).name || "")
      .replaceAll("{{company}}", (lead as any).company || "");

    try {
      await transporter.sendMail({
        from: `${smtp.from_name || "Sales"} <${smtp.from_email}>`,
        to, subject, html: body,
      });
      await supabase.from("outreach_messages").insert({
        user_id: userId, lead_id: (lead as any).id, to_email: to, subject, body, status: "sent",
      });
      sent++;
    } catch (e: any) {
      await supabase.from("outreach_messages").insert({
        user_id: userId, lead_id: (lead as any).id, to_email: to, subject, body, status: "failed", error: String(e.message || e),
      });
      failed++;
    }
    await sleep(2000);
  }

  res.json({ success: true, sent, failed });
});

export default router;

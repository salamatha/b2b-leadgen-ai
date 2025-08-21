// server/index.ts (only the middleware section)
import "dotenv/config";
import express from "express";
import cors from "cors";

import authRoutes from "./routes/auth.ts";
import linkedinRoutes from "./routes/linkedin.ts";
import exportRoutes from "./routes/export.ts";
import smtpRoutes from "./routes/smtp.ts";
import outreachRoutes from "./routes/outreach.ts";
import scheduleRoutes from "./routes/schedules.ts";
import profileRoutes from "./routes/profile.ts";
import enrichmentRoutes from "./routes/enrichment.ts";
import leadHunterRoutes from "./routes/leadHunter.ts";
import leadHunterChatRoutes from "./routes/leadHunterChat.ts";
import leadHunterAIRoutes from "./routes/leadHunterAI.ts";

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());

// Parse JSON (also accept text/plain JSON bodies some clients send)
app.use(express.json({ type: ["application/json", "text/plain"], limit: "1mb" }));
// Parse form bodies just in case a client sends x-www-form-urlencoded
app.use(express.urlencoded({ extended: true }));

// 🔍 Log incoming requests (method, path, content-type, body)
app.use((req, _res, next) => {
  try {
    console.log(
      `[REQ] ${req.method} ${req.originalUrl} :: ${req.headers["content-type"] || ""}\n`,
      // Avoid dumping huge bodies
      typeof req.body === "string" ? req.body.slice(0, 500) : JSON.stringify(req.body).slice(0, 500)
    );
  } catch {}
  // If body came as a raw JSON string, try to parse it
  if (typeof req.body === "string") {
    try { req.body = JSON.parse(req.body); } catch {}
  }
  next();
});

// routes
app.use("/api/auth", authRoutes);
app.use("/api/linkedin", linkedinRoutes);
app.use("/api/export", exportRoutes);
app.use("/api/smtp", smtpRoutes);
app.use("/api/outreach", outreachRoutes);
app.use("/api/schedules", scheduleRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/enrichment", enrichmentRoutes);

// Lead Hunter routes
app.use("/api/lead-hunter", leadHunterRoutes);
app.use("/api/lead-hunter", leadHunterChatRoutes);
app.use("/api/lead-hunter", leadHunterAIRoutes);

app.get("/api/health", (_req, res) => res.json({ ok: true }));
app.get("/", (_req, res) => res.send("Server up"));

app.listen(PORT, () => console.log(`🚀 Backend running at http://localhost:${PORT}`));

// server/index.ts
import "dotenv/config";
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";

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
import { startScheduler } from "./scheduler.ts";

const app = express();
const PORT = Number(process.env.PORT) || 4000;

app.use(
  cors({
    origin: process.env.CORS_ORIGIN?.split(",").map(s => s.trim()) || "*",
    credentials: true,
  })
);
app.use(bodyParser.json({ limit: "2mb" }));
app.use(express.json({ limit: "2mb" }));

// Health + root
app.get("/api/health", (_req, res) => res.json({ ok: true }));
app.get("/", (_req, res) => res.send("Server up"));

// ROUTES (note: no duplicate mounts)
app.use("/api/auth", authRoutes);
app.use("/api/linkedin", linkedinRoutes);
app.use("/api/export", exportRoutes);
app.use("/api/smtp", smtpRoutes);
app.use("/api/outreach", outreachRoutes);
app.use("/api/schedules", scheduleRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/enrichment", enrichmentRoutes);

// Lead Hunter family
app.use("/api/lead-hunter", leadHunterRoutes);
app.use("/api/lead-hunter", leadHunterChatRoutes);
app.use("/api/lead-hunter", leadHunterAIRoutes);

// Simple request logger (helps confirm the exact path/method)
app.use((req, _res, next) => {
  if (req.path.startsWith("/api/")) {
    console.log("API HIT:", req.method, req.path);
  }
  next();
});

// 404 for API
app.use((req, res, next) => {
  if (req.path.startsWith("/api/")) return res.status(404).json({ ok: false, error: "Not Found" });
  next();
});

// Error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ ok: false, error: err?.message || "Internal Server Error" });
});

const server = app.listen(PORT, () => {
  console.log(`🚀 Backend running at http://localhost:${PORT}`);
  try { startScheduler(); } catch (e) { console.error("Scheduler start failed:", e); }
});

process.on("SIGINT", () => {
  console.log("Shutting down…");
  server.close(() => process.exit(0));
});

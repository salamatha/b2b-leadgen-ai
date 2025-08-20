import "dotenv/config";
import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import authRoutes from "./routes/auth.ts";
import linkedinRoutes from "./routes/linkedin.ts";
import exportRoutes from "./routes/export.ts";
import smtpRoutes from "./routes/smtp.ts";
import outreachRoutes from "./routes/outreach.ts";
import scheduleRoutes from "./routes/schedules.ts";
import { startScheduler } from "./scheduler.ts";
import profileRoutes from "./routes/profile.ts";
import enrichmentRoutes from "./routes/enrichment.ts";
import leadHunterRoutes from "./routes/leadHunter.ts";
import leadHunterChatRoutes from "./routes/leadHunterChat.ts";
import leadHunterAIRoutes from "./routes/leadHunterAI.ts";

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/linkedin", linkedinRoutes);
app.use("/api/export", exportRoutes);
app.use("/api/smtp", smtpRoutes);
app.use("/api/lead-hunter", leadHunterRoutes);

app.use("/api/smtp", smtpRoutes);
app.use("/api/outreach", outreachRoutes);
app.use("/api/schedules", scheduleRoutes);

app.use("/api/profile", profileRoutes);
app.use("/api/enrichment", enrichmentRoutes);

app.use("/api/lead-hunter", leadHunterChatRoutes);
app.use("/api/lead-hunter", leadHunterAIRoutes);

app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.get("/", (_req, res) => res.send("Server up"));

app.listen(PORT, () => {
  console.log(`🚀 Backend running at http://localhost:${PORT}`);

  // ⬇️ ADD THIS
  startScheduler();
});


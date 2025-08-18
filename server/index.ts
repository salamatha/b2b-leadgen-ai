import "dotenv/config";
import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import authRoutes from "./routes/auth.ts";
import linkedinRoutes from "./routes/linkedin.ts";
import exportRoutes from "./routes/export.ts";
import smtpRoutes from "./routes/smtp.ts";
import agentsRoutes from "./routes/agents.ts";
import outreachRoutes from "./routes/outreach.ts";
import scheduleRoutes from "./routes/schedules.ts";
import { startScheduler } from "./scheduler.ts";
import profileRoutes from "./routes/profile.ts";
import enrichmentRoutes from "./routes/enrichment.ts";


const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(bodyParser.json());

app.use("/api/auth", authRoutes);
app.use("/api/linkedin", linkedinRoutes);
app.use("/api/export", exportRoutes);
app.use("/api/smtp", smtpRoutes);
app.use("/api/agents", agentsRoutes);

app.use("/api/smtp", smtpRoutes);
app.use("/api/outreach", outreachRoutes);
app.use("/api/schedules", scheduleRoutes);

app.use("/api/profile", profileRoutes);
app.use("/api/enrichment", enrichmentRoutes);

app.get("/", (_req, res) => res.send("Server up"));
app.listen(PORT, () => {
  console.log(`🚀 Backend running at http://localhost:${PORT}`);

  // ⬇️ ADD THIS
  startScheduler();
});


// server/routes/leadHunterAI.ts
import { Router } from "express";
import { previewSearch } from "../../worker/src/scrapers/linkedin.ts";
import { prisma } from "../../db/prisma.ts";
import {
  buildLinkedInCompanySearchURL,
  buildLinkedInPeopleSearchURL,
} from "../../worker/src/ai/searchPlan.ts";

const router = Router();

/** POST /api/lead-hunter/preview */
router.post("/preview", async (req, res) => {
  const { userId, mode, filtersOrQuery } = req.body || {};
  if (!userId || !mode) return res.status(400).json({ ok: false, error: "userId and mode required" });

  let urlOrQuery = filtersOrQuery;
  if (typeof filtersOrQuery === "object") {
    urlOrQuery =
      mode === "companies"
        ? buildLinkedInCompanySearchURL(filtersOrQuery)
        : buildLinkedInPeopleSearchURL(filtersOrQuery);
  }

  const preview = await previewSearch(userId, urlOrQuery, mode);
  return res.json({ ok: true, preview, url: preview.finalUrl });
});

/** POST /api/lead-hunter/confirm */
router.post("/confirm", async (req, res) => {
  const { userId, mode, url, params } = req.body || {};
  if (!userId || !mode || !url) return res.status(400).json({ ok: false, error: "userId, mode, url required" });

  const run = await prisma.runs.create({
    data: {
      user_id: userId,
      type: "lead_hunt",
      status: "running",
      query: String(params?.query || ""),
      params_json: { mode, url, params },
    },
  });

  import("../../worker/src/hunter/chainHunter.ts").then(({ huntCompaniesPeopleProfiles }) => {
    huntCompaniesPeopleProfiles({ userId, query: url, vertical: mode as any, debug: false })
      .then(async () => {
        await prisma.runs.update({ where: { id: run.id }, data: { status: "succeeded" } });
      })
      .catch(async (e) => {
        await prisma.runs.update({
          where: { id: run.id },
          data: { status: "failed", error_json: { message: e.message } },
        });
      });
  });

  return res.json({ ok: true, runId: run.id });
});

export default router;

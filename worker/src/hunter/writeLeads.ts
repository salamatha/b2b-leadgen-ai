// worker/src/hunter/writeLeads.ts
import { prisma } from "../../../db/prisma.ts";

export type CompanyLead = {
  name: string;
  linkedin_url: string;
  website?: string;
  location?: string;
  size_min?: number;
  size_max?: number;
};
export type PersonLead = {
  name: string;
  title?: string;
  company?: string;
  linkedin_url: string;
  location?: string;
};

export async function upsertCompanyLeads(userId: string, runId: number, rows: CompanyLead[]) {
  for (const r of rows) {
    await prisma.leads
      .upsert({
        where: { linkedin_url: r.linkedin_url },
        create: { user_id: userId, type: "company", source_run_id: runId, ...r },
        update: { ...r, updated_at: new Date() },
      })
      .catch(() => {});
  }
}

export async function upsertPersonLeads(userId: string, runId: number, rows: PersonLead[]) {
  for (const r of rows) {
    await prisma.leads
      .upsert({
        where: { linkedin_url: r.linkedin_url },
        create: { user_id: userId, type: "person", source_run_id: runId, ...r },
        update: { ...r, updated_at: new Date() },
      })
      .catch(() => {});
  }
}

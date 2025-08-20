// worker/src/tests/inspectSession.ts
import { PrismaClient } from "@prisma/client";
import { withLinkedIn } from "../utils/withLinkedIn.ts";

const prisma = new PrismaClient();

async function main() {
  const USER_ID = "6a3c049c-0310-444f-95fa-cbdc8f44a2f9";
  await withLinkedIn(
    USER_ID,
    async (page) => {
      console.log("Final URL:", page.url());
      if (/login|checkpoint/i.test(page.url())) {
        throw new Error("Session invalid after normalization");
      }
      console.log("✅ LinkedIn session restored and valid");
    },
    { debug: true }
  );
}

main().catch((e) => {
  console.error("❌ Ping failed:", e.message);
  process.exit(1);
});
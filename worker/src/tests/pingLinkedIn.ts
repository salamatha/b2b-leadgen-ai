// worker/src/tests/pingLinkedIn.ts
import { withLinkedIn } from "../utils/withLinkedIn.ts";

async function main() {
  const USER_ID = "<PUT-AN-EXISTING-UUID-HERE>";

  await withLinkedIn(
    USER_ID,
    async (page) => {
      await page.goto("https://www.linkedin.com/feed/", { waitUntil: "domcontentloaded" });
      const url = page.url();
      console.log("Final URL:", url);
      if (/login|checkpoint/i.test(url)) throw new Error("Session invalid: redirected");
      console.log("✅ LinkedIn session restored from DB and valid");
    },
    { debug: true }
  );
}

main().catch((e) => {
  console.error("❌ Ping failed:", e.message);
  process.exit(1);
});

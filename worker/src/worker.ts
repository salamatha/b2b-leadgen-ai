
/**
 * Minimal Playwright worker stub.
 * - Polls Supabase enrichment_jobs table (not implemented in this stub)
 * - Visits URLs and extracts simple text content
 * - Calls OpenAI to parse HTML (placeholder)
 *
 * Replace connection details with your SUPABASE keys and implement polling logic.
 */

import { chromium } from 'playwright';
import fetch from 'node-fetch';

async function scrapeUrl(url: string) {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    const content = await page.content();
    await browser.close();
    return content;
  } catch (err) {
    await browser.close();
    throw err;
  }
}

// Demo run: scrape example.com if invoked directly
if (require.main === module) {
  (async () => {
    const testUrl = 'https://example.com';
    console.log('Scraping', testUrl);
    const html = await scrapeUrl(testUrl);
    console.log('Scraped length:', html.length);
    // In production: send html to OpenAI for parsing, then save results to Supabase
  })().catch(err => {
    console.error(err);
    process.exit(1);
  });
}

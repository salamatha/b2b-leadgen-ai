
import type { NextApiRequest, NextApiResponse } from 'next'

// Minimal stub for /api/chat -- in prod, replace with OpenAI + Supabase logic.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()
  const { text } = req.body
  // Return a mocked list of search URLs for demo
  const urls = [
    `https://www.google.com/search?q=${encodeURIComponent(text + ' site:linkedin.com')}`,
    `https://www.bing.com/search?q=${encodeURIComponent(text + ' site:linkedin.com')}`
  ]
  res.status(200).json({ ok:true, search_urls: urls })
}

import express from "express";
import { Parser } from "json2csv";
const router = express.Router();

router.get("/leads.csv", (_req, res) => {
  const leads = [
    { name: "Alice Example", title: "CTO", company: "Acme Inc." },
    { name: "Bob Sample", title: "CEO", company: "Beta LLC" }
  ];
  const parser = new Parser();
  const csv = parser.parse(leads);
  res.header("Content-Type", "text/csv");
  res.attachment("leads.csv");
  res.send(csv);
});

export default router;

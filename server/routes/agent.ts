import { Router } from "express";
import { supabase } from "../db/supabase";

const router = Router();

// Create Agent
router.post("/create", async (req, res) => {
  try {
    const { userId, type, query } = req.body;
    const { data, error } = await supabase.from("agents").insert([{ user_id: userId, type, query }]).select();
    if (error) throw error;
    res.json({ success: true, agent: data[0] });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// List Agents
router.get("/list/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { data, error } = await supabase.from("agents").select("*").eq("user_id", userId);
    if (error) throw error;
    res.json({ success: true, agents: data });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;

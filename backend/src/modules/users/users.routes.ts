import { Router } from "express";
import { requireAuth } from "../../middleware/auth";

export const usersRoutes = Router();

usersRoutes.get("/me", requireAuth, (req, res) => {
  res.json({ ok: true, user: req.user });
});

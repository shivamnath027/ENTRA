import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import { UsersController } from "./users.controller";

export const usersRoutes = Router();

usersRoutes.get("/me", requireAuth, UsersController.me);
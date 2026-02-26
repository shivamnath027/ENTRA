import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import { validateBody } from "../../middleware/validate";
import { NotificationsController } from "./notifications.controller";
import { markReadSchema } from "./notifications.schemas";

export const notificationsRoutes = Router();

notificationsRoutes.get("/", requireAuth, NotificationsController.list);
notificationsRoutes.post("/read", requireAuth, validateBody(markReadSchema), NotificationsController.markRead);
notificationsRoutes.post("/read-all", requireAuth, NotificationsController.markAllRead);

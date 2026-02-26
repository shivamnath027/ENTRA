import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import { requireRoles } from "../../middleware/rbac";
import { validateBody } from "../../middleware/validate";
import { NoticesController } from "./notices.controller";
import { createNoticeSchema, updateNoticeSchema } from "./notices.schemas";

export const noticesRoutes = Router();

noticesRoutes.get("/", requireAuth, NoticesController.list);

noticesRoutes.post(
  "/",
  requireAuth,
  requireRoles("ADMIN"),
  validateBody(createNoticeSchema),
  NoticesController.create
);

noticesRoutes.patch(
  "/:id",
  requireAuth,
  requireRoles("ADMIN"),
  validateBody(updateNoticeSchema),
  NoticesController.update
);

noticesRoutes.delete(
  "/:id",
  requireAuth,
  requireRoles("ADMIN"),
  NoticesController.remove
);

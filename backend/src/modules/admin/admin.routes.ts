import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import { requireRoles } from "../../middleware/rbac";
import { validateBody } from "../../middleware/validate";
import { AdminController } from "./admin.controller";
import { createUserSchema, updateUserSchema, createBlockSchema, createFlatSchema } from "./admin.schemas";

export const adminRoutes = Router();

adminRoutes.get("/kpis", requireAuth, requireRoles("ADMIN"), AdminController.kpis);

adminRoutes.get("/users", requireAuth, requireRoles("ADMIN"), AdminController.listUsers);
adminRoutes.post("/users", requireAuth, requireRoles("ADMIN"), validateBody(createUserSchema), AdminController.createUser);
adminRoutes.patch("/users/:id", requireAuth, requireRoles("ADMIN"), validateBody(updateUserSchema), AdminController.updateUser);

adminRoutes.get("/blocks", requireAuth, requireRoles("ADMIN"), AdminController.listBlocks);
adminRoutes.post("/blocks", requireAuth, requireRoles("ADMIN"), validateBody(createBlockSchema), AdminController.createBlock);

adminRoutes.get("/flats", requireAuth, requireRoles("ADMIN"), AdminController.listFlats);
adminRoutes.post("/flats", requireAuth, requireRoles("ADMIN"), validateBody(createFlatSchema), AdminController.createFlat);

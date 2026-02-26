import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import { requireRoles } from "../../middleware/rbac";
import { validateBody } from "../../middleware/validate";
import { VisitorsController } from "./visitors.controller";
import {
  createVisitorRequestSchema,
  requestDecisionSchema,
  gateCreateEntrySchema,
  markInSchema,
  markOutSchema
} from "./visitors.schemas";

export const visitorsRoutes = Router();

// Resident endpoints
visitorsRoutes.post(
  "/requests",
  requireAuth,
  requireRoles("RESIDENT"),
  validateBody(createVisitorRequestSchema),
  VisitorsController.createRequest
);

visitorsRoutes.get(
  "/requests",
  requireAuth,
  requireRoles("RESIDENT"),
  VisitorsController.listResidentRequests
);

visitorsRoutes.post(
  "/requests/:id/decision",
  requireAuth,
  requireRoles("RESIDENT", "ADMIN"),
  validateBody(requestDecisionSchema),
  VisitorsController.decideOnRequest
);

// Guard/Admin endpoints
visitorsRoutes.get(
  "/gate/requests",
  requireAuth,
  requireRoles("GUARD", "ADMIN"),
  VisitorsController.listSocietyRequests
);

visitorsRoutes.post(
  "/gate/entries",
  requireAuth,
  requireRoles("GUARD"),
  validateBody(gateCreateEntrySchema),
  VisitorsController.createGateEntry
);

visitorsRoutes.post(
  "/gate/entries/:entryId/in",
  requireAuth,
  requireRoles("GUARD"),
  validateBody(markInSchema),
  VisitorsController.markIn
);

visitorsRoutes.post(
  "/gate/entries/:entryId/out",
  requireAuth,
  requireRoles("GUARD"),
  validateBody(markOutSchema),
  VisitorsController.markOut
);

visitorsRoutes.get(
  "/gate/entries",
  requireAuth,
  requireRoles("GUARD", "ADMIN", "RESIDENT"),
  VisitorsController.listEntries
);

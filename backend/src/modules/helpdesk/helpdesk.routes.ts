import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import { requireRoles } from "../../middleware/rbac";
import { validateBody } from "../../middleware/validate";
import { HelpdeskController } from "./helpdesk.controller";
import { createTicketSchema, addCommentSchema, assignTicketSchema, updateStatusSchema } from "./helpdesk.schemas";

export const helpdeskRoutes = Router();

// Resident
helpdeskRoutes.post(
  "/tickets",
  requireAuth,
  requireRoles("RESIDENT"),
  validateBody(createTicketSchema),
  HelpdeskController.createTicket
);

helpdeskRoutes.get(
  "/tickets",
  requireAuth,
  requireRoles("RESIDENT"),
  HelpdeskController.listResidentTickets
);

helpdeskRoutes.post(
  "/tickets/:id/comments",
  requireAuth,
  requireRoles("RESIDENT", "ADMIN"),
  validateBody(addCommentSchema),
  HelpdeskController.addComment
);

helpdeskRoutes.get(
  "/tickets/:id/comments",
  requireAuth,
  requireRoles("RESIDENT", "ADMIN"),
  HelpdeskController.listComments
);

// Admin
helpdeskRoutes.get(
  "/admin/tickets",
  requireAuth,
  requireRoles("ADMIN"),
  HelpdeskController.adminListTickets
);

helpdeskRoutes.post(
  "/admin/tickets/:id/assign",
  requireAuth,
  requireRoles("ADMIN"),
  validateBody(assignTicketSchema),
  HelpdeskController.assignTicket
);

helpdeskRoutes.post(
  "/admin/tickets/:id/status",
  requireAuth,
  requireRoles("ADMIN"),
  validateBody(updateStatusSchema),
  HelpdeskController.updateStatus
);

helpdeskRoutes.get(
  "/admin/summary",
  requireAuth,
  requireRoles("ADMIN"),
  HelpdeskController.summary
);

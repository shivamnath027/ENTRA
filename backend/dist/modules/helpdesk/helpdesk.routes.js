"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.helpdeskRoutes = void 0;
const express_1 = require("express");
const auth_1 = require("../../middleware/auth");
const rbac_1 = require("../../middleware/rbac");
const validate_1 = require("../../middleware/validate");
const helpdesk_controller_1 = require("./helpdesk.controller");
const helpdesk_schemas_1 = require("./helpdesk.schemas");
exports.helpdeskRoutes = (0, express_1.Router)();
// Resident
exports.helpdeskRoutes.post("/tickets", auth_1.requireAuth, (0, rbac_1.requireRoles)("RESIDENT"), (0, validate_1.validateBody)(helpdesk_schemas_1.createTicketSchema), helpdesk_controller_1.HelpdeskController.createTicket);
exports.helpdeskRoutes.get("/tickets", auth_1.requireAuth, (0, rbac_1.requireRoles)("RESIDENT"), helpdesk_controller_1.HelpdeskController.listResidentTickets);
exports.helpdeskRoutes.post("/tickets/:id/comments", auth_1.requireAuth, (0, rbac_1.requireRoles)("RESIDENT", "ADMIN"), (0, validate_1.validateBody)(helpdesk_schemas_1.addCommentSchema), helpdesk_controller_1.HelpdeskController.addComment);
exports.helpdeskRoutes.get("/tickets/:id/comments", auth_1.requireAuth, (0, rbac_1.requireRoles)("RESIDENT", "ADMIN"), helpdesk_controller_1.HelpdeskController.listComments);
// Admin
exports.helpdeskRoutes.get("/admin/tickets", auth_1.requireAuth, (0, rbac_1.requireRoles)("ADMIN"), helpdesk_controller_1.HelpdeskController.adminListTickets);
exports.helpdeskRoutes.post("/admin/tickets/:id/assign", auth_1.requireAuth, (0, rbac_1.requireRoles)("ADMIN"), (0, validate_1.validateBody)(helpdesk_schemas_1.assignTicketSchema), helpdesk_controller_1.HelpdeskController.assignTicket);
exports.helpdeskRoutes.post("/admin/tickets/:id/status", auth_1.requireAuth, (0, rbac_1.requireRoles)("ADMIN"), (0, validate_1.validateBody)(helpdesk_schemas_1.updateStatusSchema), helpdesk_controller_1.HelpdeskController.updateStatus);
exports.helpdeskRoutes.get("/admin/summary", auth_1.requireAuth, (0, rbac_1.requireRoles)("ADMIN"), helpdesk_controller_1.HelpdeskController.summary);

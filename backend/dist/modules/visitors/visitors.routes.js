"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.visitorsRoutes = void 0;
const express_1 = require("express");
const auth_1 = require("../../middleware/auth");
const rbac_1 = require("../../middleware/rbac");
const validate_1 = require("../../middleware/validate");
const visitors_controller_1 = require("./visitors.controller");
const visitors_schemas_1 = require("./visitors.schemas");
exports.visitorsRoutes = (0, express_1.Router)();
// Resident endpoints
exports.visitorsRoutes.post("/requests", auth_1.requireAuth, (0, rbac_1.requireRoles)("RESIDENT"), (0, validate_1.validateBody)(visitors_schemas_1.createVisitorRequestSchema), visitors_controller_1.VisitorsController.createRequest);
exports.visitorsRoutes.get("/requests", auth_1.requireAuth, (0, rbac_1.requireRoles)("RESIDENT"), visitors_controller_1.VisitorsController.listResidentRequests);
exports.visitorsRoutes.post("/requests/:id/decision", auth_1.requireAuth, (0, rbac_1.requireRoles)("RESIDENT", "ADMIN"), (0, validate_1.validateBody)(visitors_schemas_1.requestDecisionSchema), visitors_controller_1.VisitorsController.decideOnRequest);
// Guard/Admin endpoints
exports.visitorsRoutes.get("/gate/requests", auth_1.requireAuth, (0, rbac_1.requireRoles)("GUARD", "ADMIN"), visitors_controller_1.VisitorsController.listSocietyRequests);
exports.visitorsRoutes.post("/gate/entries", auth_1.requireAuth, (0, rbac_1.requireRoles)("GUARD"), (0, validate_1.validateBody)(visitors_schemas_1.gateCreateEntrySchema), visitors_controller_1.VisitorsController.createGateEntry);
exports.visitorsRoutes.post("/gate/entries/:entryId/in", auth_1.requireAuth, (0, rbac_1.requireRoles)("GUARD"), (0, validate_1.validateBody)(visitors_schemas_1.markInSchema), visitors_controller_1.VisitorsController.markIn);
exports.visitorsRoutes.post("/gate/entries/:entryId/out", auth_1.requireAuth, (0, rbac_1.requireRoles)("GUARD"), (0, validate_1.validateBody)(visitors_schemas_1.markOutSchema), visitors_controller_1.VisitorsController.markOut);
exports.visitorsRoutes.get("/gate/entries", auth_1.requireAuth, (0, rbac_1.requireRoles)("GUARD", "ADMIN", "RESIDENT"), visitors_controller_1.VisitorsController.listEntries);

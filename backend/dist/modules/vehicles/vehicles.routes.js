"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.vehiclesRoutes = void 0;
const express_1 = require("express");
const auth_1 = require("../../middleware/auth");
const rbac_1 = require("../../middleware/rbac");
const validate_1 = require("../../middleware/validate");
const vehicles_controller_1 = require("./vehicles.controller");
const vehicles_schemas_1 = require("./vehicles.schemas");
exports.vehiclesRoutes = (0, express_1.Router)();
// Vehicle registration
exports.vehiclesRoutes.post("/", auth_1.requireAuth, (0, rbac_1.requireRoles)("RESIDENT", "ADMIN"), (0, validate_1.validateBody)(vehicles_schemas_1.createVehicleSchema), vehicles_controller_1.VehiclesController.create);
// Vehicle list
exports.vehiclesRoutes.get("/", auth_1.requireAuth, (0, rbac_1.requireRoles)("RESIDENT", "ADMIN"), vehicles_controller_1.VehiclesController.list);
// Update vehicle
exports.vehiclesRoutes.patch("/:id", auth_1.requireAuth, (0, rbac_1.requireRoles)("RESIDENT", "ADMIN"), (0, validate_1.validateBody)(vehicles_schemas_1.updateVehicleSchema), vehicles_controller_1.VehiclesController.update);
// Guard scan
exports.vehiclesRoutes.post("/scan", auth_1.requireAuth, (0, rbac_1.requireRoles)("GUARD"), (0, validate_1.validateBody)(vehicles_schemas_1.scanVehicleSchema), vehicles_controller_1.VehiclesController.scan);

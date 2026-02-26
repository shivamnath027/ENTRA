import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import { requireRoles } from "../../middleware/rbac";
import { validateBody } from "../../middleware/validate";
import { VehiclesController } from "./vehicles.controller";
import { createVehicleSchema, updateVehicleSchema, scanVehicleSchema } from "./vehicles.schemas";

export const vehiclesRoutes = Router();

// Vehicle registration
vehiclesRoutes.post(
  "/",
  requireAuth,
  requireRoles("RESIDENT", "ADMIN"),
  validateBody(createVehicleSchema),
  VehiclesController.create
);

// Vehicle list
vehiclesRoutes.get(
  "/",
  requireAuth,
  requireRoles("RESIDENT", "ADMIN"),
  VehiclesController.list
);

// Update vehicle
vehiclesRoutes.patch(
  "/:id",
  requireAuth,
  requireRoles("RESIDENT", "ADMIN"),
  validateBody(updateVehicleSchema),
  VehiclesController.update
);

// Guard scan
vehiclesRoutes.post(
  "/scan",
  requireAuth,
  requireRoles("GUARD"),
  validateBody(scanVehicleSchema),
  VehiclesController.scan
);

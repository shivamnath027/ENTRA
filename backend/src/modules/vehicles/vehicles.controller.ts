import { Request, Response, NextFunction } from "express";
import { VehiclesService } from "./vehicles.service";

export class VehiclesController {
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const out = await VehiclesService.createVehicle({
        societyId: req.user!.societyId,
        userId: req.user!.id,
        role: req.user!.role,
        body: req.body
      });
      res.json({ ok: true, vehicle: out });
    } catch (e) { next(e); }
  }

  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const flatId = req.query.flatId ? String(req.query.flatId) : null;
      const limit = Number(req.query.limit ?? 50);
      const offset = Number(req.query.offset ?? 0);

      const out = await VehiclesService.listVehicles({
        societyId: req.user!.societyId,
        userId: req.user!.id,
        role: req.user!.role,
        flatId,
        limit,
        offset
      });
      res.json({ ok: true, items: out });
    } catch (e) { next(e); }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const out = await VehiclesService.updateVehicle({
        societyId: req.user!.societyId,
        userId: req.user!.id,
        role: req.user!.role,
        vehicleId: req.params.id,
        patch: req.body
      });
      res.json({ ok: true, vehicle: out });
    } catch (e) { next(e); }
  }

  static async scan(req: Request, res: Response, next: NextFunction) {
    try {
      const out = await VehiclesService.scanVehicle({
        societyId: req.user!.societyId,
        userId: req.user!.id,
        role: req.user!.role,
        body: req.body
      });
      res.json({ ok: true, ...out });
    } catch (e) { next(e); }
  }
}

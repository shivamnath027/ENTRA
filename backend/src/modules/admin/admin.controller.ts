import { Request, Response, NextFunction } from "express";
import { AdminService } from "./admin.service";

export class AdminController {
  static async kpis(req: Request, res: Response, next: NextFunction) {
    try {
      const out = await AdminService.kpis({ societyId: req.user!.societyId, role: req.user!.role });
      res.json({ ok: true, ...out });
    } catch (e) { next(e); }
  }

  static async listUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const items = await AdminService.listUsers({ societyId: req.user!.societyId, role: req.user!.role, query: req.query });
      res.json({ ok: true, items });
    } catch (e) { next(e); }
  }

  static async createUser(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await AdminService.createUser({ societyId: req.user!.societyId, role: req.user!.role, body: req.body });
      res.json({ ok: true, user });
    } catch (e) { next(e); }
  }

  static async updateUser(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await AdminService.updateUser({
        societyId: req.user!.societyId,
        role: req.user!.role,
        userId: req.params.id,
        patch: req.body
      });
      res.json({ ok: true, user });
    } catch (e) { next(e); }
  }

  static async listBlocks(req: Request, res: Response, next: NextFunction) {
    try {
      const items = await AdminService.listBlocks({ societyId: req.user!.societyId, role: req.user!.role });
      res.json({ ok: true, items });
    } catch (e) { next(e); }
  }

  static async createBlock(req: Request, res: Response, next: NextFunction) {
    try {
      const block = await AdminService.createBlock({ societyId: req.user!.societyId, role: req.user!.role, name: req.body.name });
      res.json({ ok: true, block });
    } catch (e) { next(e); }
  }

  static async listFlats(req: Request, res: Response, next: NextFunction) {
    try {
      const blockId = req.query.blockId ? String(req.query.blockId) : null;
      const items = await AdminService.listFlats({ societyId: req.user!.societyId, role: req.user!.role, blockId });
      res.json({ ok: true, items });
    } catch (e) { next(e); }
  }

  static async createFlat(req: Request, res: Response, next: NextFunction) {
    try {
      const flat = await AdminService.createFlat({ societyId: req.user!.societyId, role: req.user!.role, body: req.body });
      res.json({ ok: true, flat });
    } catch (e) { next(e); }
  }
}

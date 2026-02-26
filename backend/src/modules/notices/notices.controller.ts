import { Request, Response, NextFunction } from "express";
import { NoticesService } from "./notices.service";

export class NoticesController {
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const notice = await NoticesService.create({
        societyId: req.user!.societyId,
        userId: req.user!.id,
        role: req.user!.role,
        body: req.body
      });
      res.json({ ok: true, notice });
    } catch (e) { next(e); }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const notice = await NoticesService.update({
        societyId: req.user!.societyId,
        role: req.user!.role,
        noticeId: req.params.id,
        patch: req.body
      });
      res.json({ ok: true, notice });
    } catch (e) { next(e); }
  }

  static async remove(req: Request, res: Response, next: NextFunction) {
    try {
      const out = await NoticesService.delete({
        societyId: req.user!.societyId,
        role: req.user!.role,
        noticeId: req.params.id
      });
      res.json(out);
    } catch (e) { next(e); }
  }

  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const limit = Number(req.query.limit ?? 50);
      const offset = Number(req.query.offset ?? 0);
      const items = await NoticesService.list({ societyId: req.user!.societyId, limit, offset });
      res.json({ ok: true, items });
    } catch (e) { next(e); }
  }
}

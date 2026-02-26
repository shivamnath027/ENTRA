import { Request, Response, NextFunction } from "express";
import { NotificationsService } from "./notifications.service";

export class NotificationsController {
  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const limit = Number(req.query.limit ?? 50);
      const offset = Number(req.query.offset ?? 0);
      const unreadOnly = String(req.query.unreadOnly ?? "false") === "true";

      const items = await NotificationsService.list({
        userId: req.user!.id,
        limit,
        offset,
        unreadOnly
      });
      res.json({ ok: true, items });
    } catch (e) {
      next(e);
    }
  }

  static async markRead(req: Request, res: Response, next: NextFunction) {
    try {
      const out = await NotificationsService.markRead({
        userId: req.user!.id,
        notificationId: req.body.notificationId
      });
      res.json({ ok: true, ...out });
    } catch (e) {
      next(e);
    }
  }

  static async markAllRead(req: Request, res: Response, next: NextFunction) {
    try {
      const out = await NotificationsService.markAllRead(req.user!.id);
      res.json({ ok: true, ...out });
    } catch (e) {
      next(e);
    }
  }
}

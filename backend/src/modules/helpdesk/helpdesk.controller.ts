import { Request, Response, NextFunction } from "express";
import { HelpdeskService } from "./helpdesk.service";

export class HelpdeskController {
  // Resident
  static async createTicket(req: Request, res: Response, next: NextFunction) {
    try {
      const ticket = await HelpdeskService.createTicket({
        societyId: req.user!.societyId,
        userId: req.user!.id,
        role: req.user!.role,
        body: req.body
      });
      res.json({ ok: true, ticket });
    } catch (e) { next(e); }
  }

  static async listResidentTickets(req: Request, res: Response, next: NextFunction) {
    try {
      const flatId = String(req.query.flatId ?? "");
      const status = req.query.status ? String(req.query.status) : null;
      const limit = Number(req.query.limit ?? 50);
      const offset = Number(req.query.offset ?? 0);

      const items = await HelpdeskService.listResidentTickets({
        societyId: req.user!.societyId,
        userId: req.user!.id,
        role: req.user!.role,
        flatId,
        status,
        limit,
        offset
      });
      res.json({ ok: true, items });
    } catch (e) { next(e); }
  }

  static async addComment(req: Request, res: Response, next: NextFunction) {
    try {
      const c = await HelpdeskService.addComment({
        societyId: req.user!.societyId,
        userId: req.user!.id,
        role: req.user!.role,
        ticketId: req.params.id,
        message: req.body.message
      });
      res.json({ ok: true, comment: c });
    } catch (e) { next(e); }
  }

  static async listComments(req: Request, res: Response, next: NextFunction) {
    try {
      const limit = Number(req.query.limit ?? 200);
      const items = await HelpdeskService.listComments({
        societyId: req.user!.societyId,
        userId: req.user!.id,
        role: req.user!.role,
        ticketId: req.params.id,
        limit
      });
      res.json({ ok: true, items });
    } catch (e) { next(e); }
  }

  // Admin
  static async adminListTickets(req: Request, res: Response, next: NextFunction) {
    try {
      const status = req.query.status ? String(req.query.status) : null;
      const priority = req.query.priority ? String(req.query.priority) : null;
      const type = req.query.type ? String(req.query.type) : null;
      const overdue = req.query.overdue ? String(req.query.overdue) === "true" : null;
      const limit = Number(req.query.limit ?? 50);
      const offset = Number(req.query.offset ?? 0);

      const items = await HelpdeskService.adminListTickets({
        societyId: req.user!.societyId,
        role: req.user!.role,
        status,
        priority,
        type,
        overdue,
        limit,
        offset
      });
      res.json({ ok: true, items });
    } catch (e) { next(e); }
  }

  static async assignTicket(req: Request, res: Response, next: NextFunction) {
    try {
      const out = await HelpdeskService.assignTicket({
        societyId: req.user!.societyId,
        role: req.user!.role,
        ticketId: req.params.id,
        assignedToUserId: req.body.assignedToUserId
      });
      res.json({ ok: true, ...out });
    } catch (e) { next(e); }
  }

  static async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const out = await HelpdeskService.updateStatus({
        societyId: req.user!.societyId,
        role: req.user!.role,
        ticketId: req.params.id,
        status: req.body.status
      });
      res.json({ ok: true, ...out });
    } catch (e) { next(e); }
  }

  static async summary(req: Request, res: Response, next: NextFunction) {
    try {
      const out = await HelpdeskService.summary({
        societyId: req.user!.societyId,
        role: req.user!.role
      });
      res.json({ ok: true, ...out });
    } catch (e) { next(e); }
  }
}

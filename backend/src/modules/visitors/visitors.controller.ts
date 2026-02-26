import { Request, Response, NextFunction } from "express";
import { VisitorsService } from "./visitors.service";
import { VisitorsRepository } from "./visitors.repository";

export class VisitorsController {
  // Resident
  static async createRequest(req: Request, res: Response, next: NextFunction) {
    try {
      const out = await VisitorsService.createVisitorRequest({
        societyId: req.user!.societyId,
        userId: req.user!.id,
        role: req.user!.role,
        body: req.body
      });
      res.json({ ok: true, request: out });
    } catch (e) {
      next(e);
    }
  }

  static async listResidentRequests(req: Request, res: Response, next: NextFunction) {
    try {
      const flatId = String(req.query.flatId ?? "");
      const limit = Number(req.query.limit ?? 50);
      const offset = Number(req.query.offset ?? 0);

      const out = await VisitorsService.listResidentRequests({
        societyId: req.user!.societyId,
        userId: req.user!.id,
        role: req.user!.role,
        flatId,
        limit,
        offset
      });
      res.json({ ok: true, items: out });
    } catch (e) {
      next(e);
    }
  }

  static async decideOnRequest(req: Request, res: Response, next: NextFunction) {
    try {
      const out = await VisitorsService.decideOnRequest({
        societyId: req.user!.societyId,
        userId: req.user!.id,
        role: req.user!.role,
        requestId: req.params.id,
        decision: req.body.decision,
        reason: req.body.reason
      });
      res.json({ ok: true, requestId: out.id, status: out.status });
    } catch (e) {
      next(e);
    }
  }

  // Guard/Admin
  static async listSocietyRequests(req: Request, res: Response, next: NextFunction) {
    try {
      const status = req.query.status ? String(req.query.status) : null;
      const limit = Number(req.query.limit ?? 50);
      const offset = Number(req.query.offset ?? 0);

      const out = await VisitorsService.listSocietyRequests({
        societyId: req.user!.societyId,
        role: req.user!.role,
        status,
        limit,
        offset
      });
      res.json({ ok: true, items: out });
    } catch (e) {
      next(e);
    }
  }

  static async createGateEntry(req: Request, res: Response, next: NextFunction) {
    try {
      const out = await VisitorsService.createGateEntry({
        societyId: req.user!.societyId,
        userId: req.user!.id,
        role: req.user!.role,
        body: req.body
      });
      res.json({ ok: true, entry: { id: out.id, status: out.status, flatId: out.flat_id } });
    } catch (e) {
      next(e);
    }
  }

  static async markIn(req: Request, res: Response, next: NextFunction) {
    try {
      const out = await VisitorsService.markIn({
        societyId: req.user!.societyId,
        userId: req.user!.id,
        role: req.user!.role,
        entryId: req.params.entryId,
        inPhotoUrl: req.body.inPhotoUrl ?? null
      });
      res.json({ ok: true, entry: out });
    } catch (e) {
      next(e);
    }
  }

  static async markOut(req: Request, res: Response, next: NextFunction) {
    try {
      const out = await VisitorsService.markOut({
        societyId: req.user!.societyId,
        role: req.user!.role,
        entryId: req.params.entryId,
        outPhotoUrl: req.body.outPhotoUrl ?? null
      });
      res.json({ ok: true, entry: out });
    } catch (e) {
      next(e);
    }
  }

  static async listEntries(req: Request, res: Response, next: NextFunction) {
    try {
        if (req.user!.role === "RESIDENT") {
        const flatId = String(req.query.flatId ?? "");
        if (!flatId) throw new Error("flatId required");
        const ok = await VisitorsRepository.residentHasFlatAccess(req.user!.id, flatId);
        if (!ok) return res.status(403).json({ error: "You do not belong to this flat." });
        }

      const limit = Number(req.query.limit ?? 50);
      const offset = Number(req.query.offset ?? 0);
      const out = await VisitorsService.listEntries({
        societyId: req.user!.societyId,
        role: req.user!.role,
        gateId: req.query.gateId ? String(req.query.gateId) : null,
        flatId: req.query.flatId ? String(req.query.flatId) : null,
        from: req.query.from ? String(req.query.from) : null,
        to: req.query.to ? String(req.query.to) : null,
        limit,
        offset
      });
      res.json({ ok: true, items: out });
    } catch (e) {
      next(e);
    }
  }
}

import { Request, Response, NextFunction } from "express";
import { BillingService } from "./billing.service";

export class BillingController {
  static async createBill(req: Request, res: Response, next: NextFunction) {
    try {
      const bill = await BillingService.createBill({
        societyId: req.user!.societyId,
        userId: req.user!.id,
        role: req.user!.role,
        body: req.body
      });
      res.json({ ok: true, bill });
    } catch (e) { next(e); }
  }

  static async bulkCreate(req: Request, res: Response, next: NextFunction) {
    try {
      const bills = await BillingService.bulkCreate({
        societyId: req.user!.societyId,
        userId: req.user!.id,
        role: req.user!.role,
        body: req.body
      });
      res.json({ ok: true, createdCount: bills.length, bills });
    } catch (e) { next(e); }
  }

  static async listBills(req: Request, res: Response, next: NextFunction) {
    try {
      const flatId = req.query.flatId ? String(req.query.flatId) : null;
      const status = req.query.status ? String(req.query.status) : null;
      const limit = Number(req.query.limit ?? 50);
      const offset = Number(req.query.offset ?? 0);

      const bills = await BillingService.listBills({
        societyId: req.user!.societyId,
        userId: req.user!.id,
        role: req.user!.role,
        flatId,
        status,
        limit,
        offset
      });
      res.json({ ok: true, items: bills });
    } catch (e) { next(e); }
  }

  static async initiatePayment(req: Request, res: Response, next: NextFunction) {
    try {
      const out = await BillingService.initiatePayment({
        societyId: req.user!.societyId,
        userId: req.user!.id,
        role: req.user!.role,
        body: req.body
      });
      res.json({ ok: true, ...out });
    } catch (e) { next(e); }
  }

  static async confirmPayment(req: Request, res: Response, next: NextFunction) {
    try {
      const out = await BillingService.confirmPayment({
        societyId: req.user!.societyId,
        userId: req.user!.id,
        role: req.user!.role,
        body: req.body
      });
      res.json({ ok: true, payment: out });
    } catch (e) { next(e); }
  }

  static async ledger(req: Request, res: Response, next: NextFunction) {
    try {
      const from = req.query.from ? String(req.query.from) : null;
      const to = req.query.to ? String(req.query.to) : null;

      const out = await BillingService.ledger({
        societyId: req.user!.societyId,
        role: req.user!.role,
        from,
        to
      });
      res.json({ ok: true, items: out });
    } catch (e) { next(e); }
  }
}

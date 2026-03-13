"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BillingController = void 0;
const billing_service_1 = require("./billing.service");
class BillingController {
    static async createBill(req, res, next) {
        try {
            const bill = await billing_service_1.BillingService.createBill({
                societyId: req.user.societyId,
                userId: req.user.id,
                role: req.user.role,
                body: req.body
            });
            res.json({ ok: true, bill });
        }
        catch (e) {
            next(e);
        }
    }
    static async bulkCreate(req, res, next) {
        try {
            const bills = await billing_service_1.BillingService.bulkCreate({
                societyId: req.user.societyId,
                userId: req.user.id,
                role: req.user.role,
                body: req.body
            });
            res.json({ ok: true, createdCount: bills.length, bills });
        }
        catch (e) {
            next(e);
        }
    }
    static async listBills(req, res, next) {
        try {
            const flatId = req.query.flatId ? String(req.query.flatId) : null;
            const status = req.query.status ? String(req.query.status) : null;
            const limit = Number(req.query.limit ?? 50);
            const offset = Number(req.query.offset ?? 0);
            const bills = await billing_service_1.BillingService.listBills({
                societyId: req.user.societyId,
                userId: req.user.id,
                role: req.user.role,
                flatId,
                status,
                limit,
                offset
            });
            res.json({ ok: true, items: bills });
        }
        catch (e) {
            next(e);
        }
    }
    static async initiatePayment(req, res, next) {
        try {
            const out = await billing_service_1.BillingService.initiatePayment({
                societyId: req.user.societyId,
                userId: req.user.id,
                role: req.user.role,
                body: req.body
            });
            res.json({ ok: true, ...out });
        }
        catch (e) {
            next(e);
        }
    }
    static async confirmPayment(req, res, next) {
        try {
            const out = await billing_service_1.BillingService.confirmPayment({
                societyId: req.user.societyId,
                userId: req.user.id,
                role: req.user.role,
                body: req.body
            });
            res.json({ ok: true, payment: out });
        }
        catch (e) {
            next(e);
        }
    }
    static async ledger(req, res, next) {
        try {
            const from = req.query.from ? String(req.query.from) : null;
            const to = req.query.to ? String(req.query.to) : null;
            const out = await billing_service_1.BillingService.ledger({
                societyId: req.user.societyId,
                role: req.user.role,
                from,
                to
            });
            res.json({ ok: true, items: out });
        }
        catch (e) {
            next(e);
        }
    }
}
exports.BillingController = BillingController;

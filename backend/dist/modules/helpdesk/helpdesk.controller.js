"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HelpdeskController = void 0;
const helpdesk_service_1 = require("./helpdesk.service");
class HelpdeskController {
    // Resident
    static async createTicket(req, res, next) {
        try {
            const ticket = await helpdesk_service_1.HelpdeskService.createTicket({
                societyId: req.user.societyId,
                userId: req.user.id,
                role: req.user.role,
                body: req.body
            });
            res.json({ ok: true, ticket });
        }
        catch (e) {
            next(e);
        }
    }
    static async listResidentTickets(req, res, next) {
        try {
            const flatId = String(req.query.flatId ?? "");
            const status = req.query.status ? String(req.query.status) : null;
            const limit = Number(req.query.limit ?? 50);
            const offset = Number(req.query.offset ?? 0);
            const items = await helpdesk_service_1.HelpdeskService.listResidentTickets({
                societyId: req.user.societyId,
                userId: req.user.id,
                role: req.user.role,
                flatId,
                status,
                limit,
                offset
            });
            res.json({ ok: true, items });
        }
        catch (e) {
            next(e);
        }
    }
    static async addComment(req, res, next) {
        try {
            const c = await helpdesk_service_1.HelpdeskService.addComment({
                societyId: req.user.societyId,
                userId: req.user.id,
                role: req.user.role,
                ticketId: req.params.id,
                message: req.body.message
            });
            res.json({ ok: true, comment: c });
        }
        catch (e) {
            next(e);
        }
    }
    static async listComments(req, res, next) {
        try {
            const limit = Number(req.query.limit ?? 200);
            const items = await helpdesk_service_1.HelpdeskService.listComments({
                societyId: req.user.societyId,
                userId: req.user.id,
                role: req.user.role,
                ticketId: req.params.id,
                limit
            });
            res.json({ ok: true, items });
        }
        catch (e) {
            next(e);
        }
    }
    // Admin
    static async adminListTickets(req, res, next) {
        try {
            const status = req.query.status ? String(req.query.status) : null;
            const priority = req.query.priority ? String(req.query.priority) : null;
            const type = req.query.type ? String(req.query.type) : null;
            const overdue = req.query.overdue ? String(req.query.overdue) === "true" : null;
            const limit = Number(req.query.limit ?? 50);
            const offset = Number(req.query.offset ?? 0);
            const items = await helpdesk_service_1.HelpdeskService.adminListTickets({
                societyId: req.user.societyId,
                role: req.user.role,
                status,
                priority,
                type,
                overdue,
                limit,
                offset
            });
            res.json({ ok: true, items });
        }
        catch (e) {
            next(e);
        }
    }
    static async assignTicket(req, res, next) {
        try {
            const out = await helpdesk_service_1.HelpdeskService.assignTicket({
                societyId: req.user.societyId,
                role: req.user.role,
                ticketId: req.params.id,
                assignedToUserId: req.body.assignedToUserId
            });
            res.json({ ok: true, ...out });
        }
        catch (e) {
            next(e);
        }
    }
    static async updateStatus(req, res, next) {
        try {
            const out = await helpdesk_service_1.HelpdeskService.updateStatus({
                societyId: req.user.societyId,
                role: req.user.role,
                ticketId: req.params.id,
                status: req.body.status
            });
            res.json({ ok: true, ...out });
        }
        catch (e) {
            next(e);
        }
    }
    static async summary(req, res, next) {
        try {
            const out = await helpdesk_service_1.HelpdeskService.summary({
                societyId: req.user.societyId,
                role: req.user.role
            });
            res.json({ ok: true, ...out });
        }
        catch (e) {
            next(e);
        }
    }
}
exports.HelpdeskController = HelpdeskController;

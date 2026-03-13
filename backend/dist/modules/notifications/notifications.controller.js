"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationsController = void 0;
const notifications_service_1 = require("./notifications.service");
class NotificationsController {
    static async list(req, res, next) {
        try {
            const limit = Number(req.query.limit ?? 50);
            const offset = Number(req.query.offset ?? 0);
            const unreadOnly = String(req.query.unreadOnly ?? "false") === "true";
            const items = await notifications_service_1.NotificationsService.list({
                userId: req.user.id,
                limit,
                offset,
                unreadOnly
            });
            res.json({ ok: true, items });
        }
        catch (e) {
            next(e);
        }
    }
    static async markRead(req, res, next) {
        try {
            const out = await notifications_service_1.NotificationsService.markRead({
                userId: req.user.id,
                notificationId: req.body.notificationId
            });
            res.json({ ok: true, ...out });
        }
        catch (e) {
            next(e);
        }
    }
    static async markAllRead(req, res, next) {
        try {
            const out = await notifications_service_1.NotificationsService.markAllRead(req.user.id);
            res.json({ ok: true, ...out });
        }
        catch (e) {
            next(e);
        }
    }
}
exports.NotificationsController = NotificationsController;

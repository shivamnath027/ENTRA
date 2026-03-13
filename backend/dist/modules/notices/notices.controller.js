"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NoticesController = void 0;
const notices_service_1 = require("./notices.service");
class NoticesController {
    static async create(req, res, next) {
        try {
            const notice = await notices_service_1.NoticesService.create({
                societyId: req.user.societyId,
                userId: req.user.id,
                role: req.user.role,
                body: req.body
            });
            res.json({ ok: true, notice });
        }
        catch (e) {
            next(e);
        }
    }
    static async update(req, res, next) {
        try {
            const notice = await notices_service_1.NoticesService.update({
                societyId: req.user.societyId,
                role: req.user.role,
                noticeId: req.params.id,
                patch: req.body
            });
            res.json({ ok: true, notice });
        }
        catch (e) {
            next(e);
        }
    }
    static async remove(req, res, next) {
        try {
            const out = await notices_service_1.NoticesService.delete({
                societyId: req.user.societyId,
                role: req.user.role,
                noticeId: req.params.id
            });
            res.json(out);
        }
        catch (e) {
            next(e);
        }
    }
    static async list(req, res, next) {
        try {
            const limit = Number(req.query.limit ?? 50);
            const offset = Number(req.query.offset ?? 0);
            const items = await notices_service_1.NoticesService.list({ societyId: req.user.societyId, limit, offset });
            res.json({ ok: true, items });
        }
        catch (e) {
            next(e);
        }
    }
}
exports.NoticesController = NoticesController;

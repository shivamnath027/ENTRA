"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminController = void 0;
const admin_service_1 = require("./admin.service");
class AdminController {
    static async kpis(req, res, next) {
        try {
            const out = await admin_service_1.AdminService.kpis({ societyId: req.user.societyId, role: req.user.role });
            res.json({ ok: true, ...out });
        }
        catch (e) {
            next(e);
        }
    }
    static async listUsers(req, res, next) {
        try {
            const items = await admin_service_1.AdminService.listUsers({ societyId: req.user.societyId, role: req.user.role, query: req.query });
            res.json({ ok: true, items });
        }
        catch (e) {
            next(e);
        }
    }
    static async createUser(req, res, next) {
        try {
            const user = await admin_service_1.AdminService.createUser({ societyId: req.user.societyId, role: req.user.role, body: req.body });
            res.json({ ok: true, user });
        }
        catch (e) {
            next(e);
        }
    }
    static async updateUser(req, res, next) {
        try {
            const user = await admin_service_1.AdminService.updateUser({
                societyId: req.user.societyId,
                role: req.user.role,
                userId: req.params.id,
                patch: req.body
            });
            res.json({ ok: true, user });
        }
        catch (e) {
            next(e);
        }
    }
    static async listBlocks(req, res, next) {
        try {
            const items = await admin_service_1.AdminService.listBlocks({ societyId: req.user.societyId, role: req.user.role });
            res.json({ ok: true, items });
        }
        catch (e) {
            next(e);
        }
    }
    static async createBlock(req, res, next) {
        try {
            const block = await admin_service_1.AdminService.createBlock({ societyId: req.user.societyId, role: req.user.role, name: req.body.name });
            res.json({ ok: true, block });
        }
        catch (e) {
            next(e);
        }
    }
    static async listFlats(req, res, next) {
        try {
            const blockId = req.query.blockId ? String(req.query.blockId) : null;
            const items = await admin_service_1.AdminService.listFlats({ societyId: req.user.societyId, role: req.user.role, blockId });
            res.json({ ok: true, items });
        }
        catch (e) {
            next(e);
        }
    }
    static async createFlat(req, res, next) {
        try {
            const flat = await admin_service_1.AdminService.createFlat({ societyId: req.user.societyId, role: req.user.role, body: req.body });
            res.json({ ok: true, flat });
        }
        catch (e) {
            next(e);
        }
    }
}
exports.AdminController = AdminController;

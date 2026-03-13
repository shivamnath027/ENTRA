"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VehiclesController = void 0;
const vehicles_service_1 = require("./vehicles.service");
class VehiclesController {
    static async create(req, res, next) {
        try {
            const out = await vehicles_service_1.VehiclesService.createVehicle({
                societyId: req.user.societyId,
                userId: req.user.id,
                role: req.user.role,
                body: req.body
            });
            res.json({ ok: true, vehicle: out });
        }
        catch (e) {
            next(e);
        }
    }
    static async list(req, res, next) {
        try {
            const flatId = req.query.flatId ? String(req.query.flatId) : null;
            const limit = Number(req.query.limit ?? 50);
            const offset = Number(req.query.offset ?? 0);
            const out = await vehicles_service_1.VehiclesService.listVehicles({
                societyId: req.user.societyId,
                userId: req.user.id,
                role: req.user.role,
                flatId,
                limit,
                offset
            });
            res.json({ ok: true, items: out });
        }
        catch (e) {
            next(e);
        }
    }
    static async update(req, res, next) {
        try {
            const out = await vehicles_service_1.VehiclesService.updateVehicle({
                societyId: req.user.societyId,
                userId: req.user.id,
                role: req.user.role,
                vehicleId: req.params.id,
                patch: req.body
            });
            res.json({ ok: true, vehicle: out });
        }
        catch (e) {
            next(e);
        }
    }
    static async scan(req, res, next) {
        try {
            const out = await vehicles_service_1.VehiclesService.scanVehicle({
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
}
exports.VehiclesController = VehiclesController;

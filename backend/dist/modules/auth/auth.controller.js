"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const auth_service_1 = require("./auth.service");
class AuthController {
    static async requestOtp(req, res, next) {
        try {
            const ip = req.headers["x-forwarded-for"] ?? req.socket.remoteAddress ?? null;
            const out = await auth_service_1.AuthService.requestOtp({
                societyId: req.body.societyId,
                phone: req.body.phone,
                ipAddress: ip
            });
            res.json({ ok: true, ...out });
        }
        catch (e) {
            next(e);
        }
    }
    static async verifyOtp(req, res, next) {
        try {
            const out = await auth_service_1.AuthService.verifyOtp({
                requestId: req.body.requestId,
                otp: req.body.otp,
                device: req.body.device
            });
            res.json({ ok: true, ...out });
        }
        catch (e) {
            next(e);
        }
    }
    static async refresh(req, res, next) {
        try {
            const out = await auth_service_1.AuthService.refresh({ refreshToken: req.body.refreshToken });
            res.json({ ok: true, ...out });
        }
        catch (e) {
            next(e);
        }
    }
    static async logout(req, res, next) {
        try {
            const out = await auth_service_1.AuthService.logout({ refreshToken: req.body.refreshToken });
            res.json(out);
        }
        catch (e) {
            next(e);
        }
    }
}
exports.AuthController = AuthController;

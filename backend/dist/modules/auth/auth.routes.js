"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRoutes = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const auth_controller_1 = require("./auth.controller");
const validate_1 = require("../../middleware/validate");
exports.authRoutes = (0, express_1.Router)();
const requestOtpSchema = zod_1.z.object({
    societyId: zod_1.z.string().uuid(),
    phone: zod_1.z.string().min(10).max(10)
});
const verifyOtpSchema = zod_1.z.object({
    requestId: zod_1.z.string().uuid(),
    otp: zod_1.z.string().min(4).max(8),
    device: zod_1.z
        .object({
        platform: zod_1.z.enum(["ANDROID", "IOS", "WEB"]),
        pushToken: zod_1.z.string().min(10)
    })
        .optional()
});
const refreshSchema = zod_1.z.object({
    refreshToken: zod_1.z.string().min(10)
});
exports.authRoutes.post("/otp/request", (0, validate_1.validateBody)(requestOtpSchema), auth_controller_1.AuthController.requestOtp);
exports.authRoutes.post("/otp/verify", (0, validate_1.validateBody)(verifyOtpSchema), auth_controller_1.AuthController.verifyOtp);
exports.authRoutes.post("/refresh", (0, validate_1.validateBody)(refreshSchema), auth_controller_1.AuthController.refresh);
exports.authRoutes.post("/logout", (0, validate_1.validateBody)(refreshSchema), auth_controller_1.AuthController.logout);

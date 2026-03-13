"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.markOutSchema = exports.markInSchema = exports.gateCreateEntrySchema = exports.requestDecisionSchema = exports.createVisitorRequestSchema = void 0;
const zod_1 = require("zod");
exports.createVisitorRequestSchema = zod_1.z.object({
    flatId: zod_1.z.string().uuid(),
    visitorName: zod_1.z.string().min(1),
    visitorPhone: zod_1.z.string().regex(/^\d{10}$/).optional().nullable(),
    vehicleNumber: zod_1.z.string().min(3).max(20).optional().nullable(),
    purpose: zod_1.z.string().max(200).optional().nullable(),
    expectedAt: zod_1.z.string().datetime().optional().nullable(),
    validFrom: zod_1.z.string().datetime().optional().nullable(),
    validUntil: zod_1.z.string().datetime().optional().nullable()
});
exports.requestDecisionSchema = zod_1.z.object({
    decision: zod_1.z.enum(["APPROVE", "REJECT"]),
    reason: zod_1.z.string().max(200).optional().nullable()
});
exports.gateCreateEntrySchema = zod_1.z.object({
    gateId: zod_1.z.string().uuid(),
    visitorRequestId: zod_1.z.string().uuid().optional().nullable(),
    flatId: zod_1.z.string().uuid().optional().nullable(),
    visitorName: zod_1.z.string().min(1).optional().nullable(),
    visitorPhone: zod_1.z.string().regex(/^\d{10}$/).optional().nullable(),
    vehicleNumber: zod_1.z.string().min(3).max(20).optional().nullable(),
    purpose: zod_1.z.string().max(200).optional().nullable(),
    inPhotoUrl: zod_1.z.string().url().optional().nullable()
});
exports.markInSchema = zod_1.z.object({
    inPhotoUrl: zod_1.z.string().url().optional().nullable()
});
exports.markOutSchema = zod_1.z.object({
    outPhotoUrl: zod_1.z.string().url().optional().nullable()
});

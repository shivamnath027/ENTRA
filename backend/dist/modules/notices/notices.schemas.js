"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateNoticeSchema = exports.createNoticeSchema = void 0;
const zod_1 = require("zod");
exports.createNoticeSchema = zod_1.z.object({
    title: zod_1.z.string().min(1).max(120),
    content: zod_1.z.string().min(1).max(5000),
    pinned: zod_1.z.boolean().optional().default(false),
    visibleFrom: zod_1.z.string().datetime().optional().nullable(),
    visibleUntil: zod_1.z.string().datetime().optional().nullable()
});
exports.updateNoticeSchema = zod_1.z.object({
    title: zod_1.z.string().min(1).max(120).optional(),
    content: zod_1.z.string().min(1).max(5000).optional(),
    pinned: zod_1.z.boolean().optional(),
    visibleFrom: zod_1.z.string().datetime().optional().nullable(),
    visibleUntil: zod_1.z.string().datetime().optional().nullable()
});

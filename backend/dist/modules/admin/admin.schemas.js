"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createFlatSchema = exports.createBlockSchema = exports.updateUserSchema = exports.createUserSchema = void 0;
const zod_1 = require("zod");
exports.createUserSchema = zod_1.z.object({
    fullName: zod_1.z.string().min(1).max(120),
    phone: zod_1.z.string().regex(/^\d{10}$/),
    email: zod_1.z.string().email().optional().nullable(),
    role: zod_1.z.enum(["RESIDENT", "GUARD", "ADMIN"]),
    status: zod_1.z.enum(["ACTIVE", "INVITED"]).optional()
});
exports.updateUserSchema = zod_1.z.object({
    fullName: zod_1.z.string().min(1).max(120).optional(),
    email: zod_1.z.string().email().optional().nullable(),
    status: zod_1.z.enum(["ACTIVE", "SUSPENDED", "INVITED"]).optional()
});
exports.createBlockSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(50)
});
exports.createFlatSchema = zod_1.z.object({
    blockId: zod_1.z.string().uuid(),
    flatNumber: zod_1.z.string().min(1).max(20),
    floor: zod_1.z.number().int().optional().nullable()
});

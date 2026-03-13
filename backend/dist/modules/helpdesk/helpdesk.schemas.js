"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateStatusSchema = exports.assignTicketSchema = exports.addCommentSchema = exports.createTicketSchema = void 0;
const zod_1 = require("zod");
exports.createTicketSchema = zod_1.z.object({
    flatId: zod_1.z.string().uuid(),
    type: zod_1.z.enum(["PLUMBING", "ELECTRICAL", "SECURITY", "OTHER"]),
    priority: zod_1.z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]),
    description: zod_1.z.string().min(5).max(5000)
});
exports.addCommentSchema = zod_1.z.object({
    message: zod_1.z.string().min(1).max(2000)
});
exports.assignTicketSchema = zod_1.z.object({
    assignedToUserId: zod_1.z.string().uuid()
});
exports.updateStatusSchema = zod_1.z.object({
    status: zod_1.z.enum(["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"])
});

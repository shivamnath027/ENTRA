"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.confirmPaymentSchema = exports.initiatePaymentSchema = exports.bulkCreateBillsSchema = exports.createBillSchema = void 0;
const zod_1 = require("zod");
exports.createBillSchema = zod_1.z.object({
    flatId: zod_1.z.string().uuid(),
    billPeriodStart: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    billPeriodEnd: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    dueDate: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    amount: zod_1.z.number().nonnegative()
});
exports.bulkCreateBillsSchema = zod_1.z.object({
    flatIds: zod_1.z.array(zod_1.z.string().uuid()).min(1).max(500),
    billPeriodStart: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    billPeriodEnd: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    dueDate: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    amount: zod_1.z.number().nonnegative()
});
exports.initiatePaymentSchema = zod_1.z.object({
    billId: zod_1.z.string().uuid(),
    amount: zod_1.z.number().positive(),
    method: zod_1.z.enum(["UPI", "CARD", "NETBANKING", "CASH"])
});
exports.confirmPaymentSchema = zod_1.z.object({
    paymentId: zod_1.z.string().uuid(),
    status: zod_1.z.enum(["SUCCESS", "FAILED"]),
    providerTxnId: zod_1.z.string().min(3).max(100).optional().nullable()
});

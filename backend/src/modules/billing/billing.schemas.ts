import { z } from "zod";

export const createBillSchema = z.object({
  flatId: z.string().uuid(),
  billPeriodStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  billPeriodEnd: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  amount: z.number().nonnegative()
});

export const bulkCreateBillsSchema = z.object({
  flatIds: z.array(z.string().uuid()).min(1).max(500),
  billPeriodStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  billPeriodEnd: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  amount: z.number().nonnegative()
});

export const initiatePaymentSchema = z.object({
  billId: z.string().uuid(),
  amount: z.number().positive(),
  method: z.enum(["UPI", "CARD", "NETBANKING", "CASH"])
});

export const confirmPaymentSchema = z.object({
  paymentId: z.string().uuid(),
  status: z.enum(["SUCCESS", "FAILED"]),
  providerTxnId: z.string().min(3).max(100).optional().nullable()
});

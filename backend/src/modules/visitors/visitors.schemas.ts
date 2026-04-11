import { z } from "zod";

export const createVisitorRequestSchema = z.object({
  flatId: z.string().uuid(),
  visitorName: z.string().min(1),
  visitorPhone: z.string().regex(/^\d{10}$/).optional().nullable(),
  vehicleNumber: z.string().min(3).max(20).optional().nullable(),
  purpose: z.string().max(200).optional().nullable(),
  expectedAt: z.string().datetime().optional().nullable(),
  validFrom: z.string().datetime().optional().nullable(),
  validUntil: z.string().datetime().optional().nullable()
});

export const requestDecisionSchema = z.object({
  decision: z.enum(["APPROVE", "REJECT"]),
  reason: z.string().max(200).optional().nullable()
});

export const gateCreateEntrySchema = z.object({
  visitorRequestId: z.string().uuid().optional().nullable(),
  flatId: z.string().uuid().optional().nullable(),
  visitorName: z.string().min(1).optional().nullable(),
  visitorPhone: z.string().regex(/^\d{10}$/).optional().nullable(),
  vehicleNumber: z.string().min(3).max(20).optional().nullable(),
  purpose: z.string().max(200).optional().nullable(),
  inPhotoUrl: z.string().url().optional().nullable()
});

export const markInSchema = z.object({
  inPhotoUrl: z.string().url().optional().nullable()
});

export const markOutSchema = z.object({
  outPhotoUrl: z.string().url().optional().nullable()
});

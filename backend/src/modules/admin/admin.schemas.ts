import { z } from "zod";

export const createUserSchema = z.object({
  fullName: z.string().min(1).max(120),
  phone: z.string().regex(/^\d{10}$/),
  email: z.string().email().optional().nullable(),
  role: z.enum(["RESIDENT", "GUARD", "ADMIN"]),
  status: z.enum(["ACTIVE", "INVITED"]).optional()
});

export const updateUserSchema = z.object({
  fullName: z.string().min(1).max(120).optional(),
  email: z.string().email().optional().nullable(),
  status: z.enum(["ACTIVE", "SUSPENDED", "INVITED"]).optional()
});

export const createBlockSchema = z.object({
  name: z.string().min(1).max(50)
});

export const createFlatSchema = z.object({
  blockId: z.string().uuid(),
  flatNumber: z.string().min(1).max(20),
  floor: z.number().int().optional().nullable()
});

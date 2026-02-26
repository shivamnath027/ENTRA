import { z } from "zod";

export const createTicketSchema = z.object({
  flatId: z.string().uuid(),
  type: z.enum(["PLUMBING", "ELECTRICAL", "SECURITY", "OTHER"]),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]),
  description: z.string().min(5).max(5000)
});

export const addCommentSchema = z.object({
  message: z.string().min(1).max(2000)
});

export const assignTicketSchema = z.object({
  assignedToUserId: z.string().uuid()
});

export const updateStatusSchema = z.object({
  status: z.enum(["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"])
});

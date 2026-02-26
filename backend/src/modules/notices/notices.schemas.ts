import { z } from "zod";

export const createNoticeSchema = z.object({
  title: z.string().min(1).max(120),
  content: z.string().min(1).max(5000),
  pinned: z.boolean().optional().default(false),
  visibleFrom: z.string().datetime().optional().nullable(),
  visibleUntil: z.string().datetime().optional().nullable()
});

export const updateNoticeSchema = z.object({
  title: z.string().min(1).max(120).optional(),
  content: z.string().min(1).max(5000).optional(),
  pinned: z.boolean().optional(),
  visibleFrom: z.string().datetime().optional().nullable(),
  visibleUntil: z.string().datetime().optional().nullable()
});

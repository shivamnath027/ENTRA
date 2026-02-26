import { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";
import { badRequest } from "../common/errors";

export const validateBody = (schema: ZodSchema) => (req: Request, _res: Response, next: NextFunction) => {
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return next(badRequest(parsed.error.issues.map(i => i.message).join(", ")));
  }
  req.body = parsed.data;
  next();
};

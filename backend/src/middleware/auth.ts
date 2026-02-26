import { Request, Response, NextFunction } from "express";
import { unauthorized } from "../common/errors";
import { verifyAccessToken } from "../modules/auth/jwt";
import { UserRole } from "../modules/auth/auth.types";

export type AuthedUser = {
  id: string;
  societyId: string;
  role: UserRole;
};

declare global {
  namespace Express {
    interface Request {
      user?: AuthedUser;
    }
  }
}

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return next(unauthorized("Missing Authorization header."));
  const token = header.slice("Bearer ".length).trim();

  try {
    const payload = verifyAccessToken(token);
    req.user = { id: payload.sub, societyId: payload.societyId, role: payload.role };
    next();
  } catch {
    next(unauthorized("Invalid or expired token."));
  }
}

import { Request, Response, NextFunction } from "express";
import { forbidden } from "../common/errors";
import { UserRole } from "../modules/auth/auth.types";

export function requireRoles(...allowed: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const role = req.user?.role;
    if (!role || !allowed.includes(role)) return next(forbidden("Insufficient permissions."));
    next();
  };
}

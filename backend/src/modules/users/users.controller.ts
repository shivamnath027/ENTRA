import { Request, Response, NextFunction } from "express";
import { unauthorized } from "../../common/errors";
import { UsersService } from "./users.service";

export class UsersController {
  static async me(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw unauthorized("Missing authenticated user.");
      const out = await UsersService.getMe(req.user.id);
      res.json({ ok: true, ...out });
    } catch (e) {
      next(e);
    }
  }
}
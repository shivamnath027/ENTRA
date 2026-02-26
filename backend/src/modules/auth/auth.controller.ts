import { Request, Response, NextFunction } from "express";
import { AuthService } from "./auth.service";

export class AuthController {
  static async requestOtp(req: Request, res: Response, next: NextFunction) {
    try {
      const ip = (req.headers["x-forwarded-for"] as string) ?? req.socket.remoteAddress ?? null;
      const out = await AuthService.requestOtp({
        societyId: req.body.societyId,
        phone: req.body.phone,
        ipAddress: ip
      });
      res.json({ ok: true, ...out });
    } catch (e) {
      next(e);
    }
  }

  static async verifyOtp(req: Request, res: Response, next: NextFunction) {
    try {
      const out = await AuthService.verifyOtp({
        requestId: req.body.requestId,
        otp: req.body.otp,
        device: req.body.device
      });
      res.json({ ok: true, ...out });
    } catch (e) {
      next(e);
    }
  }

  static async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const out = await AuthService.refresh({ refreshToken: req.body.refreshToken });
      res.json({ ok: true, ...out });
    } catch (e) {
      next(e);
    }
  }

  static async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const out = await AuthService.logout({ refreshToken: req.body.refreshToken });
      res.json(out);
    } catch (e) {
      next(e);
    }
  }
}

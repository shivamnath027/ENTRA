import { Router } from "express";
import { z } from "zod";
import { AuthController } from "./auth.controller";
import { validateBody } from "../../middleware/validate";

export const authRoutes = Router();

const requestOtpSchema = z.object({
  societyId: z.string().uuid(),
  phone: z.string().min(10).max(10)
});

const verifyOtpSchema = z.object({
  requestId: z.string().uuid(),
  otp: z.string().min(4).max(8),
  device: z
    .object({
      platform: z.enum(["ANDROID", "IOS", "WEB"]),
      pushToken: z.string().min(10)
    })
    .optional()
});

const refreshSchema = z.object({
  refreshToken: z.string().min(10)
});

authRoutes.post("/otp/request", validateBody(requestOtpSchema), AuthController.requestOtp);
authRoutes.post("/otp/verify", validateBody(verifyOtpSchema), AuthController.verifyOtp);
authRoutes.post("/refresh", validateBody(refreshSchema), AuthController.refresh);
authRoutes.post("/logout", validateBody(refreshSchema), AuthController.logout);

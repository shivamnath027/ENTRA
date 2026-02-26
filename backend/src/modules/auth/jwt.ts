import jwt from "jsonwebtoken";
import { env } from "../../config/env";
import { JwtAccessPayload, JwtRefreshPayload } from "./auth.types";

export function signAccessToken(payload: JwtAccessPayload): string {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, { expiresIn: env.ACCESS_TOKEN_TTL_SECONDS });
}

export function signRefreshToken(payload: JwtRefreshPayload): string {
  // refresh TTL in days
  const expiresInSeconds = env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60;
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, { expiresIn: expiresInSeconds });
}

export function verifyAccessToken(token: string): JwtAccessPayload {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtAccessPayload;
}

export function verifyRefreshToken(token: string): JwtRefreshPayload {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as JwtRefreshPayload;
}

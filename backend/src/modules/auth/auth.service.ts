import crypto from "crypto";
import bcrypt from "bcryptjs";
import { env } from "../../config/env";
import { AuthRepository } from "./auth.repository";
import { badRequest, forbidden, unauthorized } from "../../common/errors";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "./jwt";
import { DevicePlatform, JwtRefreshPayload } from "./auth.types";

function randomOtp(length: number): string {
  const digits = "0123456789";
  let otp = "";
  for (let i = 0; i < length; i++) otp += digits[Math.floor(Math.random() * digits.length)];
  return otp;
}

function sha256(input: string): string {
  return crypto.createHash("sha256").update(input).digest("hex");
}

export class AuthService {
  static async requestOtp(params: {
    societyId: string;
    phone: string;
    ipAddress: string | null;
  }): Promise<{ requestId: string; expiresInSeconds: number; devOtp?: string }> {
    const societyId = params.societyId;
    const phone = params.phone.trim();

    if (!/^\d{10}$/.test(phone)) throw badRequest("Phone must be 10 digits.");

    const user = await AuthRepository.findUserBySocietyPhone(societyId, phone);
    if (!user) {
      // In real apps: avoid user enumeration by always returning ok.
      // For our MVP: keep it strict.
      throw unauthorized("User not found in this society.");
    }
    if (user.status !== "ACTIVE") throw forbidden("User is not active.");

    const otpTtl = Number(process.env.OTP_TTL_SECONDS ?? 300);
    const otpLen = Number(process.env.OTP_LENGTH ?? 6);

    const otp = randomOtp(otpLen);
    const otpHash = await bcrypt.hash(otp, 10);

    const expiresAt = new Date(Date.now() + otpTtl * 1000);

    const row = await AuthRepository.createOtpLogin({
      userId: user.id,
      phone,
      otpHash,
      expiresAt,
      ipAddress: params.ipAddress
    });

    // TODO Step 6/7: integrate SMS provider (Twilio/Msg91/etc).
    // For now: return devOtp in non-production.
    const devOtp = process.env.NODE_ENV !== "production" ? otp : undefined;

    return { requestId: row.id, expiresInSeconds: otpTtl, devOtp };
  }

  static async verifyOtp(params: {
    requestId: string;
    otp: string;
    device?: { platform: DevicePlatform; pushToken: string };
  }): Promise<{
    accessToken: string;
    refreshToken: string;
    user: { id: string; fullName: string; role: any; societyId: string };
  }> {
    const maxAttempts = Number(process.env.OTP_MAX_ATTEMPTS ?? 5);

    const rec = await AuthRepository.getOtpLoginById(params.requestId);
    if (!rec) throw badRequest("Invalid requestId.");
    if (rec.consumed_at) throw badRequest("OTP already used.");
    if (new Date(rec.expires_at).getTime() < Date.now()) throw badRequest("OTP expired.");
    if (rec.attempt_count >= maxAttempts) throw badRequest("Too many attempts.");

    const otpOk = await bcrypt.compare(params.otp, rec.otp_hash);
    if (!otpOk) {
      await AuthRepository.incrementOtpAttempt(params.requestId);
      throw unauthorized("Invalid OTP.");
    }

    await AuthRepository.consumeOtp(params.requestId);

    const user = await AuthRepository.getUserById(rec.user_id);
    if (!user) throw unauthorized("User no longer exists.");
    if (user.status !== "ACTIVE") throw forbidden("User is not active.");

    // Optional: device upsert for push notifications
    let deviceId: string | null = null;
    if (params.device?.pushToken) {
      const d = await AuthRepository.upsertDevice({
        userId: user.id,
        platform: params.device.platform,
        pushToken: params.device.pushToken
      });
      deviceId = d.id;
    }

    // Create refresh token record in DB, and put its ID in JWT as jti
    const refreshIdPlaceholder = crypto.randomUUID(); // we will store as DB id by inserting with fixed ID? easiest is DB generated id.
    // We'll instead insert first, then sign with returned id.

    const refreshTtlDays = env.REFRESH_TOKEN_TTL_DAYS;
    const refreshExpiresAt = new Date(Date.now() + refreshTtlDays * 24 * 60 * 60 * 1000);

    // We'll temporarily sign later. First create token string seed (nonce) for hashing.
    const refreshNonce = crypto.randomBytes(32).toString("hex"); // prevents DB hash reuse
    // We'll store hash of (nonce + later-signed-token). But we need token to hash.
    // Simpler: store hash of a random secret and also embed jti in JWT. We'll store hash(secret) and return JWT + secret?
    // Better: store hash of refresh JWT itself (standard). We'll do: create DB row with placeholder hash, sign token with DB id, then update hash. (small extra update)
    const inserted = await AuthRepository.createRefreshToken({
      userId: user.id,
      tokenHash: "PLACEHOLDER",
      expiresAt: refreshExpiresAt,
      deviceId
    });

    const refreshPayload: JwtRefreshPayload = {
      sub: user.id,
      societyId: user.society_id,
      jti: inserted.id
    };
    const refreshToken = signRefreshToken(refreshPayload);

    // update stored hash
    const refreshHash = sha256(refreshToken + refreshNonce);
    // store nonce inside meta? we don't have a column. We'll keep it simple: store hash(refreshToken) only.
    // (remove nonce complexity)
    // So: hash(refreshToken)
    const finalHash = sha256(refreshToken);
    // update it
    // tiny inline update to avoid adding repo method
    const { pool } = await import("../../config/db");
    await pool.query(`UPDATE refresh_tokens SET token_hash = $1 WHERE id = $2`, [finalHash, inserted.id]);

    const accessToken = signAccessToken({
      sub: user.id,
      societyId: user.society_id,
      role: user.role
    });

    await AuthRepository.updateLastLogin(user.id);

    return {
      accessToken,
      refreshToken,
      user: { id: user.id, fullName: user.full_name, role: user.role, societyId: user.society_id }
    };
  }

  static async refresh(params: { refreshToken: string }) {
    const payload = verifyRefreshToken(params.refreshToken);

    const dbToken = await AuthRepository.findRefreshTokenById(payload.jti);
    if (!dbToken) throw unauthorized("Invalid refresh token.");
    if (dbToken.revoked_at) throw unauthorized("Refresh token revoked.");
    if (new Date(dbToken.expires_at).getTime() < Date.now()) throw unauthorized("Refresh token expired.");

    // verify hash matches
    const tokenHash = crypto.createHash("sha256").update(params.refreshToken).digest("hex");
    if (tokenHash !== dbToken.token_hash) throw unauthorized("Refresh token mismatch.");

    // rotation: revoke old token, issue new token
    await AuthRepository.revokeRefreshToken(payload.jti);

    const user = await AuthRepository.getUserById(payload.sub);
    if (!user) throw unauthorized("User not found.");
    if (user.status !== "ACTIVE") throw forbidden("User is not active.");

    const refreshTtlDays = env.REFRESH_TOKEN_TTL_DAYS;
    const refreshExpiresAt = new Date(Date.now() + refreshTtlDays * 24 * 60 * 60 * 1000);

    const inserted = await AuthRepository.createRefreshToken({
      userId: user.id,
      tokenHash: "PLACEHOLDER",
      expiresAt: refreshExpiresAt,
      deviceId: null
    });

    const newRefreshToken = signRefreshToken({
      sub: user.id,
      societyId: user.society_id,
      jti: inserted.id
    });

    const newHash = crypto.createHash("sha256").update(newRefreshToken).digest("hex");
    const { pool } = await import("../../config/db");
    await pool.query(`UPDATE refresh_tokens SET token_hash = $1 WHERE id = $2`, [newHash, inserted.id]);

    const newAccessToken = signAccessToken({
      sub: user.id,
      societyId: user.society_id,
      role: user.role
    });

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  }

  static async logout(params: { refreshToken: string }) {
    const payload = verifyRefreshToken(params.refreshToken);
    await AuthRepository.revokeRefreshToken(payload.jti);
    return { ok: true };
  }
}

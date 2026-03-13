"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthRepository = void 0;
const db_1 = require("../../config/db");
class AuthRepository {
    static async findUserBySocietyPhone(societyId, phone) {
        const q = `
      SELECT id, society_id, phone, full_name, role, status
      FROM users
      WHERE society_id = $1 AND phone = $2
      LIMIT 1
    `;
        const r = await db_1.pool.query(q, [societyId, phone]);
        return r.rows[0] ?? null;
    }
    static async createOtpLogin(params) {
        const q = `
      INSERT INTO otp_logins (user_id, phone, otp_hash, expires_at, ip_address)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, expires_at
    `;
        const r = await db_1.pool.query(q, [
            params.userId,
            params.phone,
            params.otpHash,
            params.expiresAt,
            params.ipAddress
        ]);
        return r.rows[0];
    }
    static async getOtpLoginById(requestId) {
        const q = `
      SELECT id, user_id, phone, otp_hash, expires_at, consumed_at, attempt_count
      FROM otp_logins
      WHERE id = $1
      LIMIT 1
    `;
        const r = await db_1.pool.query(q, [requestId]);
        return r.rows[0] ?? null;
    }
    static async incrementOtpAttempt(requestId) {
        await db_1.pool.query(`UPDATE otp_logins SET attempt_count = attempt_count + 1 WHERE id = $1`, [requestId]);
    }
    static async consumeOtp(requestId) {
        await db_1.pool.query(`UPDATE otp_logins SET consumed_at = now() WHERE id = $1 AND consumed_at IS NULL`, [requestId]);
    }
    static async upsertDevice(params) {
        const q = `
      INSERT INTO devices (user_id, platform, push_token, last_seen_at)
      VALUES ($1, $2, $3, now())
      ON CONFLICT (platform, push_token)
      DO UPDATE SET user_id = EXCLUDED.user_id, last_seen_at = now(), updated_at = now()
      RETURNING id
    `;
        const r = await db_1.pool.query(q, [params.userId, params.platform, params.pushToken]);
        return r.rows[0];
    }
    static async createRefreshToken(params) {
        const q = `
      INSERT INTO refresh_tokens (user_id, token_hash, expires_at, device_id)
      VALUES ($1, $2, $3, $4)
      RETURNING id
    `;
        const r = await db_1.pool.query(q, [
            params.userId,
            params.tokenHash,
            params.expiresAt,
            params.deviceId ?? null
        ]);
        return r.rows[0];
    }
    static async findRefreshTokenById(jti) {
        const q = `
      SELECT id, user_id, token_hash, expires_at, revoked_at
      FROM refresh_tokens
      WHERE id = $1
      LIMIT 1
    `;
        const r = await db_1.pool.query(q, [jti]);
        return r.rows[0] ?? null;
    }
    static async revokeRefreshToken(jti) {
        await db_1.pool.query(`UPDATE refresh_tokens SET revoked_at = now() WHERE id = $1`, [jti]);
    }
    static async updateLastLogin(userId) {
        await db_1.pool.query(`UPDATE users SET last_login_at = now() WHERE id = $1`, [userId]);
    }
    static async getUserById(userId) {
        const q = `
      SELECT id, society_id, phone, full_name, role, status
      FROM users
      WHERE id = $1
      LIMIT 1
    `;
        const r = await db_1.pool.query(q, [userId]);
        return r.rows[0] ?? null;
    }
}
exports.AuthRepository = AuthRepository;

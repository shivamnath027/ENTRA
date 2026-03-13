"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const crypto_1 = __importDefault(require("crypto"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const env_1 = require("../../config/env");
const auth_repository_1 = require("./auth.repository");
const errors_1 = require("../../common/errors");
const jwt_1 = require("./jwt");
function randomOtp(length) {
    const digits = "0123456789";
    let otp = "";
    for (let i = 0; i < length; i++)
        otp += digits[Math.floor(Math.random() * digits.length)];
    return otp;
}
function sha256(input) {
    return crypto_1.default.createHash("sha256").update(input).digest("hex");
}
class AuthService {
    static async requestOtp(params) {
        const societyId = params.societyId;
        const phone = params.phone.trim();
        if (!/^\d{10}$/.test(phone))
            throw (0, errors_1.badRequest)("Phone must be 10 digits.");
        const user = await auth_repository_1.AuthRepository.findUserBySocietyPhone(societyId, phone);
        if (!user) {
            // In real apps: avoid user enumeration by always returning ok.
            // For our MVP: keep it strict.
            throw (0, errors_1.unauthorized)("User not found in this society.");
        }
        if (user.status !== "ACTIVE")
            throw (0, errors_1.forbidden)("User is not active.");
        const otpTtl = Number(process.env.OTP_TTL_SECONDS ?? 300);
        const otpLen = Number(process.env.OTP_LENGTH ?? 6);
        const otp = randomOtp(otpLen);
        const otpHash = await bcryptjs_1.default.hash(otp, 10);
        const expiresAt = new Date(Date.now() + otpTtl * 1000);
        const row = await auth_repository_1.AuthRepository.createOtpLogin({
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
    static async verifyOtp(params) {
        const maxAttempts = Number(process.env.OTP_MAX_ATTEMPTS ?? 5);
        const rec = await auth_repository_1.AuthRepository.getOtpLoginById(params.requestId);
        if (!rec)
            throw (0, errors_1.badRequest)("Invalid requestId.");
        if (rec.consumed_at)
            throw (0, errors_1.badRequest)("OTP already used.");
        if (new Date(rec.expires_at).getTime() < Date.now())
            throw (0, errors_1.badRequest)("OTP expired.");
        if (rec.attempt_count >= maxAttempts)
            throw (0, errors_1.badRequest)("Too many attempts.");
        const otpOk = await bcryptjs_1.default.compare(params.otp, rec.otp_hash);
        if (!otpOk) {
            await auth_repository_1.AuthRepository.incrementOtpAttempt(params.requestId);
            throw (0, errors_1.unauthorized)("Invalid OTP.");
        }
        await auth_repository_1.AuthRepository.consumeOtp(params.requestId);
        const user = await auth_repository_1.AuthRepository.getUserById(rec.user_id);
        if (!user)
            throw (0, errors_1.unauthorized)("User no longer exists.");
        if (user.status !== "ACTIVE")
            throw (0, errors_1.forbidden)("User is not active.");
        // Optional: device upsert for push notifications
        let deviceId = null;
        if (params.device?.pushToken) {
            const d = await auth_repository_1.AuthRepository.upsertDevice({
                userId: user.id,
                platform: params.device.platform,
                pushToken: params.device.pushToken
            });
            deviceId = d.id;
        }
        // Create refresh token record in DB, and put its ID in JWT as jti
        const refreshIdPlaceholder = crypto_1.default.randomUUID(); // we will store as DB id by inserting with fixed ID? easiest is DB generated id.
        // We'll instead insert first, then sign with returned id.
        const refreshTtlDays = env_1.env.REFRESH_TOKEN_TTL_DAYS;
        const refreshExpiresAt = new Date(Date.now() + refreshTtlDays * 24 * 60 * 60 * 1000);
        // We'll temporarily sign later. First create token string seed (nonce) for hashing.
        const refreshNonce = crypto_1.default.randomBytes(32).toString("hex"); // prevents DB hash reuse
        // We'll store hash of (nonce + later-signed-token). But we need token to hash.
        // Simpler: store hash of a random secret and also embed jti in JWT. We'll store hash(secret) and return JWT + secret?
        // Better: store hash of refresh JWT itself (standard). We'll do: create DB row with placeholder hash, sign token with DB id, then update hash. (small extra update)
        const inserted = await auth_repository_1.AuthRepository.createRefreshToken({
            userId: user.id,
            tokenHash: "PLACEHOLDER",
            expiresAt: refreshExpiresAt,
            deviceId
        });
        const refreshPayload = {
            sub: user.id,
            societyId: user.society_id,
            jti: inserted.id
        };
        const refreshToken = (0, jwt_1.signRefreshToken)(refreshPayload);
        // update stored hash
        const refreshHash = sha256(refreshToken + refreshNonce);
        // store nonce inside meta? we don't have a column. We'll keep it simple: store hash(refreshToken) only.
        // (remove nonce complexity)
        // So: hash(refreshToken)
        const finalHash = sha256(refreshToken);
        // update it
        // tiny inline update to avoid adding repo method
        const { pool } = await Promise.resolve().then(() => __importStar(require("../../config/db")));
        await pool.query(`UPDATE refresh_tokens SET token_hash = $1 WHERE id = $2`, [finalHash, inserted.id]);
        const accessToken = (0, jwt_1.signAccessToken)({
            sub: user.id,
            societyId: user.society_id,
            role: user.role
        });
        await auth_repository_1.AuthRepository.updateLastLogin(user.id);
        return {
            accessToken,
            refreshToken,
            user: { id: user.id, fullName: user.full_name, role: user.role, societyId: user.society_id }
        };
    }
    static async refresh(params) {
        const payload = (0, jwt_1.verifyRefreshToken)(params.refreshToken);
        const dbToken = await auth_repository_1.AuthRepository.findRefreshTokenById(payload.jti);
        if (!dbToken)
            throw (0, errors_1.unauthorized)("Invalid refresh token.");
        if (dbToken.revoked_at)
            throw (0, errors_1.unauthorized)("Refresh token revoked.");
        if (new Date(dbToken.expires_at).getTime() < Date.now())
            throw (0, errors_1.unauthorized)("Refresh token expired.");
        // verify hash matches
        const tokenHash = crypto_1.default.createHash("sha256").update(params.refreshToken).digest("hex");
        if (tokenHash !== dbToken.token_hash)
            throw (0, errors_1.unauthorized)("Refresh token mismatch.");
        // rotation: revoke old token, issue new token
        await auth_repository_1.AuthRepository.revokeRefreshToken(payload.jti);
        const user = await auth_repository_1.AuthRepository.getUserById(payload.sub);
        if (!user)
            throw (0, errors_1.unauthorized)("User not found.");
        if (user.status !== "ACTIVE")
            throw (0, errors_1.forbidden)("User is not active.");
        const refreshTtlDays = env_1.env.REFRESH_TOKEN_TTL_DAYS;
        const refreshExpiresAt = new Date(Date.now() + refreshTtlDays * 24 * 60 * 60 * 1000);
        const inserted = await auth_repository_1.AuthRepository.createRefreshToken({
            userId: user.id,
            tokenHash: "PLACEHOLDER",
            expiresAt: refreshExpiresAt,
            deviceId: null
        });
        const newRefreshToken = (0, jwt_1.signRefreshToken)({
            sub: user.id,
            societyId: user.society_id,
            jti: inserted.id
        });
        const newHash = crypto_1.default.createHash("sha256").update(newRefreshToken).digest("hex");
        const { pool } = await Promise.resolve().then(() => __importStar(require("../../config/db")));
        await pool.query(`UPDATE refresh_tokens SET token_hash = $1 WHERE id = $2`, [newHash, inserted.id]);
        const newAccessToken = (0, jwt_1.signAccessToken)({
            sub: user.id,
            societyId: user.society_id,
            role: user.role
        });
        return { accessToken: newAccessToken, refreshToken: newRefreshToken };
    }
    static async logout(params) {
        const payload = (0, jwt_1.verifyRefreshToken)(params.refreshToken);
        await auth_repository_1.AuthRepository.revokeRefreshToken(payload.jti);
        return { ok: true };
    }
}
exports.AuthService = AuthService;

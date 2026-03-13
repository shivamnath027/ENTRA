"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAuth = requireAuth;
const errors_1 = require("../common/errors");
const jwt_1 = require("../modules/auth/jwt");
function requireAuth(req, _res, next) {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer "))
        return next((0, errors_1.unauthorized)("Missing Authorization header."));
    const token = header.slice("Bearer ".length).trim();
    try {
        const payload = (0, jwt_1.verifyAccessToken)(token);
        req.user = { id: payload.sub, societyId: payload.societyId, role: payload.role };
        next();
    }
    catch {
        next((0, errors_1.unauthorized)("Invalid or expired token."));
    }
}

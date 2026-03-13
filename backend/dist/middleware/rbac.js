"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireRoles = requireRoles;
const errors_1 = require("../common/errors");
function requireRoles(...allowed) {
    return (req, _res, next) => {
        const role = req.user?.role;
        if (!role || !allowed.includes(role))
            return next((0, errors_1.forbidden)("Insufficient permissions."));
        next();
    };
}

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateBody = void 0;
const errors_1 = require("../common/errors");
const validateBody = (schema) => (req, _res, next) => {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
        return next((0, errors_1.badRequest)(parsed.error.issues.map(i => i.message).join(", ")));
    }
    req.body = parsed.data;
    next();
};
exports.validateBody = validateBody;

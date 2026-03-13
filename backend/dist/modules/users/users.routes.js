"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.usersRoutes = void 0;
const express_1 = require("express");
const auth_1 = require("../../middleware/auth");
exports.usersRoutes = (0, express_1.Router)();
exports.usersRoutes.get("/me", auth_1.requireAuth, (req, res) => {
    res.json({ ok: true, user: req.user });
});

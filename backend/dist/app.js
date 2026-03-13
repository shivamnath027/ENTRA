"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const auth_routes_1 = require("./modules/auth/auth.routes");
const users_routes_1 = require("./modules/users/users.routes");
const visitors_routes_1 = require("./modules/visitors/visitors.routes");
const vehicles_routes_1 = require("./modules/vehicles/vehicles.routes");
const notifications_routes_1 = require("./modules/notifications/notifications.routes");
const notices_routes_1 = require("./modules/notices/notices.routes");
const billing_routes_1 = require("./modules/billing/billing.routes");
const helpdesk_routes_1 = require("./modules/helpdesk/helpdesk.routes");
const admin_routes_1 = require("./modules/admin/admin.routes");
exports.app = (0, express_1.default)();
exports.app.use((0, cors_1.default)());
exports.app.use(express_1.default.json());
exports.app.get("/health", (_req, res) => res.json({ ok: true }));
exports.app.use("/api/auth", auth_routes_1.authRoutes);
exports.app.use("/api", users_routes_1.usersRoutes);
exports.app.use("/api/visitors", visitors_routes_1.visitorsRoutes);
exports.app.use("/api/notifications", notifications_routes_1.notificationsRoutes);
exports.app.use("/api/notices", notices_routes_1.noticesRoutes);
exports.app.use("/api/vehicles", vehicles_routes_1.vehiclesRoutes);
exports.app.use("/api/helpdesk", helpdesk_routes_1.helpdeskRoutes);
exports.app.use("/api/billing", billing_routes_1.billingRoutes);
exports.app.use("/api/admin", admin_routes_1.adminRoutes);
// TODO: app.use("/api/users", usersRoutes);
// TODO: app.use("/api/visitors", visitorsRoutes);
exports.app.use((err, _req, res, _next) => {
    const status = err.statusCode ?? 500;
    res.status(status).json({
        error: err.message ?? "Internal Server Error"
    });
});

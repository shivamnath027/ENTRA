import express from "express";
import cors from "cors";

import { authRoutes } from "./modules/auth/auth.routes";
import { usersRoutes } from "./modules/users/users.routes";
import { visitorsRoutes } from "./modules/visitors/visitors.routes";
import { vehiclesRoutes } from "./modules/vehicles/vehicles.routes";
import { notificationsRoutes } from "./modules/notifications/notifications.routes";
import { noticesRoutes } from "./modules/notices/notices.routes";
import { billingRoutes } from "./modules/billing/billing.routes";
import { helpdeskRoutes } from "./modules/helpdesk/helpdesk.routes";
import { adminRoutes } from "./modules/admin/admin.routes";

export const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => res.json({ ok: true }));

app.use("/api/auth", authRoutes);
app.use("/api", usersRoutes);
app.use("/api/visitors", visitorsRoutes);
app.use("/api/notifications", notificationsRoutes);
app.use("/api/notices", noticesRoutes);
app.use("/api/vehicles", vehiclesRoutes);
app.use("/api/helpdesk", helpdeskRoutes);
app.use("/api/billing", billingRoutes);
app.use("/api/admin", adminRoutes);
// TODO: app.use("/api/users", usersRoutes);
// TODO: app.use("/api/visitors", visitorsRoutes);

app.use((err: any, _req: any, res: any, _next: any) => {
  const status = err.statusCode ?? 500;
  res.status(status).json({
    error: err.message ?? "Internal Server Error"
  });
});

import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import { requireRoles } from "../../middleware/rbac";
import { validateBody } from "../../middleware/validate";
import { BillingController } from "./billing.controller";
import {
  createBillSchema,
  bulkCreateBillsSchema,
  initiatePaymentSchema,
  confirmPaymentSchema
} from "./billing.schemas";

export const billingRoutes = Router();

billingRoutes.post(
  "/bills",
  requireAuth,
  requireRoles("ADMIN"),
  validateBody(createBillSchema),
  BillingController.createBill
);

billingRoutes.post(
  "/bills/bulk",
  requireAuth,
  requireRoles("ADMIN"),
  validateBody(bulkCreateBillsSchema),
  BillingController.bulkCreate
);

billingRoutes.get(
  "/bills",
  requireAuth,
  requireRoles("ADMIN", "RESIDENT"),
  BillingController.listBills
);

billingRoutes.post(
  "/payments/initiate",
  requireAuth,
  requireRoles("RESIDENT"),
  validateBody(initiatePaymentSchema),
  BillingController.initiatePayment
);

billingRoutes.post(
  "/payments/confirm",
  requireAuth,
  requireRoles("RESIDENT", "ADMIN"),
  validateBody(confirmPaymentSchema),
  BillingController.confirmPayment
);

billingRoutes.get(
  "/ledger",
  requireAuth,
  requireRoles("ADMIN"),
  BillingController.ledger
);

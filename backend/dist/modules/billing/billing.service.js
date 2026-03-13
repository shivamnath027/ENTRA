"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BillingService = void 0;
const errors_1 = require("../../common/errors");
const billing_repository_1 = require("./billing.repository");
class BillingService {
    static async createBill(params) {
        if (params.role !== "ADMIN")
            throw (0, errors_1.forbidden)("Only admins can create bills.");
        if (params.body.billPeriodStart > params.body.billPeriodEnd) {
            throw (0, errors_1.badRequest)("billPeriodStart must be <= billPeriodEnd");
        }
        return billing_repository_1.BillingRepository.createBill({
            societyId: params.societyId,
            flatId: params.body.flatId,
            createdByUserId: params.userId,
            billPeriodStart: params.body.billPeriodStart,
            billPeriodEnd: params.body.billPeriodEnd,
            dueDate: params.body.dueDate,
            amount: params.body.amount
        });
    }
    static async bulkCreate(params) {
        if (params.role !== "ADMIN")
            throw (0, errors_1.forbidden)("Only admins can bulk create bills.");
        if (params.body.billPeriodStart > params.body.billPeriodEnd) {
            throw (0, errors_1.badRequest)("billPeriodStart must be <= billPeriodEnd");
        }
        return billing_repository_1.BillingRepository.createBillsBulk({
            societyId: params.societyId,
            flatIds: params.body.flatIds,
            createdByUserId: params.userId,
            billPeriodStart: params.body.billPeriodStart,
            billPeriodEnd: params.body.billPeriodEnd,
            dueDate: params.body.dueDate,
            amount: params.body.amount
        });
    }
    static async listBills(params) {
        if (params.role === "RESIDENT") {
            if (!params.flatId)
                throw (0, errors_1.badRequest)("flatId required.");
            const ok = await billing_repository_1.BillingRepository.residentHasFlatAccess(params.userId, params.flatId);
            if (!ok)
                throw (0, errors_1.forbidden)("You do not belong to this flat.");
            return billing_repository_1.BillingRepository.listBills({
                societyId: params.societyId,
                flatId: params.flatId,
                status: params.status ?? null,
                limit: params.limit,
                offset: params.offset
            });
        }
        if (params.role === "ADMIN") {
            return billing_repository_1.BillingRepository.listBills({
                societyId: params.societyId,
                flatId: params.flatId ?? null,
                status: params.status ?? null,
                limit: params.limit,
                offset: params.offset
            });
        }
        throw (0, errors_1.forbidden)("Guards cannot view bills.");
    }
    static async initiatePayment(params) {
        if (params.role !== "RESIDENT")
            throw (0, errors_1.forbidden)("Only residents can pay.");
        const bill = await billing_repository_1.BillingRepository.getBillById(params.body.billId);
        if (!bill)
            throw (0, errors_1.notFound)("Bill not found.");
        if (bill.society_id !== params.societyId)
            throw (0, errors_1.forbidden)("Cross-society denied.");
        const ok = await billing_repository_1.BillingRepository.residentHasFlatAccess(params.userId, bill.flat_id);
        if (!ok)
            throw (0, errors_1.forbidden)("You do not belong to this flat.");
        // Payment amount rule: allow full or partial, but must be <= pending
        const paid = await billing_repository_1.BillingRepository.sumSuccessfulPaymentsForBill(bill.id);
        const pending = Number(bill.amount) - paid;
        if (params.body.amount > pending + 0.0001)
            throw (0, errors_1.badRequest)("Amount exceeds pending.");
        if (params.body.amount <= 0)
            throw (0, errors_1.badRequest)("Amount must be > 0.");
        // Mock provider
        const provider = "MOCK_GATEWAY";
        const payment = await billing_repository_1.BillingRepository.createPayment({
            societyId: params.societyId,
            billId: bill.id,
            paidByUserId: params.userId,
            amount: params.body.amount,
            method: params.body.method,
            provider
        });
        // Return a fake “payment session” object
        return {
            paymentId: payment.id,
            provider,
            paymentUrl: `https://mock-gateway.local/pay?paymentId=${payment.id}`, // for UI
            status: payment.status
        };
    }
    static async confirmPayment(params) {
        // For MVP: allow resident or admin to confirm
        if (params.role !== "RESIDENT" && params.role !== "ADMIN")
            throw (0, errors_1.forbidden)("Not allowed.");
        const payment = await billing_repository_1.BillingRepository.getPaymentById(params.body.paymentId);
        if (!payment)
            throw (0, errors_1.notFound)("Payment not found.");
        if (payment.society_id !== params.societyId)
            throw (0, errors_1.forbidden)("Cross-society denied.");
        // confirm
        const updated = await billing_repository_1.BillingRepository.confirmPayment({
            paymentId: payment.id,
            status: params.body.status,
            providerTxnId: params.body.providerTxnId ?? null
        });
        // update bill status if success
        if (updated.status === "SUCCESS") {
            const bill = await billing_repository_1.BillingRepository.getBillById(updated.bill_id);
            if (!bill)
                throw (0, errors_1.notFound)("Bill not found.");
            const paid = await billing_repository_1.BillingRepository.sumSuccessfulPaymentsForBill(bill.id);
            const pending = Number(bill.amount) - paid;
            if (pending <= 0.0001) {
                await billing_repository_1.BillingRepository.updateBillStatus(bill.id, "PAID");
            }
            else if (paid > 0) {
                await billing_repository_1.BillingRepository.updateBillStatus(bill.id, "PARTIALLY_PAID");
            }
        }
        return updated;
    }
    static async ledger(params) {
        if (params.role !== "ADMIN")
            throw (0, errors_1.forbidden)("Only admins can view ledger.");
        return billing_repository_1.BillingRepository.ledger({ societyId: params.societyId, from: params.from ?? null, to: params.to ?? null });
    }
}
exports.BillingService = BillingService;

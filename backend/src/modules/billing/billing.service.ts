import { badRequest, forbidden, notFound } from "../../common/errors";
import { UserRole } from "../auth/auth.types";
import { BillingRepository } from "./billing.repository";

export class BillingService {
  static async createBill(params: { societyId: string; userId: string; role: UserRole; body: any }) {
    if (params.role !== "ADMIN") throw forbidden("Only admins can create bills.");

    if (params.body.billPeriodStart > params.body.billPeriodEnd) {
      throw badRequest("billPeriodStart must be <= billPeriodEnd");
    }
    return BillingRepository.createBill({
      societyId: params.societyId,
      flatId: params.body.flatId,
      createdByUserId: params.userId,
      billPeriodStart: params.body.billPeriodStart,
      billPeriodEnd: params.body.billPeriodEnd,
      dueDate: params.body.dueDate,
      amount: params.body.amount
    });
  }

  static async bulkCreate(params: { societyId: string; userId: string; role: UserRole; body: any }) {
    if (params.role !== "ADMIN") throw forbidden("Only admins can bulk create bills.");
    if (params.body.billPeriodStart > params.body.billPeriodEnd) {
      throw badRequest("billPeriodStart must be <= billPeriodEnd");
    }
    return BillingRepository.createBillsBulk({
      societyId: params.societyId,
      flatIds: params.body.flatIds,
      createdByUserId: params.userId,
      billPeriodStart: params.body.billPeriodStart,
      billPeriodEnd: params.body.billPeriodEnd,
      dueDate: params.body.dueDate,
      amount: params.body.amount
    });
  }

  static async listBills(params: {
    societyId: string;
    userId: string;
    role: UserRole;
    flatId?: string | null;
    status?: string | null;
    limit: number;
    offset: number;
  }) {
    if (params.role === "RESIDENT") {
      if (!params.flatId) throw badRequest("flatId required.");
      const ok = await BillingRepository.residentHasFlatAccess(params.userId, params.flatId);
      if (!ok) throw forbidden("You do not belong to this flat.");
      return BillingRepository.listBills({
        societyId: params.societyId,
        flatId: params.flatId,
        status: params.status ?? null,
        limit: params.limit,
        offset: params.offset
      });
    }

    if (params.role === "ADMIN") {
      return BillingRepository.listBills({
        societyId: params.societyId,
        flatId: params.flatId ?? null,
        status: params.status ?? null,
        limit: params.limit,
        offset: params.offset
      });
    }

    throw forbidden("Guards cannot view bills.");
  }

  static async initiatePayment(params: { societyId: string; userId: string; role: UserRole; body: any }) {
    if (params.role !== "RESIDENT") throw forbidden("Only residents can pay.");
    const bill = await BillingRepository.getBillById(params.body.billId);
    if (!bill) throw notFound("Bill not found.");
    if (bill.society_id !== params.societyId) throw forbidden("Cross-society denied.");

    const ok = await BillingRepository.residentHasFlatAccess(params.userId, bill.flat_id);
    if (!ok) throw forbidden("You do not belong to this flat.");

    // Payment amount rule: allow full or partial, but must be <= pending
    const paid = await BillingRepository.sumSuccessfulPaymentsForBill(bill.id);
    const pending = Number(bill.amount) - paid;
    if (params.body.amount > pending + 0.0001) throw badRequest("Amount exceeds pending.");
    if (params.body.amount <= 0) throw badRequest("Amount must be > 0.");

    // Mock provider
    const provider = "MOCK_GATEWAY";
    const payment = await BillingRepository.createPayment({
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

  static async confirmPayment(params: { societyId: string; userId: string; role: UserRole; body: any }) {
    // For MVP: allow resident or admin to confirm
    if (params.role !== "RESIDENT" && params.role !== "ADMIN") throw forbidden("Not allowed.");

    const payment = await BillingRepository.getPaymentById(params.body.paymentId);
    if (!payment) throw notFound("Payment not found.");
    if (payment.society_id !== params.societyId) throw forbidden("Cross-society denied.");

    // confirm
    const updated = await BillingRepository.confirmPayment({
      paymentId: payment.id,
      status: params.body.status,
      providerTxnId: params.body.providerTxnId ?? null
    });

    // update bill status if success
    if (updated.status === "SUCCESS") {
      const bill = await BillingRepository.getBillById(updated.bill_id);
      if (!bill) throw notFound("Bill not found.");

      const paid = await BillingRepository.sumSuccessfulPaymentsForBill(bill.id);
      const pending = Number(bill.amount) - paid;

      if (pending <= 0.0001) {
        await BillingRepository.updateBillStatus(bill.id, "PAID");
      } else if (paid > 0) {
        await BillingRepository.updateBillStatus(bill.id, "PARTIALLY_PAID");
      }
    }

    return updated;
  }

  static async ledger(params: { societyId: string; role: UserRole; from?: string | null; to?: string | null }) {
    if (params.role !== "ADMIN") throw forbidden("Only admins can view ledger.");
    return BillingRepository.ledger({ societyId: params.societyId, from: params.from ?? null, to: params.to ?? null });
  }
}

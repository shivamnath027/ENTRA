"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BillingRepository = void 0;
const db_1 = require("../../config/db");
class BillingRepository {
    static async residentHasFlatAccess(userId, flatId) {
        const r = await db_1.pool.query(`SELECT 1 FROM resident_profiles WHERE user_id=$1 AND flat_id=$2 LIMIT 1`, [userId, flatId]);
        return (r.rowCount ?? 0) > 0;
    }
    static async createBill(params) {
        const q = `
      INSERT INTO bills
      (society_id, flat_id, bill_period_start, bill_period_end, due_date, amount, status, created_by_user_id)
      VALUES ($1,$2,$3,$4,$5,$6,'DUE',$7)
      RETURNING *
    `;
        const r = await db_1.pool.query(q, [
            params.societyId,
            params.flatId,
            params.billPeriodStart,
            params.billPeriodEnd,
            params.dueDate,
            params.amount,
            params.createdByUserId
        ]);
        return r.rows[0];
    }
    static async createBillsBulk(params) {
        const client = await db_1.pool.connect();
        try {
            await client.query("BEGIN");
            const created = [];
            for (const flatId of params.flatIds) {
                const r = await client.query(`
          INSERT INTO bills
          (society_id, flat_id, bill_period_start, bill_period_end, due_date, amount, status, created_by_user_id)
          VALUES ($1,$2,$3,$4,$5,$6,'DUE',$7)
          ON CONFLICT (flat_id, bill_period_start, bill_period_end) DO NOTHING
          RETURNING *
          `, [
                    params.societyId,
                    flatId,
                    params.billPeriodStart,
                    params.billPeriodEnd,
                    params.dueDate,
                    params.amount,
                    params.createdByUserId
                ]);
                if (r.rows[0])
                    created.push(r.rows[0]);
            }
            await client.query("COMMIT");
            return created;
        }
        catch (e) {
            await client.query("ROLLBACK");
            throw e;
        }
        finally {
            client.release();
        }
    }
    static async listBills(params) {
        const q = `
      SELECT *
      FROM bills
      WHERE society_id=$1
        AND ($2::uuid IS NULL OR flat_id=$2)
        AND ($3::text IS NULL OR status=$3)
      ORDER BY created_at DESC
      LIMIT $4 OFFSET $5
    `;
        const r = await db_1.pool.query(q, [
            params.societyId,
            params.flatId ?? null,
            params.status ?? null,
            params.limit,
            params.offset
        ]);
        return r.rows;
    }
    static async getBillById(billId) {
        const r = await db_1.pool.query(`SELECT * FROM bills WHERE id=$1 LIMIT 1`, [billId]);
        return r.rows[0] ?? null;
    }
    static async sumSuccessfulPaymentsForBill(billId) {
        const r = await db_1.pool.query(`SELECT COALESCE(SUM(amount),0)::numeric AS total
       FROM payments
       WHERE bill_id=$1 AND status='SUCCESS'`, [billId]);
        return Number(r.rows[0]?.total ?? 0);
    }
    static async updateBillStatus(billId, status) {
        const r = await db_1.pool.query(`UPDATE bills SET status=$2, updated_at=now() WHERE id=$1 RETURNING id, status`, [billId, status]);
        return r.rows[0] ?? null;
    }
    static async createPayment(params) {
        const r = await db_1.pool.query(`
      INSERT INTO payments (society_id, bill_id, paid_by_user_id, amount, method, provider, status)
      VALUES ($1,$2,$3,$4,$5,$6,'INITIATED')
      RETURNING *
      `, [params.societyId, params.billId, params.paidByUserId, params.amount, params.method, params.provider]);
        return r.rows[0];
    }
    static async getPaymentById(paymentId) {
        const r = await db_1.pool.query(`SELECT * FROM payments WHERE id=$1 LIMIT 1`, [paymentId]);
        return r.rows[0] ?? null;
    }
    static async confirmPayment(params) {
        const q = `
      UPDATE payments
      SET status=$2,
          provider_txn_id = COALESCE($3, provider_txn_id),
          paid_at = CASE WHEN $2='SUCCESS' THEN COALESCE(paid_at, now()) ELSE paid_at END
      WHERE id=$1
      RETURNING *
    `;
        const r = await db_1.pool.query(q, [params.paymentId, params.status, params.providerTxnId ?? null]);
        return r.rows[0] ?? null;
    }
    static async ledger(params) {
        const q = `
      SELECT
        b.id AS bill_id,
        b.flat_id,
        b.amount AS bill_amount,
        b.status AS bill_status,
        b.bill_period_start,
        b.bill_period_end,
        b.due_date,
        COALESCE(SUM(CASE WHEN p.status='SUCCESS' THEN p.amount ELSE 0 END),0)::numeric AS paid_amount,
        (b.amount - COALESCE(SUM(CASE WHEN p.status='SUCCESS' THEN p.amount ELSE 0 END),0))::numeric AS pending_amount
      FROM bills b
      LEFT JOIN payments p ON p.bill_id = b.id
      WHERE b.society_id=$1
        AND ($2::date IS NULL OR b.bill_period_start >= $2)
        AND ($3::date IS NULL OR b.bill_period_end <= $3)
      GROUP BY b.id
      ORDER BY b.created_at DESC
      LIMIT 500
    `;
        const r = await db_1.pool.query(q, [params.societyId, params.from ?? null, params.to ?? null]);
        return r.rows;
    }
}
exports.BillingRepository = BillingRepository;

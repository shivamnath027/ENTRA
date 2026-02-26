import { pool } from "../../config/db";

export class AdminRepository {
  static async kpis(societyId: string) {
    // Using SELECT aggregates is OK (not RETURNING)
    const q = `
      WITH
      visitors_today AS (
        SELECT COUNT(*)::int AS c
        FROM visitor_entries
        WHERE society_id=$1 AND created_at::date = now()::date
      ),
      visitors_in_now AS (
        SELECT COUNT(*)::int AS c
        FROM visitor_entries
        WHERE society_id=$1 AND status='IN'
      ),
      complaints_open AS (
        SELECT COUNT(*)::int AS c
        FROM complaint_tickets
        WHERE society_id=$1 AND status IN ('OPEN','IN_PROGRESS')
      ),
      complaints_overdue AS (
        SELECT COUNT(*)::int AS c
        FROM complaint_tickets
        WHERE society_id=$1
          AND status IN ('OPEN','IN_PROGRESS')
          AND sla_due_at IS NOT NULL
          AND sla_due_at < now()
      ),
      bills_due AS (
        SELECT COUNT(*)::int AS c
        FROM bills
        WHERE society_id=$1 AND status IN ('DUE','PARTIALLY_PAID','OVERDUE')
      ),
      bills_paid_this_month AS (
        SELECT COUNT(*)::int AS c
        FROM bills
        WHERE society_id=$1
          AND status='PAID'
          AND date_trunc('month', updated_at) = date_trunc('month', now())
      )
      SELECT
        (SELECT c FROM visitors_today) AS visitors_today,
        (SELECT c FROM visitors_in_now) AS visitors_in_now,
        (SELECT c FROM complaints_open) AS complaints_open,
        (SELECT c FROM complaints_overdue) AS complaints_overdue,
        (SELECT c FROM bills_due) AS bills_due,
        (SELECT c FROM bills_paid_this_month) AS bills_paid_this_month
    `;
    const r = await pool.query(q, [societyId]);
    return r.rows[0];
  }

  static async listUsers(params: {
    societyId: string;
    role?: string | null;
    status?: string | null;
    limit: number;
    offset: number;
  }) {
    const q = `
      SELECT id, society_id, full_name, phone, email, role, status, last_login_at, created_at
      FROM users
      WHERE society_id=$1
        AND ($2::text IS NULL OR role=$2)
        AND ($3::text IS NULL OR status=$3)
      ORDER BY created_at DESC
      LIMIT $4 OFFSET $5
    `;
    const r = await pool.query(q, [params.societyId, params.role ?? null, params.status ?? null, params.limit, params.offset]);
    return r.rows;
  }

  static async createUser(params: {
    societyId: string;
    fullName: string;
    phone: string;
    email?: string | null;
    role: "RESIDENT" | "GUARD" | "ADMIN";
    status?: "ACTIVE" | "INVITED";
  }) {
    const q = `
      INSERT INTO users (society_id, full_name, phone, email, role, status)
      VALUES ($1,$2,$3,$4,$5,$6)
      RETURNING id, society_id, full_name, phone, email, role, status, created_at
    `;
    const r = await pool.query(q, [
      params.societyId,
      params.fullName,
      params.phone,
      params.email ?? null,
      params.role,
      params.status ?? "INVITED"
    ]);
    return r.rows[0];
  }

  static async updateUser(params: { societyId: string; userId: string; patch: any }) {
    const allowed: Array<{ key: string; col: string }> = [
      { key: "fullName", col: "full_name" },
      { key: "email", col: "email" },
      { key: "status", col: "status" }
    ];
    const sets: string[] = [];
    const vals: any[] = [params.userId, params.societyId];
    let idx = 3;

    for (const f of allowed) {
      if (params.patch[f.key] !== undefined) {
        sets.push(`${f.col} = $${idx++}`);
        vals.push(params.patch[f.key]);
      }
    }
    if (!sets.length) return null;

    const q = `
      UPDATE users
      SET ${sets.join(", ")}, updated_at=now()
      WHERE id=$1 AND society_id=$2
      RETURNING id, full_name, phone, email, role, status, updated_at
    `;
    const r = await pool.query(q, vals);
    return r.rows[0] ?? null;
  }

  // Blocks/Flats basic CRUD
  static async listBlocks(societyId: string) {
    const r = await pool.query(`SELECT * FROM blocks WHERE society_id=$1 ORDER BY name`, [societyId]);
    return r.rows;
  }

  static async createBlock(societyId: string, name: string) {
    const r = await pool.query(
      `INSERT INTO blocks (society_id, name) VALUES ($1,$2) RETURNING *`,
      [societyId, name]
    );
    return r.rows[0];
  }

  static async listFlats(params: { societyId: string; blockId?: string | null }) {
    const q = `
      SELECT f.*
      FROM flats f
      JOIN blocks b ON b.id = f.block_id
      WHERE b.society_id=$1
        AND ($2::uuid IS NULL OR f.block_id=$2)
      ORDER BY f.flat_number
    `;
    const r = await pool.query(q, [params.societyId, params.blockId ?? null]);
    return r.rows;
  }

  static async createFlat(params: { societyId: string; blockId: string; flatNumber: string; floor?: number | null }) {
    // ensure block belongs to society
    const b = await pool.query(`SELECT 1 FROM blocks WHERE id=$1 AND society_id=$2`, [params.blockId, params.societyId]);
    if (!b.rowCount) return null;

    const r = await pool.query(
      `INSERT INTO flats (block_id, flat_number, floor) VALUES ($1,$2,$3) RETURNING *`,
      [params.blockId, params.flatNumber, params.floor ?? null]
    );
    return r.rows[0];
  }
}

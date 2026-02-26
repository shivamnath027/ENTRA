import { pool } from "../../config/db";

export class HelpdeskRepository {
  static async residentHasFlatAccess(userId: string, flatId: string): Promise<boolean> {
    const r = await pool.query(
      `SELECT 1 FROM resident_profiles WHERE user_id=$1 AND flat_id=$2 LIMIT 1`,
      [userId, flatId]
    );
    return (r.rowCount ?? 0) > 0;
  }

  static async createTicket(params: {
    societyId: string;
    flatId: string;
    createdByUserId: string;
    type: string;
    priority: string;
    description: string;
    slaDueAt: Date;
  }) {
    const q = `
      INSERT INTO complaint_tickets
      (society_id, flat_id, created_by_user_id, type, priority, description, status, sla_due_at)
      VALUES ($1,$2,$3,$4,$5,$6,'OPEN',$7)
      RETURNING *
    `;
    const r = await pool.query(q, [
      params.societyId,
      params.flatId,
      params.createdByUserId,
      params.type,
      params.priority,
      params.description,
      params.slaDueAt
    ]);
    return r.rows[0];
  }

  static async getTicketById(ticketId: string) {
    const r = await pool.query(`SELECT * FROM complaint_tickets WHERE id=$1 LIMIT 1`, [ticketId]);
    return r.rows[0] ?? null;
  }

  static async listTicketsForFlat(params: {
    societyId: string;
    flatId: string;
    status?: string | null;
    limit: number;
    offset: number;
  }) {
    const q = `
      SELECT *
      FROM complaint_tickets
      WHERE society_id=$1 AND flat_id=$2
        AND ($3::text IS NULL OR status=$3)
      ORDER BY created_at DESC
      LIMIT $4 OFFSET $5
    `;
    const r = await pool.query(q, [params.societyId, params.flatId, params.status ?? null, params.limit, params.offset]);
    return r.rows;
  }

  static async listTicketsForSociety(params: {
    societyId: string;
    status?: string | null;
    priority?: string | null;
    type?: string | null;
    overdue?: boolean | null;
    limit: number;
    offset: number;
  }) {
    const q = `
      SELECT *
      FROM complaint_tickets
      WHERE society_id=$1
        AND ($2::text IS NULL OR status=$2)
        AND ($3::text IS NULL OR priority=$3)
        AND ($4::text IS NULL OR type=$4)
        AND (
          $5::boolean IS NULL OR
          ($5 = true AND status IN ('OPEN','IN_PROGRESS') AND sla_due_at IS NOT NULL AND sla_due_at < now()) OR
          ($5 = false)
        )
      ORDER BY
        (CASE WHEN status IN ('OPEN','IN_PROGRESS') AND sla_due_at IS NOT NULL AND sla_due_at < now() THEN 0 ELSE 1 END),
        created_at DESC
      LIMIT $6 OFFSET $7
    `;
    const r = await pool.query(q, [
      params.societyId,
      params.status ?? null,
      params.priority ?? null,
      params.type ?? null,
      params.overdue ?? null,
      params.limit,
      params.offset
    ]);
    return r.rows;
  }

  static async addComment(params: { ticketId: string; authorUserId: string; message: string }) {
    const q = `
      INSERT INTO complaint_comments (ticket_id, author_user_id, message)
      VALUES ($1,$2,$3)
      RETURNING *
    `;
    const r = await pool.query(q, [params.ticketId, params.authorUserId, params.message]);
    return r.rows[0];
  }

  static async listComments(ticketId: string, limit: number) {
    const q = `
      SELECT *
      FROM complaint_comments
      WHERE ticket_id=$1
      ORDER BY created_at ASC
      LIMIT $2
    `;
    const r = await pool.query(q, [ticketId, limit]);
    return r.rows;
  }

  static async assignTicket(params: { societyId: string; ticketId: string; assignedToUserId: string }) {
    const q = `
      UPDATE complaint_tickets
      SET assigned_to_user_id=$3, updated_at=now()
      WHERE id=$1 AND society_id=$2
      RETURNING id, assigned_to_user_id, status
    `;
    const r = await pool.query(q, [params.ticketId, params.societyId, params.assignedToUserId]);
    return r.rows[0] ?? null;
  }

  static async updateStatus(params: { societyId: string; ticketId: string; status: string }) {
    const q = `
      UPDATE complaint_tickets
      SET status=$3,
          resolved_at = CASE WHEN $3 IN ('RESOLVED','CLOSED') THEN COALESCE(resolved_at, now()) ELSE NULL END,
          updated_at=now()
      WHERE id=$1 AND society_id=$2
      RETURNING id, status, resolved_at
    `;
    const r = await pool.query(q, [params.ticketId, params.societyId, params.status]);
    return r.rows[0] ?? null;
  }

  static async summary(params: { societyId: string }) {
    const q = `
      SELECT
        COUNT(*) FILTER (WHERE status='OPEN')::int AS open,
        COUNT(*) FILTER (WHERE status='IN_PROGRESS')::int AS in_progress,
        COUNT(*) FILTER (WHERE status='RESOLVED')::int AS resolved,
        COUNT(*) FILTER (WHERE status='CLOSED')::int AS closed,
        COUNT(*) FILTER (
          WHERE status IN ('OPEN','IN_PROGRESS') AND sla_due_at IS NOT NULL AND sla_due_at < now()
        )::int AS overdue
      FROM complaint_tickets
      WHERE society_id=$1
    `;
    const r = await pool.query(q, [params.societyId]);
    return r.rows[0];
  }
}

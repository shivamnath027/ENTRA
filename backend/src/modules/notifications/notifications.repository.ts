import { pool } from "../../config/db";

export class NotificationsRepository {
  static async enqueue(params: {
    societyId: string;
    userId: string;
    type: string;
    title: string;
    body: string;
    channel: "IN_APP" | "PUSH" | "SMS" | "EMAIL";
    meta?: any;
  }) {
    const q = `
      INSERT INTO notifications (society_id, user_id, type, title, body, channel, status, meta)
      VALUES ($1,$2,$3,$4,$5,$6,'QUEUED',$7)
      RETURNING id, created_at
    `;
    const r = await pool.query(q, [
      params.societyId,
      params.userId,
      params.type,
      params.title,
      params.body,
      params.channel,
      params.meta ?? null
    ]);
    return r.rows[0];
  }

  static async listForUser(params: { userId: string; limit: number; offset: number; unreadOnly: boolean }) {
    const q = `
      SELECT id, type, title, body, channel, status, meta, created_at, sent_at, read_at
      FROM notifications
      WHERE user_id = $1
        AND ($4::boolean = false OR read_at IS NULL)
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `;
    const r = await pool.query(q, [params.userId, params.limit, params.offset, params.unreadOnly]);
    return r.rows;
  }

  static async markRead(params: { userId: string; notificationId: string }) {
    const q = `
      UPDATE notifications
      SET read_at = COALESCE(read_at, now())
      WHERE id = $1 AND user_id = $2
      RETURNING id, read_at
    `;
    const r = await pool.query(q, [params.notificationId, params.userId]);
    return r.rows[0] ?? null;
  }

  static async markAllRead(userId: string) {
    const q = `
      UPDATE notifications
      SET read_at = COALESCE(read_at, now())
      WHERE user_id = $1 AND read_at IS NULL
    `;
    const r = await pool.query(q, [userId]);
    return { updated_count: r.rowCount ?? 0 };
  }

  static async getResidentsForFlat(flatId: string) {
    const q = `
      SELECT u.id, u.full_name
      FROM resident_profiles rp
      JOIN users u ON u.id = rp.user_id
      WHERE rp.flat_id = $1 AND u.status = 'ACTIVE'
    `;
    const r = await pool.query(q, [flatId]);
    return r.rows;
  }
}

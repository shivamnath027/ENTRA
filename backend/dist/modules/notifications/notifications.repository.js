"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationsRepository = void 0;
const db_1 = require("../../config/db");
class NotificationsRepository {
    static async enqueue(params) {
        const q = `
      INSERT INTO notifications (society_id, user_id, type, title, body, channel, status, meta)
      VALUES ($1,$2,$3,$4,$5,$6,'QUEUED',$7)
      RETURNING id, created_at
    `;
        const r = await db_1.pool.query(q, [
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
    static async listForUser(params) {
        const q = `
      SELECT id, type, title, body, channel, status, meta, created_at, sent_at, read_at
      FROM notifications
      WHERE user_id = $1
        AND ($4::boolean = false OR read_at IS NULL)
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `;
        const r = await db_1.pool.query(q, [params.userId, params.limit, params.offset, params.unreadOnly]);
        return r.rows;
    }
    static async markRead(params) {
        const q = `
      UPDATE notifications
      SET read_at = COALESCE(read_at, now())
      WHERE id = $1 AND user_id = $2
      RETURNING id, read_at
    `;
        const r = await db_1.pool.query(q, [params.notificationId, params.userId]);
        return r.rows[0] ?? null;
    }
    static async markAllRead(userId) {
        const q = `
      UPDATE notifications
      SET read_at = COALESCE(read_at, now())
      WHERE user_id = $1 AND read_at IS NULL
    `;
        const r = await db_1.pool.query(q, [userId]);
        return { updated_count: r.rowCount ?? 0 };
    }
    static async getResidentsForFlat(flatId) {
        const q = `
      SELECT u.id, u.full_name
      FROM resident_profiles rp
      JOIN users u ON u.id = rp.user_id
      WHERE rp.flat_id = $1 AND u.status = 'ACTIVE'
    `;
        const r = await db_1.pool.query(q, [flatId]);
        return r.rows;
    }
}
exports.NotificationsRepository = NotificationsRepository;

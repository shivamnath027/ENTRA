"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NoticesRepository = void 0;
const db_1 = require("../../config/db");
class NoticesRepository {
    static async create(params) {
        const q = `
      INSERT INTO notices (society_id, posted_by_user_id, title, content, pinned, visible_from, visible_until)
      VALUES ($1,$2,$3,$4,$5,$6,$7)
      RETURNING *
    `;
        const r = await db_1.pool.query(q, [
            params.societyId,
            params.postedByUserId,
            params.title,
            params.content,
            params.pinned,
            params.visibleFrom ?? null,
            params.visibleUntil ?? null
        ]);
        return r.rows[0];
    }
    static async update(params) {
        const allowed = [
            { key: "title", col: "title" },
            { key: "content", col: "content" },
            { key: "pinned", col: "pinned" },
            { key: "visibleFrom", col: "visible_from" },
            { key: "visibleUntil", col: "visible_until" }
        ];
        const sets = [];
        const vals = [params.noticeId, params.societyId];
        let idx = 3;
        for (const f of allowed) {
            if (params.patch[f.key] !== undefined) {
                sets.push(`${f.col} = $${idx++}`);
                vals.push(params.patch[f.key]);
            }
        }
        if (!sets.length) {
            const r0 = await db_1.pool.query(`SELECT * FROM notices WHERE id=$1 AND society_id=$2`, [params.noticeId, params.societyId]);
            return r0.rows[0] ?? null;
        }
        const q = `
      UPDATE notices
      SET ${sets.join(", ")}, updated_at=now()
      WHERE id=$1 AND society_id=$2
      RETURNING *
    `;
        const r = await db_1.pool.query(q, vals);
        return r.rows[0] ?? null;
    }
    static async delete(params) {
        const r = await db_1.pool.query(`DELETE FROM notices WHERE id=$1 AND society_id=$2`, [params.noticeId, params.societyId]);
        return (r.rowCount ?? 0) > 0;
    }
    static async list(params) {
        const q = `
      SELECT id, title, content, pinned, visible_from, visible_until, created_at, updated_at, posted_by_user_id
      FROM notices
      WHERE society_id = $1
        AND (visible_from IS NULL OR visible_from <= now())
        AND (visible_until IS NULL OR visible_until >= now())
      ORDER BY pinned DESC, created_at DESC
      LIMIT $2 OFFSET $3
    `;
        const r = await db_1.pool.query(q, [params.societyId, params.limit, params.offset]);
        return r.rows;
    }
}
exports.NoticesRepository = NoticesRepository;

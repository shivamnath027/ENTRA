import { pool } from "../../config/db";

export class VisitorsRepository {
  // --- Authorization helpers ---
  static async residentHasFlatAccess(userId: string, flatId: string): Promise<boolean> {
    const q = `SELECT 1 FROM resident_profiles WHERE user_id = $1 AND flat_id = $2 LIMIT 1`;
    const r = await pool.query(q, [userId, flatId]);
    return (r.rowCount ?? 0) > 0;
  }

  static async getVisitorRequestById(id: string) {
    const q = `
      SELECT *
      FROM visitor_requests
      WHERE id = $1
      LIMIT 1
    `;
    const r = await pool.query(q, [id]);
    return r.rows[0] ?? null;
  }

  // --- Resident: create request ---
  static async createVisitorRequest(params: {
    societyId: string;
    flatId: string;
    createdByUserId: string;
    visitorName: string;
    visitorPhone?: string | null;
    vehicleNumber?: string | null;
    purpose?: string | null;
    expectedAt?: Date | null;
    validFrom?: Date | null;
    validUntil?: Date | null;
  }) {
    const q = `
      INSERT INTO visitor_requests
      (society_id, flat_id, created_by_user_id, visitor_name, visitor_phone, vehicle_number, purpose,
       expected_at, valid_from, valid_until, status)
      VALUES
      ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'PENDING')
      RETURNING id, status, created_at
    `;
    const r = await pool.query(q, [
      params.societyId,
      params.flatId,
      params.createdByUserId,
      params.visitorName,
      params.visitorPhone ?? null,
      params.vehicleNumber ?? null,
      params.purpose ?? null,
      params.expectedAt ?? null,
      params.validFrom ?? null,
      params.validUntil ?? null
    ]);
    return r.rows[0];
  }

  static async listVisitorRequestsForFlat(params: {
    societyId: string;
    flatId: string;
    limit: number;
    offset: number;
  }) {
    const q = `
      SELECT id, flat_id, visitor_name, visitor_phone, vehicle_number, purpose, expected_at,
             valid_from, valid_until, status, created_at, approved_at, rejected_reason
      FROM visitor_requests
      WHERE society_id = $1 AND flat_id = $2
      ORDER BY created_at DESC
      LIMIT $3 OFFSET $4
    `;
    const r = await pool.query(q, [params.societyId, params.flatId, params.limit, params.offset]);
    return r.rows;
  }

  // --- Decision on request ---
  static async updateRequestDecision(params: {
    requestId: string;
    status: "APPROVED" | "REJECTED";
    approvedByUserId: string;
    rejectedReason?: string | null;
  }) {
    const q = `
      UPDATE visitor_requests
      SET status = $2,
          approved_by_user_id = $3,
          approved_at = CASE WHEN $2 = 'APPROVED' THEN now() ELSE NULL END,
          rejected_reason = CASE WHEN $2 = 'REJECTED' THEN $4 ELSE NULL END,
          updated_at = now()
      WHERE id = $1
      RETURNING id, status, flat_id, visitor_name, visitor_phone, vehicle_number, purpose
    `;
    const r = await pool.query(q, [
      params.requestId,
      params.status,
      params.approvedByUserId,
      params.rejectedReason ?? null
    ]);
    return r.rows[0] ?? null;
  }

  // --- Guard lists requests ---
  static async listRequestsForSociety(params: {
    societyId: string;
    status?: string | null;
    limit: number;
    offset: number;
  }) {
    const q = `
      SELECT id, flat_id, visitor_name, visitor_phone, vehicle_number, purpose,
             expected_at, status, created_at, valid_from, valid_until
      FROM visitor_requests
      WHERE society_id = $1
        AND ($2::text IS NULL OR status = $2)
      ORDER BY created_at DESC
      LIMIT $3 OFFSET $4
    `;
    const r = await pool.query(q, [params.societyId, params.status ?? null, params.limit, params.offset]);
    return r.rows;
  }

  // --- Gate: create entry (from request or ad-hoc) ---
  static async createEntry(params: {
    societyId: string;
    gateId: string;
    visitorRequestId?: string | null;
    flatId: string;
    visitorName: string;
    visitorPhone?: string | null;
    vehicleNumber?: string | null;
    purpose?: string | null;
    enteredByGuardId: string;
    inPhotoUrl?: string | null;
    status: "WAITING_APPROVAL" | "DENIED" | "IN";
    inAt?: Date | null;
  }) {
    const q = `
      INSERT INTO visitor_entries
      (society_id, gate_id, visitor_request_id, flat_id,
       entered_by_guard_id, visitor_name, visitor_phone, vehicle_number, purpose,
       in_photo_url, status, in_at)
      VALUES
      ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
      RETURNING *
    `;
    const r = await pool.query(q, [
      params.societyId,
      params.gateId,
      params.visitorRequestId ?? null,
      params.flatId,
      params.enteredByGuardId,
      params.visitorName,
      params.visitorPhone ?? null,
      params.vehicleNumber ?? null,
      params.purpose ?? null,
      params.inPhotoUrl ?? null,
      params.status,
      params.inAt ?? null
    ]);
    return r.rows[0];
  }

  static async getEntryById(entryId: string) {
    const q = `SELECT * FROM visitor_entries WHERE id = $1 LIMIT 1`;
    const r = await pool.query(q, [entryId]);
    return r.rows[0] ?? null;
  }

  static async markEntryIn(params: {
    entryId: string;
    guardId: string;
    inPhotoUrl?: string | null;
  }) {
    const q = `
      UPDATE visitor_entries
      SET status = 'IN',
          approved_by_guard_id = $2,
          in_at = COALESCE(in_at, now()),
          in_photo_url = COALESCE($3, in_photo_url),
          updated_at = now()
      WHERE id = $1
      RETURNING *
    `;
    const r = await pool.query(q, [params.entryId, params.guardId, params.inPhotoUrl ?? null]);
    return r.rows[0] ?? null;
  }

  static async markEntryOut(params: {
    entryId: string;
    outPhotoUrl?: string | null;
  }) {
    const q = `
      UPDATE visitor_entries
      SET status = 'OUT',
          out_at = COALESCE(out_at, now()),
          out_photo_url = COALESCE($2, out_photo_url),
          updated_at = now()
      WHERE id = $1
      RETURNING *
    `;
    const r = await pool.query(q, [params.entryId, params.outPhotoUrl ?? null]);
    return r.rows[0] ?? null;
  }

  static async listEntries(params: {
    societyId: string;
    gateId?: string | null;
    flatId?: string | null;
    from?: Date | null;
    to?: Date | null;
    limit: number;
    offset: number;
  }) {
    const q = `
      SELECT *
      FROM visitor_entries
      WHERE society_id = $1
        AND ($2::uuid IS NULL OR gate_id = $2)
        AND ($3::uuid IS NULL OR flat_id = $3)
        AND ($4::timestamptz IS NULL OR created_at >= $4)
        AND ($5::timestamptz IS NULL OR created_at <= $5)
      ORDER BY created_at DESC
      LIMIT $6 OFFSET $7
    `;
    const r = await pool.query(q, [
      params.societyId,
      params.gateId ?? null,
      params.flatId ?? null,
      params.from ?? null,
      params.to ?? null,
      params.limit,
      params.offset
    ]);
    return r.rows;
  }

  // --- Notifications table writes (Observer-style later) ---
  static async enqueueNotification(params: {
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
      RETURNING id
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

import { pool } from "../../config/db";

export class VehiclesRepository {
  static async residentHasFlatAccess(userId: string, flatId: string): Promise<boolean> {
    const r = await pool.query(
      `SELECT 1 FROM resident_profiles WHERE user_id=$1 AND flat_id=$2 LIMIT 1`,
      [userId, flatId]
    );
    return (r.rowCount ?? 0) > 0;
  }

  static async createVehicle(params: {
    societyId: string;
    flatId: string;
    ownerUserId?: string | null;
    vehicleNumber: string;
    vehicleType: string;
    tagType: string;
    tagUid?: string | null;
  }) {
    const q = `
      INSERT INTO vehicles (society_id, flat_id, owner_user_id, vehicle_number, vehicle_type, tag_type, tag_uid, status)
      VALUES ($1,$2,$3,$4,$5,$6,$7,'ACTIVE')
      RETURNING *
    `;
    const r = await pool.query(q, [
      params.societyId,
      params.flatId,
      params.ownerUserId ?? null,
      params.vehicleNumber.toUpperCase(),
      params.vehicleType,
      params.tagType,
      params.tagUid ?? null
    ]);
    return r.rows[0];
  }

  static async listVehicles(params: { societyId: string; flatId?: string | null; limit: number; offset: number }) {
    const q = `
      SELECT *
      FROM vehicles
      WHERE society_id=$1
        AND ($2::uuid IS NULL OR flat_id=$2)
      ORDER BY created_at DESC
      LIMIT $3 OFFSET $4
    `;
    const r = await pool.query(q, [params.societyId, params.flatId ?? null, params.limit, params.offset]);
    return r.rows;
  }

  static async getVehicleById(id: string) {
    const r = await pool.query(`SELECT * FROM vehicles WHERE id=$1 LIMIT 1`, [id]);
    return r.rows[0] ?? null;
  }

  static async updateVehicle(id: string, societyId: string, patch: any) {
    // simple dynamic update (safe allowlist)
    const fields: Array<{ key: string; col: string }> = [
  { key: "vehicleType", col: "vehicle_type" },
  { key: "tagType", col: "tag_type" },
  { key: "tagUid", col: "tag_uid" },
  { key: "status", col: "status" }
];



    const sets: string[] = [];
    const vals: any[] = [id, societyId];
    let idx = 3;

    for (const f of fields) {
      if (patch[f.key] !== undefined) {
        sets.push(`${f.col} = $${idx++}`);
        vals.push(f.key === "tagUid" ? (patch[f.key] ?? null) : patch[f.key]);
      }
    }
    if (!sets.length) return this.getVehicleById(id);

    const q = `
      UPDATE vehicles
      SET ${sets.join(", ")}, updated_at=now()
      WHERE id=$1 AND society_id=$2
      RETURNING *
    `;
    const r = await pool.query(q, vals);
    return r.rows[0] ?? null;
  }

  static async findVehicleByTagOrNumber(params: {
    societyId: string;
    tagUid?: string | null;
    vehicleNumber?: string | null;
  }) {
    const q = `
      SELECT *
      FROM vehicles
      WHERE society_id=$1
        AND status='ACTIVE'
        AND (
          ($2::text IS NOT NULL AND tag_uid=$2)
          OR
          ($3::text IS NOT NULL AND vehicle_number=UPPER($3))
        )
      LIMIT 1
    `;
    const r = await pool.query(q, [params.societyId, params.tagUid ?? null, params.vehicleNumber ?? null]);
    return r.rows[0] ?? null;
  }

  static async getGateControllerByGateId(gateId: string) {
    const r = await pool.query(
      `SELECT * FROM gate_controllers WHERE gate_id=$1 AND status='ACTIVE' LIMIT 1`,
      [gateId]
    );
    return r.rows[0] ?? null;
  }

  static async logAccessEvent(params: {
    societyId: string;
    gateId: string;
    controllerId?: string | null;
    scannedByGuardId?: string | null;
    tagUid?: string | null;
    vehicleNumber?: string | null;
    vehicleId?: string | null;
    flatId?: string | null;
    decision: "ALLOW" | "DENY" | "MANUAL_REVIEW";
    reason: string;
    openedGate: boolean;
  }) {
    const q = `
      INSERT INTO access_events
      (society_id, gate_id, controller_id, scanned_by_guard_id, tag_uid, vehicle_number,
       vehicle_id, flat_id, decision, reason, opened_gate)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
      RETURNING id, created_at
    `;
    const r = await pool.query(q, [
      params.societyId,
      params.gateId,
      params.controllerId ?? null,
      params.scannedByGuardId ?? null,
      params.tagUid ?? null,
      params.vehicleNumber ?? null,
      params.vehicleId ?? null,
      params.flatId ?? null,
      params.decision,
      params.reason,
      params.openedGate
    ]);
    return r.rows[0];
  }

    static async getGuardProfileWithGate(userId: string, societyId: string) {
  const r = await pool.query(
    `
    SELECT
      gp.user_id,
      gp.assigned_gate_id,
      g.name AS gate_name
    FROM guard_profiles gp
    INNER JOIN users u
      ON u.id = gp.user_id
    LEFT JOIN gates g
      ON g.id = gp.assigned_gate_id
    WHERE gp.user_id = $1
      AND u.society_id = $2
    LIMIT 1
    `,
    [userId, societyId]
  );
  return r.rows[0] ?? null;
}
}

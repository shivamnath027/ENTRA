"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VehiclesRepository = void 0;
const db_1 = require("../../config/db");
class VehiclesRepository {
    static async residentHasFlatAccess(userId, flatId) {
        const r = await db_1.pool.query(`SELECT 1 FROM resident_profiles WHERE user_id=$1 AND flat_id=$2 LIMIT 1`, [userId, flatId]);
        return (r.rowCount ?? 0) > 0;
    }
    static async createVehicle(params) {
        const q = `
      INSERT INTO vehicles (society_id, flat_id, owner_user_id, vehicle_number, vehicle_type, tag_type, tag_uid, status)
      VALUES ($1,$2,$3,$4,$5,$6,$7,'ACTIVE')
      RETURNING *
    `;
        const r = await db_1.pool.query(q, [
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
    static async listVehicles(params) {
        const q = `
      SELECT *
      FROM vehicles
      WHERE society_id=$1
        AND ($2::uuid IS NULL OR flat_id=$2)
      ORDER BY created_at DESC
      LIMIT $3 OFFSET $4
    `;
        const r = await db_1.pool.query(q, [params.societyId, params.flatId ?? null, params.limit, params.offset]);
        return r.rows;
    }
    static async getVehicleById(id) {
        const r = await db_1.pool.query(`SELECT * FROM vehicles WHERE id=$1 LIMIT 1`, [id]);
        return r.rows[0] ?? null;
    }
    static async updateVehicle(id, societyId, patch) {
        // simple dynamic update (safe allowlist)
        const fields = [
            { key: "vehicleType", col: "vehicle_type" },
            { key: "tagType", col: "tag_type" },
            { key: "tagUid", col: "tag_uid" },
            { key: "status", col: "status" }
        ];
        const sets = [];
        const vals = [id, societyId];
        let idx = 3;
        for (const f of fields) {
            if (patch[f.key] !== undefined) {
                sets.push(`${f.col} = $${idx++}`);
                vals.push(f.key === "tagUid" ? (patch[f.key] ?? null) : patch[f.key]);
            }
        }
        if (!sets.length)
            return this.getVehicleById(id);
        const q = `
      UPDATE vehicles
      SET ${sets.join(", ")}, updated_at=now()
      WHERE id=$1 AND society_id=$2
      RETURNING *
    `;
        const r = await db_1.pool.query(q, vals);
        return r.rows[0] ?? null;
    }
    static async findVehicleByTagOrNumber(params) {
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
        const r = await db_1.pool.query(q, [params.societyId, params.tagUid ?? null, params.vehicleNumber ?? null]);
        return r.rows[0] ?? null;
    }
    static async getGateControllerByGateId(gateId) {
        const r = await db_1.pool.query(`SELECT * FROM gate_controllers WHERE gate_id=$1 AND status='ACTIVE' LIMIT 1`, [gateId]);
        return r.rows[0] ?? null;
    }
    static async logAccessEvent(params) {
        const q = `
      INSERT INTO access_events
      (society_id, gate_id, controller_id, scanned_by_guard_id, tag_uid, vehicle_number,
       vehicle_id, flat_id, decision, reason, opened_gate)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
      RETURNING id, created_at
    `;
        const r = await db_1.pool.query(q, [
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
}
exports.VehiclesRepository = VehiclesRepository;

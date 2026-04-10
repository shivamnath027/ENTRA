import { pool } from "../../config/db";

export type MeRow = {
  user_id: string;
  full_name: string;
  phone: string;
  email: string | null;
  role: "RESIDENT" | "GUARD" | "ADMIN";
  society_id: string;
  society_name: string;

  resident_flat_id: string | null;
  resident_member_type: "OWNER" | "TENANT" | "FAMILY" | null;
  resident_is_primary: boolean | null;

  flat_id: string | null;
  flat_number: string | null;

  block_id: string | null;
  block_name: string | null;

  guard_user_id: string | null;
  assigned_gate_id: string | null;
  gate_id: string | null;
  gate_name: string | null;
};

export class UsersRepository {
  static async getMeContext(userId: string) {
    const q = `
      SELECT
        u.id AS user_id,
        u.full_name,
        u.phone,
        u.email,
        u.role,
        u.society_id,
        s.name AS society_name,

        rp.flat_id AS resident_flat_id,
        rp.member_type AS resident_member_type,
        rp.is_primary AS resident_is_primary,

        f.id AS flat_id,
        f.flat_number,

        b.id AS block_id,
        b.name AS block_name,

        gp.user_id AS guard_user_id,
        gp.assigned_gate_id AS assigned_gate_id,

        g.id AS gate_id,
        g.name AS gate_name
      FROM users u
      INNER JOIN societies s
        ON s.id = u.society_id
      LEFT JOIN resident_profiles rp
        ON rp.user_id = u.id
      LEFT JOIN flats f
        ON f.id = rp.flat_id
      LEFT JOIN blocks b
        ON b.id = f.block_id
      LEFT JOIN guard_profiles gp
        ON gp.user_id = u.id
      LEFT JOIN gates g
        ON g.id = gp.assigned_gate_id
      WHERE u.id = $1
      LIMIT 1
    `;

    const { rows } = await pool.query<MeRow>(q, [userId]);
    return rows[0] ?? null;
  }
}
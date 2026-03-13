import { pool } from "../config/db";

async function run() {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // ---------- Society ----------
    const societyRes = await client.query(
      `
      INSERT INTO societies (name, address, city, state, pincode)
      VALUES ($1,$2,$3,$4,$5)
      ON CONFLICT DO NOTHING
      RETURNING *
      `,
      [
        "Green Valley Residency",
        "Sector 10",
        "Noida",
        "Uttar Pradesh",
        "201301"
      ]
    );

    let society = societyRes.rows[0];
    if (!society) {
      const existing = await client.query(
        `SELECT * FROM societies WHERE name = $1 LIMIT 1`,
        ["Green Valley Residency"]
      );
      society = existing.rows[0];
    }

    const societyId = society.id;

    // ---------- Block ----------
    const blockRes = await client.query(
      `
      INSERT INTO blocks (society_id, name)
      VALUES ($1,$2)
      ON CONFLICT (society_id, name) DO NOTHING
      RETURNING *
      `,
      [societyId, "A"]
    );

    let block = blockRes.rows[0];
    if (!block) {
      const existing = await client.query(
        `SELECT * FROM blocks WHERE society_id = $1 AND name = $2 LIMIT 1`,
        [societyId, "A"]
      );
      block = existing.rows[0];
    }

    const blockId = block.id;

    // ---------- Flats ----------
    async function ensureFlat(flatNumber: string, floor: number) {
      const res = await client.query(
        `
        INSERT INTO flats (block_id, flat_number, floor)
        VALUES ($1,$2,$3)
        ON CONFLICT (block_id, flat_number) DO NOTHING
        RETURNING *
        `,
        [blockId, flatNumber, floor]
      );

      if (res.rows[0]) return res.rows[0];

      const existing = await client.query(
        `SELECT * FROM flats WHERE block_id = $1 AND flat_number = $2 LIMIT 1`,
        [blockId, flatNumber]
      );
      return existing.rows[0];
    }

    const flat101 = await ensureFlat("101", 1);
    const flat102 = await ensureFlat("102", 1);

    // ---------- Gate ----------
    const gateRes = await client.query(
      `
      INSERT INTO gates (society_id, name, direction)
      VALUES ($1,$2,$3)
      ON CONFLICT DO NOTHING
      RETURNING *
      `,
      [societyId, "Main Gate", "BOTH"]
    );

    let gate = gateRes.rows[0];
    if (!gate) {
      const existing = await client.query(
        `SELECT * FROM gates WHERE society_id = $1 AND name = $2 LIMIT 1`,
        [societyId, "Main Gate"]
      );
      gate = existing.rows[0];
    }

    const gateId = gate.id;

    // ---------- Users ----------
    async function ensureUser(params: {
      fullName: string;
      phone: string;
      email: string | null;
      role: "RESIDENT" | "GUARD" | "ADMIN";
      status?: "ACTIVE" | "INVITED";
    }) {
      const res = await client.query(
        `
        INSERT INTO users (society_id, phone, email, full_name, role, status)
        VALUES ($1,$2,$3,$4,$5,$6)
        ON CONFLICT (society_id, phone) DO NOTHING
        RETURNING *
        `,
        [
          societyId,
          params.phone,
          params.email,
          params.fullName,
          params.role,
          params.status ?? "ACTIVE"
        ]
      );

      if (res.rows[0]) return res.rows[0];

      const existing = await client.query(
        `SELECT * FROM users WHERE society_id = $1 AND phone = $2 LIMIT 1`,
        [societyId, params.phone]
      );
      return existing.rows[0];
    }

    const residentUser = await ensureUser({
      fullName: "Rahul Resident",
      phone: "9999999991",
      email: "resident@test.com",
      role: "RESIDENT",
      status: "ACTIVE"
    });

    const guardUser = await ensureUser({
      fullName: "Gopal Guard",
      phone: "9999999992",
      email: "guard@test.com",
      role: "GUARD",
      status: "ACTIVE"
    });

    const adminUser = await ensureUser({
      fullName: "Amit Admin",
      phone: "9999999993",
      email: "admin@test.com",
      role: "ADMIN",
      status: "ACTIVE"
    });

    // ---------- Resident profile ----------
    await client.query(
      `
      INSERT INTO resident_profiles (user_id, flat_id, member_type, is_primary)
      VALUES ($1,$2,$3,$4)
      ON CONFLICT (user_id) DO NOTHING
      `,
      [residentUser.id, flat101.id, "OWNER", true]
    );

    // ---------- Guard profile ----------
    await client.query(
      `
      INSERT INTO guard_profiles (user_id, employee_code, assigned_gate_id, shift)
      VALUES ($1,$2,$3,$4)
      ON CONFLICT (user_id) DO NOTHING
      `,
      [guardUser.id, "G-001", gateId, "DAY"]
    );

    // ---------- Admin profile ----------
    await client.query(
      `
      INSERT INTO admin_profiles (user_id, admin_type)
      VALUES ($1,$2)
      ON CONFLICT (user_id) DO NOTHING
      `,
      [adminUser.id, "FM"]
    );

    // ---------- Vehicle ----------
    const vehicleRes = await client.query(
      `
      INSERT INTO vehicles (society_id, flat_id, owner_user_id, vehicle_number, vehicle_type, tag_type, tag_uid, status)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
      ON CONFLICT (society_id, vehicle_number) DO NOTHING
      RETURNING *
      `,
      [
        societyId,
        flat101.id,
        residentUser.id,
        "UP16AB1234",
        "CAR",
        "RFID",
        "TAG-RES-101",
        "ACTIVE"
      ]
    );

    let vehicle = vehicleRes.rows[0];
    if (!vehicle) {
      const existing = await client.query(
        `SELECT * FROM vehicles WHERE society_id = $1 AND vehicle_number = $2 LIMIT 1`,
        [societyId, "UP16AB1234"]
      );
      vehicle = existing.rows[0];
    }

    // ---------- Notice ----------
    await client.query(
      `
      INSERT INTO notices (society_id, posted_by_user_id, title, content, pinned)
      VALUES ($1,$2,$3,$4,$5)
      ON CONFLICT DO NOTHING
      `,
      [
        societyId,
        adminUser.id,
        "Water Supply Maintenance",
        "Water will be unavailable from 2 PM to 4 PM today.",
        true
      ]
    );

    // ---------- Bill ----------
    await client.query(
      `
      INSERT INTO bills (
        society_id, flat_id, bill_period_start, bill_period_end, due_date, amount, status, created_by_user_id
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
      ON CONFLICT (flat_id, bill_period_start, bill_period_end) DO NOTHING
      `,
      [
        societyId,
        flat101.id,
        "2026-03-01",
        "2026-03-31",
        "2026-04-10",
        3500,
        "DUE",
        adminUser.id
      ]
    );

    // ---------- Complaint ----------
    await client.query(
      `
      INSERT INTO complaint_tickets (
        society_id, flat_id, created_by_user_id, type, priority, description, status, sla_due_at
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
      ON CONFLICT DO NOTHING
      `,
      [
        societyId,
        flat101.id,
        residentUser.id,
        "PLUMBING",
        "HIGH",
        "Water leakage in kitchen sink.",
        "OPEN",
        new Date(Date.now() + 24 * 60 * 60 * 1000)
      ]
    );

    await client.query("COMMIT");

    console.log("Seed complete.\n");
    console.log("========== DEMO DATA ==========");
    console.log("Society ID:", societyId);
    console.log("Block: A");
    console.log("Flat 101 ID:", flat101.id);
    console.log("Flat 102 ID:", flat102.id);
    console.log("Gate ID:", gateId);
    console.log("");
    console.log("Resident:");
    console.log("  Phone: 9999999991");
    console.log("  Name : Rahul Resident");
    console.log("");
    console.log("Guard:");
    console.log("  Phone: 9999999992");
    console.log("  Name : Gopal Guard");
    console.log("");
    console.log("Admin:");
    console.log("  Phone: 9999999993");
    console.log("  Name : Amit Admin");
    console.log("");
    console.log("Vehicle:");
    console.log("  Number : UP16AB1234");
    console.log("  Tag UID: TAG-RES-101");
    console.log("===============================");

  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch((e) => {
  console.error("Seed failed:", e);
  process.exit(1);
});
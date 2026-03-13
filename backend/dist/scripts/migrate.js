"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const db_1 = require("../config/db");
async function run() {
    const migrationsDir = path_1.default.join(process.cwd(), "migrations");
    const files = fs_1.default
        .readdirSync(migrationsDir)
        .filter((f) => f.endsWith(".sql"))
        .sort();
    // track applied migrations
    await db_1.pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
    for (const file of files) {
        const already = await db_1.pool.query("SELECT 1 FROM schema_migrations WHERE filename = $1", [file]);
        if (already.rowCount)
            continue;
        const sql = fs_1.default.readFileSync(path_1.default.join(migrationsDir, file), "utf8");
        // Run each file in a transaction
        const client = await db_1.pool.connect();
        try {
            await client.query("BEGIN");
            await client.query(sql);
            await client.query("INSERT INTO schema_migrations(filename) VALUES ($1)", [file]);
            await client.query("COMMIT");
            // eslint-disable-next-line no-console
            console.log(`Applied ${file}`);
        }
        catch (e) {
            await client.query("ROLLBACK");
            throw e;
        }
        finally {
            client.release();
        }
    }
    await db_1.pool.end();
}
run().catch((e) => {
    // eslint-disable-next-line no-console
    console.error("Migration failed:", e);
    process.exit(1);
});

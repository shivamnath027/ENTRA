"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pool = void 0;
exports.dbHealthcheck = dbHealthcheck;
const pg_1 = require("pg");
const env_1 = require("./env");
exports.pool = new pg_1.Pool({
    connectionString: env_1.env.DATABASE_URL
});
async function dbHealthcheck() {
    await exports.pool.query("SELECT 1");
}

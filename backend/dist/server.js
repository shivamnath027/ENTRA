"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("./app");
const env_1 = require("./config/env");
const db_1 = require("./config/db");
const bootstrapEvents_1 = require("./bootstrapEvents");
async function main() {
    await (0, db_1.dbHealthcheck)();
    (0, bootstrapEvents_1.registerEventHandlers)();
    app_1.app.listen(env_1.env.PORT, () => {
        // eslint-disable-next-line no-console
        console.log(`API running on http://localhost:${env_1.env.PORT}`);
    });
}
main().catch((e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    process.exit(1);
});

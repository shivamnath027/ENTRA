import { app } from "./app";
import { env } from "./config/env";
import { dbHealthcheck } from "./config/db";
import { registerEventHandlers } from "./bootstrapEvents";


async function main() {
  await dbHealthcheck();
  registerEventHandlers();
  app.listen(env.PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`API running on http://localhost:${env.PORT}`);
  });
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e);
  process.exit(1);
});

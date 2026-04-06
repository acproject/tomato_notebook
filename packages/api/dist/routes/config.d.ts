import { Hono } from 'hono';
import { Database } from 'bun:sqlite';
declare const config: Hono<import("hono/types").BlankEnv, import("hono/types").BlankSchema, "/">;
declare const db: Database;
export { db };
export default config;
//# sourceMappingURL=config.d.ts.map
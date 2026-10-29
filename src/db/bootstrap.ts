import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { DB_PATH, getDb, getRawSqlite } from "./client";

let bootstrapped = false;

export function bootstrap(): void {
  if (bootstrapped) {
    return;
  }
  mkdirSync(dirname(DB_PATH), { recursive: true });
  getRawSqlite();
  migrate(getDb(), { migrationsFolder: join(process.cwd(), "drizzle") });
  bootstrapped = true;
}

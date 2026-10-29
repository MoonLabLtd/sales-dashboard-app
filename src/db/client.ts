import Database from "better-sqlite3";
import { drizzle, type BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";

export const DB_PATH = process.env.LEDGERLINE_DB_PATH ?? "data/sales.db";

let sqlite: Database.Database | null = null;
let database: BetterSQLite3Database<typeof schema> | null = null;

export function getRawSqlite(): Database.Database {
  if (!sqlite) {
    sqlite = new Database(DB_PATH);
    sqlite.pragma("journal_mode = WAL");
    sqlite.pragma("synchronous = NORMAL");
    sqlite.pragma("foreign_keys = ON");
    sqlite.pragma("busy_timeout = 5000");
  }
  return sqlite;
}

export function getDb(): BetterSQLite3Database<typeof schema> {
  if (!database) {
    database = drizzle(getRawSqlite(), { schema });
  }
  return database;
}

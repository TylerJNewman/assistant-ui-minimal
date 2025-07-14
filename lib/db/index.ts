import Database from 'better-sqlite3';
import { drizzle, type BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import * as schema from './schema';
import path from 'node:path';
import fs from 'node:fs';

const dbDir = path.join(process.cwd(), 'lib/db');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'sqlite.db');

declare global {
  // eslint-disable-next-line no-var
  var __db__: BetterSQLite3Database<typeof schema> | undefined;
}

function initializeDb(): BetterSQLite3Database<typeof schema> {
  const sqlite = new Database(dbPath);
  sqlite.pragma('journal_mode = WAL');
  const db = drizzle(sqlite, { schema });

  const migrationsDir = path.join(dbDir, 'migrations');
  if (fs.existsSync(migrationsDir) && fs.readdirSync(migrationsDir).length > 0) {
    console.log('Applying migrations...');
    migrate(db, { migrationsFolder: migrationsDir });
    console.log('Migrations applied successfully.');
  } else {
    console.log("No migrations found. Please run 'drizzle-kit generate' to create migrations.");
  }

  return db;
}

if (!global.__db__) {
  global.__db__ = initializeDb();
}

export const db = global.__db__; 
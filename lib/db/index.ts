import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import * as schema from './schema';
import path from 'node:path';
import fs from 'node:fs';

// Ensure the db directory exists
const dbDir = path.join(process.cwd(), 'lib/db');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'sqlite.db');
const sqlite = new Database(dbPath);
sqlite.pragma('journal_mode = WAL');

export const db = drizzle(sqlite, { schema });

// Initialize database with migrations
export const initializeDatabase = () => {
  try {
    // Create migrations directory if it doesn't exist
    const migrationsDir = path.join(dbDir, 'migrations');
    if (!fs.existsSync(migrationsDir)) {
      fs.mkdirSync(migrationsDir, { recursive: true });
    }

    // Run migrations if they exist
    if (fs.existsSync(migrationsDir) && fs.readdirSync(migrationsDir).length > 0) {
      migrate(db, { migrationsFolder: migrationsDir });
    } else {
      // If no migrations exist, create tables directly
      console.log('No migrations found, creating tables directly...');
      
      // Create threads table
      sqlite.exec(`
        CREATE TABLE IF NOT EXISTS threads (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL DEFAULT 'New Chat',
          status TEXT NOT NULL DEFAULT 'regular' CHECK (status IN ('regular', 'archived')),
          created_at INTEGER NOT NULL DEFAULT (unixepoch()),
          updated_at INTEGER NOT NULL DEFAULT (unixepoch())
        );
      `);

      // Create messages table
      sqlite.exec(`
        CREATE TABLE IF NOT EXISTS messages (
          id TEXT PRIMARY KEY,
          thread_id TEXT NOT NULL REFERENCES threads(id) ON DELETE CASCADE,
          role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
          content TEXT NOT NULL,
          created_at INTEGER NOT NULL DEFAULT (unixepoch())
        );
      `);

      console.log('Tables created successfully');
    }
  } catch (error) {
    console.error('Failed to initialize database:', error);
  }
};

// Initialize on import
initializeDatabase(); 
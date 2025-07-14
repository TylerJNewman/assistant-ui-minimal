import { sql } from 'drizzle-orm';
import { sqliteTable, text, integer, blob } from 'drizzle-orm/sqlite-core';

export const threads = sqliteTable('threads', {
  id: text('id').primaryKey(),
  title: text('title').notNull().default('New Chat'),
  status: text('status', { enum: ['regular', 'archived'] }).notNull().default('regular'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
});

export const messages = sqliteTable('messages', {
  id: text('id').primaryKey(),
  threadId: text('thread_id').notNull().references(() => threads.id, { onDelete: 'cascade' }),
  role: text('role', { enum: ['user', 'assistant', 'system'] }).notNull(),
  content: text('content', { mode: 'json' }).notNull(), // JSON for complex content types
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
});

export type Thread = typeof threads.$inferSelect;
export type NewThread = typeof threads.$inferInsert;
export type Message = typeof messages.$inferSelect;
export type NewMessage = typeof messages.$inferInsert; 
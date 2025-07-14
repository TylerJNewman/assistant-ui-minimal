import { eq, desc, and } from 'drizzle-orm';
import { db } from './index';
import { threads, messages, type Thread, type NewThread, type Message, type NewMessage } from './schema';
import { nanoid } from 'nanoid';

export class ThreadRepository {
  // Thread operations
  async createThread(data: Partial<NewThread> = {}): Promise<Thread> {
    const thread = {
      id: nanoid(),
      title: 'New Chat',
      status: 'regular' as const,
      ...data,
    };

    const [created] = await db.insert(threads).values(thread).returning();
    return created;
  }

  async getThread(id: string): Promise<Thread | undefined> {
    const [thread] = await db.select().from(threads).where(eq(threads.id, id));
    return thread;
  }

  async listThreads(status: 'regular' | 'archived' = 'regular'): Promise<Thread[]> {
    return await db
      .select()
      .from(threads)
      .where(eq(threads.status, status))
      .orderBy(desc(threads.updatedAt));
  }

  async updateThread(id: string, data: Partial<Omit<Thread, 'id' | 'createdAt'>>): Promise<Thread | undefined> {
    const [updated] = await db
      .update(threads)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(threads.id, id))
      .returning();
    return updated;
  }

  async updateThreadTitle(id: string, title: string): Promise<Thread | undefined> {
    return this.updateThread(id, { title });
  }

  async archiveThread(id: string): Promise<Thread | undefined> {
    return this.updateThread(id, { status: 'archived' });
  }

  async unarchiveThread(id: string): Promise<Thread | undefined> {
    return this.updateThread(id, { status: 'regular' });
  }

  async deleteThread(id: string): Promise<void> {
    // Messages will be deleted automatically due to CASCADE
    await db.delete(threads).where(eq(threads.id, id));
  }

  async deleteAllThreads(): Promise<void> {
    await db.delete(threads);
  }

  // Message operations
  async createMessage(data: Omit<NewMessage, 'id'>): Promise<Message> {
    const message = {
      id: nanoid(),
      ...data,
    };

    const [created] = await db.insert(messages).values(message).returning();
    
    // Update thread's updatedAt timestamp
    await this.updateThread(data.threadId, {});
    
    return created;
  }

  async getThreadMessages(threadId: string): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .where(eq(messages.threadId, threadId))
      .orderBy(messages.createdAt);
  }

  async deleteMessage(id: string): Promise<void> {
    await db.delete(messages).where(eq(messages.id, id));
  }

  async deleteThreadMessages(threadId: string): Promise<void> {
    await db.delete(messages).where(eq(messages.threadId, threadId));
  }

  // Helper method to get thread with message count
  async getThreadsWithMessageCount(): Promise<Array<Thread & { messageCount: number }>> {
    const result = await db
      .select({
        id: threads.id,
        title: threads.title,
        status: threads.status,
        createdAt: threads.createdAt,
        updatedAt: threads.updatedAt,
        messageCount: db.$count(messages, eq(messages.threadId, threads.id)),
      })
      .from(threads)
      .orderBy(desc(threads.updatedAt));

    return result;
  }
}

// Singleton instance
export const threadRepository = new ThreadRepository();

// Utility functions for assistant-ui integration
export const threadOperations = {
  async generateThreadId(): Promise<string> {
    const thread = await threadRepository.createThread();
    return thread.id;
  },

  async getOrCreateThread(threadId?: string): Promise<Thread> {
    if (threadId) {
      const existing = await threadRepository.getThread(threadId);
      if (existing) return existing;
    }
    
    return await threadRepository.createThread();
  },

  async saveMessage(threadId: string, role: 'user' | 'assistant' | 'system', content: string | object): Promise<Message> {
    return await threadRepository.createMessage({
      threadId,
      role,
      content: typeof content === 'string' ? content : JSON.stringify(content),
    });
  },

  async updateTitle(threadId: string, title: string): Promise<void> {
    await threadRepository.updateThreadTitle(threadId, title);
  }
}; 
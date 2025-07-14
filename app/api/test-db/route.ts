import { threadRepository, threadOperations } from '@/lib/db/operations';

export async function POST(req: Request) {
  try {
    const { action } = await req.json();

    if (action === 'test') {
      // Test database operations
      
      // 1. Create a test thread
      const testThread = await threadRepository.createThread({
        title: 'Test Thread',
      });

      // 2. Add some test messages
      const userMessage = await threadOperations.saveMessage(
        testThread.id,
        'user',
        'Hello, this is a test message'
      );

      const assistantMessage = await threadOperations.saveMessage(
        testThread.id,
        'assistant',
        'Hello! This is a test response from the assistant.'
      );

      // 3. Update the thread title
      await threadOperations.updateTitle(testThread.id, 'Updated Test Thread');

      // 4. Retrieve the thread and messages
      const retrievedThread = await threadRepository.getThread(testThread.id);
      const threadMessages = await threadRepository.getThreadMessages(testThread.id);

      // 5. List all threads
      const allThreads = await threadRepository.listThreads();

      // 6. Clean up - delete the test thread
      await threadRepository.deleteThread(testThread.id);

      return new Response(JSON.stringify({
        success: true,
        message: 'Database test completed successfully!',
        results: {
          threadCreated: !!testThread.id,
          messagesCreated: threadMessages.length === 2,
          titleUpdated: retrievedThread?.title === 'Updated Test Thread',
          threadsList: allThreads.length >= 0,
          cleanup: 'Test thread deleted',
        }
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Database test error:', error);
    return new Response(JSON.stringify({ 
      error: 'Database test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
} 
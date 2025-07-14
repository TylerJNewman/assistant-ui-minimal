"use client";

import { useState, useEffect, useMemo } from 'react';
import { useExternalStoreRuntime } from '@assistant-ui/react';
import { type ThreadMessage } from '@assistant-ui/react';
import { threadRepository, threadOperations } from '../db/operations';
import { type Thread } from '../db/schema';
import { nanoid } from 'nanoid';

interface LocalRuntimeState {
  currentThreadId: string;
  threads: Thread[];
  currentMessages: ThreadMessage[];
  isLoading: boolean;
}

export const useLocalRuntimeWithSQLite = () => {
  const [state, setState] = useState<LocalRuntimeState>({
    currentThreadId: '',
    threads: [],
    currentMessages: [],
    isLoading: true,
  });

  // Initialize: load threads and create default thread if none exist
  useEffect(() => {
    const initialize = async () => {
      try {
        const threads = await threadRepository.listThreads();
        
        let currentThreadId = threads[0]?.id;
        if (!currentThreadId) {
          // Create a default thread if none exist
          const defaultThread = await threadRepository.createThread();
          currentThreadId = defaultThread.id;
          threads.push(defaultThread);
        }

        const messages = await threadRepository.getThreadMessages(currentThreadId);
        const currentMessages = messages.map(convertToThreadMessage);

        setState({
          currentThreadId,
          threads,
          currentMessages,
          isLoading: false,
        });
      } catch (error) {
        console.error('Failed to initialize local runtime:', error);
        setState(prev => ({ ...prev, isLoading: false }));
      }
    };

    initialize();
  }, []);

  // Load messages when thread changes
  const loadThreadMessages = async (threadId: string) => {
    try {
      const messages = await threadRepository.getThreadMessages(threadId);
      const currentMessages = messages.map(convertToThreadMessage);
      
      setState(prev => ({
        ...prev,
        currentThreadId: threadId,
        currentMessages,
      }));
    } catch (error) {
      console.error('Failed to load thread messages:', error);
    }
  };

  // Thread list adapter for assistant-ui
  const threadListAdapter = useMemo(() => ({
    threadId: state.currentThreadId,
    threads: state.threads.filter(t => t.status === 'regular').map(t => ({
      threadId: t.id,
      title: t.title,
    })),
    archivedThreads: state.threads.filter(t => t.status === 'archived').map(t => ({
      threadId: t.id,
      title: t.title,
    })),

    onSwitchToNewThread: async () => {
      try {
        const newThread = await threadRepository.createThread();
        setState(prev => ({
          ...prev,
          currentThreadId: newThread.id,
          threads: [newThread, ...prev.threads],
          currentMessages: [],
        }));
      } catch (error) {
        console.error('Failed to create new thread:', error);
      }
    },

    onSwitchToThread: async (threadId: string) => {
      await loadThreadMessages(threadId);
    },

    onRename: async (threadId: string, newTitle: string) => {
      try {
        await threadRepository.updateThreadTitle(threadId, newTitle);
        setState(prev => ({
          ...prev,
          threads: prev.threads.map(t => 
            t.id === threadId ? { ...t, title: newTitle } : t
          ),
        }));
      } catch (error) {
        console.error('Failed to rename thread:', error);
      }
    },

    onArchive: async (threadId: string) => {
      try {
        await threadRepository.archiveThread(threadId);
        setState(prev => ({
          ...prev,
          threads: prev.threads.map(t => 
            t.id === threadId ? { ...t, status: 'archived' as const } : t
          ),
        }));
      } catch (error) {
        console.error('Failed to archive thread:', error);
      }
    },

    onUnarchive: async (threadId: string) => {
      try {
        await threadRepository.unarchiveThread(threadId);
        setState(prev => ({
          ...prev,
          threads: prev.threads.map(t => 
            t.id === threadId ? { ...t, status: 'regular' as const } : t
          ),
        }));
      } catch (error) {
        console.error('Failed to unarchive thread:', error);
      }
    },

    onDelete: async (threadId: string) => {
      try {
        await threadRepository.deleteThread(threadId);
        setState(prev => {
          const updatedThreads = prev.threads.filter(t => t.id !== threadId);
          
          // If we deleted the current thread, switch to another one
          let newCurrentThreadId = prev.currentThreadId;
          let newCurrentMessages = prev.currentMessages;
          
          if (threadId === prev.currentThreadId) {
            const remainingThread = updatedThreads.find(t => t.status === 'regular');
            if (remainingThread) {
              newCurrentThreadId = remainingThread.id;
              // Load messages for the new current thread
              loadThreadMessages(remainingThread.id);
            } else {
              // Create a new thread if none exist
              threadRepository.createThread().then(newThread => {
                setState(prev => ({
                  ...prev,
                  currentThreadId: newThread.id,
                  threads: [newThread, ...prev.threads],
                  currentMessages: [],
                }));
              });
              newCurrentThreadId = '';
              newCurrentMessages = [];
            }
          }

          return {
            ...prev,
            threads: updatedThreads,
            currentThreadId: newCurrentThreadId,
            currentMessages: newCurrentMessages,
          };
        });
      } catch (error) {
        console.error('Failed to delete thread:', error);
      }
    },
  }), [state.currentThreadId, state.threads]);

  // Create the runtime using useExternalStoreRuntime
  const runtime = useExternalStoreRuntime({
    messages: state.currentMessages,
    setMessages: (messages) => {
      setState(prev => ({ ...prev, currentMessages: messages }));
    },
    onNew: async (message) => {
      try {
        // Save the user message
        await threadOperations.saveMessage(
          state.currentThreadId,
          'user',
          message.content
        );

        // Call the chat API
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [
              ...state.currentMessages.map(convertToAPIMessage),
              {
                role: 'user',
                content: message.content,
              },
            ],
          }),
        });

        if (!response.ok) {
          throw new Error('Chat API request failed');
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error('No response stream');

        const decoder = new TextDecoder();
        let assistantMessage = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('0:')) {
              try {
                const data = JSON.parse(line.slice(2));
                if (data.content?.[0]?.text) {
                  assistantMessage += data.content[0].text;
                  
                  // Update current messages with streaming content
                  setState(prev => {
                    const updatedMessages = [...prev.currentMessages];
                    
                    // Find or create assistant message
                    let assistantMsgIndex = updatedMessages.findIndex(
                      (msg, idx) => idx === updatedMessages.length - 1 && msg.role === 'assistant'
                    );
                    
                    if (assistantMsgIndex === -1) {
                      // Add new assistant message
                      updatedMessages.push({
                        id: nanoid(),
                        role: 'assistant',
                        content: [{ type: 'text', text: assistantMessage }],
                        createdAt: new Date(),
                      });
                    } else {
                      // Update existing assistant message
                      updatedMessages[assistantMsgIndex] = {
                        ...updatedMessages[assistantMsgIndex],
                        content: [{ type: 'text', text: assistantMessage }],
                      };
                    }
                    
                    return {
                      ...prev,
                      currentMessages: updatedMessages,
                    };
                  });
                }
              } catch (e) {
                // Ignore parsing errors for incomplete chunks
              }
            }
          }
        }

        // Save the final assistant message to database
        if (assistantMessage) {
          await threadOperations.saveMessage(
            state.currentThreadId,
            'assistant',
            assistantMessage
          );

          // Generate title if this is a new conversation
          if (state.currentMessages.length <= 1) {
            try {
              const titleResponse = await fetch('/api/generate-title', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  messages: [
                    { role: 'user', content: message.content },
                    { role: 'assistant', content: assistantMessage },
                  ],
                }),
              });

              if (titleResponse.ok) {
                const { title } = await titleResponse.json();
                if (title && title !== 'New Chat') {
                  await threadOperations.updateTitle(state.currentThreadId, title);
                  
                  // Update local state
                  setState(prev => ({
                    ...prev,
                    threads: prev.threads.map(t => 
                      t.id === state.currentThreadId ? { ...t, title } : t
                    ),
                  }));
                }
              }
            } catch (error) {
              console.error('Failed to generate title:', error);
            }
          }
        }
      } catch (error) {
        console.error('Failed to handle new message:', error);
        throw error;
      }
    },
    adapters: {
      threadList: threadListAdapter,
    },
  });

  return {
    runtime,
    isLoading: state.isLoading,
  };
};

// Helper functions
function convertToThreadMessage(dbMessage: any): ThreadMessage {
  let content;
  try {
    content = typeof dbMessage.content === 'string' 
      ? [{ type: 'text', text: dbMessage.content }]
      : dbMessage.content;
  } catch {
    content = [{ type: 'text', text: String(dbMessage.content) }];
  }

  return {
    id: dbMessage.id,
    role: dbMessage.role,
    content,
    createdAt: new Date(dbMessage.createdAt * 1000), // Convert from Unix timestamp
  };
}

function convertToAPIMessage(message: ThreadMessage) {
  let content = '';
  if (Array.isArray(message.content)) {
    content = message.content
      .filter(part => part.type === 'text')
      .map(part => part.text)
      .join('');
  } else if (typeof message.content === 'string') {
    content = message.content;
  }

  return {
    role: message.role,
    content,
  };
} 
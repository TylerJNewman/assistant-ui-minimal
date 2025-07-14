"use client";

import { AssistantRuntimeProvider } from "@assistant-ui/react";
import { useChatRuntime } from "@assistant-ui/react-ai-sdk";
import { Thread } from "@/components/assistant-ui/thread";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { useCurrentThread } from "@/hooks/use-current-thread";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import type { Message } from "ai";

const fetchThreads = async () => {
  const res = await fetch("/api/threads");
  if (!res.ok) throw new Error("Failed to fetch threads");
  return res.json();
};

const fetchMessages = async (threadId: string) => {
  const res = await fetch(`/api/threads/${threadId}/messages`);
  if (!res.ok) throw new Error("Failed to fetch messages");
  return res.json();
};

export const Assistant = () => {
  const { currentThreadId, setCurrentThreadId } = useCurrentThread();

  // On first load, select the most recent thread
  const { data: threads, isLoading: areThreadsLoading } = useQuery({
    queryKey: ["threads"],
    queryFn: fetchThreads,
  });

  useEffect(() => {
    if (!currentThreadId && threads && threads.length > 0) {
      setCurrentThreadId(threads[0].id);
    }
  }, [threads, currentThreadId, setCurrentThreadId]);

  const { data: messages, isLoading: areMessagesLoading } = useQuery<Message[]>({
    queryKey: ["messages", currentThreadId],
    queryFn: () => fetchMessages(currentThreadId ?? ""),
    enabled: !!currentThreadId,
  });

  const runtime = useChatRuntime({
    api: "/api/chat",
    initialMessages: messages
      ?.filter((m) => m.role === "user" || m.role === "assistant")
      .map((m) => ({ ...m, role: m.role as "user" | "assistant" })),
  });

  if (areThreadsLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-muted-foreground">Loading threads...</div>
      </div>
    );
  }

  // if we have a thread, but messages are loading, show loading
  if (currentThreadId && areMessagesLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-muted-foreground">Loading messages...</div>
      </div>
    );
  }

  return (
    <AssistantRuntimeProvider key={currentThreadId ?? 'empty'} runtime={runtime}>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <Thread />
        </SidebarInset>
      </SidebarProvider>
    </AssistantRuntimeProvider>
  );
};

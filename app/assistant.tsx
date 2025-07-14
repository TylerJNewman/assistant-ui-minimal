"use client";

import { AssistantRuntimeProvider } from "@assistant-ui/react";
import { useChatRuntime } from "@assistant-ui/react-ai-sdk";
import { Thread } from "@/components/assistant-ui/thread";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { useCurrentThread } from "@/hooks/use-current-thread";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";

const fetchThreads = async () => {
  const res = await fetch("/api/threads");
  if (!res.ok) throw new Error("Failed to fetch threads");
  return res.json();
};

export const Assistant = () => {
  const { currentThreadId, setCurrentThreadId } = useCurrentThread();

  // On first load, select the most recent thread
  const { data: threads } = useQuery({
    queryKey: ["threads"],
    queryFn: fetchThreads,
  });

  useEffect(() => {
    if (!currentThreadId && threads && threads.length > 0) {
      setCurrentThreadId(threads[0].id);
    }
  }, [threads, currentThreadId, setCurrentThreadId]);

  const runtime = useChatRuntime({
    api: "/api/chat",
  });

  if (!currentThreadId) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <AssistantRuntimeProvider key={currentThreadId} runtime={runtime}>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <Thread />
        </SidebarInset>
      </SidebarProvider>
    </AssistantRuntimeProvider>
  );
};

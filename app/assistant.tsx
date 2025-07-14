"use client";

import { AssistantRuntimeProvider } from "@assistant-ui/react";
import { useLocalRuntimeWithSQLite } from "@/lib/runtime/local-runtime";
import { Thread } from "@/components/assistant-ui/thread";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";

export const Assistant = () => {
  const { runtime, isLoading } = useLocalRuntimeWithSQLite();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <Thread />
        </SidebarInset>
      </SidebarProvider>
    </AssistantRuntimeProvider>
  );
};

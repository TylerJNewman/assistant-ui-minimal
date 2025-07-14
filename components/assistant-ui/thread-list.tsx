import type { FC } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArchiveIcon, PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TooltipIconButton } from "@/components/assistant-ui/tooltip-icon-button";
import { useCurrentThread } from "@/hooks/use-current-thread";
import { cn } from "@/lib/utils";

interface Thread {
  id: string;
  title: string | null;
  status: string;
}

// Fetch threads from API
const fetchThreads = async (): Promise<Thread[]> => {
  const res = await fetch("/api/threads");
  if (!res.ok) throw new Error("Failed to fetch threads");
  return res.json();
};

// Create a new thread via API
const createThread = async (): Promise<Thread> => {
  const res = await fetch("/api/threads", { method: "POST" });
  if (!res.ok) throw new Error("Failed to create thread");
  return res.json();
};

export const ThreadList: FC = () => {
  const queryClient = useQueryClient();
  const { currentThreadId, setCurrentThreadId } = useCurrentThread();

  const { data: threads = [], isLoading, isError } = useQuery<Thread[]>({
    queryKey: ["threads"],
    queryFn: fetchThreads,
  });

  const newThreadMutation = useMutation({
    mutationFn: createThread,
    onSuccess: (newThread) => {
      queryClient.invalidateQueries({ queryKey: ["threads"] });
      setCurrentThreadId(newThread.id);
    },
  });

  return (
    <div className="flex flex-col items-stretch gap-1.5">
      <Button
        className="data-[active]:bg-muted hover:bg-muted flex items-center justify-start gap-1 rounded-lg px-2.5 py-2 text-start mb-2"
        variant="ghost"
        onClick={() => newThreadMutation.mutate()}
        disabled={newThreadMutation.isPending}
      >
        <PlusIcon />
        {newThreadMutation.isPending ? "Creating..." : "New Thread"}
      </Button>
      {isLoading && <div className="text-muted-foreground px-3 py-2">Loading threads...</div>}
      {isError && <div className="text-destructive px-3 py-2">Failed to load threads.</div>}
      {threads.length === 0 && !isLoading && <div className="text-muted-foreground px-3 py-2">No threads yet.</div>}
      {threads.map((thread) => (
        <div
          key={thread.id}
          role="button"
          tabIndex={0}
          className={cn(
            "flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-start hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring",
            thread.id === currentThreadId && "bg-muted",
          )}
          onClick={() => setCurrentThreadId(thread.id)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setCurrentThreadId(thread.id);
            }
          }}
        >
          <span className="truncate text-sm flex-grow">{thread.title || "New Chat"}</span>
          <TooltipIconButton
            className="hover:text-primary text-foreground ml-auto mr-3 size-4 p-0"
            variant="ghost"
            tooltip="Archive thread"
            onClick={(e) => {
              e.stopPropagation();
              // TODO: Add archive mutation
            }}
          >
            <ArchiveIcon />
          </TooltipIconButton>
        </div>
      ))}
    </div>
  );
};

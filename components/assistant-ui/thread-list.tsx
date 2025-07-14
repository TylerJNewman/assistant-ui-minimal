import type { FC } from "react";
import { useEffect, useState } from "react";
import {
  ThreadListItemPrimitive,
  ThreadListPrimitive,
  useThreadListItem,
  useThreadListItemRuntime,
  useThread,
} from "@assistant-ui/react";
import { ArchiveIcon, PlusIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { TooltipIconButton } from "@/components/assistant-ui/tooltip-icon-button";

// Hook for automatic title generation using AI SDK
const useAutoTitleGeneration = () => {
  const threadListItem = useThreadListItem();
  const threadListItemRuntime = useThreadListItemRuntime();
  const thread = useThread();
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    // Only generate title if it's still "New Chat" and we have messages
    if (
      threadListItem.title === "New Chat" && 
      thread.messages.length >= 2 && 
      !isGenerating
    ) {
      const generateTitle = async () => {
        setIsGenerating(true);
        try {
          const response = await fetch("/api/generate-title", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              messages: thread.messages,
            }),
          });

          if (response.ok) {
            const data = await response.json();
            if (data.title && data.title !== "New Chat") {
              console.log("Generated title:", data.title);
              
              // Try to update the title using the runtime
              if (threadListItemRuntime && typeof threadListItemRuntime.rename === "function") {
                await threadListItemRuntime.rename(data.title);
              } else {
                // For debugging - show what title would be set
                console.log("Would set title to:", data.title);
                console.log("Runtime methods:", Object.keys(threadListItemRuntime || {}));
              }
            }
          }
        } catch (error) {
          console.error("Error generating title:", error);
        } finally {
          setIsGenerating(false);
        }
      };

      generateTitle();
    }
  }, [thread.messages.length, threadListItem.title, isGenerating, threadListItemRuntime, thread.messages]);

  return { isGenerating };
};

export const ThreadList: FC = () => {
  return (
    <ThreadListPrimitive.Root className="flex flex-col items-stretch gap-1.5">
      <ThreadListNew />
      <ThreadListItems />
    </ThreadListPrimitive.Root>
  );
};

const ThreadListNew: FC = () => {
  return (
    <ThreadListPrimitive.New asChild>
      <Button className="data-[active]:bg-muted hover:bg-muted flex items-center justify-start gap-1 rounded-lg px-2.5 py-2 text-start" variant="ghost">
        <PlusIcon />
        New Thread
      </Button>
    </ThreadListPrimitive.New>
  );
};

const ThreadListItems: FC = () => {
  return <ThreadListPrimitive.Items components={{ ThreadListItem }} />;
};

const ThreadListItem: FC = () => {
  // Enable auto title generation for this thread item
  const { isGenerating } = useAutoTitleGeneration();
  
  return (
    <ThreadListItemPrimitive.Root className="data-[active]:bg-muted hover:bg-muted focus-visible:bg-muted focus-visible:ring-ring flex items-center gap-2 rounded-lg transition-all focus-visible:outline-none focus-visible:ring-2">
      <ThreadListItemPrimitive.Trigger className="flex-grow px-3 py-2 text-start">
        <ThreadListItemTitle isGenerating={isGenerating} />
      </ThreadListItemPrimitive.Trigger>
      <ThreadListItemArchive />
    </ThreadListItemPrimitive.Root>
  );
};

const ThreadListItemTitle: FC<{ isGenerating?: boolean }> = ({ isGenerating }) => {
  return (
    <p className="text-sm truncate">
      {isGenerating ? (
        <span className="text-muted-foreground">Generating title...</span>
      ) : (
        <ThreadListItemPrimitive.Title fallback="New Chat" />
      )}
    </p>
  );
};

const ThreadListItemArchive: FC = () => {
  return (
    <ThreadListItemPrimitive.Archive asChild>
      <TooltipIconButton
        className="hover:text-primary text-foreground ml-auto mr-3 size-4 p-0"
        variant="ghost"
        tooltip="Archive thread"
      >
        <ArchiveIcon />
      </TooltipIconButton>
    </ThreadListItemPrimitive.Archive>
  );
};

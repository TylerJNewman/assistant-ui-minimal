/**
 * Thread Title Generation Utilities
 * 
 * Best practices for generating meaningful thread titles:
 * 1. Use the first 50-100 characters of the first user message
 * 2. Remove common question starters to make titles more concise
 * 3. Capitalize properly and normalize whitespace
 * 4. Truncate at word boundaries when possible
 * 5. Generate titles after first exchange (user + assistant)
 */

export interface TitleGenerationOptions {
  maxLength?: number;
  removeCommonStarters?: boolean;
  strategy?: 'first-message' | 'summarize' | 'ai-generated';
}

/**
 * Generates a thread title from the first user message
 */
export const generateTitleFromFirstMessage = (
  content: string, 
  options: TitleGenerationOptions = {}
): string => {
  const {
    maxLength = 50,
    removeCommonStarters = true,
  } = options;

  // Clean the content
  const cleanContent = content
    .trim()
    .replace(/\s+/g, " ") // Normalize whitespace
    .replace(/[^\w\s\-.,!?]/g, ""); // Remove special characters except basic punctuation

  let title = cleanContent;

  // Remove common question starters to make titles more concise
  if (removeCommonStarters) {
    const commonStarters = [
      "can you", "could you", "please", "i need", "i want", "how do i", 
      "what is", "tell me", "explain", "help me", "show me", "give me"
    ];
    
    for (const starter of commonStarters) {
      const regex = new RegExp(`^${starter}\\s+`, "i");
      title = title.replace(regex, "");
    }
  }

  // Capitalize first letter
  title = title.charAt(0).toUpperCase() + title.slice(1);

  // Truncate to optimal length
  if (title.length > maxLength) {
    // Try to break at word boundary
    const truncated = title.slice(0, maxLength);
    const lastSpace = truncated.lastIndexOf(" ");
    
    if (lastSpace > maxLength * 0.7) {
      title = `${truncated.slice(0, lastSpace)}...`;
    } else {
      title = `${truncated}...`;
    }
  }

  return title || "New Chat";
};

/**
 * Generates a title by analyzing the conversation topic
 */
export const generateTopicBasedTitle = (messages: unknown[]): string => {
  if (messages.length < 2) return "New Chat";

  const firstUserMessage = messages.find((msg: any) => msg.role === "user");
  if (!firstUserMessage?.content) return "New Chat";

  let content = "";
  
  // Extract text content from different message formats
  if (Array.isArray(firstUserMessage.content)) {
    content = firstUserMessage.content
      .filter((part: any) => part.type === "text")
      .map((part: any) => part.text)
      .join(" ");
  } else if (typeof firstUserMessage.content === "string") {
    content = firstUserMessage.content;
  }

  // Analyze content for topic keywords
  const topicKeywords = {
    coding: ["code", "programming", "debug", "function", "variable", "error"],
    writing: ["write", "essay", "article", "blog", "content", "copy"],
    math: ["calculate", "equation", "formula", "solve", "math", "number"],
    analysis: ["analyze", "compare", "review", "evaluate", "assess"],
    creative: ["create", "design", "imagine", "generate", "build"],
    help: ["help", "assist", "support", "guide", "tutorial"]
  };

  for (const [topic, keywords] of Object.entries(topicKeywords)) {
    if (keywords.some(keyword => content.toLowerCase().includes(keyword))) {
      const title = generateTitleFromFirstMessage(content, { maxLength: 40 });
      return `${topic.charAt(0).toUpperCase() + topic.slice(1)}: ${title}`;
    }
  }

  return generateTitleFromFirstMessage(content);
};

/**
 * AI-powered title generation (placeholder for future implementation)
 */
export const generateAITitle = async (messages: any[]): Promise<string> => {
  // In a real implementation, this would call an AI API to generate a title
  // For now, fall back to topic-based generation
  return generateTopicBasedTitle(messages);
};

/**
 * Main title generation function that chooses the best strategy
 */
export const generateThreadTitle = (
  messages: any[], 
  options: TitleGenerationOptions = {}
): string => {
  const { strategy = 'first-message' } = options;

  if (messages.length < 2) return "New Chat";

  switch (strategy) {
    case 'summarize':
      return generateTopicBasedTitle(messages);
    case 'ai-generated':
      // For now, use topic-based as fallback
      return generateTopicBasedTitle(messages);
    case 'first-message':
    default:
      const firstUserMessage = messages.find(msg => msg.role === "user");
      if (!firstUserMessage?.content) return "New Chat";

      let content = "";
      if (Array.isArray(firstUserMessage.content)) {
        content = firstUserMessage.content
          .filter(part => part.type === "text")
          .map(part => part.text)
          .join(" ");
      } else if (typeof firstUserMessage.content === "string") {
        content = firstUserMessage.content;
      }

      return generateTitleFromFirstMessage(content, options);
  }
};

/**
 * Utility to check if a thread needs a title update
 */
export const shouldUpdateTitle = (
  currentTitle: string, 
  messages: any[]
): boolean => {
  return (
    currentTitle === "New Chat" && 
    messages.length >= 2 &&
    messages.some(msg => msg.role === "user")
  );
}; 
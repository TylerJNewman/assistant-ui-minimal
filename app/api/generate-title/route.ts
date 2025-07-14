import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";

export const runtime = "edge";
export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "No messages provided" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Find the first user message
    const firstUserMessage = messages.find(msg => msg.role === "user");
    
    if (!firstUserMessage || !firstUserMessage.content) {
      return new Response(JSON.stringify({ title: "New Chat" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Extract text content from the message
    let userContent = "";
    if (Array.isArray(firstUserMessage.content)) {
      userContent = firstUserMessage.content
        .filter((part: any) => part.type === "text")
        .map((part: any) => part.text)
        .join(" ");
    } else if (typeof firstUserMessage.content === "string") {
      userContent = firstUserMessage.content;
    }

    if (!userContent.trim()) {
      return new Response(JSON.stringify({ title: "New Chat" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Generate title using AI SDK
    const result = await generateText({
      model: openai("gpt-4o-mini"),
      prompt: `Generate a concise, descriptive title for a conversation that starts with this user message: "${userContent}"

Requirements:
- Maximum 50 characters
- Remove common question starters like "Can you", "Please", "How do I", etc.
- Make it descriptive and specific
- Use title case
- Don't use quotes in the title
- Focus on the main topic or request

Examples:
- "Can you help me write a Python function?" → "Python Function Writing"
- "Please explain how React hooks work" → "React Hooks Explanation"
- "I need to debug this JavaScript code" → "JavaScript Code Debugging"

Title:`,
      maxTokens: 20,
      temperature: 0.3,
    });

    // Clean up the generated title
    let title = result.text.trim();
    
    // Remove any quotes that might have been added
    title = title.replace(/^["']|["']$/g, "");
    
    // Ensure it's not too long
    if (title.length > 50) {
      title = `${title.substring(0, 47)}...`;
    }

    // Fallback if title is empty or too short
    if (!title || title.length < 3) {
      title = `${userContent.substring(0, 50)}${userContent.length > 50 ? "..." : ""}`;
    }

    return new Response(JSON.stringify({ title }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error generating title:", error);
    return new Response(JSON.stringify({ error: "Failed to generate title" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
} 
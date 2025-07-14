"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export const TitleGeneratorTest = () => {
  const [title, setTitle] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  const testTitleGeneration = async () => {
    setIsLoading(true);
    try {
      const testMessages = [
        {
          role: "user",
          content: "Can you help me write a Python function to sort a list of dictionaries by a specific key?"
        },
        {
          role: "assistant",
          content: "I'll help you create a Python function to sort a list of dictionaries..."
        }
      ];

      const response = await fetch("/api/generate-title", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: testMessages,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setTitle(data.title || "No title generated");
      } else {
        setTitle("Error generating title");
      }
    } catch (error) {
      console.error("Error:", error);
      setTitle("Error generating title");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 border rounded-lg bg-gray-50">
      <h3 className="font-semibold mb-2">Title Generator Test</h3>
      <Button onClick={testTitleGeneration} disabled={isLoading}>
        {isLoading ? "Generating..." : "Test Title Generation"}
      </Button>
      {title && (
        <div className="mt-2">
          <strong>Generated Title:</strong> {title}
        </div>
      )}
    </div>
  );
}; 
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { TitleGeneratorTest } from "@/components/assistant-ui/title-generator-test";

export default function TestDBPage() {
  const [results, setResults] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const addResult = (result: string) => {
    setResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`]);
  };

  const testDatabase = async () => {
    setIsLoading(true);
    try {
      addResult("Testing database connection...");
      
      // Test database operations
      const response = await fetch('/api/test-db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'test' }),
      });

      if (response.ok) {
        const data = await response.json();
        addResult(`✅ Database test: ${data.message}`);
      } else {
        addResult("❌ Database test failed");
      }
    } catch (error) {
      addResult(`❌ Error: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const clearResults = () => {
    setResults([]);
  };

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">SQLite Database & Title Generation Test</h1>
      
      <div className="grid gap-6">
        {/* Database Test */}
        <div className="border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Database Connection Test</h2>
          <div className="flex gap-4 mb-4">
            <Button onClick={testDatabase} disabled={isLoading}>
              {isLoading ? "Testing..." : "Test Database"}
            </Button>
            <Button variant="outline" onClick={clearResults}>
              Clear Results
            </Button>
          </div>
          
          {/* Results */}
          <div className="bg-gray-50 rounded p-4 min-h-[200px]">
            <h3 className="font-medium mb-2">Test Results:</h3>
            {results.length === 0 ? (
              <p className="text-gray-500">Click "Test Database" to run tests...</p>
            ) : (
              <div className="space-y-1 font-mono text-sm">
                {results.map((result) => (
                  <div key={result} className="text-gray-700">
                    {result}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Title Generator Test */}
        <TitleGeneratorTest />

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-blue-900">Setup Instructions</h2>
          <div className="space-y-2 text-blue-800">
            <p>✅ SQLite database with Drizzle ORM configured</p>
            <p>✅ Title generation API endpoint created</p>
            <p>✅ Database operations for threads and messages</p>
            <p className="mt-4 font-medium">Next steps:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Test the database connection above</li>
              <li>Test the title generation</li>
              <li>Integrate with the main assistant interface</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
} 
import React, { useState } from "react";
import { MessageList } from "./components/MessageList";
import { InputArea } from "./components/InputArea";
import { Header } from "./components/Header";
import { ChatMessage } from "./types";

const App: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;

    // 1. Add user message to UI immediately
    const userMessage: ChatMessage = {
      role: "user",
      text: text,
      timestamp: Date.now(),
    };

    // Optimistically update UI
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);

    setIsLoading(true);
    setError(null);

    try {
      // 2. Call our local Node.js server instead of Google directly
      const response = await fetch("http://localhost:3000/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          history: messages, // Send previous context
          message: text, // Send current text
        }),
      });

      if (!response.ok) {
        throw new Error(`Server Error: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      // 3. Add Model Response to UI
      setMessages((prev) => [
        ...prev,
        {
          role: "model",
          text: data.text,
          timestamp: Date.now(),
        },
      ]);
    } catch (err: any) {
      console.error("Chat Error:", err);
      setError(
        err.message ||
          "Failed to connect to the server. Is 'node server.js' running?",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([]);
    setError(null);
  };

  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto bg-white shadow-xl overflow-hidden md:my-8 md:rounded-xl md:h-[calc(100vh-4rem)] border border-gray-100">
      <Header onClear={handleClearChat} messageCount={messages.length} />

      <main className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 relative scroll-smooth">
        {messages.length === 0 && !error && (
          <div className="flex flex-col items-center justify-center h-full text-center text-gray-400 p-8 opacity-60">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-16 h-16 mb-4"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5.25 14.25h13.5m-13.5 0a3 3 0 0 1-3-3m3 3a3 3 0 1 0 0 6h13.5a3 3 0 1 0 0-6m-16.5-3a3 3 0 0 1 3-3h13.5a3 3 0 0 1 3 3m-19.5 0a4.5 4.5 0 0 1 .9-2.7L5.737 5.1a3.375 3.375 0 0 1 2.7-1.35h7.126a3.375 3.375 0 0 1 2.7 1.35l3.338 6.366a4.5 4.5 0 0 1 .9 2.7"
              />
            </svg>
            <p className="text-lg font-medium">Node.js Server Backend</p>
            <p className="text-sm">Your API Key is now hidden on the server.</p>
            <p className="text-xs mt-2 text-gray-300">
              Try "What's the weather in Seattle?"
            </p>
          </div>
        )}

        <MessageList messages={messages} isLoading={isLoading} />

        {error && (
          <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-3">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-5 h-5 flex-shrink-0 mt-0.5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
              />
            </svg>
            <span>{error}</span>
          </div>
        )}
      </main>

      <div className="p-4 bg-white border-t border-gray-100">
        <InputArea onSend={handleSendMessage} isLoading={isLoading} />
      </div>
    </div>
  );
};

export default App;

console.log("I love javascript");

console.log("sonet");

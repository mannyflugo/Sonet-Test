import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { MessageList } from './components/MessageList';
import { InputArea } from './components/InputArea';
import { Header } from './components/Header';
import { ChatMessage } from './types';

const App: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize Gemini API client
  // CRITICAL: We create a new instance only when needed or memoize if strictly necessary, 
  // but for simple text generation, instantiating here is safe as long as we use the key correctly.
  // Using a ref to hold the client is a good pattern if we had stateful chat sessions.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;

    // 1. Add user message to state
    const userMessage: ChatMessage = {
      role: 'user',
      text: text,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);

    try {
      // 2. Call Gemini API
      // Using gemini-2.5-flash for speed and efficiency as per guidelines for basic text tasks
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: text, 
      });

      // 3. Extract text and add model message to state
      const responseText = response.text; // Access .text property directly
      
      const modelMessage: ChatMessage = {
        role: 'model',
        text: responseText || "No response generated.",
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, modelMessage]);

    } catch (err: any) {
      console.error("Gemini API Error:", err);
      setError(err.message || "An error occurred while communicating with Gemini.");
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
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16 mb-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
                </svg>
                <p className="text-lg font-medium">Start a conversation with Gemini</p>
                <p className="text-sm">Type a message below to begin.</p>
            </div>
        )}
        
        <MessageList messages={messages} isLoading={isLoading} />
        
        {error && (
          <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-3">
             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 flex-shrink-0 mt-0.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
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
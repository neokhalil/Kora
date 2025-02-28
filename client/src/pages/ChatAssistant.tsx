import React, { useEffect } from 'react';
import ChatInterface from '@/components/ChatInterface';

const ChatAssistant: React.FC = () => {
  useEffect(() => {
    console.log("ChatAssistant component mounted");
  }, []);

  return (
    <div className="flex flex-col h-screen">
      <header className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
        <h1 className="text-xl font-bold">KORA</h1>
        <button className="rounded-full p-2 bg-gray-100">+</button>
      </header>
      
      <div className="flex-1 overflow-hidden">
        {/* Debug placeholder */}
        <div className="p-4 text-center">
          <h2 className="text-lg font-semibold mb-4">Chat Assistant</h2>
          <p className="mb-4">Chat interface loading...</p>
        </div>
        
        <ChatInterface />
      </div>
    </div>
  );
};

export default ChatAssistant;
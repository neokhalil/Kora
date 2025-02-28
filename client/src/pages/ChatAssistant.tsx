import React from 'react';
import ChatInterface from '@/components/ChatInterface';

const ChatAssistant: React.FC = () => {
  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto">
      <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 p-4">
        <h1 className="text-xl font-semibold">Kora Assistant</h1>
        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
          En ligne
        </span>
      </div>
      
      <div className="flex-1 overflow-hidden">
        <ChatInterface />
      </div>
    </div>
  );
};

export default ChatAssistant;
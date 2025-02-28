import React from 'react';
import ChatInterface from '@/components/ChatInterface';

const ChatAssistant: React.FC = () => {
  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      <header className="px-4 py-3 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
        <h1 className="text-xl font-bold">KORA</h1>
        <button className="rounded-full p-2 bg-gray-100 dark:bg-gray-800">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </button>
      </header>
      
      <div className="flex-1 overflow-hidden">
        <ChatInterface />
      </div>
    </div>
  );
};

export default ChatAssistant;
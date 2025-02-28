import React from 'react';

const ChatAssistant: React.FC = () => {
  console.log("ChatAssistant rendering"); // Debug log
  
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Kora Chat Assistant</h1>
      <p className="mb-4">Welcome to the Kora Assistant interface.</p>
      <div className="p-4 bg-gray-100 rounded-lg">
        <p>This is a simple placeholder for the chat interface.</p>
      </div>
    </div>
  );
};

export default ChatAssistant;
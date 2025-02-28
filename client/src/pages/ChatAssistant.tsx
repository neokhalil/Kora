import React, { useState } from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

// Define the message types
interface Message {
  id: string;
  content: string;
  sender: 'user' | 'kora';
}

const ChatAssistant: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: "Bonjour ! Je suis Kora, ton assistant éducatif. Comment puis-je t'aider aujourd'hui ?",
      sender: 'kora',
    }
  ]);
  const [inputValue, setInputValue] = useState('');

  const handleSendMessage = () => {
    if (inputValue.trim() === '') return;
    
    // Add user message to chat
    const userMessageId = Date.now().toString();
    const userMessage: Message = {
      id: userMessageId,
      content: inputValue,
      sender: 'user',
    };
    
    setMessages(prev => [...prev, userMessage]);
    
    // Simulate a response
    setTimeout(() => {
      const koraResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: "Je peux t'aider avec ça. Pourrais-tu me donner plus de détails sur ta question ? Je peux t'aider avec des équations, des problèmes de géométrie, des analyses de textes, etc.",
        sender: 'kora',
      };
      
      setMessages(prev => [...prev, koraResponse]);
    }, 1000);
    
    setInputValue('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Format the chat bubbles based on the design
  const renderMessage = (message: Message) => {
    if (message.sender === 'user') {
      return (
        <div key={message.id} className="flex justify-end mb-4">
          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg py-2 px-4 max-w-[80%]">
            <p className="text-gray-800 dark:text-gray-200">{message.content}</p>
          </div>
        </div>
      );
    }
    
    return (
      <div key={message.id} className="flex mb-4">
        <div className="bg-blue-50 dark:bg-gray-700 rounded-lg py-3 px-4 max-w-[80%]">
          <div className="whitespace-pre-wrap text-gray-800 dark:text-gray-200">
            {message.content}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 p-4">
        <h1 className="text-xl font-semibold">Kora Assistant</h1>
        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
          En ligne
        </span>
      </div>
      
      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Chat messages area */}
        <div className="flex-1 overflow-y-auto p-4">
          {messages.map(renderMessage)}
        </div>
        
        {/* Input area */}
        <div className="border-t p-3">
          <div className="flex items-center space-x-2">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Écrivez votre message ici..."
              className="flex-1"
            />
            <Button 
              size="icon" 
              disabled={!inputValue.trim()} 
              onClick={handleSendMessage}
            >
              <Send className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatAssistant;
import React, { useState, useRef, useEffect } from 'react';
import { PaperclipIcon, Send, Mic, ThumbsUp, ThumbsDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar } from '@/components/ui/avatar';

// Define the message types
interface Message {
  id: string;
  content: string;
  sender: 'user' | 'kora';
  timestamp: Date;
  includeSteps?: boolean;
  includeVideo?: boolean;
  isRated?: boolean;
}

const ChatAssistant: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    // Default welcome message
    {
      id: '1',
      content: "Bonjour ! Je suis Kora, ton assistant éducatif. Comment puis-je t'aider aujourd'hui ?",
      sender: 'kora',
      timestamp: new Date(),
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [wsConnected, setWsConnected] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<WebSocket | null>(null);
  
  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initialize WebSocket connection
  useEffect(() => {
    let socket: WebSocket | null = null;
    
    const connectWebSocket = () => {
      try {
        // Create WebSocket connection
        const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
        const host = window.location.host;
        const wsUrl = `${protocol}//${host}/ws`;
        
        console.log('Attempting to connect to WebSocket at:', wsUrl);
        
        socket = new WebSocket(wsUrl);
        socketRef.current = socket;
        
        // Connection opened
        socket.addEventListener('open', () => {
          console.log('Connected to WebSocket server');
          setWsConnected(true);
        });
        
        // Listen for messages
        socket.addEventListener('message', (event) => {
          try {
            const data = JSON.parse(event.data);
            console.log('Message from server:', data);
            
            if (data.type === 'welcome') {
              // Handle welcome message
              setMessages([{
                id: Date.now().toString(),
                content: data.message,
                sender: 'kora',
                timestamp: new Date(data.timestamp)
              }]);
            } else if (data.type === 'chat') {
              // Handle chat message
              setMessages(prev => [...prev, {
                id: Date.now().toString(),
                content: data.content,
                sender: 'kora',
                timestamp: new Date(data.timestamp),
                includeSteps: data.includeSteps,
                includeVideo: data.includeVideo
              }]);
            } else if (data.type === 'error') {
              // Handle error message
              setMessages(prev => [...prev, {
                id: Date.now().toString(),
                content: data.message,
                sender: 'kora',
                timestamp: new Date(data.timestamp)
              }]);
            }
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        });
        
        // Connection closed
        socket.addEventListener('close', () => {
          console.log('Disconnected from WebSocket server');
          setWsConnected(false);
        });
        
        // Connection error
        socket.addEventListener('error', (error) => {
          console.error('WebSocket error:', error);
          setWsConnected(false);
        });
      } catch (error) {
        console.error('Error setting up WebSocket:', error);
        setWsConnected(false);
      }
    };
    
    connectWebSocket();
    
    // Cleanup function
    return () => {
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.close();
      }
    };
  }, []);

  const handleSendMessage = () => {
    if (inputValue.trim() === '') return;
    
    // Add user message to chat
    const userMessageId = Date.now().toString();
    const userMessage: Message = {
      id: userMessageId,
      content: inputValue,
      sender: 'user',
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    
    // Simulate a response if WebSocket is not connected
    setTimeout(() => {
      const koraResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: "Je peux t'aider avec ça. Pourrais-tu me donner plus de détails sur ta question ? Je peux t'aider avec des équations, des problèmes de géométrie, des analyses de textes, etc.",
        sender: 'kora',
        timestamp: new Date()
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

  const rateMessage = (messageId: string, isHelpful: boolean) => {
    setMessages(prev => 
      prev.map(msg => 
        msg.id === messageId 
          ? { ...msg, isRated: true } 
          : msg
      )
    );
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
          
          {message.includeVideo && (
            <div className="mt-3 bg-gray-200 rounded-lg aspect-video flex items-center justify-center">
              <div className="text-gray-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          )}
          
          {!message.isRated && (
            <div className="mt-2 flex items-center justify-end space-x-1 text-xs text-gray-500">
              <span>Cela a-t-il été utile ?</span>
              <Button 
                variant="ghost" 
                size="sm" 
                className="p-1 h-auto"
                onClick={() => rateMessage(message.id, true)}
              >
                <ThumbsUp className="h-3 w-3" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="p-1 h-auto"
                onClick={() => rateMessage(message.id, false)}
              >
                <ThumbsDown className="h-3 w-3" />
              </Button>
            </div>
          )}
          
          {message.isRated && (
            <div className="mt-2 flex justify-end text-xs text-gray-500">
              <span>Merci pour votre retour</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto">
      <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 p-4">
        <h1 className="text-xl font-semibold">Kora Assistant</h1>
        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
          En ligne
        </span>
      </div>
      
      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Chat messages area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map(renderMessage)}
          <div ref={messagesEndRef} />
        </div>
        
        {/* Action buttons */}
        <div className="px-4 pb-2">
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1"
            >
              <span className="mr-2">Ré-explique</span>
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1"
            >
              <span className="mr-2">Évalue moi</span>
            </Button>
          </div>
        </div>
        
        {/* Input area */}
        <div className="border-t p-3">
          <div className="flex items-center space-x-2">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Message Kora"
              className="flex-1"
            />
            <Button variant="ghost" size="icon">
              <PaperclipIcon className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon">
              <Mic className="h-5 w-5" />
            </Button>
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
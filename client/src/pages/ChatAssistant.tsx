import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, ThumbsUp, ThumbsDown, RefreshCw, Brain } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';

// Define the message types
interface Message {
  id: string;
  content: string;
  sender: 'user' | 'kora';
  isReExplanation?: boolean;
  isChallenge?: boolean;
  allowActions?: boolean;
  messageId?: string;
}

// Define the AI tutoring component
const ChatAssistant: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: "Bonjour ! Je suis Kora, ton assistant éducatif. Comment puis-je t'aider aujourd'hui ? Je peux t'aider avec les mathématiques, la physique, la chimie, la littérature, et bien plus encore.",
      sender: 'kora',
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<WebSocket | null>(null);
  
  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Initialize WebSocket connection
  useEffect(() => {
    // Connect to WebSocket server
    const connectWebSocket = () => {
      try {
        const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
        const host = window.location.host;
        const wsUrl = `${protocol}//${host}/ws`;
        
        console.log('Connecting to WebSocket server at:', wsUrl);
        
        const socket = new WebSocket(wsUrl);
        socketRef.current = socket;
        
        // Connection opened
        socket.addEventListener('open', () => {
          console.log('Connected to WebSocket server');
          setIsConnected(true);
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
              }]);
            } else if (data.type === 'chat') {
              // Handle chat message from AI
              setIsThinking(false);
              setMessages(prev => [...prev, {
                id: Date.now().toString(),
                content: data.content,
                sender: 'kora',
                isReExplanation: data.isReExplanation,
                isChallenge: data.isChallenge,
                allowActions: data.allowActions,
                messageId: data.messageId
              }]);
            } else if (data.type === 'status' && data.status === 'thinking') {
              // Handle thinking status
              setIsThinking(true);
            } else if (data.type === 'error') {
              // Handle error message
              setIsThinking(false);
              setMessages(prev => [...prev, {
                id: Date.now().toString(),
                content: data.message,
                sender: 'kora',
              }]);
            }
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        });
        
        // Connection closed
        socket.addEventListener('close', () => {
          console.log('Disconnected from WebSocket server');
          setIsConnected(false);
          
          // Try to reconnect after a delay
          setTimeout(() => {
            if (socketRef.current?.readyState !== WebSocket.OPEN) {
              connectWebSocket();
            }
          }, 5000);
        });
        
        // Connection error
        socket.addEventListener('error', (error) => {
          console.error('WebSocket error:', error);
          setIsConnected(false);
        });
      } catch (error) {
        console.error('Error setting up WebSocket:', error);
        setIsConnected(false);
      }
    };
    
    connectWebSocket();
    
    // Cleanup function
    return () => {
      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        socketRef.current.close();
      }
    };
  }, []);
  
  // Send a message to the server via WebSocket
  const sendMessage = (type: string, content: any) => {
    if (
      socketRef.current && 
      socketRef.current.readyState === WebSocket.OPEN
    ) {
      socketRef.current.send(JSON.stringify({
        type,
        ...content
      }));
      return true;
    }
    return false;
  };
  
  // Handle sending user message
  const handleSendMessage = () => {
    if (inputValue.trim() === '') return;
    
    // Add user message to chat
    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      sender: 'user',
    };
    
    setMessages(prev => [...prev, userMessage]);
    
    // Send to WebSocket server if connected
    if (sendMessage('chat', { content: inputValue })) {
      // Message sent successfully
    } else {
      // WebSocket not connected, use simulated response
      setIsThinking(true);
      
      // Simulate a response delay
      setTimeout(() => {
        setIsThinking(false);
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          content: "Je ne suis pas connecté au serveur actuellement. Mais je peux t'aider avec des mathématiques, des sciences, ou d'autres sujets. Pose-moi une question!",
          sender: 'kora',
        }]);
      }, 1500);
    }
    
    setInputValue('');
  };
  
  // Handle requesting a re-explanation
  const handleReExplain = () => {
    sendMessage('reexplain', {});
    setIsThinking(true);
  };
  
  // Handle requesting a challenge problem
  const handleChallenge = () => {
    sendMessage('challenge', {});
    setIsThinking(true);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  // Helper function to parse and render math content
  const renderMathContent = (content: string) => {
    // Regular expression to identify LaTeX blocks and inline math
    // This matches both $...$ and $$...$$ and \(...\) and \[...\]
    const blockMathRegex = /\$\$([\s\S]*?)\$\$|\\\[([\s\S]*?)\\\]/g;
    const inlineMathRegex = /\$([\s\S]*?)\$|\\\(([\s\S]*?)\\\)/g;
    
    // Split content by math expressions
    let parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match;
    
    // First handle block math expressions ($$...$$)
    const contentWithBlockMath = content.replace(blockMathRegex, (match, group1, group2) => {
      const formula = group1 || group2;
      // Replace with a placeholder that won't be affected by inline matching
      return `__BLOCK_MATH_${parts.length}__`;
    });
    
    // Then handle inline math expressions ($...$)
    let currentContent = contentWithBlockMath;
    while ((match = inlineMathRegex.exec(currentContent)) !== null) {
      // Add text before the math
      if (match.index > lastIndex) {
        parts.push(currentContent.substring(lastIndex, match.index));
      }
      
      // Extract the math formula (without the delimiters)
      const formula = match[1] || match[2];
      
      try {
        // Add the math component
        parts.push(
          <InlineMath key={`inline-${parts.length}`} math={formula} />
        );
      } catch (error) {
        // Fallback if math rendering fails
        console.error('Error rendering math:', error);
        parts.push(<span key={`error-${parts.length}`}>{match[0]}</span>);
      }
      
      lastIndex = match.index + match[0].length;
    }
    
    // Add any remaining text
    if (lastIndex < currentContent.length) {
      parts.push(currentContent.substring(lastIndex));
    }
    
    // Replace block math placeholders with actual BlockMath components
    const finalParts: React.ReactNode[] = [];
    parts.forEach(part => {
      if (typeof part !== 'string') {
        finalParts.push(part);
        return;
      }
      
      // Check for block math placeholders
      const blockParts = part.split(/__BLOCK_MATH_(\d+)__/g);
      for (let i = 0; i < blockParts.length; i++) {
        if (i % 2 === 0) {
          // Regular text
          if (blockParts[i]) finalParts.push(blockParts[i]);
        } else {
          // Block math index
          try {
            const formula = content.match(blockMathRegex)?.[Number(blockParts[i])]?.replace(/^\$\$|\$\$$|\\\[|\\\]$/g, '');
            if (formula) {
              finalParts.push(
                <div key={`block-${blockParts[i]}`} className="my-2">
                  <BlockMath math={formula} />
                </div>
              );
            }
          } catch (error) {
            console.error('Error rendering block math:', error);
            finalParts.push(<span key={`error-block-${blockParts[i]}`}>[Math rendering error]</span>);
          }
        }
      }
    });
    
    return finalParts;
  };

  // Format the chat bubbles based on the design
  const renderMessage = (message: Message) => {
    if (message.sender === 'user') {
      return (
        <div key={message.id} className="flex justify-end mb-4">
          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg py-3 px-4 max-w-[80%]">
            <p className="text-gray-800 dark:text-gray-200">{message.content}</p>
          </div>
        </div>
      );
    }
    
    return (
      <div key={message.id} className="flex mb-4">
        <div className="bg-blue-50 dark:bg-gray-700 rounded-lg py-3 px-4 max-w-[80%]">
          {message.isReExplanation && (
            <div className="flex items-center mb-2 text-sm text-blue-600 dark:text-blue-400">
              <RefreshCw className="h-4 w-4 mr-1" />
              <span>Nouvelle explication</span>
            </div>
          )}
          
          {message.isChallenge && (
            <div className="flex items-center mb-2 text-sm text-purple-600 dark:text-purple-400">
              <Brain className="h-4 w-4 mr-1" />
              <span>Problème défi</span>
            </div>
          )}
          
          <div className="whitespace-pre-wrap text-gray-800 dark:text-gray-200">
            {renderMathContent(message.content)}
          </div>
          
          {message.allowActions && (
            <div className="mt-3 pt-2 border-t border-gray-200 dark:border-gray-600">
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-xs"
                  onClick={handleReExplain}
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Ré-explique
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-xs"
                  onClick={handleChallenge}
                >
                  <Brain className="h-3 w-3 mr-1" />
                  Défi-moi
                </Button>
              </div>
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
        <div className="flex items-center">
          <span className={`px-2 py-1 text-xs rounded-full ${
            isConnected 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {isConnected ? 'En ligne' : 'Hors ligne'}
          </span>
        </div>
      </div>
      
      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Chat messages area */}
        <div className="flex-1 overflow-y-auto p-4">
          {messages.map(renderMessage)}
          
          {/* Thinking indicator */}
          {isThinking && (
            <div className="flex mb-4">
              <div className="bg-blue-50 dark:bg-gray-700 rounded-lg py-3 px-4">
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
                  <span className="text-gray-500 text-sm">Kora réfléchit...</span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
        
        {/* Input area */}
        <div className="border-t p-3">
          <div className="flex items-center space-x-2">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Pose ta question à Kora..."
              className="flex-1"
              disabled={isThinking}
            />
            <Button 
              size="icon" 
              disabled={!inputValue.trim() || isThinking} 
              onClick={handleSendMessage}
            >
              <Send className="h-5 w-5" />
            </Button>
          </div>
          
          <div className="mt-2 text-xs text-gray-500 text-center">
            Kora est un assistant IA. Pose une question sur tes devoirs ou études.
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatAssistant;
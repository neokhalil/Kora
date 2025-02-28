import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, ThumbsUp, ThumbsDown, RefreshCw, Brain } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';
import ReactMarkdown from 'react-markdown';

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
  
  // Custom renderer for markdown that preserves and renders LaTeX
  const CustomMarkdownRenderer = ({ content }: { content: string }) => {
    // Pre-process to protect LaTeX from markdown processing
    // Replace LaTeX blocks and inline math with placeholders
    const blockMathRegex = /\$\$([\s\S]*?)\$\$|\\\[([\s\S]*?)\\\]/g;
    const inlineMathRegex = /\$([\s\S]*?)\$|\\\(([\s\S]*?)\\\)/g;
    
    const mathExpressions: { type: 'block' | 'inline', formula: string }[] = [];
    
    // First handle block math expressions ($$...$$)
    let processedContent = content.replace(blockMathRegex, (match, group1, group2) => {
      const formula = group1 || group2;
      mathExpressions.push({ type: 'block', formula });
      return `::BLOCK_MATH_${mathExpressions.length - 1}::`;
    });
    
    // Then handle inline math expressions ($...$)
    processedContent = processedContent.replace(inlineMathRegex, (match, group1, group2) => {
      const formula = group1 || group2;
      mathExpressions.push({ type: 'inline', formula });
      return `::INLINE_MATH_${mathExpressions.length - 1}::`;
    });
    
    // Replace markdown headers with proper HTML tags to handle formatting
    // Convert **patterns** to proper markdown headers
    processedContent = processedContent.replace(/\*\*(Étape \d+.*?)\*\*/g, (match, content) => {
      return `### ${content}`;
    });
    
    // Convert **Important :** to proper emphasis
    processedContent = processedContent.replace(/\*\*(Important|Remarque|Note|Attention)(\s*:)\*\*/g, (match, type, punctuation) => {
      return `### ${type}${punctuation}`;
    });
    
    // Ensure proper rendering of lists
    // Convert "- " at start of lines to proper markdown bullet points if not already
    processedContent = processedContent.replace(/^- ([^*])/gm, '* $1');
    
    // Convert "1. " at start of lines to proper ordered lists if not already  
    processedContent = processedContent.replace(/^(\d+)\. /gm, '$1\\. ');
    
    // Convert bold and italic text that might not be properly formatted
    processedContent = processedContent.replace(/(\*\*\*|___)(.*?)(\*\*\*|___)/g, '***$2***'); // Bold italic
    
    // Handle horizontal rules that might be inconsistently marked
    processedContent = processedContent.replace(/^(-{3,}|\*{3,})$/gm, '---');
    
    // Custom component for rendering markdown with proper math rendering
    const components = {
      // Custom paragraph rendering with math support
      p: ({ node, children, ...props }: any) => {
        // Process children to replace math placeholders
        let processedChildren: React.ReactNode[] = [];
        if (typeof children === 'string') {
          const parts = children.split(/::(BLOCK|INLINE)_MATH_(\d+)::/);
          for (let i = 0; i < parts.length; i++) {
            if (i % 3 === 0) {
              // Regular text
              if (parts[i]) processedChildren.push(parts[i]);
            } else if (i % 3 === 1) {
              // Math type (BLOCK or INLINE)
              const mathType = parts[i] as 'BLOCK' | 'INLINE';
              const mathIndex = parseInt(parts[i + 1]);
              const mathExpr = mathExpressions[mathIndex];
              
              if (mathExpr) {
                if (mathType === 'BLOCK') {
                  // Block math
                  processedChildren.push(
                    <div key={`block-${mathIndex}`} className="my-2">
                      <BlockMath math={mathExpr.formula} />
                    </div>
                  );
                } else {
                  // Inline math
                  processedChildren.push(
                    <InlineMath key={`inline-${mathIndex}`} math={mathExpr.formula} />
                  );
                }
              }
              
              // Skip the next part (the index)
              i++;
            }
          }
          return <p {...props}>{processedChildren}</p>;
        }
        
        return <p {...props}>{children}</p>;
      },
      
      // Custom rendering for headings
      h1: ({ node, children, ...props }: any) => (
        <h1 className="text-2xl font-bold mt-5 mb-3 text-blue-800 dark:text-blue-300" {...props}>
          {children}
        </h1>
      ),
      h2: ({ node, children, ...props }: any) => (
        <h2 className="text-xl font-semibold mt-4 mb-2 text-blue-700 dark:text-blue-400" {...props}>
          {children}
        </h2>
      ),
      h3: ({ node, children, ...props }: any) => (
        <h3 className="text-lg font-semibold mt-4 mb-2 text-blue-700 dark:text-blue-400" {...props}>
          {children}
        </h3>
      ),
      h4: ({ node, children, ...props }: any) => (
        <h4 className="text-base font-medium mt-3 mb-1 text-blue-600 dark:text-blue-500" {...props}>
          {children}
        </h4>
      ),
      
      // Enhanced list items with better spacing
      ul: ({ node, children, ...props }: any) => (
        <ul className="list-disc pl-5 my-3 space-y-1" {...props}>
          {children}
        </ul>
      ),
      ol: ({ node, children, ...props }: any) => (
        <ol className="list-decimal pl-5 my-3 space-y-1" {...props}>
          {children}
        </ol>
      ),
      li: ({ node, children, ...props }: any) => {
        // Process children to replace math placeholders in list items
        let processedChildren: React.ReactNode[] = [];
        if (typeof children === 'string') {
          const parts = children.split(/::(BLOCK|INLINE)_MATH_(\d+)::/);
          for (let i = 0; i < parts.length; i++) {
            if (i % 3 === 0) {
              // Regular text
              if (parts[i]) processedChildren.push(parts[i]);
            } else if (i % 3 === 1) {
              // Math type (BLOCK or INLINE)
              const mathType = parts[i] as 'BLOCK' | 'INLINE';
              const mathIndex = parseInt(parts[i + 1]);
              const mathExpr = mathExpressions[mathIndex];
              
              if (mathExpr) {
                if (mathType === 'BLOCK') {
                  processedChildren.push(
                    <div key={`block-${mathIndex}`} className="my-1">
                      <BlockMath math={mathExpr.formula} />
                    </div>
                  );
                } else {
                  processedChildren.push(
                    <InlineMath key={`inline-${mathIndex}`} math={mathExpr.formula} />
                  );
                }
              }
              
              // Skip the next part (the index)
              i++;
            }
          }
          return <li {...props}>{processedChildren}</li>;
        }
        
        return <li {...props}>{children}</li>;
      },
      
      // Better styling for code blocks and inline code
      code: ({ node, inline, className, children, ...props }: any) => {
        return inline ? (
          <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-sm font-mono" {...props}>
            {children}
          </code>
        ) : (
          <code
            className="block bg-gray-100 dark:bg-gray-800 p-3 rounded-md text-sm font-mono overflow-x-auto"
            {...props}
          >
            {children}
          </code>
        );
      },
      
      // Enhanced styling for blockquotes
      blockquote: ({ node, children, ...props }: any) => (
        <blockquote
          className="border-l-4 border-blue-300 dark:border-blue-700 pl-4 py-1 my-3 text-gray-700 dark:text-gray-300 italic"
          {...props}
        >
          {children}
        </blockquote>
      ),
      
      // Custom horizontal rule
      hr: ({ node, ...props }: any) => (
        <hr className="my-5 border-t-2 border-gray-200 dark:border-gray-700" {...props} />
      ),
    };
    
    return (
      <ReactMarkdown components={components}>
        {processedContent}
      </ReactMarkdown>
    );
  };

  // Format the chat bubbles based on the design with Markdown support

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
          
          <div className="text-gray-800 dark:text-gray-200">
            <CustomMarkdownRenderer content={message.content} />
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
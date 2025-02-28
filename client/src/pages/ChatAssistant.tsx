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
    // A simpler two-pass approach:
    // 1. First render all math with simplified placeholders
    // 2. Then render markdown with the placeholders
    
    // Step 1: Extract all math and replace with unique placeholders
    const mathExpressions: Array<{
      id: string;
      isBlock: boolean;
      formula: string;
    }> = [];
    
    // Process block math expressions
    const blockMathRegex = /\$\$([\s\S]*?)\$\$|\\\[([\s\S]*?)\\\]/g;
    let processedContent = content.replace(blockMathRegex, (match, group1, group2) => {
      const formula = group1 || group2;
      const id = `math-${mathExpressions.length}`;
      mathExpressions.push({
        id,
        isBlock: true,
        formula
      });
      return `[MATH-BLOCK-${id}]`;
    });
    
    // Process inline math expressions
    const inlineMathRegex = /\$((?!\$)[\s\S]*?)\$|\\\(([\s\S]*?)\\\)/g;
    processedContent = processedContent.replace(inlineMathRegex, (match, group1, group2) => {
      const formula = group1 || group2;
      const id = `math-${mathExpressions.length}`;
      mathExpressions.push({
        id,
        isBlock: false,
        formula
      });
      return `[MATH-INLINE-${id}]`;
    });
    
    // Format markdown titles and sections
    processedContent = processedContent
      // Replace **Étape N:** with markdown headers
      .replace(/\*\*(Étape \d+.*?)\*\*/g, '### $1')
      // Replace **Important:** with headers
      .replace(/\*\*(Important|Remarque|Note|Attention)(\s*:)\*\*/g, '### $1$2')
      // Ensure consistent list formatting
      .replace(/^- ([^*])/gm, '* $1')
      .replace(/^(\d+)\. /gm, '$1\\. ');
    
    // Step 2: Render the markdown content 
    const renderMathFromPlaceholder = (text: string) => {
      if (!text) return null;
      
      // Quick check if we have math to process
      if (!text.includes('[MATH-')) {
        return text;
      }
      
      // Process all math placeholders
      const blockRegex = /\[MATH-BLOCK-(math-\d+)\]/g;
      const inlineRegex = /\[MATH-INLINE-(math-\d+)\]/g;
      
      // First replace all block math
      const parts: React.ReactNode[] = [];
      let lastEnd = 0;
      let match;
      
      // Handle block math
      while ((match = blockRegex.exec(text)) !== null) {
        const beforeText = text.substring(lastEnd, match.index);
        if (beforeText) {
          parts.push(beforeText);
        }
        
        const mathId = match[1];
        const mathItem = mathExpressions.find(m => m.id === mathId);
        
        if (mathItem) {
          parts.push(
            <div key={mathId} className="my-2">
              <BlockMath math={mathItem.formula} />
            </div>
          );
        } else {
          parts.push(`[Error: Math block not found]`);
        }
        
        lastEnd = match.index + match[0].length;
      }
      
      // Add the remaining text
      if (lastEnd < text.length) {
        parts.push(text.substring(lastEnd));
      }
      
      // Now process inline math in each text node
      const processedParts: React.ReactNode[] = [];
      
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        
        if (typeof part !== 'string') {
          processedParts.push(part);
          continue;
        }
        
        const textPart = part as string;
        const inlineParts: React.ReactNode[] = [];
        let inlineLastEnd = 0;
        let inlineMatch;
        
        // Reset the regex for each string part
        inlineRegex.lastIndex = 0;
        
        while ((inlineMatch = inlineRegex.exec(textPart)) !== null) {
          const beforeInlineText = textPart.substring(inlineLastEnd, inlineMatch.index);
          if (beforeInlineText) {
            inlineParts.push(beforeInlineText);
          }
          
          const mathId = inlineMatch[1];
          const mathItem = mathExpressions.find(m => m.id === mathId);
          
          if (mathItem) {
            inlineParts.push(
              <InlineMath key={mathId} math={mathItem.formula} />
            );
          } else {
            inlineParts.push(`[Error: Inline math not found]`);
          }
          
          inlineLastEnd = inlineMatch.index + inlineMatch[0].length;
        }
        
        // Add remaining text from this part
        if (inlineLastEnd < textPart.length) {
          inlineParts.push(textPart.substring(inlineLastEnd));
        }
        
        if (inlineParts.length === 1) {
          processedParts.push(inlineParts[0]);
        } else {
          processedParts.push(<React.Fragment key={`inline-group-${i}`}>{inlineParts}</React.Fragment>);
        }
      }
      
      if (processedParts.length === 1) {
        return processedParts[0];
      }
      
      return <>{processedParts}</>;
    };
    
    // Custom component for rendering markdown with proper math rendering
    const components = {
      
      // Custom paragraph rendering with math support
      p: ({ node, children, ...props }: any) => {
        // Find text nodes and replace math placeholders with components
        const processedChildren = React.Children.map(children, child => {
          // If it's a string, check for math placeholders
          if (typeof child === 'string') {
            return renderMathFromPlaceholder(child);
          }
          return child;
        });
        
        return <p {...props}>{processedChildren}</p>;
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
        // Find text nodes and replace math placeholders with components
        const processedChildren = React.Children.map(children, child => {
          // If it's a string, check for math placeholders
          if (typeof child === 'string') {
            return renderMathFromPlaceholder(child);
          }
          return child;
        });
        
        return <li {...props}>{processedChildren}</li>;
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
      
      // Process all components with mathematical content
      strong: ({ node, children, ...props }: any) => {
        const processedChildren = React.Children.map(children, child => 
          processMathPlaceholders(child)
        );
        return <strong {...props}>{processedChildren}</strong>;
      },
      em: ({ node, children, ...props }: any) => {
        const processedChildren = React.Children.map(children, child => 
          processMathPlaceholders(child)
        );
        return <em {...props}>{processedChildren}</em>;
      },
      a: ({ node, children, ...props }: any) => {
        const processedChildren = React.Children.map(children, child => 
          processMathPlaceholders(child)
        );
        return <a {...props}>{processedChildren}</a>;
      },
      span: ({ node, children, ...props }: any) => {
        const processedChildren = React.Children.map(children, child => 
          processMathPlaceholders(child)
        );
        return <span {...props}>{processedChildren}</span>;
      },
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
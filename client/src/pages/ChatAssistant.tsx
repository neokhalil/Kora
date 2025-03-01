import React, { useState, useRef, useEffect, ChangeEvent } from 'react';
import { 
  Send, 
  Loader2, 
  ThumbsUp, 
  ThumbsDown, 
  RefreshCw, 
  Brain, 
  FileText, 
  X, 
  Camera, 
  Mic, 
  Square, 
  AlertCircle 
} from 'lucide-react';
import { Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import VoiceRecorder from '@/components/VoiceRecorder';
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';
import ReactMarkdown from 'react-markdown';

// Define the message types
interface ChallengeData {
  questionId?: string;
  expectedAnswer?: string;
  userAnswer?: string;
  isAnswered?: boolean;
  isCorrect?: boolean;
  challengeType?: string;    // Type of challenge: 'arithmetic', 'algebra', 'geometry', 'calculus'
  solution?: string;         // Detailed solution text that will be shown when user clicks "Voir la solution"
}

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'kora';
  isReExplanation?: boolean;
  isChallenge?: boolean;
  isImageAnalysis?: boolean;
  allowActions?: boolean;
  messageId?: string;
  challengeData?: ChallengeData;
  imageUrl?: string;
}

// Define the AI tutoring component
const ChatAssistant: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: "Je suis Kora, un assistant IA qui peut t'aider dans tes études. Tu peux me poser des questions sur tes devoirs, me demander des explications sur un concept, ou partager une photo d'un problème que tu essaies de résoudre.",
      sender: 'kora',
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [challengeAnswers, setChallengeAnswers] = useState<Record<string, string>>({});
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageSubject, setImageSubject] = useState<string>('general');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  // Retirer l'état de la caméra active car nous utiliserons l'appareil photo intégré
  // const [isCameraActive, setIsCameraActive] = useState(false);
  const [isMobileDevice, setIsMobileDevice] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Nous n'avons plus besoin des références vidéo et canvas
  // puisque nous utilisons l'appareil photo natif du téléphone
  
  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      // Forcer la détection comme mobile pour les tests
      const isMobile = true;
      // const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || 
      //                (window.matchMedia && window.matchMedia('(max-width: 768px)').matches);
      console.log('Device detection:', { 
        userAgent: navigator.userAgent,
        isMediaQueryMatch: window.matchMedia && window.matchMedia('(max-width: 768px)').matches,
        isMobileDetected: isMobile 
      });
      setIsMobileDevice(isMobile);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);
  
  // Connect to WebSocket server
  useEffect(() => {
    // Check if we are in a browser environment
    if (typeof window !== 'undefined') {
      const connectWebSocket = () => {
        try {
          // Get the current protocol (ws or wss) based on HTTP/HTTPS
          const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
          // Create the WebSocket URL using the current host and the /ws path
          const wsUrl = `${protocol}//${window.location.host}/ws`;
          
          const socket = new WebSocket(wsUrl);
          
          socket.onopen = () => {
            console.log('WebSocket connected');
            setIsConnected(true);
            socketRef.current = socket;
          };
          
          socket.onmessage = (event) => {
            // Process incoming WebSocket messages
            try {
              const data = JSON.parse(event.data);
              console.log('WebSocket message received:', data);
              
              if (data.type === 'chat-response') {
                handleChatResponse(data.message);
              }
            } catch (error) {
              console.error('Error parsing WebSocket message:', error);
            }
          };
          
          socket.onclose = () => {
            console.log('WebSocket disconnected');
            setIsConnected(false);
            socketRef.current = null;
            
            // Try to reconnect after a delay
            setTimeout(() => {
              connectWebSocket();
            }, 5000);
          };
          
          socket.onerror = (error) => {
            console.error('WebSocket error:', error);
            socket.close();
          };
        } catch (error) {
          console.error('Error creating WebSocket connection:', error);
        }
      };
      
      connectWebSocket();
      
      return () => {
        if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
          socketRef.current.close();
        }
      };
    }
  }, []);
  
  // Send a message via WebSocket
  const sendMessage = (type: string, payload: any): boolean => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      const message = {
        type,
        payload
      };
      socketRef.current.send(JSON.stringify(message));
      return true;
    }
    return false;
  };
  
  // Handle chat response from the server
  const handleChatResponse = (response: string) => {
    setIsThinking(false);
    
    const newMessage: Message = {
      id: Date.now().toString(),
      content: response,
      sender: 'kora',
      allowActions: true
    };
    
    setMessages(prev => [...prev, newMessage]);
  };
  
  // Handle sending a message
  const handleSendMessage = () => {
    if (!inputValue.trim()) return;
    
    // Add user message to chat
    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      sender: 'user',
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsThinking(true);
    
    // Send to WebSocket server if connected
    if (sendMessage('chat', { content: inputValue })) {
      // Message sent successfully
    } else {
      // WebSocket not connected, use fallback
      setTimeout(() => {
        setIsThinking(false);
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          content: "Je ne suis pas connecté au serveur actuellement. Mais je peux t'aider avec des mathématiques, des sciences, ou d'autres sujets. Pose-moi une question!",
          sender: 'kora',
        }]);
      }, 1500);
    }
  };
  
  // Handle key press in input field
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (selectedImage) {
        handleImageAnalysis();
      } else {
        handleSendMessage();
      }
    }
  };
  
  // Request a re-explanation
  const handleReExplain = () => {
    const lastKoraMessage = [...messages].reverse().find(m => m.sender === 'kora');
    
    if (lastKoraMessage) {
      setIsThinking(true);
      
      // Send to WebSocket server if connected
      if (sendMessage('reexplain', { messageId: lastKoraMessage.id })) {
        // Message sent successfully
      } else {
        // WebSocket not connected, use fallback
        setTimeout(() => {
          setIsThinking(false);
          
          const reexplainMessage: Message = {
            id: Date.now().toString(),
            content: "Voici une autre façon d'expliquer: Le concept peut être abordé différemment en considérant...",
            sender: 'kora',
            isReExplanation: true,
          };
          
          setMessages(prev => [...prev, reexplainMessage]);
        }, 1500);
      }
    }
  };
  
  // Request a challenge problem
  const handleChallenge = () => {
    setIsThinking(true);
    
    // Send to WebSocket server if connected
    if (sendMessage('challenge', {})) {
      // Message sent successfully
    } else {
      // WebSocket not connected, use fallback
      setTimeout(() => {
        setIsThinking(false);
        
        // Create a simple arithmetic challenge
        const a = Math.floor(Math.random() * 10) + 1;
        const b = Math.floor(Math.random() * 10) + 1;
        const operator = Math.random() < 0.5 ? '+' : '-';
        let result, equation, answer;
        
        switch (operator) {
          case '+':
            result = a + b;
            equation = `${a} + ${b}`;
            answer = result.toString();
            break;
          case '-':
            result = a - b;
            equation = `${a} - ${b}`;
            answer = result.toString();
            break;
          default:
            result = a + b;
            equation = `${a} + ${b}`;
            answer = result.toString();
        }
        
        const challengeMessage: Message = {
          id: Date.now().toString(),
          content: `### Nouveau défi:\n\nCalcule: $${equation} = ?$\n\nEntre ta réponse ci-dessous.`,
          sender: 'kora',
          isChallenge: true,
          challengeData: {
            expectedAnswer: answer,
            isAnswered: false,
            challengeType: 'arithmetic'
          }
        };
        
        setMessages(prev => [...prev, challengeMessage]);
      }, 1500);
    }
  };
  
  // Handle change in challenge answer input
  const handleChallengeAnswerChange = (messageId: string, value: string) => {
    setChallengeAnswers(prev => ({
      ...prev,
      [messageId]: value
    }));
  };
  
  // Submit an answer to a challenge
  const handleSubmitChallengeAnswer = (messageId: string) => {
    const userAnswer = challengeAnswers[messageId]?.trim();
    if (!userAnswer) return;
    
    // Find the challenge message
    const messageIndex = messages.findIndex(m => m.id === messageId);
    if (messageIndex === -1) return;
    
    const challengeMessage = messages[messageIndex];
    const expectedAnswer = challengeMessage.challengeData?.expectedAnswer;
    
    if (!expectedAnswer) return;
    
    // Check if the answer is correct (simple string comparison for now)
    const isCorrect = userAnswer === expectedAnswer;
    
    // Update the challenge message with the result
    const updatedMessages = [...messages];
    updatedMessages[messageIndex] = {
      ...challengeMessage,
      challengeData: {
        ...challengeMessage.challengeData,
        isAnswered: true,
        isCorrect,
        userAnswer
      }
    };
    
    setMessages(updatedMessages);
    
    // If the answer is correct, show a success message
    if (isCorrect) {
      // TODO: Show success toast or message
    }
  };
  
  // Open the file browser to select an image
  const handleOpenFileBrowser = () => {
    fileInputRef.current?.click();
  };
  
  // Handle image selection from file input
  const handleImageSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    if (!file.type.startsWith('image/')) {
      // TODO: Show error toast
      return;
    }
    
    setSelectedImage(file);
    
    // Create image preview
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setImagePreview(e.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };
  
  // Clear the selected image
  const handleClearImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
  };
  
  // Process the selected image with AI
  const handleImageAnalysis = async () => {
    if (!selectedImage) return;
    
    setIsUploadingImage(true);
    
    // Create FormData for image upload
    const formData = new FormData();
    formData.append('image', selectedImage);
    
    // Add text description if provided
    if (inputValue.trim()) {
      formData.append('query', inputValue.trim());
    }
    
    // Add subject area if selected
    formData.append('subject', imageSubject);
    
    try {
      // Add user message with image to chat
      const userMessage: Message = {
        id: Date.now().toString(),
        content: inputValue || "Voici une image que j'aimerais comprendre",
        sender: 'user',
        imageUrl: imagePreview || undefined,
      };
      
      setMessages(prev => [...prev, userMessage]);
      setInputValue('');
      
      // API call to process image
      const response = await fetch('/api/image-analysis', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Add AI response to chat
      const aiMessage: Message = {
        id: Date.now().toString(),
        content: data.result || "Voici ce que je comprends de cette image...",
        sender: 'kora',
        isImageAnalysis: true,
        allowActions: true
      };
      
      setMessages(prev => [...prev, aiMessage]);
      
      // Clear image after processing
      setSelectedImage(null);
      setImagePreview(null);
    } catch (error) {
      console.error('Error analyzing image:', error);
      
      // Add error message to chat
      const errorMessage: Message = {
        id: Date.now().toString(),
        content: "Je n'ai pas pu analyser cette image. Vérifie ta connexion internet et réessaie.",
        sender: 'kora',
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsUploadingImage(false);
    }
  };
  
  // Custom markdown renderer with KaTeX support
  const CustomMarkdownRenderer = ({ content }: { content: string }) => {
    // Process the content to handle math expressions
    let processedContent = content;
    
    // Define custom renderers for ReactMarkdown
    const components = {
      p: ({ node, children }: any) => {
        return <p className="mb-2">{renderChildrenWithMath(children)}</p>;
      },
      code: ({ node, inline, className, children, ...props }: any) => {
        if (inline) {
          return <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-sm" {...props}>{children}</code>;
        }
        
        return (
          <pre className="bg-gray-100 dark:bg-gray-800 p-3 rounded-md overflow-x-auto my-3">
            <code className="text-sm" {...props}>{children}</code>
          </pre>
        );
      },
    };
    
    function renderChildrenWithMath(children: React.ReactNode): React.ReactNode {
      if (typeof children === 'string') {
        return renderMathInText(children);
      }
      
      if (Array.isArray(children)) {
        return children.map((child, index) => {
          if (typeof child === 'string') {
            return <React.Fragment key={index}>{renderMathInText(child)}</React.Fragment>;
          }
          return child;
        });
      }
      
      return children;
    }
    
    function renderMathInText(text: string): React.ReactNode {
      // Match inline math delimited by $ (not preceded or followed by $)
      const parts = text.split(/(?<!\$)\$(?!\$)(.+?)(?<!\$)\$(?!\$)/g);
      
      if (parts.length === 1) {
        return text; // No math expressions found
      }
      
      return <>
        {parts.map((part, index) => {
          // Even indices are regular text, odd indices are math expressions
          if (index % 2 === 0) {
            return part;
          } else {
            try {
              return <InlineMath key={index} math={part} />;
            } catch (error) {
              console.error('Error rendering KaTeX:', error);
              return `$${part}$`;
            }
          }
        })}
      </>;
    }
    
    return (
      <div className="message-content math-content">
        <ReactMarkdown components={components}>{processedContent}</ReactMarkdown>
      </div>
    );
  };

  // Render each message in the chat (ChatGPT style)
  const renderMessage = (message: Message) => {
    if (message.sender === 'user') {
      return (
        <div key={message.id} className="mb-8 last:mb-4">
          {/* Full width with a light gray background for user messages */}
          <div className="py-4 px-4 sm:px-8 md:px-12 bg-gray-100 dark:bg-gray-800 w-full">
            <div className="max-w-3xl mx-auto">
              <p className="text-gray-800 dark:text-gray-200">{message.content}</p>
            </div>
          </div>
        </div>
      );
    }
    
    return (
      <div key={message.id} className="mb-8 last:mb-4">
        {/* Full width with white background for assistant messages */}
        <div className="py-4 px-4 sm:px-8 md:px-12 bg-white dark:bg-gray-900 w-full">
          <div className="max-w-3xl mx-auto">
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
              
              {/* Challenge answer input area */}
              {message.isChallenge && !message.challengeData?.isAnswered && (
                <div className="my-4 p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div className="font-medium mb-2">Entre ta réponse :</div>
                  <div className="flex items-center space-x-2">
                    <Input
                      value={challengeAnswers[message.id] || ''}
                      onChange={(e) => handleChallengeAnswerChange(message.id, e.target.value)}
                      placeholder="Ta réponse..."
                      className="flex-1"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleSubmitChallengeAnswer(message.id);
                        }
                      }}
                    />
                    <Button 
                      size="sm"
                      onClick={() => handleSubmitChallengeAnswer(message.id)}
                      disabled={!challengeAnswers[message.id]?.trim()}
                    >
                      Vérifier
                    </Button>
                  </div>
                </div>
              )}
              
              {/* Challenge result feedback */}
              {message.isChallenge && message.challengeData?.isAnswered && (
                <div className={`my-4 p-4 rounded-lg ${
                  message.challengeData.isCorrect 
                    ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' 
                    : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                }`}>
                  <div className="flex flex-col">
                    <div className="flex items-center mb-3">
                      {message.challengeData.isCorrect ? (
                        <>
                          <div className="h-6 w-6 rounded-full bg-green-500 flex items-center justify-center mr-2">
                            <span className="text-white text-xs">✓</span>
                          </div>
                          <span className="font-medium text-green-800 dark:text-green-200">
                            Correct! Ta réponse {message.challengeData.userAnswer} est exacte.
                          </span>
                        </>
                      ) : (
                        <>
                          <div className="h-6 w-6 rounded-full bg-red-500 flex items-center justify-center mr-2">
                            <span className="text-white text-xs">✗</span>
                          </div>
                          <span className="font-medium text-red-800 dark:text-red-200">
                            Incorrect. La bonne réponse était {message.challengeData.expectedAnswer}.
                          </span>
                        </>
                      )}
                    </div>
                    
                    {!message.challengeData.isCorrect && message.challengeData.solution && (
                      <div className="mt-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            if (!message.challengeData?.solution) return;
                            
                            // Add solution message
                            const solutionMessage: Message = {
                              id: Date.now().toString(),
                              content: message.challengeData.solution,
                              sender: 'kora',
                            };
                            
                            setMessages(prev => [...prev, solutionMessage]);
                          }}
                          className="text-xs"
                        >
                          Voir la solution
                        </Button>
                      </div>
                    )}
                    
                    <div className="mt-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          // Generate a new arithmetic problem
                          const a = Math.floor(Math.random() * 10) + 1;
                          const b = Math.floor(Math.random() * 10) + 1;
                          const op = Math.random() < 0.33 ? '+' : (Math.random() < 0.5 ? '-' : '*');
                          let result, equation, answer;
                          
                          switch (op) {
                            case '+':
                              result = a + b;
                              equation = `${a} + ${b}`;
                              answer = result.toString();
                              break;
                            case '-':
                              result = a - b;
                              equation = `${a} - ${b}`;
                              answer = result.toString();
                              break;
                            case '*':
                              result = a * b;
                              equation = `${a} × ${b}`;
                              answer = result.toString();
                              break;
                            default:
                              result = a + b;
                              equation = `${a} + ${b}`;
                              answer = result.toString();
                          }
                          
                          // Create a new challenge message
                          const challengeMessage: Message = {
                            id: Date.now().toString(),
                            content: `### Nouveau défi:\n\nCalcule: $${equation} = ?$\n\nEntre ta réponse ci-dessous.`,
                            sender: 'kora',
                            isChallenge: true,
                            challengeData: {
                              expectedAnswer: answer,
                              isAnswered: false,
                              challengeType: 'arithmetic'
                            }
                          };
                          
                          setMessages(prev => [...prev, challengeMessage]);
                          
                          // Scroll to the new message
                          setTimeout(() => {
                            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
                          }, 100);
                        }}
                        className="text-xs"
                      >
                        Nouveau défi
                      </Button>
                    </div>
                  </div>
                </div>
              )}
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
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full w-full">
      {/* Chat interface - immersive avec plein écran */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Chat messages area - occuper tout l'écran */}
        <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900">
          {messages.map(renderMessage)}
          
          {/* Thinking indicator */}
          {isThinking && (
            <div className="max-w-3xl mx-auto px-4 py-2">
              <div className="flex items-center space-x-2 text-gray-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Kora réfléchit...</span>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
        
        {/* Input area - fixé en bas avec une ombre pour le détacher visuellement */}
        <div className="border-t p-3 sm:p-4 bg-white dark:bg-gray-950 shadow-md">
          
          {/* Image preview area (shown when an image is selected) */}
          {imagePreview && (
            <div className="mb-3 relative">
              <div className="rounded-lg overflow-hidden relative max-h-[200px]">
                <img
                  src={imagePreview}
                  alt="Aperçu de l'image"
                  className="max-w-full object-contain mx-auto"
                  style={{ maxHeight: '200px' }}
                />
                <button 
                  onClick={handleClearImage}
                  className="absolute top-2 right-2 bg-gray-800 bg-opacity-70 text-white rounded-full p-1 hover:bg-opacity-90"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              {inputValue ? (
                <div className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                  {inputValue}
                </div>
              ) : (
                <div className="mt-2 text-sm text-gray-400 dark:text-gray-500 italic">
                  Ajoute un message pour préciser ta question (optionnel)
                </div>
              )}
              <Button
                className="mt-2 w-full"
                onClick={handleImageAnalysis}
                disabled={isUploadingImage}
              >
                {isUploadingImage ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Analyse en cours...
                  </>
                ) : (
                  <>
                    <FileText className="h-4 w-4 mr-2" />
                    Analyser cette image
                  </>
                )}
              </Button>
            </div>
          )}
          
          <div className="space-y-3">
            {/* Champ de saisie principal - maintenant au-dessus */}
            <div className="relative">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={selectedImage ? "Décris ce que tu cherches à comprendre..." : "Pose ta question à Kora..."}
                className="w-full pr-[60px]" // Espace pour le bouton d'envoi
                disabled={isThinking || isUploadingImage}
              />
              
              {/* Bouton d'envoi positionné absolument à droite du champ */}
              <div className="absolute right-1 top-1/2 transform -translate-y-1/2">
                <Button 
                  size="icon"
                  variant="ghost"
                  disabled={(selectedImage ? false : !inputValue.trim()) || isThinking || isUploadingImage} 
                  onClick={selectedImage ? handleImageAnalysis : handleSendMessage}
                  className="h-8 w-8"
                >
                  <Send className="h-5 w-5" />
                </Button>
              </div>
            </div>
            
            {/* Barre d'outils sous le champ de saisie - style ChatGPT */}
            <div className="flex items-center justify-center space-x-2 pt-1">
              {/* Hidden file input pour la galerie d'images */}
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleImageSelect}
                onClick={(e) => {
                  // Reset the value to allow selecting the same file again
                  (e.target as HTMLInputElement).value = '';
                }}
              />
              
              {/* Boutons d'action centrés */}
              <div className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-800 rounded-full px-2 py-1">
                {/* Bouton galerie */}
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={isThinking || isUploadingImage}
                  onClick={handleOpenFileBrowser}
                  title="Choisir une image depuis la galerie"
                  className="rounded-full"
                >
                  <ImageIcon className="h-4 w-4 mr-1" />
                  <span className="text-xs">Galerie</span>
                </Button>
                
                {/* Bouton appareil photo (mobile uniquement) */}
                {isMobileDevice && (
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={isThinking || isUploadingImage}
                    onClick={() => {
                      // Créer un input temporaire avec capture
                      const tempInput = document.createElement('input');
                      tempInput.type = 'file';
                      tempInput.accept = 'image/*';
                      tempInput.capture = 'environment';
                      
                      // Ajouter le gestionnaire d'événements
                      tempInput.onchange = (e) => {
                        handleImageSelect(e as unknown as ChangeEvent<HTMLInputElement>);
                      };
                      
                      // Simuler un clic 
                      tempInput.click();
                    }}
                    title="Prendre une photo"
                    className="rounded-full"
                  >
                    <Camera className="h-4 w-4 mr-1" />
                    <span className="text-xs">Photo</span>
                  </Button>
                )}
                
                {/* Bouton vocal */}
                <div className="flex items-center">
                  <VoiceRecorder 
                    onTranscriptionComplete={(text) => {
                      // When transcription is complete, set the input value
                      setInputValue(text);
                      
                      // Optionally, send the message immediately
                      if (text.trim().length > 0) {
                        setTimeout(() => {
                          // Add user message to chat
                          const userMessage: Message = {
                            id: Date.now().toString(),
                            content: text,
                            sender: 'user',
                          };
                          
                          setMessages(prev => [...prev, userMessage]);
                          
                          // Send to WebSocket server if connected
                          if (sendMessage('chat', { content: text })) {
                            // Message sent successfully
                          } else {
                            // WebSocket not connected, use fallback
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
                        }, 500);
                      }
                    }}
                    disabled={isThinking || isUploadingImage}
                    maxRecordingTimeMs={30000} // 30 secondes maximum
                    language="fr" // langue française par défaut
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatAssistant;
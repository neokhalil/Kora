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
import { useIsMobile } from '@/hooks/use-mobile';
import { setupMobileViewportFix } from '@/lib/mobileViewportFix';

// Define the message types
interface ChallengeData {
  questionId?: string;
  expectedAnswer?: string;
  userAnswer?: string;
  isAnswered?: boolean;
  isCorrect?: boolean;
  challengeType?: string;
  solution?: string;
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

const ChatAssistant: React.FC = () => {
  // État principal
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [challengeAnswers, setChallengeAnswers] = useState<Record<string, string>>({});
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageSubject, setImageSubject] = useState<string>('general');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isMobileDevice, setIsMobileDevice] = useState(false);
  
  // Vérifier si c'est un appareil mobile
  const isMobile = useIsMobile();
  
  // Références
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const composerRef = useRef<HTMLDivElement>(null);
  
  // Initialisation du fix pour mobile
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setupMobileViewportFix();
    }
  }, []);

  // Détecter l'appareil mobile
  useEffect(() => {
    setIsMobileDevice(isMobile);
  }, [isMobile]);
  
  // Faire défiler jusqu'au bas des messages lors de l'ajout de nouveaux messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isThinking]);
  
  // Surveiller les événements de focus et de clavier pour améliorer l'UX mobile
  useEffect(() => {
    // Gestion des événements de focus
    const handleFocusIn = () => {
      // Assurer que le clavier s'ouvre correctement
      document.body.classList.add('keyboard-open');
    };
    
    const handleFocusOut = () => {
      // Retirer la classe quand un champ perd le focus
      document.body.classList.remove('keyboard-open');
    };
    
    // Gestion des événements du Visual Viewport API (pour iOS)
    const handleVisualViewportChange = () => {
      const vv = window.visualViewport;
      if (vv && vv.height < window.innerHeight) {
        document.body.classList.add('keyboard-open');
        document.body.classList.add('visual-viewport-active');
      } else {
        document.body.classList.remove('keyboard-open');
        document.body.classList.remove('visual-viewport-active');
      }
    };
    
    // Enregistrement des écouteurs d'événements
    document.addEventListener('focusin', handleFocusIn);
    document.addEventListener('focusout', handleFocusOut);
    
    // Si VisualViewport API est disponible (principalement iOS)
    if (window.visualViewport) {
      document.body.classList.add('visual-viewport-supported');
      window.visualViewport.addEventListener('resize', handleVisualViewportChange);
    }
    
    // Fonction de nettoyage
    return () => {
      document.removeEventListener('focusin', handleFocusIn);
      document.removeEventListener('focusout', handleFocusOut);
      
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleVisualViewportChange);
      }
    };
  }, []);
  
  // Mock sessionId pour le développement
  const [sessionId] = useState("session_dev_123456789");
  
  // Fonctions simplifiées pour le prototype
  const handleSendMessage = () => {
    if (inputValue.trim() === '') return;
    
    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      sender: 'user',
    };
    
    setMessages(prev => [...prev, userMessage]);
    
    // Simuler une réponse après un délai
    setIsThinking(true);
    setTimeout(() => {
      setIsThinking(false);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        content: "Je suis KORA, ton assistant d'études. Comment puis-je t'aider aujourd'hui avec tes mathématiques ou sciences?",
        sender: 'kora',
      }]);
    }, 1500);
    
    setInputValue('');
  };
  
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  const handleOpenFileBrowser = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  const handleImageSelect = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedImage(file);
      
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setImagePreview(event.target.result.toString());
        }
      };
      reader.readAsDataURL(file);
    }
  };
  
  // Fonction simplifiée pour afficher les messages
  const renderMessage = (message: Message) => {
    const isKora = message.sender === 'kora';
    
    return (
      <div key={message.id} className={`chat-message py-6 px-4 ${isKora ? 'bg-gray-50 dark:bg-gray-800' : 'bg-white dark:bg-gray-900'}`}>
        <div className="max-w-3xl mx-auto flex gap-4">
          <div className="flex-shrink-0 flex items-center justify-center">
            {isKora ? (
              <div className="h-9 w-9 rounded-full bg-black text-white flex items-center justify-center font-semibold">
                K
              </div>
            ) : (
              <div className="h-9 w-9 rounded-full bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-gray-200 flex items-center justify-center font-semibold">
                U
              </div>
            )}
          </div>
          
          <div className="flex-1">
            <div className="prose dark:prose-invert text-sm max-w-none">
              {message.content}
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto">
      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Zone des messages */}
        <div 
          className="flex-1 overflow-y-auto p-4 messages-container" 
        >
          {messages.length === 0 ? (
            <div className="h-full flex flex-col justify-start pt-12">
              <div className="max-w-md px-4">
                <h2 className="text-4xl font-bold mb-1">Hello,</h2>
                <h2 className="text-4xl font-bold mb-6">Ibrahima</h2>
                <p className="text-gray-600 text-3xl leading-tight">
                  Comment<br />
                  puis-je t'aider<br />
                  aujourd'hui ?
                </p>
              </div>
            </div>
          ) : (
            <>
              {messages.map(renderMessage)}
              
              {/* Indicateur de réflexion */}
              {isThinking && (
                <div className="chat-message py-6 px-4 bg-gray-50 dark:bg-gray-800">
                  <div className="max-w-3xl mx-auto flex gap-4">
                    <div className="flex-shrink-0 flex items-center justify-center">
                      <div className="h-9 w-9 rounded-full bg-black text-white flex items-center justify-center font-semibold">
                        K
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <div className="flex space-x-1">
                          <span className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
                          <span className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
                          <span className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </>
          )}
        </div>
        
        {/* Zone de saisie fixe en bas */}
        <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 px-4 py-2 z-50 composer-container">
          <div className="max-w-4xl mx-auto">
            {/* Zone d'aperçu d'image */}
            {imagePreview && (
              <div className="mb-2 relative bg-gray-100 dark:bg-gray-800 rounded-lg p-2">
                <div className="flex items-start">
                  <div className="flex-1 flex space-x-2 items-center">
                    <div className="w-16 h-16 relative overflow-hidden rounded-md border border-gray-300 dark:border-gray-700">
                      <img 
                        src={imagePreview} 
                        alt="Preview" 
                        className="w-full h-full object-cover" 
                      />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium">Image sélectionnée</div>
                      <div className="text-xs text-gray-500">{selectedImage?.name}</div>
                    </div>
                  </div>
                  
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-7 w-7 rounded-full p-0"
                    onClick={() => {
                      setImagePreview(null);
                      setSelectedImage(null);
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
            
            {/* Composeur de message style iOS */}
            <div 
              className="bg-white dark:bg-gray-800 p-2 rounded-full border border-gray-200 shadow-sm"
              ref={composerRef}
              onFocus={() => {
                // Déclenche la classe keyboard-open pour adapter l'UI
                document.body.classList.add('keyboard-open');
                
                // Scroll vers la fin des messages après un court délai
                setTimeout(() => {
                  if (messagesEndRef.current) {
                    messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
                  }
                }, 300);
              }}
            >
              {/* Hidden file input pour les images */}
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleImageSelect}
                onClick={(e) => {
                  (e.target as HTMLInputElement).value = '';
                }}
              />
              
              <div className="flex items-center justify-between gap-2">
                {/* Boutons d'action à gauche */}
                <div className="flex gap-2">
                  {/* Bouton galerie */}
                  <button
                    type="button"
                    disabled={isThinking || isUploadingImage}
                    onClick={handleOpenFileBrowser}
                    title="Choisir une image"
                    className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 disabled:opacity-50"
                  >
                    <ImageIcon className="h-5 w-5 text-gray-500 dark:text-gray-300" />
                  </button>
                  
                  {/* Bouton appareil photo (mobile uniquement) */}
                  {isMobileDevice && (
                    <button
                      type="button"
                      disabled={isThinking || isUploadingImage}
                      onClick={() => {
                        const tempInput = document.createElement('input');
                        tempInput.type = 'file';
                        tempInput.accept = 'image/*';
                        tempInput.capture = 'environment';
                        
                        tempInput.onchange = (e) => {
                          handleImageSelect(e as unknown as ChangeEvent<HTMLInputElement>);
                        };
                        
                        tempInput.click();
                      }}
                      title="Prendre une photo"
                      className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 disabled:opacity-50"
                    >
                      <Camera className="h-5 w-5 text-gray-500 dark:text-gray-300" />
                    </button>
                  )}
                </div>
                
                {/* Champ de saisie au centre */}
                <div className="flex items-center flex-1 px-2">
                  <Input
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Pose ta question"
                    className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-gray-600 dark:text-gray-300 placeholder:text-gray-400 dark:placeholder:text-gray-500 h-10"
                    disabled={isThinking || isUploadingImage}
                    onFocus={() => {
                      // Marquer que le clavier est ouvert
                      document.body.classList.add('keyboard-open');
                      
                      // S'assurer que le header fixe est visible
                      const headerContainer = document.getElementById('kora-header-container');
                      if (headerContainer) {
                        headerContainer.style.position = 'absolute';
                        headerContainer.style.top = '0';
                        headerContainer.style.zIndex = '9999';
                      }
                      
                      // Scroll vers le bas après l'ouverture du clavier
                      setTimeout(() => {
                        if (messagesEndRef.current) {
                          messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
                        }
                      }, 100);
                    }}
                  />
                </div>
                
                {/* Conteneur à droite pour les boutons micro et envoi */}
                <div className="flex items-center gap-2">
                  {/* Bouton d'envoi - visible seulement si du texte est présent */}
                  {inputValue.trim() ? (
                    <button
                      type="button"
                      onClick={handleSendMessage}
                      disabled={isThinking || isUploadingImage}
                      className="w-10 h-10 flex items-center justify-center rounded-full bg-black text-white hover:bg-gray-800 disabled:opacity-50"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        className="h-5 w-5"
                      >
                        <path
                          d="M3.105 2.289a.75.75 0 00-.826.95l1.414 4.925A1.5 1.5 0 005.135 9.25h6.115a.75.75 0 010 1.5H5.135a1.5 1.5 0 00-1.442 1.086l-1.414 4.926a.75.75 0 00.826.95 28.896 28.896 0 0015.293-7.154.75.75 0 000-1.115A28.897 28.897 0 003.105 2.289z"
                        />
                      </svg>
                    </button>
                  ) : (
                    /* Bouton microphone */
                    <div className="w-10 h-10 flex items-center justify-center">
                      <VoiceRecorder 
                        onTranscriptionComplete={(text) => {
                          setInputValue(text);
                          
                          if (text.trim().length > 0) {
                            const userMessage: Message = {
                              id: Date.now().toString(),
                              content: text,
                              sender: 'user',
                            };
                            
                            setMessages(prev => [...prev, userMessage]);
                            setIsThinking(true);
                            
                            setTimeout(() => {
                              setIsThinking(false);
                              setMessages(prev => [...prev, {
                                id: Date.now().toString(),
                                content: "Je suis KORA, ton assistant d'études. Comment puis-je t'aider aujourd'hui avec tes mathématiques ou sciences?",
                                sender: 'kora',
                              }]);
                            }, 1500);
                          }
                        }}
                        disabled={isThinking || isUploadingImage}
                        maxRecordingTimeMs={30000}
                        language="fr"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="mt-2 text-xs text-gray-500 text-center">
              KORA, ton assistant IA pour réviser et faire tes exercices.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatAssistant;
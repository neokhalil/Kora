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
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  
  // Vérifier si c'est un appareil mobile
  const isMobile = useIsMobile();
  
  // Références
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const composerRef = useRef<HTMLDivElement>(null);
  
  // Détecter l'appareil mobile
  useEffect(() => {
    setIsMobileDevice(isMobile);
    
    // Initialiser la détection du clavier mobile
    if (typeof window !== 'undefined' && 'visualViewport' in window) {
      const viewportHandler = () => {
        // Si la hauteur du viewport est significativement réduite, le clavier est probablement ouvert
        const currentHeight = window.visualViewport?.height || 0;
        const windowHeight = window.innerHeight;
        
        // Si le viewport est plus petit que la fenêtre, cela signifie probablement que le clavier est ouvert
        if (currentHeight < windowHeight * 0.75) {
          // Calculer la hauteur approximative du clavier
          const keyboardH = windowHeight - currentHeight;
          setKeyboardHeight(keyboardH);
        } else {
          setKeyboardHeight(0);
        }
      };
      
      window.visualViewport?.addEventListener('resize', viewportHandler);
      return () => {
        window.visualViewport?.removeEventListener('resize', viewportHandler);
      };
    }
  }, [isMobile]);
  
  // Faire défiler jusqu'au bas des messages lors de l'ajout de nouveaux messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isThinking]);
  
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
      <div key={message.id} className="chat-message mb-4">
        <div className={`flex ${isKora ? 'justify-start' : 'justify-end'}`}>
          {isKora && (
            <div className="flex-shrink-0 mr-3">
              <Avatar className="h-8 w-8">
                <div className="flex h-full items-center justify-center bg-blue-600 text-white font-semibold">K</div>
              </Avatar>
            </div>
          )}
          
          <div className={`flex flex-col ${isKora ? 'items-start' : 'items-end'}`}>
            <div className={`flex max-w-[80%] ${isKora ? 'bg-blue-50 dark:bg-gray-700' : 'bg-blue-500 text-white'} rounded-lg py-3 px-4`}>
              <div className="prose dark:prose-invert text-sm max-w-none">
                {message.content}
              </div>
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
          className="flex-1 overflow-y-auto p-4" 
          style={{ paddingBottom: `calc(170px + ${keyboardHeight}px)` }}
        >
          {messages.length === 0 ? (
            <div className="h-full flex flex-col justify-start pt-12">
              <div className="max-w-md px-4">
                <h2 className="text-3xl font-bold mb-1">Hello,</h2>
                <h2 className="text-3xl font-bold mb-3">Ibrahima</h2>
                <p className="text-gray-500 text-xl">
                  Comment puis-je t'aider aujourd'hui ?
                </p>
              </div>
            </div>
          ) : (
            <>
              {messages.map(renderMessage)}
              
              {/* Indicateur de réflexion */}
              {isThinking && (
                <div className="flex mb-4">
                  <div className="bg-blue-50 dark:bg-gray-700 rounded-lg py-3 px-4">
                    <div className="flex items-center space-x-2">
                      <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
                      <span className="text-gray-500 text-sm">Réflexion en cours...</span>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </>
          )}
        </div>
        
        {/* Zone de saisie fixe en bas */}
        <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 px-4 py-2 z-10">
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
            <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-3xl">
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
                {/* Champ de saisie au centre */}
                <div className="flex items-center flex-1">
                  <Input
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Pose ta question"
                    className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-gray-600 dark:text-gray-300 placeholder:text-gray-400 dark:placeholder:text-gray-500 h-10"
                    disabled={isThinking || isUploadingImage}
                  />
                </div>
                
                {/* Boutons d'action à gauche */}
                <div className="flex gap-2">
                  {/* Bouton galerie */}
                  <button
                    type="button"
                    disabled={isThinking || isUploadingImage}
                    onClick={handleOpenFileBrowser}
                    title="Choisir une image"
                    className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700 disabled:opacity-50"
                  >
                    <ImageIcon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
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
                      className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700 disabled:opacity-50"
                    >
                      <Camera className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                    </button>
                  )}
                </div>
                
                {/* Bouton microphone */}
                <div className="flex items-center ml-2">
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
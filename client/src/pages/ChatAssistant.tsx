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
import MathJaxRenderer from '@/components/ui/MathJaxRenderer';
import { MathJaxContext } from 'better-react-mathjax';
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
  isHint?: boolean;
  allowActions?: boolean;
  messageId?: string;
  challengeData?: ChallengeData;
  imageUrl?: string | null;
  challengeId?: string; // Pour associer un indice à un défi spécifique
}

// Configuration MathJax pour les formules mathématiques
const mathJaxConfig = {
  tex: {
    inlineMath: [['$', '$'], ['\\(', '\\)']],
    displayMath: [['$$', '$$'], ['\\[', '\\]']],
    processEscapes: true,
    tags: 'ams',
  },
  svg: {
    fontCache: 'global'
  },
  startup: {
    typeset: false
  }
};

export default function ChatAssistant() {
  // État des messages
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  // États pour les images
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Références pour les éléments DOM
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputContainerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const isMobile = useIsMobile();

  // État pour le texte progressif
  const [progressiveText, setProgressiveText] = useState<{
    id: string;
    fullText: string;
    currentText: string;
    intervalId?: NodeJS.Timeout;
  }>({
    id: '',
    fullText: '',
    currentText: '',
  });

  useEffect(() => {
    // Ajouter la classe iOS-device si nécessaire
    if (isMobile) {
      document.body.classList.add('ios-device');
      setupMobileViewportFix();
    }

    // Message de bienvenue
    setTimeout(() => {
      const welcomeMessage: Message = {
        id: 'welcome',
        content: "Bonjour ! Je suis Kora, votre assistant pour les devoirs. Posez-moi une question sur n'importe quel sujet, ou envoyez-moi une image pour que je puisse vous aider.",
        sender: 'kora',
      };
      setMessages([welcomeMessage]);
      
      // Assurer le défilement
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    }, 500);

    // Nettoyage à la fermeture
    return () => {
      if (progressiveText.intervalId) {
        clearInterval(progressiveText.intervalId);
      }
    };
  }, [isMobile]);
  
  // Effet pour gérer le défilement automatique lorsque les messages changent
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  
  // Mock sessionId pour le développement
  const [sessionId] = useState("session_dev_123456789");
  
  // Fonction pour simuler l'écriture progressive du texte
  const simulateProgressiveTyping = (messageId: string, fullText: string) => {
    // Nettoyer tout intervalle précédent si existant
    if (progressiveText.intervalId) {
      clearInterval(progressiveText.intervalId);
    }
    
    // Prétraiter le texte pour trouver les formules mathématiques et les sections markdown
    interface ContentRange {
      start: number;
      end: number;
      type: 'math' | 'markdown' | 'heading';
    }
    
    const specialRanges: ContentRange[] = [];
    
    // Détecter les formules mathématiques
    const regexInline = /\$([^$\n]+?)\$/g;
    const regexBlock = /\$\$([\s\S]+?)\$\$/g;
    const regexLatexInline = /\\\\?\(([^)]+?)\\\\?\)/g;
    const regexLatexBlock = /\\\\?\[([\s\S]+?)\\\\?\]/g;
    
    // Détecter le markdown et les titres
    const regexBold = /\*\*(.*?)\*\*/g;
    const regexHeading3 = /^###\s*(.*?)$/gm;
    const regexHeading4 = /^####\s*(.*?)$/gm;
    const regexHeadingSpecial = /^(Résolution Générale|Méthode|Solution|Approche|Démarche)\s*:?/gm;
    
    let match: RegExpExecArray | null;
    
    // Trouver toutes les formules mathématiques
    while ((match = regexInline.exec(fullText)) !== null) {
      specialRanges.push({ start: match.index, end: match.index + match[0].length, type: 'math' });
    }
    while ((match = regexBlock.exec(fullText)) !== null) {
      specialRanges.push({ start: match.index, end: match.index + match[0].length, type: 'math' });
    }
    while ((match = regexLatexInline.exec(fullText)) !== null) {
      specialRanges.push({ start: match.index, end: match.index + match[0].length, type: 'math' });
    }
    while ((match = regexLatexBlock.exec(fullText)) !== null) {
      specialRanges.push({ start: match.index, end: match.index + match[0].length, type: 'math' });
    }
    
    // Trouver tout le texte en gras
    while ((match = regexBold.exec(fullText)) !== null) {
      specialRanges.push({ start: match.index, end: match.index + match[0].length, type: 'markdown' });
    }
    
    // Trouver tous les titres avec ###, #### et titres spéciaux
    while ((match = regexHeading3.exec(fullText)) !== null) {
      specialRanges.push({ start: match.index, end: match.index + match[0].length, type: 'heading' });
    }
    while ((match = regexHeading4.exec(fullText)) !== null) {
      specialRanges.push({ start: match.index, end: match.index + match[0].length, type: 'heading' });
    }
    while ((match = regexHeadingSpecial.exec(fullText)) !== null) {
      specialRanges.push({ start: match.index, end: match.index + match[0].length, type: 'heading' });
    }
    
    // Trier les plages spéciales par position de début
    specialRanges.sort((a, b) => a.start - b.start);
    
    let currentCharIndex = 0;
    let fragmentSize = 5; // Nombre de caractères à ajouter à chaque fois
    const typingSpeed = 30; // Temps en ms entre les mises à jour
    
    // Déterminer la taille du texte complet pour adapter la vitesse
    const totalLength = fullText.length;
    
    // Ajuster le nombre de caractères à ajouter proportionnellement au contenu total
    if (totalLength > 500) {
      fragmentSize = 8; // Texte long = ajout plus rapide
    } else if (totalLength > 1000) {
      fragmentSize = 12; // Texte très long = ajout encore plus rapide
    }
    
    // Initialiser avec les premiers caractères pour une transition douce
    const initialText = fullText.length > 10 ? fullText.substring(0, 10) : fullText;
    currentCharIndex = initialText.length;
    
    setProgressiveText({
      id: messageId,
      fullText: fullText,
      currentText: initialText
    });
    
    // Mettre à jour le message initial
    setMessages(prevMessages => 
      prevMessages.map(msg => 
        msg.id === messageId 
          ? { ...msg, content: initialText } 
          : msg
      )
    );
    
    // Créer un intervalle pour ajouter progressivement des caractères
    const intervalId = setInterval(() => {
      if (currentCharIndex < fullText.length) {
        // Déterminer si nous sommes dans une section spéciale (math, markdown, etc.)
        const specialRange = specialRanges.find(r => 
          currentCharIndex >= r.start && currentCharIndex < r.end
        );
        
        if (specialRange) {
          // Pour les formules mathématiques et sections spéciales, les ajouter d'un coup
          currentCharIndex = specialRange.end;
        } else {
          // Sinon, ajouter un fragment de texte normal avec légère randomisation
          currentCharIndex = Math.min(
            currentCharIndex + fragmentSize + Math.floor(Math.random() * 2), 
            fullText.length
          );
        }
        
        const newCurrentText = fullText.substring(0, currentCharIndex);
        
        // Mettre à jour l'état interne
        setProgressiveText(prev => ({
          ...prev,
          currentText: newCurrentText
        }));
        
        // Mettre à jour le message dans la liste
        setMessages(prevMessages => 
          prevMessages.map(msg => 
            msg.id === messageId 
              ? { ...msg, content: newCurrentText } 
              : msg
          )
        );
      } else {
        // Arrêter l'intervalle une fois le texte complet
        clearInterval(intervalId);
        setProgressiveText(prev => ({
          ...prev,
          intervalId: undefined
        }));
      }
    }, typingSpeed);
    
    // Stocker l'ID d'intervalle pour pouvoir le nettoyer plus tard
    setProgressiveText(prev => ({
      ...prev,
      intervalId: intervalId as unknown as NodeJS.Timeout
    }));
  };
  
  // Fonctions simplifiées pour le prototype
  const handleSendMessage = async () => {
    if (inputValue.trim() === '' || isThinking) return;
    
    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      sender: 'user',
    };
    
    // Garder une copie du message pour la requête API
    const questionText = inputValue;
    
    // Ajouter le message à la liste
    setMessages(prev => [...prev, userMessage]);
    
    // Vider le champ d'entrée
    setInputValue('');
    
    // Marquer comme "en train de réfléchir"
    setIsThinking(true);
    
    try {
      // Préparer les messages précédents pour le contexte de la conversation
      const messageHistory = messages.map(msg => ({
        content: msg.content,
        sender: msg.sender
      }));
      
      // Appel API à OpenAI via notre serveur
      const response = await fetch('/api/tutoring/ask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: questionText,
          messages: messageHistory
        }),
      });
      
      if (!response.ok) {
        throw new Error('Erreur lors de la requête API');
      }
      
      const data = await response.json();
      
      // Générer un ID unique pour ce message
      const messageId = Date.now().toString();
      
      // Ajouter la réponse avec du contenu initial vide
      setMessages(prev => [...prev, {
        id: messageId,
        content: '',
        sender: 'kora',
        allowActions: true,
      }]);
      
      // Attendre un moment pour permettre la stabilisation des éléments DOM
      setTimeout(() => {
        // Afficher le texte progressivement après une courte pause
        simulateProgressiveTyping(messageId, data.content);
      }, 100);
    } catch (error) {
      console.error('Erreur lors de la communication avec le serveur:', error);
      
      // Message d'erreur à l'utilisateur
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        content: "Désolé, j'ai rencontré un problème en essayant de répondre. Pourriez-vous reformuler votre question?",
        sender: 'kora',
      }]);
    } finally {
      // Dans tous les cas, arrêter l'indicateur de réflexion
      setIsThinking(false);
      
      // Faire défiler vers le bas après l'ajout du message
      setTimeout(() => {
        if (messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    }
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
  
  const handleSubmitImage = async () => {
    if (!selectedImage || isUploadingImage) return;
    
    setIsUploadingImage(true);
    
    try {
      // Créer le message utilisateur avec prévisualisation de l'image
      const userMessage: Message = {
        id: Date.now().toString(),
        content: inputValue || "Analyse cette image s'il te plaît",
        sender: 'user',
        imageUrl: imagePreview || undefined,
      };
      
      // Ajouter le message à la liste
      setMessages(prev => [...prev, userMessage]);
      
      // Vider les champs
      setInputValue('');
      
      // Afficher l'indicateur de réflexion
      setIsThinking(true);
      
      // Créer un FormData pour envoyer l'image
      const formData = new FormData();
      formData.append('image', selectedImage);
      
      // Ajouter le texte de question s'il existe
      if (inputValue.trim()) {
        formData.append('query', inputValue);
      }
      
      // Ajouter le sessionId
      formData.append('sessionId', sessionId);
      
      // Envoyer l'image au serveur pour analyse
      const response = await fetch('/api/image-analysis', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Erreur lors de l\'analyse de l\'image');
      }
      
      const data = await response.json();
      
      // Ajouter la réponse de l'IA aux messages
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        content: data.content,
        sender: 'kora',
        isImageAnalysis: true,
        allowActions: true,
      }]);
    } catch (error) {
      console.error('Erreur lors de l\'analyse de l\'image:', error);
      
      // Message d'erreur à l'utilisateur
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        content: "Désolé, j'ai rencontré un problème en essayant d'analyser cette image. Pourriez-vous réessayer avec une autre image ou une question différente?",
        sender: 'kora',
      }]);
    } finally {
      // Nettoyage
      setIsThinking(false);
      setIsUploadingImage(false);
      setSelectedImage(null);
      setImagePreview(null);
      
      // Faire défiler vers le bas
      setTimeout(() => {
        if (messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    }
  };
  
  // Fonction pour demander une nouvelle explication
  const handleRequestReExplanation = async (originalQuestion: string, originalExplanation: string) => {
    if (isThinking) return;
    
    // Empêcher les clics multiples
    if (progressiveText.intervalId) {
      clearInterval(progressiveText.intervalId);
      setProgressiveText(prev => ({
        ...prev,
        intervalId: undefined
      }));
    }
    
    setIsThinking(true);
    
    try {
      // Générer les IDs à l'avance pour éviter les doublons
      const userMessageId = Date.now().toString();
      const reExplanationId = (Date.now() + 1).toString();
      
      // Ajouter la demande de l'utilisateur avec l'ID unique
      setMessages(prev => [...prev, {
        id: userMessageId,
        content: "Peux-tu me l'expliquer différemment ?",
        sender: 'user',
      }]);
      
      // Appel API pour la réexplication
      const response = await fetch('/api/tutoring/reexplain', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          originalQuestion,
          originalExplanation
        }),
      });
      
      if (!response.ok) {
        throw new Error('Erreur lors de la requête de réexplication');
      }
      
      const data = await response.json();
      
      // Ajouter la nouvelle explication avec contenu vide au début et l'ID unique
      setMessages(prev => [...prev, {
        id: reExplanationId,
        content: '',
        sender: 'kora',
        isReExplanation: true,
        allowActions: true,
      }]);
      
      // Attendre un moment pour permettre la stabilisation des éléments DOM
      setTimeout(() => {
        // Simuler l'écriture progressive avec l'ID unique après une courte pause
        simulateProgressiveTyping(reExplanationId, data.content);
      }, 100);
    } catch (error) {
      console.error('Erreur lors de la requête de réexplication:', error);
      
      // Message d'erreur
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        content: "Désolé, je ne peux pas fournir une explication alternative pour le moment.",
        sender: 'kora',
      }]);
    } finally {
      setIsThinking(false);
    }
  };
  
  // Fonction pour demander un problème de défi
  const handleRequestChallenge = async (originalQuestion: string, explanation: string) => {
    if (isThinking) return;
    
    // Empêcher les clics multiples
    if (progressiveText.intervalId) {
      clearInterval(progressiveText.intervalId);
      setProgressiveText(prev => ({
        ...prev,
        intervalId: undefined
      }));
    }
    
    setIsThinking(true);
    
    try {
      // Générer les IDs à l'avance pour éviter les doublons
      const userMessageId = Date.now().toString();
      const challengeId = (Date.now() + 1).toString();
      
      // Ajouter la demande de l'utilisateur avec l'ID unique
      setMessages(prev => [...prev, {
        id: userMessageId,
        content: "Peux-tu me donner un exercice pour pratiquer?",
        sender: 'user',
      }]);
      
      // Appel API pour le défi
      const response = await fetch('/api/tutoring/challenge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          originalQuestion,
          explanation
        }),
      });
      
      if (!response.ok) {
        throw new Error('Erreur lors de la requête de défi');
      }
      
      const data = await response.json();
      
      // Ajouter le défi avec contenu vide au début
      setMessages(prev => [...prev, {
        id: challengeId,
        content: '',
        sender: 'kora',
        isChallenge: true,
        allowActions: true,
        challengeId: challengeId,
      }]);
      
      // Appliquer un délai pour permettre la stabilisation des éléments DOM
      setTimeout(() => {
        // Simuler l'écriture progressive après une courte pause
        simulateProgressiveTyping(challengeId, data.content);
      }, 100);
    } catch (error) {
      console.error('Erreur lors de la requête de défi:', error);
      
      // Message d'erreur
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        content: "Désolé, je ne peux pas créer un défi pour le moment.",
        sender: 'kora',
      }]);
    } finally {
      setIsThinking(false);
    }
  };

  const MessageComponent = React.memo(({ message }: { message: Message }) => {
    const isKora = message.sender === 'kora';
    const [showActions, setShowActions] = useState(false);
    
    // Afficher les actions uniquement quand le message est complètement affiché
    useEffect(() => {
      if (isKora && message.content && message.content.length > 0) {
        // Attendre que le message soit complètement affiché avant de montrer les boutons
        // pour éviter les tremblements
        const timer = setTimeout(() => {
          // Vérifier si ce message est en cours d'animation
          const isAnimating = progressiveText.id === message.id && 
                              progressiveText.currentText.length < progressiveText.fullText.length;
          
          if (!isAnimating) {
            setShowActions(true);
          }
        }, 300);
        
        return () => clearTimeout(timer);
      }
    }, [isKora, message.content, message.id]);
    
    return (
      <div key={message.id} className="px-4 py-2 mb-4">
        <div className={`max-w-3xl mx-auto ${isKora ? "" : "flex justify-end"}`}>
          <div 
            className={`inline-block rounded-2xl ${
              isKora 
                ? "bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 w-full px-4 py-3" 
                : "bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-tr-none max-w-[80%] px-4 py-3 flex items-center min-h-[48px]"
            }`}
            style={{ 
              minHeight: isKora ? '120px' : '48px',
              contain: 'content'
            }}
          >
            {/* Image de l'utilisateur si présente */}
            {message.imageUrl && (
              <div className="mb-3">
                <div className="relative rounded-lg overflow-hidden">
                  <img 
                    src={message.imageUrl} 
                    alt="Uploaded content" 
                    className="w-full max-h-60 object-contain"
                  />
                </div>
              </div>
            )}
            
            {/* Contenu du message avec formatage amélioré pour les maths via MathJax */}
            <div className="prose dark:prose-invert text-base leading-relaxed px-1">
              <MathJaxRenderer content={message.content} />
            </div>
            
            {/* Actions supplémentaires (réexpliquer, défi, indice) */}
            {isKora && showActions && (
              <div className="mt-4 flex flex-wrap gap-3 justify-start" style={{ minHeight: '40px' }}>
                {/* Bouton Explique différemment - caché pour les défis mais visible pour les indices */}
                {(!message.isChallenge || message.isHint) && !message.isReExplanation && (
                  <button 
                    className="kora-action-button"
                    onClick={() => {
                      // Trouver le message d'utilisateur précédent
                      const messagesArray = [...messages];
                      const currentIndex = messagesArray.findIndex(msg => msg.id === message.id);
                      let userMessageIndex = -1;
                      
                      // Chercher le message utilisateur le plus récent avant cette réponse
                      for (let i = currentIndex - 1; i >= 0; i--) {
                        if (messagesArray[i].sender === 'user') {
                          userMessageIndex = i;
                          break;
                        }
                      }
                      
                      if (userMessageIndex !== -1) {
                        handleRequestReExplanation(
                          messagesArray[userMessageIndex].content,
                          message.content
                        );
                      }
                    }}
                  >
                    Ré-explique
                  </button>
                )}
                
                {/* Bouton Indice - uniquement visible pour les défis */}
                {message.isChallenge && (
                  <button 
                    className="kora-action-button"
                    onClick={async () => {
                      if (isThinking) return;
                      
                      setIsThinking(true);
                      
                      try {
                        // Pour la simplicité, nous utilisons la même fonction de réexplication avec un message spécial
                        const response = await fetch('/api/tutoring/reexplain', {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                          },
                          body: JSON.stringify({
                            originalQuestion: "Indice pour le défi: " + message.content,
                            originalExplanation: "Génère des indices sans donner la solution complète."
                          }),
                        });
                        
                        if (!response.ok) {
                          throw new Error('Erreur lors de la requête d\'indice');
                        }
                        
                        const data = await response.json();
                        
                        // Générer un ID unique pour ce message d'indice
                        const hintId = Date.now().toString();
                        
                        // Ajouter l'indice directement (sans message utilisateur)
                        setMessages(prev => [...prev, {
                          id: hintId,
                          content: '',
                          sender: 'kora',
                          isHint: true,
                          challengeId: message.id,
                        }]);
                        
                        // Appliquer un délai pour permettre la stabilisation des éléments DOM
                        setTimeout(() => {
                          // Simuler l'écriture progressive après une courte pause
                          simulateProgressiveTyping(hintId, data.content);
                        }, 100);
                      } catch (error) {
                        console.error('Erreur lors de la requête d\'indice:', error);
                        setMessages(prev => [...prev, {
                          id: Date.now().toString(),
                          content: "Désolé, je ne peux pas fournir d'indice pour le moment.",
                          sender: 'kora',
                        }]);
                      } finally {
                        setIsThinking(false);
                      }
                    }}
                  >
                    Indice
                  </button>
                )}
                
                {/* Bouton Faire un exercice - caché pour les défis mais visible pour les indices */}
                {(!message.isChallenge || message.isHint) && !message.isReExplanation && (
                  <button 
                    className="kora-action-button"
                    onClick={() => {
                      // Trouver le message d'utilisateur précédent
                      const messagesArray = [...messages];
                      const currentIndex = messagesArray.findIndex(msg => msg.id === message.id);
                      let userMessageIndex = -1;
                      
                      // Chercher le message utilisateur le plus récent avant cette réponse
                      for (let i = currentIndex - 1; i >= 0; i--) {
                        if (messagesArray[i].sender === 'user') {
                          userMessageIndex = i;
                          break;
                        }
                      }
                      
                      if (userMessageIndex !== -1) {
                        handleRequestChallenge(
                          messagesArray[userMessageIndex].content,
                          message.content
                        );
                      }
                    }}
                  >
                    Faire un exercice
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };
  
  // Fonction pour rendre chaque message avec ses actions
  const MessageItem = (message: Message) => {
    const isKora = message.sender === 'kora';
    
    return (
      <div key={message.id} className="px-4 py-2 mb-4">
        <div className={`max-w-3xl mx-auto ${isKora ? "" : "flex justify-end"}`}>
          <div 
            className={`inline-block rounded-2xl ${
              isKora 
                ? "bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 w-full px-4 py-3" 
                : "bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-tr-none max-w-[80%] px-4 py-3 flex items-center min-h-[48px]"
            }`}
          >
            {/* Image de l'utilisateur si présente */}
            {message.imageUrl && (
              <div className="mb-3">
                <div className="relative rounded-lg overflow-hidden">
                  <img 
                    src={message.imageUrl} 
                    alt="Uploaded content" 
                    className="w-full max-h-60 object-contain"
                  />
                </div>
              </div>
            )}
            
            {/* Contenu du message avec formatage amélioré pour les maths via MathJax */}
            <div className="prose dark:prose-invert text-base leading-relaxed px-1">
              <MathJaxRenderer content={message.content} />
            </div>
            
            {/* Actions supplémentaires (réexpliquer, défi, indice) */}
            {isKora && message.allowActions && (
              <div className="mt-4 flex flex-wrap gap-3 justify-start">
                {/* Bouton Explique différemment - caché pour les défis mais visible pour les indices */}
                {(!message.isChallenge || message.isHint) && !message.isReExplanation && (
                  <button 
                    className="kora-action-button"
                    onClick={() => {
                      // Trouver le message d'utilisateur précédent
                      const messagesArray = [...messages];
                      const currentIndex = messagesArray.findIndex(msg => msg.id === message.id);
                      let userMessageIndex = -1;
                      
                      // Chercher le message utilisateur le plus récent avant cette réponse
                      for (let i = currentIndex - 1; i >= 0; i--) {
                        if (messagesArray[i].sender === 'user') {
                          userMessageIndex = i;
                          break;
                        }
                      }
                      
                      if (userMessageIndex !== -1) {
                        handleRequestReExplanation(
                          messagesArray[userMessageIndex].content,
                          message.content
                        );
                      }
                    }}
                  >
                    Ré-explique
                  </button>
                )}
                
                {/* Bouton Indice - uniquement visible pour les défis */}
                {message.isChallenge && (
                  <button 
                    className="kora-action-button"
                    onClick={async () => {
                      if (isThinking) return;
                      
                      setIsThinking(true);
                      
                      try {
                        // Pour la simplicité, nous utilisons la même fonction de réexplication avec un message spécial
                        const response = await fetch('/api/tutoring/reexplain', {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                          },
                          body: JSON.stringify({
                            originalQuestion: "Indice pour le défi: " + message.content,
                            originalExplanation: "Génère des indices sans donner la solution complète."
                          }),
                        });
                        
                        if (!response.ok) {
                          throw new Error('Erreur lors de la requête d\'indice');
                        }
                        
                        const data = await response.json();
                        
                        // Générer un ID unique pour ce message d'indice
                        const hintId = Date.now().toString();
                        
                        // Ajouter l'indice directement (sans message utilisateur)
                        setMessages(prev => [...prev, {
                          id: hintId,
                          content: '',
                          sender: 'kora',
                          isHint: true,
                          challengeId: message.id,
                        }]);
                        
                        // Appliquer un délai pour permettre la stabilisation des éléments DOM
                        setTimeout(() => {
                          // Simuler l'écriture progressive après une courte pause
                          simulateProgressiveTyping(hintId, data.content);
                        }, 100);
                      } catch (error) {
                        console.error('Erreur lors de la requête d\'indice:', error);
                        setMessages(prev => [...prev, {
                          id: Date.now().toString(),
                          content: "Désolé, je ne peux pas fournir d'indice pour le moment.",
                          sender: 'kora',
                        }]);
                      } finally {
                        setIsThinking(false);
                      }
                    }}
                  >
                    Indice
                  </button>
                )}
                
                {/* Bouton Défi - visible seulement pour les réponses normales et les ré-explications */}
                {!message.isChallenge && !message.isHint && (
                  <button 
                    className="kora-action-button"
                    onClick={() => {
                      // Trouver le message d'utilisateur précédent
                      const messagesArray = [...messages];
                      const currentIndex = messagesArray.findIndex(msg => msg.id === message.id);
                      let userMessageIndex = -1;
                      
                      // Chercher le message utilisateur le plus récent avant cette réponse
                      for (let i = currentIndex - 1; i >= 0; i--) {
                        if (messagesArray[i].sender === 'user') {
                          userMessageIndex = i;
                          break;
                        }
                      }
                      
                      if (userMessageIndex !== -1) {
                        handleRequestChallenge(
                          messagesArray[userMessageIndex].content,
                          message.content
                        );
                      }
                    }}
                  >
                    Faire un exercice
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };
  
  return (
    <MathJaxContext config={mathJaxConfig}>
      <div className="app-container h-full flex flex-col bg-gray-50 dark:bg-gray-900">
        {/* En-tête */}
        <header id="kora-header" className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div id="kora-header-container" className="px-4 h-14 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Avatar className="h-8 w-8 bg-blue-500">
                <span className="font-bold text-white text-sm">K</span>
              </Avatar>
              <div>
                <h1 className="text-base font-medium text-gray-900 dark:text-gray-100">Kora</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">Assistant d'aide aux devoirs</p>
              </div>
            </div>
          </div>
        </header>
        
        {/* Contenu principal - Messages */}
        <main className="flex-1 overflow-y-auto">
          <div className="chat-messages-container pb-32">
            {messages.map(msg => <React.Fragment key={msg.id}>{renderMessage({message: msg})}</React.Fragment>)}
            <div ref={messagesEndRef} />
            
            {/* Indicateur de chargement pendant la "réflexion" */}
            {isThinking && (
              <div className="px-4 py-2 mb-4">
                <div className="max-w-3xl mx-auto">
                  <div className="inline-block rounded-2xl bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 w-full p-4">
                    <div className="flex items-center space-x-2">
                      <Loader2 className="animate-spin h-5 w-5 text-gray-500" />
                      <span className="text-gray-500 text-sm">Kora réfléchit...</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
        
        {/* Zone de saisie en bas */}
        <div ref={inputContainerRef} className="composer-container border-t border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-800">
          {/* Prévisualisation de l'image si sélectionnée */}
          {imagePreview && (
            <div className="mb-3 rounded-lg overflow-hidden relative bg-gray-100 dark:bg-gray-700 p-2">
              <div className="relative">
                <img src={imagePreview} alt="Preview" className="max-h-32 rounded max-w-full mx-auto object-contain" />
                <button 
                  onClick={() => {
                    setSelectedImage(null);
                    setImagePreview(null);
                  }}
                  className="absolute top-1 right-1 rounded-full bg-gray-800 bg-opacity-60 text-white p-1 hover:bg-opacity-80"
                >
                  <X size={16} />
                </button>
              </div>
              <div className="flex justify-between mt-2">
                <div className="text-sm text-gray-700 dark:text-gray-300 truncate max-w-[70%]">
                  {selectedImage?.name}
                </div>
                <button 
                  onClick={handleSubmitImage}
                  disabled={isUploadingImage}
                  className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                >
                  {isUploadingImage ? 'Envoi en cours...' : 'Analyser'}
                </button>
              </div>
            </div>
          )}
          
          <div className="flex space-x-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Posez votre question..."
              className="flex-1 min-h-[44px] rounded-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 px-4 py-2"
              disabled={isThinking || isRecording}
            />
            <input 
              type="file" 
              ref={fileInputRef} 
              accept="image/*" 
              onChange={handleImageSelect} 
              className="hidden" 
            />
            <button 
              onClick={handleOpenFileBrowser}
              disabled={isThinking || isRecording}
              className="rounded-full w-10 h-10 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <ImageIcon size={20} />
            </button>
            
            <button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isThinking || isRecording}
              className={`rounded-full w-10 h-10 flex items-center justify-center ${
                inputValue.trim() && !isThinking && !isRecording
                  ? 'bg-blue-500 text-white hover:bg-blue-600'
                  : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
              }`}
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>
    </MathJaxContext>
  );
}
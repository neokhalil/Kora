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
  AlertCircle,
  HelpCircle,
  Lightbulb
} from 'lucide-react';
import { Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import VoiceRecorder from '@/components/VoiceRecorder';
import ContentRenderer from '@/components/ui/ContentRenderer';
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

// Configuration pour le texte simple (sans formatage mathématique)

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
  const [progressiveText, setProgressiveText] = useState<{id: string, fullText: string, currentText: string, intervalId?: NodeJS.Timeout}>({
    id: '',
    fullText: '',
    currentText: ''
  });
  const [isMobileDevice, setIsMobileDevice] = useState(false);
  
  // Vérifier si c'est un appareil mobile
  const isMobile = useIsMobile();
  
  // Références
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const composerRef = useRef<HTMLDivElement>(null);
  
  // Initialisation du fix pour mobile et réinitialisation du textarea
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setupMobileViewportFix();
      
      // Forcer le repositionnement dès le chargement pour éviter l'espace blanc initial
      document.body.classList.add('keyboard-open');
      
      // Simuler un clic pour déclencher le repositionnement
      setTimeout(() => {
        // Forcer le rendu de la page complète
        window.scrollTo(0, 1);
        window.scrollTo(0, 0);
      }, 100);
      
      // S'assurer que la hauteur initiale du textarea est correcte au chargement
      setTimeout(() => {
        const textareas = document.querySelectorAll('.chat-textarea');
        textareas.forEach((textarea) => {
          const el = textarea as HTMLTextAreaElement;
          el.style.height = '40px';
        });
      }, 100);
    }
  }, []);

  // Détecter l'appareil mobile
  useEffect(() => {
    setIsMobileDevice(isMobile);
  }, [isMobile]);
  
  // Faire défiler jusqu'au bas des messages lors de l'ajout de nouveaux messages
  useEffect(() => {
    if (messagesEndRef.current) {
      // Utiliser un délai pour assurer que le contenu est rendu avant de défiler
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 300);
    }
    
    // S'assurer que la hauteur initiale du textarea est correcte
    const textareas = document.querySelectorAll('.chat-textarea');
    textareas.forEach((textarea) => {
      const el = textarea as HTMLTextAreaElement;
      el.style.height = '40px';
    });
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
      
      // Afficher directement le contenu complet sans animation
      setMessages(prev => 
        prev.map(msg => 
          msg.id === messageId 
            ? { ...msg, content: data.content } 
            : msg
        )
      );
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
      const textareaElement = e.target as HTMLTextAreaElement;
      textareaElement.style.height = '40px'; // Réinitialiser la hauteur
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
      
      // Afficher directement le contenu complet sans animation
      setMessages(prev => 
        prev.map(msg => 
          msg.id === reExplanationId 
            ? { ...msg, content: data.content } 
            : msg
        )
      );
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
      
      // Afficher directement le contenu complet sans animation
      setMessages(prev => 
        prev.map(msg => 
          msg.id === challengeId 
            ? { ...msg, content: data.content } 
            : msg
        )
      );
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

  const renderMessage = (message: Message) => {
    const isKora = message.sender === 'kora';
    
    return (
      <div key={message.id} className="px-4 py-2 mb-4">
        <div className={`max-w-3xl mx-auto ${isKora ? "" : "flex justify-end"}`}>
          <div 
            className={`inline-block rounded-2xl ${
              isKora 
                ? "bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 w-full px-4 py-3" 
                : "bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-tr-none user-message flex items-center min-h-[48px]"
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
            
            {/* Contenu du message avec formatage amélioré pour les maths et le code */}
            <div className="prose dark:prose-invert text-base leading-relaxed px-1">
              <ContentRenderer content={message.content} className="chat-content" />
            </div>
            
            {/* Actions supplémentaires (réexpliquer, défi, indice) */}
            {isKora && (
              <div className="mt-4 flex flex-row gap-2 justify-start">
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
                    <RefreshCw size={15} />
                    <span>Reformuler</span>
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
                        
                        // Afficher directement le contenu complet sans animation
                        setMessages(prev => 
                          prev.map(msg => 
                            msg.id === hintId 
                              ? { ...msg, content: data.content } 
                              : msg
                          )
                        );
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
                    <HelpCircle size={15} />
                    <span>Indice</span>
                  </button>
                )}
                
                {/* Bouton exercice - visible pour tous sauf défis, mais disponible pour les indices */}
                {(!message.isChallenge || message.isHint) && (
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
                    <Lightbulb size={15} />
                    <span>Exercice</span>
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
      <div className="flex flex-col h-full max-w-4xl mx-auto">
        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Zone des messages */}
          <div 
            className="flex-1 overflow-y-auto p-4 chat-messages-container messages-container" 
          >
            {messages.length === 0 ? (
              <div className="h-full flex flex-col justify-start pt-12">
                <div className="max-w-md px-4">
                  <h2 className="text-4xl font-bold mb-3">Bienvenue</h2>
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
                  <div className="px-4 py-2 mb-4">
                    <div className="max-w-3xl mx-auto">
                      <div className="inline-block rounded-2xl px-4 py-3 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200">
                        <div className="flex space-x-1">
                          <span className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
                          <span className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
                          <span className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
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
          <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 px-4 py-2 pb-4 pt-2 z-50 composer-container input-area initial-load">
            <div className="max-w-4xl mx-auto px-2">
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
              
              {/* Composeur de message style iOS, reformaté avec le texte en haut */}
              <div 
                className="bg-white dark:bg-gray-800 p-3 pb-2 rounded-3xl border border-gray-200 shadow-sm flex flex-col gap-1 mb-2"
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
                
                {/* Champ de saisie en haut */}
                <div className="w-full input-container">
                  <Textarea
                    value={inputValue}
                    onChange={(e) => {
                      setInputValue(e.target.value);
                      
                      // Auto-ajustement de la hauteur du textarea
                      e.target.style.height = '40px'; // Hauteur de base
                      const newHeight = Math.min(120, e.target.scrollHeight); // Maximum de 120px
                      e.target.style.height = `${newHeight}px`;
                    }}
                    onKeyDown={handleKeyPress}
                    placeholder="Pose ta question"
                    className="chat-textarea message-input border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-gray-600 dark:text-gray-300 placeholder:text-gray-400 dark:placeholder:text-gray-500 w-full py-2 px-2 overflow-y-auto"
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
                
                {/* Boutons d'action en bas */}
                <div className="flex justify-between items-center message-actions">
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
                  
                  {/* Conteneur à droite pour les boutons micro et envoi */}
                  <div className="flex items-center gap-2">
                    {/* Bouton d'envoi d'image - visible seulement si une image est sélectionnée */}
                    {selectedImage ? (
                      <button
                        type="button"
                        onClick={handleSubmitImage}
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
                    ) : inputValue.trim() ? (
                      /* Bouton d'envoi de texte - visible seulement si du texte est présent */
                      <button
                        type="button"
                        onClick={() => {
                          // Réinitialiser la hauteur du textarea
                          const textareas = document.querySelectorAll('.chat-textarea');
                          textareas.forEach((textarea) => {
                            const el = textarea as HTMLTextAreaElement;
                            el.style.height = '40px';
                          });
                          handleSendMessage();
                        }}
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
                          onTranscriptionComplete={async (text) => {
                            setInputValue('');
                            
                            if (text.trim().length > 0) {
                              // Créer et ajouter le message de l'utilisateur
                              const userMessage: Message = {
                                id: Date.now().toString(),
                                content: text,
                                sender: 'user',
                              };
                              
                              setMessages(prev => [...prev, userMessage]);
                              setIsThinking(true);
                              
                              try {
                                // Préparer les messages précédents pour le contexte
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
                                    question: text,
                                    messages: messageHistory
                                  }),
                                });
                                
                                if (!response.ok) {
                                  throw new Error('Erreur lors de la requête API');
                                }
                                
                                const data = await response.json();
                                
                                // Ajouter la réponse de l'IA aux messages
                                setMessages(prev => [...prev, {
                                  id: Date.now().toString(),
                                  content: data.content,
                                  sender: 'kora',
                                }]);
                              } catch (error) {
                                console.error('Erreur lors de la communication avec le serveur:', error);
                                
                                // Message d'erreur à l'utilisateur
                                setMessages(prev => [...prev, {
                                  id: Date.now().toString(),
                                  content: "Désolé, j'ai rencontré un problème en essayant de répondre. Pourriez-vous reformuler votre question?",
                                  sender: 'kora',
                                }]);
                              } finally {
                                setIsThinking(false);
                                
                                // Faire défiler vers le bas 
                                setTimeout(() => {
                                  if (messagesEndRef.current) {
                                    messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
                                  }
                                }, 100);
                              }
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
              
{/* Message d'information visible sous la zone de saisie */}
              <div className="text-xs text-gray-500 text-center mt-1 w-full footer-message">
                KORA, ton assistant IA pour réviser et faire tes exercices.
              </div>
            </div>
          </div>
        </div>
      </div>
  );
};

export default ChatAssistant;
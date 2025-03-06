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

// Configuration MathJax
const mathJaxConfig = {
  tex: {
    inlineMath: [['$', '$'], ['\\(', '\\)']],
    displayMath: [['$$', '$$'], ['\\[', '\\]']],
    processEscapes: true,
    processEnvironments: true
  },
  options: {
    enableMenu: false,    // Désactive le menu contextuel
    menuOptions: {
      settings: {
        assistiveMml: false,
        zoom: 'NoZoom'    // Désactive le zoom
      }
    }
  },
  startup: {
    typeset: false        // Ne pas traiter automatiquement la page (pour éviter les conflits)
  }
};

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
      // Utiliser un délai pour assurer que le contenu est rendu avant de défiler
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 300);
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
  
  // Fonction pour simuler l'écriture progressive du texte
  const simulateProgressiveTyping = (messageId: string, fullText: string) => {
    // Nettoyer tout intervalle précédent si existant
    if (progressiveText.intervalId) {
      clearInterval(progressiveText.intervalId);
    }
    
    let currentCharIndex = 0;
    const typingSpeed = 15; // Temps en ms entre chaque caractère
    
    // Initialiser l'état de texte progressif
    setProgressiveText({
      id: messageId,
      fullText: fullText,
      currentText: ''
    });
    
    // Créer un intervalle pour ajouter progressivement des caractères
    const intervalId = setInterval(() => {
      if (currentCharIndex < fullText.length) {
        // Ajouter le caractère suivant au texte actuel
        currentCharIndex++;
        const newCurrentText = fullText.substring(0, currentCharIndex);
        
        // Mettre à jour à la fois l'état progressif et le message
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
      intervalId
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
      
      // Afficher le texte progressivement
      simulateProgressiveTyping(messageId, data.content);
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
      
      // Simuler l'écriture progressive avec l'ID unique
      simulateProgressiveTyping(reExplanationId, data.content);
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
      
      // Ajouter le défi avec l'ID unique
      setMessages(prev => [...prev, {
        id: challengeId,
        content: data.content,
        sender: 'kora',
        isChallenge: true,
        challengeData: {
          questionId: challengeId,
          challengeType: data.challengeType || 'practice',
          expectedAnswer: data.expectedAnswer,
          solution: data.solution
        }
      }]);
    } catch (error) {
      console.error('Erreur lors de la requête de défi:', error);
      
      // Message d'erreur
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        content: "Désolé, je ne peux pas générer un exercice pour le moment.",
        sender: 'kora',
      }]);
    } finally {
      setIsThinking(false);
    }
  };
  
  // Fonction pour demander un indice sur un défi
  const handleRequestHint = async (challengeId: string, challengeContent: string) => {
    if (isThinking) return;
    
    setIsThinking(true);
    
    try {
      // Générer les IDs à l'avance
      const userMessageId = Date.now().toString();
      const hintId = (Date.now() + 1).toString();
      
      // Ajouter la demande d'indice
      setMessages(prev => [...prev, {
        id: userMessageId,
        content: "Peux-tu me donner un indice?",
        sender: 'user',
      }]);
      
      // Pour le prototype, générer un indice simple
      // Dans une version réelle, il faudrait appeler l'API
      const hint = "Pour résoudre ce problème, essaie de décomposer les étapes. Commence par identifier les variables et les contraintes données.";
      
      // Ajouter l'indice
      setMessages(prev => [...prev, {
        id: hintId,
        content: hint,
        sender: 'kora',
        isHint: true,
        challengeId: challengeId
      }]);
    } catch (error) {
      console.error('Erreur lors de la demande d\'indice:', error);
      
      // Message d'erreur
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        content: "Désolé, je ne peux pas te donner un indice pour le moment.",
        sender: 'kora',
      }]);
    } finally {
      setIsThinking(false);
    }
  };
  
  // Fonction pour gérer la soumission d'une réponse à un défi
  const handleSubmitChallengeAnswer = (challengeId: string, expectedAnswer: string) => {
    const userAnswer = challengeAnswers[challengeId] || '';
    
    // Comparer la réponse de l'utilisateur avec la réponse attendue
    // Cette logique devrait être plus sophistiquée dans une vraie application
    const isCorrect = userAnswer.trim().toLowerCase() === expectedAnswer.trim().toLowerCase();
    
    // Mettre à jour le défi
    setMessages(prev => prev.map(msg => {
      if (msg.id === challengeId && msg.challengeData) {
        return {
          ...msg,
          challengeData: {
            ...msg.challengeData,
            userAnswer,
            isAnswered: true,
            isCorrect
          }
        };
      }
      return msg;
    }));
    
    // Vider la réponse du défi
    setChallengeAnswers(prev => {
      const updated = { ...prev };
      delete updated[challengeId];
      return updated;
    });
    
    // Ajouter un message de feedback
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      content: isCorrect 
        ? "Bravo ! C'est la bonne réponse. 🎉" 
        : "Ce n'est pas tout à fait ça. Voulez-vous un indice ou voir la solution ?",
      sender: 'kora',
      allowActions: !isCorrect,
      challengeId: isCorrect ? undefined : challengeId,
    }]);
  };
  
  // Fonction pour montrer la solution à un défi
  const handleShowSolution = (challengeId: string, solution: string) => {
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      content: `Voici la solution : ${solution}`,
      sender: 'kora',
    }]);
  };
  
  // Gérer le changement de la réponse à un défi
  const handleChallengeAnswerChange = (challengeId: string, answer: string) => {
    setChallengeAnswers(prev => ({
      ...prev,
      [challengeId]: answer
    }));
  };
  
  // Utiliser notre composant MathJaxRenderer pour afficher le contenu avec les formules mathématiques
  // et appliquer un rendu progressif du texte pour les messages de Kora
  const MessageItem = (message: Message) => {
    const isKora = message.sender === 'kora';
    
    return (
      <div key={message.id} className="px-4 py-2 mb-4">
        <div className={`max-w-3xl mx-auto ${isKora ? "" : "flex justify-end"}`}>
          <div 
            className={`inline-block rounded-2xl ${
              isKora 
                ? "bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200" 
                : "bg-blue-500 text-white"
            } ${
              message.isChallenge ? "w-full" : ""
            }`}
          >
            {/* Afficher l'image si elle existe */}
            {message.imageUrl && (
              <div className="mb-3">
                <div className="relative rounded-lg overflow-hidden">
                  <img 
                    src={message.imageUrl} 
                    alt="Image envoyée" 
                    className="w-full h-auto max-h-[300px] object-contain bg-gray-100"
                  />
                </div>
              </div>
            )}
            
            {/* Contenu du message avec support pour les formules mathématiques */}
            <div className="prose dark:prose-invert text-base leading-relaxed px-1">
              <MathJaxRenderer content={message.content} />
            </div>
            
            {/* Actions spécifiques selon le type de message (réexplication, défi, etc.) */}
            {isKora && message.allowActions && !message.isChallenge && (
              <div className="mt-4 flex flex-wrap gap-3 justify-start">
                {/* Bouton de réexplication */}
                <Button
                  onClick={() => handleRequestReExplanation(
                    // Trouver le message utilisateur précédent pour le contexte
                    messages.find(m => m.sender === 'user' && m.id < message.id)?.content || "",
                    message.content
                  )}
                  className="px-3 py-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-full text-sm font-medium"
                  variant="ghost"
                >
                  Ré-explique
                </Button>
                
                {/* Bouton de défi */}
                <Button
                  onClick={() => handleRequestChallenge(
                    messages.find(m => m.sender === 'user' && m.id < message.id)?.content || "",
                    message.content
                  )}
                  className="px-3 py-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-full text-sm font-medium"
                  variant="ghost"
                >
                  Faire un exercice
                </Button>
              </div>
            )}
            
            {/* Interface pour les défis */}
            {isKora && message.isChallenge && message.challengeData && (
              <div className="mt-4 border-t pt-3 dark:border-gray-700">
                {!message.challengeData.isAnswered ? (
                  <div className="space-y-3">
                    <Input
                      type="text"
                      placeholder="Entrez votre réponse ici..."
                      value={challengeAnswers[message.id] || ''}
                      onChange={(e) => handleChallengeAnswerChange(message.id, e.target.value)}
                      className="w-full border dark:border-gray-700"
                    />
                    <div className="flex space-x-2">
                      <Button
                        onClick={() => message.challengeData?.expectedAnswer && 
                          handleSubmitChallengeAnswer(message.id, message.challengeData.expectedAnswer)
                        }
                        className="px-3 py-1 text-sm"
                        variant="default"
                      >
                        Soumettre
                      </Button>
                      <Button
                        onClick={() => handleRequestHint(message.id, message.content)}
                        className="px-3 py-1 text-sm"
                        variant="outline"
                      >
                        Indice
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className={`p-2 rounded-md ${
                      message.challengeData.isCorrect 
                        ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300" 
                        : "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300"
                    }`}>
                      {message.challengeData.isCorrect 
                        ? "Votre réponse est correcte !" 
                        : "Ce n'est pas la bonne réponse."}
                    </div>
                    {!message.challengeData.isCorrect && (
                      <div className="flex space-x-2">
                        <Button
                          onClick={() => handleRequestHint(message.id, message.content)}
                          className="px-3 py-1 text-sm"
                          variant="outline"
                        >
                          Indice
                        </Button>
                        {message.challengeData.solution && (
                          <Button
                            onClick={() => handleShowSolution(message.id, message.challengeData?.solution || "")}
                            className="px-3 py-1 text-sm"
                            variant="outline"
                          >
                            Voir la solution
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
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
      <TooltipProvider>
        <div className="flex flex-col h-full max-w-4xl mx-auto">
          <div className="flex-1 overflow-hidden flex flex-col">
            {/* Zone des messages */}
            <div 
              className="flex-1 overflow-y-auto p-4 chat-messages-container" 
            >
              {messages.length === 0 ? (
                <div className="h-full flex flex-col justify-start pt-12">
                  <div className="max-w-md px-4">
                    <h3 className="text-xl font-semibold mb-4 text-center">
                      💡 Bonjour, je suis Kora, votre assistant d'aide aux devoirs.
                    </h3>
                    <p className="text-center mb-6 text-gray-600 dark:text-gray-300">
                      Je peux vous aider à comprendre les concepts difficiles et répondre à vos questions.
                    </p>
                    <div className="space-y-4">
                      <p className="text-sm text-gray-500 dark:text-gray-400">Exemples de questions:</p>
                      <div className="px-4 py-2 mb-4">
                        <div className="max-w-3xl mx-auto">
                          <div className="inline-block rounded-2xl px-4 py-3 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200">
                            <div className="flex space-x-1">
                              <span className="cursor-pointer" onClick={() => {
                                setInputValue("Comment résoudre une équation du second degré ?");
                              }}>Comment résoudre une équation du second degré ?</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                // Afficher les messages de la conversation
                messages.map(message => (
                  <React.Fragment key={message.id}>
                    {MessageItem(message)}
                  </React.Fragment>
                ))
              )}
              
              {/* Référence pour faire défiler vers le bas */}
              <div ref={messagesEndRef} />
            </div>
        
            {/* Zone de saisie fixée en bas */}
            <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 px-4 py-2 z-50 composer-container">
              <div className="max-w-4xl mx-auto">
                {/* Aperçu de l'image sélectionnée */}
                {imagePreview && (
                  <div className="mb-2 relative bg-gray-100 dark:bg-gray-800 rounded-lg p-2">
                    <div className="flex items-start">
                      <div className="flex-1 flex space-x-2 items-center">
                        <div className="w-16 h-16 relative overflow-hidden rounded-md border border-gray-300 dark:border-gray-700">
                          <img 
                            src={imagePreview} 
                            alt="Aperçu" 
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
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => {
                          setSelectedImage(null);
                          setImagePreview(null);
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <Button
                      onClick={handleSubmitImage}
                      disabled={isUploadingImage}
                      className="mt-2 w-full"
                    >
                      {isUploadingImage ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Envoi en cours...
                        </>
                      ) : (
                        "Envoyer l'image"
                      )}
                    </Button>
                  </div>
                )}
            
                <div 
                  ref={composerRef}
                  className="flex flex-col space-y-2 rounded-xl p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
                >
                  <Input
                    type="text"
                    placeholder="Posez votre question ici..."
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyPress}
                    className="flex-1 focus:outline-none focus:ring-0 focus:border-transparent bg-transparent border-none rounded-xl placeholder-gray-500"
                    disabled={isThinking || isUploadingImage}
                  />
                  
                  <div className="flex items-center justify-between gap-2">
                    {/* Boutons d'action (image, son) */}
                    <div className="flex gap-2">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 rounded-full"
                            onClick={handleOpenFileBrowser}
                            disabled={isThinking || isUploadingImage}
                          >
                            <Camera className="h-5 w-5 text-gray-500" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Envoyer une image</p>
                        </TooltipContent>
                      </Tooltip>
                      
                      <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/*"
                        onChange={handleImageSelect}
                        className="hidden"
                      />
                    </div>
                    
                    {/* Bouton d'envoi */}
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 rounded-full bg-blue-500 text-white hover:bg-blue-600"
                        onClick={handleSendMessage}
                        disabled={isThinking || isUploadingImage || !inputValue.trim()}
                      >
                        {isThinking ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          <Send className="h-5 w-5" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="mt-2 text-xs text-gray-500 text-center">
                  Je t'aide à comprendre, mais n'écris pas tes devoirs à ta place.
                </div>
              </div>
            </div>
          </div>
        </div>
      </TooltipProvider>
    </MathJaxContext>
  );
};

export default ChatAssistant;
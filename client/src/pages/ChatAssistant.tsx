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
  const [messages, setMessages] = useState<Message[]>([]);
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
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const composerRef = useRef<HTMLDivElement>(null);
  // Nous n'avons plus besoin des références vidéo et canvas
  // puisque nous utilisons l'appareil photo natif du téléphone
  
  // Auto-scroll to bottom when messages change - without smooth animation on mobile to avoid visual cues
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: isMobileDevice ? 'auto' : 'smooth' });
    }
  }, [messages, isMobileDevice]);
  
  // Detect mobile device and handle visual viewport changes (for keyboard)
  useEffect(() => {
    const checkMobile = () => {
      // Détection réelle de l'appareil mobile
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || 
                     (window.matchMedia && window.matchMedia('(max-width: 768px)').matches);
      console.log('Device detection:', { 
        userAgent: navigator.userAgent,
        isMediaQueryMatch: window.matchMedia && window.matchMedia('(max-width: 768px)').matches,
        isMobileDetected: isMobile 
      });
      setIsMobileDevice(isMobile);
    };
    
    // Handle keyboard on mobile (using VisualViewport API)
    const handleVisualViewportChange = () => {
      if (window.visualViewport) {
        const offsetHeight = window.innerHeight - window.visualViewport.height;
        setKeyboardHeight(offsetHeight > 150 ? offsetHeight : 0);
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    // Add visual viewport event listeners if available
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleVisualViewportChange);
      window.visualViewport.addEventListener('scroll', handleVisualViewportChange);
    }
    
    return () => {
      window.removeEventListener('resize', checkMobile);
      
      // Remove visual viewport event listeners
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleVisualViewportChange);
        window.visualViewport.removeEventListener('scroll', handleVisualViewportChange);
      }
    };
  }, []);
  
  // Nous n'avons plus besoin de nettoyer les ressources de la caméra puisque
  // nous utilisons l'appareil photo intégré du navigateur
  
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
              console.log('Received welcome message');
              // Nous ne définissons plus de message initial ici
              // L'écran d'accueil se charge automatiquement quand messages est vide
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
            } else if (data.type === 'history') {
              // Handle conversation history update
              console.log('Received history update from server:', data.history?.length || 0);
              
              // We're not updating the UI with this history directly 
              // It's just to ensure the server has the correct context for future interactions
              if (data.sessionId === sessionId) {
                console.log('History updated for current session');
              }
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
  
  // Generate a unique session ID for this browser session
  const [sessionId] = useState(() => {
    // Try to get existing session ID from localStorage
    const savedSessionId = localStorage.getItem('kora_session_id');
    if (savedSessionId) {
      return savedSessionId;
    }
    // Create a new session ID if none exists
    const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    localStorage.setItem('kora_session_id', newSessionId);
    return newSessionId;
  });

  // Send a message to the server via WebSocket
  const sendMessage = (type: string, content: any) => {
    if (
      socketRef.current && 
      socketRef.current.readyState === WebSocket.OPEN
    ) {
      socketRef.current.send(JSON.stringify({
        type,
        sessionId,
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
    console.log("Generating challenge from button");
    setIsThinking(true);
    
    // Générer un défi adapté au contexte de la conversation
    let challengeType = 'basic'; // Par défaut
    let challengeContent = '';
    let expectedAnswer = '';
    
    // Chercher des indices sur le contexte dans les messages récents
    const recentMessages = messages.slice(-5);
    const algebraPattern = /équation|variable|x\s*=|ax\s*\+|résoudre|linéaire|système|isoler/i;
    const geometryPattern = /triangle|cercle|aire|surface|volume|périmètre|angle|degré|rectangle|carré/i;
    const calculusPattern = /dérivée|intégrale|fonction|limite|dx|f\(x\)/i;
    
    // Vérifier si les messages récents contiennent des mots-clés
    const hasAlgebra = recentMessages.some(m => algebraPattern.test(m.content));
    const hasGeometry = recentMessages.some(m => geometryPattern.test(m.content));
    const hasCalculus = recentMessages.some(m => calculusPattern.test(m.content));
    
    console.log("Context detection for challenge:", {hasAlgebra, hasGeometry, hasCalculus});
    
    // Créer un défi en fonction du contexte
    if (hasAlgebra) {
      // Défi d'algèbre simple: résoudre pour x
      const a = Math.floor(Math.random() * 5) + 1;  // 1-5
      const b = Math.floor(Math.random() * 10);     // 0-9
      const c = Math.floor(Math.random() * 20) + 1; // 1-20
      
      // Equation ax + b = c
      const result = (c - b) / a;
      
      // Vérifier que result est un nombre entier pour simplifier
      if (Number.isInteger(result)) {
        challengeContent = `### Nouveau défi d'algèbre:\n\nRésous l'équation pour trouver x: $${a}x + ${b} = ${c}$\n\nEntre ta réponse ci-dessous.`;
        expectedAnswer = result.toString();
      } else {
        // Dans le cas où ce n'est pas un entier, formater comme fraction ou décimal selon le cas
        if (result === Math.floor(result)) {
          expectedAnswer = result.toString();
        } else {
          // Arrondir à 2 décimales pour simplifier
          expectedAnswer = result.toFixed(2);
        }
        challengeContent = `### Nouveau défi d'algèbre:\n\nRésous l'équation pour trouver x: $${a}x + ${b} = ${c}$\n\nEntre ta réponse sous forme décimale arrondie à 2 décimales si nécessaire.`;
      }
      challengeType = 'algebra';
    } 
    else if (hasGeometry) {
      // Défi de géométrie simple
      const radius = Math.floor(Math.random() * 10) + 1;
      const area = Math.PI * radius * radius;
      challengeContent = `### Nouveau défi de géométrie:\n\nCalcule l'aire d'un cercle avec un rayon de $${radius}$ cm.\n\nDonne ta réponse arrondie à l'entier le plus proche.`;
      expectedAnswer = Math.round(area).toString();
      challengeType = 'geometry';
    }
    else if (hasCalculus) {
      // Défi sur les dérivées simples
      const power = Math.floor(Math.random() * 3) + 2; // puissance entre 2 et 4
      const coefficient = Math.floor(Math.random() * 5) + 1; // coefficient entre 1 et 5
      
      challengeContent = `### Nouveau défi de calcul différentiel:\n\nCalcule la dérivée de la fonction $f(x) = ${coefficient}x^{${power}}$\n\nExprime ta réponse sous la forme $ax^b$.`;
      
      const derivCoeff = coefficient * power;
      const derivPower = power - 1;
      
      expectedAnswer = `${derivCoeff}x^${derivPower}`;
      challengeType = 'calculus';
    }
    else {
      // Défi arithmétique simple si aucun contexte spécifique
      const a = Math.floor(Math.random() * 10) + 1;
      const b = Math.floor(Math.random() * 10) + 1;
      const operations = ['+', '-', '*'];
      const opIndex = Math.floor(Math.random() * 3);
      const operation = operations[opIndex];
      
      let result = 0, equation = '';
      
      switch(operation) {
        case '+':
          result = a + b;
          equation = `${a} + ${b}`;
          break;
        case '-':
          result = a - b;
          equation = `${a} - ${b}`;
          break;
        case '*':
          result = a * b;
          equation = `${a} \\times ${b}`;
          break;
      }
      
      challengeContent = `### Nouveau défi d'arithmétique:\n\nCalcule: $${equation} = ?$\n\nEntre ta réponse ci-dessous.`;
      expectedAnswer = result.toString();
      challengeType = 'arithmetic';
    }
    
    // Create a new challenge message
    const challengeMessage: Message = {
      id: Date.now().toString(),
      content: challengeContent,
      sender: 'kora',
      isChallenge: true,
      challengeData: {
        expectedAnswer: expectedAnswer,
        isAnswered: false,
        challengeType: challengeType  // Stocker le type de défi pour générer la solution
      }
    };
    
    // Add the message and stop thinking indicator
    setTimeout(() => {
      setMessages(prev => [...prev, challengeMessage]);
      setIsThinking(false);
      
      // Scroll to the new message without smooth animation on mobile
      setTimeout(() => {
        if (messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({ behavior: isMobileDevice ? 'auto' : 'smooth' });
        }
      }, 100);
    }, 800);
    
    // Nous n'avons pas besoin d'envoyer un message au serveur car nous générons le défi localement
    // sendMessage('challenge', {});
  };
  
  // Handle changes to challenge answer inputs
  const handleChallengeAnswerChange = (messageId: string, value: string) => {
    setChallengeAnswers(prev => ({
      ...prev,
      [messageId]: value
    }));
  };
  
  // Submit a challenge answer
  const handleSubmitChallengeAnswer = (messageId: string) => {
    const answer = challengeAnswers[messageId];
    if (!answer || !answer.trim()) return;
    
    // Find the correct answer from the message's challenge data
    const message = messages.find(m => m.id === messageId);
    if (!message) return;
    
    // Get the expected answer from the challenge data
    const expectedAnswer = message.challengeData?.expectedAnswer || "";
    
    // Set a loading state for this message
    setMessages(prev => 
      prev.map(m => 
        m.id === messageId 
          ? {
              ...m,
              challengeData: {
                ...m.challengeData,
                isAnswered: true,
                userAnswer: answer,
                isCorrect: undefined // Loading state
              }
            }
          : m
      )
    );
    
    // Send the answer to the server for evaluation
    sendMessage('challenge_answer', { 
      messageId: message.messageId, 
      answer 
    });
    
    // For demo purposes, we'll simulate a response
    setTimeout(() => {
      // Compare answers (you could make this more sophisticated)
      const isCorrect = answer.trim() === expectedAnswer.trim();
      
      // Update the message with the result
      setMessages(prev => 
        prev.map(m => 
          m.id === messageId 
            ? {
                ...m,
                challengeData: {
                  ...m.challengeData,
                  isAnswered: true,
                  userAnswer: answer,
                  isCorrect,
                  expectedAnswer  // Make sure to include the expected answer
                }
              }
            : m
        )
      );
    }, 500);
  };

  // Handle image selection
  const handleImageSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check if the file is an image
      if (!file.type.startsWith('image/')) {
        alert('Veuillez sélectionner une image valide.');
        return;
      }
      
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('L\'image est trop grande. La taille maximale est de 5MB.');
        return;
      }
      
      setSelectedImage(file);
      
      // Create image preview
      const reader = new FileReader();
      reader.onload = (event) => {
        setImagePreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  // Clear selected image
  const handleClearImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  // Upload image and get analysis
  const handleImageAnalysis = async () => {
    if (!selectedImage) return;
    
    setIsUploadingImage(true);
    setIsThinking(true);
    
    // Add user message with image
    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue || "Peux-tu m'aider avec cette image ?",
      sender: 'user',
      imageUrl: imagePreview || undefined
    };
    
    setMessages(prev => [...prev, userMessage]);
    
    // Create form data for the file upload
    const formData = new FormData();
    formData.append('image', selectedImage);
    
    // Add optional subject field
    formData.append('subject', imageSubject);
    
    // Add session ID to preserve context between HTTP and WebSocket
    formData.append('sessionId', sessionId);
    
    // Add optional query text
    if (inputValue.trim()) {
      formData.append('query', inputValue);
    }
    
    try {
      // Send the request to the server
      const response = await fetch('/api/image-analysis', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      // Parse the response
      const data = await response.json();
      
      // Add response to messages
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        content: data.content,
        sender: 'kora',
        isImageAnalysis: true,
        allowActions: true
      }]);
      
      // Request any updated conversation history from server via WebSocket
      // This will ensure context continuity for future interactions
      setTimeout(() => {
        sendMessage('load_history', {});
      }, 500);
      
      // Clear image and input
      handleClearImage();
      setInputValue('');
      
    } catch (error) {
      console.error('Error analyzing image:', error);
      
      // Show error message
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        content: "Désolé, j'ai rencontré un problème lors de l'analyse de cette image. Veuillez réessayer ou utiliser une autre image.",
        sender: 'kora',
      }]);
    } finally {
      setIsUploadingImage(false);
      setIsThinking(false);
    }
  };
  
  // Nous avons supprimé toutes les fonctions personnalisées liées à la caméra
  // et utilisons plutôt l'appareil photo intégré du navigateur mobile
  
  // Open file browser dialog
  const handleOpenFileBrowser = () => {
    fileInputRef.current?.click();
  };

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
  
  // Simplified Custom renderer for markdown that preserves and renders LaTeX
  const CustomMarkdownRenderer = ({ content }: { content: string }) => {
    // Create a wrapper that combines ReactMarkdown for text formatting
    // and KaTeX for math rendering
    
    // Preprocess the content to transform LaTeX expressions into a format
    // that won't be treated as markdown by ReactMarkdown
    
    // Extract and save LaTeX blocks with placeholders
    const mathExpressions: { id: string; formula: string; isBlock: boolean }[] = [];
    
    // Handle display/block math expressions ($$...$$)
    let processedContent = content.replace(/\$\$([\s\S]*?)\$\$/g, (match, formula) => {
      const id = `block-${mathExpressions.length}`;
      // Nettoyer la formule pour éviter les problèmes de rendu
      const cleanedFormula = formula.trim();
      mathExpressions.push({ id, formula: cleanedFormula, isBlock: true });
      return `{{MATH-${id}}}`;
    });
    
    // Handle inline math expressions ($...$) but not double $$ already handled
    // Modification du regex pour mieux capturer les expressions mathématiques complexes
    processedContent = processedContent.replace(/\$([^\$]+?)\$/g, (match, formula) => {
      const id = `inline-${mathExpressions.length}`;
      // Nettoyer la formule pour éviter les problèmes de rendu
      const cleanedFormula = formula.trim();
      mathExpressions.push({ id, formula: cleanedFormula, isBlock: false });
      return `{{MATH-${id}}}`;
    });
    
    // Pre-process Markdown format in content for proper rendering
    processedContent = processedContent
      // Format **Étape N:** titles as headers
      .replace(/\*\*(Étape \d+.*?)\*\*/g, '### $1')
      // Format **Important:** as special headers
      .replace(/\*\*(Important|Remarque|Note|Attention)(\s*:)\*\*/g, '### $1$2')
      // Make sure lists render properly
      .replace(/^- ([^*])/gm, '* $1')
      .replace(/^(\d+)\. /gm, '$1\\. ')
      // Preprocess array environments to handle them specially
      .replace(/\\begin\{array\}(\{[^}]*\})([\s\S]*?)\\end\{array\}/g, (match) => {
        // Escape the match to preserve it through markdown processing
        return '```latex\n' + match + '\n```';
      });
    
    // Create a component that renders the markdown first,
    // then replaces the math placeholders with actual rendered math
    const components = {
      p: ({ ...props }: any) => {
        const processedChildren = renderChildrenWithMath(props.children);
        return <p className="mb-4" {...props}>{processedChildren}</p>;
      },
      h1: ({ ...props }: any) => (
        <h1 className="text-2xl font-bold mt-5 mb-3 text-blue-800 dark:text-blue-300" {...props}>
          {renderChildrenWithMath(props.children)}
        </h1>
      ),
      h2: ({ ...props }: any) => (
        <h2 className="text-xl font-semibold mt-4 mb-2 text-blue-700 dark:text-blue-400" {...props}>
          {renderChildrenWithMath(props.children)}
        </h2>
      ),
      h3: ({ ...props }: any) => (
        <h3 className="text-lg font-semibold mt-4 mb-2 text-blue-700 dark:text-blue-400" {...props}>
          {renderChildrenWithMath(props.children)}
        </h3>
      ),
      h4: ({ ...props }: any) => (
        <h4 className="text-base font-medium mt-3 mb-1 text-blue-600 dark:text-blue-500" {...props}>
          {renderChildrenWithMath(props.children)}
        </h4>
      ),
      ul: ({ ...props }: any) => (
        <ul className="list-disc pl-5 my-3 space-y-1" {...props}>
          {props.children}
        </ul>
      ),
      ol: ({ ...props }: any) => (
        <ol className="list-decimal pl-5 my-3 space-y-1" {...props}>
          {props.children}
        </ol>
      ),
      li: ({ ...props }: any) => (
        <li className="mb-1" {...props}>
          {renderChildrenWithMath(props.children)}
        </li>
      ),
      blockquote: ({ ...props }: any) => (
        <blockquote className="border-l-4 border-blue-300 dark:border-blue-700 pl-4 py-1 my-3 text-gray-700 dark:text-gray-300 italic" {...props}>
          {renderChildrenWithMath(props.children)}
        </blockquote>
      ),
      strong: ({ ...props }: any) => (
        <strong {...props}>{renderChildrenWithMath(props.children)}</strong>
      ),
      em: ({ ...props }: any) => (
        <em {...props}>{renderChildrenWithMath(props.children)}</em>
      ),
      code: ({ node, inline, className, children, ...props }: any) => (
        inline ? 
          <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-sm font-mono" {...props}>
            {children}
          </code>
        : 
          <code className="block bg-gray-100 dark:bg-gray-800 p-3 rounded-md text-sm font-mono overflow-x-auto" {...props}>
            {children}
          </code>
      )
    };
    
    // Recursive function to process children and render LaTeX
    function renderChildrenWithMath(children: React.ReactNode): React.ReactNode {
      if (typeof children === 'string') {
        return renderMathInText(children);
      }
      
      if (React.isValidElement(children)) {
        return React.cloneElement(
          children,
          children.props,
          renderChildrenWithMath(children.props.children)
        );
      }
      
      if (Array.isArray(children)) {
        return children.map((child, index) => (
          <React.Fragment key={index}>
            {renderChildrenWithMath(child)}
          </React.Fragment>
        ));
      }
      
      return children;
    }
    
    // Process text and handle math placeholders
    function renderMathInText(text: string): React.ReactNode {
      if (!text.includes('{{MATH-')) {
        return text;
      }
      
      const parts: React.ReactNode[] = [];
      let lastIndex = 0;
      const regex = /\{\{MATH-(.*?)\}\}/g;
      let match;
      
      while ((match = regex.exec(text)) !== null) {
        // Add text before the math
        if (match.index > lastIndex) {
          parts.push(text.substring(lastIndex, match.index));
        }
        
        // Find the math expression
        const id = match[1];
        const mathExpr = mathExpressions.find(m => m.id === id);
        
        if (mathExpr) {
          if (mathExpr.isBlock) {
            parts.push(
              <div key={id} className="math-block-container">
                <BlockMath math={mathExpr.formula} />
              </div>
            );
          } else {
            parts.push(
              <span key={id} className="math-inline-container">
                <InlineMath math={mathExpr.formula} />
              </span>
            );
          }
        } else {
          parts.push(`[Math Error]`);
        }
        
        lastIndex = match.index + match[0].length;
      }
      
      // Add remaining text
      if (lastIndex < text.length) {
        parts.push(text.substring(lastIndex));
      }
      
      return <>
        {parts.map((part, i) => 
          <React.Fragment key={i}>{part}</React.Fragment>
        )}
      </>;
    }
    
    return (
      <div className="message-content math-content">
        <ReactMarkdown components={components}>{processedContent}</ReactMarkdown>
      </div>
    );
  };

  // Render each message bubble in the chat
  // For user messages, simply display the text content
  // For Kora's messages, render markdown content and support math formatting
  const renderMessage = (message: Message) => {
    if (message.sender === 'user') {
      return (
        <div key={message.id} className="flex justify-end mb-4">
          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg py-3 px-4 max-w-[90%] overflow-hidden">
            <p className="text-gray-800 dark:text-gray-200">{message.content}</p>
          </div>
        </div>
      );
    }
    
    return (
      <div key={message.id} className="flex mb-4">
        <div className="bg-blue-50 dark:bg-gray-700 rounded-lg py-3 px-4 max-w-[90%] overflow-hidden">
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
                          Ta réponse {message.challengeData.userAnswer} n'est pas correcte.
                        </span>
                      </>
                    )}
                  </div>
                  
                  {/* Action buttons */}
                  <div className="flex space-x-2 mt-1">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        // Reset the answer for this challenge
                        setMessages(prev => 
                          prev.map(m => 
                            m.id === message.id 
                              ? {
                                  ...m,
                                  challengeData: {
                                    ...m.challengeData,
                                    isAnswered: false,
                                    userAnswer: undefined,
                                    isCorrect: undefined
                                  }
                                }
                              : m
                          )
                        );
                        // Clear the input for this challenge
                        setChallengeAnswers(prev => ({
                          ...prev,
                          [message.id]: ''
                        }));
                      }}
                      className="text-xs"
                    >
                      Réessayer
                    </Button>
                    
                    {!message.challengeData.isCorrect && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          console.log("Requesting solution for challenge");
                          
                          // Générer une solution détaillée adaptée au type de défi
                          const answer = message.challengeData?.expectedAnswer || "";
                          const challengeType = message.challengeData?.challengeType || "arithmetic";
                          
                          // Récupérer le contenu original du défi
                          const originalContent = message.content;
                          console.log("Challenge type:", challengeType);
                          
                          let solution = "";
                          
                          // Traiter différemment selon le type de défi
                          switch (challengeType) {
                            case 'arithmetic':
                              // Extraire l'équation avec une régex
                              const arithmeticMatch = originalContent.match(/\$([^$]+?)(?:\s*=\s*\?)?\$/);
                              if (arithmeticMatch && arithmeticMatch[1]) {
                                const equation = arithmeticMatch[1].trim();
                                
                                if (equation.includes('+')) {
                                  // Addition
                                  const parts = equation.split('+').map(p => p.trim());
                                  solution = `Pour résoudre $${equation} = ?$ :\n\n1. **Additionner** les nombres $${parts[0]}$ et $${parts[1]}$\n2. $${parts[0]} + ${parts[1]} = ${answer}$\n\nLa réponse est donc **$${answer}$**`;
                                } 
                                else if (equation.includes('-')) {
                                  // Soustraction
                                  const parts = equation.split('-').map(p => p.trim());
                                  solution = `Pour résoudre $${equation} = ?$ :\n\n1. **Soustraire** $${parts[1]}$ de $${parts[0]}$\n2. $${parts[0]} - ${parts[1]} = ${answer}$\n\nLa réponse est donc **$${answer}$**`;
                                }
                                else if (equation.includes('\\times') || equation.includes('×')) {
                                  // Multiplication
                                  const parts = equation.split(/\\times|×/).map(p => p.trim());
                                  solution = `Pour résoudre $${equation} = ?$ :\n\n1. **Multiplier** les nombres $${parts[0]}$ et $${parts[1]}$\n2. $${parts[0]} \\times ${parts[1]} = ${answer}$\n\nLa réponse est donc **$${answer}$**`;
                                }
                                else {
                                  // Fallback général pour arithmétique
                                  solution = `Pour résoudre $${equation} = ?$ :\n\n1. **Effectuer** l'opération demandée\n\nLa réponse est **$${answer}$**`;
                                }
                              } else {
                                solution = `La réponse est **${answer}**`;
                              }
                              break;
                              
                            case 'algebra':
                              // Extraire l'équation avec une régex
                              const algebraMatch = originalContent.match(/\$([^$]+?)(?:\s*=\s*[^$]+?)?\$/);
                              if (algebraMatch && algebraMatch[1]) {
                                const equation = algebraMatch[1].trim();
                                
                                // Extraction des paramètres a, b, c pour ax + b = c
                                const algebraPattern = /(\d+)x\s*\+\s*(\d+)\s*=\s*(\d+)/;
                                const params = equation.match(algebraPattern);
                                
                                if (params) {
                                  const a = parseInt(params[1]);
                                  const b = parseInt(params[2]);
                                  const c = parseInt(params[3]);
                                  
                                  solution = `Pour résoudre l'équation $${a}x + ${b} = ${c}$ :\n\n1. **Isoler** le terme avec $x$ en soustrayant $${b}$ des deux côtés\n\n   $${a}x + ${b} - ${b} = ${c} - ${b}$\n\n   $${a}x = ${c - b}$\n\n2. **Diviser** les deux côtés par $${a}$ pour isoler $x$\n\n   $\\frac{${a}x}{${a}} = \\frac{${c - b}}{${a}}$\n\n   $x = ${answer}$\n\nLa réponse est donc **$x = ${answer}$**`;
                                } else {
                                  // Récupérer l'équation originale du message
                                  const originalMessageContent = originalContent || "";
                                  const equationMatchInChallenge = originalMessageContent.match(/l'équation\s*\$([^$]+)\$/i);
                                  
                                  // Tenter d'identifier les valeurs dans le contenu original
                                  const numericValueMatch = originalMessageContent.match(/=\s*\$?(\d+(?:\.\d+)?)\$?/);
                                  const rightSideValue = numericValueMatch ? numericValueMatch[1] : "?";
                                
                                  // Si on peut extraire l'équation originale du défi, l'utiliser, sinon créer une équation précise
                                  const equationComplete = equationMatchInChallenge ? 
                                    equationMatchInChallenge[1] : 
                                    (equation.includes('=') ? equation : `${equation} = ${rightSideValue}`);
                                    
                                  solution = `Pour résoudre l'équation $${equationComplete}$ :\n\n1. **Isoler** la variable $x$\n\n2. **Résoudre** l'équation\n\nLa réponse est $x = ${answer}$`;
                                }
                              } else {
                                solution = `La réponse à cette équation est **$x = ${answer}$**`;
                              }
                              break;
                              
                            case 'geometry':
                              // Extraire le rayon du cercle
                              const radiusMatch = originalContent.match(/rayon\s+de\s+\$(\d+)\$/i);
                              if (radiusMatch && radiusMatch[1]) {
                                const radius = parseInt(radiusMatch[1]);
                                solution = `Pour calculer l'aire d'un cercle avec un rayon de $${radius}$ cm :\n\n1. **Appliquer** la formule de l'aire d'un cercle: $A = \\pi r^2$\n\n2. **Remplacer** $r$ par $${radius}$\n\n   $A = \\pi \\times ${radius}^2$\n\n   $A = \\pi \\times ${radius * radius}$\n\n   $A \\approx 3.14159 \\times ${radius * radius}$\n\n   $A \\approx ${Math.PI * radius * radius}$\n\n3. **Arrondir** à l'entier le plus proche\n\n   $A \\approx ${answer}$ cm$^2$\n\nLa réponse est donc **$${answer}$ cm$^2$**`;
                              } else {
                                solution = `Pour calculer l'aire du cercle, j'ai utilisé la formule $A = \\pi r^2$ et arrondi à l'entier le plus proche.\n\nLa réponse est **$${answer}$ cm$^2$**`;
                              }
                              break;
                              
                            case 'calculus':
                              // Extraire la fonction
                              const functionMatch = originalContent.match(/f\(x\)\s*=\s*(\d+)x\^{(\d+)}/);
                              if (functionMatch) {
                                const coefficient = parseInt(functionMatch[1]);
                                const power = parseInt(functionMatch[2]);
                                const derivCoeff = coefficient * power;
                                const derivPower = power - 1;
                                
                                solution = `Pour dériver la fonction $f(x) = ${coefficient}x^{${power}}$ :\n\n1. **Appliquer** la règle de dérivation pour les fonctions puissance:\n\n   $\\frac{d}{dx}[x^n] = nx^{n-1}$\n\n2. **Utiliser** la règle du coefficient constant:\n\n   $\\frac{d}{dx}[cf(x)] = c\\frac{d}{dx}[f(x)]$\n\n3. **Calculer** la dérivée:\n\n   $f'(x) = ${coefficient} \\times ${power} \\times x^{${power}-1}$\n\n   $f'(x) = ${derivCoeff}x^{${derivPower}}$\n\nLa réponse est donc **$f'(x) = ${answer}$**`;
                              } else {
                                solution = `Pour dériver cette fonction, j'ai appliqué les règles standard de dérivation.\n\nLa réponse est **$f'(x) = ${answer}$**`;
                              }
                              break;
                              
                            default:
                              // Solution générique par défaut
                              solution = `La solution à ce problème est: **${answer}**\n\nPour résoudre ce type de problème, identifie d'abord les valeurs données, puis applique les formules ou méthodes appropriées pour trouver la réponse.`;
                          }
                          
                          const solutionMessage: Message = {
                            id: Date.now().toString(),
                            content: `### Solution détaillée:\n\n${solution}`,
                            sender: 'kora',
                            isChallenge: false
                          };
                          
                          setMessages(prev => [...prev, solutionMessage]);
                          
                          // In a real implementation, also send to server
                          sendMessage('challenge_solution', { 
                            messageId: message.id
                          });
                          
                          // Scroll to the new message without smooth animation on mobile
                          setTimeout(() => {
                            if (messagesEndRef.current) {
                              messagesEndRef.current.scrollIntoView({ behavior: isMobileDevice ? 'auto' : 'smooth' });
                            }
                          }, 100);
                        }}
                        className="text-xs"
                      >
                        Voir la solution
                      </Button>
                    )}
                    
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        // Generate a new challenge directly
                        console.log("Generating new challenge");
                        
                        // Create a random math challenge
                        const a = Math.floor(Math.random() * 10) + 1;
                        const b = Math.floor(Math.random() * 10) + 1;
                        const operation = ['+', '-', '*'][Math.floor(Math.random() * 3)];
                        let result, equation, answer;
                        
                        switch(operation) {
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
                        
                        // Scroll to the new message without smooth animation on mobile
                        setTimeout(() => {
                          if (messagesEndRef.current) {
                            messagesEndRef.current.scrollIntoView({ behavior: isMobileDevice ? 'auto' : 'smooth' });
                          }
                        }, 100);
                        
                        // Nous n'avons pas besoin d'envoyer un message au serveur ici
                        // sendMessage('challenge', {});
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
    );
  };

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto">
      
      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Chat messages area with padding bottom to account for fixed input area */}
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
            </>
          )}
          
          <div ref={messagesEndRef} />
        </div>
        
        {/* Input area - fixed at bottom with shadow */}
        <div 
          ref={composerRef}
          className="border-t p-3 fixed left-0 right-0 bg-white dark:bg-gray-900 z-10 shadow-[0_-2px_10px_rgba(0,0,0,0.1)]"
          style={{ 
            bottom: `${keyboardHeight}px`,
            transition: keyboardHeight > 0 ? 'none' : 'bottom 0.3s ease-out'
          }}>
          <div className="max-w-4xl mx-auto">
          {/* Nous avons supprimé l'interface de caméra personnalisée */}
          
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
                placeholder={selectedImage ? "Décris ce que tu cherches à comprendre..." : "Pose ta question"}
                className="w-full pr-[60px] rounded-full pl-4" // Espace pour le bouton d'envoi
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
            
            {/* Barre d'outils simplifiée sous le champ de saisie */}
            <div className="flex items-center justify-between space-x-2 pt-2">
              {/* Hidden file input pour les images */}
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
              
              {/* Boutons d'action simplifiés */}
              <div className="flex items-center space-x-3">
                {/* Bouton galerie */}
                <Button
                  size="icon"
                  variant="ghost"
                  disabled={isThinking || isUploadingImage}
                  onClick={handleOpenFileBrowser}
                  title="Choisir une image"
                  className="rounded-full h-10 w-10"
                >
                  <ImageIcon className="h-5 w-5" />
                </Button>
                
                {/* Bouton microphone */}
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
          
          <div className="mt-2 text-xs text-gray-500 text-center">
            Kora est un assistant IA. Pose une question sur tes devoirs ou études.
          </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatAssistant;
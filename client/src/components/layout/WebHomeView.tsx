import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Link } from 'wouter';
import { RecentQuestion } from '@/lib/types';
import { ArrowRight, Mic, Image, Search, PenLine, PlusCircle, User, Settings, X, Send, RefreshCcw, BookOpen, Lightbulb, HelpCircle } from 'lucide-react';
import BookIcon from '@/components/ui/BookIcon';
import HamburgerIcon from '@/components/ui/HamburgerIcon';
import { setupMobileViewportFix } from '@/lib/mobileViewportFix';
import ContentRenderer from '@/components/ui/ContentRenderer';
import VoiceRecorder from '@/components/VoiceRecorder';
import './WebHomeView.css';

// Configuration pour le texte simple (sans formatage mathématique)

// Interface pour les messages de la conversation
interface Message {
  id: string;
  content: string;
  sender: 'user' | 'kora';
  allowActions?: boolean;
  imageUrl?: string | null;
  isReExplanation?: boolean;
  isChallenge?: boolean;
  isHint?: boolean;
  challengeId?: string; // Pour associer un indice à un exercice spécifique
}

interface WebHomeViewProps {
  recentQuestions: RecentQuestion[];
}

const WebHomeView: React.FC<WebHomeViewProps> = ({ recentQuestions }) => {
  // États pour le formulaire et la recherche
  const [question, setQuestion] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  // États pour la conversation
  const [messages, setMessages] = useState<Message[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [conversationStarted, setConversationStarted] = useState(false);
  
  // États pour les fonctionnalités d'image et de voix
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [isImageUploadModalOpen, setIsImageUploadModalOpen] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  
  // État pour le menu hamburger - par défaut fermé
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  // Références
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Pour correspondre exactement à la maquette
  const recentTopics = [
    { id: '1', title: 'Soustraction posée' },
    { id: '2', title: 'Conjugaison au présent' }
  ];
  
  const olderTopics = [
    { id: '3', title: 'Les groupes nominaux' },
    { id: '4', title: 'Les adjectifs' }
  ];
  
  // État pour les sujets filtrés
  const [filteredRecentTopics, setFilteredRecentTopics] = useState(recentTopics);
  const [filteredOlderTopics, setFilteredOlderTopics] = useState(olderTopics);
  
  // Effet pour faire défiler automatiquement vers le dernier message
  useEffect(() => {
    if (messagesEndRef.current) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [messages]);

  // Fonction pour gérer la soumission du formulaire de question
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() && !uploadedImage) return; // Vérifier qu'il y a au moins une question ou une image
    
    // Démarrage de la conversation si ce n'est pas déjà fait
    if (!conversationStarted) {
      setConversationStarted(true);
    }
    
    // Si on a une image, on utilise la fonction d'envoi d'image
    if (uploadedImage && imagePreviewUrl) {
      await handleImageSubmit(question);
      // Réinitialiser les états liés à l'image immédiatement après l'envoi
      setUploadedImage(null);
      setImagePreviewUrl(null);
      return;
    }
    
    // Si on n'a pas d'image, on procède comme avant
    // Créer un message utilisateur
    const userMessage: Message = {
      id: Date.now().toString(),
      content: question,
      sender: 'user',
    };
    
    // Ajouter le message utilisateur à la conversation
    setMessages(prev => [...prev, userMessage]);
    
    // Réinitialiser le champ de question
    setQuestion('');
    
    // Indiquer que KORA réfléchit
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
          question: userMessage.content,
          messages: messageHistory
        }),
      });
      
      if (!response.ok) {
        throw new Error('Erreur lors de la requête API');
      }
      
      const data = await response.json();
      
      // Ajouter la réponse de KORA
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        content: data.content,
        sender: 'kora',
        allowActions: true, // Assurons-nous que cette propriété est correctement définie
        messageId: Date.now().toString(), // ID pour les fonctions d'action
      }]);
    } catch (error) {
      console.error('Erreur lors de la communication avec le serveur:', error);
      
      // Message d'erreur à l'utilisateur
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        content: "Désolé, j'ai rencontré un problème en essayant de répondre. Pourriez-vous reformuler votre question?",
        sender: 'kora',
        allowActions: true, // Assurons-nous que cette propriété est définie
      }]);
    } finally {
      // Arrêter l'animation de réflexion
      setIsThinking(false);
    }
  };

  // Filtrer les éléments en fonction de la recherche
  const filterItems = (query: string) => {
    if (!query.trim()) {
      // Si la recherche est vide, réinitialiser aux listes complètes
      setFilteredRecentTopics(recentTopics);
      setFilteredOlderTopics(olderTopics);
      return;
    }
    
    const queryLower = query.toLowerCase();
    
    // Filtrer les sujets récents
    const filteredRecent = recentTopics.filter(topic => 
      topic.title.toLowerCase().includes(queryLower)
    );
    
    // Filtrer les sujets plus anciens
    const filteredOlder = olderTopics.filter(topic => 
      topic.title.toLowerCase().includes(queryLower)
    );
    
    // Mettre à jour les états
    setFilteredRecentTopics(filteredRecent);
    setFilteredOlderTopics(filteredOlder);
    
    console.log('Résultats récents:', filteredRecent);
    console.log('Résultats anciens:', filteredOlder);
  };
  
  // Gestion de la recherche lors de la soumission du formulaire
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    filterItems(searchQuery);
  };
  
  // Mettre à jour la recherche à chaque frappe
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setSearchQuery(newQuery);
    filterItems(newQuery);
  };
  
  // Gestion du téléchargement d'image
  const handleImageClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  // Fonction appelée lorsqu'un fichier est sélectionné
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedImage(file);
      
      // Créer une URL pour l'aperçu de l'image
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviewUrl(reader.result as string);
        // Sur mobile, on affiche la modale. Sur desktop, on affiche directement l'image dans la zone de saisie
        if (window.innerWidth <= 768) {
          setIsImageUploadModalOpen(true);
        } else {
          // Sur desktop, on n'ouvre pas de modale
          // On pourrait ajouter un focus sur l'input, mais on le laisse naturel
        }
      };
      reader.readAsDataURL(file);
    }
  };
  
  // Envoyer l'image avec une question (utilisé depuis la modale)
  const handleImageSubmit = async (imageText: string = '') => {
    if (!uploadedImage || !imagePreviewUrl) return;
    
    // Démarrage de la conversation si ce n'est pas déjà fait
    if (!conversationStarted) {
      setConversationStarted(true);
    }
    
    // Fermer la modale et réinitialiser la question et l'image dans l'interface utilisateur
    setIsImageUploadModalOpen(false);
    setQuestion('');
    
    // On sauvegarde une copie de l'image avant de l'effacer, pour pouvoir l'envoyer
    const imageToSend = uploadedImage;
    const imageUrlToSend = imagePreviewUrl;
    
    // Effacer l'image immédiatement pour la zone de saisie
    setUploadedImage(null);
    setImagePreviewUrl(null);
    
    // Créer un message utilisateur avec l'image
    const userMessage: Message = {
      id: Date.now().toString(),
      content: imageText || 'Analyse cette image s\'il te plaît',
      sender: 'user',
      imageUrl: imageUrlToSend,
    };
    
    // Ajouter le message utilisateur à la conversation
    setMessages(prev => [...prev, userMessage]);
    
    // Indiquer que KORA réfléchit
    setIsThinking(true);
    
    try {
      // Préparer le formulaire pour l'envoi de l'image
      const formData = new FormData();
      formData.append('image', imageToSend);
      
      if (imageText) {
        formData.append('text_query', imageText);
      }
      
      // Appel API pour l'analyse d'image
      const response = await fetch('/api/image-analysis', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Erreur lors de la requête API');
      }
      
      const data = await response.json();
      
      // Ajouter la réponse de KORA
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        content: data.content,
        sender: 'kora',
        allowActions: true,
        isImageAnalysis: true,
        messageId: Date.now().toString(), // ID pour les fonctions d'action
      }]);
    } catch (error) {
      console.error('Erreur lors de l\'analyse de l\'image:', error);
      
      // Message d'erreur à l'utilisateur
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        content: "Désolé, j'ai rencontré un problème en essayant d'analyser cette image. Pourriez-vous réessayer ou reformuler votre question?",
        sender: 'kora',
      }]);
    } finally {
      // Arrêter l'animation de réflexion
      setIsThinking(false);
      // Pas besoin de réinitialiser setUploadedImage et setImagePreviewUrl ici
      // car ils ont déjà été réinitialisés au début de la fonction
    }
  };
  
  // Annuler le téléchargement d'image
  const handleCancelImageUpload = () => {
    setIsImageUploadModalOpen(false);
    setUploadedImage(null);
    setImagePreviewUrl(null);
  };
  
  // Gestion de l'enregistrement vocal
  const handleVoiceButtonClick = () => {
    setIsRecordingVoice(!isRecordingVoice);
  };
  
  // Fonction appelée lorsque la transcription audio est terminée
  const handleTranscriptionComplete = (text: string) => {
    if (text) {
      setQuestion(text);
      setIsRecordingVoice(false);
    }
  };
  
  // Demande une ré-explication
  const handleReExplain = async (messageId: string) => {
    if (!messageId) return;
    
    // Récupère le message original
    const originalMessage = messages.find(m => m.id === messageId);
    if (!originalMessage) return;
    
    // Cherche le message utilisateur précédent
    const userMessages = messages.filter(m => m.sender === 'user');
    const lastUserMessage = userMessages[userMessages.length - 1];
    
    if (!lastUserMessage) {
      console.error("Aucun message utilisateur trouvé pour la reformulation");
      return;
    }
    
    // Indiquer que KORA réfléchit
    setIsThinking(true);
    
    try {
      // Appel API pour la ré-explication avec paramètres corrects
      const response = await fetch('/api/tutoring/reexplain', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          originalQuestion: lastUserMessage.content,
          originalExplanation: originalMessage.content,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Erreur lors de la requête API');
      }
      
      const data = await response.json();
      
      // Ajouter la réponse de KORA
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        content: data.content,
        sender: 'kora',
        allowActions: true,
        isReExplanation: true,
      }]);
    } catch (error) {
      console.error('Erreur lors de la ré-explication:', error);
      
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        content: "Désolé, j'ai rencontré un problème en essayant de reformuler ma réponse.",
        sender: 'kora',
      }]);
    } finally {
      setIsThinking(false);
    }
  };
  
  // Demande un exercice de challenge
  const handleChallenge = async (messageId: string) => {
    if (!messageId) return;
    
    // Récupère le message original
    const originalMessage = messages.find(m => m.id === messageId);
    if (!originalMessage) return;
    
    // Cherche le message utilisateur précédent
    const userMessages = messages.filter(m => m.sender === 'user');
    const lastUserMessage = userMessages[userMessages.length - 1];
    
    if (!lastUserMessage) {
      console.error("Aucun message utilisateur trouvé pour l'exercice");
      return;
    }
    
    // Indiquer que KORA réfléchit
    setIsThinking(true);
    
    try {
      // Appel API pour générer un exercice avec paramètres corrects
      const response = await fetch('/api/tutoring/challenge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          originalQuestion: lastUserMessage.content,
          explanation: originalMessage.content,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Erreur lors de la requête API');
      }
      
      const data = await response.json();
      
      // Générer un ID unique pour l'exercice afin de pouvoir lier des indices
      const challengeId = `challenge-${Date.now()}`;
      
      // Ajouter la réponse de KORA
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        content: data.content,
        sender: 'kora',
        allowActions: false,
        isChallenge: true,
        challengeId: challengeId
      }]);
    } catch (error) {
      console.error('Erreur lors de la génération de l\'exercice:', error);
      
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        content: "Désolé, j'ai rencontré un problème en essayant de générer un exercice.",
        sender: 'kora',
      }]);
    } finally {
      setIsThinking(false);
    }
  };
  
  // Demande un indice pour un exercice
  const handleHint = async (challengeId: string) => {
    if (!challengeId) return;
    
    // Récupère l'exercice original
    const challengeMessage = messages.find(m => m.challengeId === challengeId);
    if (!challengeMessage) return;
    
    // Indiquer que KORA réfléchit
    setIsThinking(true);
    
    try {
      // Appel API pour générer un indice
      const response = await fetch('/api/tutoring/hint', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          exerciseContent: challengeMessage.content,
        }),
      });
      
      if (!response.ok) {
        // Si l'API n'est pas disponible, on génère un indice générique
        // Cela permet d'avoir la fonctionnalité sans avoir besoin d'implémenter l'API tout de suite
        const hintContent = "Voici un indice pour t'aider : essaie de repenser au concept que nous avons discuté précédemment et applique-le étape par étape à ce problème.";
        
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          content: hintContent,
          sender: 'kora',
          isHint: true,
          challengeId: challengeId
        }]);
        
        setIsThinking(false);
        return;
      }
      
      const data = await response.json();
      
      // Ajouter l'indice de KORA sans boutons d'action
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        content: data.content,
        sender: 'kora',
        isHint: true,
        allowActions: false, // Sans boutons d'action
        challengeId: challengeId
      }]);
    } catch (error) {
      console.error('Erreur lors de la génération de l\'indice:', error);
      
      // Même en cas d'erreur, fournir un indice générique sans boutons d'action
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        content: "Voici un indice : essaie de décomposer le problème en étapes plus simples et résoudre chaque partie séparément.",
        sender: 'kora',
        isHint: true,
        allowActions: false, // Sans boutons d'action
        challengeId: challengeId
      }]);
    } finally {
      setIsThinking(false);
    }
  };

  // Fonction pour démarrer une nouvelle conversation
  const startNewConversation = () => {
    // Réinitialiser les messages et l'état de la conversation
    setMessages([]);
    setConversationStarted(false);
    setIsThinking(false);
    setQuestion('');
    setUploadedImage(null);
    setImagePreviewUrl(null);
    setIsRecordingVoice(false);
    setIsImageUploadModalOpen(false);
  };

  // Fonction pour afficher les messages de la conversation
  const renderMessage = (message: Message) => {
    const isUserMessage = message.sender === 'user';
    
    return (
      <div key={message.id}>
        <div className={`web-message ${isUserMessage ? 'web-user-message' : 'web-kora-message'}`}>
          <div className="web-message-content-wrapper">
            {/* Image de l'utilisateur si présente - maintenant à l'intérieur de la bulle */}
            {message.imageUrl && (
              <div className="web-message-image-container">
                <img 
                  src={message.imageUrl} 
                  alt="Uploaded content" 
                  className="web-message-image"
                />
              </div>
            )}
            
            {/* Contenu du message avec formatage mathématique et code */}
            <div className="web-message-content">
              <ContentRenderer content={message.content} className="web-content" />
            </div>
          </div>
        </div>
        
        {/* Boutons d'action standards pour les messages de Kora - maintenant à l'extérieur du div message */}
        {!isUserMessage && message.allowActions && (
          <div className="web-message-actions">
            <button 
              type="button"
              className="web-action-button"
              onClick={() => {
                // Ajouter un message utilisateur pour la reformulation
                const userMessage: Message = {
                  id: Date.now().toString(),
                  content: "Peux-tu me reformuler ton explication ?",
                  sender: 'user',
                };
                setMessages(prev => [...prev, userMessage]);
                handleReExplain(message.id);
              }}
            >
              <RefreshCcw size={15} />
              <span>Reformuler</span>
            </button>
            <button 
              type="button"
              className="web-action-button"
              onClick={() => {
                // Ajouter un message utilisateur pour demander un exercice
                const userMessage: Message = {
                  id: Date.now().toString(),
                  content: "Peux-tu me proposer un exercice sur ce sujet ?",
                  sender: 'user',
                };
                setMessages(prev => [...prev, userMessage]);
                handleChallenge(message.id);
              }}
            >
              <Lightbulb size={15} />
              <span>Exercice</span>
            </button>
            {/* Le bouton Cours est affiché uniquement sur mobile */}
            {window.innerWidth <= 768 && (
              <button 
                type="button"
                className="web-action-button"
              >
                <BookOpen size={15} />
                <span>Cours</span>
              </button>
            )}
          </div>
        )}
        
        {/* Bouton d'indice pour les exercices - également à l'extérieur du div message */}
        {!isUserMessage && message.isChallenge && message.challengeId && (
          <div className="web-message-actions web-challenge-actions">
            <button 
              type="button"
              className="web-action-button"
              onClick={() => {
                // Ajouter un message utilisateur pour demander un indice
                const userMessage: Message = {
                  id: Date.now().toString(),
                  content: "Peux-tu me donner un indice pour résoudre cet exercice ?",
                  sender: 'user',
                };
                setMessages(prev => [...prev, userMessage]);
                handleHint(message.challengeId!);
              }}
            >
              <HelpCircle size={15} />
              <span>Indice</span>
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
      <div className="web-home-container">
        {/* Bouton hamburger flottant pour mobile */}
        <button 
          className="web-hamburger-button-mobile"
          aria-label="Ouvrir le menu"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          <HamburgerIcon size={20} className="web-hamburger-icon" />
        </button>
        
        <div className="web-layout">
          {/* Sidebar - menu latéral gauche */}
          <div className={`web-sidebar ${!isMenuOpen ? 'web-sidebar-closed' : ''}`}>
            {/* Logo KORA et hamburger icon */}
            <div className="web-logo-container">
              <div className="web-header-items">
                <button 
                  className="web-hamburger-button"
                  aria-label="Ouvrir le menu"
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                >
                  <HamburgerIcon size={20} className="web-hamburger-icon" />
                </button>
                <h1 className="web-kora-logo">KORA</h1>
              </div>
            </div>
            
            {/* Barre de recherche */}
            <div className="web-search-container">
              <form onSubmit={handleSearch} className="web-search-form">
                <Search className="web-search-icon" size={15} />
                <input 
                  type="text" 
                  placeholder="Rechercher" 
                  className="web-search-input"
                  value={searchQuery}
                  onChange={handleSearchChange}
                />
              </form>
              <button 
                className="web-new-chat-button" 
                aria-label="Nouvelle conversation"
                onClick={startNewConversation}
              >
                <PlusCircle size={16} strokeWidth={2} />
              </button>
            </div>

            {/* Section Nouvelle discussion */}
            <div className="web-sidebar-section">
              <button 
                onClick={startNewConversation} 
                className="web-sidebar-link nouvelle-discussion"
              >
                <PlusCircle className="web-icon-plus" size={18} strokeWidth={2} />
                <span>Nouvelle discussion</span>
              </button>
            </div>

            {/* Contenu de la sidebar nettoyé selon les instructions */}

            {/* Profil utilisateur supprimé */}
          </div>
          
          {/* Contenu principal - partie centrale */}
          <div className="web-main-content">
            {!conversationStarted ? (
              // Affichage du message de bienvenue lorsqu'aucune conversation n'est démarrée
              <div className="web-welcome-container">
                <h1 className="web-welcome-title">
                  Bienvenue
                </h1>
                <div className="web-welcome-subtitle">
                  <div className="web-welcome-question">Comment puis-je t'aider<br />aujourd'hui?</div>
                </div>
              </div>
            ) : (
              // Affichage de la conversation en cours
              <div className="web-conversation-container">
                <div className="web-messages-list">
                  {messages.map(renderMessage)}
                  {isThinking && (
                    <div className="web-message web-kora-message">
                      <div className="web-message-content web-thinking">
                        <span className="web-dot"></span>
                        <span className="web-dot"></span>
                        <span className="web-dot"></span>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </div>
            )}
            
            {/* Zone de question avec boutons - toujours visible */}
            <div className="web-question-container">
              <form onSubmit={handleSubmit} className="web-question-form">
                <div className="web-question-box">
                  {window.innerWidth > 768 && imagePreviewUrl && !isImageUploadModalOpen ? (
                    <div className="web-input-with-image">
                      <div className="web-input-image-preview">
                        <img 
                          src={imagePreviewUrl} 
                          alt="Aperçu de l'image" 
                          className="web-input-image"
                        />
                        <button 
                          type="button"
                          className="web-remove-image-button"
                          onClick={handleCancelImageUpload}
                        >
                          <X size={16} />
                        </button>
                      </div>
                      <div className="web-input-wrapper">
                        <div className="web-input-field">
                          <input 
                            type="text" 
                            placeholder="Ajoute un commentaire sur cette image (optionnel)"
                            value={question}
                            onChange={(e) => setQuestion(e.target.value)}
                            className="web-input"
                            disabled={isRecordingVoice}
                          />
                        </div>
                        
                        <div className="web-input-actions">
                          <button 
                            type="button"
                            className="web-image-button"
                            aria-label="Télécharger une image"
                            onClick={handleImageClick}
                          >
                            <Image size={20} strokeWidth={2} />
                          </button>
                          
                          {question.trim() ? (
                            <button 
                              type="submit"
                              className="web-send-button"
                              aria-label="Envoyer"
                            >
                              <Send size={20} strokeWidth={2} />
                            </button>
                          ) : isRecordingVoice ? (
                            <button 
                              type="button"
                              className="web-mic-button recording"
                              aria-label="Arrêter l'enregistrement"
                              onClick={handleVoiceButtonClick}
                            >
                              <X size={20} strokeWidth={2.5} />
                            </button>
                          ) : (
                            <button 
                              type="button"
                              className="web-mic-button"
                              aria-label="Enregistrer audio"
                              onClick={handleVoiceButtonClick}
                            >
                              <Mic size={20} strokeWidth={2.5} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="web-input-wrapper">
                      <div className="web-input-field">
                        <input 
                          type="text" 
                          placeholder="Pose ta question"
                          value={question}
                          onChange={(e) => setQuestion(e.target.value)}
                          className="web-input"
                          autoFocus
                          disabled={isRecordingVoice}
                        />
                      </div>
                      
                      <div className="web-input-actions">
                        <button 
                          type="button"
                          className="web-image-button"
                          aria-label="Télécharger une image"
                          onClick={handleImageClick}
                        >
                          <Image size={20} strokeWidth={2} />
                        </button>
                        
                        {question.trim() ? (
                          <button 
                            type="submit"
                            className="web-send-button"
                            aria-label="Envoyer"
                          >
                            <Send size={20} strokeWidth={2} />
                          </button>
                        ) : isRecordingVoice ? (
                          <button 
                            type="button"
                            className="web-mic-button recording"
                            aria-label="Arrêter l'enregistrement"
                            onClick={handleVoiceButtonClick}
                          >
                            <X size={20} strokeWidth={2.5} />
                          </button>
                        ) : (
                          <button 
                            type="button"
                            className="web-mic-button"
                            aria-label="Enregistrer audio"
                            onClick={handleVoiceButtonClick}
                          >
                            <Mic size={20} strokeWidth={2.5} />
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Input caché pour le téléchargement d'image */}
                  <input 
                    type="file"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    accept="image/*"
                    onChange={handleImageChange}
                  />
                </div>
              </form>
              
              {/* Affichage de l'enregistreur vocal quand activé */}
              {isRecordingVoice && (
                <div className="web-voice-recorder">
                  <VoiceRecorder 
                    onTranscriptionComplete={handleTranscriptionComplete}
                    maxRecordingTimeMs={30000}
                    language="fr"
                  />
                </div>
              )}
              
              {/* Message d'accueil placé directement dans le container de questions */}
              <p className="web-question-footer">
                <span className="kora-name">KORA</span>, ton assistant IA pour réviser et faire tes exercices.
              </p>
            </div>
            
            {/* Modal de téléchargement d'image */}
            {isImageUploadModalOpen && (
              <div className="web-modal-overlay">
                <div className="web-modal">
                  <div className="web-modal-header">
                    <h3>Télécharger une image</h3>
                    <button 
                      type="button" 
                      className="web-modal-close"
                      onClick={handleCancelImageUpload}
                    >
                      <X size={20} />
                    </button>
                  </div>
                  
                  <div className="web-modal-content">
                    {imagePreviewUrl && (
                      <div className="web-image-preview">
                        <img 
                          src={imagePreviewUrl} 
                          alt="Aperçu de l'image" 
                        />
                      </div>
                    )}
                    
                    <div className="web-modal-form">
                      <textarea
                        placeholder="Ajoute une question ou une description (optionnel)"
                        className="web-modal-textarea"
                        onChange={(e) => setQuestion(e.target.value)}
                        value={question}
                        rows={3}
                      />
                    </div>
                  </div>
                  
                  <div className="web-modal-footer">
                    <button 
                      type="button"
                      className="web-modal-button cancel"
                      onClick={handleCancelImageUpload}
                    >
                      Annuler
                    </button>
                    <button 
                      type="button"
                      className="web-modal-button submit"
                      onClick={() => handleImageSubmit(question)}
                    >
                      Envoyer
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
  );
};

export default WebHomeView;

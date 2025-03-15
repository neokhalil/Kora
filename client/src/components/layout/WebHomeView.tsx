import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Link } from 'wouter';
import { RecentQuestion } from '@/lib/types';
import { ArrowRight, Mic, Image, Search, PenLine, User, Settings, X, Send, RefreshCcw, BookOpen, Lightbulb, HelpCircle } from 'lucide-react';
import BookIcon from '@/components/ui/BookIcon';
import { setupMobileViewportFix } from '@/lib/mobileViewportFix';
import ContentRenderer from '@/components/ui/ContentRenderer';
import AudioRecorderPlayback from '@/components/AudioRecorderPlayback';
import './WebHomeView.css';

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
    if (!question.trim()) return;
    
    // Démarrage de la conversation si ce n'est pas déjà fait
    if (!conversationStarted) {
      setConversationStarted(true);
    }
    
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
      // Appel API vers le serveur
      const response = await fetch('/api/tutoring/ask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question: userMessage.content }),
      });
      
      if (!response.ok) {
        throw new Error('Erreur lors de la requête API');
      }
      
      const data = await response.json();
      
      // Ajouter la réponse à la conversation
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        content: data.content,
        sender: 'kora',
        allowActions: true,
      }]);
    } catch (error) {
      console.error('Erreur API:', error);
      
      // Message d'erreur simplifié
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        content: "Je suis désolé, j'ai rencontré un problème en essayant de répondre à ta question. Peux-tu réessayer?",
        sender: 'kora',
      }]);
    } finally {
      // Fin de la réflexion
      setIsThinking(false);
    }
  };
  
  // Fonction pour filtrer les sujets
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    
    // Filtrer les sujets récents
    const filteredRecent = recentTopics.filter(topic => 
      topic.title.toLowerCase().includes(value.toLowerCase())
    );
    
    // Filtrer les sujets plus anciens
    const filteredOlder = olderTopics.filter(topic => 
      topic.title.toLowerCase().includes(value.toLowerCase())
    );
    
    setFilteredRecentTopics(filteredRecent);
    setFilteredOlderTopics(filteredOlder);
  };
  
  // Fonction pour gérer le clic sur le bouton de téléchargement d'image
  const handleImageClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  // Fonction pour gérer le changement d'image
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploadedImage(file);
      
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target && event.target.result) {
          setImagePreviewUrl(event.target.result as string);
          setIsImageUploadModalOpen(true);
        }
      };
      reader.readAsDataURL(file);
    }
  };
  
  // Fonction pour annuler le téléchargement d'image
  const handleCancelImageUpload = () => {
    setIsImageUploadModalOpen(false);
    setUploadedImage(null);
    setImagePreviewUrl(null);
    setQuestion('');
  };
  
  // Fonction pour soumettre l'image avec une question
  const handleImageSubmit = async (questionText: string) => {
    if (!uploadedImage) return;
    
    // Démarrage de la conversation si ce n'est pas déjà fait
    if (!conversationStarted) {
      setConversationStarted(true);
    }
    
    // Créer le message utilisateur
    const userMessage: Message = {
      id: Date.now().toString(),
      content: questionText || "Analyse cette image s'il te plaît",
      sender: 'user',
      imageUrl: imagePreviewUrl,
    };
    
    // Ajouter le message utilisateur à la conversation
    setMessages(prev => [...prev, userMessage]);
    
    // Fermer la modal et réinitialiser les champs
    setIsImageUploadModalOpen(false);
    setQuestion('');
    
    // Indiquer que KORA réfléchit
    setIsThinking(true);
    
    try {
      // Créer le FormData pour l'upload d'image
      const formData = new FormData();
      formData.append('image', uploadedImage);
      
      // Ajouter la question si elle existe
      if (questionText.trim()) {
        formData.append('query', questionText);
      }
      
      // Appel API vers le serveur
      const response = await fetch('/api/image-analysis', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Erreur lors de l\'analyse de l\'image');
      }
      
      const data = await response.json();
      
      // Ajouter la réponse à la conversation
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        content: data.content,
        sender: 'kora',
        allowActions: true,
      }]);
    } catch (error) {
      console.error('Erreur lors de l\'analyse de l\'image:', error);
      
      // Message d'erreur
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        content: "Je suis désolé, j'ai rencontré un problème en essayant d'analyser cette image. Peux-tu réessayer avec une autre image?",
        sender: 'kora',
      }]);
    } finally {
      // Fin de la réflexion et nettoyage
      setIsThinking(false);
      setUploadedImage(null);
      setImagePreviewUrl(null);
    }
  };
  
  // Fonction pour gérer le clic sur le bouton d'enregistrement vocal
  const handleVoiceButtonClick = () => {
    setIsRecordingVoice(prev => !prev);
  };
  
  // Fonction pour gérer la fin de la transcription vocale
  const handleTranscriptionComplete = (text: string) => {
    if (!text.trim()) return;
    
    // Désactiver le mode d'enregistrement
    setIsRecordingVoice(false);
    
    // Démarrer la conversation si ce n'est pas déjà fait
    if (!conversationStarted) {
      setConversationStarted(true);
    }
    
    // Créer un message utilisateur avec la transcription
    const userMessage: Message = {
      id: Date.now().toString(),
      content: text,
      sender: 'user',
    };
    
    // Ajouter le message utilisateur à la conversation
    setMessages(prev => [...prev, userMessage]);
    
    // Indiquer que KORA réfléchit
    setIsThinking(true);
    
    // Appel API similaire à handleSubmit
    fetch('/api/tutoring/ask', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ question: text }),
    })
      .then(response => {
        if (!response.ok) {
          throw new Error('Erreur lors de la requête API');
        }
        return response.json();
      })
      .then(data => {
        // Ajouter la réponse à la conversation
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          content: data.content,
          sender: 'kora',
          allowActions: true,
        }]);
      })
      .catch(error => {
        console.error('Erreur API:', error);
        
        // Message d'erreur simplifié
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          content: "Je suis désolé, j'ai rencontré un problème en essayant de répondre à ta question. Peux-tu réessayer?",
          sender: 'kora',
        }]);
      })
      .finally(() => {
        // Fin de la réflexion
        setIsThinking(false);
      });
  };
  
  // Fonction pour rendre un message dans la conversation
  const renderMessage = (message: Message) => {
    const isKora = message.sender === 'kora';
    
    return (
      <div key={message.id} className={`web-message ${isKora ? 'kora-message' : 'user-message'}`}>
        <div className="web-message-content">
          {/* Image de l'utilisateur si présente */}
          {message.imageUrl && (
            <div className="web-message-image">
              <img src={message.imageUrl} alt="Image envoyée" />
            </div>
          )}
          
          {/* Contenu du message */}
          <div className="web-message-text">
            <ContentRenderer content={message.content} />
          </div>
          
          {/* Actions pour les messages de Kora */}
          {isKora && message.allowActions && (
            <div className="web-message-actions">
              <button 
                type="button"
                className="web-action-button"
                title="Reformuler l'explication"
              >
                <RefreshCcw size={16} />
                <span>Reformuler</span>
              </button>
              
              <button 
                type="button"
                className="web-action-button"
                title="Exercice pratique"
              >
                <BookOpen size={16} />
                <span>Exercice</span>
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };
  
  return (
    <div className="web-home-container">
      <div className="web-home-content">
        <div className="web-question-container">
          <div className="web-messages-container">
            {messages.length === 0 ? (
              <div className="web-welcome-screen">
                <div className="web-welcome-message">
                  <h1 className="web-welcome-title">
                    Bonjour, <br /> Ibrahima
                  </h1>
                  <p className="web-welcome-text">
                    Comment puis-je t'aider <br /> aujourd'hui ?
                  </p>
                </div>
                
                <div className="web-suggested-topics">
                  <h2 className="web-topics-title">
                    Questions récentes
                  </h2>
                  
                  <div className="web-topics-list">
                    {recentQuestions.map(q => (
                      <button 
                        key={q.id}
                        className="web-topic-item"
                        onClick={() => {
                          setQuestion(q.title);
                        }}
                      >
                        <span>{q.title}</span>
                        <ArrowRight size={16} />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* Messages de la conversation */}
                <div className="web-messages-list">
                  {messages.map(renderMessage)}
                  
                  {/* Indicateur "KORA écrit..." */}
                  {isThinking && (
                    <div className="web-thinking-indicator">
                      <div className="web-thinking-dots">
                        <span className="web-thinking-dot"></span>
                        <span className="web-thinking-dot"></span>
                        <span className="web-thinking-dot"></span>
                      </div>
                    </div>
                  )}
                  
                  {/* Référence pour le défilement automatique */}
                  <div ref={messagesEndRef} />
                </div>
              </>
            )}
          </div>
          
          <div className="web-input-container">
            {!isRecordingVoice ? (
              <form onSubmit={handleSubmit} className="web-question-form">
                <div className="web-question-box">
                  <div className="web-input-wrapper">
                    <input
                      type="text"
                      value={question}
                      onChange={(e) => setQuestion(e.target.value)}
                      placeholder="Pose ta question..."
                      className="web-question-input"
                    />
                    <div className="web-action-buttons">
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
                      
                      {/* Input caché pour le téléchargement d'image */}
                      <input 
                        type="file"
                        ref={fileInputRef}
                        style={{ display: 'none' }}
                        accept="image/*"
                        onChange={handleImageChange}
                      />
                    </div>
                  </div>
                </div>
              </form>
            ) : (
              /* Enregistreur audio quand il est actif */
              <div className="web-question-form">
                <div className="web-question-box">
                  <div className="web-input-wrapper audio-recorder-container">
                    <AudioRecorderPlayback 
                      onTranscriptionComplete={handleTranscriptionComplete}
                      maxRecordingTimeMs={30000}
                      language="fr"
                    />
                  </div>
                  <div className="web-action-buttons">
                    <button 
                      type="button"
                      className="web-mic-button recording"
                      aria-label="Arrêter l'enregistrement"
                      onClick={handleVoiceButtonClick}
                    >
                      <X size={20} strokeWidth={2.5} />
                    </button>
                  </div>
                </div>
              </div>
            )}
            
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
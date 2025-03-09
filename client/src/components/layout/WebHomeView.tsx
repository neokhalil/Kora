import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'wouter';
import { RecentQuestion } from '@/lib/types';
import { ArrowRight, Mic, Image, Search, PenLine, User, Settings } from 'lucide-react';
import BookIcon from '@/components/ui/BookIcon';
import { setupMobileViewportFix } from '@/lib/mobileViewportFix';
import './WebHomeView.css';

// Interface pour les messages de la conversation
interface Message {
  id: string;
  content: string;
  sender: 'user' | 'kora';
  allowActions?: boolean;
  imageUrl?: string | null;
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
  
  // Référence pour le défilement automatique des messages
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
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
        allowActions: true,
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
  
  // Fonction pour afficher les messages de la conversation
  const renderMessage = (message: Message) => {
    const isUserMessage = message.sender === 'user';
    
    return (
      <div 
        key={message.id}
        className={`web-message ${isUserMessage ? 'web-user-message' : 'web-kora-message'}`}
      >
        <div className="web-message-content">
          {message.content}
        </div>
      </div>
    );
  };

  return (
    <div className="web-home-container">
      <div className="web-layout">
        {/* Sidebar - menu latéral gauche */}
        <div className="web-sidebar">
          {/* Logo KORA */}
          <div className="web-logo-container">
            <h1 className="web-kora-logo">KORA</h1>
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
            <button className="web-new-chat-button" aria-label="Nouvelle conversation">
              <PenLine size={16} strokeWidth={2} />
            </button>
          </div>

          {/* Section Aide aux études */}
          <div className="web-sidebar-section">
            <a href="/chat-assistant" className="web-sidebar-link aide-etudes">
              <BookIcon className="web-icon-book" />
              <span>Aide aux études</span>
            </a>
          </div>

          {/* Séparateur */}
          <div className="web-sidebar-divider"></div>

          {/* Section Hier */}
          <div className="web-sidebar-section">
            <h2>Hier</h2>
            {filteredRecentTopics.length === 0 ? (
              <p className="text-gray-500 text-sm pl-3 pr-3 py-2">Aucun résultat trouvé</p>
            ) : (
              <ul>
                {filteredRecentTopics.map(topic => (
                  <li key={topic.id}>
                    <Link href={`/topics/${topic.id}`}>
                      {topic.title}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
          
          {/* Section Il y a 7 jours */}
          <div className="web-sidebar-section">
            <h2>Il y a 7 jours</h2>
            {filteredOlderTopics.length === 0 ? (
              <p className="text-gray-500 text-sm pl-3 pr-3 py-2">Aucun résultat trouvé</p>
            ) : (
              <ul>
                {filteredOlderTopics.map(topic => (
                  <li key={topic.id}>
                    <Link href={`/topics/${topic.id}`}>
                      {topic.title}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Profil utilisateur en bas */}
          <div className="web-profile-container">
            <div className="web-profile-wrapper">
              <Link href="/profile" className="web-profile-link">
                <User size={16} strokeWidth={2} />
                <span>Mon profil</span>
              </Link>
              <Link href="/settings" className="web-settings-link">
                <Settings size={16} strokeWidth={2} />
              </Link>
            </div>
          </div>
        </div>
        
        {/* Contenu principal - partie centrale */}
        <div className="web-main-content">
          {!conversationStarted ? (
            // Affichage du message de bienvenue lorsqu'aucune conversation n'est démarrée
            <div className="web-welcome-container">
              <h1 className="web-welcome-title">Hello Ibrahima</h1>
              <div className="web-welcome-subtitle">
                <div>Comment puis t'aider</div>
                <div>aujourd'hui?</div>
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
                <div className="web-input-wrapper">
                  <input 
                    type="text" 
                    placeholder="Pose ta question"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    autoFocus
                  />
                </div>
                <div className="web-action-buttons">
                  <button 
                    type="button"
                    className="web-image-button"
                    aria-label="Télécharger une image"
                  >
                    <Image size={24} strokeWidth={2} />
                  </button>
                  <button 
                    type="button"
                    className="web-mic-button"
                    aria-label="Enregistrer audio"
                  >
                    <Mic size={24} strokeWidth={2.5} />
                  </button>
                </div>
              </div>
            </form>
            {!conversationStarted && (
              <p className="web-question-footer">
                <span className="kora-name">KORA</span>, ton assistant IA pour réviser et faire tes exercices.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WebHomeView;
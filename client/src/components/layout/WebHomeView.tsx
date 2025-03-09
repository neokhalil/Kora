import React, { useState } from 'react';
import { Link } from 'wouter';
import { RecentQuestion } from '@/lib/types';
import { ArrowRight, Mic, Image, Search, PenLine, User, FileText, Settings } from 'lucide-react';

interface WebHomeViewProps {
  recentQuestions: RecentQuestion[];
}

const WebHomeView: React.FC<WebHomeViewProps> = ({ recentQuestions }) => {
  const [question, setQuestion] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Pour correspondre exactement à la maquette
  const recentTopics = [
    { id: '1', title: 'Soustraction posée' },
    { id: '2', title: 'Conjugaison au présent' }
  ];
  
  const olderTopics = [
    { id: '3', title: 'Les groupes nominaux' },
    { id: '4', title: 'Les adjectifs' }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (question.trim()) {
      console.log('Question posée:', question);
      // Ici, nous pourrions appeler une API ou rediriger vers la page du chat
      setQuestion('');
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      console.log('Recherche:', searchQuery);
      // Implémentation de la recherche
    }
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
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </form>
            <button className="web-new-chat-button" aria-label="Nouvelle conversation">
              <PenLine size={16} strokeWidth={2} />
            </button>
          </div>

          {/* Section Aides aux études */}
          <div className="web-sidebar-section">
            <a href="/chat-assistant" className="web-sidebar-link aide-etudes">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="web-icon-book">
                <rect x="4" y="2" width="16" height="20" rx="2" stroke="currentColor" strokeWidth="2" />
                <line x1="9" y1="6" x2="15" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <line x1="9" y1="10" x2="15" y2="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <line x1="9" y1="14" x2="15" y2="14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <line x1="9" y1="18" x2="13" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <span>Aides aux études</span>
            </a>
          </div>

          {/* Séparateur */}
          <div className="web-sidebar-divider"></div>

          {/* Section Hier */}
          <div className="web-sidebar-section">
            <h2>Hier</h2>
            <ul>
              {recentTopics.map(topic => (
                <li key={topic.id}>
                  <Link href={`/topics/${topic.id}`}>
                    {topic.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          
          {/* Section Il y a 7 jours */}
          <div className="web-sidebar-section">
            <h2>Il y a 7 jours</h2>
            <ul>
              {olderTopics.map(topic => (
                <li key={topic.id}>
                  <Link href={`/topics/${topic.id}`}>
                    {topic.title}
                  </Link>
                </li>
              ))}
            </ul>
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
        
        {/* Contenu principal - partie centrale avec message de bienvenue */}
        <div className="web-main-content">
          <div className="web-welcome-container">
            <h1 className="web-welcome-title">Hello Ibrahima</h1>
            <div className="web-welcome-subtitle">
              <div>Comment puis t'aider</div>
              <div>aujourd'hui?</div>
            </div>
          </div>
          
          {/* Zone de question avec boutons */}
          <div className="web-question-container">
            <form onSubmit={handleSubmit} className="web-question-form">
              <div className="web-question-box">
                <div className="web-input-wrapper">
                  <input 
                    type="text" 
                    placeholder="Pose ta question"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
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
            <p className="web-question-footer">
              <span className="kora-name">KORA</span>, ton assistant IA pour réviser et faire tes exercices.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WebHomeView;
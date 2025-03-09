import React, { useState } from 'react';
import { Link } from 'wouter';
import { RecentQuestion } from '@/lib/types';
import { ArrowRight, Mic, Image, Search, Plus, User, FileText } from 'lucide-react';

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
              <Plus size={16} strokeWidth={2.5} />
            </button>
          </div>

          {/* Section Aides aux études */}
          <div className="web-sidebar-section">
            <Link href="/aide-etudes" className="web-sidebar-link aide-etudes">
              <FileText size={16} strokeWidth={2} />
              <span>Aides aux études</span>
            </Link>
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
            <Link href="/profile" className="web-profile-link">
              <User size={16} strokeWidth={2} />
              <span>Mon profil</span>
            </Link>
          </div>
        </div>
        
        {/* Contenu principal - partie centrale avec message de bienvenue */}
        <div className="web-main-content">
          <div className="web-welcome-container">
            <h1 className="web-welcome-title">Hello Ibrahima</h1>
            <p className="web-welcome-subtitle">Comment puis t'aider aujourd'hui?</p>
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
              KORA, ton assistant IA pour réviser et faire tes exercices.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WebHomeView;
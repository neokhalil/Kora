import React, { useState, useEffect } from 'react';
import { Search, X, Plus, BookOpen, MessageSquare } from 'lucide-react';
import { Link, useLocation } from 'wouter';

// Type pour les conversations récentes
interface RecentConversation {
  id: string;
  title: string;
  date: Date;
}

// Props du composant SideMenu
interface SideMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

const SideMenu: React.FC<SideMenuProps> = ({ isOpen, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  
  // Exemple de conversations récentes (dans un cas réel, vous les récupéreriez d'une API)
  const [recentConversations, setRecentConversations] = useState<RecentConversation[]>([
    { id: '1', title: 'Aide aux devoirs de mathématiques', date: new Date(2025, 2, 8) },
    { id: '2', title: 'Questions de physique', date: new Date(2025, 2, 7) },
    { id: '3', title: 'Exercice de français', date: new Date(2025, 2, 6) },
    { id: '4', title: 'Préparation exposé histoire', date: new Date(2025, 2, 5) },
    { id: '5', title: 'Révisions pour examen final', date: new Date(2025, 2, 4) }
  ]);
  
  // Ajuster le corps pour éviter le scroll quand le menu est ouvert
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);
  
  // Formater la date pour l'affichage
  const formatDate = (date: Date): string => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return "Aujourd'hui";
    }
    
    if (date.toDateString() === yesterday.toDateString()) {
      return "Hier";
    }
    
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  return (
    <>
      {/* Overlay pour fermer le menu en cliquant à l'extérieur */}
      <div 
        className={`fixed inset-0 bg-black transition-opacity duration-300 z-[1000] ${
          isOpen ? 'opacity-50' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />
      
      {/* Menu latéral */}
      <div
        className={`fixed top-0 left-0 h-full w-full bg-white z-[1001] transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <div className="flex flex-col h-full">
          {/* En-tête du menu avec champ de recherche */}
          <div className="p-4 border-b relative">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Rechercher"
                className="block w-full pl-10 pr-12 py-2 border border-gray-300 rounded-lg bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && searchQuery.trim()) {
                    console.log('Recherche pour:', searchQuery);
                    onClose();
                    window.location.href = `/search?q=${encodeURIComponent(searchQuery)}`;
                  }
                }}
              />
              
              {/* Bouton de réinitialisation de la recherche (apparaît uniquement quand il y a du texte) */}
              {searchQuery && (
                <button 
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  onClick={() => setSearchQuery('')}
                  aria-label="Effacer la recherche"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            
            {/* Bouton pour fermer le menu (visible seulement sur mobile) */}
            <button
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-300"
              onClick={onClose}
              aria-label="Fermer le menu"
            >
              <X className="h-6 w-6 text-gray-600" />
            </button>
          </div>
          
          {/* Contenu du menu */}
          <div className="flex-1 overflow-y-auto p-4">
            {/* Bouton pour nouvelle conversation */}
            <button
              className="flex items-center justify-center w-full mb-6 p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              onClick={() => {
                onClose();
                window.location.href = '/chat';
              }}
            >
              <Plus className="h-5 w-5 mr-2" />
              <span>Nouvelle conversation</span>
            </button>
            
            {/* Section d'aide aux études */}
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-3">Aide aux Études</h2>
              <button
                className="flex items-center w-full p-3 rounded-lg hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-300 side-menu-item"
                onClick={() => {
                  onClose();
                  window.location.href = '/chat-assistant';
                }}
              >
                <BookOpen className="h-5 w-5 mr-3 text-blue-600" />
                <span>Assistant Chat IA</span>
              </button>
            </div>
            
            {/* Liste des conversations récentes */}
            <div>
              <h2 className="text-lg font-semibold mb-3">Conversations récentes</h2>
              <div className="space-y-1">
                {recentConversations.map((convo) => (
                  <button
                    key={convo.id}
                    className="flex items-start p-3 rounded-lg hover:bg-gray-100 transition-colors w-full text-left focus:outline-none focus:ring-2 focus:ring-blue-300 side-menu-item"
                    onClick={() => {
                      onClose();
                      window.location.href = `/chat/${convo.id}`;
                    }}
                  >
                    <MessageSquare className="h-5 w-5 mr-3 text-gray-500 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium line-clamp-1">{convo.title}</p>
                      <p className="text-xs text-gray-500">{formatDate(convo.date)}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          {/* Pied de menu avec informations utilisateur et options */}
          <div className="border-t p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold mr-3">
                  I
                </div>
                <span className="font-medium">Ibrahima Ndiaye</span>
              </div>
              <button 
                className="text-gray-500 hover:text-gray-700 focus:outline-none p-1 rounded-full hover:bg-gray-100 focus:ring-2 focus:ring-blue-300"
                aria-label="Paramètres du compte"
                onClick={() => {
                  onClose();
                  // Rediriger vers les paramètres ou afficher un menu d'options
                  window.location.href = '/settings';
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default SideMenu;
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
      >
        <div className="flex flex-col h-full">
          {/* En-tête du menu avec champ de recherche */}
          <div className="p-4 border-b">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Rechercher"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
            </div>
          </div>
          
          {/* Bouton pour fermer le menu (visible seulement sur mobile) */}
          <button
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100"
            onClick={onClose}
            aria-label="Fermer le menu"
          >
            <X className="h-6 w-6 text-gray-600" />
          </button>
          
          {/* Contenu du menu */}
          <div className="flex-1 overflow-y-auto p-4">
            {/* Bouton pour nouvelle conversation */}
            <button
              className="flex items-center justify-center w-full mb-6 p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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
                className="flex items-center w-full p-3 rounded-lg hover:bg-gray-100 transition-colors"
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
                    className="flex items-start p-3 rounded-lg hover:bg-gray-100 transition-colors w-full text-left"
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
          
          {/* Pied de menu avec informations utilisateur */}
          <div className="border-t p-4">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold mr-3">
                I
              </div>
              <span className="font-medium">Ibrahima Ndiaye</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default SideMenu;
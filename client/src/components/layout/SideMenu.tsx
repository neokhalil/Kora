import React, { useState, useEffect, useRef } from 'react';
import { Search, Book } from 'lucide-react';
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
  const [location, setLocation] = useLocation();
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  // Exemple de conversations récentes (dans un cas réel, vous les récupéreriez d'une API)
  const [recentConversations, setRecentConversations] = useState<RecentConversation[]>([
    { id: '1', title: 'Texte aléatoire et aide', date: new Date(2025, 2, 8) },
    { id: '2', title: 'English-speaking Sub-Saharan Africa', date: new Date(2025, 2, 7) },
    { id: '3', title: 'Équation différentielle expliquée', date: new Date(2025, 2, 6) },
    { id: '4', title: 'Verbe dans la phrase', date: new Date(2025, 2, 5) },
    { id: '5', title: 'ICT Growth in Kenya 2024', date: new Date(2025, 2, 4) }
  ]);
  
  // Ajuster le corps pour éviter le scroll quand le menu est ouvert
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      // Mettre le focus sur le champ de recherche quand le menu s'ouvre
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 300);
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);
  
  // Gestion de la touche Escape pour fermer le menu
  useEffect(() => {
    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    
    window.addEventListener('keydown', handleEscapeKey);
    return () => {
      window.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isOpen, onClose]);

  return (
    <>
      {/* Overlay pour fermer le menu en cliquant à l'extérieur */}
      <div 
        className={`fixed inset-0 bg-black transition-opacity duration-300 z-[1000] ${
          isOpen ? 'opacity-50' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />
      
      {/* Menu latéral simplifié selon la capture d'écran */}
      <div
        className={`fixed top-0 left-0 h-full w-full bg-white z-[1001] transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ 
          paddingTop: 'env(safe-area-inset-top, 0px)', 
          paddingBottom: 'env(safe-area-inset-bottom, 0px)' 
        }}
      >
        <div className="flex flex-col h-full">
          {/* En-tête du menu */}
          <div className="px-4 py-5 flex items-center">
            <h1 className="text-2xl font-bold ml-2">KORA</h1>
          </div>
          
          {/* Champ de recherche */}
          <div className="px-4 py-3">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Rechercher"
                className="block w-full pl-10 pr-4 py-3 rounded-full bg-gray-100 focus:outline-none"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && searchQuery.trim()) {
                    onClose();
                    setLocation(`/search?q=${encodeURIComponent(searchQuery)}`);
                  }
                }}
                aria-label="Rechercher"
              />
            </div>
          </div>
          
          {/* Section Aide aux devoirs */}
          <div className="mt-2 px-4">
            <Link
              href="/chat-assistant"
              onClick={() => onClose()}
              className="flex items-center py-3 hover:bg-gray-100 transition-colors"
              role="button"
            >
              <Book className="h-5 w-5 mr-3" />
              <span className="font-medium">Aide aux devoirs</span>
            </Link>
          </div>
          
          {/* Section Conversations récentes */}
          <div className="mt-6 px-4">
            <div className="uppercase text-sm font-semibold text-gray-600 mb-3">
              CONVERSATIONS RÉCENTES
            </div>
            {recentConversations.map((convo) => (
              <Link
                key={convo.id}
                href={`/chat/${convo.id}`}
                onClick={() => onClose()}
                className="block py-3 hover:bg-gray-100 transition-colors"
                role="button"
              >
                <span className="text-sm">{convo.title}</span>
              </Link>
            ))}
          </div>
          
          {/* Pied de menu avec informations utilisateur */}
          <div className="mt-auto border-t p-4">
            <div className="flex items-center">
              <div className="w-6 h-6 text-center font-medium mr-3">
                I
              </div>
              <span className="font-medium">Ibrahima Ndiaye</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-auto" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default SideMenu;
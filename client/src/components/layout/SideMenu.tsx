import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Plus, Edit, Settings, ChevronDown } from 'lucide-react';
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
    { id: '1', title: 'Titre menu aide devoirs', date: new Date(2025, 2, 8) },
    { id: '2', title: 'Texte aléatoire et aide', date: new Date(2025, 2, 7) },
    { id: '3', title: 'English-speaking Sub-Saharan Africa', date: new Date(2025, 2, 6) },
    { id: '4', title: 'Équation différentielle expliquée', date: new Date(2025, 2, 5) },
    { id: '5', title: 'Verbe dans la phrase', date: new Date(2025, 2, 4) },
    { id: '6', title: 'ICT Growth in Kenya 2024', date: new Date(2025, 2, 3) },
    { id: '7', title: 'Test reçu aide', date: new Date(2025, 2, 2) },
    { id: '8', title: 'Titres de menu créatifs', date: new Date(2025, 2, 1) },
    { id: '9', title: 'Message incomplet ou erreur', date: new Date(2025, 1, 29) },
    { id: '10', title: 'Résumé de conversation', date: new Date(2025, 1, 28) },
    { id: '11', title: 'Test Response Acknowledgement', date: new Date(2025, 1, 27) }
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
        className={`fixed inset-0 bg-black/30 transition-opacity duration-300 z-[1000] ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />
      
      {/* Menu latéral, style ChatGPT */}
      <div
        className={`fixed top-0 left-0 h-full w-[330px] max-w-full bg-gray-100 z-[1001] transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ 
          paddingTop: 'env(safe-area-inset-top, 0px)',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)'
        }}
      >
        <div className="flex flex-col h-full">
          {/* En-tête du menu avec champ de recherche */}
          <div className="p-2 relative">
            <div className="relative">
              <div className="flex items-center border border-gray-300 rounded-full bg-gray-200 px-3 py-2">
                <Search className="h-5 w-5 text-gray-500 mr-2" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search"
                  className="bg-transparent w-full focus:outline-none text-gray-700"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && searchQuery.trim()) {
                      console.log('Recherche pour:', searchQuery);
                      onClose();
                      setLocation(`/search?q=${encodeURIComponent(searchQuery)}`);
                    }
                  }}
                  aria-label="Rechercher des conversations ou des sujets"
                />
                {searchQuery && (
                  <button 
                    className="text-gray-400 hover:text-gray-600"
                    onClick={() => setSearchQuery('')}
                    aria-label="Effacer la recherche"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              
              {/* Bouton pour créer une nouvelle conversation (comme dans ChatGPT) */}
              <Link
                href="/chat"
                onClick={() => onClose()}
                className="absolute right-3 top-2 w-8 h-8 flex items-center justify-center text-gray-700 hover:text-gray-900"
              >
                <Edit className="h-5 w-5" />
              </Link>
            </div>
          </div>
          
          {/* Section "Chats" */}
          <div className="px-2 py-3">
            <div className="text-sm font-medium text-gray-700 mb-1 px-3">Chats</div>
          </div>
          
          {/* Liste des conversations récentes - style ChatGPT */}
          <div className="flex-1 overflow-y-auto">
            <div className="px-2">
              {recentConversations.map((convo) => (
                <Link
                  key={convo.id}
                  href={`/chat/${convo.id}`}
                  onClick={() => onClose()}
                  className="flex items-center px-3 py-3 rounded-lg hover:bg-gray-200 transition-colors w-full text-left focus:outline-none text-gray-700"
                  role="button"
                >
                  <span className="text-sm truncate">{convo.title}</span>
                </Link>
              ))}
            </div>
          </div>
          
          {/* Pied de menu avec informations utilisateur et options */}
          <div className="mt-auto px-2 py-2 border-t border-gray-300">
            <div className="flex items-center justify-between px-2 py-2 rounded-lg hover:bg-gray-200">
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-amber-300 flex items-center justify-center text-amber-800 font-medium mr-2">
                  <img 
                    src="https://ui-avatars.com/api/?name=Ibrahima+Ndiaye&background=f59e0b&color=78350f" 
                    alt="Avatar" 
                    className="w-full h-full rounded-full" 
                  />
                </div>
                <span className="font-medium text-sm">Ibrahima Ndiaye</span>
              </div>
              <button 
                className="text-gray-600 p-1 rounded-full hover:bg-gray-300 flex items-center justify-center"
                aria-label="Options"
              >
                <ChevronDown className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default SideMenu;
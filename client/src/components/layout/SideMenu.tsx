import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Search, Book } from 'lucide-react';
import { Link, useLocation } from 'wouter';

// Type pour les conversations récentes
interface RecentConversation {
  id: string;
  title: string;
  date: Date;
}

// Type pour les éléments du menu
interface MenuItem {
  id: string;
  title: string;
  icon?: React.ReactNode;
  href: string;
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
  const [readOnly, setReadOnly] = useState(true);
  
  // Éléments fixes du menu (aide aux études)
  const menuItems: MenuItem[] = [
    { 
      id: 'studies-help', 
      title: 'Aides aux études', 
      icon: <Book className="h-5 w-5 mr-3" />, 
      href: '/chat-assistant' 
    }
  ];
  
  // État pour les conversations récentes (à remplir via API)
  const [recentConversations, setRecentConversations] = useState<RecentConversation[]>([]);
  
  // Conversations récentes basées sur l'image
  useEffect(() => {
    const loadRecentConversations = async () => {
      try {
        // Groupes de conversations par date
        const hierConversations = [
          { id: '1', title: 'Soustraction posée', date: new Date() },
          { id: '2', title: 'Conjugaison au présent', date: new Date() }
        ];
        
        const semaineDerniereConversations = [
          { id: '3', title: 'Les groupes nominaux', date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
          { id: '4', title: 'Les adjectifs', date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        ];
        
        setRecentConversations([...hierConversations, ...semaineDerniereConversations]);
      } catch (error) {
        console.error("Erreur lors du chargement des conversations récentes:", error);
      }
    };
    
    loadRecentConversations();
  }, []);
  
  // Filtrer les éléments du menu en fonction de la recherche
  const filteredMenuItems = useMemo(() => {
    if (!searchQuery.trim()) return menuItems;
    
    const query = searchQuery.toLowerCase();
    return menuItems.filter(item => 
      item.title.toLowerCase().includes(query)
    );
  }, [menuItems, searchQuery]);
  
  // Filtrer les conversations récentes en fonction de la recherche
  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return recentConversations;
    
    const query = searchQuery.toLowerCase();
    return recentConversations.filter(convo => 
      convo.title.toLowerCase().includes(query)
    );
  }, [recentConversations, searchQuery]);
  
  // Ajuster le corps pour éviter le scroll quand le menu est ouvert
  // et gérer l'état readOnly du champ de recherche pour éviter que le clavier
  // ne s'ouvre automatiquement quand le menu est ouvert
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      // Activer readOnly pour empêcher le clavier de s'ouvrir automatiquement
      setReadOnly(true);
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
      
      {/* Menu latéral simplifié avec classe kora-side-menu pour ciblage CSS */}
      <div
        className={`fixed top-0 left-0 h-full w-full bg-white z-[1001] transform transition-transform duration-300 ease-in-out kora-side-menu ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ 
          paddingTop: 'calc(56px + env(safe-area-inset-top, 0px))', 
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          top: 0
        }}
      >
        <div className="flex flex-col h-full">
          {/* En-tête du menu - supprimé pour éviter la redondance */}
          <div className="px-4 pt-2 pb-1 flex items-center">
            {/* Logo supprimé pour éviter d'avoir "KORA" deux fois */}
          </div>
          
          {/* Champ de recherche basé sur l'image */}
          <div className="px-4 py-2">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Rechercher"
                className="block w-full pl-8 pr-3 py-2 rounded-lg bg-gray-100 text-sm border-0 focus:outline-none focus:ring-0"
                value={searchQuery}
                readOnly={readOnly}
                onClick={() => setReadOnly(false)}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && searchQuery.trim()) {
                    onClose();
                    setLocation(`/search?q=${encodeURIComponent(searchQuery)}`);
                  }
                }}
                aria-label="Rechercher"
              />
              
              {/* Bouton pour créer une nouvelle discussion */}
              <Link 
                href="/new-chat"
                className="absolute inset-y-0 right-2 flex items-center text-gray-600 hover:text-gray-900"
                onClick={() => onClose()}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
              </Link>
            </div>
          </div>
          
          {/* Section Aide aux devoirs - filtrée par recherche */}
          <div className="mt-2 px-4">
            {filteredMenuItems.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                onClick={() => onClose()}
                className="flex items-center py-3 hover:bg-gray-100 transition-colors"
                role="button"
              >
                {item.icon}
                <span className="font-medium">{item.title}</span>
              </Link>
            ))}
            
            {/* Message si aucun élément ne correspond à la recherche */}
            {searchQuery && filteredMenuItems.length === 0 && (
              <div className="py-3 text-gray-500 text-sm">
                Aucun élément ne correspond à votre recherche
              </div>
            )}
          </div>
          
          {/* Section Conversations récentes - filtrée par recherche */}
          <div className="mt-6 px-4">
            {/* N'afficher l'en-tête que s'il y a des résultats ou pas de recherche */}
            {(filteredConversations.length > 0 || !searchQuery) && (
              <div className="uppercase text-sm font-semibold text-gray-600 mb-3">
                CONVERSATIONS RÉCENTES
              </div>
            )}
            
            {filteredConversations.map((convo) => (
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
            
            {/* Message si aucune conversation ne correspond à la recherche */}
            {searchQuery && filteredConversations.length === 0 && (
              <div className="py-3 text-gray-500 text-sm">
                Aucune conversation ne correspond à votre recherche
              </div>
            )}
          </div>
          
          {/* Pied de menu avec le profil exactement comme dans l'image */}
          <div className="mt-auto p-4 border-t border-gray-200">
            <Link href="/profile" className="flex items-center">
              <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-center mr-2">
                <span className="text-gray-600 text-xs">M</span>
              </div>
              <span className="text-sm">Mon profil</span>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default SideMenu;
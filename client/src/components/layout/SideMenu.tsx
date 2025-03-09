import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Search } from 'lucide-react';
import { Link, useLocation } from 'wouter';
import BookIcon from '@/components/ui/BookIcon';

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
      title: 'Aide aux études', 
      icon: <BookIcon className="h-5 w-5 mr-2" />, 
      href: '/chat-assistant' 
    }
  ];
  
  // État pour les conversations récentes (à remplir via API)
  const [recentConversations, setRecentConversations] = useState<RecentConversation[]>([]);
  
  // Effet pour charger les conversations récentes (simulé pour le moment)
  useEffect(() => {
    // Dans un cas réel, vous utiliseriez une requête API avec react-query
    // Cette structure permet l'intégration future avec l'API
    const loadRecentConversations = async () => {
      try {
        // Conversations récentes à charger via API plus tard
        // Pour le moment, utilisons un tableau vide pour avoir une UI propre
        setRecentConversations([]);
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
          
          {/* Champ de recherche amélioré */}
          <div className="px-4 py-3">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Rechercher"
                className="block w-full pl-10 pr-10 py-3 rounded-full bg-gray-100 focus:outline-none"
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
              
              {/* Bouton pour effacer la recherche si du texte est présent */}
              {searchQuery && (
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-700"
                  onClick={() => setSearchQuery('')}
                  aria-label="Effacer la recherche"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </button>
              )}
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
          
          {/* Pied de menu avec bouton de retour ou lien vers les paramètres */}
          <div className="mt-auto p-4">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-center font-medium mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="font-medium">Mon profil</span>
              <button 
                className="ml-auto p-2 rounded-full hover:bg-gray-100"
                onClick={() => {
                  // Future action pour les paramètres ou la déconnexion
                  onClose();
                }}
                aria-label="Options utilisateur"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
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
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { X } from 'lucide-react';
import SideMenu from './SideMenu';
import { useIsMobile } from '@/hooks/use-mobile';
import HamburgerIcon from '../ui/HamburgerIcon';

const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const isMobile = useIsMobile(); // Vérification si on est sur mobile
  
  // Effet pour ajouter/supprimer la classe menu-open au body
  useEffect(() => {
    if (isMenuOpen) {
      document.body.classList.add('menu-open');
      
      // Quand le menu s'ouvre, on masque le focus de tous les éléments actifs
      // pour éviter que le clavier ne s'ouvre automatiquement
      const activeElement = document.activeElement as HTMLElement;
      if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
        activeElement.blur();
      }
    } else {
      document.body.classList.remove('menu-open');
    }
    
    // Nettoyage
    return () => {
      document.body.classList.remove('menu-open');
    };
  }, [isMenuOpen]);
  
  // Fermer le menu avec la touche Escape
  useEffect(() => {
    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMenuOpen) {
        setIsMenuOpen(false);
      }
    };
    
    window.addEventListener('keydown', handleEscapeKey);
    return () => window.removeEventListener('keydown', handleEscapeKey);
  }, [isMenuOpen]);
  
  // Mémoriser la fonction de toggle du menu pour éviter de la recréer
  const toggleMenu = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    // Important: empêcher la propagation et le comportement par défaut
    e.preventDefault();
    e.stopPropagation();
    
    // Changer l'état du menu directement
    const newState = !isMenuOpen;
    setIsMenuOpen(newState);
    
    // Déclencher un événement personnalisé pour informer d'autres parties de l'application
    if (typeof window !== 'undefined') {
      try {
        document.dispatchEvent(new CustomEvent('kora-menu-toggle', { 
          detail: { isOpen: newState } 
        }));
      } catch (err) {
        console.error("Error dispatching custom event:", err);
      }
    }
  }, [isMenuOpen]);
  
  // Si on n'est pas sur mobile, ne pas afficher le header
  if (!isMobile) {
    return null;
  }
  
  return (
    <>
      {/* Header container - uniquement affiché en version mobile */}
      <div id="kora-header-container">
        {/* Header content */}
        <div id="kora-header">
          {/* Menu button avec indicateur d'état */}
          <div className="header-left-group">
            <button 
              id="kora-menu-button"
              ref={menuButtonRef}
              aria-label={isMenuOpen ? "Fermer le menu" : "Ouvrir le menu"}
              onClick={toggleMenu}
              onTouchStart={(e) => {
                // Vide intentionnellement - capture le toucher initial
              }}
              onTouchEnd={(e) => {
                e.preventDefault();
                // Sur mobile, déclencher le toggle au touchEnd
                const syntheticEvent = e as unknown as React.MouseEvent<HTMLButtonElement>;
                toggleMenu(syntheticEvent);
              }}
              className="kora-menu-button-control"
              data-state={isMenuOpen ? 'open' : 'closed'}
            >
              <div className="menu-icon-container">
                {isMenuOpen ? (
                  <X size={24} className="text-gray-800 animate-to-x" />
                ) : (
                  <HamburgerIcon size={24} className="text-gray-800 animate-to-menu" />
                )}
              </div>
            </button>
            
            {/* Logo - style déplacé vers le CSS */}
            <h1 id="kora-header-title" className="kora-name">KORA</h1>
          </div>
          
          {/* Empty div to balance the layout - style déplacé vers le CSS */}
          <div></div>
        </div>
      </div>
      
      {/* Menu latéral */}
      <SideMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
    </>
  );
};

export default Header;
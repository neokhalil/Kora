import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Menu, X } from 'lucide-react';
import SideMenu from './SideMenu';

const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  
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
  
  // Détection du système d'exploitation déplacée dans mobileViewportFix.ts
  // pour centraliser la logique et éviter les redondances
  
  // Nous n'avons pas besoin d'un gestionnaire de clic sur document pour le débogage
  // Le clic est géré directement par l'événement onClick sur le bouton
  
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
  
  return (
    <>
      {/* Header container qui correspond au style dans index.html */}
      <div 
        id="kora-header-container"
      >
        {/* Header content */}
        <div 
          id="kora-header"
        >
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
                  <Menu size={24} className="text-gray-800 animate-to-menu" />
                )}
              </div>
            </button>
            
            {/* Logo - style déplacé vers le CSS */}
            <h1 id="kora-header-title">Kora</h1>
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
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Menu, X } from 'lucide-react';
import SideMenu from './SideMenu';

const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  
  // Fonction pour déboguer le click en mode dev
  useEffect(() => {
    console.log("[Debug Header] Component mounted, initial menu state:", isMenuOpen);
  }, []);
  
  // Effet pour ajouter/supprimer la classe menu-open au body
  useEffect(() => {
    if (isMenuOpen) {
      document.body.classList.add('menu-open');
      console.log("[Debug Header] Menu opened, body class added");
      
      // Quand le menu s'ouvre, on masque le focus de tous les éléments actifs
      // pour éviter que le clavier ne s'ouvre automatiquement
      const activeElement = document.activeElement as HTMLElement;
      if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
        activeElement.blur();
      }
    } else {
      document.body.classList.remove('menu-open');
      console.log("[Debug Header] Menu closed, body class removed");
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
  
  // Récupérer les infos sur l'appareil
  useEffect(() => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    if (isIOS) {
      document.body.classList.add('ios-device');
    }
  }, []);
  
  // Nous n'avons pas besoin d'un gestionnaire de clic sur document pour le débogage
  // Le clic est géré directement par l'événement onClick sur le bouton
  
  // Mémoriser la fonction de toggle du menu pour éviter de la recréer
  const toggleMenu = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    console.log("[Debug Header] Button clicked:", e.currentTarget);
    console.log("[Debug Header] Toggle menu called, current state:", isMenuOpen);
    
    // Important: empêcher la propagation et le comportement par défaut
    e.preventDefault();
    e.stopPropagation();
    
    // Changer l'état du menu directement
    const newState = !isMenuOpen;
    console.log("[Debug Header] Setting menu state to:", newState);
    setIsMenuOpen(newState);
    
    // Déclencher un événement personnalisé pour informer d'autres parties de l'application
    if (typeof window !== 'undefined') {
      try {
        document.dispatchEvent(new CustomEvent('kora-menu-toggle', { 
          detail: { isOpen: newState } 
        }));
        console.log("[Debug Header] Custom event dispatched");
      } catch (err) {
        console.error("[Debug Header] Error dispatching custom event:", err);
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
          <div className="header-left-group" style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
            <button 
              id="kora-menu-button"
              ref={menuButtonRef}
              aria-label={isMenuOpen ? "Fermer le menu" : "Ouvrir le menu"}
              onClick={(e) => {
                console.log("[Debug Header] Click triggered on menu button");
                toggleMenu(e);
              }}
              onTouchStart={(e) => {
                console.log("[Debug Header] TouchStart on menu button");
              }}
              onTouchEnd={(e) => {
                console.log("[Debug Header] TouchEnd on menu button");
                e.preventDefault();
                // Sur mobile, déclencher le toggle au touchEnd
                const syntheticEvent = e as unknown as React.MouseEvent<HTMLButtonElement>;
                toggleMenu(syntheticEvent);
              }}
              className="kora-menu-button-control"
              style={{ 
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                touchAction: 'manipulation',
                position: 'relative',
                zIndex: 10000 // S'assurer que le bouton est au-dessus de tout
              }}
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
          
          {/* Empty div to balance the layout */}
          <div style={{ width: '40px' }}></div>
        </div>
      </div>
      
      {/* Menu latéral */}
      <SideMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
    </>
  );
};

export default Header;
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
  
  // Handler pour les clics sur le document
  useEffect(() => {
    // Handler pour s'assurer que les clicks sur le bouton du menu sont bien capturés
    const handleDocumentClick = (e: MouseEvent) => {
      const menuButton = menuButtonRef.current;
      if (menuButton && menuButton.contains(e.target as Node)) {
        console.log("[Debug Header] Menu button clicked via document handler");
      }
    };
    
    document.addEventListener('click', handleDocumentClick);
    return () => {
      document.removeEventListener('click', handleDocumentClick);
    };
  }, []);
  
  // Mémoriser la fonction de toggle du menu pour éviter de la recréer
  const toggleMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log("[Debug Header] Toggle menu called, current state:", isMenuOpen);
    
    // Changer l'état du menu
    setIsMenuOpen(prevState => {
      const newState = !prevState;
      console.log("[Debug Header] Setting menu state to:", newState);
      
      // Déclencher un événement personnalisé pour informer d'autres parties de l'application
      if (typeof window !== 'undefined') {
        try {
          document.dispatchEvent(new CustomEvent('kora-menu-toggle', { 
            detail: { isOpen: newState } 
          }));
        } catch (err) {
          console.error("[Debug Header] Error dispatching custom event:", err);
        }
      }
      
      return newState;
    });
  }, [isMenuOpen]);
  
  return (
    <>
      {/* Header container qui correspond au style dans index.html */}
      <div 
        id="kora-header-container"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: 'calc(56px + env(safe-area-inset-top, 0px))',
          paddingTop: 'env(safe-area-inset-top, 0px)',
          zIndex: 9999,
          pointerEvents: 'none',
        }}
      >
        {/* Header content */}
        <div 
          id="kora-header"
          style={{
            backgroundColor: 'white',
            height: '56px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 1rem',
            pointerEvents: 'auto',
            borderBottom: '1px solid #eaeaea',
          }}
        >
          {/* Menu button avec indicateur d'état */}
          <div className="header-left-group" style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
            <button 
              id="kora-menu-button"
              ref={menuButtonRef}
              aria-label={isMenuOpen ? "Fermer le menu" : "Ouvrir le menu"}
              onClick={toggleMenu}
              onTouchStart={(e) => {
                console.log("[Debug Header] TouchStart on menu button");
              }}
              onTouchEnd={(e) => {
                console.log("[Debug Header] TouchEnd on menu button");
                e.preventDefault();
              }}
              style={{ 
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                touchAction: 'manipulation'
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
            
            {/* Logo */}
            <h1 id="kora-header-title" style={{
              fontFamily: "'Elza', sans-serif",
              fontSize: '1.5rem',
              fontWeight: 900,
              letterSpacing: '-0.025em',
              textTransform: 'uppercase',
              marginLeft: '8px'
            }}>Kora</h1>
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
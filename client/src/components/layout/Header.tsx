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
    setIsMenuOpen(prevState => {
      const newState = !prevState;
      console.log("[Debug Header] Setting menu state to:", newState);
      return newState;
    });
  }, [isMenuOpen]);
  
  return (
    <>
      <header 
        id="kora-header-container"
        className="app-header w-full border-b border-gray-200 fixed top-0 left-0 right-0 z-[2000] bg-white"
        style={{
          height: '56px',
          paddingTop: 'env(safe-area-inset-top, 0px)',
        }}
      >
        <div className="flex items-center justify-between px-4 h-full">
          {/* Menu button avec indicateur d'état */}
          <div className="flex items-center">
            <button 
              ref={menuButtonRef}
              aria-label={isMenuOpen ? "Fermer le menu" : "Ouvrir le menu"}
              className={`flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-300 ${isMenuOpen ? 'bg-gray-100' : ''}`}
              onClick={toggleMenu}
              onTouchStart={(e) => {
                // Sur mobile, ajouter un événement tactile explicite pour éviter les délais
                console.log("[Debug Header] TouchStart on menu button");
              }}
              onTouchEnd={(e) => {
                console.log("[Debug Header] TouchEnd on menu button");
                e.preventDefault(); // Empêcher le comportement par défaut qui pourrait interférer
                // Le clic sera géré par l'événement onClick
              }}
              style={{ cursor: 'pointer', touchAction: 'manipulation' }}
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
          </div>
          
          {/* Logo in center */}
          <div className="flex items-center justify-center">
            <h1 className="text-xl font-bold tracking-tight">Kora</h1>
          </div>
          
          {/* Empty div to balance the layout */}
          <div className="w-10"></div>
        </div>
      </header>
      
      {/* Menu latéral */}
      <SideMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
    </>
  );
};

export default Header;
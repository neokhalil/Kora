import React, { useState, useCallback } from 'react';
import { Menu } from 'lucide-react';
import SideMenu from './SideMenu';

/**
 * Composant d'en-tête pour la version desktop
 * Affiche uniquement l'icône du menu et le logo Kora
 */
const DesktopHeader: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  // Mémoriser la fonction de toggle du menu pour éviter de la recréer
  const toggleMenu = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
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
      {/* Header container pour desktop uniquement */}
      <div id="kora-desktop-header">
        <div className="desktop-header-content">
          <button 
            className="desktop-menu-button"
            aria-label={isMenuOpen ? "Fermer le menu" : "Ouvrir le menu"}
            onClick={toggleMenu}
          >
            <Menu size={24} className="text-gray-800" />
          </button>
          
          {/* Logo Kora toujours visible sur desktop */}
          <h1 className="desktop-kora-logo">KORA</h1>
        </div>
      </div>
      
      {/* Menu latéral */}
      <SideMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
    </>
  );
};

export default DesktopHeader;
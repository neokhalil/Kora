import React, { useEffect } from 'react';
import { useMenu } from '@/hooks/use-menu';
import { Menu, X } from 'lucide-react';

const Header: React.FC = () => {
  const { toggleMenu, isMenuOpen } = useMenu();
  
  // Ajouter une classe au body quand le menu est ouvert
  useEffect(() => {
    if (isMenuOpen) {
      document.body.classList.add('menu-open');
    } else {
      document.body.classList.remove('menu-open');
    }
    
    return () => {
      document.body.classList.remove('menu-open');
    };
  }, [isMenuOpen]);
  
  return (
    <header 
      id="kora-header-container"
      className="app-header w-full border-b border-gray-200 fixed top-0 left-0 right-0 z-[2000]"
      style={{
        height: 'var(--header-height)',
        paddingTop: 'var(--safe-area-top, 0px)',
        backgroundColor: 'lightblue',
      }}
    >
      <div className="flex items-center justify-between px-4 h-full">
        {/* Menu button - Left aligned */}
        <div className="flex items-center">
          <button 
            onClick={toggleMenu}
            aria-label={isMenuOpen ? "Fermer le menu" : "Ouvrir le menu"}
            className="menu-toggle-button flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300"
            style={{
              backgroundColor: isMenuOpen ? '#000' : 'transparent',
            }}
          >
            {/* Utilise directement les icônes Lucide pour s'assurer que cela fonctionne */}
            {isMenuOpen ? (
              <X size={24} className="text-white transition-transform duration-300" />
            ) : (
              <Menu size={24} className="text-gray-800 transition-transform duration-300" />
            )}
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
  );
};

export default Header;
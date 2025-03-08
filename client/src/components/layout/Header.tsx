import React, { useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { useMenu } from '@/hooks/use-menu';

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
      className="app-header bg-white w-full border-b border-gray-200 fixed top-0 left-0 right-0 z-[2000]"
      style={{
        height: 'var(--header-height)',
        paddingTop: 'var(--safe-area-top, 0px)',
      }}
    >
      <div className="flex items-center justify-between px-4 h-full">
        {/* Menu button - Left aligned */}
        <div className="flex items-center">
          <button 
            onClick={toggleMenu}
            aria-label={isMenuOpen ? "Fermer le menu" : "Ouvrir le menu"}
            className={`menu-toggle-button flex items-center justify-center h-10 w-10 p-0 rounded-full transition-colors ${isMenuOpen ? 'bg-black' : 'bg-transparent'}`}
          >
            <X className={`h-5 w-5 ${isMenuOpen ? 'block text-white' : 'hidden'}`} strokeWidth={2.5} />
            <div className={`hamburger-lines flex flex-col space-y-1.5 ${isMenuOpen ? 'hidden' : 'block'}`}>
              <div className="w-6 h-0.5 bg-gray-800 rounded-full"></div>
              <div className="w-4 h-0.5 bg-gray-800 rounded-full"></div>
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
  );
};

export default Header;
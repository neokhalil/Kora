import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';
import SideMenu from './SideMenu';

const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };
  
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
          {/* Menu button - Left aligned avec animation */}
          <div className="flex items-center">
            <button 
              aria-label={isMenuOpen ? "Fermer le menu" : "Ouvrir le menu"}
              className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-100 transition-colors"
              onClick={toggleMenu}
            >
              {isMenuOpen ? (
                <X size={24} className="text-gray-800 transition-transform duration-300" />
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
      
      {/* Menu latéral */}
      <SideMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
    </>
  );
};

export default Header;
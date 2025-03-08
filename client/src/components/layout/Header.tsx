import React, { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import SideMenu from './SideMenu';

const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  // Fonction pour déboguer le click en mode dev
  useEffect(() => {
    console.log("Header monté, menu état initial:", isMenuOpen);
  }, []);
  
  // Effet pour ajouter/supprimer la classe menu-open au body
  useEffect(() => {
    if (isMenuOpen) {
      document.body.classList.add('menu-open');
      console.log("Menu ouvert");
    } else {
      document.body.classList.remove('menu-open');
      console.log("Menu fermé");
    }
    
    return () => {
      document.body.classList.remove('menu-open');
    };
  }, [isMenuOpen]);
  
  const toggleMenu = () => {
    console.log("Toggle menu appelé, état actuel:", isMenuOpen);
    setIsMenuOpen(prevState => !prevState);
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
              style={{ cursor: 'pointer' }}
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
      
      {/* Menu latéral, rendu conditionnel pour debugger */}
      {typeof SideMenu === 'function' ? (
        <SideMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
      ) : (
        <div style={{position: 'fixed', top: '60px', left: '10px', zIndex: 3000, background: 'red', color: 'white', padding: '5px'}}>
          Erreur: SideMenu n'est pas un composant valide
        </div>
      )}
    </>
  );
};

export default Header;
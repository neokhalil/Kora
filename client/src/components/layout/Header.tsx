import React, { useEffect } from 'react';
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
  
  // Styles inline pour le bouton et l'animation
  const buttonStyle = {
    position: 'relative' as const,
    display: 'flex' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    width: '40px',
    height: '40px',
    padding: '0',
    borderRadius: '50%',
    cursor: 'pointer',
    background: isMenuOpen ? '#000' : 'transparent',
    border: 'none',
    outline: 'none',
    transition: 'all 0.3s ease-in-out',
    zIndex: 2100,
  };
  
  // Styles pour l'icône hamburger
  const hamburgerStyle = {
    width: '24px',
    height: '18px',
    position: 'relative' as const,
    transform: 'rotate(0deg)',
    transition: '0.5s ease-in-out',
    cursor: 'pointer',
  };
  
  // Styles de base pour les barres
  const barBaseStyle = {
    display: 'block',
    position: 'absolute' as const,
    height: '2px',
    borderRadius: '9px',
    opacity: 1,
    transform: 'rotate(0deg)',
    transition: '0.25s ease-in-out',
    backgroundColor: isMenuOpen ? '#fff' : '#333',
  };
  
  // Styles spécifiques pour chaque barre
  const bar1Style = {
    ...barBaseStyle,
    width: '100%',
    top: isMenuOpen ? '8px' : '0px',
    transform: isMenuOpen ? 'rotate(135deg)' : 'rotate(0deg)',
  };
  
  const bar2Style = {
    ...barBaseStyle,
    width: isMenuOpen ? '100%' : '70%',
    top: '8px',
    right: '0',
    left: isMenuOpen ? '0' : 'auto',
    opacity: isMenuOpen ? 0 : 1,
  };
  
  const bar3Style = {
    ...barBaseStyle,
    width: isMenuOpen ? '100%' : '100%',
    top: isMenuOpen ? '8px' : '16px',
    transform: isMenuOpen ? 'rotate(-135deg)' : 'rotate(0deg)',
  };
  
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
            style={buttonStyle}
          >
            {/* Icône hamburger avec animation en X */}
            <div style={hamburgerStyle}>
              <span style={bar1Style}></span>
              <span style={bar2Style}></span>
              <span style={bar3Style}></span>
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
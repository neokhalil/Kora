import React, { useEffect } from 'react';
import { Menu } from 'lucide-react';

const Header: React.FC = () => {
  // Ajouter une classe pour maintenir le header visible même avec le clavier ouvert
  useEffect(() => {
    const handleVisualViewportChange = () => {
      // S'assurer que le header reste toujours visible
      const header = document.getElementById('kora-header-container');
      if (header) {
        header.style.position = 'sticky';
        header.style.transform = 'translateZ(0)';
      }
    };

    // Écouter les événements de redimensionnement du viewport visuel (pour le clavier mobile)
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleVisualViewportChange);
      window.visualViewport.addEventListener('scroll', handleVisualViewportChange);
    }

    // Nettoyer les écouteurs d'événements
    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleVisualViewportChange);
        window.visualViewport.removeEventListener('scroll', handleVisualViewportChange);
      }
    };
  }, []);

  return (
    <header 
      id="kora-header-container"
      className="app-header w-full border-b border-gray-200 sticky top-0 left-0 right-0 z-[2000]"
      style={{
        height: 'var(--header-height)',
        paddingTop: 'var(--safe-area-top, 0px)',
        backgroundColor: 'lightblue',
        // Assurer que le header reste visible avec ces propriétés
        transform: 'translateZ(0)',
        willChange: 'transform',
      }}
    >
      <div className="flex items-center justify-between px-4 h-full">
        {/* Menu button - Left aligned (statique) */}
        <div className="flex items-center">
          <button 
            aria-label="Menu"
            className="flex items-center justify-center w-10 h-10 rounded-full"
          >
            <Menu size={24} className="text-gray-800" />
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
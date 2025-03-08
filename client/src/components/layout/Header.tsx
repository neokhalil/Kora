import React, { useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { useMenu } from '@/hooks/use-menu';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const Header: React.FC = () => {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const { toggleMenu } = useMenu();
  
  // Ajouter une classe au body quand le menu est ouvert
  useEffect(() => {
    if (menuOpen) {
      document.body.classList.add('menu-open');
    } else {
      document.body.classList.remove('menu-open');
    }
    
    return () => {
      document.body.classList.remove('menu-open');
    };
  }, [menuOpen]);
  
  const handleToggleMenu = () => {
    const newState = !menuOpen;
    setMenuOpen(newState);
    toggleMenu(); // Appelle aussi la fonction du hook useMenu
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
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleToggleMenu}
            aria-label={menuOpen ? "Fermer le menu" : "Ouvrir le menu"}
            className="text-gray-800 p-0 hover:bg-transparent"
          >
            {menuOpen ? (
              /* X icon when menu is open */
              <div className="bg-black text-white p-1.5 rounded-full flex items-center justify-center">
                <X className="h-5 w-5" strokeWidth={2.5} />
              </div>
            ) : (
              /* ChatGPT style hamburger menu with two lines when closed */
              <div className="flex flex-col space-y-1.5">
                <div className="w-6 h-0.5 bg-gray-800 rounded-full"></div>
                <div className="w-4 h-0.5 bg-gray-800 rounded-full"></div>
              </div>
            )}
          </Button>
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
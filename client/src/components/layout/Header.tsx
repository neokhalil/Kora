import React, { useEffect, useState } from 'react';
import { Menu } from 'lucide-react';
import { useMenu } from '@/hooks/use-menu';
import { Button } from '@/components/ui/button';

const Header: React.FC = () => {
  const { toggleMenu } = useMenu();
  const [scrollPosition, setScrollPosition] = useState(0);
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  
  // Effet pour suivre le défilement de la page et masquer/afficher le header
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollPos = window.scrollY;
      const isScrolledDown = currentScrollPos > scrollPosition && currentScrollPos > 50;
      
      // Ne pas masquer le header si l'utilisateur fait défiler vers le haut
      setIsHeaderVisible(!isScrolledDown);
      setScrollPosition(currentScrollPos);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [scrollPosition]);
  
  // Effet pour réafficher le header lorsque le focus est sur un élément d'entrée (clavier mobile)
  useEffect(() => {
    const handleFocus = () => {
      setIsHeaderVisible(true);
    };
    
    const inputElements = document.querySelectorAll('input, textarea');
    inputElements.forEach(el => {
      el.addEventListener('focus', handleFocus);
    });
    
    return () => {
      inputElements.forEach(el => {
        el.removeEventListener('focus', handleFocus);
      });
    };
  }, []);
  
  return (
    <header 
      className={`app-header safe-area-top bg-white dark:bg-gray-900 border-b border-gray-200/10 ${isHeaderVisible ? '' : 'transform -translate-y-full'}`}
    >
      <div className="flex items-center justify-between px-4 h-full">
        {/* Menu button - Left aligned */}
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleMenu}
            aria-label="Menu"
            className="text-black"
          >
            <Menu className="h-6 w-6" />
          </Button>
        </div>
        
        {/* Logo in center */}
        <div className="flex items-center justify-center">
          <h1 className="text-xl font-bold tracking-tight uppercase">Kora</h1>
        </div>
        
        {/* Empty div to balance the layout */}
        <div className="w-10"></div>
      </div>
    </header>
  );
};

export default Header;
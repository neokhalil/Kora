import React, { useEffect, useState, useRef } from 'react';
import { Menu } from 'lucide-react';
import { useMenu } from '@/hooks/use-menu';
import { Button } from '@/components/ui/button';

const Header: React.FC = () => {
  const { toggleMenu } = useMenu();
  const [scrollPosition, setScrollPosition] = useState(0);
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const headerRef = useRef<HTMLElement>(null);
  
  // Effet pour suivre le défilement de la page et masquer/afficher le header
  // Mais uniquement quand le clavier n'est pas ouvert
  useEffect(() => {
    const handleScroll = () => {
      // Ne pas changer l'état du header si le clavier est ouvert
      if (document.body.classList.contains('keyboard-open') || 
          document.body.classList.contains('input-focused')) {
        setIsHeaderVisible(true);
        return;
      }
      
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
      
      // Forcer la visibilité du header
      if (headerRef.current) {
        headerRef.current.style.opacity = '1';
        headerRef.current.style.transform = 'none';
        headerRef.current.style.visibility = 'visible';
      }
    };
    
    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        handleFocus();
      }
    };
    
    // Utiliser focusin sur le document pour capturer tous les événements de focus
    document.addEventListener('focusin', handleFocusIn);
    
    // Observer les changements de classes sur le body pour détecter l'état du clavier
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          if (document.body.classList.contains('keyboard-open') || 
              document.body.classList.contains('input-focused')) {
            handleFocus();
          }
        }
      });
    });
    
    observer.observe(document.body, { attributes: true });
    
    return () => {
      document.removeEventListener('focusin', handleFocusIn);
      observer.disconnect();
    };
  }, []);

  // Effet pour s'assurer que le header reste visible lors de l'ouverture du clavier
  useEffect(() => {
    const handleKeyboardChange = () => {
      if (document.body.classList.contains('keyboard-open')) {
        setIsHeaderVisible(true);
        if (headerRef.current) {
          headerRef.current.style.opacity = '1';
          headerRef.current.style.transform = 'none';
          headerRef.current.style.visibility = 'visible';
        }
      }
    };

    // S'assurer que visualViewport est disponible
    if ('visualViewport' in window) {
      window.visualViewport?.addEventListener('resize', handleKeyboardChange);
      window.visualViewport?.addEventListener('scroll', handleKeyboardChange);
    }

    return () => {
      if ('visualViewport' in window) {
        window.visualViewport?.removeEventListener('resize', handleKeyboardChange);
        window.visualViewport?.removeEventListener('scroll', handleKeyboardChange);
      }
    };
  }, []);
  
  return (
    <header 
      ref={headerRef}
      className={`app-header fixed sticky top-0 left-0 right-0 z-[9999] bg-white dark:bg-gray-900 border-b border-gray-200/10 transition-all duration-300 ${isHeaderVisible ? '' : 'transform -translate-y-full'} android-fix ios-fix`}
      style={{
        willChange: 'transform, opacity',
        WebkitTransform: 'translateZ(0)',
        transform: 'translateZ(0)',
        paddingTop: 'var(--safe-area-top, 0px)'
      }}
    >
      <div className="flex items-center justify-between px-4 h-14">
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
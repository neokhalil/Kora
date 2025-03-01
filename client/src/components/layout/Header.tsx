import React from 'react';
import { Menu } from 'lucide-react';
import { useMenu } from '@/hooks/use-menu';
import { Button } from '@/components/ui/button';

const Header: React.FC = () => {
  const { toggleMenu } = useMenu();
  
  return (
    <header className="h-16 bg-white dark:bg-gray-900 border-b border-gray-200/10 fixed top-0 left-0 right-0 z-50">
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
import React from 'react';
import { Menu } from 'lucide-react';
import { useMenu } from '@/hooks/use-menu';
import { Button } from '@/components/ui/button';

const Header: React.FC = () => {
  const { toggleMenu } = useMenu();
  
  return (
    <header 
      className="app-header bg-white dark:bg-gray-900 w-full border-b border-gray-200 dark:border-gray-800 relative z-40"
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
            onClick={toggleMenu}
            aria-label="Menu"
            className="text-gray-800 dark:text-gray-300 p-0 hover:bg-transparent"
          >
            {/* ChatGPT style hamburger menu with two lines */}
            <div className="flex flex-col space-y-1.5">
              <div className="w-6 h-0.5 bg-gray-800 dark:bg-gray-300 rounded-full"></div>
              <div className="w-4 h-0.5 bg-gray-800 dark:bg-gray-300 rounded-full"></div>
            </div>
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
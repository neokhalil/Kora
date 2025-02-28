import React from 'react';
import { Menu, Search, Bell, User } from 'lucide-react';
import { useMenu } from '@/hooks/use-menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const Header: React.FC = () => {
  const { toggleMenu } = useMenu();
  
  return (
    <header className="h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-30">
      <div className="flex items-center justify-between px-4 h-full">
        {/* Left side - Mobile menu button */}
        <div className="flex items-center md:hidden">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleMenu}
            aria-label="Menu"
          >
            <Menu className="h-6 w-6" />
          </Button>
        </div>
        
        {/* Middle - Search bar */}
        <div className="flex-1 mx-4 hidden md:block max-w-md">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input 
              className="w-full pl-8 bg-gray-50 dark:bg-gray-800" 
              placeholder="Rechercher une question..." 
              type="search"
            />
          </div>
        </div>
        
        {/* Right side - Notifications, user menu */}
        <div className="flex items-center space-x-3">
          <Button variant="ghost" size="icon" aria-label="Notifications">
            <Bell className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" aria-label="Profile">
            <User className="h-5 w-5" />
          </Button>
        </div>
      </div>
      
      {/* Mobile search - Only shown on small screens */}
      <div className="px-4 pb-3 md:hidden">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input 
            className="w-full pl-8 bg-gray-50 dark:bg-gray-800" 
            placeholder="Rechercher une question..." 
            type="search"
          />
        </div>
      </div>
    </header>
  );
};

export default Header;
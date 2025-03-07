import React from 'react';
import { useLocation } from 'wouter';
import { useMenu } from '@/hooks/use-menu';
import { navItems } from '@/lib/data';
import { cn } from '@/lib/utils';
import { Search, PenSquare, Plus, ChevronDown, User } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

// Sample recent conversations data
const recentConversations = [
  { id: '1', title: 'Équation différentielle expliquée', date: '2025-03-07' },
  { id: '2', title: 'Verbe dans la phrase', date: '2025-03-06' },
  { id: '3', title: 'Texte aléatoire et aide', date: '2025-03-05' },
  { id: '4', title: 'English-speaking Sub-Saharan Africa', date: '2025-03-04' },
];

const SideNavigation = () => {
  const { isMenuOpen, closeMenu } = useMenu();
  const [location, setLocation] = useLocation();
  const [searchValue, setSearchValue] = React.useState('');
  
  // Track current location for highlighting active link
  React.useEffect(() => {
    // Only log in development
    if (process.env.NODE_ENV !== 'production') {
      console.log("Current location in SideNavigation:", location);
    }
  }, [location]);
  
  // Function to handle navigation with debounce protection
  const handleNavigation = (path: string) => {
    // Only log in development
    if (process.env.NODE_ENV !== 'production') {
      console.log("Navigating to:", path);
    }
    
    // Use a small timeout to ensure the navigation happens after
    // any current rendering cycle completes
    setTimeout(() => {
      setLocation(path);
      closeMenu();
    }, 10);
  };

  // Function to start a new conversation
  const handleNewConversation = () => {
    console.log("Starting new conversation");
    handleNavigation('/');
  };
  
  return (
    <>
      {/* Mobile Navigation Overlay */}
      {isMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden menu-overlay"
          onClick={closeMenu}
          aria-hidden="true"
        ></div>
      )}
      
      {/* Side Navigation - ChatGPT style */}
      <aside 
        className={cn(
          "w-full max-w-[280px] bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out md:translate-x-0 md:relative md:z-0 flex flex-col",
          isMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Top search bar and new chat button */}
        <div className="px-2 py-2 flex flex-col gap-2">
          {/* Search area - Hidden on narrow mobile screens */}
          <div className="relative hidden sm:block">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-500" />
            </div>
            <Input
              type="text"
              placeholder="Rechercher"
              className="pl-10 pr-4 py-2 w-full bg-gray-100 dark:bg-gray-800 border-none text-sm"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
            />
          </div>
          
          {/* New chat button */}
          <Button
            onClick={handleNewConversation}
            className="w-full bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-black dark:text-white border border-gray-200 dark:border-gray-700 flex items-center justify-between text-sm"
          >
            <span className="flex items-center">
              <PenSquare className="h-4 w-4 mr-2" />
              Nouvelle conversation
            </span>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Main navigation section */}
        <div className="flex-1 overflow-y-auto">
          {/* Main menu navigation section */}
          <div className="px-2 py-1 border-b border-gray-200 dark:border-gray-800">
            {navItems.map((item) => (
              <div
                key={item.path}
                className={cn(
                  "flex items-center px-2 py-1.5 my-1 text-sm font-medium rounded-md transition-colors cursor-pointer",
                  location === item.path 
                    ? "bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-white" 
                    : "text-gray-700 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-700"
                )}
                onClick={() => handleNavigation(item.path)}
              >
                {item.icon}
                {item.label}
              </div>
            ))}
          </div>
          
          {/* Recent conversations section */}
          <div className="px-2 py-2">
            <h3 className="px-2 text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
              Conversations récentes
            </h3>
            
            <div className="space-y-0.5">
              {recentConversations.map((convo) => (
                <div
                  key={convo.id}
                  className="px-2 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md cursor-pointer truncate"
                  onClick={() => handleNavigation(`/conversation/${convo.id}`)}
                >
                  {convo.title}
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* User account section */}
        <div className="border-t border-gray-200 dark:border-gray-800 p-2">
          <div className="flex items-center p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md cursor-pointer">
            <div className="w-7 h-7 bg-gray-300 dark:bg-gray-700 rounded-full flex items-center justify-center mr-2">
              <User className="h-4 w-4 text-gray-600 dark:text-gray-300" />
            </div>
            <div className="flex-1">
              <p className="text-xs sm:text-sm font-medium text-gray-800 dark:text-gray-200">Mon Compte</p>
            </div>
            <ChevronDown className="h-3 w-3 text-gray-500" />
          </div>
        </div>
      </aside>
    </>
  );
};

export default SideNavigation;
import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useMenu } from '@/hooks/use-menu';
import { navItems } from '@/lib/data';
import { cn } from '@/lib/utils';
import { Search, PenSquare, Plus, ChevronDown, User, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

// Sample recent conversations data
const recentConversations = [
  { id: '1', title: 'Texte aléatoire et aide', date: '2025-03-07' },
  { id: '2', title: 'English-speaking Sub-Saharan Africa', date: '2025-03-06' },
  { id: '3', title: 'Équation différentielle expliquée', date: '2025-03-05' },
  { id: '4', title: 'Verbe dans la phrase', date: '2025-03-04' },
  { id: '5', title: 'ICT Growth in Kenya 2024', date: '2025-03-03' },
];

const SideNavigation = () => {
  const { isMenuOpen, closeMenu } = useMenu();
  const [location, setLocation] = useLocation();
  const [searchValue, setSearchValue] = useState('');
  
  // État filtré pour les conversations récentes basées sur la recherche
  const [filteredConversations, setFilteredConversations] = useState(recentConversations);
  
  // Filtre les conversations en fonction de la recherche
  useEffect(() => {
    if (searchValue.trim() === '') {
      setFilteredConversations(recentConversations);
    } else {
      const filtered = recentConversations.filter(convo =>
        convo.title.toLowerCase().includes(searchValue.toLowerCase())
      );
      setFilteredConversations(filtered);
    }
  }, [searchValue]);
  
  // Track current location for highlighting active link
  useEffect(() => {
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
      
      {/* Side Navigation - White background for better readability */}
      <aside 
        className={cn(
          "side-navigation w-full max-w-[300px] bg-white border-r border-gray-200 fixed inset-0 left-0 z-50 transform transition-transform duration-300 ease-in-out md:translate-x-0 md:relative md:z-0 flex flex-col",
          isMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}
        style={{
          paddingTop: 'var(--safe-area-top, 0px)'
        }}
      >
        {/* Logo et titre */}
        <div className="px-4 py-3 bg-gray-100 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-white border border-gray-300 rounded-full flex items-center justify-center mr-3">
                <span className="text-gray-700 text-lg font-bold">K</span>
              </div>
              <h1 className="text-lg font-bold text-gray-800">Kora</h1>
            </div>
            
            {/* Bouton de fermeture du menu - visible uniquement sur mobile */}
            <div className="md:hidden">
              <Button
                variant="ghost"
                size="icon"
                onClick={closeMenu}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
        
        {/* Zone de recherche globale (comme dans la capture d'écran) */}
        <div className="px-3 py-2">
          <div className="relative flex items-center bg-gray-100 rounded-full h-10">
            <Search className="h-5 w-5 text-gray-500 ml-3" />
            <Input
              type="text"
              placeholder="Rechercher"
              className="h-10 border-0 bg-transparent shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 pl-2"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
            />
          </div>
        </div>
        
        {/* Main navigation section */}
        <div className="flex-1 overflow-y-auto">
          {/* Main menu navigation section */}
          <div className="px-2 py-2 border-b border-gray-200">
            {navItems.map((item) => (
              <div
                key={item.path}
                className={cn(
                  "flex items-center px-3 py-2.5 my-1 text-sm font-medium rounded-md transition-colors cursor-pointer",
                  location === item.path 
                    ? "bg-[#f0f0f0] text-gray-800" 
                    : "text-gray-700 hover:bg-[#f0f0f0]"
                )}
                onClick={() => handleNavigation(item.path)}
              >
                <span className="mr-3">{item.icon}</span>
                {item.label}
              </div>
            ))}
          </div>

          {/* Conversations récentes section */}
          <div className="px-2 py-2">
            <h3 className="px-2 text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
              Conversations récentes
            </h3>
            
            <div className="space-y-1">
              {filteredConversations.length > 0 ? (
                filteredConversations.map((convo) => (
                  <div
                    key={convo.id}
                    className="px-3 py-2 text-sm text-gray-700 hover:bg-[#f0f0f0] rounded-md cursor-pointer truncate"
                    onClick={() => handleNavigation(`/conversation/${convo.id}`)}
                  >
                    {convo.title}
                  </div>
                ))
              ) : searchValue.trim() !== '' ? (
                <div className="px-3 py-2 text-sm text-gray-500 italic">
                  Aucun résultat trouvé
                </div>
              ) : (
                <div className="px-3 py-2 text-sm text-gray-500 italic">
                  Aucune conversation récente
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* User account section */}
        <div className="border-t border-gray-200 p-2">
          <div className="flex items-center p-2 hover:bg-[#f0f0f0] cursor-pointer rounded-md">
            <div className="w-7 h-7 bg-amber-600 rounded-full flex items-center justify-center mr-3">
              <span className="text-white text-sm font-medium">I</span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-800">Ibrahima Ndiaye</p>
            </div>
            <ChevronDown className="h-4 w-4 text-gray-500" />
          </div>
        </div>
      </aside>
    </>
  );
};

export default SideNavigation;
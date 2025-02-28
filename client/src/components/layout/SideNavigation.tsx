import React from 'react';
import { useLocation } from 'wouter';
import { useMenu } from '@/hooks/use-menu';
import { navItems } from '@/lib/data';
import { cn } from '@/lib/utils';

const SideNavigation = () => {
  const { isMenuOpen, closeMenu } = useMenu();
  const [location, setLocation] = useLocation();
  
  // Debug current location and navigation items
  React.useEffect(() => {
    console.log("Current location in SideNavigation:", location);
    console.log("Navigation items:", navItems);
    
    // Force re-render with timeout to ensure UI updates
    const timer = setTimeout(() => {
      console.log("Navigation refreshed");
    }, 500);
    
    return () => clearTimeout(timer);
  }, [location]);
  
  // Function to handle navigation
  const handleNavigation = (path: string) => {
    console.log("Navigating to:", path);
    setLocation(path);
    closeMenu();
  };
  
  return (
    <>
      {/* Mobile Navigation Overlay */}
      {isMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
          onClick={closeMenu}
        ></div>
      )}
      
      {/* Side Navigation */}
      <aside 
        className={cn(
          "w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 fixed inset-y-0 left-0 z-40 md:z-0 transform transition-transform duration-300 ease-in-out md:translate-x-0 md:relative flex flex-col",
          isMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo section at the top of sidebar */}
        <div className="h-16 flex items-center px-4 border-b border-gray-200 dark:border-gray-800">
          <div 
            className="flex items-center space-x-2 cursor-pointer" 
            onClick={() => handleNavigation("/")}
          >
            <div className="w-8 h-8 bg-indigo-600 rounded-md flex items-center justify-center">
              <span className="text-white font-bold text-lg">K</span>
            </div>
            <span className="text-xl font-bold">Kora</span>
          </div>
        </div>
        
        {/* Navigation Links */}
        <nav className="flex-1 py-4 px-3 overflow-y-auto">
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.path}>
                <div 
                  className={cn(
                    "flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors cursor-pointer",
                    location === item.path 
                      ? "bg-indigo-50 text-indigo-600 dark:bg-gray-800 dark:text-indigo-400" 
                      : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                  )}
                  onClick={() => handleNavigation(item.path)}
                >
                  <span className="mr-3">{item.icon}</span>
                  {item.label}
                </div>
              </li>
            ))}
          </ul>
        </nav>
        
        {/* Debug section */}
        <div className="px-4 py-2 text-xs text-gray-500 bg-gray-50 dark:bg-gray-800">
          <p>Current route: {location}</p>
          <p>Navigation items: {navItems.length}</p>
          <div className="mt-1 text-xs">
            <details>
              <summary>All Routes</summary>
              <ul className="pl-2 mt-1">
                {navItems.map((item, index) => (
                  <li key={index} className="flex justify-between">
                    <span>{item.label} ({item.path})</span>
                    <button 
                      className="text-indigo-600 hover:underline" 
                      onClick={() => handleNavigation(item.path)}
                    >
                      Go
                    </button>
                  </li>
                ))}
              </ul>
              <div className="mt-2 flex space-x-2">
                <button 
                  className="px-1 py-0.5 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                  onClick={() => handleNavigation("/test")}
                >
                  Test Page
                </button>
                <button 
                  className="px-1 py-0.5 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                  onClick={() => handleNavigation("/chat-assistant")}
                >
                  Chat Assistant
                </button>
              </div>
            </details>
          </div>
        </div>
        
        {/* Footer section */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-800">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
              <span className="text-sm">👤</span>
            </div>
            <div>
              <p className="text-sm font-medium">Invité</p>
              <p className="text-xs text-gray-500">Connectez-vous</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default SideNavigation;
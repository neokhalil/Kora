import React from 'react';
import { Menu } from 'lucide-react';

const Header: React.FC = () => {
  return (
    <header 
      id="kora-header-container"
      className="app-header w-full border-b border-gray-200 fixed top-0 left-0 right-0 z-[2000]"
      style={{
        height: 'var(--header-height)',
        paddingTop: 'var(--safe-area-top, 0px)',
        backgroundColor: 'lightblue',
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
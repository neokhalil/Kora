import * as React from 'react';

interface MenuContextType {
  isMenuOpen: boolean;
  toggleMenu: () => void;
  closeMenu: () => void;
}

const MenuContext = React.createContext<MenuContextType | undefined>(undefined);

interface MenuProviderProps {
  children: React.ReactNode;
}

export const MenuProvider = ({ children }: MenuProviderProps) => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  const toggleMenu = React.useCallback(() => {
    setIsMenuOpen((prev) => {
      if (!prev) {
        document.body.classList.add('overflow-hidden');
      } else {
        document.body.classList.remove('overflow-hidden');
      }
      return !prev;
    });
  }, []);

  const closeMenu = React.useCallback(() => {
    setIsMenuOpen(false);
    document.body.classList.remove('overflow-hidden');
  }, []);

  const value = React.useMemo(() => ({
    isMenuOpen,
    toggleMenu,
    closeMenu
  }), [isMenuOpen, toggleMenu, closeMenu]);

  return (
    <MenuContext.Provider value={value}>
      {children}
    </MenuContext.Provider>
  );
};

export function useMenu(): MenuContextType {
  const context = React.useContext(MenuContext);
  if (context === undefined) {
    throw new Error('useMenu must be used within a MenuProvider');
  }
  return context;
}
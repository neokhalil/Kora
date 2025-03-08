// Ce fichier est conservé pour éviter les erreurs d'importation, mais son contenu a été supprimé
// car nous avons retiré la fonctionnalité de menu latéral

import * as React from 'react';

// Interface gardée pour la compatibilité
interface MenuContextType {
  isMenuOpen: boolean;
  toggleMenu: () => void;
  closeMenu: () => void;
}

// Hook factice qui ne fait rien
export function useMenu(): MenuContextType {
  return {
    isMenuOpen: false,
    toggleMenu: () => {},
    closeMenu: () => {}
  };
}

// Component factice pour compatibilité
export const MenuProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  return <>{children}</>;
};
import * as React from "react";
import { useEffect } from "react";
import { Route, Switch } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import SideNavigation from "@/components/layout/SideNavigation";
import ChatAssistant from "@/pages/ChatAssistant";
import { MenuProvider, useMenu } from "@/hooks/use-menu";

// Configuration des routes
const routes = [
  { path: "/", Component: ChatAssistant }
];

// Composant de routage
const AppRouter: React.FC = () => {
  return (
    <Switch>
      {routes.map(({ path, Component }) => (
        <Route key={path} path={path}>
          <Component />
        </Route>
      ))}
      <Route>
        <NotFound />
      </Route>
    </Switch>
  );
};

// Conteneur principal de l'application
const AppContainer: React.FC = () => {
  const { toggleMenu } = useMenu();
  
  useEffect(() => {
    // Ajouter un écouteur pour l'événement personnalisé du bouton de menu
    const handleToggleMenu = () => {
      toggleMenu();
    };
    
    document.addEventListener('toggle-menu', handleToggleMenu);
    
    // Nettoyer l'écouteur
    return () => {
      document.removeEventListener('toggle-menu', handleToggleMenu);
    };
  }, [toggleMenu]);
  
  return (
    <div className="app-content">
      <div className="flex flex-1 relative">
        <SideNavigation />
        <main className="flex-1 mx-auto w-full max-w-screen-xl p-4">
          <AppRouter />
        </main>
      </div>
    </div>
  );
};

// Composant principal de l'application
const App: React.FC = () => {
  useEffect(() => {
    // Détecter le type d'appareil pour les styles spécifiques
    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent) && !(window as any).MSStream;
    const isAndroid = /Android/i.test(navigator.userAgent);
    
    if (isIOS) document.body.classList.add('ios-device');
    if (isAndroid) document.body.classList.add('android-device');
    
    // Gestion du clavier avec visualViewport
    if ('visualViewport' in window) {
      const handleViewportChange = () => {
        const viewportHeight = window.visualViewport?.height || 0;
        const windowHeight = window.innerHeight;
        const keyboardHeight = windowHeight - viewportHeight;
        
        // Le clavier est considéré ouvert si la différence est > 100px
        if (keyboardHeight > 100) {
          document.body.classList.add('keyboard-open');
          
          // Assurer que le header est toujours visible
          const fixedHeader = document.getElementById('fixed-header');
          if (fixedHeader) {
            fixedHeader.style.position = 'fixed';
            fixedHeader.style.top = '0';
          }
        } else {
          document.body.classList.remove('keyboard-open');
        }
      };
      
      window.visualViewport?.addEventListener('resize', handleViewportChange);
      window.visualViewport?.addEventListener('scroll', handleViewportChange);
      
      return () => {
        window.visualViewport?.removeEventListener('resize', handleViewportChange);
        window.visualViewport?.removeEventListener('scroll', handleViewportChange);
      };
    }
  }, []);
  
  return (
    <QueryClientProvider client={queryClient}>
      <MenuProvider>
        {/* Contenu principal de l'application (le header est ajouté par le script HTML) */}
        <AppContainer />
        <Toaster />
      </MenuProvider>
    </QueryClientProvider>
  );
};

export default App;

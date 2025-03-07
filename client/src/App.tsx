import React, { useEffect } from "react";
import { Route, Switch } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import SideNavigation from "@/components/layout/SideNavigation";
import ChatAssistant from "@/pages/ChatAssistant";
import ImageAnalysisTest from "@/pages/ImageAnalysisTest";
import { MenuProvider, useMenu } from "@/hooks/use-menu";

// Configuration des routes
const routes = [
  { path: "/", Component: ChatAssistant },
  { path: "/image-analysis", Component: ImageAnalysisTest }
];

// App avec menu latéral
const AppContainer = () => {
  const { isMenuOpen, toggleMenu } = useMenu();
  
  // Connecter l'événement du header HTML au toggle du menu
  useEffect(() => {
    const handleToggleMenu = () => {
      toggleMenu();
    };
    
    document.addEventListener('toggle-menu', handleToggleMenu);
    
    return () => {
      document.removeEventListener('toggle-menu', handleToggleMenu);
    };
  }, [toggleMenu]);

  return (
    <div className="flex h-full">
      {/* Menu latéral */}
      <SideNavigation />
      
      {/* Overlay pour fermer le menu sur mobile */}
      {isMenuOpen && (
        <div 
          className="menu-overlay"
          onClick={toggleMenu}
        />
      )}
      
      {/* Contenu principal */}
      <main className="flex-1 overflow-y-auto w-full">
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
      </main>
    </div>
  );
};

// Application principale
const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <MenuProvider>
        <AppContainer />
        <Toaster />
      </MenuProvider>
    </QueryClientProvider>
  );
};

export default App;

import React, { useEffect } from "react";
import { Route, Switch } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import SideNavigation from "@/components/layout/SideNavigation";
import ChatAssistant from "@/pages/ChatAssistant";
import { MenuProvider, useMenu } from "@/hooks/use-menu";

// Configuration des routes simples
const routes = [
  { path: "/", Component: ChatAssistant }
];

// Application principale
const App: React.FC = () => {
  const { toggleMenu } = useMenu();
  
  // Écouter l'événement toggle-menu du header HTML
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
    <QueryClientProvider client={queryClient}>
      <MenuProvider>
        <div className="flex h-full">
          <SideNavigation />
          <main className="flex-1 overflow-y-auto">
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
        <Toaster />
      </MenuProvider>
    </QueryClientProvider>
  );
};

export default App;

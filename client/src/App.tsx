import React, { useEffect } from "react";
import { Route, Switch } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Header from "@/components/layout/Header";
import ChatAssistant from "@/pages/ChatAssistant";
import "./styles/mobile-keyboard-fix.css";

// Configuration des routes
const routes = [
  { path: "/", Component: ChatAssistant },
  { path: "/chat-assistant", Component: ChatAssistant }
];

// Nouveau conteneur de l'application avec structure optimisée pour mobile
const AppContainer = () => {
  // Gestionnaire simple du focus pour assurer la visibilité des éléments
  useEffect(() => {
    const handleFocusElement = (event: FocusEvent) => {
      const target = event.target as HTMLElement;
      
      // Donner un peu de temps pour que le clavier s'ouvre
      setTimeout(() => {
        // Faire défiler le conteneur principal pour voir l'élément
        if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
          target.scrollIntoView({ block: 'center', behavior: 'smooth' });
        }
      }, 300);
    };
    
    // Écouter les événements de focus
    document.addEventListener('focusin', handleFocusElement);
    
    return () => {
      document.removeEventListener('focusin', handleFocusElement);
    };
  }, []);

  return (
    // Le conteneur de scroll principal qui englobe toute l'application
    <div id="app-scroll-container">
      <div className="flex flex-col min-h-full">
        {/* Header en sticky top */}
        <div id="kora-header-container">
          <Header />
        </div>
        
        {/* Contenu principal */}
        <main className="flex-1 w-full chat-content">
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
    </div>
  );
};

// Application principale
const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContainer />
      <Toaster />
    </QueryClientProvider>
  );
};

export default App;

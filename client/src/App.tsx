import React, { useEffect } from "react";
import { Route, Switch } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Header from "@/components/layout/Header";
import ChatAssistant from "@/pages/ChatAssistant";
import { setupMobileViewportFix } from "./lib/mobileViewportFix";

// Configuration des routes
const routes = [
  { path: "/", Component: ChatAssistant },
  { path: "/chat-assistant", Component: ChatAssistant }
];

// App optimisé pour mobile avec gestion du viewport adaptatif
const AppContainer = () => {
  // Initialiser la gestion du viewport et du clavier mobile
  useEffect(() => {
    setupMobileViewportFix();
  }, []);

  return (
    <div className="app-container">
      {/* Header fixe en haut avec id pour ciblage JavaScript */}
      <Header />
      
      {/* Contenu défilable avec positionnement automatique */}
      <div className="scrollable-content">
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
      </div>
      
      {/* La zone de composer/input sera automatiquement gérée par le script */}
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

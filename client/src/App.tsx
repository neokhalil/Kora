import React from "react";
import { Route, Switch } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Header from "@/components/layout/Header";
import ChatAssistant from "@/pages/ChatAssistant";

// Configuration des routes
const routes = [
  { path: "/", Component: ChatAssistant },
  { path: "/chat-assistant", Component: ChatAssistant }
];

// App simplifié sans menu latéral
const AppContainer = () => {
  return (
    <div className="flex flex-col h-full app-container">
      {/* Header fixe en haut */}
      <Header />
      
      {/* Div supprimé car le padding-top est déjà sur #root */}
      <div className="flex h-full">
        {/* Contenu principal - ajout de la classe main-content pour les styles mobiles */}
        <main className="flex-1 overflow-y-auto w-full main-content">
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

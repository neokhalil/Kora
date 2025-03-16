import React from "react";
import { Route, Switch } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Header from "@/components/layout/Header";
import ChatAssistant from "@/pages/ChatAssistant";
import Home from "@/pages/Home";
import MathTest from "@/pages/MathTest";
import MathCodeTest from "@/pages/MathCodeTest";
import { AuthProvider } from "@/hooks/use-auth";

// Configuration des routes
const routes = [
  { path: "/", Component: Home },
  { path: "/home", Component: Home },
  { path: "/chat-assistant", Component: ChatAssistant },
  { path: "/math-test", Component: MathTest },
  { path: "/math-code-test", Component: MathCodeTest }
];

// App simplifié sans menu latéral
const AppContainer = () => {
  return (
    <div className="flex flex-col h-full">
      {/* Header fixe en haut */}
      <Header />
      
      <div className="flex h-full">
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
    </div>
  );
};

// Application principale
const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppContainer />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;

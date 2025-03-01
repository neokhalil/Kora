import * as React from "react";
import { Route, Router as WouterRouter, Switch, useLocation } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Header from "@/components/layout/Header";
import SideNavigation from "@/components/layout/SideNavigation";
import ChatAssistant from "@/pages/ChatAssistant";
import { MenuProvider } from "@/hooks/use-menu";

// Set up static route config with only the ChatAssistant
const routes = [
  { path: "/", Component: ChatAssistant }
];

// Router component
const AppRouter: React.FC = () => {
  // Only log in development
  if (process.env.NODE_ENV === 'development') {
    // Log all registered routes once during initialization
    React.useEffect(() => {
      console.log("Available routes:", routes.map(r => r.path));
    }, []);
  }
  
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

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <MenuProvider>
        <div className="min-h-screen flex flex-col ios-fix">
          <Header />
          <div className="flex flex-1 relative"> {/* Nous n'avons plus besoin de pt-16 car body a un padding-top */}
            <SideNavigation />
            <main className="flex-1 mx-auto w-full max-w-screen-xl p-4">
              <AppRouter />
            </main>
          </div>
        </div>
        <Toaster />
      </MenuProvider>
    </QueryClientProvider>
  );
};

export default App;

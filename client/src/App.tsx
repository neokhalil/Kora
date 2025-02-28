import * as React from "react";
import { Route, Router as WouterRouter, Switch } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Header from "@/components/layout/Header";
import SideNavigation from "@/components/layout/SideNavigation";
import Home from "@/pages/Home";
import HomeworkHelp from "@/pages/HomeworkHelp";
import ExamPrep from "@/pages/ExamPrep";
import InteractiveLessons from "@/pages/InteractiveLessons";
import ChatAssistant from "@/pages/ChatAssistant";
import TestPage from "@/pages/TestPage";
import { MenuProvider } from "@/hooks/use-menu";

// Set up static route config for debugging
const routes = [
  { path: "/", Component: Home },
  { path: "/aide-aux-devoirs", Component: HomeworkHelp },
  { path: "/preparation-examens", Component: ExamPrep },
  { path: "/lecons-interactives", Component: InteractiveLessons },
  { path: "/chat-assistant", Component: ChatAssistant },
  { path: "/test", Component: TestPage }
];

// Simple router with enhanced debugging
const AppRouter: React.FC = () => {
  // Track the current path manually
  const [currentPath, setCurrentPath] = React.useState(window.location.pathname);
  
  // Update currentPath when location changes
  React.useEffect(() => {
    console.log("Current location in AppRouter:", currentPath);
    
    // Listen for location changes
    const handleLocationChange = () => {
      setCurrentPath(window.location.pathname);
    };
    
    // Add event listener
    window.addEventListener('popstate', handleLocationChange);
    
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
    };
  }, [currentPath]);
  
  // Debugging helper - log all route registrations
  React.useEffect(() => {
    console.log("Available routes:", routes.map(r => r.path));
    
    // Force rerender on first load to ensure routes are properly registered
    const timer = setTimeout(() => {
      console.log("Routes initialized");
    }, 200);
    
    return () => clearTimeout(timer);
  }, []);
  
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
        <div className="min-h-screen flex flex-col">
          <Header />
          <div className="flex flex-1 relative">
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

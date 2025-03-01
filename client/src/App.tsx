import * as React from "react";
import { Route, Router as WouterRouter, Switch, useLocation } from "wouter";
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
import LearningHistory from "@/pages/LearningHistory";
import TestPage from "@/pages/TestPage";
import { MenuProvider } from "@/hooks/use-menu";

// Set up static route config for debugging
const routes = [
  { path: "/", Component: Home },
  { path: "/preparation-examens", Component: ExamPrep },
  { path: "/lecons-interactives", Component: InteractiveLessons },
  { path: "/chat-assistant", Component: ChatAssistant },
  { path: "/historique", Component: LearningHistory },
  { path: "/test", Component: TestPage }
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
  
  // Create router with redirect
  const Redirect = ({ to }: { to: string }) => {
    const [_, setLocation] = useLocation();
    React.useEffect(() => {
      setLocation(to);
    }, [to, setLocation]);
    return null;
  };
  
  return (
    <Switch>
      {/* Redirect /aide-aux-devoirs to /chat-assistant */}
      <Route path="/aide-aux-devoirs">
        <Redirect to="/chat-assistant" />
      </Route>
      
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

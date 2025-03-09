import React from "react";
import { Route, Switch } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Header from "@/components/layout/Header";
import SideNavigation from "@/components/layout/SideNavigation";
import ChatAssistant from "@/pages/ChatAssistant";
import ExamPrep from "@/pages/ExamPrep";
import HomeworkHelp from "@/pages/HomeworkHelp";
import InteractiveLessons from "@/pages/InteractiveLessons";
import LearningHistory from "@/pages/LearningHistory";

// Configuration des routes
const routes = [
  { path: "/", Component: ChatAssistant },
  { path: "/chat-assistant", Component: ChatAssistant },
  { path: "/homework-help", Component: HomeworkHelp },
  { path: "/exam-prep", Component: ExamPrep },
  { path: "/interactive-lessons", Component: InteractiveLessons },
  { path: "/learning-history", Component: LearningHistory }
];

// App avec menu latéral responsive
const AppContainer = () => {
  return (
    <div className="flex flex-col h-full">
      {/* Header fixe en haut */}
      <Header />
      
      {/* Navigation latérale pour grand écran */}
      <SideNavigation />
      
      <div className="flex h-full">
        {/* Contenu principal avec marge à gauche sur les écrans larges */}
        <main className="flex-1 overflow-y-auto w-full md:pl-64">
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

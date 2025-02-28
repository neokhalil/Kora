import * as React from "react";
import { Switch, Route } from "wouter";
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

const Router: React.FC = () => {
  // Log the current routes for debugging
  console.log("Router component rendering with routes");
  
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/aide-aux-devoirs">{(params) => <HomeworkHelp />}</Route>
      <Route path="/preparation-examens">{(params) => <ExamPrep />}</Route>
      <Route path="/lecons-interactives">{(params) => <InteractiveLessons />}</Route>
      <Route path="/chat-assistant">{(params) => <ChatAssistant />}</Route>
      <Route path="/test">{(params) => <TestPage />}</Route>
      <Route>{(params) => <NotFound />}</Route>
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
            <main className="flex-1 mx-auto w-full max-w-screen-xl">
              <Router />
            </main>
          </div>
        </div>
        <Toaster />
      </MenuProvider>
    </QueryClientProvider>
  );
};

export default App;

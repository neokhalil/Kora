import * as React from "react";
import { useEffect, useRef } from "react";
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

// Fonction pour détecter les appareils mobiles
const isMobile = (): boolean => {
  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
};

// Fonction pour détecter iOS
const isIOS = (): boolean => {
  return /iPhone|iPad|iPod/i.test(navigator.userAgent) && !(window as any).MSStream;
};

// Fonction pour détecter Android
const isAndroid = (): boolean => {
  return /Android/i.test(navigator.userAgent);
};

const App: React.FC = () => {
  const headerRef = useRef<HTMLDivElement>(null);

  // Effet pour suivre l'ouverture/fermeture du clavier
  useEffect(() => {
    const handleVisibilityFix = () => {
      // Forcer le header à être visible et bien positionné
      if (headerRef.current) {
        headerRef.current.style.position = 'fixed';
        headerRef.current.style.top = '0';
        headerRef.current.style.zIndex = '10000';
        headerRef.current.style.opacity = '1';
        headerRef.current.style.transform = 'none';
        headerRef.current.style.visibility = 'visible';
      }
    };

    // Détecter le type d'appareil et ajouter les classes appropriées
    const mobile = isMobile();
    const ios = isIOS();
    const android = isAndroid();
    
    if (mobile) document.body.classList.add('mobile-device');
    if (ios) document.body.classList.add('ios-device');
    if (android) document.body.classList.add('android-device');
    
    // Événements pour garder le header visible
    document.addEventListener('focusin', handleVisibilityFix);
    document.addEventListener('click', handleVisibilityFix);
    
    // Pour les appareils avec visualViewport API
    if ('visualViewport' in window) {
      window.visualViewport?.addEventListener('resize', handleVisibilityFix);
      window.visualViewport?.addEventListener('scroll', handleVisibilityFix);
    }
    
    // Focus sur un champ avec le header visible
    const handleInputFocus = (e: Event) => {
      handleVisibilityFix();
      document.body.classList.add('input-focused');
    };
    
    const handleInputBlur = () => {
      document.body.classList.remove('input-focused');
    };
    
    // Attacher les gestionnaires d'événements aux entrées existantes
    const addFocusHandlers = () => {
      const inputs = document.querySelectorAll('input, textarea');
      inputs.forEach(input => {
        input.addEventListener('focus', handleInputFocus as EventListener);
        input.addEventListener('blur', handleInputBlur as EventListener);
      });
    };
    
    // Ajouter les gestionnaires maintenant
    addFocusHandlers();
    
    // Observer les nouvelles entrées
    const observer = new MutationObserver(() => {
      addFocusHandlers();
    });
    
    observer.observe(document.body, { childList: true, subtree: true });
    
    // Nettoyage
    return () => {
      document.removeEventListener('focusin', handleVisibilityFix);
      document.removeEventListener('click', handleVisibilityFix);
      
      if ('visualViewport' in window) {
        window.visualViewport?.removeEventListener('resize', handleVisibilityFix);
        window.visualViewport?.removeEventListener('scroll', handleVisibilityFix);
      }
      
      const inputs = document.querySelectorAll('input, textarea');
      inputs.forEach(input => {
        input.removeEventListener('focus', handleInputFocus as EventListener);
        input.removeEventListener('blur', handleInputBlur as EventListener);
      });
      
      observer.disconnect();
    };
  }, []);
  
  // Retourner l'application avec les wrapper pour forcer le header à rester visible
  return (
    <QueryClientProvider client={queryClient}>
      <MenuProvider>
        <div className="app-wrapper min-h-screen flex flex-col ios-fix android-fix" style={{ paddingTop: 'calc(var(--header-height) + var(--safe-area-top, 0px))' }}>
          <div ref={headerRef} className="fixed-header sticky-top">
            <Header />
          </div>
          <div className="flex flex-1 relative app-content">
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

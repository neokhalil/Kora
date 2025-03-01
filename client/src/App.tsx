import * as React from "react";
import { useEffect } from "react";
import { Route, Switch } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Header from "@/components/layout/Header";
import SideNavigation from "@/components/layout/SideNavigation";
import ChatAssistant from "@/pages/ChatAssistant";
import { MenuProvider } from "@/hooks/use-menu";

// Configuration des routes
const routes = [
  { path: "/", Component: ChatAssistant }
];

// Composant de routage
const AppRouter: React.FC = () => {
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

// Fonctions utilitaires de détection d'appareil
const detectDevice = () => {
  const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent) && !(window as any).MSStream;
  const isAndroid = /Android/i.test(navigator.userAgent);
  const isMobile = isIOS || isAndroid;
  
  return { isIOS, isAndroid, isMobile };
};

// Composant principal de l'application
const App: React.FC = () => {
  // Effet pour configurer les ajustements mobiles
  useEffect(() => {
    const { isIOS, isAndroid, isMobile } = detectDevice();
    
    // Ajouter des classes au body pour le ciblage CSS
    if (isMobile) document.body.classList.add('mobile-device');
    if (isIOS) document.body.classList.add('ios-device');
    if (isAndroid) document.body.classList.add('android-device');
    
    // Créer un header mobile distinct qui ne disparaît jamais
    const mobileHeader = document.createElement('div');
    mobileHeader.id = 'header-mobile';
    document.body.prepend(mobileHeader);
    
    // Déplacer le contenu du header normal vers mobileHeader
    const renderHeaderIntoContainer = () => {
      const headerContent = document.querySelector('header.app-header');
      const mobileHeaderElement = document.getElementById('header-mobile');
      
      if (headerContent && mobileHeaderElement) {
        // Rendre le header normal invisible s'il s'agit d'un appareil mobile
        if (isMobile) {
          headerContent.classList.add('invisible-header');
          headerContent.setAttribute('aria-hidden', 'true');
        }
        
        // Cloner et insérer le contenu du header dans le container mobile
        if (mobileHeaderElement.children.length === 0) {
          const headerClone = headerContent.cloneNode(true) as HTMLElement;
          headerClone.style.position = 'static';
          headerClone.style.paddingTop = '0';
          mobileHeaderElement.appendChild(headerClone);
        }
      }
    };
    
    // Exécuter une fois et configurer un observateur pour les changements
    renderHeaderIntoContainer();
    
    // Observer les changements dans le DOM
    const observer = new MutationObserver(() => {
      renderHeaderIntoContainer();
    });
    
    observer.observe(document.body, { childList: true, subtree: true });
    
    // Pour le clavier mobile, suivre l'état de visualViewport
    if ('visualViewport' in window) {
      const handleViewportChange = () => {
        const viewportHeight = window.visualViewport?.height || 0;
        const windowHeight = window.innerHeight;
        const keyboardHeight = windowHeight - viewportHeight;
        
        // Mettre à jour les propriétés CSS
        if (keyboardHeight > 100) {
          document.body.classList.add('keyboard-open');
        } else {
          document.body.classList.remove('keyboard-open');
        }
      };
      
      window.visualViewport?.addEventListener('resize', handleViewportChange);
      window.visualViewport?.addEventListener('scroll', handleViewportChange);
      
      return () => {
        window.visualViewport?.removeEventListener('resize', handleViewportChange);
        window.visualViewport?.removeEventListener('scroll', handleViewportChange);
        observer.disconnect();
      };
    }
    
    return () => {
      observer.disconnect();
    };
  }, []);
  
  return (
    <QueryClientProvider client={queryClient}>
      <MenuProvider>
        {/* Container principal avec id 'content' pour le style CSS */}
        <div id="content" className="min-h-screen flex flex-col">
          {/* Le vrai header (caché sur mobile, remplacé par #header-mobile) */}
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

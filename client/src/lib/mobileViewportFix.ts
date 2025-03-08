/**
 * Script optimisé pour la gestion du viewport mobile
 * Garantit que le header et la zone de saisie restent visibles même quand le clavier est ouvert
 */

export function setupMobileViewportFix() {
  if (typeof window === 'undefined') return;

  // Configuration du viewport pour les appareils mobiles
  const metaViewport = document.querySelector('meta[name="viewport"]');
  if (metaViewport) {
    metaViewport.setAttribute('content', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover');
  }

  // Ajout d'une variable pour suivre l'état du clavier
  let isKeyboardOpen = false;
  let lastViewportHeight = window.innerHeight;

  // Détection avancée des plateformes
  const ua = navigator.userAgent;
  
  // Détection iOS plus précise
  const isIOS = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
  
  // Détection Android plus précise avec version
  const androidMatch = ua.match(/Android\s([0-9.]+)/);
  const isAndroid = androidMatch !== null;
  const androidVersion = isAndroid && androidMatch ? parseFloat(androidMatch[1]) : 0;
  
  // Détection de navigateurs spécifiques sur mobile
  const isChrome = /Chrome\/([0-9.]+)/.test(ua);
  const isSamsung = /SamsungBrowser\/([0-9.]+)/.test(ua);
  const isFirefox = /Firefox\/([0-9.]+)/.test(ua);
  
  // Ajouter des classes CSS pour le ciblage conditionnel
  if (isIOS) {
    document.body.classList.add('ios-device');
    // Détection des modèles récents avec notch
    if (/iPhone X|iPhone 11|iPhone 12|iPhone 13|iPhone 14|iPhone 15/.test(ua)) {
      document.body.classList.add('ios-notch');
    }
  }
  
  if (isAndroid) {
    document.body.classList.add('android-device');
    document.body.classList.add(`android-${Math.floor(androidVersion)}`);
    
    // Classes spécifiques pour les navigateurs
    if (isChrome) document.body.classList.add('chrome-browser');
    if (isSamsung) document.body.classList.add('samsung-browser');
    if (isFirefox) document.body.classList.add('firefox-browser');
  }
  
  /**
   * Fonction qui garantit que les éléments d'interface restent bien positionnés
   * quand le clavier virtuel est ouvert
   */
  function handleKeyboardVisibilityChange(isOpen: boolean) {
    if (isOpen === isKeyboardOpen) return; // Éviter les traitements redondants
    
    isKeyboardOpen = isOpen;
    
    if (isOpen) {
      document.body.classList.add('keyboard-open');
      
      // Forcer un repositionnement de la zone de saisie pour qu'elle reste visible
      const composer = document.querySelector('.composer-container');
      if (composer && composer instanceof HTMLElement) {
        composer.style.position = 'fixed';
        composer.style.bottom = '0';
      }
      
      // Sur Android, s'assurer que le contenu reste visible
      if (isAndroid) {
        setTimeout(() => {
          const messagesEnd = document.querySelector('[data-scroll-anchor]');
          if (messagesEnd && messagesEnd instanceof HTMLElement) {
            messagesEnd.scrollIntoView({ behavior: 'smooth' });
          }
        }, 300);
      }
    } else {
      document.body.classList.remove('keyboard-open');
      
      // Restaurer la position normale des éléments
      if (isAndroid) {
        // Forcer un petit défilement pour réinitialiser la vue
        window.scrollTo(0, 1);
        window.scrollTo(0, 0);
      }
    }
    
    // Mise à jour du layout
    ensureHeaderPosition();
    setAppHeight();
  }
  
  /**
   * Fonction qui garantit que le header reste bien positionné
   * Centralise la logique pour éviter les redondances
   */
  function ensureHeaderPosition() {
    const header = document.getElementById('kora-header-container');
    if (!header) return;
    
    // Détection du support des safe-area-inset
    const supportsSafeArea = typeof CSS !== 'undefined' && CSS.supports('top: env(safe-area-inset-top)');
    const safeAreaTop = supportsSafeArea ? 'env(safe-area-inset-top, 0)' : '0';
    
    // S'assurer que le z-index est toujours élevé
    header.style.zIndex = '9999';
    header.style.borderBottom = 'none';
    
    // Comportement spécifique quand le clavier est ouvert
    if (isKeyboardOpen) {
      // Assurer que le header reste visible même avec le clavier ouvert
      header.style.position = 'fixed';
      header.style.top = '0';
      header.style.width = '100%';
      header.style.zIndex = '9999';
      
      // Différences de comportement selon les plateformes
      if (isAndroid) {
        header.style.position = 'fixed';
      }
    } else {
      // Comportement normal sans clavier
      header.style.position = 'fixed';
      header.style.top = '0';
      
      // Ajustements spécifiques selon la plateforme
      if (isAndroid) {
        if (androidVersion < 10) {
          header.style.height = '56px';
          header.style.paddingTop = '0';
        }
      } else if (isIOS && supportsSafeArea) {
        header.style.paddingTop = safeAreaTop;
        header.style.height = `calc(56px + ${safeAreaTop})`;
      }
    }
  }
  
  /**
   * Mise à jour de la hauteur de l'application et détection du clavier
   * Cette fonction est cruciale pour l'expérience mobile
   */
  function setAppHeight() {
    const currentHeight = window.innerHeight;
    const viewportHeight = currentHeight;
    
    // Définir les variables CSS utilisées pour le layout
    document.documentElement.style.setProperty('--app-height', `${viewportHeight}px`);
    
    // Détecter l'ouverture du clavier par changement significatif de hauteur
    if (lastViewportHeight > 0 && currentHeight < lastViewportHeight * 0.8) {
      // Le clavier est probablement ouvert
      document.documentElement.style.setProperty('--keyboard-height', `${lastViewportHeight - currentHeight}px`);
      handleKeyboardVisibilityChange(true);
    } else if (lastViewportHeight > 0 && currentHeight > lastViewportHeight * 0.9) {
      // Le clavier est probablement fermé
      document.documentElement.style.setProperty('--keyboard-height', '0px');
      handleKeyboardVisibilityChange(false);
    }
    
    // Mémoriser la hauteur actuelle pour la comparaison suivante
    lastViewportHeight = currentHeight;
    
    // Assurer la position du header
    ensureHeaderPosition();
  }
  
  // Initialisation
  setAppHeight();
  
  // Écouteurs d'événements standard
  window.addEventListener('resize', setAppHeight);
  
  // Gestionnaire de défilement amélioré
  let isScrolling = false;
  let scrollTimeout: number | null = null;
  
  window.addEventListener('scroll', () => {
    // Exécuter la fonction de positionnement du header
    ensureHeaderPosition();
    
    // Détecter l'état de défilement et ajouter une classe temporaire
    if (!isScrolling && isKeyboardOpen) {
      isScrolling = true;
      document.body.classList.add('scrolling');
    }
    
    // Réinitialiser le délai à chaque événement de défilement
    if (scrollTimeout !== null) {
      window.clearTimeout(scrollTimeout);
    }
    
    // Définir un délai après lequel on considère que le défilement est terminé
    scrollTimeout = window.setTimeout(() => {
      isScrolling = false;
      document.body.classList.remove('scrolling');
    }, 150) as unknown as number;
  });
  
  // Gestion améliorée de l'orientation
  window.addEventListener('orientationchange', () => {
    // Réinitialiser l'état du clavier lors d'un changement d'orientation
    handleKeyboardVisibilityChange(false);
    
    // Fermer le clavier si possible lors d'un changement d'orientation
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    
    // Nettoyer les classes spéciales
    document.body.classList.remove('keyboard-open', 'scrolling');
    
    // Sur Android, attendre un court instant après le changement d'orientation
    setAppHeight();
    
    // Séquence de recalcul et repositionnement pour tous les appareils
    setTimeout(() => {
      // Recalculer les hauteurs
      setAppHeight();
      ensureHeaderPosition();
      
      // Forcer un petit défilement pour déclencher les recalculs du navigateur
      window.scrollTo(0, 1);
      window.scrollTo(0, 0);
      
      // S'assurer que le header et la zone de composition sont correctement positionnés
      const header = document.getElementById('kora-header-container');
      const composer = document.querySelector('.composer-container');
      
      if (header) {
        header.style.position = 'fixed';
        header.style.top = '0';
        header.style.zIndex = '9999';
      }
      
      if (composer && composer instanceof HTMLElement) {
        composer.style.position = 'fixed';
        composer.style.bottom = '0';
      }
    }, 150);
    
    // Second délai plus long pour finaliser les ajustements
    setTimeout(() => {
      setAppHeight();
      ensureHeaderPosition();
      
      // S'assurer que tout l'affichage est correct après l'orientation
      const messagesEnd = document.querySelector('[data-scroll-anchor]');
      if (messagesEnd && messagesEnd instanceof HTMLElement) {
        messagesEnd.scrollIntoView({ behavior: 'auto' });
      }
    }, 500);
  });
  
  // Utilisation de l'API Visual Viewport pour une meilleure détection du clavier
  const visualViewport = window.visualViewport;
  if (visualViewport) {
    visualViewport.addEventListener('resize', () => {
      if (visualViewport) {
        // Mise à jour de l'app-height basée sur le viewportHeight
        document.documentElement.style.setProperty('--app-height', `${visualViewport.height}px`);
        
        // Détecter l'ouverture du clavier via Visual Viewport
        const winHeight = window.innerHeight;
        if (visualViewport.height < winHeight * 0.8) {
          // Clavier ouvert
          document.documentElement.style.setProperty('--keyboard-height', `${winHeight - visualViewport.height}px`);
          handleKeyboardVisibilityChange(true);
        } else {
          // Clavier fermé
          document.documentElement.style.setProperty('--keyboard-height', '0px');
          handleKeyboardVisibilityChange(false);
        }
      }
      
      // Toujours appeler ensureHeaderPosition
      ensureHeaderPosition();
    });
    
    visualViewport.addEventListener('scroll', ensureHeaderPosition);
  }
  
  // Détection de focus sur les champs de saisie (pour détecter le clavier)
  document.addEventListener('focusin', (e) => {
    const target = e.target as HTMLElement;
    
    // Vérifier si le focus est sur un champ de saisie
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
      // Forcer la classe keyboard-open
      document.body.classList.add('keyboard-open');
      
      // Sur Android, ajouter un délai pour éviter les problèmes de timing
      if (isAndroid) {
        setTimeout(() => handleKeyboardVisibilityChange(true), 200);
      } else {
        handleKeyboardVisibilityChange(true);
      }
    }
  });
  
  // Détection de perte de focus (fermeture possible du clavier)
  document.addEventListener('focusout', (e) => {
    // Sur iOS, le focusout est fiable pour détecter la fermeture du clavier
    if (isIOS) {
      handleKeyboardVisibilityChange(false);
    }
    
    // Sur Android, on ne peut pas se fier uniquement au focusout
    // car le clavier peut rester ouvert même après un focusout
    if (isAndroid) {
      // Vérifier si la hauteur a changé significativement
      setTimeout(() => {
        const currentHeight = window.innerHeight;
        if (currentHeight > lastViewportHeight * 0.95) {
          handleKeyboardVisibilityChange(false);
        }
      }, 300);
    }
    
    ensureHeaderPosition();
  });
  
  // Gestionnaire pour permettre au code externe de forcer la réinitialisation
  window.resetKeyboardState = () => {
    handleKeyboardVisibilityChange(false);
    setAppHeight();
  };
}
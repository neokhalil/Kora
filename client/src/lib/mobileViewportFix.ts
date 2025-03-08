/**
 * Script optimisé pour la gestion du viewport mobile
 * Garantit que le header et la zone de composition restent visibles même quand le clavier est ouvert
 */

export function setupMobileViewportFix() {
  if (typeof window === 'undefined') return;

  // Configuration du viewport pour les appareils mobiles
  const metaViewport = document.querySelector('meta[name="viewport"]');
  if (metaViewport) {
    metaViewport.setAttribute('content', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover');
  }

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
  
  // Variable pour suivre l'état du clavier
  let isKeyboardVisible = false;
  
  // Détection plus précise de l'apparition du clavier
  const detectKeyboardVisibility = () => {
    // Hauteur de la fenêtre visible
    const windowHeight = window.innerHeight;
    // Hauteur totale de l'écran (sans tenir compte du clavier)
    const screenHeight = window.screen.height;
    
    // Sur iOS, la différence entre screen et window height indique l'apparition du clavier
    // Sur Android, c'est un peu plus complexe car certains appareils redimensionnent différemment
    if (isIOS) {
      const keyboardThreshold = 150; // Différence minimale pour considérer que le clavier est visible
      const newKeyboardVisible = (screenHeight - windowHeight) > keyboardThreshold;
      
      if (newKeyboardVisible !== isKeyboardVisible) {
        isKeyboardVisible = newKeyboardVisible;
        if (isKeyboardVisible) {
          document.body.classList.add('keyboard-open');
        } else {
          document.body.classList.remove('keyboard-open');
        }
        adjustInterface();
      }
    } else if (isAndroid) {
      // Pour Android, on utilise une proportion
      const visibleRatio = windowHeight / screenHeight;
      const newKeyboardVisible = visibleRatio < 0.8; // Si moins de 80% de l'écran est visible
      
      if (newKeyboardVisible !== isKeyboardVisible) {
        isKeyboardVisible = newKeyboardVisible;
        if (isKeyboardVisible) {
          document.body.classList.add('keyboard-open');
        } else {
          document.body.classList.remove('keyboard-open');
        }
        adjustInterface();
      }
    }
  };
  
  /**
   * Fonction centrale qui ajuste tous les éléments de l'interface
   * Gère à la fois le header et la zone de composer
   */
  function adjustInterface() {
    ensureHeaderPosition();
    ensureComposerPosition();
    setAppHeight();
  }
  
  /**
   * Fonction qui garantit que le header reste bien positionné
   */
  function ensureHeaderPosition() {
    const header = document.getElementById('kora-header-container');
    if (!header) return;
    
    // Détection du support des safe-area-inset
    const supportsSafeArea = typeof CSS !== 'undefined' && CSS.supports('top: env(safe-area-inset-top)');
    
    // S'assurer que le z-index est toujours élevé
    header.style.zIndex = '9999';
    
    // Ajustements spécifiques selon la plateforme
    if (isAndroid) {
      if (isKeyboardVisible) {
        // Si le clavier est ouvert sur Android, s'assurer que le header reste visible
        header.style.position = 'absolute';
        header.style.top = '0';
      } else {
        // Sinon, revenir à l'état normal
        header.style.position = 'fixed';
        header.style.top = '0';
      }
      
      // Ajustements spécifiques selon la version Android
      if (androidVersion < 10) {
        header.style.height = '56px';
        header.style.paddingTop = '0';
      }
    } else if (isIOS) {
      // Sur iOS, on maintient le header fixe même avec le clavier
      header.style.position = 'fixed';
      
      // Sur iOS, utiliser les valeurs safe-area quand disponibles
      if (supportsSafeArea) {
        header.style.paddingTop = 'env(safe-area-inset-top, 0)';
        header.style.height = 'calc(56px + env(safe-area-inset-top, 0))';
      }
    }
  }
  
  /**
   * Fonction qui garantit que la zone de composition reste bien positionnée
   */
  function ensureComposerPosition() {
    const composer = document.querySelector('.message-composer') as HTMLElement;
    if (!composer) return;
    
    if (isKeyboardVisible) {
      // Quand le clavier est visible, ajuster la position
      if (isAndroid) {
        composer.style.position = 'absolute';
        composer.style.bottom = '0';
      } else if (isIOS) {
        composer.style.position = 'fixed';
        composer.style.bottom = '0';
      }
    } else {
      // Quand le clavier n'est pas visible, revenir à la position normale
      if (window.innerWidth < 1024) { // Mobile et tablette
        composer.style.position = 'fixed';
        composer.style.bottom = 'env(safe-area-inset-bottom, 0)';
      } else { // Desktop
        composer.style.position = 'sticky';
        composer.style.bottom = '0';
      }
    }
  }
  
  /**
   * Mise à jour de la hauteur de l'application
   * Cette variable CSS est utilisée pour les calculs de hauteur dynamique
   */
  function setAppHeight() {
    // Mettre à jour --app-height
    if (isKeyboardVisible) {
      // Si le clavier est visible, utiliser visualViewport si disponible
      if (window.visualViewport) {
        document.documentElement.style.setProperty('--app-height', `${window.visualViewport.height}px`);
      } else {
        document.documentElement.style.setProperty('--app-height', `${window.innerHeight}px`);
      }
    } else {
      // Si le clavier n'est pas visible, utiliser la hauteur standard
      document.documentElement.style.setProperty('--app-height', `${window.innerHeight}px`);
    }
    
    // Ajuster le scroll pour s'assurer que le contenu est visible
    if (isKeyboardVisible) {
      // Chercher l'élément avec la référence messagesEndRef
      const messagesEnd = document.querySelector('.messages-end-ref');
      if (messagesEnd) {
        messagesEnd.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }
  
  // Initialisation
  setAppHeight();
  
  // Écouteurs d'événements standard
  window.addEventListener('resize', () => {
    detectKeyboardVisibility();
    adjustInterface();
  });
  
  window.addEventListener('scroll', () => {
    ensureHeaderPosition();
  });
  
  // Gestion améliorée de l'orientation
  window.addEventListener('orientationchange', () => {
    // Sur mobile, attendre un court instant après le changement d'orientation
    setTimeout(() => {
      detectKeyboardVisibility();
      adjustInterface();
    }, 150);
    
    // Second délai plus long pour certains appareils plus lents
    setTimeout(() => {
      detectKeyboardVisibility();
      adjustInterface();
    }, 500);
  });
  
  // Gestion spécifique du clavier mobile via Visual Viewport API
  const visualViewport = window.visualViewport;
  if (visualViewport) {
    visualViewport.addEventListener('resize', () => {
      detectKeyboardVisibility();
      document.documentElement.style.setProperty('--app-height', `${visualViewport.height}px`);
      adjustInterface();
    });
    
    visualViewport.addEventListener('scroll', () => {
      ensureHeaderPosition();
    });
  }
  
  // Détection de focus sur les champs de saisie (pour le clavier)
  document.addEventListener('focusin', (e) => {
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
      document.body.classList.add('keyboard-open');
      isKeyboardVisible = true;
      adjustInterface();
      
      // Délai pour s'assurer que tout est ajusté après l'ouverture du clavier
      setTimeout(adjustInterface, 300);
    }
  });
  
  document.addEventListener('focusout', (e) => {
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
      // Attendre un peu avant de supposer que le clavier est fermé
      // car le focus peut passer d'un champ de saisie à un autre
      setTimeout(() => {
        const activeElement = document.activeElement as HTMLElement;
        if (!(activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA'))) {
          document.body.classList.remove('keyboard-open');
          isKeyboardVisible = false;
          adjustInterface();
        }
      }, 100);
    }
  });
}
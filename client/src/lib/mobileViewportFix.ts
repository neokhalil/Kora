/**
 * Script optimisé pour la gestion du viewport mobile
 * Solution complète pour garantir que le header reste visible pendant l'utilisation du clavier
 */

export function setupMobileViewportFix() {
  if (typeof window === 'undefined') return;

  // Détection des plateformes
  const ua = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
  const isAndroid = /Android/.test(ua);
  const androidMatch = ua.match(/Android\s([0-9.]+)/);
  const androidVersion = isAndroid && androidMatch ? parseFloat(androidMatch[1]) : 0;
  
  // Détection de navigateurs spécifiques
  const isChrome = /Chrome\/([0-9.]+)/.test(ua);
  const isSamsung = /SamsungBrowser\/([0-9.]+)/.test(ua);
  const isFirefox = /Firefox\/([0-9.]+)/.test(ua);
  
  // Ajouter des classes pour la détection CSS
  if (isIOS) {
    document.body.classList.add('ios-device');
    if (/iPhone X|iPhone 11|iPhone 12|iPhone 13|iPhone 14|iPhone 15/.test(ua)) {
      document.body.classList.add('ios-notch');
    }
  }
  
  if (isAndroid) {
    document.body.classList.add('android-device');
    document.body.classList.add(`android-${Math.floor(androidVersion)}`);
    if (isChrome) document.body.classList.add('chrome-browser');
    if (isSamsung) document.body.classList.add('samsung-browser');
    if (isFirefox) document.body.classList.add('firefox-browser');
  }

  /**
   * Gestionnaire principal pour les changements de viewport
   * Gère à la fois le clavier et les changements d'orientation
   */
  function handleVisualViewportChange() {
    const visualViewport = window.visualViewport;
    const viewportHeight = visualViewport?.height || window.innerHeight;
    const viewportWidth = visualViewport?.width || window.innerWidth;
    
    // Mettre à jour les variables CSS pour les hauteurs
    document.documentElement.style.setProperty('--viewport-height', `${viewportHeight}px`);
    document.documentElement.style.setProperty('--app-height', `${window.innerHeight}px`);
    
    // Détection du clavier ouvert
    const isKeyboardOpen = window.innerHeight > viewportHeight + 150;
    if (isKeyboardOpen) {
      document.body.classList.add('keyboard-open');
      // Calculer la hauteur approximative du clavier
      const keyboardHeight = window.innerHeight - viewportHeight;
      document.documentElement.style.setProperty('--keyboard-height', `${keyboardHeight}px`);
    } else {
      document.body.classList.remove('keyboard-open');
      document.documentElement.style.setProperty('--keyboard-height', '0px');
    }
    
    // Ajuster la position du composer (zone de texte) si présente
    adjustComposerPosition(isKeyboardOpen, viewportHeight);
    
    // Assurer que le header reste correctement positionné
    ensureHeaderPosition(isKeyboardOpen);
  }
  
  /**
   * Ajuster la position de la zone de saisie
   */
  function adjustComposerPosition(isKeyboardOpen: boolean, viewportHeight: number) {
    // Sélecteurs pour trouver les zones de saisie
    const selectors = [
      '.composer', 
      '.message-input',
      '.input-container',
      '.message-composer',
      '.chat-input-container'
    ];
    
    // Chercher la zone de saisie avec différents sélecteurs possibles
    let composer = null;
    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element) {
        composer = element;
        break;
      }
    }
    
    if (!composer) return;
    
    if (isKeyboardOpen) {
      // Si le clavier est ouvert, positionner la zone de saisie juste au-dessus
      // Utiliser une logique plus sûre pour TypeScript
      let bottomOffset = 0;
      
      if (window.visualViewport) {
        // Calculer le décalage du bas uniquement si visualViewport est disponible
        const viewportTop = window.visualViewport.offsetTop ?? 0;
        const viewportBottom = viewportTop + viewportHeight;
        bottomOffset = window.innerHeight - viewportBottom;
      }
      
      (composer as HTMLElement).style.position = 'fixed';
      (composer as HTMLElement).style.bottom = `${bottomOffset}px`;
      (composer as HTMLElement).style.zIndex = '1000';
      document.body.classList.add('composer-fixed');
    } else {
      // Sinon restaurer la position normale
      (composer as HTMLElement).style.position = '';
      (composer as HTMLElement).style.bottom = '';
      document.body.classList.remove('composer-fixed');
    }
  }
  
  /**
   * Assurer que le header reste correctement positionné
   */
  function ensureHeaderPosition(isKeyboardOpen: boolean) {
    const header = document.getElementById('kora-header-container');
    if (!header) return;
    
    // Toujours conserver un z-index élevé
    header.style.zIndex = '9999';
    
    // Supports des safe-area-inset
    const supportsSafeArea = typeof CSS !== 'undefined' && CSS.supports('top: env(safe-area-inset-top)');
    
    if (isKeyboardOpen) {
      // Lorsque le clavier est ouvert
      header.style.position = 'fixed';
      header.style.top = '0';
      if (isAndroid) {
        // Sur Android, position absolue parfois plus stable avec clavier
        if (androidVersion < 10) {
          header.style.position = 'absolute';
        }
      }
    } else {
      // Position normale
      header.style.position = 'fixed';
      header.style.top = '0';
      
      // Ajustements spécifiques par plateforme
      if (isIOS && supportsSafeArea) {
        header.style.paddingTop = 'env(safe-area-inset-top, 0)';
        header.style.height = 'calc(56px + env(safe-area-inset-top, 0))';
      } else if (isAndroid && androidVersion < 10) {
        header.style.height = '56px';
        header.style.paddingTop = '0';
      }
    }
  }
  
  // Initialisation
  handleVisualViewportChange();
  
  // Gestion du clavier via Visual Viewport API (moderne)
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', handleVisualViewportChange);
    window.visualViewport.addEventListener('scroll', handleVisualViewportChange);
  } else {
    // Fallback pour navigateurs plus anciens
    window.addEventListener('resize', handleVisualViewportChange);
  }
  
  // Gestion de l'orientation
  window.addEventListener('orientationchange', () => {
    // Appliquer immédiatement pour éviter les sauts
    handleVisualViewportChange();
    
    // Puis après un délai pour les recalculs plus précis
    setTimeout(handleVisualViewportChange, 150);
    
    // Pour les appareils plus lents, un second délai
    setTimeout(handleVisualViewportChange, 500);
  });
  
  // Focus et blur des champs de saisie
  document.addEventListener('focusin', () => {
    // Sur certains appareils, le clavier peut prendre du temps à apparaître
    setTimeout(handleVisualViewportChange, 100);
    setTimeout(handleVisualViewportChange, 300);
  });
  
  document.addEventListener('focusout', () => {
    // Délai pour permettre au clavier de se fermer complètement
    setTimeout(handleVisualViewportChange, 100);
  });
}
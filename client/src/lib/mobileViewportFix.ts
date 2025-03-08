/**
 * Script optimisé pour la gestion du viewport mobile
 * Garantit que le header reste visible même quand le clavier est ouvert
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
    
    // Ajustements spécifiques selon la plateforme
    if (isAndroid) {
      // Vérifier si le clavier est ouvert (hauteur réduite significativement)
      const isKeyboardOpen = window.innerHeight < window.outerHeight * 0.75;
      
      if (isKeyboardOpen) {
        // Si le clavier est ouvert sur Android, s'assurer que le header reste visible
        header.style.position = 'absolute';
      } else {
        // Sinon, revenir à l'état normal
        header.style.position = 'fixed';
        header.style.top = '0';
      }
      
      // Ajustements spécifiques selon la version Android
      if (androidVersion < 10) {
        // Android versions antérieures peuvent nécessiter des ajustements supplémentaires
        header.style.height = '56px';
        header.style.paddingTop = '0';
      }
    } else if (isIOS) {
      // Sur iOS, utiliser les valeurs safe-area quand disponibles
      if (supportsSafeArea) {
        header.style.paddingTop = safeAreaTop;
        header.style.height = `calc(56px + ${safeAreaTop})`;
      }
    }
  }
  
  /**
   * Mise à jour de la hauteur de l'application
   * Cette variable CSS est utilisée pour les calculs de hauteur dynamique
   */
  function setAppHeight() {
    document.documentElement.style.setProperty('--app-height', `${window.innerHeight}px`);
    ensureHeaderPosition();
  }
  
  // Initialisation
  setAppHeight();
  
  // Écouteurs d'événements standard
  window.addEventListener('resize', setAppHeight);
  window.addEventListener('scroll', ensureHeaderPosition);
  
  // Gestion améliorée de l'orientation
  window.addEventListener('orientationchange', () => {
    // Sur Android, attendre un court instant après le changement d'orientation
    // pour permettre au navigateur de recalculer correctement les dimensions
    setAppHeight();
    
    if (isAndroid) {
      // Attendre un court délai pour que les dimensions soient stables
      setTimeout(() => {
        setAppHeight();
        ensureHeaderPosition();
        
        // Forcer un petit défilement pour déclencher les recalculs du navigateur
        window.scrollTo(0, 1);
        window.scrollTo(0, 0);
      }, 150);
      
      // Second délai plus long pour certains appareils/navigateurs Android plus lents
      setTimeout(setAppHeight, 500);
    }
  });
  
  // Gestion spécifique du clavier mobile via Visual Viewport API
  const visualViewport = window.visualViewport;
  if (visualViewport) {
    visualViewport.addEventListener('resize', setAppHeight);
    visualViewport.addEventListener('scroll', ensureHeaderPosition);
    
    // Event supplémentaire pour détecter les changements de taille plus précisément
    visualViewport.addEventListener('resize', () => {
      // Mettre à jour le --app-height immédiatement
      document.documentElement.style.setProperty('--app-height', `${visualViewport.height}px`);
      ensureHeaderPosition();
    });
  }
  
  // Détection de focus sur les champs de saisie (pour le clavier)
  document.addEventListener('focusin', (e) => {
    ensureHeaderPosition();
    
    // Sur Android, ajouter un délai pour s'assurer que le header reste visible
    // après que le clavier est complètement ouvert
    if (isAndroid) {
      setTimeout(ensureHeaderPosition, 300);
    }
  });
  
  document.addEventListener('focusout', ensureHeaderPosition);
}
/**
 * Script optimisé pour la gestion du viewport mobile
 * Garantit que l'application reste visible même quand le clavier est ouvert
 * Approche unifiée pour iOS et Android avec focus sur la compatibilité
 */

export function setupMobileViewportFix() {
  if (typeof window === 'undefined') return;

  // Détection des plateformes et navigateurs
  const ua = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
  const androidMatch = ua.match(/Android\s([0-9.]+)/);
  const isAndroid = androidMatch !== null;
  const androidVersion = isAndroid && androidMatch ? parseFloat(androidMatch[1]) : 0;
  
  // Détection des navigateurs pour ciblage spécifique
  const isSafari = /Safari/i.test(ua) && !/Chrome/i.test(ua);
  const isChrome = /Chrome/i.test(ua);
  const isSamsung = /SamsungBrowser/i.test(ua);
  
  // Classes pour le ciblage CSS conditionnel
  if (isIOS) {
    document.body.classList.add('ios-device');
    if (/iPhone X|iPhone 1[1-9]/.test(ua)) {
      document.body.classList.add('ios-notch');
    }
  }
  
  if (isAndroid) {
    document.body.classList.add('android-device');
    document.body.classList.add(`android-${Math.floor(androidVersion)}`);
    
    if (isChrome) document.body.classList.add('chrome-browser');
    if (isSamsung) document.body.classList.add('samsung-browser');
  }

  // Référence au header - élément clé à maintenir visible
  const getHeader = () => document.getElementById('kora-header-container');
  
  /**
   * Gestion unifiée du viewport mobile
   * Cette approche fonctionne de manière cohérente sur iOS et Android
   */
  function updateViewport() {
    const header = getHeader();
    if (!header) return;

    // Utiliser l'API VisualViewport quand disponible (plus précise)
    const viewportHeight = window.visualViewport ? window.visualViewport.height : window.innerHeight;
    const viewportWidth = window.visualViewport ? window.visualViewport.width : window.innerWidth;
    const viewportTop = window.visualViewport ? window.visualViewport.offsetTop : 0;

    // Détecter si le clavier est probablement ouvert
    // La détection utilise le rapport hauteur/largeur pour gérer différentes orientations
    let isKeyboardOpen = false;
    
    if (isIOS) {
      // Sur iOS, on peut comparer avec la hauteur du window
      isKeyboardOpen = viewportHeight < window.innerHeight * 0.85;
    } else if (isAndroid) {
      // Sur Android, la détection est plus complexe et dépend de la version
      isKeyboardOpen = viewportHeight < window.innerHeight * 0.75;
    }
    
    // Appliquer une classe au body quand le clavier est ouvert
    if (isKeyboardOpen) {
      document.body.classList.add('keyboard-open');
    } else {
      document.body.classList.remove('keyboard-open');
    }
    
    // Mettre à jour la variable CSS pour la hauteur dynamique
    document.documentElement.style.setProperty('--app-height', `${viewportHeight}px`);
    
    // Position du header selon le contexte
    if (isKeyboardOpen) {
      // S'assurer que le header reste visible quand le clavier est ouvert
      if (isAndroid) {
        // Sur Android, position absolute quand le clavier est ouvert
        header.style.position = 'absolute';
        header.style.top = `${viewportTop}px`;
      } else {
        // Sur iOS, garder position fixed mais ajuster au viewport
        header.style.position = 'fixed';
        header.style.top = `${viewportTop}px`;
      }
    } else {
      // Revenir à l'état normal quand le clavier est fermé
      header.style.position = 'fixed';
      header.style.top = '0';
      // Utilisé env() pour les appareils avec notch
      if (typeof CSS !== 'undefined' && CSS.supports('top: env(safe-area-inset-top)')) {
        header.style.top = 'env(safe-area-inset-top, 0)';
      }
    }
    
    // S'assurer que z-index reste élevé pour la visibilité
    header.style.zIndex = '9999';
  }
  
  // Défilement automatique pour garder l'élément actif visible quand le clavier est ouvert
  function ensureActiveElementVisible() {
    const activeElement = document.activeElement;
    if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
      // Créer un petit délai pour laisser le clavier s'ouvrir complètement
      setTimeout(() => {
        activeElement.scrollIntoView({ block: 'center', behavior: 'smooth' });
      }, 300);
    }
  }
  
  // Initialisation
  updateViewport();
  
  // Utiliser VisualViewport API quand disponible
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', () => {
      updateViewport();
      ensureActiveElementVisible();
    });
    
    window.visualViewport.addEventListener('scroll', updateViewport);
  } else {
    // Fallback pour les navigateurs sans VisualViewport API
    window.addEventListener('resize', updateViewport);
  }
  
  // Autres écouteurs d'événements
  window.addEventListener('orientationchange', () => {
    // Appliquer plusieurs fois pour garantir la stabilité après rotation
    updateViewport();
    setTimeout(updateViewport, 100);
    setTimeout(updateViewport, 500);
  });
  
  // Détecter quand un champ obtient le focus
  document.addEventListener('focusin', (e) => {
    updateViewport();
    ensureActiveElementVisible();
  });
  
  document.addEventListener('focusout', updateViewport);
  
  // Restaurer l'état normal quand la page est redimensionnée
  window.addEventListener('resize', updateViewport);
}
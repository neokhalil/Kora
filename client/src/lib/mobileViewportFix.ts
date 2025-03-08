/**
 * Script d'aide pour corriger les problèmes de viewport sur les appareils mobiles
 * Solution améliorée pour maintenir le header visible même avec le clavier
 */

export function setupMobileViewportFix() {
  if (typeof window === 'undefined') return;

  // Configuration agressive du viewport pour les appareils mobiles
  const metaViewport = document.querySelector('meta[name="viewport"]');
  if (metaViewport) {
    metaViewport.setAttribute('content', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover');
  }

  // Détection des plateformes
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
  const isAndroid = /Android/.test(navigator.userAgent);
  
  // Ajouter des classes pour cibler CSS spécifique par plateforme
  if (isIOS) document.body.classList.add('ios-device');
  if (isAndroid) document.body.classList.add('android-device');
  
  /**
   * Fonction critique qui maintient la hauteur de l'application
   * et s'assure que le header reste visible en tout temps
   */
  function setAppHeight() {
    // Définir la hauteur de l'application
    const viewportHeight = window.innerHeight;
    document.documentElement.style.setProperty('--app-height', `${viewportHeight}px`);
    
    // S'assurer que le header reste visible
    const header = document.getElementById('kora-header-container');
    if (header) {
      header.style.display = 'block';
      header.style.visibility = 'visible';
      header.style.opacity = '1';
    }
  }
  
  // Appliquer immédiatement
  setAppHeight();
  
  // Écouter les changements de taille d'écran
  window.addEventListener('resize', setAppHeight);

  // Solution spécifique à Android - force le header à rester visible
  if (isAndroid) {
    // Ajouter un gestionnaire plus agressif pour Android
    window.addEventListener('scroll', () => {
      const header = document.getElementById('kora-header-container');
      if (header) {
        header.style.top = '0';
        header.style.position = 'sticky';
      }
    });
  }
  
  // Solution spécifique à iOS - utilise visualViewport
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', () => {
      setAppHeight();
      
      // Sur iOS, on force la position du header quand le clavier s'ouvre
      if (isIOS) {
        const header = document.getElementById('kora-header-container');
        if (header) {
          header.style.top = '0';
          header.style.position = 'fixed';
        }
      }
    });
    
    // Gérer le scroll sur iOS
    window.visualViewport.addEventListener('scroll', () => {
      if (isIOS) {
        const header = document.getElementById('kora-header-container');
        if (header) {
          header.style.top = '0';
        }
      }
    });
  }
}
/**
 * Script pour la gestion du viewport mobile
 * Optimisé pour conserver le header fixed visible avec le clavier
 */

export function setupMobileViewportFix() {
  if (typeof window === 'undefined') return;

  // Configuration du viewport pour les appareils mobiles
  const metaViewport = document.querySelector('meta[name="viewport"]');
  if (metaViewport) {
    metaViewport.setAttribute('content', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover');
  }

  // Détection des plateformes pour ajouter des classes utiles au CSS
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
  const isAndroid = /Android/.test(navigator.userAgent);
  
  if (isIOS) document.body.classList.add('ios-device');
  if (isAndroid) document.body.classList.add('android-device');
  
  // Hauteur de l'application pour les mobiles
  function setAppHeight() {
    document.documentElement.style.setProperty('--app-height', `${window.innerHeight}px`);
    
    // S'assurer que le header reste bien en place
    const header = document.getElementById('kora-header-container');
    if (header) {
      // Forcer la propriété de style directement pour garantir position fixed
      header.style.position = 'fixed';
      header.style.top = '0';
      header.style.left = '0';
      header.style.right = '0';
      header.style.zIndex = '1000';
    }
  }
  
  // Appliquer la hauteur et écouter les événements de redimensionnement
  setAppHeight();
  window.addEventListener('resize', setAppHeight);
  
  // Traitement spécial pour iOS avec visualViewport
  if (window.visualViewport) {
    // Gérer la taille quand le clavier apparaît/disparaît
    window.visualViewport.addEventListener('resize', () => {
      setAppHeight();
      
      // Forcer le positionnement du header quand le clavier est ouvert
      const header = document.getElementById('kora-header-container');
      if (header) {
        header.style.position = 'fixed';
        header.style.top = '0';
      }
    });
  }
  
  // Forcer les styles au scroll pour garantir que le header reste visible
  window.addEventListener('scroll', () => {
    const header = document.getElementById('kora-header-container');
    if (header) {
      header.style.position = 'fixed';
      header.style.top = '0';
    }
  });
  
  // Correction spéciale pour iOS quand le clavier s'ouvre
  if (isIOS) {
    document.addEventListener('focusin', (e) => {
      const header = document.getElementById('kora-header-container');
      if (header) {
        // S'assurer que le header reste bien en haut même avec le clavier
        header.style.position = 'fixed';
        header.style.top = '0';
      }
    });
  }
}
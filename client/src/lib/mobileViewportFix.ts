/**
 * Script simple pour la gestion du viewport mobile
 */

export function setupMobileViewportFix() {
  if (typeof window === 'undefined') return;

  // Configuration du viewport pour les appareils mobiles
  const metaViewport = document.querySelector('meta[name="viewport"]');
  if (metaViewport) {
    metaViewport.setAttribute('content', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no');
  }

  // Détection des plateformes pour ajouter des classes utiles au CSS
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
  const isAndroid = /Android/.test(navigator.userAgent);
  
  if (isIOS) document.body.classList.add('ios-device');
  if (isAndroid) document.body.classList.add('android-device');
  
  // Hauteur de l'application pour les mobiles
  function setAppHeight() {
    document.documentElement.style.setProperty('--app-height', `${window.innerHeight}px`);
  }
  
  // Appliquer la hauteur et écouter les événements de redimensionnement
  setAppHeight();
  window.addEventListener('resize', setAppHeight);
  
  // Utiliser visualViewport sur les appareils qui le supportent
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', setAppHeight);
  }
}
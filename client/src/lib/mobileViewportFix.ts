/**
 * Script d'aide pour corriger les problèmes de viewport sur les appareils mobiles
 * Version simplifiée pour éviter les conflits avec le header-fix.css
 */

export function setupMobileViewportFix() {
  if (typeof window === 'undefined') return;

  // Configurer le viewport pour éviter les problèmes de zoom et de déplacement
  const metaViewport = document.querySelector('meta[name="viewport"]');
  if (metaViewport) {
    metaViewport.setAttribute('content', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover');
  }

  // Sur iOS, ajouter une classe pour aider à identifier l'appareil
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
  if (isIOS) {
    document.body.classList.add('ios-device');
  }

  // Sur Android, ajouter une classe pour aider à identifier l'appareil
  const isAndroid = /Android/.test(navigator.userAgent);
  if (isAndroid) {
    document.body.classList.add('android-device');
  }
  
  // Gérer les problèmes de hauteur sur mobile avec JavaScript
  // Cette partie est cruciale pour la stabilité du viewport sur mobile
  function setAppHeight() {
    document.documentElement.style.setProperty('--app-height', `${window.innerHeight}px`);
  }
  
  window.addEventListener('resize', setAppHeight);
  setAppHeight();

  // Sur iOS, utiliser visualViewport pour détecter les changements de clavier
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', setAppHeight);
  }
}
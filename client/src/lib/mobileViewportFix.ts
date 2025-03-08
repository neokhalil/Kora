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

  // Détection des plateformes
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
  const isAndroid = /Android/.test(navigator.userAgent);
  
  // Ajouter les classes pour le CSS conditionnel
  if (isIOS) document.body.classList.add('ios-device');
  if (isAndroid) document.body.classList.add('android-device');
  
  /**
   * Fonction qui garantit que le header reste bien positionné
   * Centralise la logique pour éviter les redondances
   */
  function ensureHeaderPosition() {
    const header = document.getElementById('kora-header-container');
    if (header) {
      // On vérifie que le header est bien visible et au-dessus des autres éléments
      // mais sans redéfinir les positions, qui peuvent maintenant utiliser safe-area-inset
      
      // S'assurer que la hauteur est prise en compte pour les appareils avec "notch"
      const safeAreaTop = typeof CSS !== 'undefined' && CSS.supports('top: env(safe-area-inset-top)') 
        ? 'env(safe-area-inset-top, 0)' 
        : '0';

      // On s'assure uniquement que le z-index est élevé et que rien ne vient perturber
      header.style.zIndex = '9999';
      header.style.borderBottom = 'none';
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
  
  // Écouteurs d'événements
  window.addEventListener('resize', setAppHeight);
  window.addEventListener('scroll', ensureHeaderPosition);
  window.addEventListener('orientationchange', setAppHeight);
  
  // Gestion spécifique du clavier mobile
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', setAppHeight);
    window.visualViewport.addEventListener('scroll', ensureHeaderPosition);
  }
  
  // Détection de focus sur les champs de saisie (pour le clavier)
  document.addEventListener('focusin', ensureHeaderPosition);
  document.addEventListener('focusout', ensureHeaderPosition);
}
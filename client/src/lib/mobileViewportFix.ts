/**
 * Solution mobile simplifiée
 * 
 * Ce fichier a été complètement repensé pour adopter une approche minimaliste.
 * 
 * Plutôt que de tenter de calculer dynamiquement des espacements complexes,
 * nous utilisons:
 * 1. Un méta viewport bien configuré
 * 2. Des classes simples pour détecter les plateformes principales
 * 3. AUCUNE gestion dynamique de la hauteur
 */

export function setupMobileViewportFix() {
  if (typeof window === 'undefined') return;

  // Configuration optimale du viewport pour les appareils mobiles
  const metaViewport = document.querySelector('meta[name="viewport"]');
  if (metaViewport) {
    metaViewport.setAttribute('content', 'width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover');
  }
  
  // Détection simplifiée des plateformes
  const ua = navigator.userAgent;
  
  // Détection basique iOS/Android
  const isIOS = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
  const isAndroid = /Android/.test(ua);
  
  // Ajout de classes de base uniquement
  if (isIOS) {
    document.body.classList.add('ios-device');
  }
  
  if (isAndroid) {
    document.body.classList.add('android-device');
  }
  
  // Classer comme mobile general
  document.body.classList.add('mobile-device');
}
/**
 * Script d'aide pour corriger les problèmes de viewport sur les appareils mobiles
 * particulièrement pour les appareils iOS où le clavier virtuel peut masquer l'interface
 */

export function setupMobileViewportFix() {
  // Détection de l'appareil iOS (iPhone, iPad)
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
  
  if (isIOS) {
    // Fonction pour gérer le défilement et le focus quand le clavier est ouvert
    const handleVisualViewportChange = () => {
      // Forcer la visibilité du header
      const header = document.querySelector('header.app-header');
      if (header) {
        header.classList.remove('transform', '-translate-y-full');
      }
      
      // Faire défiler jusqu'à l'élément actif si c'est un champ de texte
      const activeElement = document.activeElement;
      if (
        activeElement && 
        (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')
      ) {
        // Ajouter un délai pour permettre au clavier de s'ouvrir complètement
        setTimeout(() => {
          activeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
      }
    };
    
    // Gestionnaire d'événements pour les changements de hauteur du viewport 
    // (généralement lors de l'ouverture du clavier)
    if ('visualViewport' in window) {
      window.visualViewport?.addEventListener('resize', handleVisualViewportChange);
      window.visualViewport?.addEventListener('scroll', handleVisualViewportChange);
    }
    
    // Empêcher le zoom sur double-tap sur les éléments de formulaire (iOS)
    document.addEventListener('touchstart', (e) => {
      if (e.touches.length > 1) {
        e.preventDefault();
      }
    }, { passive: false });
    
    // Empêcher le zoom sur les champs de formulaire
    const addNoZoomToInputs = () => {
      const inputs = document.querySelectorAll('input, textarea');
      inputs.forEach(input => {
        input.setAttribute('autocapitalize', 'none');
        input.setAttribute('autocomplete', 'off');
        input.setAttribute('autocorrect', 'off');
        // On doit caster l'élément en HTMLInputElement ou HTMLTextAreaElement pour accéder à style
        if (input instanceof HTMLInputElement || input instanceof HTMLTextAreaElement) {
          input.style.fontSize = '16px'; // Minimum 16px pour éviter le zoom auto sur iOS
        }
      });
    };
    
    // Exécuter au chargement et lors des mutations DOM
    addNoZoomToInputs();
    
    // Observer les changements dans le DOM pour appliquer les réglages aux nouveaux éléments
    const observer = new MutationObserver(mutations => {
      for (const mutation of mutations) {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          addNoZoomToInputs();
        }
      }
    });
    
    observer.observe(document.body, { childList: true, subtree: true });
  }
  
  // Empêcher le comportement de pull-to-refresh sur les appareils mobiles
  if (document.body) {
    // Nous devons caster le body en HTMLElement pour accéder à style
    const body = document.body as HTMLElement;
    body.style.overscrollBehavior = 'none';
    
    // Empêcher les rebonds iOS
    body.addEventListener('touchmove', (e) => {
      if (e.touches.length > 1) {
        e.preventDefault();
      }
    }, { passive: false });
  }
}
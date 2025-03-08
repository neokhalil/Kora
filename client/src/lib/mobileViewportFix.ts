/**
 * Script d'aide pour corriger les problèmes de viewport sur les appareils mobiles
 * Simplifié pour se concentrer sur la visibilité du header
 */

export function setupMobileViewportFix() {
  if (typeof window === 'undefined') return;

  // Ajouter une métadonnée pour empêcher le zoom mobile
  const metaViewport = document.querySelector('meta[name="viewport"]');
  if (!metaViewport) {
    const meta = document.createElement('meta');
    meta.name = 'viewport';
    meta.content = 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no';
    document.getElementsByTagName('head')[0].appendChild(meta);
  } else {
    metaViewport.setAttribute('content', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no');
  }

  // Ajout direct d'un CSS pour les optimisations mobiles
  const styleEl = document.createElement('style');
  styleEl.innerHTML = `
    :root {
      --header-height: 56px;
    }
    
    /* Styles pour les entrées sur mobile */
    input, textarea, select {
      font-size: 16px !important; /* Évite le zoom automatique sur iOS */
    }
    
    /* Optimisation du débordement sur mobile */
    @media screen and (max-width: 767px) {
      body {
        overflow-x: hidden;
      }
    }
  `;
  document.head.appendChild(styleEl);

  // Gérer le focus sur les champs de saisie
  document.addEventListener('focusin', (e) => {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
      // S'assurer que le header reste visible
      const header = document.getElementById('kora-header-container');
      if (header) {
        // Renforcer la fixation du header en position fixe
        header.style.position = 'fixed';
        header.style.top = '0';
        header.style.zIndex = '2000';
        header.style.opacity = '1';
      }

      // Délai pour permettre au clavier de s'ouvrir complètement
      setTimeout(() => {
        if (e.target) {
          const headerHeight = 56; 
          const rect = (e.target as HTMLElement).getBoundingClientRect();
          // Faire défiler la page pour montrer l'élément actif
          window.scrollTo({
            top: window.scrollY + rect.top - headerHeight - 20,
            behavior: 'smooth'
          });
        }
      }, 300);
    }
  });

  // Désactiver le scroll de rebond sur iOS
  document.body.style.overscrollBehavior = 'none';
}
/**
 * Script d'aide pour corriger les problèmes de viewport sur les appareils mobiles
 * Amélioration pour maintenir le header visible même lorsque le clavier est ouvert
 */

export function setupMobileViewportFix() {
  if (typeof window === 'undefined') return;

  // Ajouter une métadonnée pour empêcher le zoom mobile
  const metaViewport = document.querySelector('meta[name="viewport"]');
  if (!metaViewport) {
    const meta = document.createElement('meta');
    meta.name = 'viewport';
    meta.content = 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover';
    document.getElementsByTagName('head')[0].appendChild(meta);
  } else {
    metaViewport.setAttribute('content', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover');
  }

  // Ajout direct d'un CSS pour les optimisations mobiles et la visibilité du header
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

    /* Styles pour s'assurer que le header reste fixe même avec clavier ouvert */
    #kora-header-container {
      position: fixed !important;
      top: 0 !important;
      left: 0 !important;
      right: 0 !important;
      z-index: 9999 !important;
      transform: translateZ(0);
      will-change: transform;
      backface-visibility: hidden;
      background-color: white;
    }
  `;
  document.head.appendChild(styleEl);

  // Fonction pour s'assurer que le header reste visible même quand le clavier s'ouvre
  const keepHeaderVisible = () => {
    const header = document.getElementById('kora-header-container');
    if (header) {
      header.style.position = 'fixed';
      header.style.top = '0';
      header.style.zIndex = '9999';
      header.style.opacity = '1';
    }
  };

  // Appliquer le fix à l'initialisation
  keepHeaderVisible();

  // Détection du système d'exploitation
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
  
  // Sur iOS, on utilise le visualViewport qui gère mieux les événements liés au clavier
  if (isIOS && window.visualViewport) {
    window.visualViewport.addEventListener('resize', () => {
      keepHeaderVisible();
    });
    
    window.visualViewport.addEventListener('scroll', () => {
      keepHeaderVisible();
    });
  }

  // Gérer le focus sur les champs de saisie
  document.addEventListener('focusin', (e) => {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
      // S'assurer que le header reste visible
      keepHeaderVisible();

      // Délai pour permettre au clavier de s'ouvrir complètement
      setTimeout(() => {
        if (e.target) {
          const headerHeight = 56; 
          const rect = (e.target as HTMLElement).getBoundingClientRect();
          
          // Faire défiler la page pour montrer l'élément actif tout en gardant le header visible
          window.scrollTo({
            top: window.scrollY + rect.top - headerHeight - 20,
            behavior: 'smooth'
          });
          
          // S'assurer à nouveau que le header est visible après le défilement
          keepHeaderVisible();
        }
      }, 300);
    }
  });

  // Gérer le resize de la fenêtre
  window.addEventListener('resize', () => {
    keepHeaderVisible();
  });

  // Désactiver le scroll de rebond sur iOS
  document.body.style.overscrollBehavior = 'none';
}
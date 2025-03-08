/**
 * Script d'aide pour corriger les problèmes de viewport sur les appareils mobiles
 */

export function setupMobileViewportFix() {
  if (typeof window === 'undefined') return;

  // Configurer le viewport pour éviter les problèmes de zoom et de déplacement
  const metaViewport = document.querySelector('meta[name="viewport"]');
  if (metaViewport) {
    metaViewport.setAttribute('content', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no');
  }

  // Ajout direct d'un CSS pour les optimisations mobiles
  const styleEl = document.createElement('style');
  styleEl.innerHTML = `
    /* Assurer que les champs de texte ont une taille correcte */
    input, textarea, select {
      font-size: 16px !important; /* Évite le zoom automatique sur iOS */
    }

    /* Fix pour le header sur mobile */
    @media screen and (max-width: 767px) {
      #root {
        padding-top: 56px; /* Hauteur du header */
      }
      
      #kora-header-container {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        z-index: 1000;
        height: 56px;
      }
    }
  `;
  document.head.appendChild(styleEl);
}
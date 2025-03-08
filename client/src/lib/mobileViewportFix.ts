/**
 * Script d'aide pour corriger les problèmes de viewport sur les appareils mobiles
 * particulièrement pour les appareils iOS où le clavier virtuel peut masquer l'interface
 */

export function setupMobileViewportFix() {
  // Détection de l'appareil mobile
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
  const isAndroid = /Android/.test(navigator.userAgent);
  const isMobile = isIOS || isAndroid;
  
  if (isMobile) {
    // Ajouter des classes au body pour pouvoir cibler les appareils spécifiques avec CSS
    document.body.classList.add('mobile-device');
    if (isIOS) document.body.classList.add('ios-device');
    if (isAndroid) document.body.classList.add('android-device');
    
    // Fonction pour gérer le défilement et le focus quand le clavier est ouvert
    const handleVisualViewportChange = () => {
      if (!window.visualViewport) return;
      
      // Si la hauteur du viewport est significativement réduite, le clavier est probablement ouvert
      const currentHeight = window.visualViewport.height;
      const windowHeight = window.innerHeight;
      
      // Si le viewport est plus petit que la fenêtre, cela signifie probablement que le clavier est ouvert
      if (currentHeight < windowHeight * 0.75) {
        document.body.classList.add('keyboard-open');
        document.body.classList.add('visual-viewport-active');
        
        // Calculer la hauteur approximative du clavier
        const keyboardHeight = windowHeight - currentHeight;
        
        // Stocker la hauteur du clavier comme variable CSS pour pouvoir l'utiliser dans les styles
        document.documentElement.style.setProperty('--keyboard-height', `${keyboardHeight}px`);
        
        // Assurer que le corps a suffisamment d'espace pour le contenu
        document.body.style.paddingBottom = `${keyboardHeight + 20}px`;
      } else {
        document.body.classList.remove('keyboard-open');
        document.body.classList.remove('visual-viewport-active');
        document.documentElement.style.setProperty('--keyboard-height', '0px');
        document.body.style.paddingBottom = '';
      }
      
      // Forcer la visibilité du header spécifique à chaque changement de viewport
      const header = document.getElementById('kora-header-container');
      if (header) {
        // Force le header à rester en haut et visible
        header.style.position = 'sticky';
        header.style.top = '0';
        header.style.zIndex = '2000';
        header.style.transform = 'translateZ(0)';
        header.style.willChange = 'transform';
        header.style.transition = 'none';
        header.style.opacity = '1';
        header.style.visibility = 'visible';
      }
      
      // Faire défiler jusqu'à l'élément actif si c'est un champ de texte
      const activeElement = document.activeElement;
      if (
        activeElement && 
        (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')
      ) {
        // Ajouter un délai pour permettre au clavier de s'ouvrir complètement
        setTimeout(() => {
          // Faire défiler jusqu'au champ actif, mais s'assurer de garder le header visible
          try {
            const headerHeight = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--header-height') || '56px');
            const elementRect = (activeElement as HTMLElement).getBoundingClientRect();
            const scrollPosition = window.scrollY + elementRect.top - headerHeight - 10;
            window.scrollTo({ top: scrollPosition, behavior: 'smooth' });
          } catch (e) {
            // Fallback en cas d'erreur
            activeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 100);
      }
    };
    
    // Gestionnaire d'événements pour les changements de hauteur du viewport 
    // (généralement lors de l'ouverture du clavier)
    if ('visualViewport' in window) {
      window.visualViewport?.addEventListener('resize', handleVisualViewportChange);
      window.visualViewport?.addEventListener('scroll', handleVisualViewportChange);
    }
    
    // Empêcher le zoom sur double-tap sur les éléments de formulaire
    document.addEventListener('touchstart', (e) => {
      if (e.touches.length > 1) {
        e.preventDefault();
      }
    }, { passive: false });
    
    // Gestionnaires spécifiques pour les champs de saisie
    document.addEventListener('focusin', (e) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        // Ajouter une classe au body quand un champ a le focus
        document.body.classList.add('input-focused');
        
        // Forcer le header à rester visible
        const header = document.querySelector('header.app-header');
        if (header) {
          header.classList.remove('transform', '-translate-y-full');
          (header as HTMLElement).style.transform = 'translateZ(0)';
          (header as HTMLElement).style.opacity = '1';
        }
      }
    });
    
    document.addEventListener('focusout', () => {
      // Enlever la classe quand un champ perd le focus
      document.body.classList.remove('input-focused');
    });
    
    // Empêcher le zoom sur les champs de formulaire
    const addNoZoomToInputs = () => {
      const inputs = document.querySelectorAll('input, textarea');
      inputs.forEach(input => {
        // Attributs pour améliorer l'expérience mobile
        input.setAttribute('autocapitalize', 'none');
        input.setAttribute('autocomplete', 'off');
        input.setAttribute('autocorrect', 'off');
        input.setAttribute('data-lpignore', 'true'); // Ignorer LastPass et autres gestionnaires de mot de passe
        
        // On doit caster l'élément en HTMLInputElement ou HTMLTextAreaElement pour accéder à style
        if (input instanceof HTMLInputElement || input instanceof HTMLTextAreaElement) {
          input.style.fontSize = '16px'; // Minimum 16px pour éviter le zoom auto sur iOS
          
          // Ajouter un écouteur focusin individuel pour chaque input
          input.addEventListener('focus', () => {
            const header = document.querySelector('header.app-header');
            if (header) {
              header.classList.remove('transform', '-translate-y-full');
              (header as HTMLElement).style.transform = 'translateZ(0)';
              (header as HTMLElement).style.opacity = '1';
            }
          });
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
  
  // Ajouter des styles CSS à la volée pour le comportement mobile
  const addMobileStyles = () => {
    const styleEl = document.createElement('style');
    styleEl.innerHTML = `
      /* Styles pour les appareils mobiles */
      body.mobile-device {
        -webkit-tap-highlight-color: transparent;
      }
      
      /* Quand le clavier est ouvert */
      body.keyboard-open #kora-header-container,
      body.keyboard-open .app-header {
        position: sticky !important;
        top: 0 !important;
        opacity: 1 !important;
        transform: translateZ(0) !important;
        visibility: visible !important;
        z-index: 2000 !important;
      }
      
      /* Style pour le corps avec clavier ouvert pour empêcher le scroll inattendu */
      body.keyboard-open {
        position: relative;
        overflow-x: hidden;
      }
      
      /* Styles spécifiques iOS */
      body.ios-device.keyboard-open .fixed-bottom-bar {
        bottom: var(--keyboard-height, 0);
        transition: bottom 0.3s;
      }
      
      /* Lorsqu'un champ de saisie a le focus */
      body.input-focused #kora-header-container,
      body.input-focused .app-header {
        position: sticky !important;
        top: 0 !important;
        opacity: 1 !important;
        transform: translateZ(0) !important;
        visibility: visible !important;
      }
      
      /* Fix pour s'assurer que le header reste visible sur tous les appareils */
      #kora-header-container,
      header.app-header {
        -webkit-transform: translateZ(0) !important;
        transform: translateZ(0) !important;
        will-change: transform !important;
        position: sticky !important;
        top: 0 !important;
        z-index: 2000 !important;
        transition: none !important;
        contain: layout paint style !important;
      }
      
      /* Support supplémentaire pour la position sticky */
      @supports (position: sticky) {
        #kora-header-container {
          position: -webkit-sticky !important;
          position: sticky !important;
          top: 0 !important;
        }
      }
    `;
    document.head.appendChild(styleEl);
  };
  
  // Ajouter les styles mobiles
  addMobileStyles();
}
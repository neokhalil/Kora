/**
 * Script optimisé pour la gestion du viewport mobile
 * Garantit que le header reste visible même quand le clavier est ouvert
 * Et que la zone de saisie reste au-dessus du clavier
 */

export function setupMobileViewportFix() {
  if (typeof window === 'undefined') return;

  // Configuration du viewport pour les appareils mobiles
  const metaViewport = document.querySelector('meta[name="viewport"]');
  if (metaViewport) {
    metaViewport.setAttribute('content', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover');
  }

  // Détection avancée des plateformes
  const ua = navigator.userAgent;
  
  // Détection iOS plus précise
  const isIOS = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
  
  // Détection Android plus précise avec version
  const androidMatch = ua.match(/Android\s([0-9.]+)/);
  const isAndroid = androidMatch !== null;
  const androidVersion = isAndroid && androidMatch ? parseFloat(androidMatch[1]) : 0;
  
  // Détection de navigateurs spécifiques sur mobile
  const isChrome = /Chrome\/([0-9.]+)/.test(ua);
  const isSamsung = /SamsungBrowser\/([0-9.]+)/.test(ua);
  const isFirefox = /Firefox\/([0-9.]+)/.test(ua);
  
  // Ajouter des classes CSS pour le ciblage conditionnel
  if (isIOS) {
    document.body.classList.add('ios-device');
    // Détection des modèles récents avec notch
    if (/iPhone X|iPhone 11|iPhone 12|iPhone 13|iPhone 14|iPhone 15/.test(ua)) {
      document.body.classList.add('ios-notch');
    }
  }
  
  if (isAndroid) {
    document.body.classList.add('android-device');
    document.body.classList.add(`android-${Math.floor(androidVersion)}`);
    
    // Classes spécifiques pour les navigateurs
    if (isChrome) document.body.classList.add('chrome-browser');
    if (isSamsung) document.body.classList.add('samsung-browser');
    if (isFirefox) document.body.classList.add('firefox-browser');
  }
  
  /**
   * Fonction qui garantit que le header reste bien positionné
   * Centralise la logique pour éviter les redondances
   */
  function ensureHeaderPosition() {
    const header = document.getElementById('kora-header-container');
    if (!header) return;
    
    // Détection du support des safe-area-inset
    const supportsSafeArea = typeof CSS !== 'undefined' && CSS.supports('top: env(safe-area-inset-top)');
    const safeAreaTop = supportsSafeArea ? 'env(safe-area-inset-top, 0)' : '0';
    
    // S'assurer que le z-index est toujours élevé pour rester au-dessus du contenu
    header.style.zIndex = '10000';
    header.style.position = 'fixed';
    header.style.top = '0';
    header.style.left = '0';
    header.style.right = '0';
    header.style.borderBottom = 'none';
    
    // Ajustements spécifiques selon la plateforme
    if (isAndroid) {
      // Ajustements spécifiques selon la version Android
      if (androidVersion < 10) {
        // Android versions antérieures peuvent nécessiter des ajustements supplémentaires
        header.style.height = '56px';
        header.style.paddingTop = '0';
      }
    } else if (isIOS) {
      // Sur iOS, utiliser les valeurs safe-area quand disponibles
      if (supportsSafeArea) {
        header.style.paddingTop = safeAreaTop;
        header.style.height = `calc(56px + ${safeAreaTop})`;
      }
    }
  }
  
  /**
   * Fonction pour garantir que la zone de saisie reste visible
   * au-dessus du clavier mobile
   */
  function ensureComposerVisible() {
    const composerContainer = document.querySelector('.composer-container') as HTMLElement | null;
    const messagesContainer = document.querySelector('.messages-container') as HTMLElement | null;
    
    if (!composerContainer || !messagesContainer) return;
    
    const vv = window.visualViewport;
    
    // Détection plus précise de l'ouverture du clavier
    const isKeyboardOpen = vv 
      ? vv.height < window.innerHeight * 0.7  // On estime que le clavier est ouvert si le viewport est réduit significativement
      : window.innerHeight < window.outerHeight * 0.7;
    
    if (isKeyboardOpen) {
      document.body.classList.add('keyboard-open');
      
      // Si VisualViewport API est disponible (iOS et Android récent)
      if (vv) {
        // Calculer la différence de hauteur entre le viewport et la fenêtre
        const viewportHeightDiff = window.innerHeight - vv.height;
        
        // Stocker ces valeurs comme propriétés CSS pour les utiliser dans les styles
        document.documentElement.style.setProperty('--viewport-height-diff', `${viewportHeightDiff}px`);
        document.documentElement.style.setProperty('--keyboard-height', `${viewportHeightDiff}px`);
        
        // Position absolue au lieu de fixed pour éviter les problèmes sur certains navigateurs
        composerContainer.style.position = 'fixed';
        composerContainer.style.bottom = '0px';
        composerContainer.style.left = '0';
        composerContainer.style.right = '0';
        composerContainer.style.width = '100%';
        composerContainer.style.zIndex = '9990';
        
        // Utiliser la transformation directement au-dessus du clavier
        composerContainer.style.transform = `translateY(-${viewportHeightDiff}px)`;
        
        // Ajuster la hauteur maximale de la zone de messages pour qu'elle soit scrollable
        const headerHeight = 56; // Hauteur fixe du header
        const composerHeight = composerContainer.offsetHeight || 60;
        
        // Calculer la hauteur maximale de façon plus précise
        // On s'assure qu'il n'y a pas d'espace entre le composer et le clavier
        const maxHeight = vv.height - headerHeight;
        
        messagesContainer.style.maxHeight = `${maxHeight}px`;
        messagesContainer.style.overflowY = 'auto';
        messagesContainer.style.paddingBottom = `${composerHeight}px`;
      } else {
        // Fallback pour les navigateurs sans VisualViewport API
        // Estimation de la hauteur du clavier basée sur le rapport de taille d'écran
        const estimatedKeyboardHeight = window.innerHeight * 0.4; // ~40% de l'écran
        
        composerContainer.style.position = 'fixed';
        composerContainer.style.bottom = `${estimatedKeyboardHeight}px`;
        composerContainer.style.left = '0';
        composerContainer.style.right = '0';
        composerContainer.style.zIndex = '9990';
      }
    } else {
      // Réinitialiser quand le clavier est fermé
      document.body.classList.remove('keyboard-open');
      document.documentElement.style.setProperty('--viewport-height-diff', '0px');
      document.documentElement.style.setProperty('--keyboard-height', '0px');
      
      // Réinitialiser les styles du composer
      composerContainer.style.transform = '';
      composerContainer.style.position = 'fixed';
      composerContainer.style.bottom = '0';
      composerContainer.style.left = '0';
      composerContainer.style.right = '0';
      composerContainer.style.zIndex = '50';
      
      // Réinitialiser les styles de la zone de messages
      messagesContainer.style.maxHeight = '';
      messagesContainer.style.paddingBottom = '';
    }
  }
  
  /**
   * Mise à jour de la hauteur de l'application
   * Cette variable CSS est utilisée pour les calculs de hauteur dynamique
   */
  function setAppHeight() {
    document.documentElement.style.setProperty('--app-height', `${window.innerHeight}px`);
    ensureHeaderPosition();
    ensureComposerVisible();
  }
  
  // Initialisation
  setAppHeight();
  
  // Écouteurs d'événements standard
  window.addEventListener('resize', setAppHeight);
  window.addEventListener('scroll', () => {
    ensureHeaderPosition();
    ensureComposerVisible();
  });
  
  // Gestion améliorée de l'orientation
  window.addEventListener('orientationchange', () => {
    // Sur Android, attendre un court instant après le changement d'orientation
    // pour permettre au navigateur de recalculer correctement les dimensions
    setAppHeight();
    
    if (isAndroid) {
      // Attendre un court délai pour que les dimensions soient stables
      setTimeout(() => {
        setAppHeight();
        ensureHeaderPosition();
        ensureComposerVisible();
        
        // Forcer un petit défilement pour déclencher les recalculs du navigateur
        window.scrollTo(0, 1);
        window.scrollTo(0, 0);
      }, 150);
      
      // Second délai plus long pour certains appareils/navigateurs Android plus lents
      setTimeout(setAppHeight, 500);
    }
  });
  
  // Gestion spécifique du clavier mobile via Visual Viewport API
  /**
   * Fonction supplémentaire pour éviter l'espace blanc entre le clavier et la zone de saisie
   * En répétant la vérification après un court délai pour s'adapter aux animations natives
   */
  function ensureNoGapWithKeyboard() {
    const composerContainer = document.querySelector('.composer-container') as HTMLElement | null;
    if (!composerContainer) return;
    
    const vv = window.visualViewport;
    if (!vv) return;
    
    // Vérifier si le clavier est ouvert
    if (vv.height < window.innerHeight * 0.7) {
      const viewportHeightDiff = window.innerHeight - vv.height;
      
      // Appliquer la transformation avec une légère marge pour s'assurer qu'il n'y a pas d'espace
      composerContainer.style.transform = `translateY(calc(-${viewportHeightDiff}px - 1px))`;
      
      // Forcer une réinitialisation de rendu pour que la transformation soit correctement appliquée
      composerContainer.style.zIndex = '9990';
      
      // Appliquer à nouveau après un court délai pour s'adapter aux animations du clavier
      setTimeout(() => {
        if (composerContainer) {
          // Vérifier à nouveau les dimensions au cas où le clavier aurait changé de taille
          const updatedDiff = window.innerHeight - vv.height;
          composerContainer.style.transform = `translateY(calc(-${updatedDiff}px - 1px))`;
        }
      }, 50);
      
      // Un second délai plus long pour s'adapter aux animations plus lentes sur certains appareils
      setTimeout(() => {
        if (composerContainer) {
          const finalDiff = window.innerHeight - vv.height;
          composerContainer.style.transform = `translateY(calc(-${finalDiff}px - 1px))`;
        }
      }, 300);
    }
  }
  
  const visualViewport = window.visualViewport;
  if (visualViewport) {
    // Indiquer que Visual Viewport API est supporté
    document.body.classList.add('visual-viewport-supported');
    
    visualViewport.addEventListener('resize', () => {
      // Mettre à jour le --app-height immédiatement
      document.documentElement.style.setProperty('--app-height', `${visualViewport.height}px`);
      
      // Mettre à jour la position du composer et du header
      ensureHeaderPosition();
      ensureComposerVisible();
      
      // Appeler la fonction supplémentaire pour éviter l'espace blanc
      ensureNoGapWithKeyboard();
      
      // Détecter l'ouverture du clavier en fonction de la hauteur
      if (visualViewport.height < window.innerHeight * 0.7) {
        document.body.classList.add('keyboard-open');
        document.body.classList.add('visual-viewport-active');
      } else {
        document.body.classList.remove('keyboard-open');
        document.body.classList.remove('visual-viewport-active');
      }
    });
    
    visualViewport.addEventListener('scroll', () => {
      ensureHeaderPosition();
      ensureComposerVisible();
      ensureNoGapWithKeyboard();
    });
  }
  
  // Détection de focus sur les champs de saisie (pour le clavier)
  document.addEventListener('focusin', (e) => {
    const target = e.target as HTMLElement;
    
    // Uniquement réagir aux inputs, textareas et éléments de formulaire
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || 
        target.hasAttribute('contenteditable')) {
      document.body.classList.add('keyboard-open');
      ensureHeaderPosition();
      ensureComposerVisible();
      ensureNoGapWithKeyboard();
      
      // Sur Android, ajouter un délai pour s'assurer que tout est bien positionné
      // après que le clavier est complètement ouvert
      if (isAndroid) {
        setTimeout(() => {
          ensureHeaderPosition();
          ensureComposerVisible();
          ensureNoGapWithKeyboard();
        }, 300);
      }
      
      // Forcer un scroll minime pour déclencher le recalcul de position sur iOS
      if (isIOS) {
        setTimeout(() => {
          window.scrollTo(0, 1);
          window.scrollTo(0, 0);
          ensureNoGapWithKeyboard();
        }, 100);
        
        // Un deuxième délai plus long pour s'adapter à l'animation du clavier iOS
        setTimeout(() => {
          ensureNoGapWithKeyboard();
        }, 500);
      }
    }
  });
  
  document.addEventListener('focusout', () => {
    // Délai pour s'assurer que l'animation du clavier est terminée
    setTimeout(() => {
      // Vérifier si un autre élément a reçu le focus
      const activeElement = document.activeElement as HTMLElement;
      // Vérifier si l'élément qui a le focus est un champ de saisie
      const isFocusInForm = activeElement && (
        activeElement.tagName === 'INPUT' || 
        activeElement.tagName === 'TEXTAREA' || 
        activeElement.hasAttribute('contenteditable')
      );
      
      // Ne retirer la classe que si aucun élément de formulaire n'a le focus
      if (!isFocusInForm) {
        document.body.classList.remove('keyboard-open');
        document.body.classList.remove('visual-viewport-active');
      }
      
      ensureHeaderPosition();
      ensureComposerVisible();
      
      // S'assurer qu'il n'y a pas d'espace blanc quand un autre élément reçoit le focus
      if (document.body.classList.contains('keyboard-open')) {
        ensureNoGapWithKeyboard();
      }
    }, 300);
  });
  
  // Gestion spécifique des textarea qui peuvent agrandir dynamiquement
  const adjustTextareaHeight = (e: Event) => {
    const textarea = e.target as HTMLTextAreaElement;
    if (!textarea) return;

    // Réinitialiser la hauteur pour recalculer correctement
    textarea.style.height = '40px';
    
    // Ajouter 2px pour éviter la scrollbar
    const newHeight = Math.min(textarea.scrollHeight + 2, 120);
    textarea.style.height = `${newHeight}px`;
    
    // Indication visuelle que la hauteur maximale est atteinte (scrollbar)
    if (newHeight >= 120) {
      textarea.classList.add('max-height-reached');
    } else {
      textarea.classList.remove('max-height-reached');
    }
    
    // Mettre à jour la hauteur du composer dans les variables CSS
    const composerContainer = textarea.closest('.composer-container');
    if (composerContainer) {
      document.documentElement.style.setProperty('--composer-height', `${composerContainer.clientHeight}px`);
      
      // Re-calculer la position du composer
      ensureComposerVisible();
      
      // S'assurer qu'il n'y a pas d'espace blanc entre le clavier et la zone de saisie
      if (document.body.classList.contains('keyboard-open')) {
        ensureNoGapWithKeyboard();
      }
    }
  };
  
  // Appliquer aux textareas existants et à venir
  document.querySelectorAll('textarea.chat-textarea').forEach(el => {
    el.addEventListener('input', adjustTextareaHeight);
  });
  
  // Observer les nouveaux textareas ajoutés au DOM pour y attacher l'event
  const observer = new MutationObserver(mutations => {
    mutations.forEach(mutation => {
      if (mutation.addedNodes.length) {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === 1) {
            const element = node as HTMLElement;
            const textareas = element.querySelectorAll('textarea.chat-textarea');
            textareas.forEach(el => {
              el.addEventListener('input', adjustTextareaHeight);
            });
          }
        });
      }
    });
  });
  
  // Configurer et démarrer l'observateur
  observer.observe(document.body, { childList: true, subtree: true });
  
  // Ajouter des écouteurs d'événements tactiles pour optimiser l'expérience mobile
  
  // 1. Après un toucher, le clavier peut parfois changer de taille
  document.addEventListener('touchstart', () => {
    // Si le clavier est actuellement ouvert, vérifier sa position
    if (document.body.classList.contains('keyboard-open')) {
      setTimeout(ensureNoGapWithKeyboard, 10);
    }
  });
  
  // 2. Après la fin d'un toucher, s'assurer que la position est correcte
  document.addEventListener('touchend', () => {
    // Si le clavier est ouvert, s'assurer qu'il n'y a pas d'espace blanc
    if (document.body.classList.contains('keyboard-open')) {
      setTimeout(ensureNoGapWithKeyboard, 100);
    }
  });
  
  // 3. Parfois, un tapotement sur l'écran peut faire bouger le clavier
  document.addEventListener('click', () => {
    // Si le clavier est ouvert, s'assurer qu'il n'y a pas d'espace blanc
    if (document.body.classList.contains('keyboard-open')) {
      setTimeout(ensureNoGapWithKeyboard, 50);
    }
  });
}
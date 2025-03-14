/**
 * Utilitaires pour tester la visibilité et le défilement des éléments
 * Ce module permet de vérifier par programmation que les réponses restent visibles
 */

/**
 * Vérifie si un élément est visible dans le viewport
 * @param element L'élément à vérifier
 * @returns Un objet indiquant la visibilité et la position relative
 */
export function isElementInViewport(element: HTMLElement): {
  visible: boolean;
  fullyVisible: boolean;
  partiallyVisible: boolean;
  position: {
    elementTop: number;
    elementBottom: number;
    viewportTop: number;
    viewportBottom: number;
    visiblePercentage: number;
  }
} {
  const rect = element.getBoundingClientRect();
  
  // Dimensions du viewport
  const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
  const viewportWidth = window.innerWidth || document.documentElement.clientWidth;
  
  // Coordonnées de l'élément
  const elementTop = rect.top;
  const elementBottom = rect.bottom;
  const elementLeft = rect.left;
  const elementRight = rect.right;
  
  // Calcul de la visibilité horizontale
  const horizontallyVisible = elementLeft >= 0 && elementRight <= viewportWidth;
  
  // Calcul de la visibilité verticale
  const fullyVerticallyVisible = elementTop >= 0 && elementBottom <= viewportHeight;
  const partiallyVerticallyVisible = 
    (elementTop < 0 && elementBottom > 0) || 
    (elementTop < viewportHeight && elementBottom > viewportHeight);
  
  // Visibilité globale
  const fullyVisible = horizontallyVisible && fullyVerticallyVisible;
  const partiallyVisible = horizontallyVisible && partiallyVerticallyVisible;
  const visible = fullyVisible || partiallyVisible;
  
  // Calcul du pourcentage visible
  let visibleHeight = 0;
  if (fullyVerticallyVisible) {
    visibleHeight = rect.height;
  } else if (partiallyVerticallyVisible) {
    if (elementTop < 0) {
      visibleHeight = rect.height + elementTop;
    } else {
      visibleHeight = viewportHeight - elementTop;
    }
  }
  
  const visiblePercentage = Math.round((visibleHeight / rect.height) * 100);
  
  return {
    visible,
    fullyVisible,
    partiallyVisible,
    position: {
      elementTop,
      elementBottom,
      viewportTop: 0,
      viewportBottom: viewportHeight,
      visiblePercentage
    }
  };
}

/**
 * Vérifie si le dernier message de la conversation est visible
 * @returns Un objet indiquant la visibilité du dernier message
 */
export function isLastMessageVisible(): {
  visible: boolean;
  details: string;
} {
  const messagesContainer = document.querySelector('.web-conversation-container');
  if (!messagesContainer) {
    return { 
      visible: false,
      details: "Conteneur de messages introuvable"
    };
  }
  
  const messages = document.querySelectorAll('.web-message');
  if (!messages.length) {
    return { 
      visible: false,
      details: "Aucun message trouvé"
    };
  }
  
  const lastMessage = messages[messages.length - 1] as HTMLElement;
  const visibility = isElementInViewport(lastMessage);
  
  if (!visibility.visible) {
    return {
      visible: false,
      details: `Message non visible (top: ${visibility.position.elementTop}, bottom: ${visibility.position.elementBottom}, viewport height: ${visibility.position.viewportBottom})`
    };
  }
  
  return {
    visible: true,
    details: `Message visible à ${visibility.position.visiblePercentage}%`
  };
}

/**
 * Surveille la visibilité du dernier message et force le défilement si nécessaire
 * Cette fonction peut être appelée après chaque rendu pour assurer la visibilité
 */
export function ensureLastMessageVisibility(): void {
  // Vérifier la visibilité
  const visibility = isLastMessageVisible();
  console.log("Vérification de visibilité:", visibility);
  
  // Si le message n'est pas visible ou partiellement visible, forcer le défilement
  if (!visibility.visible) {
    const messagesContainer = document.querySelector('.web-conversation-container');
    if (messagesContainer) {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
      
      // Vérifier à nouveau après le défilement forcé
      setTimeout(() => {
        const newVisibility = isLastMessageVisible();
        console.log("Après défilement forcé:", newVisibility);
        
        // Si toujours pas visible, essayer avec une approche différente
        if (!newVisibility.visible) {
          const scrollAnchor = document.querySelector('.scroll-anchor') as HTMLElement;
          if (scrollAnchor) {
            scrollAnchor.scrollIntoView({ behavior: 'auto', block: 'end' });
          }
        }
      }, 100);
    }
  }
}

/**
 * Définition de types pour le diagnostic de défilement
 */
type LastMessageInfo = {
  found: boolean;
  visible?: boolean;
  top?: number;
  height?: number;
  visiblePercentage?: number;
};

type DiagnosticResult = {
  viewport: {
    width: number;
    height: number;
    pixelRatio: number;
    isKeyboardOpen: boolean;
  },
  conversationContainer: {
    found: boolean;
    height?: number;
    scrollHeight?: number;
    scrollTop?: number;
    position?: string;
  },
  lastMessage: LastMessageInfo,
  formContainer: {
    found: boolean;
    top?: number;
    height?: number;
  }
};

/**
 * Diagnostique les problèmes de défilement en fournissant des informations détaillées
 * Utile pour déboguer les problèmes de visibilité sur différents appareils
 */
export function diagnoseScrollIssues(): DiagnosticResult {
  // Informations sur le viewport
  const viewport = {
    width: window.innerWidth,
    height: window.innerHeight,
    pixelRatio: window.devicePixelRatio,
    isKeyboardOpen: document.body.classList.contains('keyboard-open')
  };
  
  // Informations sur le conteneur de conversation
  const conversationContainer = document.querySelector('.web-conversation-container') as HTMLElement;
  const conversationInfo = conversationContainer ? {
    found: true,
    height: conversationContainer.clientHeight,
    scrollHeight: conversationContainer.scrollHeight,
    scrollTop: conversationContainer.scrollTop,
    position: window.getComputedStyle(conversationContainer).position
  } : { found: false };
  
  // Informations sur le dernier message
  const messages = document.querySelectorAll('.web-message');
  let lastMessageInfo: LastMessageInfo = { found: false };
  
  if (messages.length) {
    const lastMessage = messages[messages.length - 1] as HTMLElement;
    const visibility = isElementInViewport(lastMessage);
    
    lastMessageInfo = {
      found: true,
      visible: visibility.visible,
      top: lastMessage.getBoundingClientRect().top,
      height: lastMessage.clientHeight,
      visiblePercentage: visibility.position.visiblePercentage
    };
  }
  
  // Informations sur le conteneur de formulaire
  const formContainer = document.querySelector('.web-question-container') as HTMLElement;
  const formInfo = formContainer ? {
    found: true,
    top: formContainer.getBoundingClientRect().top,
    height: formContainer.clientHeight
  } : { found: false };
  
  // Retourner toutes les informations de diagnostic
  return {
    viewport,
    conversationContainer: conversationInfo,
    lastMessage: lastMessageInfo,
    formContainer: formInfo
  };
}
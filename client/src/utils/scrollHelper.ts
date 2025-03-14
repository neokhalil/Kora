/**
 * Utilitaire pour gérer les comportements de défilement de manière optimisée et cohérente
 * Résout les problèmes de défilement sur mobile et desktop
 */

/**
 * Options de configuration pour la fonction de défilement
 */
interface ScrollOptions {
  behavior?: 'smooth' | 'auto';
  delay?: number;
  immediate?: boolean;
  target?: HTMLElement | null;
}

/**
 * Cache le dernier moment où un défilement a été effectué pour éviter les appels redondants
 */
let lastScrollTimestamp = 0;
const SCROLL_THROTTLE = 100; // Minimum temps entre les défilements en ms

/**
 * Vérifie si nous sommes sur un appareil mobile
 */
const isMobileDevice = () => window.innerWidth <= 768;

/**
 * Fonction centrale qui gère tous les défilements dans l'application
 * - Empêche les défilements multiples en peu de temps
 * - Utilise des approches différentes selon le périphérique
 * - Garantit le défilement même après le rendu des formules et du code
 * 
 * @param options Options de défilement
 */
export const scrollToBottom = (options: ScrollOptions = {}) => {
  const now = Date.now();
  
  // Éviter des défilements trop rapprochés (sauf si immediate=true)
  if (!options.immediate && now - lastScrollTimestamp < SCROLL_THROTTLE) {
    return;
  }
  
  lastScrollTimestamp = now;
  
  // Récupérer ou trouver la cible du défilement
  const target = options.target || document.querySelector('.scroll-anchor') || document.querySelector('.web-conversation-container');
  
  if (!target) return;
  
  // Sur mobile, comportement spécifique pour éviter les problèmes
  if (isMobileDevice()) {
    const container = document.querySelector('.web-conversation-container');
    if (container) {
      // Défilement immédiat sans animation sur mobile
      container.scrollTop = container.scrollHeight;
      
      // Utiliser scrollIntoView sans animation si une ancre est disponible
      if (target !== container) {
        target.scrollIntoView({ behavior: 'auto', block: 'end' });
      }
    }
  } else {
    // Sur desktop, comportement standard avec animation si demandée
    const behavior = options.behavior || 'smooth';
    target.scrollIntoView({ behavior, block: 'end' });
  }
  
  // Lutter contre les problèmes de rendu asynchrone (formules mathématiques, etc.)
  if (options.delay !== 0) {
    const delay = options.delay || 300;
    setTimeout(() => {
      if (isMobileDevice()) {
        const container = document.querySelector('.web-conversation-container');
        if (container) {
          container.scrollTop = container.scrollHeight;
        }
        if (target !== container) {
          target.scrollIntoView({ behavior: 'auto', block: 'end' });
        }
      } else {
        target.scrollIntoView({ behavior: 'auto', block: 'end' });
      }
    }, delay);
  }
};

/**
 * Planifie un défilement automatique après des opérations importantes
 * Utiliser cette fonction au lieu de requestAnimationFrame pour assurer
 * un comportement cohérent sur tous les périphériques
 * 
 * @param options Options de défilement
 */
export const scheduleScroll = (options: ScrollOptions = {}) => {
  // Défilement immédiat
  scrollToBottom({ ...options, immediate: true });
  
  // Défilement différé pour s'assurer que le contenu est rendu
  const delay = options.delay || 300;
  setTimeout(() => {
    scrollToBottom({ ...options, immediate: true });
  }, delay);
};
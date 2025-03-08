/**
 * Script spécifique pour maintenir la visibilité du header quand le clavier virtuel est ouvert
 * Ce script utilise des techniques avancées pour détecter l'ouverture du clavier
 */

export function setupHeaderVisibilityFix() {
  if (typeof window === 'undefined') return;

  // Détection de l'environnement mobile
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  if (!isMobile) return; // Ne pas appliquer sur desktop

  // Fonction qui garde le header visible
  const keepHeaderVisible = () => {
    const header = document.getElementById('kora-header-container');
    if (header) {
      // Forcer le header à rester visible
      header.style.position = 'fixed';
      header.style.top = '0';
      header.style.left = '0';
      header.style.right = '0';
      header.style.zIndex = '9999';
      header.style.transform = 'translateZ(0)';
      header.style.backgroundColor = 'white';
    }
  };

  // Détection iOS
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
  
  // Utilisation de visualViewport sur les appareils récents
  if (window.visualViewport) {
    const viewportHandler = () => {
      keepHeaderVisible();
      
      // Sur iOS, détecter si le clavier est probablement ouvert (réduction significative de la hauteur du viewport)
      if (isIOS) {
        const viewportHeight = window.visualViewport.height;
        const windowHeight = window.innerHeight;
        
        // Si la hauteur du viewport est significativement réduite (< 70% de la fenêtre), 
        // c'est probablement que le clavier est ouvert
        if (viewportHeight < windowHeight * 0.7) {
          document.body.classList.add('keyboard-open');
          keepHeaderVisible();
        } else {
          document.body.classList.remove('keyboard-open');
        }
      }
    };
    
    window.visualViewport.addEventListener('resize', viewportHandler);
    window.visualViewport.addEventListener('scroll', viewportHandler);
  }
  
  // Sur Android, utiliser une approche basée sur la hauteur de la fenêtre
  if (!isIOS) {
    let lastWindowHeight = window.innerHeight;
    
    window.addEventListener('resize', () => {
      const currentHeight = window.innerHeight;
      
      // Si la hauteur de la fenêtre diminue significativement, c'est probablement le clavier
      if (currentHeight < lastWindowHeight * 0.8) {
        document.body.classList.add('keyboard-open');
        keepHeaderVisible();
      } else if (currentHeight > lastWindowHeight * 0.9) {
        document.body.classList.remove('keyboard-open');
      }
      
      lastWindowHeight = currentHeight;
    });
  }
  
  // Gestion des événements de focus pour assurer la visibilité du header
  document.addEventListener('focusin', (e) => {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
      document.body.classList.add('input-focused');
      keepHeaderVisible();
    }
  });
  
  document.addEventListener('focusout', () => {
    document.body.classList.remove('input-focused');
  });
  
  // Appliquer les corrections de visibilité au chargement
  keepHeaderVisible();
  
  // Réappliquer lors du défilement
  window.addEventListener('scroll', keepHeaderVisible);
}
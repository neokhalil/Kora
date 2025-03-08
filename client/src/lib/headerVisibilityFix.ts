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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (typeof window !== 'undefined' && 'visualViewport' in window) {
    const visualViewport = window.visualViewport as VisualViewport;
    
    const viewportHandler = () => {
      keepHeaderVisible();
      
      // Sur iOS, détecter si le clavier est probablement ouvert (réduction significative de la hauteur du viewport)
      if (isIOS) {
        const viewportHeight = visualViewport.height;
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
    
    visualViewport.addEventListener('resize', viewportHandler);
    visualViewport.addEventListener('scroll', viewportHandler);
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
      // Marquer le body pour appliquer des styles spécifiques
      document.body.classList.add('input-focused');
      
      // Marquer l'élément actif pour pouvoir le garder visible
      const allInputs = document.querySelectorAll('input, textarea');
      allInputs.forEach(input => input.classList.remove('active-input'));
      
      // Ajouter la classe à l'élément actuellement focalisé
      (e.target as HTMLElement).classList.add('active-input');
      
      // S'assurer que le parent a aussi une classe pour pouvoir appliquer des styles
      let parent = (e.target as HTMLElement).parentElement;
      if (parent) {
        parent.classList.add('has-active-input');
      }
      
      // Garder le header visible
      keepHeaderVisible();
    }
  });
  
  document.addEventListener('focusout', (e) => {
    // Léger délai pour gérer les transitions entre champs
    setTimeout(() => {
      if (!document.activeElement || 
          !(document.activeElement instanceof HTMLInputElement || 
            document.activeElement instanceof HTMLTextAreaElement)) {
        // Retirer les classes
        document.body.classList.remove('input-focused');
        
        const allInputs = document.querySelectorAll('input, textarea');
        allInputs.forEach(input => input.classList.remove('active-input'));
        
        const allContainers = document.querySelectorAll('.has-active-input');
        allContainers.forEach(container => container.classList.remove('has-active-input'));
      }
    }, 100);
  });
  
  // Appliquer les corrections de visibilité au chargement
  keepHeaderVisible();
  
  // Réappliquer lors du défilement
  window.addEventListener('scroll', keepHeaderVisible);
}
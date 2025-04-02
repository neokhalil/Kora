import { useEffect, useState, RefObject } from 'react';

/**
 * Hook personnalisé qui utilise ResizeObserver pour suivre les changements de taille d'un élément DOM
 * 
 * Ce hook est un élément essentiel de notre solution d'adaptation mobile pour plusieurs raisons:
 * 1. Il permet de détecter en temps réel les changements de dimensions d'un élément (par exemple 
 *    la zone de saisie quand l'utilisateur tape un message plus long)
 * 2. Contrairement à un gestionnaire d'événements classique (resize, etc.), il surveille
 *    spécifiquement les changements de dimensions d'un élément particulier
 * 3. Il permet d'adapter dynamiquement l'interface en fonction de ces changements (par exemple
 *    ajuster la hauteur du spacer dynamique pour empêcher la zone de saisie de masquer du contenu)
 * 4. Il offre une solution plus robuste qu'un padding statique car il s'adapte aux variations
 *    de hauteur du composer sur différents appareils et états d'interface
 * 
 * Dans notre application, ce hook est utilisé pour:
 * - Surveiller la hauteur de la zone de saisie (composer)
 * - Ajuster la hauteur du spacer dynamique en conséquence
 * - Maintenir une expérience utilisateur fluide sur mobile
 * 
 * @param ref Référence React à l'élément DOM à observer
 * @param callback Fonction optionnelle à appeler lors des changements de taille
 * @returns Un objet contenant la largeur et la hauteur actuelles de l'élément
 */
export function useResizeObserver<T extends HTMLElement>(
  ref: RefObject<T>,
  callback?: (entry: ResizeObserverEntry) => void
) {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    // Sortir tôt si l'élément n'existe pas encore dans le DOM
    if (!ref.current) return;

    const element = ref.current;
    
    // Créer un nouvel observateur de redimensionnement
    // Le ResizeObserver est une API moderne qui nous permet de réagir
    // aux changements de taille d'un élément spécifique, sans avoir à
    // écouter les événements de redimensionnement de la fenêtre
    const resizeObserver = new ResizeObserver(entries => {
      if (!entries.length) return;
      
      const entry = entries[0];
      
      // Extraire les dimensions actuelles (contentRect contient les dimensions de contenu)
      const { width, height } = entry.contentRect;
      
      // Mettre à jour l'état avec les nouvelles dimensions
      // Ces valeurs seront accessibles via le retour du hook
      setDimensions({ width, height });
      
      // Si un callback a été fourni, l'appeler avec les données complètes de l'entrée
      // Cela permet à l'appelant de traiter directement les changements de taille
      // (comme dans notre cas pour ajuster la hauteur du spacer)
      if (callback) callback(entry);
    });
    
    // Commencer à observer l'élément cible
    // À partir de ce moment, le callback sera appelé chaque fois que
    // l'élément change de taille
    resizeObserver.observe(element);
    
    // Fonction de nettoyage pour éviter les fuites de mémoire
    // Cette fonction sera exécutée lorsque le composant sera démonté
    // ou lorsque la référence ou le callback changeront
    return () => {
      // Arrêter d'observer l'élément spécifique
      if (element) resizeObserver.unobserve(element);
      // Déconnecter complètement l'observateur
      resizeObserver.disconnect();
    };
  }, [ref, callback]);
  
  return dimensions;
}
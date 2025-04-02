import { useEffect, useState, RefObject } from 'react';

/**
 * HOOK OBSOLÈTE - CONSERVÉ UNIQUEMENT COMME RÉFÉRENCE
 * 
 * Ce hook n'est plus utilisé dans l'application. Nous l'avons remplacé par 
 * une approche plus simple utilisant un padding-bottom fixe très important
 * dans les fichiers CSS (mobile-fixes.css).
 * 
 * ARCHITECTURE PRÉCÉDENTE (OBSOLÈTE) :
 * Ce hook faisait partie d'une solution dynamique qui ajustait l'espacement
 * en fonction de la hauteur du composer. Bien que techniquement correcte,
 * cette approche s'est avérée trop complexe et sujette à des problèmes
 * sur certains appareils.
 * 
 * NOUVELLE ARCHITECTURE :
 * - padding-bottom fixe de 500px sur tablette dans .chat-messages-container
 * - padding-bottom fixe de 600px sur mobile dans .chat-messages-container
 * - Aucun calcul dynamique JavaScript
 * 
 * Cette nouvelle approche est plus simple, plus robuste et offre une 
 * meilleure compatibilité entre appareils.
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
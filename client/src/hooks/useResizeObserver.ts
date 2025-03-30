import { useEffect, useState, RefObject } from 'react';

/**
 * Hook personnalisé qui utilise ResizeObserver pour suivre les changements de taille d'un élément DOM
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
    if (!ref.current) return;

    const element = ref.current;
    
    const resizeObserver = new ResizeObserver(entries => {
      if (!entries.length) return;
      
      const entry = entries[0];
      
      // Mettre à jour les dimensions
      const { width, height } = entry.contentRect;
      setDimensions({ width, height });
      
      // Appeler le callback si fourni
      if (callback) callback(entry);
    });
    
    // Observer l'élément
    resizeObserver.observe(element);
    
    // Nettoyer l'observateur à la destruction du composant
    return () => {
      if (element) resizeObserver.unobserve(element);
      resizeObserver.disconnect();
    };
  }, [ref, callback]);
  
  return dimensions;
}
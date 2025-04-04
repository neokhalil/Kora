import React, { useEffect, useRef } from 'react';

interface MathMessageWrapperProps {
  children: React.ReactNode;
  hasMath: boolean;
  className?: string;
}

/**
 * Composant wrapper spécialisé pour les messages contenant des formules mathématiques
 * Permet un traitement particulier des formules afin d'éviter les problèmes de défilement
 */
const MathMessageWrapper: React.FC<MathMessageWrapperProps> = ({ 
  children, 
  hasMath, 
  className = '' 
}) => {
  const contentRef = useRef<HTMLDivElement>(null);
  
  // Effet spécial uniquement pour les messages contenant des formules mathématiques
  useEffect(() => {
    if (hasMath && contentRef.current) {
      // Attendre que KaTeX ait complètement terminé le rendu
      // Un délai légèrement plus long permet de s'assurer que tout est bien rendu
      const timer = setTimeout(() => {
        // Forcer une mise à jour après le rendu complet des formules
        window.dispatchEvent(new Event('resize'));
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [hasMath]);
  
  return (
    <div 
      ref={contentRef} 
      className={`message-content-wrapper ${hasMath ? "math-content-wrapper" : ""} ${className}`}
    >
      {children}
    </div>
  );
};

export default MathMessageWrapper;
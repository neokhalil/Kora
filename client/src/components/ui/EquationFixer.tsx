import React, { useState, useEffect, useRef } from 'react';

/**
 * Composant de correction d'équation qui capture et résout les problèmes
 * lorsque MathJax ne rend pas correctement les équations
 */
interface EquationFixerProps {
  htmlContent: string;
}

const EquationFixer: React.FC<EquationFixerProps> = ({ htmlContent }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [fixedContent, setFixedContent] = useState(htmlContent);

  useEffect(() => {
    // Fonction qui recherche et répare les signes de problèmes d'équations
    const fixEquationRendering = () => {
      if (!containerRef.current) return;
      
      // 1. Rechercher les équations mal rendues (chiffre "1" isolé ou vide)
      const nodeList = containerRef.current.querySelectorAll('span.mjx-chtml');
      
      nodeList.forEach((node) => {
        const nodeText = node.textContent?.trim();
        
        // Si le nœud contient uniquement "1" ou est vide, c'est probablement une équation mal rendue
        if (nodeText === "1" || nodeText === "") {
          // Essayer de récupérer l'équation originale
          const parentNode = node.closest('[data-mjx-texcode]');
          const originalTeX = parentNode?.getAttribute('data-mjx-texcode') || '';
          
          if (originalTeX && originalTeX !== "1") {
            // Remplacer par un message d'erreur pour signaler le problème
            const errorElement = document.createElement('span');
            errorElement.className = 'equation-error';
            errorElement.textContent = '(Formule non rendue: ' + originalTeX + ')';
            errorElement.style.color = '#e74c3c';
            errorElement.style.fontStyle = 'italic';
            
            // Remplacer l'élément problématique
            if (parentNode) {
              parentNode.replaceWith(errorElement);
            } else {
              node.replaceWith(errorElement);
            }
          }
        }
      });
      
      // Mettre à jour le contenu pour une nouvelle tentative de rendu si nécessaire
      if (containerRef.current) {
        setFixedContent(containerRef.current.innerHTML);
      }
    };

    // Attendre que MathJax ait terminé son traitement
    const timer = setTimeout(fixEquationRendering, 500);
    
    return () => clearTimeout(timer);
  }, [htmlContent]);

  return (
    <div 
      ref={containerRef}
      className="equation-fixer" 
      dangerouslySetInnerHTML={{ __html: fixedContent }} 
    />
  );
};

export default EquationFixer;
import React, { useEffect, useRef, useState } from 'react';
import { MathJax } from 'better-react-mathjax';

interface MathContentProps {
  content: string;
  className?: string;
}

/**
 * Composant pour rendre du contenu mathématique avec MathJax, 
 * tout en évitant les "sauts" d'affichage lors de l'apparition progressive.
 */
const MathJaxRenderer: React.FC<MathContentProps> = ({ content, className = "" }) => {
  // Référence pour obtenir les dimensions du conteneur
  const containerRef = useRef<HTMLDivElement>(null);
  // État pour stocker les dimensions stables
  const [stableHeight, setStableHeight] = useState<number | null>(null);
  
  // Formater le contenu pour remplacer les retours à la ligne par des balises <br />
  const formattedContent = content.replace(/\n/g, '<br />');
  
  // Traiter le formatage Markdown basique
  const markdownFormatted = formattedContent
    // Gras - Gérer le cas avec ** (format Markdown)
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // Italique - Gérer le cas avec * (format Markdown)
    .replace(/\*([^\*]+)\*/g, '<em>$1</em>')
    // Soulignement - Gérer le cas avec __ (double underscore)
    .replace(/\_\_([^\_]+)\_\_/g, '<u>$1</u>')
    // Liste avec puces avec * ou -
    .replace(/^[\*\-]\s+(.*?)$/gm, '<li>$1</li>')
    // Barré avec ~~ (format Markdown)
    .replace(/\~\~(.*?)\~\~/g, '<s>$1</s>');
  
  // Améliorer les titres et les étapes numérotées pour une meilleure mise en page
  const enhancedContent = markdownFormatted
    // Améliorer les titres
    .replace(/^(Pour résoudre|Résolution|Résoudre)\s+(.*):$/gm, '<h3>$1 $2 :</h3>')
    // Sections avec ###
    .replace(/###\s*(.*?)$/gm, '<h3>$1</h3>')
    // Améliorer la numérotation des étapes
    .replace(/(\d+)\.\s+(.*?):/g, '<strong>$1. $2 :</strong>')
    // Ne pas mettre les nombres en gras s'ils ne sont pas suivis de titres
    .replace(/^(\d+)\.\s+([^<]*[^:])/gm, '<span class="step-number">$1.</span> $2')
    // Assurer que chaque phrase numérotée est sur une ligne séparée
    .replace(/(\d+\.\s+[^.]+\.)\s+(\d+\.)/g, '$1<br /><br />$2')
    // Mise en forme des résultats intermédiaires
    .replace(/(Ce qui donne|On obtient|Ce qui nous donne|Ceci donne)\s*:/g, '<div class="result">$1 :</div>')
    // Mise en forme de la conclusion
    .replace(/(Donc|En conclusion|Ainsi|Par conséquent),\s*(la solution|le résultat|la réponse)\s*est\s*/g, 
      '<div class="conclusion">$1, $2 est </div>');

  // Observer les changements de hauteur et stabiliser
  useEffect(() => {
    // Si le contenu est vide, ne pas définir de hauteur minimale
    if (!content || content.length < 20) {
      setStableHeight(null);
      return;
    }

    // Si le contenu semble complet, mesurer la hauteur
    if (content.length > 100 && containerRef.current) {
      const currentHeight = containerRef.current.offsetHeight;
      
      // Seulement mettre à jour la hauteur si elle est plus grande que la précédente
      setStableHeight(prev => {
        if (!prev || currentHeight > prev) {
          return currentHeight;
        }
        return prev;
      });
    }
  }, [content]);

  return (
    <div 
      ref={containerRef}
      className={`math-content ${className}`}
      style={stableHeight ? { minHeight: `${stableHeight}px` } : undefined}
    >
      <MathJax>
        <div dangerouslySetInnerHTML={{ __html: enhancedContent }} />
      </MathJax>
    </div>
  );
};

export default MathJaxRenderer;
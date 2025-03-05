import React from 'react';
import { MathJax } from 'better-react-mathjax';

interface MathContentProps {
  content: string;
  className?: string;
}

/**
 * Composant pour rendre du contenu mathématique avec MathJax
 */
const MathJaxRenderer: React.FC<MathContentProps> = ({ content, className = "" }) => {
  // Formater le contenu pour remplacer les retours à la ligne par des balises <br />
  const formattedContent = content.replace(/\n/g, '<br />');
  
  // Améliorer les titres et les étapes numérotées pour une meilleure mise en page
  const enhancedContent = formattedContent
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

  return (
    <div className={`math-content ${className}`}>
      <MathJax>
        <div dangerouslySetInnerHTML={{ __html: enhancedContent }} />
      </MathJax>
    </div>
  );
};

export default MathJaxRenderer;
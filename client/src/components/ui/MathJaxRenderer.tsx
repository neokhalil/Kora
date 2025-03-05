import React, { useEffect, useRef, useState } from 'react';
import { MathJax } from 'better-react-mathjax';

interface MathContentProps {
  content: string;
  className?: string;
}

/**
 * Composant pour rendre du contenu mathématique avec MathJax, 
 * optimisé pour éviter les tremblements tout en permettant
 * une animation de texte fluide et naturelle.
 */
const MathJaxRenderer: React.FC<MathContentProps> = ({ content, className = "" }) => {
  // Référence pour obtenir les dimensions du conteneur
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Formater le contenu pour remplacer les retours à la ligne par des balises <br />
  const formattedContent = content.replace(/\n/g, '<br />');
  
  // Prétraiter les titres avec ### avant toute autre transformation
  let headingsPreprocessed = formattedContent;
  
  // Première passe pour identifier et remplacer les sections avec ###
  const headingRegex = /(^|<br \/>)###\s+(.*?)(?=<br|$)/g;
  headingsPreprocessed = headingsPreprocessed.replace(
    headingRegex, 
    '$1<h3 class="section-heading">$2</h3>'
  );
  
  // Deuxième passe pour les cas où ### est au milieu
  headingsPreprocessed = headingsPreprocessed.replace(
    /(?<=\s)###\s+(.*?)(?=<br|$)/g,
    '<h3 class="section-heading">$1</h3>'
  );
  
  // Traiter le formatage Markdown basique
  const markdownFormatted = headingsPreprocessed
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
    <div 
      ref={containerRef}
      className={`math-content ${className}`}
      style={{ 
        willChange: 'transform',
        transform: 'translateZ(0)',
        position: 'relative', 
        // Utiliser une hauteur d'une ligne minimum pour stabiliser le contenu
        minHeight: '20px'
      }}
    >
      <MathJax>
        <div 
          dangerouslySetInnerHTML={{ __html: enhancedContent }}
          style={{ transform: 'translateZ(0)' }}
          className="math-content-inner"
        />
      </MathJax>
    </div>
  );
};

export default MathJaxRenderer;
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
  // État pour stocker les dimensions stables
  const [stableHeight, setStableHeight] = useState<number | null>(null);
  
  // Formater le contenu pour remplacer les retours à la ligne par des balises <br />
  const formattedContent = content.replace(/\n/g, '<br />');
  
  // Prétraiter les titres avec ### ou #### avant toute autre transformation
  let headingsPreprocessed = formattedContent;
  
  // Remplacer d'abord les #### (quatre dièses)
  headingsPreprocessed = headingsPreprocessed.replace(
    /(^|<br \/>)####\s+(.*?)(?=<br|$)/g, 
    '$1<h4 class="section-heading">$2</h4>'
  );
  
  // Remplacer ensuite les titres avec ### (trois dièses)
  headingsPreprocessed = headingsPreprocessed.replace(
    /(^|<br \/>)###\s+(.*?)(?=<br|$)/g, 
    '$1<h3 class="section-heading">$2</h3>'
  );
  
  // Deuxième passe pour les cas où les titres sont au milieu du texte
  headingsPreprocessed = headingsPreprocessed.replace(
    /(?<=\s)####\s+(.*?)(?=<br|$)/g,
    '<h4 class="section-heading">$1</h4>'
  );
  
  headingsPreprocessed = headingsPreprocessed.replace(
    /(?<=\s)###\s+(.*?)(?=<br|$)/g,
    '<h3 class="section-heading">$1</h3>'
  );
  
  // Rechercher et remplacer les titres spéciaux comme "Résolution Générale"
  headingsPreprocessed = headingsPreprocessed.replace(
    /(^|<br \/>)(Résolution Générale|Méthode|Solution|Approche|Démarche)\s*:?(?=<br|$)/g,
    '$1<h3 class="section-heading">$2</h3>'
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

  // Observer les changements de hauteur et stabiliser
  useEffect(() => {
    // Si le contenu est vide, ne pas définir de hauteur minimale
    if (!content || content.length < 10) {
      setStableHeight(null);
      return;
    }

    // Timer pour laisser MathJax terminer le rendu initial
    const initialRenderTimer = setTimeout(() => {
      if (containerRef.current) {
        const currentHeight = containerRef.current.offsetHeight;
        if (currentHeight > 0) {
          setStableHeight(currentHeight);
        }
      }
    }, 50); // Petit délai pour le rendu initial
    
    return () => clearTimeout(initialRenderTimer);
  }, [content]);

  return (
    <div 
      ref={containerRef}
      className={`math-content ${className}`}
      style={{ 
        position: 'relative', 
        minHeight: stableHeight ? `${stableHeight}px` : '20px',
        containIntrinsicSize: stableHeight ? `auto ${stableHeight}px` : 'auto auto'
      }}
    >
      <MathJax>
        <div 
          dangerouslySetInnerHTML={{ __html: enhancedContent }}
          className="math-content-inner"
          style={{ contain: 'content' }}
        />
      </MathJax>
    </div>
  );
};

export default MathJaxRenderer;
import React, { useEffect, useRef, useState } from 'react';
import { MathJax } from 'better-react-mathjax';

interface MathContentProps {
  content: string;
  className?: string;
}

/**
 * Composant pour rendre du contenu mathématique avec MathJax, 
 * tout en évitant les "sauts" d'affichage lors de l'apparition progressive.
 * Utilise une approche en deux étapes pour le rendu:
 * 1. Pré-rendu invisible pour calculer les dimensions finales
 * 2. Rendu visible avec hauteur stable
 */
const MathJaxRenderer: React.FC<MathContentProps> = ({ content, className = "" }) => {
  // Référence pour obtenir les dimensions du conteneur
  const containerRef = useRef<HTMLDivElement>(null);
  // Référence pour le conteneur invisible qui pré-calcule les dimensions
  const preRenderRef = useRef<HTMLDivElement>(null);
  // État pour stocker les dimensions stables
  const [stableHeight, setStableHeight] = useState<number | null>(null);
  // État pour suivre si le contenu est entièrement affiché
  const [isFullyRendered, setIsFullyRendered] = useState(false);
  
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

  // Pré-calcul des dimensions et rendu en deux phases
  useEffect(() => {
    // Si le contenu est vide, ne pas définir de hauteur minimale
    if (!content || content.length < 20) {
      setStableHeight(null);
      setIsFullyRendered(true);
      return;
    }

    // Réinitialiser l'état de rendu lors du changement de contenu
    setIsFullyRendered(false);
    
    // Première phase: Calculer la hauteur avec le pré-rendu invisible
    const preRenderTimer = setTimeout(() => {
      if (preRenderRef.current) {
        // Calculer la hauteur du contenu complet dans le conteneur invisible
        const estimatedHeight = preRenderRef.current.offsetHeight + 30; // Marge de sécurité
        setStableHeight(estimatedHeight);
        
        // Passer à la deuxième phase après un court délai
        const visibleRenderTimer = setTimeout(() => {
          setIsFullyRendered(true);
        }, 50);
        
        return () => clearTimeout(visibleRenderTimer);
      }
    }, 100); // Délai court pour laisser le DOM se mettre à jour
    
    return () => clearTimeout(preRenderTimer);
  }, [content]);

  return (
    <>
      {/* Pré-rendu invisible pour calculer les dimensions finales */}
      <div 
        ref={preRenderRef}
        aria-hidden="true"
        className="invisible fixed top-0 left-0 w-full opacity-0 pointer-events-none"
        style={{ position: 'absolute', zIndex: -1000 }}
      >
        <MathJax>
          <div dangerouslySetInnerHTML={{ __html: enhancedContent }} />
        </MathJax>
      </div>
      
      {/* Conteneur visible avec hauteur stable */}
      <div 
        ref={containerRef}
        className={`math-content ${className} ${isFullyRendered ? 'opacity-100' : 'opacity-0'}`}
        style={{ 
          minHeight: stableHeight ? `${stableHeight}px` : undefined,
          transition: 'opacity 0.2s ease-in-out',
          willChange: 'opacity, transform'
        }}
      >
        <MathJax>
          <div dangerouslySetInnerHTML={{ __html: enhancedContent }} />
        </MathJax>
      </div>
    </>
  );
};

export default MathJaxRenderer;
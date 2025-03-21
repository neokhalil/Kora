import React, { useEffect, useRef } from 'react';
import KatexRenderer from './KatexRenderer';
import CodeBlock from './CodeBlock';
import { MathSegment, segmentTextWithMath, sanitizeFormula, parseCodeBlock } from '../../utils/mathProcessor';
import { useIsMobile } from '@/hooks/use-mobile';

interface ContentRendererProps {
  content: string;
  className?: string;
}

/**
 * Composant principal pour le rendu du contenu combinant texte, maths et code
 * Remplace le composant MathJaxRenderer précédent avec une approche plus modulaire
 */
const ContentRenderer: React.FC<ContentRendererProps> = ({ content, className = '' }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  
  // Effet pour s'assurer que les éléments mathématiques et code sont bien rendus sur mobile
  useEffect(() => {
    // Fonction pour s'assurer que les conteneurs d'équations ne créent pas de problèmes de mise en page
    const fixMathLayout = () => {
      if (containerRef.current) {
        // Trouver tous les conteneurs d'équations en bloc
        const katexDisplays = containerRef.current.querySelectorAll('.katex-display');
        
        // Ajuster chaque conteneur pour éviter les problèmes de mise en page
        katexDisplays.forEach((display) => {
          // S'assurer que l'élément ne dépasse pas de son conteneur
          if (display instanceof HTMLElement) {
            display.style.maxWidth = '100%';
            display.style.overflowX = 'auto';
            display.style.overflowY = 'hidden';
          }
        });
      }
    };
    
    // Exécuter la correction de mise en page après un court délai pour s'assurer que le rendu est terminé
    if (isMobile) {
      const timer = setTimeout(() => {
        fixMathLayout();
      }, 50);
      
      return () => clearTimeout(timer);
    }
  }, [content, isMobile]);
  
  if (!content) {
    return null;
  }
  
  // Formatter le contenu texte normal (appliquer les styles Markdown, liens, etc.)
  const formatTextContent = (text: string): JSX.Element => {
    // Nous traitons d'abord le formatage Markdown avant de gérer les sauts de ligne
    // pour éviter d'interférer avec la syntaxe Markdown
    
    // Appliquer le formatage Markdown de base (titres, gras, italique, etc.)
    const withMarkdown = text
      // Titres (multi-lignes)
      .replace(/(^|\n)(#{1,6})\s+(.+?)(\n|$)/g, (match, pre, hashes, title, post) => {
        const level = hashes.length;
        const size = ['text-3xl', 'text-2xl', 'text-xl', 'text-lg', 'text-base', 'text-base'][Math.min(level - 1, 5)];
        return `${pre}<h${level} class="${size} font-bold mt-4 mb-2">${title}</h${level}>${post}`;
      })
      // Gras
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      // Italique
      .replace(/\*([^*]+)\*/g, '<em>$1</em>')
      // Listes à puces
      .replace(/^-\s+(.+?)$/gm, '<li>$1</li>')
      // Listes numérotées
      .replace(/^(\d+)\.\s+(.+?)$/gm, '<li value="$1">$2</li>');
    
    // Maintenant, remplacer les sauts de ligne restants par des <br />
    // mais pas juste après une balise de titre (pour éviter les espaces vides)
    const withLineBreaks = withMarkdown
      .replace(/(<\/h[1-6]>)\n/g, '$1')  // Supprimer le saut de ligne après un titre
      .replace(/\n/g, '<br />');         // Convertir les autres sauts de ligne en <br />
    
    return <span dangerouslySetInnerHTML={{ __html: withLineBreaks }} />;
  };
  
  // Diviser le contenu en segments (texte, formules mathématiques, et code)
  const segments = segmentTextWithMath(content);
  
  // Préparer le rendu des segments
  const renderedContent = segments.map((segment: MathSegment, index: number) => {
    if (segment.type === 'inline-math') {
      return (
        <KatexRenderer
          key={`math-${index}`}
          formula={sanitizeFormula(segment.content)}
          display={false}
        />
      );
    }
    
    if (segment.type === 'block-math') {
      return (
        <KatexRenderer
          key={`math-block-${index}`}
          formula={sanitizeFormula(segment.content)}
          display={true}
          className="my-4"
        />
      );
    }
    
    if (segment.type === 'code') {
      const { language, code } = parseCodeBlock(segment.content);
      return (
        <CodeBlock
          key={`code-${index}`}
          code={code}
          language={language}
          showLineNumbers={true}
          showCopyButton={true}
        />
      );
    }
    
    // Segment text par défaut
    return (
      <React.Fragment key={`text-${index}`}>
        {formatTextContent(segment.content)}
      </React.Fragment>
    );
  });
  
  return (
    <div ref={containerRef} className={`content-renderer ${className}`}>
      {renderedContent}
    </div>
  );
};

export default ContentRenderer;
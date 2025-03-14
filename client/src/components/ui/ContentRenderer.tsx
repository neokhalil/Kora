import React from 'react';
import KatexRenderer from './KatexRenderer';
import CodeBlock from './CodeBlock';
import { MathSegment, segmentTextWithMath, sanitizeFormula, parseCodeBlock } from '../../utils/mathProcessor';

interface ContentRendererProps {
  content: string;
  className?: string;
}

/**
 * Composant principal pour le rendu du contenu combinant texte, maths et code
 * Remplace le composant MathJaxRenderer précédent avec une approche plus modulaire
 */
const ContentRenderer: React.FC<ContentRendererProps> = ({ content, className = '' }) => {
  if (!content) {
    return null;
  }
  
  // Formatter le contenu texte normal (appliquer les styles Markdown, liens, etc.)
  const formatTextContent = (text: string): JSX.Element => {
    // Remplacer les sauts de ligne par des <br />
    const withLineBreaks = text.replace(/\n/g, '<br />');
    
    // Appliquer le formatage Markdown de base (titres, gras, italique, etc.)
    const withMarkdown = withLineBreaks
      // Titres
      .replace(/^(#{1,6})\s+(.+?)$/gm, (_, hashes, title) => {
        const level = hashes.length;
        const size = ['text-3xl', 'text-2xl', 'text-xl', 'text-lg', 'text-base', 'text-base'][Math.min(level - 1, 5)];
        return `<h${level} class="${size} font-bold">${title}</h${level}>`;
      })
      // Gras
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      // Italique
      .replace(/\*([^*]+)\*/g, '<em>$1</em>')
      // Listes à puces
      .replace(/^-\s+(.+?)$/gm, '<li>$1</li>')
      // Listes numérotées
      .replace(/^(\d+)\.\s+(.+?)$/gm, '<li value="$1">$2</li>');
    
    return <span dangerouslySetInnerHTML={{ __html: withMarkdown }} />;
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
    <div className={`content-renderer ${className}`}>
      {renderedContent}
    </div>
  );
};

export default ContentRenderer;
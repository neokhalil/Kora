import React from 'react';
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';
import hljs from 'highlight.js';
import 'highlight.js/styles/github.css';

interface TextContentProps {
  content: string;
  className?: string;
}

/**
 * Composant de rendu pour le texte et les formules mathématiques utilisant KaTeX
 * Approche simple et efficace basée sur un système de marquage des sections
 */
const KatexRenderer: React.FC<TextContentProps> = ({ content, className = '' }) => {
  if (!content) {
    return null;
  }

  // Préparation - Diviser le contenu en blocs pour traitement
  const paragraphs = content.split(/\n\n+/);
  
  return (
    <div className={`katex-renderer ${className}`}>
      {paragraphs.map((paragraph, index) => {
        // 1. Traitement des blocs de code
        if (paragraph.startsWith('```')) {
          const codeMatch = paragraph.match(/```(\w*)\n([\s\S]*?)```/);
          if (codeMatch) {
            const language = codeMatch[1] || 'plaintext';
            const code = codeMatch[2];
            
            try {
              const highlightedCode = language 
                ? hljs.highlight(code, { language }).value 
                : hljs.highlightAuto(code).value;
              
              return (
                <pre key={`code-${index}`} className="code-block">
                  <code
                    className={`language-${language}`}
                    dangerouslySetInnerHTML={{ __html: highlightedCode }}
                  />
                </pre>
              );
            } catch (error) {
              return (
                <pre key={`code-${index}`} className="code-block">
                  <code dangerouslySetInnerHTML={{ __html: hljs.highlightAuto(code).value }} />
                </pre>
              );
            }
          }
        }
        
        // 2. Traiter les titres markdown
        if (/^#{1,6}\s+.+$/.test(paragraph)) {
          const match = paragraph.match(/^(#{1,6})\s+(.+)$/);
          if (match) {
            const level = match[1].length;
            const title = match[2];
            const HeadingTag = `h${level}` as keyof JSX.IntrinsicElements;
            return <HeadingTag key={`heading-${index}`} className="math-heading">{renderInlineContent(title)}</HeadingTag>;
          }
        }
        
        // 3. Traiter les paragraphes réguliers ou numérotés
        if (/^\d+\.\s/.test(paragraph)) {
          // Paragraphe numéroté (comme une étape de résolution)
          return (
            <div key={`numbered-${index}`} className="numbered-paragraph">
              {renderFormattedContent(paragraph)}
            </div>
          );
        }
        
        // 4. Paragraphe standard
        return (
          <div key={`p-${index}`} className="paragraph">
            {renderFormattedContent(paragraph)}
          </div>
        );
      })}
    </div>
  );
};

/**
 * Render le contenu d'un paragraphe avec prise en charge des formules mathématiques
 * et du formatage de base
 */
function renderFormattedContent(text: string): React.ReactNode {
  // Diviser le texte en segments : texte normal et formules mathématiques
  const segments: React.ReactNode[] = [];
  let currentText = '';
  let lastIndex = 0;
  
  // Recherche des formules en bloc $$...$$
  const blockRegex = /\$\$([\s\S]*?)\$\$/g;
  let blockMatch;
  
  while ((blockMatch = blockRegex.exec(text)) !== null) {
    // Ajouter le texte avant la formule en bloc
    if (blockMatch.index > lastIndex) {
      currentText += text.substring(lastIndex, blockMatch.index);
      segments.push(renderInlineContent(currentText));
      currentText = '';
    }
    
    // Ajouter la formule en bloc
    try {
      segments.push(
        <div key={`block-${blockMatch.index}`} className="katex-block">
          <BlockMath math={blockMatch[1]} />
        </div>
      );
    } catch (error) {
      segments.push(
        <div key={`block-error-${blockMatch.index}`} className="katex-error">
          Erreur de rendu: {blockMatch[0]}
        </div>
      );
    }
    
    lastIndex = blockMatch.index + blockMatch[0].length;
  }
  
  // Ajouter le texte restant après la dernière formule en bloc
  if (lastIndex < text.length) {
    currentText += text.substring(lastIndex);
    segments.push(renderInlineContent(currentText));
  }
  
  return segments;
}

/**
 * Render le contenu en ligne avec prise en charge des formules mathématiques inline
 * et du formatage de base (gras, italique, etc.)
 */
function renderInlineContent(text: string): React.ReactNode {
  if (!text) return null;
  
  // Traiter les formules mathématiques inline $...$
  const segments: React.ReactNode[] = [];
  const inlineRegex = /\$(.*?)\$/g;
  let currentText = '';
  let lastIndex = 0;
  let match;
  
  while ((match = inlineRegex.exec(text)) !== null) {
    // Ajouter le texte avant la formule
    if (match.index > lastIndex) {
      currentText += text.substring(lastIndex, match.index);
      segments.push(formatTextWithStyles(currentText));
      currentText = '';
    }
    
    // Ajouter la formule inline
    try {
      segments.push(
        <span key={`inline-${match.index}`} className="katex-inline">
          <InlineMath math={match[1]} />
        </span>
      );
    } catch (error) {
      segments.push(
        <span key={`inline-error-${match.index}`} className="katex-error">
          {match[0]}
        </span>
      );
    }
    
    lastIndex = match.index + match[0].length;
  }
  
  // Ajouter le texte restant après la dernière formule
  if (lastIndex < text.length) {
    currentText += text.substring(lastIndex);
    segments.push(formatTextWithStyles(currentText));
  }
  
  return segments;
}

/**
 * Applique le formatage de texte de base (gras, italique, etc.)
 */
function formatTextWithStyles(text: string): React.ReactNode {
  if (!text) return null;
  
  // Remplacer le texte en gras ** ... **
  let formattedText = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  
  // Remplacer le texte en italique * ... *
  formattedText = formattedText.replace(/\*(.+?)\*/g, '<em>$1</em>');
  
  return <span dangerouslySetInnerHTML={{ __html: formattedText }} />;
}

export default KatexRenderer;
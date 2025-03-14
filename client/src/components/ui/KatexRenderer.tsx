import React from 'react';
import { InlineMath, BlockMath } from 'react-katex';
import 'katex/dist/katex.min.css';

interface TextContentProps {
  content: string;
  className?: string;
}

/**
 * Composant simplifié pour le rendu des expressions mathématiques avec KaTeX
 */
const KatexRenderer: React.FC<TextContentProps> = ({ content, className = '' }) => {
  if (!content) return null;
  
  // Utiliser une approche simple pour traiter le contenu
  const processedContent = preprocessLaTeX(content);
  
  return (
    <div className={`katex-content ${className}`}>
      <ProcessedContent content={processedContent} />
    </div>
  );
};

// Prétraitement pour convertir les délimiteurs LaTeX en délimiteurs KaTeX
function preprocessLaTeX(content: string): string {
  // Remplacer \[ ... \] par $$ ... $$
  let processed = content.replace(/\\\[(.*?)\\\]/gs, '$$$$1$$');
  
  // Remplacer \( ... \) par $ ... $
  processed = processed.replace(/\\\((.*?)\\\)/gs, '$$$1$');
  
  return processed;
}

// Composant pour traiter le contenu avec paragraphes et formules
const ProcessedContent: React.FC<{ content: string }> = ({ content }) => {
  // Découper le contenu en paragraphes
  const paragraphs = content.split('\n\n');
  
  return (
    <>
      {paragraphs.map((paragraph, index) => {
        // Gestion des titres
        if (paragraph.startsWith('# ')) {
          return <h1 key={index} className="text-2xl font-bold mb-4">{renderParagraphWithMath(paragraph.substring(2))}</h1>;
        } else if (paragraph.startsWith('## ')) {
          return <h2 key={index} className="text-xl font-bold mb-3">{renderParagraphWithMath(paragraph.substring(3))}</h2>;
        } else if (paragraph.startsWith('### ')) {
          return <h3 key={index} className="text-lg font-bold mb-2">{renderParagraphWithMath(paragraph.substring(4))}</h3>;
        }
        
        // Gestion des listes
        if (paragraph.match(/^[*-] /m)) {
          const items = paragraph.split('\n').filter(line => line.trim().length > 0);
          return (
            <ul key={index} className="list-disc pl-5 mb-4">
              {items.map((item, idx) => {
                if (item.startsWith('* ') || item.startsWith('- ')) {
                  return <li key={idx}>{renderParagraphWithMath(item.substring(2))}</li>;
                }
                return <li key={idx}>{renderParagraphWithMath(item)}</li>;
              })}
            </ul>
          );
        }
        
        // Paragraphe standard
        return <p key={index} className="mb-4">{renderParagraphWithMath(paragraph)}</p>;
      })}
    </>
  );
};

// Fonction qui rend un paragraphe avec formules mathématiques
function renderParagraphWithMath(text: string) {
  // Séparer le texte en segments basés sur les délimiteurs mathématiques
  const segments = [];
  let currentText = '';
  let i = 0;
  
  while (i < text.length) {
    // Recherche d'un délimiteur $$ (formule en bloc)
    if (text.substr(i, 2) === '$$' && text.indexOf('$$', i + 2) !== -1) {
      // Ajouter le texte accumulé avant la formule
      if (currentText) {
        segments.push({ type: 'text', content: currentText });
        currentText = '';
      }
      
      // Trouver la fin de la formule
      const start = i + 2;
      const end = text.indexOf('$$', start);
      
      // Extraire la formule et l'ajouter au résultat
      const formula = text.substring(start, end);
      segments.push({ type: 'block-math', content: formula });
      
      // Avancer après la formule
      i = end + 2;
    }
    // Recherche d'un délimiteur $ (formule en ligne)
    else if (text[i] === '$' && text.indexOf('$', i + 1) !== -1) {
      // Ajouter le texte accumulé avant la formule
      if (currentText) {
        segments.push({ type: 'text', content: currentText });
        currentText = '';
      }
      
      // Trouver la fin de la formule
      const start = i + 1;
      const end = text.indexOf('$', start);
      
      // Extraire la formule et l'ajouter au résultat
      const formula = text.substring(start, end);
      segments.push({ type: 'inline-math', content: formula });
      
      // Avancer après la formule
      i = end + 1;
    }
    // Caractère normal - ajouter au texte courant
    else {
      currentText += text[i];
      i++;
    }
  }
  
  // Ajouter le texte restant s'il y en a
  if (currentText) {
    segments.push({ type: 'text', content: currentText });
  }
  
  // Rendre tous les segments
  return segments.map((segment, index) => {
    if (segment.type === 'text') {
      return <span key={index} dangerouslySetInnerHTML={{ __html: formatTextWithStyles(segment.content) }} />;
    } else if (segment.type === 'inline-math') {
      try {
        return <InlineMath key={index} math={segment.content} />;
      } catch (error) {
        console.error('KaTeX error:', error);
        return <code key={index} style={{ color: 'red' }}>${segment.content}$</code>;
      }
    } else if (segment.type === 'block-math') {
      try {
        return <BlockMath key={index} math={segment.content} />;
      } catch (error) {
        console.error('KaTeX error:', error);
        return <code key={index} style={{ color: 'red' }}>$${segment.content}$$</code>;
      }
    }
    return null;
  });
}

// Formatage du texte avec styles basiques
function formatTextWithStyles(text: string): string {
  // ** pour le gras
  text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  
  // * pour l'italique (seulement s'il n'est pas précédé par **)
  text = text.replace(/(?<!\*)\*(.*?)\*(?!\*)/g, '<em>$1</em>');
  
  // __ pour le souligné
  text = text.replace(/__(.*?)__/g, '<u>$1</u>');
  
  // ~ pour le barré
  text = text.replace(/~(.*?)~/g, '<del>$1</del>');
  
  // ` pour le code inline
  text = text.replace(/`(.*?)`/g, '<code>$1</code>');
  
  return text;
}

export default KatexRenderer;
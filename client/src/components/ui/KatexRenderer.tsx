import React, { useEffect } from 'react';
import { InlineMath, BlockMath } from 'react-katex';
import 'katex/dist/katex.min.css';

interface TextContentProps {
  content: string;
  className?: string;
}

/**
 * Composant de rendu pour le texte et les formules mathématiques utilisant KaTeX
 * Cette implémentation est plus légère et plus performante que MathJax
 */
const KatexRenderer: React.FC<TextContentProps> = ({ content, className = '' }) => {
  if (!content) return null;

  // Render le contenu en séparant les formules mathématiques du texte
  return (
    <div className={`katex-content ${className}`}>
      {renderFormattedContent(content)}
    </div>
  );
};

/**
 * Render le contenu d'un paragraphe avec prise en charge des formules mathématiques
 * et du formatage de base
 */
function renderFormattedContent(text: string): React.ReactNode {
  // Découper le texte en sections par les sauts de ligne
  const sections = text.split('\n\n');
  
  // Transforme chaque section en paragraphe formaté
  return sections.map((section, index) => {
    // Vérifie si c'est un titre
    if (section.startsWith('# ')) {
      return <h1 key={index} className="text-2xl font-bold mb-4">{formatTextWithMath(section.substring(2))}</h1>;
    } else if (section.startsWith('## ')) {
      return <h2 key={index} className="text-xl font-bold mb-3">{formatTextWithMath(section.substring(3))}</h2>;
    } else if (section.startsWith('### ')) {
      return <h3 key={index} className="text-lg font-bold mb-2">{formatTextWithMath(section.substring(4))}</h3>;
    }

    // Traite les listes
    if (section.match(/^[*-] /m)) {
      const items = section.split('\n').filter(line => line.trim().length > 0);
      return (
        <ul key={index} className="list-disc pl-5 mb-4">
          {items.map((item, idx) => {
            if (item.startsWith('* ') || item.startsWith('- ')) {
              return <li key={idx}>{formatTextWithMath(item.substring(2))}</li>;
            }
            return <li key={idx}>{formatTextWithMath(item)}</li>;
          })}
        </ul>
      );
    }

    // Par défaut, renvoie un paragraphe
    return <p key={index} className="mb-4">{formatTextWithMath(section)}</p>;
  });
}

/**
 * Formate le texte avec prise en charge des expressions mathématiques
 * Supporte les formules entre $$ et $ (block et inline)
 */
function formatTextWithMath(text: string): React.ReactNode[] {
  // Patterns pour les formules mathématiques:
  // 1. Formules en bloc - entre $$
  // 2. Formules inline - entre $
  const mathPattern = /(\$\$(.*?)\$\$)|(\$(.*?)\$)/gs;
  
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;
  
  // Parcourt toutes les correspondances dans le texte
  while ((match = mathPattern.exec(text)) !== null) {
    // Texte avant la formule mathématique
    if (match.index > lastIndex) {
      parts.push(formatTextWithStyles(text.substring(lastIndex, match.index)));
    }
    
    // Détermine si c'est une formule en bloc ou inline
    if (match[1]) { // Formule en bloc ($$...$$)
      const mathContent = match[2];
      parts.push(
        <BlockMath key={`math-${match.index}`} math={mathContent} />
      );
    } else if (match[3]) { // Formule inline ($...$)
      const mathContent = match[4];
      parts.push(
        <InlineMath key={`math-${match.index}`} math={mathContent} />
      );
    }
    
    lastIndex = match.index + match[0].length;
  }
  
  // Ajoute le reste du texte après la dernière formule
  if (lastIndex < text.length) {
    parts.push(formatTextWithStyles(text.substring(lastIndex)));
  }
  
  return parts;
}

/**
 * Applique le formatage de texte de base (gras, italique, etc.)
 */
function formatTextWithStyles(text: string): React.ReactNode {
  // Trouver toutes les occurrences de formatage:
  
  // ** pour le gras
  text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  
  // * pour l'italique
  text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');
  
  // __ pour le souligné
  text = text.replace(/__(.*?)__/g, '<u>$1</u>');
  
  // ~ pour le barré
  text = text.replace(/~(.*?)~/g, '<del>$1</del>');
  
  // ` pour le code inline
  text = text.replace(/`(.*?)`/g, '<code>$1</code>');
  
  // Créer un élément span avec HTML interprété
  return <span dangerouslySetInnerHTML={{ __html: text }} />;
}

export default KatexRenderer;
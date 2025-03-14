import React from 'react';
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
 * Supporte à la fois $ et \[ pour les expressions mathématiques
 */
function formatTextWithMath(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  
  // Phase 1: Traiter directement le texte pour trouver et remplacer les délimiteurs \[ \]
  // En utilisant un marqueur temporaire
  const tempText = text.replace(/\\\[(.*?)\\\]/gs, (match, formula) => {
    // Ajouter directement un élément React à la liste des parties
    parts.push(<BlockMath key={`block-${Math.random()}`} math={formula} />);
    // Remplacer par un marqueur unique qui ne sera pas affiché
    return `__BLOCK_MATH_PLACEHOLDER_${parts.length - 1}__`;
  });
  
  // Phase 2: Traiter les délimiteurs $$ $$
  const updatedText = tempText.replace(/\$\$(.*?)\$\$/gs, (match, formula) => {
    parts.push(<BlockMath key={`block-${Math.random()}`} math={formula} />);
    return `__BLOCK_MATH_PLACEHOLDER_${parts.length - 1}__`;
  });
  
  // Phase 3: Traiter les délimiteurs \( \)
  const updatedText2 = updatedText.replace(/\\\((.*?)\\\)/gs, (match, formula) => {
    parts.push(<InlineMath key={`inline-${Math.random()}`} math={formula} />);
    return `__INLINE_MATH_PLACEHOLDER_${parts.length - 1}__`;
  });
  
  // Phase 4: Traiter les délimiteurs $ $
  const finalText = updatedText2.replace(/\$(.*?)\$/gs, (match, formula) => {
    parts.push(<InlineMath key={`inline-${Math.random()}`} math={formula} />);
    return `__INLINE_MATH_PLACEHOLDER_${parts.length - 1}__`;
  });
  
  // Maintenant formatTextWithStyles pour le texte restant
  const formattedText = formatTextWithStyles(finalText);
  
  // Construire un tableau de tous les éléments dans le bon ordre
  const result: React.ReactNode[] = [];
  let currentIndex = 0;
  
  // Traiter le texte et remplacer les marqueurs par les éléments React correspondants
  const textContent = (formattedText.props as any).dangerouslySetInnerHTML.__html;
  const segments = textContent.split(/__(?:BLOCK|INLINE)_MATH_PLACEHOLDER_(\d+)__/);
  
  for (let i = 0; i < segments.length; i++) {
    if (segments[i]) {
      if (i % 2 === 0) {
        // Segment de texte normal
        result.push(
          <span key={`text-${i}`} dangerouslySetInnerHTML={{ __html: segments[i] }} />
        );
      } else {
        // Référence à une formule mathématique
        const partIndex = parseInt(segments[i], 10);
        if (!isNaN(partIndex) && partIndex < parts.length) {
          result.push(React.cloneElement(parts[partIndex] as React.ReactElement, {
            key: `math-${i}`
          }));
        }
      }
    }
  }
  
  return result;
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
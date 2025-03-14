import React from 'react';
import { InlineMath, BlockMath } from 'react-katex';
import 'katex/dist/katex.min.css';

interface TextContentProps {
  content: string;
  className?: string;
}

/**
 * Composant pour le rendu des expressions mathématiques et du texte
 */
const KatexRenderer: React.FC<TextContentProps> = ({ content, className = '' }) => {
  if (!content) return null;

  return (
    <div className={`katex-content ${className}`}>
      {renderFormattedContent(content)}
    </div>
  );
};

/**
 * Render le contenu formaté avec séparation des paragraphes
 */
function renderFormattedContent(text: string): React.ReactNode {
  // Découpe le texte en sections (paragraphes)
  const sections = text.split('\n\n');
  
  return sections.map((section, index) => {
    // Traitement des titres
    if (section.startsWith('# ')) {
      return <h1 key={index} className="text-2xl font-bold mb-4">{processContentWithMath(section.substring(2))}</h1>;
    } else if (section.startsWith('## ')) {
      return <h2 key={index} className="text-xl font-bold mb-3">{processContentWithMath(section.substring(3))}</h2>;
    } else if (section.startsWith('### ')) {
      return <h3 key={index} className="text-lg font-bold mb-2">{processContentWithMath(section.substring(4))}</h3>;
    }

    // Traitement des listes
    if (section.match(/^[*-] /m)) {
      const items = section.split('\n').filter(line => line.trim().length > 0);
      return (
        <ul key={index} className="list-disc pl-5 mb-4">
          {items.map((item, idx) => {
            if (item.startsWith('* ') || item.startsWith('- ')) {
              return <li key={idx}>{processContentWithMath(item.substring(2))}</li>;
            }
            return <li key={idx}>{processContentWithMath(item)}</li>;
          })}
        </ul>
      );
    }

    // Par défaut, c'est un paragraphe
    return <p key={index} className="mb-4">{processContentWithMath(section)}</p>;
  });
}

/**
 * Traite un segment de texte et remplace les expressions mathématiques
 * par des composants React appropriés
 */
function processContentWithMath(text: string): React.ReactNode[] {
  const result: React.ReactNode[] = [];
  
  // Tableau de règles de délimiteurs math à traiter
  const mathRules = [
    { 
      pattern: /\\\[(.*?)\\\]/gs, 
      processMatch: (content: string, key: string) => <BlockMath key={key} math={content} /> 
    },
    { 
      pattern: /\$\$(.*?)\$\$/gs, 
      processMatch: (content: string, key: string) => <BlockMath key={key} math={content} /> 
    },
    { 
      pattern: /\\\((.*?)\\\)/gs, 
      processMatch: (content: string, key: string) => <InlineMath key={key} math={content} /> 
    },
    { 
      pattern: /\$(.*?)\$/gs, 
      processMatch: (content: string, key: string) => <InlineMath key={key} math={content} /> 
    }
  ];
  
  // On va traiter une section à la fois, en gardant le texte intermédiaire
  let currentText = text;
  let segments: { type: 'text' | 'math'; content: string; originalMatch?: string }[] = [];
  
  // Fonction pour trouver le prochain délimiteur math dans le texte
  function findNextMathDelimiter() {
    let firstMatch: { index: number; length: number; content: string; rule: typeof mathRules[0] } | null = null;
    
    // Chercher la première correspondance parmi toutes les règles
    for (const rule of mathRules) {
      rule.pattern.lastIndex = 0; // Réinitialiser le pointeur de recherche
      const match = rule.pattern.exec(currentText);
      if (match && (firstMatch === null || match.index < firstMatch.index)) {
        firstMatch = {
          index: match.index,
          length: match[0].length,
          content: match[1], // Le contenu capturé
          rule: rule
        };
      }
    }
    
    return firstMatch;
  }
  
  // Tant qu'il y a des délimiteurs math, on les traite
  let nextMatch = findNextMathDelimiter();
  let lastIndex = 0;
  
  while (nextMatch !== null) {
    // Traiter le texte avant le délimiteur
    if (nextMatch.index > lastIndex) {
      segments.push({
        type: 'text',
        content: currentText.substring(lastIndex, nextMatch.index)
      });
    }
    
    // Traiter le délimiteur math
    segments.push({
      type: 'math',
      content: nextMatch.content,
      originalMatch: currentText.substring(nextMatch.index, nextMatch.index + nextMatch.length)
    });
    
    // Mettre à jour l'index pour la prochaine recherche
    lastIndex = nextMatch.index + nextMatch.length;
    
    // Chercher le prochain délimiteur
    nextMatch = findNextMathDelimiter();
  }
  
  // Traiter le texte restant
  if (lastIndex < currentText.length) {
    segments.push({
      type: 'text',
      content: currentText.substring(lastIndex)
    });
  }
  
  // Maintenant, on transforme les segments en composants React
  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    
    if (segment.type === 'text') {
      // Traiter le formatage de texte basique
      result.push(
        <span 
          key={`text-${i}`} 
          dangerouslySetInnerHTML={{ __html: formatTextWithStyles(segment.content) }} 
        />
      );
    } else if (segment.type === 'math' && segment.originalMatch) {
      // Trouver quelle règle s'applique
      for (const rule of mathRules) {
        rule.pattern.lastIndex = 0;
        if (rule.pattern.test(segment.originalMatch)) {
          try {
            // Créer le composant pour cette formule
            result.push(rule.processMatch(segment.content, `math-${i}`));
            break;
          } catch (error) {
            console.error('Erreur KaTeX:', error);
            // En cas d'erreur, afficher le code brut
            result.push(
              <code key={`math-error-${i}`} style={{ color: 'red' }}>
                {segment.originalMatch}
              </code>
            );
          }
        }
      }
    }
  }
  
  return result;
}

/**
 * Applique le formatage basique au texte (gras, italique, etc.)
 */
function formatTextWithStyles(text: string): string {
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
  
  return text;
}

export default KatexRenderer;
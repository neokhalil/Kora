import React, { useEffect, useRef, useState } from 'react';
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';
import hljs from 'highlight.js';
import 'highlight.js/styles/atom-one-dark.css';

interface MathContentProps {
  content: string;
  className?: string;
}

/**
 * Composant pour rendre du contenu mathématique avec KaTeX
 * Implémentation optimisée pour les formules mathématiques et le texte français
 */
const MathJaxRenderer: React.FC<MathContentProps> = ({ content, className = "" }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [stableHeight, setStableHeight] = useState<number | null>(null);
  const [processedContent, setProcessedContent] = useState<React.ReactNode[]>([]);

  // Fonction pour échapper les caractères HTML spéciaux
  const escapeHtml = (text: string) => {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  };

  // Fonction pour obtenir le nom d'affichage du langage
  const getLangDisplayName = (lang: string): string => {
    const langMap: Record<string, string> = {
      'python': 'Python',
      'py': 'Python',
      'javascript': 'JavaScript',
      'js': 'JavaScript',
      'typescript': 'TypeScript',
      'ts': 'TypeScript',
      'java': 'Java',
      'cpp': 'C++',
      'c': 'C',
      'csharp': 'C#',
      'cs': 'C#',
      'php': 'PHP',
      'ruby': 'Ruby',
      'go': 'Go',
      'rust': 'Rust',
      'swift': 'Swift',
      'kotlin': 'Kotlin',
      'scala': 'Scala',
      'html': 'HTML',
      'css': 'CSS',
      'sql': 'SQL',
      'bash': 'Bash',
      'sh': 'Shell',
      'xml': 'XML',
      'json': 'JSON',
      'yaml': 'YAML',
      'markdown': 'Markdown',
      'md': 'Markdown',
    };
    
    return langMap[lang.toLowerCase()] || lang.charAt(0).toUpperCase() + lang.slice(1);
  };

  // Correction des expressions avec nombres pour les remplacer par des symboles delta
  const correctDeltaConditions = (text: string): string => {
    if (!text) return '';
    
    // Remplacer "D=" par "Δ="
    text = text.replace(/\bD\s*=\s*b\^2\s*-\s*4ac/g, "Δ = b² - 4ac");
    text = text.replace(/\bD\s*=\s*b\^2\s*[-−]\s*4ac/g, "Δ = b² - 4ac");
    
    // Remplacer le "D" du discriminant par "Δ" (delta)
    text = text.replace(/\bSi\s+D\s*([<>=])\s*0/g, "Si Δ $1 0");
    text = text.replace(/\bLe discriminant\s+D\b/g, "Le discriminant Δ");
    text = text.replace(/\bD\s*=\s*b\^2\s*-\s*4ac/g, "Δ = b² - 4ac");
    
    // Remplacer les 00, 01, 02, etc. par les conditions de delta
    text = text.replace(/\bax\^2\s*\+\s*bx\s*\+\s*c\s*=\s*00\b/g, "ax² + bx + c où Δ > 0");
    text = text.replace(/\bax\^2\s*\+\s*bx\s*\+\s*c\s*=\s*01\b/g, "ax² + bx + c où Δ = 0");
    text = text.replace(/\bax\^2\s*\+\s*bx\s*\+\s*c\s*=\s*02\b/g, "ax² + bx + c où Δ < 0");
    
    text = text.replace(/\bax\^2\s*\+\s*bx\s*\+\s*c\s*=\s*03\b/g, "ax² + bx + c pour une autre valeur");
    text = text.replace(/\bax\^2\s*\+\s*bx\s*\+\s*c\s*=\s*04\b/g, "ax² + bx + c pour le résultat");
    text = text.replace(/\bax\^2\s*\+\s*bx\s*\+\s*c\s*=\s*05\b/g, "ax² + bx + c dans le cas complexe");
    text = text.replace(/\bax\^2\s*\+\s*bx\s*\+\s*c\s*=\s*06\b/g, "ax² + bx + c pour la première solution");
    text = text.replace(/\bax\^2\s*\+\s*bx\s*\+\s*c\s*=\s*07\b/g, "ax² + bx + c pour la deuxième solution");
    
    // Corrections pour les cas avec b0, b1, b2
    text = text.replace(/\b[Ss]i\s+b0\b/g, "Si Δ > 0");
    text = text.replace(/\b[Ss]i\s+b1\b/g, "Si Δ = 0");
    text = text.replace(/\b[Ss]i\s+b2\b/g, "Si Δ < 0");
    text = text.replace(/\b[Ss]i\s+b0,/g, "Si Δ > 0,");
    text = text.replace(/\b[Ss]i\s+b1,/g, "Si Δ = 0,");
    text = text.replace(/\b[Ss]i\s+b2,/g, "Si Δ < 0,");
    text = text.replace(/\bb0\b/g, "Δ > 0");
    text = text.replace(/\bb1\b/g, "Δ = 0");
    text = text.replace(/\bb2\b/g, "Δ < 0");
    
    // Formatage des étapes "Si..." pour qu'elles aillent à la ligne
    text = text.replace(/(- Si [^,]+, )(.*?)(?=\n|$)/g, "$1\n    $2");
    
    return text;
  };

  // Analyser et traiter le contenu pour afficher correctement les formules mathématiques
  const processLatexContent = (text: string): React.ReactNode[] => {
    if (!text) return [];
    
    // Correction des formules et expressions delta avant traitement
    text = correctDeltaConditions(text);
    
    // Séparer le texte en segments pour traiter les formules mathématiques
    const segments: React.ReactNode[] = [];
    
    // Regex pour trouver les expressions LaTeX (inline et block)
    const latexPattern = /\\\[(.*?)\\\]|\\\((.*?)\\\)|\$(.*?)\$/gs;
    
    let lastIndex = 0;
    let match;
    
    // Parcourir toutes les formules mathématiques dans le texte
    while ((match = latexPattern.exec(text)) !== null) {
      // Ajouter le texte avant la formule
      if (match.index > lastIndex) {
        const textSegment = text.substring(lastIndex, match.index);
        if (textSegment.trim()) {
          segments.push(<span key={segments.length} dangerouslySetInnerHTML={{ __html: textSegment }} />);
        }
      }
      
      // Extraire la formule et déterminer si c'est une formule en bloc ou inline
      const formula = match[1] || match[2] || match[3];
      const isBlock = match[0].startsWith('\\[');
      
      try {
        if (isBlock) {
          // Formule en bloc (display mode)
          segments.push(
            <div key={segments.length} className="math-block">
              <BlockMath math={formula} />
            </div>
          );
        } else {
          // Formule inline
          segments.push(
            <span key={segments.length} className="math-inline">
              <InlineMath math={formula} />
            </span>
          );
        }
      } catch (e) {
        console.error("Erreur dans le rendu de la formule:", formula, e);
        segments.push(<span key={segments.length} className="math-error">{match[0]}</span>);
      }
      
      lastIndex = match.index + match[0].length;
    }
    
    // Ajouter le reste du texte après la dernière formule
    if (lastIndex < text.length) {
      const textSegment = text.substring(lastIndex);
      if (textSegment.trim()) {
        segments.push(<span key={segments.length} dangerouslySetInnerHTML={{ __html: textSegment }} />);
      }
    }
    
    return segments;
  };

  // Traiter le contenu à chaque changement
  useEffect(() => {
    if (!content) {
      setProcessedContent([]);
      return;
    }
    
    // Prétraitement du contenu pour formater les listes et ajuster les sauts de ligne
    let processedText = content
      // Assurer que les tirets pour les listes créent des sauts de ligne
      .replace(/(?<=\n|^)(\s*)-\s+([^\n]+)/g, '$1- $2\n')
      // Transformer les formules LaTeX brutes en format compatible avec KaTeX
      .replace(/\\left\(/g, '(')
      .replace(/\\right\)/g, ')')
      .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '\\frac{$1}{$2}')
      .replace(/\\sqrt\{([^}]+)\}/g, '\\sqrt{$1}')
      // Ajouter des espaces aux formules mathématiques pour une meilleure lisibilité
      .replace(/\\\[/g, '\n\\[\n')
      .replace(/\\\]/g, '\n\\]\n');
      
    // Corriger les cas spécifiques du discriminant
    processedText = correctDeltaConditions(processedText);
    
    // Traiter le contenu pour afficher les formules mathématiques
    const result = processLatexContent(processedText);
    setProcessedContent(result);
  }, [content]);

  // Observer les changements de hauteur
  useEffect(() => {
    if (!content) {
      setStableHeight(null);
      return;
    }
    
    const timer = setTimeout(() => {
      if (containerRef.current) {
        const height = containerRef.current.offsetHeight;
        if (height > 0) {
          setStableHeight(height);
        }
      }
    }, 50);
    
    return () => clearTimeout(timer);
  }, [content, processedContent]);

  return (
    <div 
      ref={containerRef}
      className={`math-content ${className}`}
      style={{ 
        position: 'relative', 
        minHeight: stableHeight ? `${stableHeight}px` : '20px'
      }}
    >
      <div className="math-content-inner">
        {processedContent}
      </div>
    </div>
  );
};

export default MathJaxRenderer;
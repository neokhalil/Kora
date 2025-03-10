import React, { useEffect, useRef, useState } from 'react';
import hljs from 'highlight.js';
import 'highlight.js/styles/atom-one-dark.css';

interface MathContentProps {
  content: string;
  className?: string;
}

/**
 * Composant pour rendre du contenu mathématique avec formatage HTML
 * Version simplifiée pour assurer la compatibilité
 */
const MathJaxRenderer: React.FC<MathContentProps> = ({ content, className = "" }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [stableHeight, setStableHeight] = useState<number | null>(null);
  
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

  // Fonction pour remplacer les expressions mathématiques par des expressions corrigées
  const correctMathematicalExpressions = (text: string): string => {
    if (!text) return '';
    
    // Corrections du symbole delta
    text = text.replace(/\bD\s*=\s*b\^2\s*-\s*4ac/g, "Δ = b² - 4ac");
    text = text.replace(/\bSi\s+D\s*([<>=])\s*0/g, "Si Δ $1 0");
    text = text.replace(/\bLe discriminant\s+D\b/g, "Le discriminant Δ");
    
    // Corrections pour les équations à valeurs numériques
    text = text.replace(/\bax\^2\s*\+\s*bx\s*\+\s*c\s*=\s*00\b/g, "ax² + bx + c où Δ > 0");
    text = text.replace(/\bax\^2\s*\+\s*bx\s*\+\s*c\s*=\s*01\b/g, "ax² + bx + c où Δ = 0");
    text = text.replace(/\bax\^2\s*\+\s*bx\s*\+\s*c\s*=\s*02\b/g, "ax² + bx + c où Δ < 0");
    
    // Corrections pour b0, b1, b2
    text = text.replace(/\b[Ss]i\s+b0\b/g, "Si Δ > 0");
    text = text.replace(/\b[Ss]i\s+b1\b/g, "Si Δ = 0");
    text = text.replace(/\b[Ss]i\s+b2\b/g, "Si Δ < 0");
    text = text.replace(/\b[Ss]i\s+b0,/g, "Si Δ > 0,");
    text = text.replace(/\b[Ss]i\s+b1,/g, "Si Δ = 0,");
    text = text.replace(/\b[Ss]i\s+b2,/g, "Si Δ < 0,");
    text = text.replace(/\bb0\b/g, "Δ > 0");
    text = text.replace(/\bb1\b/g, "Δ = 0");
    text = text.replace(/\bb2\b/g, "Δ < 0");
    
    // Formatage et préparation pour MathJax
    text = text
      // Ajouter des sauts de ligne pour les listes avec Si...
      .replace(/(- Si [^,]+, )(.*?)(?=\n|$)/g, "$1\n    $2")
      // Améliorer l'affichage des formules
      .replace(/\\\[/g, '<div class="math-block">')
      .replace(/\\\]/g, '</div>')
      .replace(/\\\(/g, '<span class="math-inline">')
      .replace(/\\\)/g, '</span>');
    
    return text;
  };

  // Traiter le contenu pour le formatage
  const processContent = () => {
    if (!content) return '';
    
    // 1. PRÉ-TRAITEMENT: Protéger les expressions mathématiques
    const mathExpressions: string[] = [];
    
    // Fonction qui crée un placeholder pour les expressions mathématiques
    const createMathPlaceholder = (match: string) => {
      const id = mathExpressions.length;
      mathExpressions.push(match);
      return `MATH_PLACEHOLDER_${id}`;
    };
    
    // Remplacer temporairement les expressions $ par des placeholders
    let processedContent = content
      .replace(/\$([^\$]+?)\$/g, (match) => createMathPlaceholder(match));
    
    // 2. TRAITEMENT du contenu principal
    // Séparation, traitement des listes, blocs de code, etc.
    const lines = processedContent.split('\n');
    let htmlContent = '';
    let inCodeBlock = false;
    let codeLanguage = '';
    let codeContent = '';
    let paragraphContent = '';
    
    // Fonction pour formater les listes avec tirets
    const formatListItems = (text: string): string => {
      return text
        // Traitement des listes avec tirets
        .replace(/(?<!\$[^\$]*)(- )([^-\$]+?)(?=(?:- |$))/g, '<div class="list-item">$1$2</div>')
        // Expressions mathématiques sur une ligne séparée
        .replace(/(?<!\<div class="[^"]+">\s*)(\$[^\$]+\$)(?!\s*<\/div>)/g, '<div class="formula-item">$1</div>');
    };
    
    // Traiter chaque ligne du contenu
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Blocs de code
      if (line.trim().startsWith('```')) {
        if (!inCodeBlock) {
          // Début du bloc de code
          inCodeBlock = true;
          
          // Terminer paragraphe précédent s'il existe
          if (paragraphContent) {
            const formattedParagraph = formatListItems(formatTextContent(paragraphContent));
            htmlContent += `<p>${formattedParagraph}</p>`;
            paragraphContent = '';
          }
          
          codeLanguage = line.trim().slice(3).trim();
        } else {
          // Fin du bloc de code
          inCodeBlock = false;
          
          const langClass = codeLanguage ? `language-${codeLanguage}` : '';
          const escapedCode = escapeHtml(codeContent);
          
          htmlContent += `<pre class="code-block ${langClass}"><code class="${langClass}" data-lang="${codeLanguage || 'text'}">${escapedCode}</code></pre>`;
          
          codeContent = '';
          codeLanguage = '';
        }
      } else if (inCodeBlock) {
        // Ajouter la ligne au contenu du code
        codeContent += (codeContent ? '\n' : '') + line;
      } else if (line.trim() === '') {
        // Ligne vide - fin de paragraphe
        if (paragraphContent) {
          const formattedParagraph = formatListItems(formatTextContent(paragraphContent));
          htmlContent += `<p>${formattedParagraph}</p>`;
          paragraphContent = '';
        }
      } else if (line.trim().match(/^#{1,3}\s+(.+)$/)) {
        // Titres (# Titre)
        if (paragraphContent) {
          const formattedParagraph = formatListItems(formatTextContent(paragraphContent));
          htmlContent += `<p>${formattedParagraph}</p>`;
          paragraphContent = '';
        }
        
        const match = line.trim().match(/^(#{1,3})\s+(.+)$/);
        if (match) {
          const level = match[1].length;
          const title = formatTextContent(match[2]);
          htmlContent += `<h${level} class="section-heading">${title}</h${level}>`;
        }
      } else if (line.trim().match(/^\d+\.\s+(.+)$/)) {
        // Éléments numérotés
        if (paragraphContent) {
          const formattedParagraph = formatListItems(formatTextContent(paragraphContent));
          htmlContent += `<p>${formattedParagraph}</p>`;
          paragraphContent = '';
        }
        
        const match = line.trim().match(/^(\d+)\.\s+(.+)$/);
        if (match) {
          const number = match[1];
          const content = formatTextContent(match[2]);
          
          // Déterminer si c'est un titre de section
          const isProbablyTitle = 
            /^[A-Z]/.test(match[2]) || 
            match[2].includes('étape') || 
            match[2].includes('Étape') ||
            match[2].includes('Exemple');
          
          if (isProbablyTitle) {
            htmlContent += `<div class="section-title"><span class="section-number">${number}.</span> ${content}</div>`;
          } else {
            htmlContent += `<div class="numbered-item"><span class="number">${number}.</span><span class="content">${content}</span></div>`;
          }
        }
      } else {
        // Contenu normal de paragraphe
        paragraphContent += (paragraphContent ? ' ' : '') + line;
      }
    }
    
    // Traiter tout paragraphe restant
    if (paragraphContent) {
      const formattedParagraph = formatListItems(formatTextContent(paragraphContent));
      htmlContent += `<p>${formattedParagraph}</p>`;
    }
    
    // 3. POST-TRAITEMENT: Restaurer les expressions mathématiques
    mathExpressions.forEach((expr, index) => {
      const placeholder = `MATH_PLACEHOLDER_${index}`;
      htmlContent = htmlContent.split(placeholder).join(expr);
    });
    
    // 4. Appliquer les corrections mathématiques
    htmlContent = correctMathematicalExpressions(htmlContent);
    
    return htmlContent;
  };
  
  // Formater le texte dans les paragraphes et autres éléments
  const formatTextContent = (text: string): string => {
    if (!text) return '';
    
    // Protéger le code inline
    const codeSnippets: string[] = [];
    text = text.replace(/`([^`]+)`/g, (match, code) => {
      const id = codeSnippets.length;
      codeSnippets.push(code);
      return `CODE_SNIPPET_${id}`;
    });
    
    // Appliquer le formatage Markdown basique
    let formattedText = text
      // Gras
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      // Italique
      .replace(/\*([^*]+)\*/g, '<em>$1</em>')
      // Souligné
      .replace(/\_\_([^_]+)\_\_/g, '<u>$1</u>')
      // Barré
      .replace(/\~\~([^~]+)\~\~/g, '<s>$1</s>');
    
    // Formatage pour le français
    const frenchWithApostrophe = /\b[nljdcsmt]'[a-zàâäçéèêëîïôöùûüÿ]/i;
    
    formattedText = formattedText.replace(/'([^']+)'/g, (match, content) => {
      // Texte français
      if (
        content.includes(' ') || 
        frenchWithApostrophe.test(content) || 
        /[àâäçéèêëîïôöùûüÿÀÂÄÇÉÈÊËÎÏÔÖÙÛÜŸ]/.test(content)
      ) {
        return match;
      }
      
      // Code de programmation
      if (
        /^(let|var|const|for|while|if|else|function|return|true|false|null|this|new|import|export|class|throw|try|catch)$/.test(content) ||
        (/[:;{}=\/\[\]\.+\-*%]/.test(content) && !/\s+/.test(content))
      ) {
        return `<code class="inline-code">${content}</code>`;
      }
      
      return match;
    });
    
    // Restaurer le code inline
    codeSnippets.forEach((code, index) => {
      formattedText = formattedText.replace(
        `CODE_SNIPPET_${index}`,
        `<code class="inline-code">${escapeHtml(code)}</code>`
      );
    });
    
    return formattedText;
  };
  
  // Générer le HTML formaté
  const formattedHtml = processContent();
  
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
  }, [content]);
  
  // Appliquer highlight.js aux blocs de code
  useEffect(() => {
    const timer = setTimeout(() => {
      if (containerRef.current) {
        const codeBlocks = containerRef.current.querySelectorAll('pre code');
        codeBlocks.forEach(block => {
          try {
            // Coloration syntaxique
            hljs.highlightElement(block as HTMLElement);
            
            // Ajouter l'étiquette de langage
            const lang = block.getAttribute('data-lang');
            if (lang && lang.trim() !== '' && lang !== 'text') {
              const pre = block.parentElement;
              if (pre && !pre.querySelector('.language-label')) {
                const label = document.createElement('div');
                label.className = 'language-label';
                label.textContent = getLangDisplayName(lang);
                pre.appendChild(label);
              }
            }
          } catch (e) {
            console.warn('Failed to highlight code block', e);
          }
        });
      }
    }, 100);
    
    return () => clearTimeout(timer);
  }, [formattedHtml]);

  return (
    <div 
      ref={containerRef}
      className={`math-content ${className}`}
      style={{ 
        position: 'relative', 
        minHeight: stableHeight ? `${stableHeight}px` : '20px'
      }}
    >
      <div 
        dangerouslySetInnerHTML={{ __html: formattedHtml }}
        className="math-content-inner"
      />
    </div>
  );
};

export default MathJaxRenderer;
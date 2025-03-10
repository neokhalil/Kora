import React, { useEffect, useRef, useState } from 'react';
import hljs from 'highlight.js';
import 'highlight.js/styles/atom-one-dark.css';

interface MathContentProps {
  content: string;
  className?: string;
}

/**
 * Composant pour rendre du contenu mathématique avec formatage HTML simple
 * Version ultra basique sans dépendances externes
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
    };
    
    return langMap[lang.toLowerCase()] || lang.charAt(0).toUpperCase() + lang.slice(1);
  };

  // Fonction pour corriger certaines notations mathématiques
  const correctMathNotation = (text: string): string => {
    if (!text) return '';
    
    // 1. Remplacements pour corriger la notation du discriminant
    return text
      // Remplacer D par Δ pour le discriminant
      .replace(/\bD\s*=\s*b\^2\s*-\s*4ac/g, "<span class=\"delta-symbol\">Δ</span> = b² - 4ac")
      .replace(/\bSi\s+D\s*([<>=])\s*0/g, "Si <span class=\"delta-symbol\">Δ</span> $1 0")
      .replace(/\bLe discriminant\s+D\b/g, "Le discriminant <span class=\"delta-symbol\">Δ</span>")
      
      // Corriger les conditions b0, b1, b2
      .replace(/\b[Ss]i\s+b0\b/g, "Si <span class=\"delta-symbol\">Δ</span> > 0")
      .replace(/\b[Ss]i\s+b1\b/g, "Si <span class=\"delta-symbol\">Δ</span> = 0")
      .replace(/\b[Ss]i\s+b2\b/g, "Si <span class=\"delta-symbol\">Δ</span> < 0")
      .replace(/\bb0\b/g, "<span class=\"delta-symbol\">Δ</span> > 0")
      .replace(/\bb1\b/g, "<span class=\"delta-symbol\">Δ</span> = 0")
      .replace(/\bb2\b/g, "<span class=\"delta-symbol\">Δ</span> < 0")
      
      // Améliorer l'affichage des puissances
      .replace(/\^2/g, "²")
      .replace(/\^3/g, "³")
      .replace(/\^n/g, "ⁿ");
  };

  // Formater le contenu principal
  const formatContent = (): string => {
    if (!content) return '';
    
    // Préparation initiale : corriger les formules mathématiques
    let text = correctMathNotation(content);
    
    // Remplacer les délimiteurs LaTeX par du HTML
    text = text
      // Formules mathématiques de blocage
      .replace(/\\\[(.*?)\\\]/gs, '<div class="math-formula-block">$1</div>')
      // Formules mathématiques inline
      .replace(/\\\((.*?)\\\)/gs, '<span class="math-formula-inline">$1</span>')
      // Formules mathématiques avec dollars
      .replace(/\$(.*?)\$/g, '<span class="math-formula-inline">$1</span>');
    
    // Remplacer les sauts de ligne par des balises <br>
    text = text.replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br>');
    
    // Wrappe le contenu dans un paragraphe
    return `<p>${text}</p>`;
  };
  
  // Formater les blocs de code
  const processCodeBlocks = (html: string): string => {
    // Identifier et formater les blocs de code
    const codeBlockRegex = /```([a-z]*)\n([\s\S]*?)```/g;
    return html.replace(codeBlockRegex, (match, language, code) => {
      const languageClass = language ? `language-${language}` : '';
      const escapedCode = escapeHtml(code);
      return `<pre class="code-block ${languageClass}"><code class="${languageClass}" data-lang="${language || 'text'}">${escapedCode}</code></pre>`;
    });
  };
  
  // Appliquer le formatage markdown basic
  const applyMarkdownFormatting = (html: string): string => {
    return html
      // Gras
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      // Italique
      .replace(/\*([^*]+)\*/g, '<em>$1</em>')
      // Code inline
      .replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');
  };
  
  // Gérer les listes numérotées
  const formatNumberedLists = (html: string): string => {
    // Motif pour les éléments numérotés (1. Item, 2. Item, etc.)
    const numberedItemPattern = /<p>(\d+)\.\s*(.*?)<\/p>/g;
    
    return html.replace(numberedItemPattern, (match, number, content) => {
      // Déterminer s'il s'agit d'un titre ou d'un simple élément de liste
      const isTitle = /^[A-Z]/.test(content) || content.includes('étape') || content.includes('Étape');
      
      if (isTitle) {
        return `<div class="section-title"><span class="section-number">${number}.</span> ${content}</div>`;
      } else {
        return `<div class="numbered-item"><span class="number">${number}.</span><span class="content">${content}</span></div>`;
      }
    });
  };
  
  // Générer le HTML formaté complet
  const generateFormattedHtml = (): string => {
    // Format de base
    let html = formatContent();
    
    // Appliquer les transformations
    html = processCodeBlocks(html);
    html = applyMarkdownFormatting(html);
    html = formatNumberedLists(html);
    
    return html;
  };
  
  // Calculer le HTML formaté
  const formattedHtml = generateFormattedHtml();
  
  // Observer les changements de hauteur pour stabiliser l'affichage
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
  
  // Appliquer la coloration syntaxique aux blocs de code
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
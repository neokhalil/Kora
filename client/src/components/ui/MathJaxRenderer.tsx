import React, { useEffect, useRef, useState } from 'react';
import { MathJax } from 'better-react-mathjax';
import hljs from 'highlight.js';
import 'highlight.js/styles/atom-one-dark.css';

interface MathContentProps {
  content: string;
  className?: string;
}

/**
 * Composant pour rendre du contenu mathématique avec MathJax
 * Version simplifiée pour améliorer la stabilité
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

  // Traiter le contenu pour le formatage
  const processContent = () => {
    // Séparer le contenu en lignes
    const lines = content.split('\n');
    let html = '';
    let inCodeBlock = false;
    let codeLanguage = '';
    let codeContent = '';
    let paragraphContent = '';
    
    // Traiter chaque ligne
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Détecter les blocs de code
      if (line.trim().startsWith('```')) {
        if (!inCodeBlock) {
          // Début d'un bloc de code
          inCodeBlock = true;
          
          // Vider le contenu du paragraphe précédent s'il existe
          if (paragraphContent) {
            html += `<p>${formatTextContent(paragraphContent)}</p>`;
            paragraphContent = '';
          }
          
          // Extraire le langage s'il est spécifié
          codeLanguage = line.trim().slice(3).trim();
        } else {
          // Fin d'un bloc de code
          inCodeBlock = false;
          
          // Ajouter le bloc de code avec coloration syntaxique
          const langClass = codeLanguage ? `language-${codeLanguage}` : '';
          const escapedCode = escapeHtml(codeContent);
          
          // Appliquer un style spécifique pour le langage PHP
          const langSpecificClass = codeLanguage.toLowerCase() === 'php' ? 'php-code-block' : '';
          
          html += `<pre class="code-block ${langClass} ${langSpecificClass}"><code class="${langClass}" data-lang="${codeLanguage}">${escapedCode}</code></pre>`;
          codeContent = '';
          codeLanguage = '';
        }
      } else if (inCodeBlock) {
        // Ajouter la ligne au contenu du code
        codeContent += (codeContent ? '\n' : '') + line;
      } else if (line.trim() === '') {
        // Ligne vide - fin de paragraphe
        if (paragraphContent) {
          html += `<p>${formatTextContent(paragraphContent)}</p>`;
          paragraphContent = '';
        }
      } else if (line.trim().match(/^#{1,3}\s+(.+)$/)) {
        // Titre Markdown (# Titre)
        if (paragraphContent) {
          html += `<p>${formatTextContent(paragraphContent)}</p>`;
          paragraphContent = '';
        }
        
        const match = line.trim().match(/^(#{1,3})\s+(.+)$/);
        if (match) {
          const level = match[1].length;
          const title = match[2];
          html += `<h${level} class="section-heading">${title}</h${level}>`;
        }
      } else if (line.trim().match(/^\d+\.\s+(.+)$/)) {
        // Liste numérotée (1. Item)
        if (paragraphContent) {
          html += `<p>${formatTextContent(paragraphContent)}</p>`;
          paragraphContent = '';
        }
        
        // Détection des titres de sections numérotées (incluant PHP et autres sections)
        const sectionMatch = line.trim().match(/^(\d+)\.\s+(.*?)[\s:]*$/);
        
        if (sectionMatch) {
          const number = sectionMatch[1];
          const title = sectionMatch[2].replace(/:$/, '');
          
          // Déterminer si c'est une section spéciale (PHP, etc.) ou une ligne numérotée ordinaire
          const isSectionTitle = title.includes('Commentaires') || 
                                title.includes('Variables') || 
                                title.includes('Fonctions') ||
                                title.includes('Déclaration') ||
                                title.includes('Après') ||
                                // Autres mots-clés de sections courantes
                                title.includes('étapes') ||
                                title.includes('Étapes') ||
                                /^[A-Z]/.test(title); // Commence par une majuscule = probablement un titre
          
          if (isSectionTitle) {
            // C'est un titre de section (format "1. Section :")
            html += `<div class="php-section-title"><span class="php-section-number">${number}.</span> ${formatTextContent(title)}</div>`;
          } else {
            // Ligne numérotée ordinaire (liste, étape, etc.)
            html += `<div class="numbered-item"><span class="number">${number}.</span><span class="content">${formatTextContent(title)}</span></div>`;
          }
        }
      } else {
        // Contenu normal de paragraphe
        paragraphContent += (paragraphContent ? ' ' : '') + line;
      }
    }
    
    // Traiter tout contenu de paragraphe restant
    if (paragraphContent) {
      html += `<p>${formatTextContent(paragraphContent)}</p>`;
    }
    
    return html;
  };
  
  // Formatage du texte dans les paragraphes
  const formatTextContent = (text: string) => {
    let formattedText = text;
    
    // 1. Traitement des expressions mathématiques (à protéger avant le traitement du code)
    // Recherche et stockage temporaire des expressions mathématiques pour les protéger
    const mathExpressions: string[] = [];
    
    // Protéger les expressions mathématiques inline avec $ ... $
    formattedText = formattedText.replace(/\$([^\$\n]+)\$/g, (match, expr) => {
      const placeholder = `__MATH_EXPR_${mathExpressions.length}__`;
      mathExpressions.push(match);
      return placeholder;
    });
    
    // 2. Expressions régulières pour les codes PHP et les exemples spécifiques
    const phpPatterns = [
      // Tags PHP
      { pattern: /\'?(\<?php|\?>)\'?/g, replacement: '<code class="inline-code php-tag">$1</code>' },
      // Variables PHP
      { pattern: /\'?(\$[a-zA-Z_][a-zA-Z0-9_]*)\'?/g, replacement: '<code class="inline-code php-var">$1</code>' },
      // Commentaires PHP
      { pattern: /\'(\/\/\s*[^\']+)\'/g, replacement: '<code class="inline-code php-comment">$1</code>' },
      { pattern: /\'(\*\/)\'/g, replacement: '<code class="inline-code php-comment">$1</code>' },
      { pattern: /\'(\/\*)\'/g, replacement: '<code class="inline-code php-comment">$1</code>' },
      // Fonctions PHP
      { pattern: /\'(echo\s+[^\']+)\'/g, replacement: '<code class="inline-code php-function">$1</code>' },
      { pattern: /\'(function\s+[^\']+)\'/g, replacement: '<code class="inline-code php-function">$1</code>' },
      // Structures de contrôle PHP
      { pattern: /\'(if\s*\([^\']+\)\s*\{)\'/g, replacement: '<code class="inline-code php-control">$1</code>' },
      { pattern: /\'(\}\s*else\s*\{)\'/g, replacement: '<code class="inline-code php-control">$1</code>' },
      { pattern: /\'(\}\s*elseif\s*\([^\']+\)\s*\{)\'/g, replacement: '<code class="inline-code php-control">$1</code>' },
    ];
    
    // 3. Appliquer tous les patterns PHP spécifiques
    phpPatterns.forEach(({ pattern, replacement }) => {
      formattedText = formattedText.replace(pattern, replacement);
    });
    
    // 4. Formatage de code inline général (pour tout ce qui reste)
    formattedText = formattedText
      // Code inline avec backticks
      .replace(/`([^`\n]+)`/g, '<code class="inline-code">$1</code>')
      // Texte dans des guillemets simples (rendus comme code) - uniquement s'ils n'ont pas déjà été traités
      .replace(/'([^'\n]+)'/g, '<code class="inline-code mobile-friendly-code">$1</code>');
    
    // 5. Formatage du texte (Markdown)
    formattedText = formattedText
      // Gras
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      // Italique (mais pas dans le code)
      .replace(/\*([^*<>]+)\*/g, '<em>$1</em>')
      // Soulignement
      .replace(/\_\_([^_]+)\_\_/g, '<u>$1</u>')
      // Barré
      .replace(/\~\~([^~]+)\~\~/g, '<s>$1</s>');
    
    // 6. Restaurer les expressions mathématiques protégées
    mathExpressions.forEach((expr, index) => {
      formattedText = formattedText.replace(`__MATH_EXPR_${index}__`, expr);
    });
      
    return formattedText;
  };
  
  // HTML formaté
  const formattedHtml = processContent();
  
  // Observer les changements de hauteur et stabiliser
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
  
  // Appliquer highlight.js aux blocs de code après le rendu
  useEffect(() => {
    const timer = setTimeout(() => {
      if (containerRef.current) {
        const codeBlocks = containerRef.current.querySelectorAll('pre code');
        codeBlocks.forEach(block => {
          try {
            // Appliquer la coloration syntaxique
            hljs.highlightElement(block as HTMLElement);
            
            // Ajouter l'étiquette de langage
            const lang = block.getAttribute('data-lang');
            if (lang && lang.trim() !== '') {
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
      <MathJax>
        <div 
          dangerouslySetInnerHTML={{ __html: formattedHtml }}
          className="math-content-inner"
        />
      </MathJax>
    </div>
  );
};

export default MathJaxRenderer;
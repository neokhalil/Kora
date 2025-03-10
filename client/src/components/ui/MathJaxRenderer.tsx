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
 * Implémentation simplifiée avec un meilleur traitement des expressions mathématiques
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
    if (!content) return '';
    
    // 1. PRÉ-TRAITEMENT: Protéger les expressions mathématiques en premier
    // Nous allons remplacer temporairement les expressions LaTeX par des placeholders
    // au format MATH_PLACEHOLDER_{index} pour les protéger des manipulations HTML
    
    // Isoler toutes les expressions mathématiques
    const mathExpressions: string[] = [];
    
    // Fonction qui crée un placeholder unique pour chaque expression mathématique
    const createMathPlaceholder = (match: string) => {
      const id = mathExpressions.length;
      mathExpressions.push(match);
      return `MATH_PLACEHOLDER_${id}`;
    };
    
    // Remplacer temporairement les expressions mathématiques par des placeholders
    let processedContent = content
      // Expressions inline: $...$
      .replace(/\$([^\$]+?)\$/g, (match) => createMathPlaceholder(match));
    
    // 2. TRAITEMENT DU CONTENU
    // Séparer le contenu en lignes et traiter chaque élément
    const lines = processedContent.split('\n');
    let htmlContent = '';
    let inCodeBlock = false;
    let codeLanguage = '';
    let codeContent = '';
    let paragraphContent = '';
    
    // Traiter chaque ligne
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Traitement des blocs de code
      if (line.trim().startsWith('```')) {
        if (!inCodeBlock) {
          // Début d'un bloc de code
          inCodeBlock = true;
          
          // Terminer le paragraphe précédent s'il existe
          if (paragraphContent) {
            htmlContent += `<p>${formatTextContent(paragraphContent)}</p>`;
            paragraphContent = '';
          }
          
          // Extraire le langage s'il est spécifié
          codeLanguage = line.trim().slice(3).trim();
        } else {
          // Fin d'un bloc de code
          inCodeBlock = false;
          
          // Vérifier si c'est vraiment du code ou juste du texte normal
          const looksLikeCode = (
            codeLanguage || // Si un langage est spécifié, c'est du code
            /[:;(){}=<>\/\[\]\.,$+\-*%]/.test(codeContent) || // Caractères de programmation
            /^(let|var|const|function|for|while|if|else|return)/m.test(codeContent) || // Mots-clés
            codeContent.includes('\t') // Tabulations
          );
          
          if (looksLikeCode) {
            // C'est du code, appliquer le style de code
            const langClass = codeLanguage ? `language-${codeLanguage}` : '';
            const escapedCode = escapeHtml(codeContent);
            
            htmlContent += `<pre class="code-block ${langClass}"><code class="${langClass}" data-lang="${codeLanguage || 'text'}">${escapedCode}</code></pre>`;
          } else {
            // Ce n'est pas du code, formater comme du texte normal
            htmlContent += `<p>${formatTextContent(codeContent)}</p>`;
          }
          
          codeContent = '';
          codeLanguage = '';
        }
      } else if (inCodeBlock) {
        // Ajouter la ligne au contenu du code
        codeContent += (codeContent ? '\n' : '') + line;
      } else if (line.trim() === '') {
        // Ligne vide - fin de paragraphe
        if (paragraphContent) {
          htmlContent += `<p>${formatTextContent(paragraphContent)}</p>`;
          paragraphContent = '';
        }
      } else if (line.trim().match(/^#{1,3}\s+(.+)$/)) {
        // Titre (# Titre)
        if (paragraphContent) {
          htmlContent += `<p>${formatTextContent(paragraphContent)}</p>`;
          paragraphContent = '';
        }
        
        const match = line.trim().match(/^(#{1,3})\s+(.+)$/);
        if (match) {
          const level = match[1].length;
          const title = formatTextContent(match[2]);
          htmlContent += `<h${level} class="section-heading">${title}</h${level}>`;
        }
      } else if (line.trim().match(/^\d+\.\s+(.+)$/)) {
        // Liste numérotée ou section numérotée
        if (paragraphContent) {
          htmlContent += `<p>${formatTextContent(paragraphContent)}</p>`;
          paragraphContent = '';
        }
        
        const match = line.trim().match(/^(\d+)\.\s+(.+)$/);
        if (match) {
          const number = match[1];
          const content = formatTextContent(match[2]);
          
          // Déterminer si c'est un titre de section ou une simple ligne numérotée
          const isProbablyTitle = 
            /^[A-Z]/.test(match[2]) || // Commence par une majuscule
            match[2].includes('étape') || 
            match[2].includes('Étape') ||
            match[2].includes('Exemple') ||
            match[2].includes('Comprendre');
          
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
      htmlContent += `<p>${formatTextContent(paragraphContent)}</p>`;
    }
    
    // 3. POST-TRAITEMENT: Restaurer les expressions mathématiques
    // Remplacer tous les placeholders par les expressions mathématiques originales
    mathExpressions.forEach((expr, index) => {
      const placeholder = `MATH_PLACEHOLDER_${index}`;
      // Remplacer de manière littérale, sans expressions régulières
      htmlContent = htmlContent.split(placeholder).join(expr);
    });
    
    return htmlContent;
  };
  
  // Formater le texte dans les paragraphes et autres éléments
  const formatTextContent = (text: string): string => {
    if (!text) return '';
    
    // Protéger certains caractères spéciaux (pour éviter des remplacements indésirables)
    const codeSnippets: string[] = [];
    
    // Remplacer temporairement le code inline avec backticks
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
    
    // Traitement spécial pour le texte français avec apostrophes
    // On ne modifie pas le texte normal en français, seulement le vrai code de programmation
    
    // Détection des mots français courants avec apostrophes (n', l', d', j', etc.)
    const frenchWithApostrophe = /\b[nljdcsmt]'[a-zàâäçéèêëîïôöùûüÿ]/i;
    
    formattedText = formattedText.replace(/'([^']+)'/g, (match, content) => {
      // Liste des mots possiblement français dans le contenu
      if (
        content.includes(' ') || // Contient des espaces => probablement une phrase
        frenchWithApostrophe.test(content) || // Contient n', l', d', etc. => français
        /[àâäçéèêëîïôöùûüÿÀÂÄÇÉÈÊËÎÏÔÖÙÛÜŸ]/.test(content) // Caractères français
      ) {
        // C'est du texte français, ne pas le formater comme du code
        return match;
      }
      
      // Vérification stricte pour la détection du code de programmation
      if (
        // C'est du code UNIQUEMENT si c'est un mot-clé exact ou une instruction exacte
        /^(let|var|const|for|while|if|else|function|return|true|false|null|this|new|import|export|class|throw|try|catch)$/.test(content) ||
        // Ou si c'est une expression typique de code sans caractères français
        (/[:;{}=\/\[\]\.+\-*%]/.test(content) && !/\s+/.test(content))
      ) {
        // C'est du code => formater comme tel
        return `<code class="inline-code">${content}</code>`;
      }
      
      // Dans le doute, considérer comme du texte normal
      return match;
    });
    
    // Restaurer les fragments de code
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
  
  // Observer les changements de hauteur et stabiliser le contenu
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
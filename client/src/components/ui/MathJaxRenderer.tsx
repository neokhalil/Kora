import React, { useEffect, useRef } from 'react';
import { MathJaxContext, MathJax } from 'better-react-mathjax';
import hljs from 'highlight.js';
import 'highlight.js/styles/github.css';
import { formatMathContent, sanitizeMathInput } from '../../utils/mathJaxFormatter';

interface TextContentProps {
  content: string;
  className?: string;
}

// Configuration de MathJax
const mathJaxConfig = {
  loader: { load: ['input/tex', 'output/svg'] },
  tex: {
    inlineMath: [['$', '$'], ['\\(', '\\)']],
    displayMath: [['$$', '$$'], ['\\[', '\\]']],
    processEscapes: true,
    processEnvironments: true,
    packages: ['base', 'ams', 'noerrors', 'noundefined']
  },
  svg: {
    fontCache: 'global'
  },
  options: {
    enableMenu: false,
    skipHtmlTags: ['script', 'noscript', 'style', 'textarea', 'pre'],
    processHtmlClass: 'tex2jax_process'
  },
  startup: {
    typeset: true
  }
};

/**
 * Composant simplifié pour l'affichage de texte avec support des formules mathématiques
 * Cette version utilise une approche beaucoup plus directe pour éviter les problèmes de formatage
 */
const MathJaxRenderer: React.FC<TextContentProps> = ({ content, className = '' }) => {
  const mathJaxRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    // Initialiser highlight.js sur les éléments de code
    hljs.configure({ languages: [] });
    document.querySelectorAll('pre code:not(.hljs)').forEach((block) => {
      hljs.highlightElement(block as HTMLElement);
    });
    
    // Force MathJax to reprocess when content changes - delayed to ensure DOM is ready
    const timer = setTimeout(() => {
      if (window.MathJax && mathJaxRef.current) {
        try {
          window.MathJax.typesetPromise([mathJaxRef.current]).catch((err: any) => 
            console.error('MathJax typesetting failed:', err)
          );
        } catch (error) {
          console.error('MathJax error:', error);
        }
      }
    }, 200);
    
    return () => clearTimeout(timer);
  }, [content]);

  if (!content) {
    return null;
  }

  // Prétraiter le contenu pour formater correctement les équations mathématiques
  // Nous appliquons une double passe de sanitization et formatage
  let processedContent = formatMathContent(sanitizeMathInput(content));
  
  // Dernière vérification pour s'assurer que les délimiteurs de math sont correctement espacés
  processedContent = processedContent.replace(/([^\s])\$\$/g, '$1 $$');
  processedContent = processedContent.replace(/\$\$([^\s])/g, '$$ $1');
  processedContent = processedContent.replace(/([^\s])\$/g, '$1 $');
  processedContent = processedContent.replace(/\$([^\s])/g, '$ $1');
  
  // Traiter explicitement les équations isolées qui pourraient causer des problèmes
  // notamment après des numéros d'étapes
  processedContent = processedContent.replace(/(\d+\.\s+.+?:)\s*\n\s*(\$|\$\$)/g, '$1\n<div class="math-block">$2');
  processedContent = processedContent.replace(/(\$|\$\$)([^$]+)(\$|\$\$)(?:\s*\n)/g, '$1$2$3</div>\n');
  
  // Traiter les blocs de code
  const codeBlockRegex = /```(\w*)\n([\s\S]*?)```/g;
  let formattedContent = processedContent.replace(codeBlockRegex, (match, language, code) => {
    try {
      const highlightedCode = language 
        ? hljs.highlight(code, { language }).value 
        : hljs.highlightAuto(code).value;
      
      return `<pre class="hljs-pre"><code class="language-${language || 'plaintext'} hljs">${highlightedCode}</code></pre>`;
    } catch (error) {
      return `<pre class="hljs-pre"><code class="hljs">${hljs.highlightAuto(code).value}</code></pre>`;
    }
  });
  
  // Traiter les titres markdown
  formattedContent = formattedContent.replace(/^(#{1,6})\s+(.+?)$/gm, (match, hashes, title) => {
    const level = hashes.length;
    const size = ['text-3xl', 'text-2xl', 'text-xl', 'text-lg', 'text-base', 'text-base'][Math.min(level - 1, 5)];
    return `<h${level} class="${size} font-bold">${title}</h${level}>`;
  });
  
  // Traiter le texte en gras
  formattedContent = formattedContent.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  
  // Gérer correctement les numéros suivis d'équations - ce pattern est souvent problématique
  formattedContent = formattedContent.replace(/(\d+\.\s+[^:]+:)\s*\n\s*(\d+)/g, (match, label, number) => {
    return `${label}\n<div class="step-result">${number}</div>`;
  });
  
  // Indenter correctement les listes d'instructions après un titre numéroté
  // Format: "2. Titre : - Instruction" -> mettre chaque instruction sur une nouvelle ligne et indentée
  formattedContent = formattedContent.replace(/(\d+\.\s+[^:]+:)([^-]*?)(-\s+[^-\n]+)(-\s+[^-\n]+)/g, 
    (match, titlePart, textBefore, firstInstruction, secondInstruction) => {
    return `${titlePart}${textBefore}<div class="instruction-step">${firstInstruction}</div><div class="instruction-step">${secondInstruction}</div>`;
  });
  
  // Traiter les cas avec une seule instruction
  formattedContent = formattedContent.replace(/(\d+\.\s+[^:]+:)([^-]*?)(-\s+[^-\n]+)(?!\s*<div class="instruction-step">)/g, 
    (match, titlePart, textBefore, instruction) => {
    return `${titlePart}${textBefore}<div class="instruction-step">${instruction}</div>`;
  });
  
  // Formater tous les tirets qui commencent une ligne comme des éléments de liste
  formattedContent = formattedContent.replace(/(\n|^)-\s+([^\n]+)/g, (match, newline, content) => {
    return `${newline}<div class="list-item">- ${content}</div>`;
  });
  
  // Préserver les paragraphes mais sans fragmenter le texte
  formattedContent = formattedContent.replace(/\n\n+/g, '<br><br>');
  
  // Remplacer les sauts de ligne simples par des espaces, sauf après des balises HTML
  formattedContent = formattedContent.replace(/([^>\n])\n([^\n<])/g, '$1 $2');
  
  // Protection supplémentaire pour les équations isolées pouvant apparaître comme des "1"
  formattedContent = formattedContent.replace(/<div>\s*1\s*<\/div>/g, '<div class="possible-equation">1</div>');
  
  return (
    <div className={`math-renderer ${className}`} ref={mathJaxRef}>
      <MathJaxContext config={mathJaxConfig}>
        <div className="math-content">
          <MathJax>
            <div dangerouslySetInnerHTML={{ __html: formattedContent }} />
          </MathJax>
        </div>
      </MathJaxContext>
    </div>
  );
};

export default MathJaxRenderer;
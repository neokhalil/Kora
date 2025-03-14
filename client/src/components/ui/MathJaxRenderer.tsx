import React, { useEffect, useRef } from 'react';
import { MathJaxContext, MathJax } from 'better-react-mathjax';
import hljs from 'highlight.js';
import 'highlight.js/styles/github.css';
import { formatMathContent } from '../../utils/mathJaxFormatter';

interface TextContentProps {
  content: string;
  className?: string;
}

// Configuration de MathJax optimisée
const mathJaxConfig = {
  loader: {
    load: ['input/tex-full', 'output/svg']
  },
  tex: {
    inlineMath: [['$', '$'], ['\\(', '\\)']],
    displayMath: [['$$', '$$'], ['\\[', '\\]']],
    processEscapes: true,
    processEnvironments: true,
    packages: ['base', 'ams', 'noerrors', 'noundefined', 'cancel', 'color', 'boldsymbol']
  },
  svg: {
    fontCache: 'global',
    scale: 1,
    minScale: 0.5
  },
  options: {
    skipHtmlTags: ['script', 'noscript', 'style', 'textarea', 'pre', 'code'],
    renderActions: {
      addMenu: [0, '', '']
    }
  },
  startup: {
    typeset: true
  }
};

/**
 * Composant optimisé pour l'affichage de texte avec formules mathématiques
 */
const MathJaxRenderer: React.FC<TextContentProps> = ({ content, className = '' }) => {
  const mathJaxRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    // Highlight code blocks
    hljs.configure({ languages: [] });
    document.querySelectorAll('pre code:not(.hljs)').forEach((block) => {
      hljs.highlightElement(block as HTMLElement);
    });
    
    // Process MathJax after the DOM is ready
    const timer = setTimeout(() => {
      if (window.MathJax && mathJaxRef.current) {
        try {
          console.log('Running MathJax typeset');
          // Reset any previous typesetting
          window.MathJax.typesetClear && window.MathJax.typesetClear([mathJaxRef.current]);
          // Process new content
          window.MathJax.typesetPromise([mathJaxRef.current])
            .catch((err: any) => console.error('MathJax error:', err));
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
  
  // Traiter les expressions mathématiques de manière plus fiable
  // en utilisant les fonctions de mathJaxFormatter
  let formattedContent = formatMathContent(content);
  
  // Format code blocks
  formattedContent = formattedContent.replace(/```(\w*)\n([\s\S]*?)```/g, (match, language, code) => {
    try {
      const highlightedCode = language 
        ? hljs.highlight(code, { language }).value 
        : hljs.highlightAuto(code).value;
      
      return `<pre class="hljs-pre"><code class="language-${language || 'plaintext'} hljs">${highlightedCode}</code></pre>`;
    } catch (error) {
      return `<pre class="hljs-pre"><code class="hljs">${hljs.highlightAuto(code).value}</code></pre>`;
    }
  });
  
  // Format Markdown headings
  formattedContent = formattedContent.replace(/^(#{1,6})\s+(.+?)$/gm, (match, hashes, title) => {
    const level = hashes.length;
    const size = ['text-3xl', 'text-2xl', 'text-xl', 'text-lg', 'text-base', 'text-base'][Math.min(level - 1, 5)];
    return `<h${level} class="${size} font-bold">${title}</h${level}>`;
  });
  
  // Format bold text
  formattedContent = formattedContent.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  
  // Preserve line breaks in a readable way
  formattedContent = formattedContent.replace(/\n\n+/g, '<br><br>');
  
  // Format the content into paragraphs with proper structure
  const paragraphs = formattedContent.split('<br><br>');
  const wrappedParagraphs = paragraphs.map((para, index) => {
    if (para.trim() === '') return '';
    
    // Special handling for numbered lists
    if (/^\d+\.\s/.test(para)) {
      return `<div class="numbered-item" key="${index}">${para}</div>`;
    }
    
    return `<div class="paragraph" key="${index}">${para}</div>`;
  }).join('');
  
  // Filtrage supplémentaire pour éliminer les "1" et "$\displaystyle 1$" qui apparaissent parfois
  let cleanedHtml = wrappedParagraphs;
  // Remplacer les "11" ou "1" isolés qui pourraient être des erreurs de formule
  cleanedHtml = cleanedHtml.replace(/<div[^>]*>\s*11\s*<\/div>/g, '');
  cleanedHtml = cleanedHtml.replace(/(\$\\displaystyle\s+1\$)|(\$1\$)/g, '');

  return (
    <div className={`math-renderer ${className}`} ref={mathJaxRef}>
      <MathJaxContext config={mathJaxConfig}>
        <MathJax>
          <div dangerouslySetInnerHTML={{ __html: cleanedHtml }} />
        </MathJax>
      </MathJaxContext>
    </div>
  );
};

export default MathJaxRenderer;
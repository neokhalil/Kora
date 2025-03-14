import React, { useEffect, useRef } from 'react';
import { MathJaxContext, MathJax } from 'better-react-mathjax';
import hljs from 'highlight.js';
import 'highlight.js/styles/github.css';

interface TextContentProps {
  content: string;
  className?: string;
}

// Configuration de MathJax complète
const mathJaxConfig = {
  loader: {
    load: ['input/tex-full', 'output/svg']
  },
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
    skipHtmlTags: ['script', 'noscript', 'style', 'textarea', 'pre', 'code']
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
    
    // Pour éviter les problèmes de rendu, on procède en deux étapes
    const preProcessTimer = setTimeout(() => {
      // Conversion manuelle des \[...\] en $$...$$
      if (mathJaxRef.current) {
        const elements = mathJaxRef.current.querySelectorAll('div');
        elements.forEach(element => {
          const html = element.innerHTML;
          if (html && html.includes('\\[') && html.includes('\\]')) {
            console.log('Converting \\[...\\] to $$...$$');
            const newHtml = html.replace(/\\\[([\s\S]*?)\\\]/g, '$$$$1$$');
            element.innerHTML = newHtml;
          }
        });
      }
      
      // Traitement MathJax
      const renderTimer = setTimeout(() => {
        if (window.MathJax && mathJaxRef.current) {
          try {
            console.log('Running MathJax typeset');
            window.MathJax.typesetPromise([mathJaxRef.current])
              .catch((err: any) => console.error('MathJax error:', err));
          } catch (error) {
            console.error('MathJax error:', error);
          }
        }
      }, 100);
      
      return () => clearTimeout(renderTimer);
    }, 100);
    
    return () => clearTimeout(preProcessTimer);
  }, [content]);

  if (!content) {
    return null;
  }
  
  // Format code blocks
  let formattedContent = content;

  // IMPORTANT: Prétraiter les notations alternatives de LaTeX
  // Convertir \[...\] en $$...$$
  formattedContent = formattedContent.replace(/\\\[([\s\S]*?)\\\]/g, '$$$$1$$');
  
  // Convertir \(...\) en $...$
  formattedContent = formattedContent.replace(/\\\(([\s\S]*?)\\\)/g, '$$$1$');
  
  // Traiter spécifiquement les délimiteurs non correctement traités
  formattedContent = formattedContent.replace(/\\x = \\frac/g, '$x = \\frac');
  formattedContent = formattedContent.replace(/\\] ax/g, '$$ ax');
  
  // Process code blocks
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
  
  // Ensure paragraphs are properly structured
  const paragraphs = formattedContent.split('<br><br>');
  const wrappedParagraphs = paragraphs.map((para, index) => {
    if (para.trim() === '') return '';
    
    // Add special handling for numbered items
    if (/^\d+\.\s/.test(para)) {
      // Traitement spécial des équations après les numéros
      if (para.includes('\\[') || para.includes('\\(')) {
        para = para.replace(/\\\[([\s\S]*?)\\\]/g, '$$$$1$$');
        para = para.replace(/\\\(([\s\S]*?)\\\)/g, '$$$1$');
      }
      return `<div class="numbered-item" key="${index}">${para}</div>`;
    }
    
    return `<div class="paragraph" key="${index}">${para}</div>`;
  }).join('');
  
  return (
    <div className={`math-renderer ${className}`} ref={mathJaxRef}>
      <MathJaxContext config={mathJaxConfig}>
        <MathJax>
          <div dangerouslySetInnerHTML={{ __html: wrappedParagraphs }} />
        </MathJax>
      </MathJaxContext>
    </div>
  );
};

export default MathJaxRenderer;
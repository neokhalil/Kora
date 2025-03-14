import React, { useEffect, useRef } from 'react';
import { MathJaxContext, MathJax } from 'better-react-mathjax';
import hljs from 'highlight.js';
import 'highlight.js/styles/github.css';

interface TextContentProps {
  content: string;
  className?: string;
}

// Configuration MathJax optimisée et simplifiée
const mathJaxConfig = {
  loader: {
    load: ['input/tex', 'output/chtml']
  },
  tex: {
    inlineMath: [['$', '$'], ['\\(', '\\)']],
    displayMath: [['$$', '$$'], ['\\[', '\\]']],
    processEscapes: true,
    tags: 'ams',
    packages: {'[+]': ['ams', 'noerrors', 'base', 'boldsymbol', 'color']}
  },
  chtml: {
    fontFamily: 'serif',
    scale: 1,
    minScale: 0.5
  },
  options: {
    skipHtmlTags: ['script', 'noscript', 'style', 'textarea', 'pre', 'code'],
    processHtmlClass: 'math-content'
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
          console.log('Cleaning previous MathJax typesetting');
          window.MathJax.typesetClear && window.MathJax.typesetClear([mathJaxRef.current]);
          
          console.log('Running MathJax typeset');
          window.MathJax.typesetPromise([mathJaxRef.current])
            .catch((err: any) => console.error('MathJax error:', err));
        } catch (error) {
          console.error('MathJax error:', error);
        }
      }
    }, 300);
    
    return () => clearTimeout(timer);
  }, [content]);

  if (!content) {
    return null;
  }
  
  // PREMIÈRE ÉTAPE: PROTECTION DES SECTIONS NON MATHÉMATIQUES
  // Sauvegarde des sections non mathématiques
  const codeBlocks: string[] = [];
  let processedContent = content.replace(/```[\s\S]*?```/g, (match) => {
    codeBlocks.push(match);
    return `__CODE_BLOCK_${codeBlocks.length - 1}__`;
  });
  
  // DEUXIÈME ÉTAPE: STANDARDISATION DES FORMULES MATHÉMATIQUES
  // Standardisation des délimiteurs
  processedContent = processedContent
    // Convertir \[...\] en $$...$$
    .replace(/\\\[([\s\S]*?)\\\]/g, '$$$$1$$')
    // Convertir \(...\) en $...$
    .replace(/\\\(([\s\S]*?)\\\)/g, '$$$1$')
    // Supprimer les espaces autour des symboles $
    .replace(/\s*\$\s*/g, '$')
    .replace(/\s*\$\$\s*/g, '$$');
  
  // TROISIÈME ÉTAPE: FORMATAGE MARKDOWN
  // Format code blocks
  processedContent = processedContent.replace(/__CODE_BLOCK_(\d+)__/g, (match, index) => {
    const code = codeBlocks[parseInt(index)];
    const match2 = code.match(/```(\w*)\n([\s\S]*?)```/);
    
    if (!match2) return code;
    
    const language = match2[1];
    const codeContent = match2[2];
    
    try {
      const highlightedCode = language 
        ? hljs.highlight(codeContent, { language }).value 
        : hljs.highlightAuto(codeContent).value;
      
      return `<pre class="hljs-pre"><code class="language-${language || 'plaintext'} hljs">${highlightedCode}</code></pre>`;
    } catch (error) {
      return `<pre class="hljs-pre"><code class="hljs">${hljs.highlightAuto(codeContent).value}</code></pre>`;
    }
  });
  
  // Format Markdown headings
  processedContent = processedContent.replace(/^(#{1,6})\s+(.+?)$/gm, (match, hashes, title) => {
    const level = hashes.length;
    const size = ['text-3xl', 'text-2xl', 'text-xl', 'text-lg', 'text-base', 'text-base'][Math.min(level - 1, 5)];
    return `<h${level} class="${size} font-bold">${title}</h${level}>`;
  });
  
  // Format bold text
  processedContent = processedContent.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  
  // Preserve line breaks in a readable way
  processedContent = processedContent.replace(/\n\n+/g, '<br><br>');
  
  // QUATRIÈME ÉTAPE: STRUCTURE DES PARAGRAPHES
  // Format the content into paragraphs with proper structure
  const paragraphs = processedContent.split('<br><br>');
  const wrappedParagraphs = paragraphs.map((para, index) => {
    if (para.trim() === '') return '';
    
    // Special handling for numbered lists
    if (/^\d+\.\s/.test(para)) {
      return `<div class="numbered-item math-content" key="${index}">${para}</div>`;
    }
    
    return `<div class="paragraph math-content" key="${index}">${para}</div>`;
  }).join('');
  
  // CINQUIÈME ÉTAPE: RENDU AVEC MATHJAX
  return (
    <div className={`math-renderer ${className}`} ref={mathJaxRef}>
      <MathJaxContext config={mathJaxConfig}>
        <MathJax inline dynamic>
          <div dangerouslySetInnerHTML={{ __html: wrappedParagraphs }} />
        </MathJax>
      </MathJaxContext>
    </div>
  );
};

export default MathJaxRenderer;
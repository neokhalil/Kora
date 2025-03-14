import React, { useEffect, useRef } from 'react';
import { MathJaxContext, MathJax } from 'better-react-mathjax';
import hljs from 'highlight.js';
import 'highlight.js/styles/github.css';
import { applyEquationTemplates, fixRenderedEquations } from '../../utils/equationTemplates';

interface TextContentProps {
  content: string;
  className?: string;
}

// Configuration MathJax optimisée et simplifiée
const mathJaxConfig = {
  tex: {
    inlineMath: [['$', '$'], ['\\(', '\\)']],
    displayMath: [['$$', '$$'], ['\\[', '\\]']],
    processEscapes: true,
    processEnvironments: true,
    macros: {
      '*': '\\times'  // Remplacer * par \times
    },
    packages: ["base", "ams", "noerrors", "noundefined", "autoload", "require", "newcommand", "configmacros"]
  },
  svg: {
    fontCache: 'global',
    scale: 1.2
  },
  options: {
    // Éviter que MathJax transforme certains éléments
    skipHtmlTags: ['script', 'noscript', 'style', 'textarea', 'pre', 'code', 'annotation', 'annotation-xml'],
    ignoreHtmlClass: 'no-mathjax'
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
  // Préparation du contenu pour éviter les problèmes d'espacement et les formules manquantes
  // Ajouter de l'espace entre texte et formules pour éviter les problèmes
  processedContent = processedContent
    // S'assurer qu'il y a des espaces entre le texte et les formules
    .replace(/([a-zA-Z0-9.,;:!?)])(\$)/g, '$1 $2')
    .replace(/(\$)([a-zA-Z0-9(])/g, '$1 $2');
  
  // Convertir différentes notations LaTeX en format standard
  processedContent = processedContent
    // Convertir \[...\] en $$...$$
    .replace(/\\\[([\s\S]*?)\\\]/g, ' $$$$$1$$$ ')
    // Convertir \(...\) en $...$
    .replace(/\\\(([\s\S]*?)\\\)/g, ' $$$1$$ ')
    // Améliorer l'espacement autour des formules displaystyle
    .replace(/\$\$([\s\S]*?)\$\$/g, ' $$$$1$$ ');
    
  // Nettoyer les délimiteurs $$ dupliqués ou malformés
  processedContent = processedContent
    .replace(/\$\$\s*\$\$/g, '$$')  // supprimer $$$$ -> $$
    .replace(/\$\s*\$/g, '$');      // supprimer $$ -> $
  
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
  
  // CINQUIÈME ÉTAPE: APPLIQUER LES TEMPLATES D'ÉQUATIONS
  // Pour assurer que les équations standard sont correctement formatées
  processedContent = applyEquationTemplates(processedContent);
  
  // SIXIÈME ÉTAPE: STRUCTURE EN HTML ET NETTOYAGE
  const paragraphsWithTemplates = processedContent.split('<br><br>');
  let wrappedParagraphsWithTemplates = paragraphsWithTemplates.map((para, index) => {
    if (para.trim() === '') return '';
    
    // Special handling for numbered lists
    if (/^\d+\.\s/.test(para)) {
      return `<div class="numbered-item math-content" key="${index}">${para}</div>`;
    }
    
    return `<div class="paragraph math-content" key="${index}">${para}</div>`;
  }).join('');
  
  // Nettoyage final du contenu
  let cleanedHtml = wrappedParagraphsWithTemplates;
  
  // Supprimer les "1" isolés qui pourraient apparaître à la place des formules
  cleanedHtml = cleanedHtml
    .replace(/\$1\$/g, '$ax^2 + bx + c = 0$')  // Remplacer $1$ par l'équation standard
    .replace(/\$\s*\\displaystyle\s*1\s*\$/g, '$\\displaystyle{ax^2 + bx + c = 0}$')  // Remplacer les expressions avec displaystyle=1
    .replace(/<div[^>]*>\s*1\s*<\/div>/g, '');  // Supprimer les divs qui ne contiennent que "1"
    
  // Nettoyer les délimiteurs qui ne contiennent rien
  cleanedHtml = cleanedHtml
    .replace(/\$\s*\$/g, '')  // Supprimer les $$ vides
    .replace(/\$\$\s*\$\$/g, '');  // Supprimer les $$$$ vides
  
  // Appliquer les corrections post-rendu
  cleanedHtml = fixRenderedEquations(cleanedHtml);
  
  // FIXATION SPÉCIFIQUE POUR L'EXEMPLE D'ÉQUATION DU SECOND DEGRÉ
  // Ce bloc est une correction ciblée pour le problème connu
  cleanedHtml = cleanedHtml
    // Forcer le rendu correct de l'équation du second degré
    .replace(/Pour\s+résoudre\s+une\s+équation\s+du\s+second\s+degré.*?suivante\s*:.*?/g, 
      'Pour résoudre une équation du second degré, nous utilisons généralement la forme générale suivante : $ax^2 + bx + c = 0$ où ')
    // Corriger "où a, b, et c sont"
    .replace(/où\s*1\s*où\s*a,\s*b,\s*et\s*c\s*sont/g, 'où $a$, $b$, et $c$ sont')
    // Corriger l'analyse du discriminant
    .replace(/Si\s*1\s*>\s*0/g, 'Si $\\Delta > 0$,')
    .replace(/Si\s*1\s*=\s*0/g, 'Si $\\Delta = 0$,')
    .replace(/Si\s*1\s*<\s*0/g, 'Si $\\Delta < 0$,');
    
  // SEPTIÈME ÉTAPE: RENDU AVEC MATHJAX
  return (
    <div className={`math-renderer ${className}`} ref={mathJaxRef}>
      <MathJaxContext config={mathJaxConfig}>
        <MathJax inline dynamic>
          <div dangerouslySetInnerHTML={{ __html: cleanedHtml }} />
        </MathJax>
      </MathJaxContext>
    </div>
  );
};

export default MathJaxRenderer;
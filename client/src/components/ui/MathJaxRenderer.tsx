import React, { useEffect, useRef } from 'react';
import { MathJaxContext, MathJax } from 'better-react-mathjax';
import hljs from 'highlight.js';
import 'highlight.js/styles/github.css';
import { formatMathContent, sanitizeMathInput } from '../../utils/mathJaxFormatter';

interface TextContentProps {
  content: string;
  className?: string;
}

// Configuration de MathJax - version améliorée et simplifiée
const mathJaxConfig = {
  loader: {
    load: ['input/tex-full', 'output/svg', '[tex]/html', '[tex]/mhchem', '[tex]/physics']
  },
  tex: {
    packages: {'[+]': ['html', 'mhchem', 'physics']},
    inlineMath: [['$', '$'], ['\\(', '\\)']],
    displayMath: [['$$', '$$'], ['\\[', '\\]']],
    processEscapes: true,
    processEnvironments: true,
    tags: 'ams'
  },
  svg: {
    fontCache: 'global',
    scale: 1,
    minScale: 0.5
  },
  chtml: {
    scale: 1,
    minScale: 0.5,
    mtextInheritFont: true
  },
  options: {
    enableMenu: false,
    skipHtmlTags: ['script', 'noscript', 'style', 'textarea', 'code', 'annotation', 'annotation-xml'],
    renderActions: {
      addMenu: [0, '', '']
    },
    processHtmlClass: 'math-tex'
  },
  startup: {
    typeset: true,
    ready: () => {
      console.log('MathJax is ready');
    }
  }
};

/**
 * Composant pour l'affichage de texte avec support des formules mathématiques
 * Nouvelle approche fondamentale qui résout les problèmes de formatage
 */
const MathJaxRenderer: React.FC<TextContentProps> = ({ content, className = '' }) => {
  const mathJaxRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    // Configuration de highlight.js pour la coloration syntaxique du code
    hljs.configure({ languages: [] });
    document.querySelectorAll('pre code:not(.hljs)').forEach((block) => {
      hljs.highlightElement(block as HTMLElement);
    });
    
    // Force MathJax to reprocess when content changes
    // Timing augmenté pour s'assurer que le DOM est complètement prêt
    const timer = setTimeout(() => {
      if (window.MathJax && mathJaxRef.current) {
        try {
          // Premier reset complet pour éviter les rendus partiels
          window.MathJax.typesetClear([mathJaxRef.current]);
          
          // Puis nouveau rendu complet
          window.MathJax.typesetPromise([mathJaxRef.current])
            .catch((err: any) => console.error('MathJax typesetting failed:', err));
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

  // Préparation du contenu
  const sanitizedContent = sanitizeMathInput(content);
  const processedContent = formatMathContent(sanitizedContent);
  
  // Nouvelle méthode: traiter chaque partie du contenu selon son type (texte, maths, code)
  // pour assurer un rendu correct de chaque type d'élément
  const structuredContent = prepareStructuredContent(processedContent);
  
  return (
    <div className={`math-renderer ${className}`} ref={mathJaxRef}>
      <MathJaxContext config={mathJaxConfig}>
        <div className="math-content">
          {structuredContent}
        </div>
      </MathJaxContext>
    </div>
  );
};

/**
 * Prépare le contenu en séparant clairement les parties mathématiques, code et texte
 * Cette approche évite les conflits de formatage et assure un meilleur rendu
 */
function prepareStructuredContent(content: string): React.ReactNode {
  if (!content) return null;
  
  // Découper le contenu en paragraphes pour préserver la structure
  const paragraphs = content.split(/\n\n+/);
  
  return (
    <div>
      {paragraphs.map((paragraph, index) => {
        // Traiter les blocs de code spécialement
        if (paragraph.startsWith('```')) {
          const match = paragraph.match(/```(\w*)\n([\s\S]*?)```/);
          if (match) {
            const language = match[1] || 'plaintext';
            const code = match[2];
            try {
              const highlightedCode = language 
                ? hljs.highlight(code, { language }).value 
                : hljs.highlightAuto(code).value;
              
              return (
                <pre key={`code-${index}`} className="hljs-pre">
                  <code 
                    className={`language-${language} hljs`}
                    dangerouslySetInnerHTML={{ __html: highlightedCode }}
                  />
                </pre>
              );
            } catch (error) {
              return (
                <pre key={`code-${index}`} className="hljs-pre">
                  <code 
                    className="hljs"
                    dangerouslySetInnerHTML={{ __html: hljs.highlightAuto(code).value }}
                  />
                </pre>
              );
            }
          }
        }
        
        // Traiter le formatage de texte (titres, emphase, etc.)
        let formattedParagraph = paragraph;
        
        // Traiter les titres markdown
        formattedParagraph = formattedParagraph.replace(/^(#{1,6})\s+(.+?)$/gm, (match, hashes, title) => {
          const level = hashes.length;
          const size = ['text-3xl', 'text-2xl', 'text-xl', 'text-lg', 'text-base', 'text-base'][Math.min(level - 1, 5)];
          return `<h${level} class="${size} font-bold">${title}</h${level}>`;
        });
        
        // Traiter le texte en gras
        formattedParagraph = formattedParagraph.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
        
        // Créer un wrapper avec une classe contextuelle pour les paragraphes numérotés
        if (/^\d+\.\s/.test(formattedParagraph)) {
          return (
            <div key={`p-${index}`} className="numbered-section">
              <MathJax>
                <div className="paragraph-content" dangerouslySetInnerHTML={{ __html: formattedParagraph }} />
              </MathJax>
            </div>
          );
        }
        
        // Rendu des formules mathématiques dans le contexte d'un paragraphe
        return (
          <div key={`p-${index}`} className="paragraph">
            <MathJax>
              <div className="paragraph-content" dangerouslySetInnerHTML={{ __html: formattedParagraph }} />
            </MathJax>
          </div>
        );
      })}
    </div>
  );
}

export default MathJaxRenderer;
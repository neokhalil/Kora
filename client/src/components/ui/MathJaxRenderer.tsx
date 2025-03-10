import React, { useEffect } from 'react';
import { MathJaxContext, MathJax } from 'better-react-mathjax';
import hljs from 'highlight.js';
import 'highlight.js/styles/github.css';

interface TextContentProps {
  content: string;
  className?: string;
}

// Configuration de MathJax
const mathJaxConfig = {
  tex: {
    inlineMath: [['$', '$'], ['\\(', '\\)']],
    displayMath: [['$$', '$$'], ['\\[', '\\]']],
    processEscapes: true,
    processEnvironments: true
  },
  options: {
    skipHtmlTags: ['script', 'noscript', 'style', 'textarea', 'pre', 'code'],
    processHtmlClass: 'math-tex'
  },
  startup: {
    pageReady: () => {
      return Promise.resolve();
    }
  }
};

// Fonction pour détecter les blocs de code dans le contenu
const processCodeBlocks = (content: string): React.ReactNode[] => {
  if (!content) return [];

  // Expression régulière pour capturer les blocs de code avec optionnellement un langage spécifié
  const codeBlockRegex = /```(\w*)\n([\s\S]*?)```/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;

  // Parcourir tous les blocs de code
  while ((match = codeBlockRegex.exec(content)) !== null) {
    // Ajouter le texte avant le bloc de code
    if (match.index > lastIndex) {
      parts.push(
        <MathJax key={`text-${lastIndex}`}>
          {content.substring(lastIndex, match.index)}
        </MathJax>
      );
    }

    const language = match[1] || 'plaintext';
    const code = match[2];

    // Ajouter le bloc de code avec coloration syntaxique
    try {
      const highlightedCode = language !== 'plaintext'
        ? hljs.highlight(code, { language }).value
        : hljs.highlightAuto(code).value;

      parts.push(
        <pre key={`code-${match.index}`} className="hljs-pre">
          <code
            className={`language-${language} hljs`}
            dangerouslySetInnerHTML={{ __html: highlightedCode }}
          />
        </pre>
      );
    } catch (error) {
      // Si le langage n'est pas reconnu, utiliser la coloration automatique
      parts.push(
        <pre key={`code-${match.index}`} className="hljs-pre">
          <code
            className="hljs"
            dangerouslySetInnerHTML={{ __html: hljs.highlightAuto(code).value }}
          />
        </pre>
      );
    }

    lastIndex = match.index + match[0].length;
  }

  // Ajouter le reste du texte après le dernier bloc de code
  if (lastIndex < content.length) {
    parts.push(
      <MathJax key={`text-${lastIndex}`}>
        {content.substring(lastIndex)}
      </MathJax>
    );
  }

  return parts.length > 0 ? parts : [<MathJax key="text-full">{content}</MathJax>];
};

/**
 * Composant avancé pour l'affichage de texte avec support des formules mathématiques et coloration syntaxique
 */
const MathJaxRenderer: React.FC<TextContentProps> = ({ content, className = '' }) => {
  useEffect(() => {
    // Initialiser highlight.js sur les éléments de code déjà dans le DOM
    hljs.configure({ languages: [] });
    document.querySelectorAll('pre code:not(.hljs)').forEach((block) => {
      hljs.highlightElement(block as HTMLElement);
    });
  }, [content]);

  if (!content) {
    return null;
  }

  return (
    <div className={`math-renderer ${className}`}>
      <MathJaxContext config={mathJaxConfig}>
        <div className="whitespace-pre-wrap">
          {processCodeBlocks(content)}
        </div>
      </MathJaxContext>
    </div>
  );
};

export default MathJaxRenderer;
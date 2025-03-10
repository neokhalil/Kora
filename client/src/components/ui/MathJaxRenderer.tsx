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

// Fonction pour détecter les blocs de code et formatter le texte (titres, etc.)
const processContent = (content: string): React.ReactNode[] => {
  if (!content) return [];

  // Expression régulière pour capturer les blocs de code avec optionnellement un langage spécifié
  const codeBlockRegex = /```(\w*)\n([\s\S]*?)```/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;

  // Parcourir tous les blocs de code
  while ((match = codeBlockRegex.exec(content)) !== null) {
    // Traiter le texte avant le bloc de code
    if (match.index > lastIndex) {
      const textPart = content.substring(lastIndex, match.index);
      parts.push(
        <MathJax key={`text-${lastIndex}`}>
          {processFormattedText(textPart)}
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

  // Traiter le reste du texte après le dernier bloc de code
  if (lastIndex < content.length) {
    const textPart = content.substring(lastIndex);
    parts.push(
      <MathJax key={`text-${lastIndex}`}>
        {processFormattedText(textPart)}
      </MathJax>
    );
  }

  return parts.length > 0 ? parts : [
    <MathJax key="text-full">
      {processFormattedText(content)}
    </MathJax>
  ];
};

// Fonction pour traiter le formatage du texte (titres en gras, titres markdown, etc.)
const processFormattedText = (text: string): React.ReactNode => {
  // Ne pas traiter si vide
  if (!text) return text;

  // Créer une copie du texte pour le traitement
  let processedText = text;
  let lastIndex = 0;
  const parts: React.ReactNode[] = [];

  // 1. D'abord, traiter les titres markdown avec ###
  const markdownTitleRegex = /^(#{1,6})\s+(.+?)(?:\s*(?:\n|$))/gm;
  
  // Trouver tous les titres markdown
  let mdMatch;
  let mdMatches = Array.from(processedText.matchAll(markdownTitleRegex));
  
  if (mdMatches.length > 0) {
    // Si nous avons des titres markdown, traitons-les
    for (const match of mdMatches) {
      // Ajouter le texte avant le titre
      if (match.index && match.index > lastIndex) {
        parts.push(processedText.substring(lastIndex, match.index));
      }
      
      // Extraire les composants du titre
      const hashLevel = match[1].length;  // nombre de # (1-6)
      const titleText = match[2].trim();  // le texte du titre
      
      // Déterminer la taille du titre selon le niveau
      let titleClassName = '';
      let Component: keyof JSX.IntrinsicElements = 'h3';
      
      switch (hashLevel) {
        case 1:
          titleClassName = 'text-3xl font-bold';
          Component = 'h1';
          break;
        case 2:
          titleClassName = 'text-2xl font-bold';
          Component = 'h2';
          break;
        case 3:
          titleClassName = 'text-xl font-bold';
          Component = 'h3';
          break;
        case 4:
          titleClassName = 'text-lg font-bold';
          Component = 'h4';
          break;
        case 5:
        case 6:
          titleClassName = 'text-base font-bold';
          Component = 'h5';
          break;
        default:
          titleClassName = 'text-lg font-bold';
          Component = 'h3';
      }
      
      // Ajouter le titre formatté
      parts.push(
        <Component 
          key={`md-title-${match.index}`} 
          className={titleClassName}
        >
          {titleText}
        </Component>
      );
      
      lastIndex = match.index! + match[0].length;
    }
    
    // Ajouter le reste du texte après le dernier titre markdown
    if (lastIndex < processedText.length) {
      // Traiter le reste du texte pour les titres avec **
      const restText = processedText.substring(lastIndex);
      parts.push(processBoldTitles(restText));
    }
    
    return parts;
  } else {
    // S'il n'y a pas de titres markdown, traiter les titres avec **
    return processBoldTitles(processedText);
  }
};

// Sous-fonction pour traiter les titres avec ** (style gras)
const processBoldTitles = (text: string): React.ReactNode => {
  if (!text) return text;
  
  // Remplacer les titres avec ** par des éléments en gras
  // Format: "**Titre**:" ou "**Titre** :" ou numéro + "**Titre**:"
  const titleRegex = /(\d+\.\s*)?(\*\*([^*]+)\*\*)(\s*:)?/g;
  
  let lastIndex = 0;
  const parts: React.ReactNode[] = [];
  
  // Trouver tous les titres
  let match;
  while ((match = titleRegex.exec(text)) !== null) {
    // Ajouter le texte avant le titre
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }
    
    // Extraire les composants du titre
    const number = match[1] || '';  // le numéro (optionnel)
    const titleText = match[3];     // le texte du titre sans les **
    const colon = match[4] || '';   // les deux points (optionnels)
    
    // Ajouter le titre formatté en HTML
    parts.push(
      <React.Fragment key={`bold-title-${match.index}`}>
        {number && <span>{number}</span>}
        <strong className="font-bold">{titleText}</strong>
        {colon}
      </React.Fragment>
    );
    
    lastIndex = match.index + match[0].length;
  }
  
  // Ajouter le reste du texte après le dernier titre
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }
  
  // S'il n'y avait pas de titres, retourner le texte original
  return parts.length > 0 ? parts : text;
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
          {processContent(content)}
        </div>
      </MathJaxContext>
    </div>
  );
};

export default MathJaxRenderer;
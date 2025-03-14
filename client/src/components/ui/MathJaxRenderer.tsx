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
    skipHtmlTags: ['script', 'noscript', 'style', 'textarea', 'pre', 'code'],
    processHtmlClass: 'math-tex'
  },
  startup: {
    typeset: true,
    pageReady: () => {
      return Promise.resolve();
    }
  }
};

// Fonction pour détecter les blocs de code et formatter le texte (titres, etc.)
const processContent = (content: string): React.ReactNode[] => {
  if (!content) return [];

  // Remplacer les formules $$ et $ qui ne sont pas correctement espacées
  const preprocessedContent = content
    .replace(/\$\$([^\s])/g, '$$ $1')
    .replace(/([^\s])\$\$/g, '$1 $$')
    .replace(/\$([^\s])/g, '$ $1')
    .replace(/([^\s])\$/g, '$1 $');

  // Convertir les sauts de ligne simples en espaces pour éviter la fragmentation
  let nonBreakingContent = preprocessedContent.replace(/([^\n])\n([^\n])/g, "$1 $2");
  
  // Préserver les paragraphes distincts (sauts de ligne doubles)
  nonBreakingContent = nonBreakingContent.replace(/\n\n+/g, "\n\n");

  // Expression régulière pour capturer les blocs de code avec optionnellement un langage spécifié
  const codeBlockRegex = /```(\w*)\n([\s\S]*?)```/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;

  // Parcourir tous les blocs de code
  while ((match = codeBlockRegex.exec(nonBreakingContent)) !== null) {
    // Traiter le texte avant le bloc de code
    if (match.index > lastIndex) {
      const textPart = nonBreakingContent.substring(lastIndex, match.index);
      // Détection des équations $...$ et $$...$$
      const mathParts = splitAndProcessMath(textPart);
      parts.push(
        <MathJax key={`text-${lastIndex}`} className="text-paragraph">
          {mathParts.length > 0 ? mathParts : processFormattedText(textPart)}
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
  if (lastIndex < nonBreakingContent.length) {
    const textPart = nonBreakingContent.substring(lastIndex);
    // Détection des équations $...$ et $$...$$
    const mathParts = splitAndProcessMath(textPart);
    parts.push(
      <MathJax key={`text-${lastIndex}`} className="text-paragraph">
        {mathParts.length > 0 ? mathParts : processFormattedText(textPart)}
      </MathJax>
    );
  }

  return parts.length > 0 ? parts : [
    <MathJax key="text-full" className="text-paragraph">
      {splitAndProcessMath(nonBreakingContent).length > 0 
        ? splitAndProcessMath(nonBreakingContent) 
        : processFormattedText(nonBreakingContent)}
    </MathJax>
  ];
};

// Fonction pour diviser et traiter séparément le texte et les équations mathématiques
const splitAndProcessMath = (text: string): React.ReactNode[] => {
  if (!text) return [];
  
  const mathRegex = /(\$\$[\s\S]*?\$\$|\$[^\$]+?\$)/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;
  
  while ((match = mathRegex.exec(text)) !== null) {
    // Ajouter le texte avant l'équation
    if (match.index > lastIndex) {
      const textBefore = text.substring(lastIndex, match.index);
      parts.push(<React.Fragment key={`text-${lastIndex}`}>{processFormattedText(textBefore)}</React.Fragment>);
    }
    
    // Ajouter l'équation mathématique avec un style spécial
    // La classe `math-formula` permet d'appliquer des styles CSS spécifiques
    const formula = match[1];
    const isBlockFormula = formula.startsWith('$$') && formula.endsWith('$$');
    
    parts.push(
      <span 
        key={`math-${match.index}`} 
        className={isBlockFormula ? 'math-formula-block' : 'math-formula-inline'}
      >
        {formula}
      </span>
    );
    
    lastIndex = match.index + match[0].length;
  }
  
  // Ajouter le reste du texte après la dernière équation
  if (lastIndex < text.length) {
    const textAfter = text.substring(lastIndex);
    parts.push(<React.Fragment key={`text-${lastIndex}`}>{processFormattedText(textAfter)}</React.Fragment>);
  }
  
  return parts;
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
        const textBeforeTitle = processedText.substring(lastIndex, match.index);
        parts.push(<span className="inline">{textBeforeTitle}</span>);
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
    
    return <div className="normal-text">{parts}</div>;
  } else {
    // S'il n'y a pas de titres markdown, traiter les titres avec **
    return <div className="normal-text">{processBoldTitles(processedText)}</div>;
  }
};

// Sous-fonction pour traiter les titres avec ** (style gras)
const processBoldTitles = (text: string): React.ReactNode => {
  if (!text) return text;
  
  // Au lieu de traiter ligne par ligne, nous allons essayer un approche plus globale
  // pour empêcher la fragmentation des paragraphes
  
  // Remplacer les sauts de ligne double par un marqueur pour préserver les paragraphes
  const paragraphMarker = "||PARAGRAPH_BREAK||";
  let processedText = text.replace(/\n\n/g, paragraphMarker);
  
  // Traiter les titres en gras à l'intérieur du texte
  const boldRegex = /\*\*([^*]+)\*\*/g;
  processedText = processedText.replace(boldRegex, '<strong>$1</strong>');
  
  // Traiter les numérotations et les titres spéciaux
  const numberedTitleRegex = /^(\d+\.\s*)(\*\*([^*]+)\*\*)(\s*:)?(.*)$/gm;
  processedText = processedText.replace(numberedTitleRegex, '$1<strong>$3</strong>$4$5');
  
  // Diviser en paragraphes et créer les éléments JSX
  const paragraphs = processedText.split(paragraphMarker);
  
  return (
    <div className="text-content">
      {paragraphs.map((paragraph, index) => {
        // Vérifier si le paragraphe contient du HTML (des balises <strong>)
        if (paragraph.includes("<strong>")) {
          // Créer un paragraphe avec dangerouslySetInnerHTML
          return (
            <p key={`p-${index}`} 
               className="paragraph mb-2" 
               dangerouslySetInnerHTML={{ __html: paragraph }} />
          );
        } else {
          // Paragraphe simple sans formatage
          return (
            <p key={`p-${index}`} className="paragraph mb-2">
              {paragraph}
            </p>
          );
        }
      })}
    </div>
  );
};

/**
 * Composant avancé pour l'affichage de texte avec support des formules mathématiques et coloration syntaxique
 */
const MathJaxRenderer: React.FC<TextContentProps> = ({ content, className = '' }) => {
  // Référence pour le rafraîchissement de MathJax
  const mathJaxRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    // Initialiser highlight.js sur les éléments de code déjà dans le DOM
    hljs.configure({ languages: [] });
    document.querySelectorAll('pre code:not(.hljs)').forEach((block) => {
      hljs.highlightElement(block as HTMLElement);
    });
    
    // Force MathJax to reprocess when content changes
    const timer = setTimeout(() => {
      if (window.MathJax && mathJaxRef.current) {
        window.MathJax.typesetPromise([mathJaxRef.current]).catch((err: any) => 
          console.error('MathJax typesetting failed:', err)
        );
      }
    }, 100);
    
    return () => clearTimeout(timer);
  }, [content]);

  if (!content) {
    return null;
  }

  // Prétraiter le contenu pour assurer une bonne compatibilité avec MathJax
  const preprocessedContent = formatMathContent(sanitizeMathInput(content));

  return (
    <div className={`math-renderer ${className}`} ref={mathJaxRef}>
      <MathJaxContext config={mathJaxConfig}>
        <div className="whitespace-pre-wrap">
          {processContent(preprocessedContent)}
        </div>
      </MathJaxContext>
    </div>
  );
};

export default MathJaxRenderer;
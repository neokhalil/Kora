import React, { useEffect } from 'react';
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

  // Expression régulière pour capturer les blocs de code avec optionnellement un langage spécifié
  const codeBlockRegex = /```(\w*)\n([\s\S]*?)```/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;

  // Parcourir tous les blocs de code
  while ((match = codeBlockRegex.exec(preprocessedContent)) !== null) {
    // Traiter le texte avant le bloc de code
    if (match.index > lastIndex) {
      const textPart = preprocessedContent.substring(lastIndex, match.index);
      // Détection des équations $...$ et $$...$$
      const mathParts = splitAndProcessMath(textPart);
      parts.push(
        <MathJax key={`text-${lastIndex}`}>
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
  if (lastIndex < preprocessedContent.length) {
    const textPart = preprocessedContent.substring(lastIndex);
    // Détection des équations $...$ et $$...$$
    const mathParts = splitAndProcessMath(textPart);
    parts.push(
      <MathJax key={`text-${lastIndex}`}>
        {mathParts.length > 0 ? mathParts : processFormattedText(textPart)}
      </MathJax>
    );
  }

  return parts.length > 0 ? parts : [
    <MathJax key="text-full">
      {splitAndProcessMath(preprocessedContent).length > 0 
        ? splitAndProcessMath(preprocessedContent) 
        : processFormattedText(preprocessedContent)}
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
  
  // Nous allons traiter le texte ligne par ligne pour une meilleure précision
  const lines = text.split('\n');
  const processedLines: React.ReactNode[] = [];
  
  // Parcourir chaque ligne
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Vérifier si la ligne contient un format de titre numéroté avec **
    // Format 1: "1. **Titre**:" ou "1. **Titre** :"
    const numberedTitleRegex = /^(\d+\.\s*)(\*\*([^*]+)\*\*)(\s*:)?(.*)$/;
    const numberedMatch = line.match(numberedTitleRegex);
    
    if (numberedMatch) {
      // C'est un titre numéroté avec **
      const number = numberedMatch[1];           // ex: "1. "
      const titleText = numberedMatch[3];        // le texte du titre sans les **
      const colon = numberedMatch[4] || '';      // les deux points (optionnels)
      const restOfLine = numberedMatch[5] || ''; // le reste de la ligne après le titre
      
      processedLines.push(
        <div key={`line-${i}`} className="flex items-baseline">
          <span>{number}</span>
          <strong className="font-bold">{titleText}</strong>
          <span>{colon}{restOfLine}</span>
        </div>
      );
    } else {
      // Vérifier d'autres formats de titres avec **
      // Format 2: "**Titre**:" ou "**Titre** :"
      const simpleTitleRegex = /^(\*\*([^*]+)\*\*)(\s*:)?(.*)$/;
      const simpleMatch = line.match(simpleTitleRegex);
      
      if (simpleMatch) {
        // C'est un titre simple avec **
        const titleText = simpleMatch[2];        // le texte du titre sans les **
        const colon = simpleMatch[3] || '';      // les deux points (optionnels)
        const restOfLine = simpleMatch[4] || ''; // le reste de la ligne après le titre
        
        processedLines.push(
          <div key={`line-${i}`}>
            <strong className="font-bold">{titleText}</strong>
            <span>{colon}{restOfLine}</span>
          </div>
        );
      } else {
        // Vérifier si la ligne contient des ** à l'intérieur (pas en début de ligne)
        const inlineBoldRegex = /\*\*([^*]+)\*\*/g;
        let inlineMatch;
        let inlineParts: React.ReactNode[] = [];
        let inlineLastIndex = 0;
        
        // Rechercher toutes les occurrences de texte en gras dans la ligne
        while ((inlineMatch = inlineBoldRegex.exec(line)) !== null) {
          // Ajouter le texte avant le gras
          if (inlineMatch.index > inlineLastIndex) {
            inlineParts.push(line.substring(inlineLastIndex, inlineMatch.index));
          }
          
          // Ajouter le texte en gras
          inlineParts.push(
            <strong key={`inline-${inlineMatch.index}`} className="font-bold">
              {inlineMatch[1]}
            </strong>
          );
          
          inlineLastIndex = inlineMatch.index + inlineMatch[0].length;
        }
        
        // Ajouter le reste de la ligne
        if (inlineLastIndex < line.length) {
          inlineParts.push(line.substring(inlineLastIndex));
        }
        
        // S'il y avait du texte en gras, utiliser les parts; sinon, utiliser la ligne entière
        processedLines.push(
          inlineParts.length > 0 
            ? <div key={`line-${i}`}>{inlineParts}</div>
            : <div key={`line-${i}`}>{line}</div>
        );
      }
    }
  }
  
  return processedLines;
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

  // Prétraiter le contenu pour assurer une bonne compatibilité avec MathJax
  const preprocessedContent = formatMathContent(sanitizeMathInput(content));

  return (
    <div className={`math-renderer ${className}`}>
      <MathJaxContext config={mathJaxConfig}>
        <div className="whitespace-pre-wrap">
          {processContent(preprocessedContent)}
        </div>
      </MathJaxContext>
    </div>
  );
};

export default MathJaxRenderer;
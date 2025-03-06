import React, { useEffect, useRef, useState } from 'react';
import { MathJax } from 'better-react-mathjax';
import hljs from 'highlight.js';
import 'highlight.js/styles/atom-one-light.css';

interface MathContentProps {
  content: string;
  className?: string;
}

/**
 * Composant pour rendre du contenu mathématique avec MathJax, 
 * optimisé pour éviter les tremblements tout en permettant
 * une animation de texte fluide et naturelle.
 */
const MathJaxRenderer: React.FC<MathContentProps> = ({ content, className = "" }) => {
  // Référence pour obtenir les dimensions du conteneur
  const containerRef = useRef<HTMLDivElement>(null);
  // État pour stocker les dimensions stables
  const [stableHeight, setStableHeight] = useState<number | null>(null);
  
  // Formater le contenu pour remplacer les retours à la ligne par des balises <br />
  const formattedContent = content.replace(/\n/g, '<br />');
  
  // Prétraiter les titres avec ### ou #### avant toute autre transformation
  let headingsPreprocessed = formattedContent;
  
  // Remplacer d'abord les #### (quatre dièses)
  headingsPreprocessed = headingsPreprocessed.replace(
    /(^|<br \/>)####\s+(.*?)(?=<br|$)/g, 
    '$1<h4 class="section-heading">$2</h4>'
  );
  
  // Remplacer ensuite les titres avec ### (trois dièses)
  headingsPreprocessed = headingsPreprocessed.replace(
    /(^|<br \/>)###\s+(.*?)(?=<br|$)/g, 
    '$1<h3 class="section-heading">$2</h3>'
  );
  
  // Deuxième passe pour les cas où les titres sont au milieu du texte
  headingsPreprocessed = headingsPreprocessed.replace(
    /(?<=\s)####\s+(.*?)(?=<br|$)/g,
    '<h4 class="section-heading">$1</h4>'
  );
  
  headingsPreprocessed = headingsPreprocessed.replace(
    /(?<=\s)###\s+(.*?)(?=<br|$)/g,
    '<h3 class="section-heading">$1</h3>'
  );
  
  // Rechercher et remplacer les titres spéciaux comme "Résolution Générale"
  headingsPreprocessed = headingsPreprocessed.replace(
    /(^|<br \/>)(Résolution Générale|Méthode|Solution|Approche|Démarche)\s*:?(?=<br|$)/g,
    '$1<h3 class="section-heading">$2</h3>'
  );
  
  // Prétraiter les blocs de code avec triple backtick
  let codeBlocksProcessed = headingsPreprocessed;
  
  // Remplacer les blocs de code encadrés par des triples backticks avec ou sans spécification du langage
  // Gestion de la syntaxe ```langage (format standard)
  codeBlocksProcessed = codeBlocksProcessed.replace(
    /```([\w]*)\s*\n([\s\S]*?)```/g, 
    (match, language, code) => {
      // Échapper les caractères HTML spéciaux dans le code
      const escapedCode = code
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
      
      // Déterminer la classe CSS basée sur le langage
      const langClass = language ? 'language-' + language.toLowerCase() : '';
      
      // Utiliser highlight.js pour la coloration syntaxique si un langage est spécifié
      let highlightedCode = escapedCode;
      if (language) {
        try {
          highlightedCode = hljs.highlight(code, { language: language.toLowerCase() }).value;
        } catch (e) {
          // Si le langage n'est pas supporté, utiliser le code sans coloration
          console.warn(`Language '${language}' not supported by highlight.js`);
        }
      }
      
      // Formatter avec la classe appropriée pour le langage
      return `<pre class="code-block ${langClass}"><code class="${langClass}">${language ? highlightedCode : escapedCode}</code></pre>`;
    }
  );
  
  // Gestion spéciale pour OpenAI qui parfois utilise des quotes pour le code
  codeBlocksProcessed = codeBlocksProcessed.replace(
    /'''([\w]*)\s*\n([\s\S]*?)'''/g, 
    (match, language, code) => {
      // Échapper les caractères HTML spéciaux dans le code
      const escapedCode = code
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
      
      // Déterminer la classe CSS basée sur le langage
      const langClass = language ? 'language-' + language.toLowerCase() : '';
      
      // Utiliser highlight.js pour la coloration syntaxique si un langage est spécifié
      let highlightedCode = escapedCode;
      if (language) {
        try {
          highlightedCode = hljs.highlight(code, { language: language.toLowerCase() }).value;
        } catch (e) {
          console.warn(`Language '${language}' not supported by highlight.js`);
        }
      }
      
      // Formatter avec la classe appropriée pour le langage
      return `<pre class="code-block ${langClass}"><code class="${langClass}">${language ? highlightedCode : escapedCode}</code></pre>`;
    }
  );
  
  // Supporte également la syntaxe parfois générée par OpenAI: `python
  codeBlocksProcessed = codeBlocksProcessed.replace(
    /``([\w]*)\s*\n([\s\S]*?)``/g, 
    (match, language, code) => {
      // Échapper les caractères HTML spéciaux dans le code
      const escapedCode = code
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
      
      // Déterminer la classe CSS basée sur le langage
      const langClass = language ? 'language-' + language.toLowerCase() : '';
      
      // Utiliser highlight.js pour la coloration syntaxique si un langage est spécifié
      let highlightedCode = escapedCode;
      if (language) {
        try {
          highlightedCode = hljs.highlight(code, { language: language.toLowerCase() }).value;
        } catch (e) {
          console.warn(`Language '${language}' not supported by highlight.js`);
        }
      }
      
      // Formatter avec la classe appropriée pour le langage
      return `<pre class="code-block ${langClass}"><code class="${langClass}">${language ? highlightedCode : escapedCode}</code></pre>`;
    }
  );
  
  // Remplacer les morceaux de code inline avec backtick simple
  // Modification pour ne remplacer que quand c'est vraiment du code
  codeBlocksProcessed = codeBlocksProcessed.replace(
    /`([^`\n]+)`/g,
    (match, content) => {
      // Si le contenu contient des symboles de programmation ou mots-clés, c'est probablement du code
      if (content.match(/[\$\{\}\(\)\[\]<>;:=\+\-\*\/&|!%^~#@]/) || 
          content.match(/\b(function|class|var|let|const|if|else|for|while|return|import|export)\b/)) {
        return `<code class="inline-code">${content}</code>`;
      }
      // Sinon, c'est peut-être juste du texte accentué
      return `<span class="emphasized">${content}</span>`;
    }
  );

  // Traiter le formatage Markdown basique
  const markdownFormatted = codeBlocksProcessed
    // Gras - Gérer le cas avec ** (format Markdown)
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // Italique - Gérer le cas avec * (format Markdown)
    .replace(/\*([^\*]+)\*/g, '<em>$1</em>')
    // Soulignement - Gérer le cas avec __ (double underscore)
    .replace(/\_\_([^\_]+)\_\_/g, '<u>$1</u>')
    // Liste avec puces avec * ou -
    .replace(/^[\*\-]\s+(.*?)$/gm, '<li>$1</li>')
    // Barré avec ~~ (format Markdown)
    .replace(/\~\~(.*?)\~\~/g, '<s>$1</s>');
  
  // Améliorer les titres et les étapes numérotées pour une meilleure mise en page
  const enhancedContent = markdownFormatted
    // Améliorer les titres
    .replace(/^(Pour résoudre|Résolution|Résoudre)\s+(.*):$/gm, '<h3>$1 $2 :</h3>')
    // Améliorer la numérotation des étapes
    .replace(/(\d+)\.\s+(.*?):/g, '<strong>$1. $2 :</strong>')
    // Ne pas mettre les nombres en gras s'ils ne sont pas suivis de titres
    .replace(/^(\d+)\.\s+([^<]*[^:])/gm, '<span class="step-number">$1.</span> $2')
    // Assurer que chaque phrase numérotée est sur une ligne séparée
    .replace(/(\d+\.\s+[^.]+\.)\s+(\d+\.)/g, '$1<br /><br />$2')
    // Mise en forme des résultats intermédiaires
    .replace(/(Ce qui donne|On obtient|Ce qui nous donne|Ceci donne)\s*:/g, '<div class="result">$1 :</div>')
    // Mise en forme de la conclusion
    .replace(/(Donc|En conclusion|Ainsi|Par conséquent),\s*(la solution|le résultat|la réponse)\s*est\s*/g, 
      '<div class="conclusion">$1, $2 est </div>');

  // Observer les changements de hauteur et stabiliser
  useEffect(() => {
    // Si le contenu est vide, ne pas définir de hauteur minimale
    if (!content || content.length < 10) {
      setStableHeight(null);
      return;
    }

    // Timer pour laisser MathJax terminer le rendu initial
    const initialRenderTimer = setTimeout(() => {
      if (containerRef.current) {
        const currentHeight = containerRef.current.offsetHeight;
        if (currentHeight > 0) {
          setStableHeight(currentHeight);
        }
      }
    }, 50); // Petit délai pour le rendu initial
    
    return () => clearTimeout(initialRenderTimer);
  }, [content]);
  
  // Effet pour appliquer la coloration syntaxique après le rendu
  useEffect(() => {
    // Timer pour appliquer highlight.js après que le rendu initial est fait
    const timer = setTimeout(() => {
      if (containerRef.current) {
        const codeBlocks = containerRef.current.querySelectorAll('pre code');
        codeBlocks.forEach((block) => {
          try {
            hljs.highlightElement(block as HTMLElement);
          } catch (e) {
            console.warn('Failed to highlight code block', e);
          }
        });
      }
    }, 100);
    
    return () => clearTimeout(timer);
  }, [enhancedContent]);

  return (
    <div 
      ref={containerRef}
      className={`math-content ${className}`}
      style={{ 
        position: 'relative', 
        minHeight: stableHeight ? `${stableHeight}px` : '20px',
        containIntrinsicSize: stableHeight ? `auto ${stableHeight}px` : 'auto auto'
      }}
    >
      <MathJax>
        <div 
          dangerouslySetInnerHTML={{ __html: enhancedContent }}
          className="math-content-inner"
          style={{ contain: 'content' }}
        />
      </MathJax>
    </div>
  );
};

export default MathJaxRenderer;
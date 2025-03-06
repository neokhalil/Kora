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
  // Nous allons d'abord extraire et stocker tous les blocs de code pour éviter 
  // que le traitement des backticks simples n'interfère avec eux
  const codeBlocks: {placeholder: string, content: string}[] = [];
  let codeBlockId = 0;
  
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
      const blockId = `code-block-${codeBlockId++}`;
      
      // Stocker le bloc de code pour traitement ultérieur
      codeBlocks.push({
        placeholder: blockId,
        content: `<pre class="code-block ${langClass}"><code class="${langClass}" data-lang="${language || ''}">${escapedCode}</code></pre>`
      });
      
      // Retourner un placeholder unique pour ce bloc de code
      return blockId;
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
      const blockId = `code-block-${codeBlockId++}`;
      
      // Stocker le bloc de code pour traitement ultérieur
      codeBlocks.push({
        placeholder: blockId,
        content: `<pre class="code-block ${langClass}"><code class="${langClass}" data-lang="${language || ''}">${escapedCode}</code></pre>`
      });
      
      // Retourner un placeholder unique pour ce bloc de code
      return blockId;
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
      const blockId = `code-block-${codeBlockId++}`;
      
      // Stocker le bloc de code pour traitement ultérieur
      codeBlocks.push({
        placeholder: blockId,
        content: `<pre class="code-block ${langClass}"><code class="${langClass}" data-lang="${language || ''}">${escapedCode}</code></pre>`
      });
      
      // Retourner un placeholder unique pour ce bloc de code
      return blockId;
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
  let enhancedContent = markdownFormatted
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
      
  // Réinsérer les blocs de code avec coloration syntaxique
  codeBlocks.forEach(block => {
    enhancedContent = enhancedContent.replace(block.placeholder, block.content);
  });

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
  
  // Effet pour appliquer la coloration syntaxique et ajouter les étiquettes de langage après le rendu
  useEffect(() => {
    // Timer pour appliquer highlight.js après que le rendu initial est fait
    const timer = setTimeout(() => {
      if (containerRef.current) {
        const codeBlocks = containerRef.current.querySelectorAll('pre code');
        codeBlocks.forEach((block) => {
          try {
            // Appliquer highlight.js
            hljs.highlightElement(block as HTMLElement);
            
            // Ajouter l'étiquette de langage si elle existe
            const lang = block.getAttribute('data-lang');
            if (lang) {
              const pre = block.parentElement;
              if (pre && !pre.querySelector('.language-label')) {
                const label = document.createElement('div');
                label.className = 'language-label';
                label.textContent = getLangDisplayName(lang);
                pre.appendChild(label);
              }
            }
          } catch (e) {
            console.warn('Failed to highlight code block', e);
          }
        });
      }
    }, 100);
    
    return () => clearTimeout(timer);
  }, [enhancedContent]);
  
  // Fonction pour obtenir le nom d'affichage du langage
  const getLangDisplayName = (lang: string): string => {
    const langMap: Record<string, string> = {
      'python': 'Python',
      'py': 'Python',
      'javascript': 'JavaScript',
      'js': 'JavaScript',
      'typescript': 'TypeScript',
      'ts': 'TypeScript',
      'java': 'Java',
      'cpp': 'C++',
      'c': 'C',
      'csharp': 'C#',
      'cs': 'C#',
      'php': 'PHP',
      'ruby': 'Ruby',
      'go': 'Go',
      'rust': 'Rust',
      'swift': 'Swift',
      'kotlin': 'Kotlin',
      'scala': 'Scala',
      'html': 'HTML',
      'css': 'CSS',
      'sql': 'SQL',
      'bash': 'Bash',
      'sh': 'Shell',
      'xml': 'XML',
      'json': 'JSON',
      'yaml': 'YAML',
      'markdown': 'Markdown',
      'md': 'Markdown',
    };
    
    return langMap[lang.toLowerCase()] || lang.charAt(0).toUpperCase() + lang.slice(1);
  };

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
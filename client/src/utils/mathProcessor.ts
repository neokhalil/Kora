/**
 * Utilitaires pour le traitement des expressions mathématiques
 * Version refactorisée qui combine toutes les fonctionnalités des fichiers mathJaxFormatter.ts
 * et mathProcessor.ts pour éliminer la redondance
 */

export interface MathSegment {
  type: 'text' | 'inline-math' | 'block-math' | 'code';
  content: string;
}

/**
 * Détecte si un texte contient des formules mathématiques
 */
export function containsMathFormulas(text: string): boolean {
  if (!text) return false;
  const pattern = /(\$|\\\(|\\\[|\\begin\{)/;
  return pattern.test(text);
}

/**
 * Trouve toutes les délimiteurs d'une formule mathématique
 * Recherche $...$, \(...\), \[...\], et $$...$$
 */
export function findFormulaDelimiters(text: string): { inline: RegExpMatchArray[], block: RegExpMatchArray[] } {
  // Délimiteurs pour les formules en ligne
  const inlineDelimiters = [
    // $...$
    Array.from(text.matchAll(/(?<!\$)\$(?!\$)(.+?)(?<!\$)\$(?!\$)/g) || []),
    // \(...\)
    Array.from(text.matchAll(/\\\((.+?)\\\)/g) || [])
  ].flat();

  // Délimiteurs pour les formules en bloc
  const blockDelimiters = [
    // $$...$$
    Array.from(text.matchAll(/\$\$([\s\S]+?)\$\$/g) || []),
    // \[...\]
    Array.from(text.matchAll(/\\\[([\s\S]+?)\\\]/g) || [])
  ].flat();

  return { inline: inlineDelimiters, block: blockDelimiters };
}

/**
 * Divise un texte en segments de texte normal et de formules mathématiques
 */
export function segmentTextWithMath(text: string): MathSegment[] {
  const segments: MathSegment[] = [];
  let currentText = text;
  
  // Trouver tous les blocs de code
  const codeBlocks: string[] = [];
  currentText = currentText.replace(/```[\s\S]*?```/g, match => {
    codeBlocks.push(match);
    return `__CODE_BLOCK_${codeBlocks.length - 1}__`;
  });

  // Trouver toutes les formules mathématiques
  const { inline, block } = findFormulaDelimiters(currentText);
  
  // Créer un tableau de marqueurs pour toutes les formules
  type FormulaMarker = { start: number; end: number; formula: string; isBlock: boolean };
  const markers: FormulaMarker[] = [
    ...inline.map(match => ({
      start: match.index!,
      end: match.index! + match[0].length,
      formula: match[1],
      isBlock: false
    })),
    ...block.map(match => ({
      start: match.index!,
      end: match.index! + match[0].length,
      formula: match[1],
      isBlock: true
    }))
  ];
  
  // Trier les marqueurs par position de début
  markers.sort((a, b) => a.start - b.start);
  
  // Si aucune formule n'est trouvée, retourner le texte complet
  if (markers.length === 0) {
    // Restaurer les blocs de code
    if (codeBlocks.length > 0) {
      currentText = currentText.replace(/__CODE_BLOCK_(\d+)__/g, (_, index) => {
        return codeBlocks[parseInt(index)];
      });
    }
    
    // Créer des segments pour les blocs de code dans le texte
    let lastIndex = 0;
    const codeRegex = /```[\s\S]*?```/g;
    let match: RegExpExecArray | null;
    const finalSegments: MathSegment[] = [];
    
    while ((match = codeRegex.exec(currentText)) !== null) {
      // Ajouter le texte avant le bloc de code
      if (match.index > lastIndex) {
        finalSegments.push({
          type: 'text',
          content: currentText.substring(lastIndex, match.index)
        });
      }
      
      // Ajouter le bloc de code
      finalSegments.push({
        type: 'code',
        content: match[0]
      });
      
      lastIndex = match.index + match[0].length;
    }
    
    // Ajouter le reste du texte
    if (lastIndex < currentText.length) {
      finalSegments.push({
        type: 'text',
        content: currentText.substring(lastIndex)
      });
    }
    
    return finalSegments.length > 0 ? finalSegments : [{ type: 'text', content: currentText }];
  }
  
  // Construire les segments alternant entre texte et formules
  let lastEnd = 0;
  markers.forEach(marker => {
    // Ajouter le texte avant la formule si nécessaire
    if (marker.start > lastEnd) {
      segments.push({
        type: 'text',
        content: currentText.substring(lastEnd, marker.start)
      });
    }
    
    // Ajouter la formule
    segments.push({
      type: marker.isBlock ? 'block-math' : 'inline-math',
      content: marker.formula
    });
    
    lastEnd = marker.end;
  });
  
  // Ajouter le texte restant après la dernière formule
  if (lastEnd < currentText.length) {
    segments.push({
      type: 'text',
      content: currentText.substring(lastEnd)
    });
  }
  
  // Restaurer les blocs de code dans les segments de texte
  const finalSegments: MathSegment[] = [];
  
  segments.forEach(segment => {
    if (segment.type === 'text' && segment.content.includes('__CODE_BLOCK_')) {
      let textWithCodeBlocks = segment.content;
      let lastTextIndex = 0;
      const codeBlockRegex = /__CODE_BLOCK_(\d+)__/g;
      let match: RegExpExecArray | null;
      
      while ((match = codeBlockRegex.exec(textWithCodeBlocks)) !== null) {
        // Ajouter le texte avant le bloc de code
        if (match.index > lastTextIndex) {
          finalSegments.push({
            type: 'text',
            content: textWithCodeBlocks.substring(lastTextIndex, match.index)
          });
        }
        
        // Ajouter le bloc de code
        const codeIndex = parseInt(match[1]);
        finalSegments.push({
          type: 'code',
          content: codeBlocks[codeIndex]
        });
        
        lastTextIndex = match.index + match[0].length;
      }
      
      // Ajouter le reste du texte
      if (lastTextIndex < textWithCodeBlocks.length) {
        finalSegments.push({
          type: 'text',
          content: textWithCodeBlocks.substring(lastTextIndex)
        });
      }
    } else {
      finalSegments.push(segment);
    }
  });
  
  return finalSegments;
}

/**
 * Nettoie et prépare une formule LaTeX pour l'affichage avec KaTeX
 */
export function sanitizeFormula(formula: string): string {
  if (!formula) return '';
  
  // Correction des erreurs courantes
  return formula
    // Corriger les fractions sans accolades
    .replace(/\\frac([a-zA-Z0-9])([a-zA-Z0-9])/g, '\\frac{$1}{$2}')
    
    // Corriger les racines carrées sans accolades
    .replace(/\\sqrt([a-zA-Z0-9])/g, '\\sqrt{$1}')
    
    // Corriger les indices et exposants sans accolades
    .replace(/\_([a-zA-Z0-9])/g, '_{$1}')
    .replace(/\^([a-zA-Z0-9])/g, '^{$1}')
    
    // Nettoyer les espaces superflus
    .trim();
}

/**
 * Convertit un bloc de code Markdown en HTML avec coloration syntaxique
 */
export function parseCodeBlock(codeBlock: string): { language: string, code: string } {
  // Format: ```language\ncode```
  const match = codeBlock.match(/```(\w*)\n([\s\S]*?)```/);
  
  if (!match) {
    return { language: '', code: codeBlock.replace(/```/g, '') };
  }
  
  return {
    language: match[1] || 'plaintext',
    code: match[2]
  };
}

/**
 * Détermine si un texte est une formule mathématique complète
 * Utile pour éviter de traiter des fragments de formules
 */
export function isCompleteMathFormula(text: string): boolean {
  // Vérifier l'équilibre des délimiteurs
  const openDollar = (text.match(/\$/g) || []).length;
  const openParen = (text.match(/\\\(/g) || []).length;
  const closeParen = (text.match(/\\\)/g) || []).length;
  const openBracket = (text.match(/\\\[/g) || []).length;
  const closeBracket = (text.match(/\\\]/g) || []).length;
  
  return (
    (openDollar % 2 === 0) && 
    (openParen === closeParen) && 
    (openBracket === closeBracket)
  );
}

/**
 * Corrige les délimiteurs mathématiques pour garantir une bonne reconnaissance par MathJax ou KaTeX
 * 
 * Consolidé depuis l'ancien mathJaxFormatter.ts
 */
export function formatMathContent(content: string): string {
  if (!content) return content;
  
  // Protéger les blocs de code
  const codeBlocks: string[] = [];
  let processedContent = content.replace(/```[\s\S]*?```/g, (match) => {
    codeBlocks.push(match);
    return `__CODE_BLOCK_${codeBlocks.length - 1}__`;
  });
  
  // 1. Correction - supprimer tous les "\\displaystyle 1" qui peuvent causer des problèmes
  processedContent = processedContent.replace(/\\displaystyle\s+1/g, '');
  
  // 2. Remplacer les délimiteurs LaTeX alternatifs par leur équivalent standard
  processedContent = processedContent
    .replace(/\\\[([\s\S]*?)\\\]/g, '$$$$1$$')
    .replace(/\\\(([\s\S]*?)\\\)/g, '$$$1$');
  
  // 3. Correction des commandes LaTeX courantes
  processedContent = processedContent
    .replace(/\\frac([a-zA-Z0-9])([a-zA-Z0-9])/g, '\\frac{$1}{$2}')
    .replace(/\\sqrt([a-zA-Z0-9])/g, '\\sqrt{$1}')
    .replace(/\_([a-zA-Z0-9])/g, '_{$1}')
    .replace(/\^([a-zA-Z0-9])/g, '^{$1}');
  
  // 4. Correction des symboles qui peuvent apparaître en double
  // Transformer les séquences "∆∆" en "∆"
  processedContent = processedContent.replace(/∆\s*∆/g, '∆');
  // Similairement pour "Δ > 0Δ > 0" -> "Δ > 0"
  processedContent = processedContent.replace(/([Δ∆]\s*[<>=]\s*\d+)\s*([Δ∆]\s*[<>=]\s*\d+)/g, '$1');
  // Corriger "Δ = 0Δ = 0" -> "Δ = 0"
  processedContent = processedContent.replace(/([Δ∆]\s*=\s*\d+)\s*([Δ∆]\s*=\s*\d+)/g, '$1');
    
  // 5. Restaurer les blocs de code
  processedContent = processedContent.replace(/__CODE_BLOCK_(\d+)__/g, (match, index) => {
    return codeBlocks[parseInt(index)];
  });
  
  // 6. Corriger les entrées "$\displaystyle 1$" qui apparaissent en texte brut
  processedContent = processedContent.replace(/\$\\displaystyle 1\$/g, '');
  
  // 7. Corriger les doublons de lignes qui apparaissent parfois
  const lines = processedContent.split('\n');
  const uniqueLines: string[] = [];
  let prevLine = '';
  
  for (const line of lines) {
    if (line.trim() !== prevLine.trim()) {
      uniqueLines.push(line);
      prevLine = line;
    }
  }
  
  return uniqueLines.join('\n');
}
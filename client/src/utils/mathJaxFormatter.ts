/**
 * Utilitaire simplifié pour le traitement des formules mathématiques
 */

/**
 * Corrige les délimiteurs mathématiques pour garantir une bonne reconnaissance par MathJax
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
  
  // 2. Remplacer les délimiteurs LaTeX alternatifs par leur équivalent MathJax standard
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

/**
 * Détecte si un texte contient des formules mathématiques
 */
export function containsMathFormulas(text: string): boolean {
  if (!text) return false;
  return /\$|\\\(|\\\[|\\begin\{/g.test(text);
}

/**
 * Nettoie et corrige les problèmes de syntaxe dans les formules mathématiques
 */
export function sanitizeMathInput(input: string): string {
  if (!input) return input;
  
  // Version simplifiée qui corrige uniquement les problèmes essentiels
  return input
    // Corriger les commandes mathématiques courantes
    .replace(/\\frac([a-zA-Z0-9])([a-zA-Z0-9])/g, '\\frac{$1}{$2}')
    .replace(/\\sqrt([a-zA-Z0-9])/g, '\\sqrt{$1}');
}
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
  
  // 1. Remplacer les délimiteurs LaTeX alternatifs par leur équivalent MathJax
  processedContent = processedContent
    .replace(/\\\[([\s\S]*?)\\\]/g, '$$$$1$$')
    .replace(/\\\(([\s\S]*?)\\\)/g, '$$$1$');
  
  // 2. Correction des commandes LaTeX courantes
  processedContent = processedContent
    .replace(/\\frac([a-zA-Z0-9])([a-zA-Z0-9])/g, '\\frac{$1}{$2}')
    .replace(/\\sqrt([a-zA-Z0-9])/g, '\\sqrt{$1}')
    .replace(/\_([a-zA-Z0-9])/g, '_{$1}')
    .replace(/\^([a-zA-Z0-9])/g, '^{$1}');
  
  // 3. Balises spécifiques pour résoudre les problèmes d'affichage
  processedContent = processedContent
    // Ajouter displaystyle pour les équations en bloc
    .replace(/\$\$(?!\s*\\displaystyle)/g, '$$\\displaystyle ');
    
  // 4. Restaurer les blocs de code
  processedContent = processedContent.replace(/__CODE_BLOCK_(\d+)__/g, (match, index) => {
    return codeBlocks[parseInt(index)];
  });
    
  return processedContent;
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
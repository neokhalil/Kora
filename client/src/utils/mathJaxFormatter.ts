/**
 * Utilitaire pour formater correctement les notations mathématiques
 */

/**
 * Formate les commandes LaTeX pour une meilleure compatibilité
 */
export function formatMathContent(content: string): string {
  if (!content) return content;
  
  // Isoler les blocs de code pour éviter de modifier le contenu à l'intérieur
  const codeBlocks: string[] = [];
  let codeProtectedContent = content.replace(/```[\s\S]*?```/g, (match) => {
    codeBlocks.push(match);
    return `__CODE_BLOCK_${codeBlocks.length - 1}__`;
  });
  
  // Convertir les notations mathématiques alternatives en standard MathJax
  let processedContent = codeProtectedContent
    // Convertir \[ ... \] en $$...$$
    .replace(/\\\[([\s\S]*?)\\\]/g, '$$$$1$$')
    // Convertir \( ... \) en $...$
    .replace(/\\\(([\s\S]*?)\\\)/g, '$$$1$');
  
  // Corrections pour les commandes LaTeX mal formatées
  processedContent = processedContent
    // Corriger les indices pour les logarithmes
    .replace(/\\log_([0-9]+)/g, '\\log_{$1}')
    .replace(/\\log\_([0-9]+)/g, '\\log_{$1}')
    // Ajouter des accolades pour les fractions
    .replace(/\\frac([a-zA-Z0-9])([a-zA-Z0-9])/g, '\\frac{$1}{$2}')
    // Ajouter des accolades pour les racines carrées
    .replace(/\\sqrt([a-zA-Z0-9])/g, '\\sqrt{$1}')
    // Améliorer les indices et exposants
    .replace(/\_([a-zA-Z0-9])/g, '_{$1}')
    .replace(/\^([a-zA-Z0-9])/g, '^{$1}');
    
  // Préserver les espaces dans les formules mathématiques
  processedContent = processedContent
    .replace(/([^\s\\])\$\$/g, '$1 $$')
    .replace(/\$\$([^\s\\])/g, '$$ $1')
    .replace(/([^\s\\])\$/g, '$1 $')
    .replace(/\$([^\s\\])/g, '$ $1');
    
  // Nettoyer les espaces superflus
  processedContent = processedContent
    .replace(/\$ /g, '$')
    .replace(/ \$/g, '$')
    .replace(/\$\$ /g, '$$')
    .replace(/ \$\$/g, '$$');
    
  // Améliorer le rendu des équations en bloc en ajoutant \displaystyle
  processedContent = processedContent
    .replace(/\$\$(?!\s*\\displaystyle)/g, '$$\\displaystyle ');
    
  // Restaurer les blocs de code
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
  
  // Détecter les différentes notations mathématiques
  return /\$|\\\(|\\\[|\\begin\{/g.test(text);
}

/**
 * Nettoie les entrées mathématiques pour éviter les erreurs de rendu
 */
export function sanitizeMathInput(input: string): string {
  if (!input) return input;
  
  let sanitized = input;
  
  // Corriger les commandes mathématiques mal formatées
  sanitized = sanitized
    .replace(/\\frac([a-zA-Z0-9])([a-zA-Z0-9])/g, '\\frac{$1}{$2}')
    .replace(/\\sqrt([a-zA-Z0-9])/g, '\\sqrt{$1}')
    .replace(/\_([a-zA-Z0-9])/g, '_{$1}')
    .replace(/\^([a-zA-Z0-9])/g, '^{$1}');
  
  // Corriger des problèmes spécifiques avec les délimiteurs
  const openInline = (sanitized.match(/\$/g) || []).length;
  if (openInline % 2 !== 0) {
    // Si nombre impair de $ - ajouter un $ à la fin pour fermer
    sanitized += ' $';
  }
  
  // Assurer que les délimiteurs sont bien séparés du texte
  sanitized = sanitized
    .replace(/([^\s\\])\$/g, '$1 $')
    .replace(/\$([^\s\\])/g, '$ $1');
  
  return sanitized;
}
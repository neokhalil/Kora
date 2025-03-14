/**
 * Utilitaire pour formater correctement les notations mathématiques dans le texte
 * Gère les cas spéciaux pour une meilleure compatibilité avec MathJax
 */

/**
 * Formate correctement le contenu mathématique pour MathJax
 * - Gère les caractères d'échappement
 * - Assure une compatibilité avec les différentes notations mathématiques
 */
export function formatMathContent(content: string): string {
  if (!content) return content;

  // Remplacer les notations problématiques \[ et \] si elles ne sont pas correctement interprétées
  // Note: Cela convertit le format \[ ... \] en $$ ... $$, qui est plus largement compatible
  let formattedContent = content.replace(/\\\[([\s\S]*?)\\\]/g, '$$$$1$$');
  
  // Remplacer également les notations \( et \) pour les formules en ligne
  formattedContent = formattedContent.replace(/\\\(([\s\S]*?)\\\)/g, '$$$1$');
  
  // Traiter les commandes spéciales \log_base
  formattedContent = formattedContent.replace(/\\log_([a-zA-Z0-9]+)\(([^)]+)\)/g, '\\log_{$1}($2)');
  
  return formattedContent;
}

/**
 * Détecte si un texte contient des formules mathématiques
 */
export function containsMathFormulas(text: string): boolean {
  if (!text) return false;
  
  // Motifs courants pour les formules mathématiques
  const patterns = [
    /\$[^$]+\$/,             // Format $...$ (inline)
    /\$\$[^$]+\$\$/,         // Format $$...$$ (bloc)
    /\\\([^)]+\\\)/,         // Format \(...\) (inline)
    /\\\[[^]]+\\\]/,         // Format \[...\] (bloc)
    /\\begin\{[^}]+\}.*?\\end\{[^}]+\}/s, // Format environnements LaTeX
  ];
  
  return patterns.some(pattern => pattern.test(text));
}

/**
 * Nettoie les entrées mathématiques pour éviter les erreurs de rendu
 */
export function sanitizeMathInput(input: string): string {
  if (!input) return input;
  
  let sanitized = input;
  
  // Supprimer les espaces superflus dans les délimiteurs de mathématiques
  sanitized = sanitized.replace(/\$ /g, '$').replace(/ \$/g, '$');
  sanitized = sanitized.replace(/\$\$ /g, '$$').replace(/ \$\$/g, '$$');
  
  // Corriger les commandes LaTeX couramment mal écrites
  sanitized = sanitized.replace(/\\log_([0-9]+)/g, '\\log_{$1}');
  sanitized = sanitized.replace(/\\frac([a-zA-Z0-9])([a-zA-Z0-9])/g, '\\frac{$1}{$2}');
  
  return sanitized;
}
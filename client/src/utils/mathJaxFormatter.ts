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

  // Étape 1: Convertir les notations alternatives vers la notation standard MathJax
  // Convertir \[ ... \] en $$...$$
  let processedContent = content.replace(/\\\[([\s\S]*?)\\\]/g, '$$$$1$$');
  
  // Convertir \( ... \) en $...$
  processedContent = processedContent.replace(/\\\(([\s\S]*?)\\\)/g, '$$$1$');
  
  // Corriger les commandes LaTeX mal écrites
  processedContent = processedContent.replace(/\\log_([0-9]+)/g, '\\log_{$1}');
  processedContent = processedContent.replace(/\\log\_([0-9]+)/g, '\\log_{$1}');
  processedContent = processedContent.replace(/\\frac([a-zA-Z0-9])([a-zA-Z0-9])/g, '\\frac{$1}{$2}');
  
  // Étape 2: S'assurer que les délimiteurs ont un espace autour pour être correctement reconnus
  processedContent = processedContent.replace(/(\S)\$\$/g, '$1 $$');
  processedContent = processedContent.replace(/\$\$(\S)/g, '$$ $1');
  processedContent = processedContent.replace(/(\S)\$/g, '$1 $');
  processedContent = processedContent.replace(/\$(\S)/g, '$ $1');
  
  // Éviter les doubles $$ adjacents qui peuvent se produire
  processedContent = processedContent.replace(/\$\$\s*\$\$/g, '$$');
  
  // Nettoyer les espaces superflus dans les délimiteurs
  processedContent = processedContent.replace(/\$ /g, '$');
  processedContent = processedContent.replace(/ \$/g, '$');
  processedContent = processedContent.replace(/\$\$ /g, '$$');
  processedContent = processedContent.replace(/ \$\$/g, '$$');
  
  return processedContent;
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
  
  // Corriger les problèmes de chevauchement comme $1$ où le chiffre 1 fait partie du délimiteur
  sanitized = sanitized.replace(/\$(\d+)\$/g, '$ $1 $');
  
  // Corriger les commandes LaTeX couramment mal écrites
  sanitized = sanitized.replace(/\\log_([0-9]+)/g, '\\log_{$1}');
  sanitized = sanitized.replace(/\\log\_([0-9]+)/g, '\\log_{$1}');
  sanitized = sanitized.replace(/\\log_([a-z])\(([^)]+)\)/g, '\\log_{$1}($2)');
  sanitized = sanitized.replace(/\\frac([a-zA-Z0-9])([a-zA-Z0-9])/g, '\\frac{$1}{$2}');
  
  // Gérer les cas spéciaux où du texte est accolé aux symboles mathématiques
  sanitized = sanitized.replace(/([a-zA-Z0-9])\$/g, '$1 $');
  sanitized = sanitized.replace(/\$([a-zA-Z0-9])/g, '$ $1');
  
  return sanitized;
}
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

  // Étape 1: Marquer les équations déjà correctement formatées pour les préserver
  const placeholders: {[key: string]: string} = {};
  let counter = 0;
  
  // Préserver les équations déjà formatées avec $$ ... $$
  let processedContent = content.replace(/\$\$([\s\S]*?)\$\$/g, (match) => {
    const placeholder = `__MATH_DISPLAY_${counter++}__`;
    placeholders[placeholder] = match;
    return placeholder;
  });
  
  // Préserver les équations déjà formatées avec $ ... $
  processedContent = processedContent.replace(/\$([^\$\n]+?)\$/g, (match) => {
    const placeholder = `__MATH_INLINE_${counter++}__`;
    placeholders[placeholder] = match;
    return placeholder;
  });
  
  // Étape 2: Convertir les notations alternatives
  // Convertir \[ ... \] en $$...$$
  processedContent = processedContent.replace(/\\\[([\s\S]*?)\\\]/g, '$$$$1$$');
  
  // Convertir \( ... \) en $...$
  processedContent = processedContent.replace(/\\\(([\s\S]*?)\\\)/g, '$$$1$');
  
  // Étape 3: Détecter et formater les équations non formatées
  // Formatage des équations de type "ax + b = c"
  processedContent = processedContent.replace(/([a-z])([a-z])\s*\+\s*([a-z])\s*=\s*([a-z])/g, '$$$1$2 + $3 = $4$$');
  
  // Formater les exemples numériques comme "2x + 5 = 11"
  processedContent = processedContent.replace(/(\d+)([a-z])\s*\+\s*(\d+)\s*=\s*(\d+)/g, '$$$$1$2 + $3 = $4$$');
  
  // Formater les variables isolées
  processedContent = processedContent.replace(/\b([a-z])\b/g, (match, p1) => {
    // Éviter de formatter les variables déjà formatées
    if (processedContent.match(new RegExp(`\\$${p1}\\$`)) || 
        processedContent.match(new RegExp(`\\$\\$.*${p1}.*\\$\\$`))) {
      return match;
    }
    // Mettre en forme la variable isolée
    return `$$${p1}$$`;
  });
  
  // Étape 4: Réinsérer les équations préservées
  Object.keys(placeholders).forEach(placeholder => {
    processedContent = processedContent.replace(placeholder, placeholders[placeholder]);
  });
  
  // Étape 5: Nettoyage final et ajustements
  // Éviter les doubles $$ adjacents qui peuvent se produire
  processedContent = processedContent.replace(/\$\$\s*\$\$/g, '$$');
  
  // Assurer que les équations ont des espaces autour pour être correctement reconnues
  processedContent = processedContent.replace(/(\S)\$\$/g, '$1 $$');
  processedContent = processedContent.replace(/\$\$(\S)/g, '$$ $1');
  processedContent = processedContent.replace(/(\S)\$/g, '$1 $');
  processedContent = processedContent.replace(/\$(\S)/g, '$ $1');
  
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
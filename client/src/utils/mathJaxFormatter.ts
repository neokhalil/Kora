/**
 * Utilitaire simplifié pour formater correctement les notations mathématiques
 */

/**
 * Formate les commandes LaTeX courantes qui pourraient être mal écrites
 */
export function formatMathContent(content: string): string {
  if (!content) return content;
  
  // Formatage minimal des commandes LaTeX
  let processedContent = content;
  
  // Convertir les environnements mathématiques alternatifs
  processedContent = processedContent.replace(/\\\[([\s\S]*?)\\\]/g, '$$$$1$$');
  processedContent = processedContent.replace(/\\\(([\s\S]*?)\\\)/g, '$$$1$');
  
  // Correction des commandes LaTeX communes
  processedContent = processedContent.replace(/\\log_([0-9]+)/g, '\\log_{$1}');
  processedContent = processedContent.replace(/\\frac([a-zA-Z0-9])([a-zA-Z0-9])/g, '\\frac{$1}{$2}');
  processedContent = processedContent.replace(/\\sqrt([a-zA-Z0-9])/g, '\\sqrt{$1}');
  
  return processedContent;
}

/**
 * Détecte si un texte contient des formules mathématiques
 */
export function containsMathFormulas(text: string): boolean {
  if (!text) return false;
  
  return text.includes('$');
}

/**
 * Nettoie les entrées mathématiques pour éviter les erreurs de rendu
 */
export function sanitizeMathInput(input: string): string {
  if (!input) return input;
  
  // Corrections minimales pour la syntaxe LaTeX
  return input
    // Espacement correct des délimiteurs
    .replace(/([^\s\\])\$/g, '$1 $')
    .replace(/\$([^\s\\])/g, '$ $1')
    // Correction pour fractions mal formatées
    .replace(/\\frac([a-zA-Z0-9])([a-zA-Z0-9])/g, '\\frac{$1}{$2}');
}
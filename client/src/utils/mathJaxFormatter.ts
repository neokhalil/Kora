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

  // Remplacer les notations problématiques \[ et \] par $$...$$, qui est plus largement compatible
  let formattedContent = content.replace(/\\\[([\s\S]*?)\\\]/g, '$$$$1$$');
  
  // Remplacer également les notations \( et \) pour les formules en ligne
  formattedContent = formattedContent.replace(/\\\(([\s\S]*?)\\\)/g, '$$$1$');
  
  // Traiter les commandes spéciales \log_base
  formattedContent = formattedContent.replace(/\\log_([a-zA-Z0-9]+)\(([^)]+)\)/g, '\\log_{$1}($2)');
  
  // Assurer que les équations linéaires comme ax + b = c sont correctement formatées
  // Rechercher les formules de type 'ax + b = c' et les encadrer avec $$ si ce n'est pas déjà fait
  const linearEquationRegex = /([a-z])([a-z])\s*\+\s*([a-z])\s*=\s*([a-z])/g;
  formattedContent = formattedContent.replace(linearEquationRegex, (match, p1, p2, p3, p4) => {
    // Ne pas encadrer si déjà entre $$ ou $
    if (formattedContent.includes(`$$${match}$$`) || formattedContent.includes(`$${match}$`)) {
      return match;
    }
    return `$${p1}${p2} + ${p3} = ${p4}$`;
  });
  
  // Ajouter des espaces entre les symboles $ et le texte pour éviter les problèmes de reconnaissance
  formattedContent = formattedContent.replace(/(\S)\$\$/g, '$1 $$');
  formattedContent = formattedContent.replace(/\$\$(\S)/g, '$$ $1');
  formattedContent = formattedContent.replace(/(\S)\$/g, '$1 $');
  formattedContent = formattedContent.replace(/\$(\S)/g, '$ $1');
  
  // Corriger la présentation des variables isolées
  formattedContent = formattedContent.replace(/([^$])([a-z])([^a-zA-Z0-9$])/g, '$1$$$2$$$3');
  
  // Assurer que les isolations de variables comme "Isoler x" sont correctement formatées
  formattedContent = formattedContent.replace(/([Ii]soler)\s+([a-z])(\s|\.)/g, '$1 $$$2$$$3');
  
  // Assurer que les formulations comme "variable x" sont correctement formatées
  formattedContent = formattedContent.replace(/variable\s+([a-z])(\s|\.)/g, 'variable $$$1$$$2');
  
  // Éviter le cas particulier où des numéros isolés (comme "1") apparaissent au lieu des équations
  formattedContent = formattedContent.replace(/\$\$(\d+)\$\$/g, '$$ $1 $$');
  formattedContent = formattedContent.replace(/\$(\d+)\$/g, '$ $1 $');
  
  // Correction pour les équations algebraiques avec opérateurs
  formattedContent = formattedContent.replace(/\$\$(.*?\+.*?)\$\$/g, '$$ $1 $$');
  formattedContent = formattedContent.replace(/\$\$(.*?\-.*?)\$\$/g, '$$ $1 $$');
  formattedContent = formattedContent.replace(/\$\$(.*?\=.*?)\$\$/g, '$$ $1 $$');
  
  // Corriger le cas spécial de $$$$ qui pourrait être créé accidentellement
  formattedContent = formattedContent.replace(/\${4}/g, '$$$$');
  
  // Correction spéciale pour le format $$1$$ (substitution incorrecte)
  formattedContent = formattedContent.replace(/\$\$1\$\$/g, '$$1$$');
  
  // Éviter d'ajouter \text{} autour des variables uniques et des opérateurs
  formattedContent = formattedContent.replace(/\$([a-z])\$/g, '$$$1$$');
  
  // Formatage spécial pour les exemples comme "2x + 5 = 11"
  formattedContent = formattedContent.replace(/(\d+)([a-z])\s*\+\s*(\d+)\s*=\s*(\d+)/g, (match) => {
    if (formattedContent.includes(`$$${match}$$`) || formattedContent.includes(`$${match}$`)) {
      return match;
    }
    return `$$${match}$$`;
  });
  
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
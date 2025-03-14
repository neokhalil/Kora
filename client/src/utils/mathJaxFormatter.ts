/**
 * Utilitaire pour formater correctement les notations mathématiques dans le texte
 * Implémentation robuste et complète pour tous types d'équations mathématiques
 */

/**
 * Formate correctement le contenu mathématique pour MathJax
 * Méthode fiable fonctionnant avec tous types d'équations
 */
export function formatMathContent(content: string): string {
  if (!content) return content;

  // Phase 1: Préparation - Isoler les blocs de code pour les protéger
  const codeBlocks: string[] = [];
  let codeProtectedContent = content.replace(/```[\s\S]*?```/g, (match) => {
    codeBlocks.push(match);
    return `__CODE_BLOCK_${codeBlocks.length - 1}__`;
  });
  
  // Phase 2: Normalisation des notations mathématiques
  // Convertir toutes les notations vers le standard MathJax
  let processedContent = codeProtectedContent;
  
  // Convertir les notations LaTeX alternatives en notation MathJax
  processedContent = processedContent.replace(/\\\[([\s\S]*?)\\\]/g, '$$$$1$$');
  processedContent = processedContent.replace(/\\\(([\s\S]*?)\\\)/g, '$$$1$');
  
  // Correction des commandes LaTeX mal formatées
  processedContent = processedContent.replace(/\\log_([0-9]+)/g, '\\log_{$1}');
  processedContent = processedContent.replace(/\\log\_([0-9]+)/g, '\\log_{$1}');
  processedContent = processedContent.replace(/\\frac([a-zA-Z0-9])([a-zA-Z0-9])/g, '\\frac{$1}{$2}');
  processedContent = processedContent.replace(/\\sqrt([a-zA-Z0-9])/g, '\\sqrt{$1}');
  
  // Phase 3: Traitement des sections de numéros avant les équations
  // Ce problème spécifique est à l'origine du rendu des "1" au lieu des équations
  
  // Problème 1: Ajouter un protection pour équations après les numéros d'étapes
  processedContent = processedContent.replace(/(\d+\.\s+[^:\n]*:)\s*\n\s*(\$|\$\$)/g, 
    (match, label, delimiter) => `${label}\n<span class="math-after-number">${delimiter}`);
  
  // Problème 2: Ajouter \displaystyle pour améliorer le rendu des équations en mode display
  processedContent = processedContent.replace(/\$\$(?!\s*\\displaystyle)/g, '$$\\displaystyle ');
  
  // Problème 3: Protéger les équations qui apparaissent seules sur une ligne
  // Ajouter des balises protectrices
  processedContent = processedContent.replace(/^(\s*)(\$|\$\$)(.+?)(\$|\$\$)(\s*)$/gm, 
    (match, spaceBefore, startDelim, content, endDelim, spaceAfter) => 
    `${spaceBefore}<span class="standalone-equation">${startDelim}${content}${endDelim}</span>${spaceAfter}`);
    
  // Phase 4: Espacement correct des délimiteurs pour éviter les problèmes d'analyse
  // Assurer des espaces autour des délimiteurs d'équation quand ils sont attachés à d'autres caractères
  processedContent = processedContent.replace(/([^\s\\])\$\$/g, '$1 $$');
  processedContent = processedContent.replace(/\$\$([^\s\\])/g, '$$ $1');
  processedContent = processedContent.replace(/([^\s\\])\$/g, '$1 $');
  processedContent = processedContent.replace(/\$([^\s\\])/g, '$ $1');
  
  // Éviter les doublons de délimiteurs
  processedContent = processedContent.replace(/\$\$\s*\$\$/g, '$$');
  
  // Phase 5: Nettoyer les espaces superflus dans les délimiteurs eux-mêmes
  processedContent = processedContent.replace(/\$ /g, '$').replace(/ \$/g, '$');
  processedContent = processedContent.replace(/\$\$ /g, '$$').replace(/ \$\$/g, '$$');
  
  // Phase 6: Renouveler les problèmes spécifiques pour les sections numérotées
  // Ceci est crucial pour éviter le problème des "1" qui apparaissent
  processedContent = processedContent.replace(/(\d+)\.\s+(.+?):\s*\n\s*1(?!\d)/g, 
    (match, num, title) => `${num}. ${title}:\n<span class="special-number">1</span>`);
  
  // Phase 7: Restauration des blocs de code
  processedContent = processedContent.replace(/__CODE_BLOCK_(\d+)__/g, (match, index) => {
    return codeBlocks[parseInt(index)];
  });
  
  return processedContent;
}

/**
 * Détecte si un texte contient des formules mathématiques
 * Méthode fiable pour tous types de notation
 */
export function containsMathFormulas(text: string): boolean {
  if (!text) return false;
  
  // Expressions régulières optimisées pour détecter différents types de notations mathématiques
  const patterns = [
    // Délimiteurs standards MathJax
    /(?<!\\\$)\$(?!\$)(.+?)(?<!\\\$)\$(?!\$)/,  // Format $...$ (inline)
    /\$\$(.+?)\$\$/,                            // Format $$...$$ (bloc)
    
    // Délimiteurs LaTeX alternatifs
    /\\\((.+?)\\\)/,                            // Format \(...\) (inline)
    /\\\[(.+?)\\\]/,                            // Format \[...\] (bloc)
    
    // Environnements LaTeX
    /\\begin\{([^}]+)\}([\s\S]*?)\\end\{\1\}/,  // Format \begin{env}...\end{env}
    
    // Commandes spécifiques aux mathématiques
    /\\(frac|sqrt|sum|int|prod|lim|infty|partial|nabla|mathbb|mathcal|overrightarrow)/
  ];
  
  return patterns.some(pattern => pattern.test(text));
}

/**
 * Nettoie les entrées mathématiques pour éviter les erreurs de rendu
 * Traitement robuste optimisé pour tous types d'équation
 */
export function sanitizeMathInput(input: string): string {
  if (!input) return input;
  
  let sanitized = input;
  
  // Étape 1: Résoudre les problèmes de syntaxe LaTeX courants
  
  // Corriger les commandes mathématiques mal formatées
  sanitized = sanitized.replace(/\\log_([0-9]+)/g, '\\log_{$1}');
  sanitized = sanitized.replace(/\\log\_([0-9]+)/g, '\\log_{$1}');
  sanitized = sanitized.replace(/\\log_([a-z])\(([^)]+)\)/g, '\\log_{$1}($2)');
  sanitized = sanitized.replace(/\\frac([a-zA-Z0-9])([a-zA-Z0-9])/g, '\\frac{$1}{$2}');
  sanitized = sanitized.replace(/\\sqrt([a-zA-Z0-9])/g, '\\sqrt{$1}');
  
  // Étape 2: Résoudre les problèmes spécifiques des délimiteurs
  
  // Corriger les problèmes de chevauchement où le chiffre 1 fait partie du délimiteur
  sanitized = sanitized.replace(/\$(\d+)\$/g, '$ $1 $');
  
  // Correction des problèmes de délimiteurs manquants ou mal fermés
  const openInline = (sanitized.match(/\$/g) || []).length;
  if (openInline % 2 !== 0) {
    // Trouver et corriger les délimiteurs mal fermés
    sanitized = sanitized.replace(/\$([^$\n]+?)(?=\n|$)/g, '$$$1$$');
  }
  
  const openBlock = (sanitized.match(/\$\$/g) || []).length;
  if (openBlock % 2 !== 0) {
    // Trouver et corriger les délimiteurs de bloc mal fermés
    sanitized = sanitized.replace(/\$\$([^$\n]+?)(?=\n|$)/g, '$$$$1$$$$');
  }
  
  // Étape 3: Améliorer le rendu des équations
  
  // Ajouter \displaystyle aux équations en bloc pour améliorer le rendu
  sanitized = sanitized.replace(/(\$\$)(?!\s*\\displaystyle)(.+?)(\$\$)/g, '$1\\displaystyle $2$3');
  
  // Gérer les cas spéciaux comme les chiffres isolés qui pourraient être confondus avec des équations
  sanitized = sanitized.replace(/^1\s*$/gm, '\\text{1}');
  
  // Gérer les cas spéciaux où du texte est accolé aux symboles mathématiques
  sanitized = sanitized.replace(/([a-zA-Z0-9])\$/g, '$1 $');
  sanitized = sanitized.replace(/\$([a-zA-Z0-9])/g, '$ $1');

  // Améliorer le rendu des équations qui suivent immédiatement un numéro de liste ou d'étape
  sanitized = sanitized.replace(/(\d+\.\s+.+?:)\s*\n\s*(\$|\$\$)/g, 
    (match, label, delim) => `${label}\n<span class="eqn-after-number">${delim}`);
  
  return sanitized;
}
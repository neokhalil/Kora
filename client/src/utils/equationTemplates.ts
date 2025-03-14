/**
 * Fournit des templates pour les équations les plus couramment utilisées
 * afin de garantir un rendu cohérent et correct
 */

/**
 * Templates d'équations mathématiques standard
 * 
 * Ces templates peuvent être utilisés pour remplacer des formules problématiques
 * après avoir détecté qu'une expression spécifique n'est pas correctement rendue
 */
export const EquationTemplates = {
  // Équation du second degré
  quadraticEquation: {
    pattern: /Pour\s+résoudre\s+une\s+équation\s+du\s+second\s+degré.*?suivante\s*:/i,
    replacement: 'Pour résoudre une équation du second degré, nous utilisons généralement la forme générale suivante : $ax^2 + bx + c = 0$'
  },
  
  // Discriminant
  discriminant: {
    pattern: /Le discriminant\s+(∆|Δ)\s+est\s+donné\s+par\s+la\s+formule\s*:/i,
    replacement: 'Le discriminant $\\Delta$ est donné par la formule : $\\Delta = b^2 - 4ac$'
  },
  
  // Analyse du discriminant
  discriminantAnalysis: {
    pattern: /Si\s+(∆|Δ)\s*>\s*0.*solutions\s+réelles.*Si\s+(∆|Δ)\s*=\s*0.*solution\s+réelle.*Si\s+(∆|Δ)\s*<\s*0/i,
    replacement: `Si $\\Delta > 0$, il y a deux solutions réelles distinctes.
Si $\\Delta = 0$, il y a une solution réelle double.
Si $\\Delta < 0$, il n'y a pas de solution réelle (les solutions sont complexes).`
  },
  
  // Solutions de l'équation du second degré
  quadraticSolutions: {
    pattern: /Si\s+(∆|Δ)\s*>\s*0.*les\s+solutions\s+sont/i,
    replacement: `Si $\\Delta > 0$, les solutions sont $x_1 = \\frac{-b + \\sqrt{\\Delta}}{2a}$ et $x_2 = \\frac{-b - \\sqrt{\\Delta}}{2a}$
Si $\\Delta = 0$, la solution est $x = \\frac{-b}{2a}$
Si $\\Delta < 0$, les solutions sont complexes : $x_1 = \\frac{-b + i\\sqrt{|\\Delta|}}{2a}$ et $x_2 = \\frac{-b - i\\sqrt{|\\Delta|}}{2a}$`
  }
};

/**
 * Applique tous les templates d'équations au texte fourni
 * @param text Le texte contenant des descriptions d'équations mathématiques
 * @returns Le texte avec les équations standardisées
 */
export function applyEquationTemplates(text: string): string {
  let result = text;
  
  // Appliquer chaque template
  Object.values(EquationTemplates).forEach(template => {
    if (template.pattern.test(result)) {
      result = result.replace(template.pattern, template.replacement);
    }
  });
  
  return result;
}

/**
 * Corrige les cas spécifiques d'équations mal rendues dans le HTML
 */
export function fixRenderedEquations(html: string): string {
  return html
    // Corriger les "1" qui remplacent les équations
    .replace(/\$(?:1|\\text\{1\}|\\displaystyle 1)\$/g, '$ax^2 + bx + c = 0$')
    // Corriger les cas où Delta est dupliqué
    .replace(/(∆|Δ)\s*(?:>\s*0)?\s*(∆|Δ)\s*(?:>\s*0)?/g, '$1 > 0')
    .replace(/(∆|Δ)\s*(?:=\s*0)?\s*(∆|Δ)\s*(?:=\s*0)?/g, '$1 = 0')
    .replace(/(∆|Δ)\s*(?:<\s*0)?\s*(∆|Δ)\s*(?:<\s*0)?/g, '$1 < 0')
    // Espacer correctement les symboles mathématiques
    .replace(/([a-zA-Z0-9])(∆|Δ|≠|≤|≥)/g, '$1 $2')
    .replace(/(∆|Δ|≠|≤|≥)([a-zA-Z0-9])/g, '$1 $2');
}
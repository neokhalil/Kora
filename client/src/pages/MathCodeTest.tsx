import React from 'react';
import ContentRenderer from '../components/ui/ContentRenderer';
import { Link } from 'wouter';

export default function MathCodeTest() {
  const testExamples = [
    {
      id: 'simple-equation',
      title: 'Équation simple',
      content: `Voici une équation simple en ligne $y = mx + b$ et une autre $E = mc^2$.`
    },
    {
      id: 'quadratic-formula',
      title: 'Formule quadratique',
      content: `La formule quadratique pour résoudre $ax^2 + bx + c = 0$ est:
      
$$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$$

Il y a trois cas à considérer:
1. Si $b^2 - 4ac > 0$, il y a deux solutions distinctes.
2. Si $b^2 - 4ac = 0$, il y a une solution double.
3. Si $b^2 - 4ac < 0$, il n'y a pas de solutions réelles.`
    },
    {
      id: 'fractions',
      title: 'Fractions',
      content: `Les fractions en mathématiques:
      
$$\\frac{a}{b} + \\frac{c}{d} = \\frac{ad + bc}{bd}$$

Parfois, on écrit aussi des fractions en ligne comme $\\frac{1}{2}$ ou avec des fractions imbriquées comme:

$$\\frac{1}{1 + \\frac{1}{x}}$$`
    },
    {
      id: 'matrices',
      title: 'Matrices',
      content: `Une matrice 2x2:
      
$$A = \\begin{pmatrix} 
a & b \\\\
c & d 
\\end{pmatrix}$$

Le déterminant est calculé comme:

$$\\det(A) = ad - bc$$`
    },
    {
      id: 'code-example',
      title: 'Exemple de code',
      content: `Voici un exemple de code Python pour résoudre l'équation quadratique:

\`\`\`python
import math

def solve_quadratic(a, b, c):
    # Calculer le discriminant
    delta = b**2 - 4*a*c
    
    if delta < 0:
        return "Pas de solutions réelles"
    elif delta == 0:
        x = -b / (2*a)
        return f"Une solution double: x = {x}"
    else:
        x1 = (-b + math.sqrt(delta)) / (2*a)
        x2 = (-b - math.sqrt(delta)) / (2*a)
        return f"Deux solutions: x1 = {x1} et x2 = {x2}"

# Exemple d'utilisation
print(solve_quadratic(1, -3, 2))  # x^2 - 3x + 2 = 0
\`\`\`

Et voici un exemple en JavaScript:

\`\`\`javascript
function solveQuadratic(a, b, c) {
  // Calculer le discriminant
  const delta = b*b - 4*a*c;
  
  if (delta < 0) {
    return "Pas de solutions réelles";
  } else if (delta === 0) {
    const x = -b / (2*a);
    return `Une solution double: x = ${x}`;
  } else {
    const x1 = (-b + Math.sqrt(delta)) / (2*a);
    const x2 = (-b - Math.sqrt(delta)) / (2*a);
    return `Deux solutions: x1 = ${x1} et x2 = ${x2}`;
  }
}

// Exemple d'utilisation
console.log(solveQuadratic(1, -3, 2));  // x^2 - 3x + 2 = 0
\`\`\`
`
    },
    {
      id: 'mixed-content',
      title: 'Contenu mixte',
      content: `# Résolution d'un problème d'optimisation

Pour trouver le maximum de la fonction $f(x) = -x^2 + 4x + 2$, on peut utiliser la dérivée.

$$f'(x) = -2x + 4$$

En résolvant $f'(x) = 0$:

$$-2x + 4 = 0$$
$$-2x = -4$$
$$x = 2$$

Pour vérifier qu'il s'agit bien d'un maximum, on calcule la dérivée seconde:

$$f''(x) = -2 < 0$$

Comme $f''(x) < 0$, le point critique $x = 2$ est bien un maximum.

Voici un code pour vérifier ce résultat:

\`\`\`python
def f(x):
    return -x**2 + 4*x + 2

def df(x):
    return -2*x + 4

# Trouver le point critique
x_critical = 2  # Solution de df(x) = 0

# Vérifier
print(f"Valeur de f({x_critical}) = {f(x_critical)}")
print(f"Valeur de f'({x_critical}) = {df(x_critical)}")
\`\`\`

Le résultat est $f(2) = 6$, ce qui confirme notre calcul.
`
    }
  ];

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Test de rendu mathématique et code</h1>
        <p className="mb-4">
          Cette page teste le rendu des équations mathématiques et des blocs de code.
        </p>
        <Link to="/" className="text-blue-500 hover:underline">
          Retour à l'accueil
        </Link>
      </div>

      <div className="space-y-12">
        {testExamples.map(example => (
          <div key={example.id} className="border rounded-lg p-6 bg-white shadow-sm">
            <h2 className="text-2xl font-semibold mb-4" id={example.id}>
              {example.title}
            </h2>
            <div className="mb-6 p-4 bg-gray-50 rounded border">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Texte source:</h3>
              <pre className="text-sm whitespace-pre-wrap break-words">{example.content}</pre>
            </div>
            <div className="p-4 border rounded">
              <h3 className="text-sm font-medium text-gray-500 mb-4">Résultat rendu:</h3>
              <ContentRenderer content={example.content} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
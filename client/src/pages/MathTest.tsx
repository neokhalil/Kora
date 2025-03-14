import React, { useState } from 'react';
import MathJaxRenderer from '../components/ui/MathJaxRenderer';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';

// Exemples de formules mathématiques
const EXAMPLES = [
  {
    id: 'quadratic',
    title: 'Équation du second degré',
    content: `Pour résoudre une équation du second degré, nous utilisons généralement la forme générale suivante :

$$ax^2 + bx + c = 0$$

où $a$, $b$, et $c$ sont des coefficients, et $a \\neq 0$. Voici les étapes générales pour résoudre une telle équation :

1. Calculer le discriminant :

Le discriminant $\\Delta$ est donné par la formule :

$$\\Delta = b^2 - 4ac$$

2. Analyser le discriminant :
- Si $\\Delta > 0$, il y a deux solutions réelles distinctes.
- Si $\\Delta = 0$, il y a une solution réelle double.
- Si $\\Delta < 0$, il n'y a pas de solution réelle (les solutions sont complexes).

3. Calculer les solutions :
- Si $\\Delta > 0$, les solutions sont $x_1 = \\frac{-b + \\sqrt{\\Delta}}{2a}$ et $x_2 = \\frac{-b - \\sqrt{\\Delta}}{2a}$
- Si $\\Delta = 0$, la solution est $x = \\frac{-b}{2a}$
- Si $\\Delta < 0$, les solutions sont $x_1 = \\frac{-b + i\\sqrt{|\\Delta|}}{2a}$ et $x_2 = \\frac{-b - i\\sqrt{|\\Delta|}}{2a}$

Exemple concret avec $2x^2 - 4x - 6 = 0$ :

Identifions les coefficients : $a = 2$, $b = -4$, et $c = -6$

Calculons le discriminant :
$$\\Delta = (-4)^2 - 4 \\cdot 2 \\cdot (-6) = 16 + 48 = 64$$

Comme $\\Delta > 0$, nous avons deux solutions réelles :
$$x_1 = \\frac{4 + \\sqrt{64}}{2 \\cdot 2} = \\frac{4 + 8}{4} = 3$$
$$x_2 = \\frac{4 - \\sqrt{64}}{2 \\cdot 2} = \\frac{4 - 8}{4} = -1$$

Les solutions sont donc $x = 3$ et $x = -1$.`
  },
  {
    id: 'derivative',
    title: 'Dérivées et limites',
    content: `# Calcul différentiel

La dérivée d'une fonction $f(x)$ est définie comme :

$$f'(x) = \\lim_{h \\to 0} \\frac{f(x+h) - f(x)}{h}$$

Voici quelques règles importantes de dérivation :

1. $(f + g)' = f' + g'$
2. $(f \\cdot g)' = f' \\cdot g + f \\cdot g'$ (règle du produit)
3. $(\\frac{f}{g})' = \\frac{f' \\cdot g - f \\cdot g'}{g^2}$ (règle du quotient)
4. $(f \\circ g)' = (f' \\circ g) \\cdot g'$ (règle de la chaîne)

Exemple de calcul de dérivée pour $f(x) = x^2 \\sin(x)$ :

Utilisons la règle du produit : $f'(x) = (x^2)' \\cdot \\sin(x) + x^2 \\cdot (\\sin(x))'$

$(x^2)' = 2x$ et $(\\sin(x))' = \\cos(x)$

Donc $f'(x) = 2x \\sin(x) + x^2 \\cos(x)$

Pour les limites, rappelons que :

$$\\lim_{x \\to 0} \\frac{\\sin(x)}{x} = 1$$

$$\\lim_{n \\to \\infty} (1 + \\frac{1}{n})^n = e$$`
  },
  {
    id: 'integrals',
    title: 'Intégrales',
    content: `# Calcul intégral

L'intégrale définie de $f(x)$ sur l'intervalle $[a, b]$ est notée :

$$\\int_a^b f(x) dx$$

Cette intégrale représente l'aire sous la courbe de $f(x)$ entre $a$ et $b$.

L'intégrale indéfinie (ou primitive) est notée :

$$\\int f(x) dx = F(x) + C$$

où $F'(x) = f(x)$ et $C$ est une constante.

Le théorème fondamental du calcul établit le lien entre dérivées et intégrales :

$$\\int_a^b f(x) dx = F(b) - F(a)$$

où $F$ est une primitive de $f$.

Quelques intégrales classiques :

1. $\\int x^n dx = \\frac{x^{n+1}}{n+1} + C$ pour $n \\neq -1$
2. $\\int \\frac{1}{x} dx = \\ln|x| + C$
3. $\\int e^x dx = e^x + C$
4. $\\int \\sin(x) dx = -\\cos(x) + C$
5. $\\int \\cos(x) dx = \\sin(x) + C$

Exemple : calculons $\\int_0^1 x^2 dx$

$\\int x^2 dx = \\frac{x^3}{3} + C$

Donc $\\int_0^1 x^2 dx = [\\frac{x^3}{3}]_0^1 = \\frac{1^3}{3} - \\frac{0^3}{3} = \\frac{1}{3}$`
  },
  {
    id: 'matrices',
    title: 'Matrices et déterminants',
    content: `# Algèbre linéaire

Une matrice $A$ de dimension $m \\times n$ est un tableau rectangulaire de nombres :

$$A = \\begin{pmatrix} 
a_{11} & a_{12} & \\cdots & a_{1n} \\\\
a_{21} & a_{22} & \\cdots & a_{2n} \\\\
\\vdots & \\vdots & \\ddots & \\vdots \\\\
a_{m1} & a_{m2} & \\cdots & a_{mn}
\\end{pmatrix}$$

Le déterminant d'une matrice carrée $A$ de dimension $n \\times n$ est noté $\\det(A)$ ou $|A|$.

Pour une matrice $2 \\times 2$ :

$$\\det\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix} = ad - bc$$

Pour une matrice $3 \\times 3$ :

$$\\det\\begin{pmatrix} 
a & b & c \\\\
d & e & f \\\\
g & h & i
\\end{pmatrix} = a(ei - fh) - b(di - fg) + c(dh - eg)$$

L'inverse d'une matrice $A$ est notée $A^{-1}$ et vérifie $A \\cdot A^{-1} = A^{-1} \\cdot A = I$ où $I$ est la matrice identité.

Pour une matrice $2 \\times 2$ :

$$\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}^{-1} = \\frac{1}{ad - bc} \\begin{pmatrix} d & -b \\\\ -c & a \\end{pmatrix}$$

L'application linéaire associée à une matrice $A$ transforme un vecteur $\\vec{x}$ en $A\\vec{x}$.`
  },
  {
    id: 'probabilities',
    title: 'Probabilités et statistiques',
    content: `# Probabilités et statistiques

Si $X$ est une variable aléatoire discrète avec une fonction de masse de probabilité $p(x)$, alors son espérance mathématique est :

$$E[X] = \\sum_x x \\cdot p(x)$$

La variance de $X$ est :

$$\\text{Var}(X) = E[(X - E[X])^2] = E[X^2] - (E[X])^2$$

Pour une variable aléatoire continue avec une fonction de densité de probabilité $f(x)$, l'espérance est :

$$E[X] = \\int_{-\\infty}^{\\infty} x \\cdot f(x) dx$$

La loi normale de moyenne $\\mu$ et d'écart-type $\\sigma$ a pour densité :

$$f(x) = \\frac{1}{\\sigma\\sqrt{2\\pi}} e^{-\\frac{1}{2}\\left(\\frac{x-\\mu}{\\sigma}\\right)^2}$$

Le théorème central limite énonce que la somme de variables aléatoires indépendantes et identiquement distribuées tend vers une loi normale quand le nombre de termes augmente.

Si $X_1, X_2, \\ldots, X_n$ sont des variables aléatoires indépendantes de même loi avec une espérance $\\mu$ et une variance $\\sigma^2$, alors :

$$\\frac{\\sum_{i=1}^n X_i - n\\mu}{\\sigma\\sqrt{n}} \\xrightarrow{d} \\mathcal{N}(0,1)$$

où $\\xrightarrow{d}$ désigne la convergence en distribution.`
  }
];

export default function MathTest() {
  const [selectedExample, setSelectedExample] = useState(EXAMPLES[0]);
  const [customInput, setCustomInput] = useState('');
  const [showCustom, setShowCustom] = useState(false);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Test du rendu de formules mathématiques</h1>
      
      <div className="flex flex-wrap gap-2 mb-6">
        {EXAMPLES.map(example => (
          <Button 
            key={example.id}
            variant={selectedExample.id === example.id ? "default" : "outline"}
            onClick={() => {
              setSelectedExample(example);
              setShowCustom(false);
            }}
          >
            {example.title}
          </Button>
        ))}
        <Button
          variant={showCustom ? "default" : "outline"}
          onClick={() => setShowCustom(true)}
        >
          Saisie personnalisée
        </Button>
      </div>
      
      {showCustom ? (
        <div className="mb-6 space-y-4">
          <h2 className="text-xl font-semibold">Saisir votre propre texte mathématique</h2>
          <p className="text-sm text-slate-600">
            Utilisez la syntaxe LaTeX : $ pour les formules en ligne et $$ pour les formules en bloc.
          </p>
          <Textarea 
            className="min-h-[200px] w-full font-mono"
            placeholder="Entrez votre texte avec des formules LaTeX ici..."
            value={customInput}
            onChange={e => setCustomInput(e.target.value)}
          />
        </div>
      ) : (
        <div className="mb-6">
          <h2 className="text-2xl font-semibold mb-2">{selectedExample.title}</h2>
          <div className="p-4 border rounded bg-slate-50">
            <pre className="whitespace-pre-wrap text-sm font-mono">{selectedExample.content}</pre>
          </div>
        </div>
      )}
      
      <div className="p-6 border rounded-lg shadow-lg bg-white">
        <h3 className="text-xl font-semibold mb-4">Rendu MathJax</h3>
        <div className="prose max-w-none">
          <MathJaxRenderer content={showCustom ? customInput : selectedExample.content} />
        </div>
      </div>
    </div>
  );
}
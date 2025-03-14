import React from 'react';
import ContentRenderer from '../components/ui/ContentRenderer';
import { Link } from 'wouter';

export default function MathCodeTest() {
  const testExamples = [
    {
      id: 'simple-equation',
      title: 'Équation simple',
      content: 'Voici une équation simple en ligne $y = mx + b$ et une autre $E = mc^2$.'
    },
    {
      id: 'quadratic-formula',
      title: 'Formule quadratique',
      content: 'La formule quadratique pour résoudre $ax^2 + bx + c = 0$ est:\n\n$$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$$'
    },
    {
      id: 'code-example',
      title: 'Exemple de code',
      content: 'Voici un exemple de code Python:\n\n```python\ndef hello_world():\n    print("Hello, world!")\n\nhello_world()\n```\n\nEt voici un exemple en JavaScript:\n\n```javascript\nfunction helloWorld() {\n  console.log("Hello, world!");\n}\n\nhelloWorld();\n```'
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
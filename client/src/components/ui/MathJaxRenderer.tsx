import React from 'react';
import { MathJaxContext, MathJax } from 'better-react-mathjax';

// Configuration de MathJax pour le rendu des formules mathématiques
const config = {
  loader: { load: ["[tex]/html"] },
  tex: {
    packages: { "[+]": ["html"] },
    inlineMath: [
      ["$", "$"],
      ["\\(", "\\)"]
    ],
    displayMath: [
      ["$$", "$$"],
      ["\\[", "\\]"]
    ]
  },
  startup: {
    typeset: false
  }
};

interface MathContentProps {
  content: string;
  className?: string;
}

/**
 * Composant pour rendre du contenu mathématique avec MathJax
 */
const MathJaxRenderer: React.FC<MathContentProps> = ({ content, className = '' }) => {
  return (
    <MathJaxContext config={config}>
      <div className={`math-content ${className}`}>
        <MathJax hideUntilTypeset="first" inline dynamic>
          {content}
        </MathJax>
      </div>
    </MathJaxContext>
  );
};

export default MathJaxRenderer;